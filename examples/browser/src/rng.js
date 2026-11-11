// Deterministic PRNG (mulberry32). Contract: every component takes `seed`,
// all randomness derives from it — same (t, seed) always renders identically.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ease-out with monotonic decreasing per-step increment (长安 ease-out 滚数证据):
// 逐帧增量单调递减,见 full-study/7693771749486813678 连续复核记录-2026-11-04
export function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
export function easeOutBack(x) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
