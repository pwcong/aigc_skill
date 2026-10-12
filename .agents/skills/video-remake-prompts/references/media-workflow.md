# 媒体分析与切割

## 执行条件

先遵守 SKILL.md 的执行前选择：用户未明确是否分割时，只做文件定位或基本媒体信息准备，不开展详细抽帧分析、分段计划或实际剪切。确认后，两种模式都可读取和分析原片；以下所有 `cut`、分段导出及逐段 MP4 复核步骤仅适用于 `processing_mode: split`。whole 模式使用原视频并分析其内部镜头，不创建参考短片，导出状态记为 `not_required`。

## 工具选择与缓存

先检查当前环境可用的媒体工具。优先使用 FFmpeg/FFprobe；macOS 没有这两个工具但有 Swift 时，使用本 skill 的 `scripts/media.swift`。它只依赖系统 AVFoundation、AppKit 与 CoreImage，不需要下载视频服务或上传原片。其他平台无可用工具时，先利用已有预览能力完成可见内容分析，并明确尚未完成的精确切割；不要伪造时长或导出结果。

记录源文件实际路径、大小、修改时间及 SHA-256。文件变更后重新 probe 与核对切点；旧的时间线、接触表及参考片段不可直接视为新源的证据。不要写死当前工作目录或机器用户名。

分析要分两轮：
1. 稀疏采样与连续观看，标注人物、场景、候选镜头、关键动作和疑点。
2. 对动作密集处加密到数帧间隔，对候选切镜查看相邻帧；确认快速机位变化是否连续。短暂闪光、飞散物起始、接触和失衡动作不能只凭每半秒一张的图判断。

缩略图用于导航；涉及脸、手、脚、道具及特效时查看足够大的原帧。接触表标注全局时间和帧号，避免把多格图当成视频里的分屏。看到前后两种姿势不等于知道中间轨迹，证据不足要回到连续画面或逐帧。

## FFmpeg / FFprobe 可用时

读取媒体参数和真实帧时间，不仅看容器总时长：

```sh
ffprobe -v error -show_format -show_streams -of json "$SOURCE"
ffprobe -v error -select_streams v:0 -show_frames \
  -show_entries frame=best_effort_timestamp,best_effort_timestamp_time,duration,pkt_duration_time \
  -of json "$SOURCE"
```

从显示顺序时间戳建立帧时间线，记录 time_base、旋转信息、画面末帧终点、音轨终点和名义/平均帧率。nominal 或 average fps 不是恒帧的证明。

抽取边界前后帧时使用顺序解码或按已核实帧号选择，不以快速 seek 返回的首帧代替精确边界。CFR 可以用准确帧号；VFR 仍需保留对应 PTS。

导出规则：
- 对需要精确边界的参考片段，使用 trim/atrim 与重新编码，重置输出时间戳，并保持原显示方向和原速。
- `-ss … -c copy` 受关键帧限制，不应据此宣称切点精确。
- 不使用 `-r 30` 等固定帧率覆盖原片时序。适合原媒体时采用 passthrough 时间处理；重编码后的帧数、时间戳及首尾画面需要复核。
- 原视频有音轨时可随片段保留；不主动配音、替换音乐或拼装成片。用户明确要求静音参考片段时再移除音轨。
- 选择适合源编码、分辨率与设备的编码设置；是否导出成功与是否精确对齐分开验证。

## macOS 内置工具

将 `SKILL_DIR` 设为本 skill 的真实目录，将 `SOURCE` 设为待处理视频绝对路径。以下参数都是路径或从原片核对出的帧号，不通过 shell 拼接用户自由文本。Swift 的系统弃用警告可以用 `-suppress-warnings` 隐藏，运行错误仍应检查。

### 读取参数

```sh
swift -suppress-warnings "$SKILL_DIR/scripts/media.swift" probe "$SOURCE"
```

JSON 主要字段：
- `frameCount`：顺序解码得到的实际帧数。
- `codedWidth/Height`、`displayWidth/Height`、`preferredTransform`：编码尺寸与实际显示方向。
- `videoStart`、`videoEndExclusive`：含 seconds、value、timescale 的有理数时间。
- `videoDurationSeconds` 与 `assetDurationSeconds`：画面与容器时长，可能不同。
- `nominalFPS`、`minFrameIntervalSeconds`、`maxFrameIntervalSeconds`、`variableFrameTiming`：帧时序观察值；最后一项是间隔差异提示，不是完整制式鉴定。
- `audioTracks`：各音轨的起点与时长。

### 保存精确帧时间线

