"""Extract real decoded frames and retain source frame timestamps.

Requires ffmpeg and ffprobe on PATH. Output must be a new directory.
Example: python extract_frames.py video.mp4 new-output --start 10 --end 12
Default: inspect metadata and sample one frame at least every 5 seconds.
With --start/--end: extract every frame in the inclusive time interval.
"""
import argparse
import json
from pathlib import Path
import subprocess


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True,
                          encoding="utf-8", errors="replace").stdout


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("video", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--start", type=float)
    p.add_argument("--end", type=float)
    p.add_argument("--interval", type=float, default=5)
    a = p.parse_args()
    if not a.video.is_file():
        p.error("Video file does not exist")
    if (a.start is None) != (a.end is None):
        p.error("--start and --end must be supplied together")
    if a.start is not None and not (0 <= a.start <= a.end):
        p.error("Require 0 <= start <= end")
    if a.interval <= 0:
        p.error("--interval must be positive")
    if a.output.exists():
        p.error("Output already exists; choose a new directory")

    meta = json.loads(run(["ffprobe", "-v", "error", "-show_format",
                           "-show_streams", "-of", "json", str(a.video)]))
    raw = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                          "-show_frames", "-show_entries",
                          "frame=best_effort_timestamp_time,pkt_duration_time",
                          "-of", "json", str(a.video)]))["frames"]
    chosen = []
    next_time = None
    missing_timestamps = []
    for i, frame in enumerate(raw):
        if "best_effort_timestamp_time" not in frame:
            missing_timestamps.append(i)
            continue
        t = float(frame["best_effort_timestamp_time"])
        if a.start is not None:
            keep = a.start <= t <= a.end
        else:
            keep = next_time is None or t >= next_time
        if keep:
            chosen.append({"source_frame_index_zero_based": i,
                           "source_timestamp_seconds": t,
                           "file": f"frame-{len(chosen):06d}.png"})
            next_time = t + a.interval
    if not chosen:
        p.error("No frames available in requested interval")
    # Decode frames without resampling: source indexes identify actual frames.
    a.output.mkdir(parents=True)
    if a.start is not None:
        expression = f"between(n,{chosen[0]['source_frame_index_zero_based']},{chosen[-1]['source_frame_index_zero_based']})"
        # Omit any timestamp-less frames to keep mapping exact.
        excluded = [i for i in missing_timestamps if chosen[0]['source_frame_index_zero_based'] <= i <= chosen[-1]['source_frame_index_zero_based']]
        for i in excluded:
            expression += f"*not(eq(n,{i}))"
    else:
        expression = "+".join(f"eq(n,{f['source_frame_index_zero_based']})" for f in chosen)
    filter_file = a.output / "select-filter.txt"
    filter_file.write_text(f"select='{expression}'", encoding="utf-8")
    run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(a.video),
         "-map", "0:v:0", "-filter_script:v", str(filter_file),
         "-fps_mode", "vfr", "-start_number", "0",
         str(a.output / "frame-%06d.png")])
    actual = len(list(a.output.glob("frame-*.png")))
    if actual != len(chosen):
        raise RuntimeError(f"Frame count mismatch: expected {len(chosen)}, got {actual}")
    report = {"source": str(a.video.resolve()), "metadata": meta,
              "mode": "continuous_interval" if a.start is not None else "interval_samples",
              "requested_start": a.start, "requested_end": a.end,
              "missing_timestamp_frame_indexes": missing_timestamps,
              "frames": chosen}
    (a.output / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"frames": actual, "mode": report["mode"], "manifest": str(a.output / "manifest.json")}))


if __name__ == "__main__":
    main()
