# Explain with Motion

面向 Agent 的知识视频制作 skill。给出选题，先写正文和逐段问答，再做分镜、光影试片和完整渲染。

把整个仓库目录交给 Agent，从 [SKILL.md](SKILL.md) 开始。先用[文案五步法](references/copy-patterns.md)写稿，再按[制作流程](references/make-a-video.md)排镜头，最后从[技术解剖与制作卡](references/visual-techniques.md)选材质、光影、文字、动效和转场做法。

可以直接给 Agent 一句任务指令。比如「用 explain-with-motion 做一条 3 分钟无口播知识片，先写完整文案与分镜，再按参考画面渲染 10 秒样片供我看观感。」

## 参考视频图集

22 条参考原片各选 4 帧，附原片链接和时间点。选风格时，可先看构图、材质、光影和文字层次，再读相应的案例分析。[打开参考视频图集](references/reference-gallery.md)

## 运行样片

准备 Node.js、Chrome、FFmpeg 和中文字体。若 Chrome 位于自定义路径，设置环境变量 `CHROME` 为浏览器可执行文件的绝对路径。

```sh
cd examples/browser
npm ci
node tools/render-sequence.mjs night-clock --frames 2,3.25,4.8,9 --out out/check
node tools/render-sequence.mjs night-clock --start 0 --end 10 --fps 24 --mp4
node tools/render-sequence.mjs window-light --start 0 --end 14 --fps 24 --mp4
```

默认样片为 1280×720。成片与帧图写入 `examples/browser/out/`。雨巷漏壶展示冷暖光、湿石板、雨线、叠化和水位变化。暗室窗影展示实体窗格、动态投影和尘粒。

用 JavaScript 编写场景，Three.js 负责空间、材质和光影，Canvas 负责文字，Node.js 控制 Chrome 逐帧渲染，FFmpeg 合成 MP4。提帧和时间轴检查可用 `scripts/` 下的辅助工具。
