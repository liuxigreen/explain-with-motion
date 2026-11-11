# 研究字段

## 样本

sample_id，platform_video_id，canonical_url，title，creator，source_type（用户指定/话题候选），hashtag_evidence，observed_at，likes_raw，likes_precision，ranking_scope，ranking_method，duration，fps，resolution，access_status，local_path，coverage_intervals，missing_intervals。

未知字段留空并说明原因。每次点赞观察保留时间，避免把不同日期数字混作同一快照。

## 信息事件/镜头

event_id，sample_id，start/end_timestamp，frame_indexes（仅能实际读取时填写），coverage_type（连续逐帧/间隔采样/关键帧/封面），evidence_path，narrative_role，observable，interpretation，implementation_hypothesis，alternative_explanations，confidence。

observable包含：
- 观感：世界/主物/文字的画面占比与视觉重心、前中后景、透视收束、遮挡顺序、物件顶侧面和厚度、材质大中小尺度、主光与局部光及接触阴影。图形留白与满幅实体场景分开记录。
- 镜头与合成：景别、固定的屏幕元素、随世界运动的元素、相机运动证据与替代解释；转场的源/目标锚点、中间状态、层间交接顺序与近似覆盖范围。
- 时间与排版：动作准备/触发/反馈/余振/停留，文字类别与相对字级、行长、重点色、显隐顺序和阅读预算。未测量时不能把目测占比、字体名或缓动曲线当原片参数。
- 粒子：形状、密度、分布、轨迹、聚散、拖尾、生命周期和遮挡。
- 光影：亮度层级、方向、色温、辉光、阴影、照亮对象及时间变化。
- 动画：起止状态、位移/旋转/缩放/透明度、持续时间、速度变化、同步关系。
- 呈现：构图、图层关系、文字出现顺序、颜色编码、镜头运动。
- 叙事：问题、约束、模型、演示、反例、揭示、结论与画面的对应。

音轨未读取时不声称辨认配乐、音效卡点或配音方式。内容涉及历史/科学时另做事实核对，视觉说服力不代表事实正确。

## 技法卡

technique_id，name，communication_problem，when_to_use，when_to_avoid，supporting_event_ids，counterexamples，adaptation_recipe，tunable_parameters，verification_criteria，implementation_options，evidence_level。

制作另记 style_reference_ids、reference_pts、visual_invariants、adaptable_attributes、geometry/material/camera/light_spec、tool_dependencies、asset_paths、implementation_status、visual_gate、information_gate。状态区分已分析/已制定方案/已渲染/已通过视觉检查/已听审，不用一个“完成”涵盖不同阶段。

证据状态：直接观察、实现推测、单案例候选、跨案例支持、自己的版本已复现。各状态可并存，不能用一个“高置信”掩盖证据性质差别。
