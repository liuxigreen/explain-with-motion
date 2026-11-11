# 浏览器渲染

安装与运行命令见 [README](../README.md)。场景模块放在 `examples/browser/src/scenes/`。导出 `buildScene(ctx)`，从传入的 Three.js 场景、相机、渲染器和画幅建立镜头。返回 `renderAt(t)`，其中 `t` 以秒计。用时间和固定种子计算所有位置、材质参数、字幕和事件状态，同一帧可以独立渲染。

Three.js 绘制几何、材质和遮挡，Canvas 绘制字幕与信息图。场景叠化可以分别渲染两个场景再混合。先用 `--frames` 检查关键帧，确认光影、字形和构图，再用 `--start`、`--end`、`--fps` 和 `--mp4` 导出。浏览器入口输出无音轨 MP4。需要音乐或音效时按[音轨流程](audio-workflow.md)另做混音和复核。
