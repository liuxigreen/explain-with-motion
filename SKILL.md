---
name: explain-with-motion
description: 为文字驱动的知识短片或长片选题、写稿、分镜并用 Three.js、Canvas 和 FFmpeg 渲染。适用于科普、历史故事、生活哲学和参考片风格复用，可交付文案、光影样片或完整 MP4。
---

# 用运动解释知识

按用户要求交付选题、文案、样片或成片。涉及制作时，从文案的因果关系推导镜头，再用画面验证。已有时长、画幅、参考片、口播和声音要求直接沿用。

1. **写稿。** 先写观众的问题、一句准确答案、开头的具体处境和结尾的回收。用[文案五步法和 22 个案例](references/copy-patterns.md)选择写法。长片按小问答推进，每段交付新证据、例外或尺度变化。正文读通后再拆屏幕文字。
2. **编排。** 打开[原片图集](references/reference-gallery.md)中与题材匹配的画面。按[从选题到成片](references/make-a-video.md)给每个镜头写明要回答的问题、对象如何变化、哪一句由文字承担、如何衔接下一镜。一个镜头内可以有多次状态变化，转场按叙事需要安排。
3. **定观感。** 从[技术解剖与制作卡](references/visual-techniques.md)选适用技法。先确定主体占幅、物件体量、前中后景、表面纹理和受光，再调标签、粒子和后期。写清这一片的亮暗层级、主色与强调色、文字落点，以及跨镜保留的物件。示意图解和实体场景各自按目标风格验收。
4. **渲染。** 用 Three.js 处理立体空间、材质、灯光和投影，用 Canvas/SVG 处理平面图解与文字，必要时用 WebGL 合成。Node.js 驱动 Chrome 逐帧调用 `renderAt(t)`，FFmpeg 编码与混音。[运行命令](README.md)和[场景接口](references/rendering-tools.md)均随包提供。可先读[样例与共用做法](references/shared-components.md)。
5. **看片。** 先渲染首屏、主动作和结果，检查构图、材质、光影、可读性及动作因果。用户要求先试 10 秒时，从正片中取一段能验证核心观感和叙事的片段。出片后核对时间轴、画幅、文字停留、声音要求和可播放性。无口播的内容先静音检查，确认文字和画面合起来能讲清因果。按任务交付 MP4、源码和复现命令。

## 按需查看

- **古代场景或地图旅程**读[古代故事规格](references/ancient-story-style.md)与[连续转场证据](references/transition-evidence.md)。
- **人物、节奏与场景调度**读[导演方法](references/directing-method.md)与[制作规格](references/production-blueprint.md)。
- **交付可复建工程**读[制作执行流程](references/production-workflow.md)与[项目清单格式](references/project-contract.md)。
- **参考片拆解**读[证据规范](references/evidence-schema.md)和[全片机制研究标准](references/full-study-standard.md)。提帧用 `python scripts/extract_frames.py 视频路径 输出目录`，局部连续帧加 `--start 秒 --end 秒`。记录源 PTS、抽样范围、画面实证和实现推断。拆原片文字另读[长文案拆解](references/script-structure.md)。
- **配乐和声音**读[音轨流程](references/audio-workflow.md)，用实际听辨核对语音、音效和同步。