```sh
swift -suppress-warnings "$SKILL_DIR/scripts/media.swift" timeline "$SOURCE" > "$TIMELINE_JSON"
```

每帧有 index、pts、endExclusive、durationSeconds。保存到临时或任务分析目录，用于所有片段，不反复扫描来计算同一个切点。

帧区间采用 `[FIRST, LIMIT)`：
- 起点是 FIRST 帧的实际 PTS。
- 终点是 LIMIT 帧的 PTS；LIMIT 等于总帧数时使用实际画面末端。
- 计划 tick 时间基应无损容纳原始 PTS。不能用 nominalFPS 算出的秒数代替实际 PTS，末帧可能有单独的持续时间。
- 分段计划中的局部时间 = 全局时间 − 本段起点。

### 精确抽帧

```sh
swift -suppress-warnings "$SKILL_DIR/scripts/media.swift" frames "$SOURCE" "$FRAME_DIR" "$FRAME_INDICES"
```

FRAME_INDICES 例如 `52,53,81,82`，只是调用示例，实际按候选切点选择。从 0 开始，工具按顺序解码的索引取帧、应用显示方向，输出 JPEG 和真实 PTS。已有同名图会报错，使用新的分析目录或检查后再处理旧结果。超界请求会失败；有效的其他请求可能已写出，应阅读错误而不是直接重试同目录。

不要用 `CMTime(frame/fps)` 的 seek 结果假定取到了该帧：时间舍入可能返回前一帧。已有 AVAssetImageGenerator 工作流必须检查 actualTime；本工具的顺序解码避免这类猜测。

### 导出一个参考片段

提前创建输出目录：

```sh
swift -suppress-warnings "$SKILL_DIR/scripts/media.swift" cut "$SOURCE" "$OUTPUT_MP4" "$FIRST" "$LIMIT"
```

该命令支持单视频轨源，依据实际 PTS 导出，保留源片段原速及可用音轨，拒绝覆盖现有输出；之后重新解码输出并返回帧数、时长、逐帧相对 PTS 误差及 `verified`。只有帧数、时长与逐帧时序检查通过才以成功状态退出，时间容差为 0.0001 秒。

系统导出器对某些媒体可能改动帧时序，工具此时保留结果供检查并报错。不要仅因 MP4 存在就交付；分析差异并改用适合该源的精确导出方式。工具的 `verified` 检查帧数、时长与逐帧时序，还需核对首尾画面、显示方向及有无意外空白。

每次命令会顺序解码整条视频，适合短视频复刻；长视频宜用批量解码或可用的 FFmpeg 减少反复扫描。不要为便利而强制用户安装新依赖。

## 按分段计划导出全部参考视频

用户已确认 split 模式后，逐段执行实际剪切，不能在生成时间表或给出上述命令后停止。用户未确认或已选择 whole 时，不执行本节。读取分段计划中的源文件和精确边界，对每个生成片段导出一个同编号 MP4。使用 `media.swift cut` 时，若计划只有 PTS，先在已解码时间线中找到对应边界的准确帧号，不用平均帧率反推或四舍五入。

正式输出写入当前项目的 `分镜参考视频/`，让用户可以直接上传。每段保留原片人物、背景、动作、内部剪辑及可用音轨，画面长度取原片区间；生成平台的整数时长只用于后续生成设置，不用于给参考片段加尾帧。新角色或场景图片尚缺失时，也照常导出。

每段完成后记录实际路径、精确源区间和核验结果，写入分段计划及 `视频与提示词对照.md`。现有文件只有在确认来自同一源版本、区间一致且媒体检查通过后才能复用。失败片段记录为未完成并处理错误，不因其他片段成功就宣称全部完成。

## 输出复核

以下是 split 模式的导出复核。whole 模式只需核验原视频可读取、镜头时间覆盖整片且提示词引用正确，不要求新导出 MP4。

1. 从 source 的真实时间线检验所有目标片段相邻相接，首尾覆盖预定范围。
2. 对每个已导出文件检查实际视频帧数、时间戳、时长、画幅、方向及音轨状态。
3. 比较片段首帧、末帧和源片对应帧；重编码可以导致像素变化，不能用文件哈希相等作为画面相同的条件。
4. 记录误差与原因。音频尾部比画面多几毫秒不等于缺视频帧，不为消除显示小数差异擅自加帧。
5. 按生成片段逐一核对编号和 MP4 数量，检查与提示词的对应关系及所有文件链接。只有检验完成的文件写入最终“已导出”清单；对缺失或未通过的片段明确标注。
