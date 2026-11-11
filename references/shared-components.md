# 场景与可复用做法

- [雨巷漏壶](../examples/browser/src/scenes/night-clock.js)演示表面纹理、雨线、人物剪影、冷暖叠化和水位联动。换题时先用同一坐标关系连接器具与文字指示，再调整造型、尺度和相机。
- [暗室窗影](../examples/browser/src/scenes/window-light.js)演示真实遮挡、投影大小随光源位置变化和尘粒。复用灯光与遮挡关系时，以首帧和动作结果帧核对投影。
- [种子随机数](../examples/browser/src/rng.js)可用于程序纹理和粒子。将同一对象的状态集中在时间函数内，方便单帧复现。
