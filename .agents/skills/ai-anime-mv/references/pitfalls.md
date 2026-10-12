# 踩坑记录（出问题先查这里）

| 现象 | 原因 | 解法 |
|---|---|---|
| Remotion 渲染报 `Target closed`，日志里有 `icudtl.dat not found` | 自带的 chrome-headless-shell 在这台 Mac 上起不来 | `remotion.config.ts` 里设置 `Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')`，模板里已经配好 |
| 渲染卡住，或报 GPU process exited | 在命令沙箱里运行 | 渲染和 dreamina 网络调用都放到沙箱外执行，先征得用户同意 |
| 后台渲染报 `npm error could not determine executable to run` | 后台 shell 里 `npx` 解析失败 | 用 `./node_modules/.bin/remotion` |
| 渲染报 `inputRange must be strictly monotonically increasing` | 传给 interpolate 的区间里有两个相同的值（比如淡入时长为 0） | 淡入淡出用 `Math.min(f/in, (d-f)/out)` 这种写法，并单独处理 0 的情况 |
| dreamina 返回 `current account is not allowed to use dreamina_cli`，额度显示为 0 | 当前账号没有 CLI 权限 | 让用户执行 `! dreamina relogin`，换一个有权限的账号 |
| 即梦任务记录丢失 | 旧版下载脚本把任务表缓存在内存里，写回时覆盖了新提交的任务 | `dreamina_jobs.py` 每轮都重新读取任务表；万一丢了，提交时打印的 submit_id 都在输出里，可以据此补回 |
| 素材左上角有"AI生成"角标 | 平台默认加水印 | 请用户在即梦里关掉水印，然后执行 `redownload`。**用带角标的图做首帧生成的视频，角标会烧进画面**，必须 `reset` 后重新生成；首帧图也要用无水印的版本 |
| 字幕整体偏早或偏晚，第一句偏差好几秒 | Suno 的 tx3g 时间轴只是粗略对齐，第一句常被标在 0.4 秒；按能量判断起唱点也会被伴奏误导 | 用 Demucs 分离人声，再用 Whisper 逐词识别，最后跑 `align_lyrics.py`。重复的副歌句靠"就近匹配"区分 |
| faster-whisper 报 `av.open() got an unexpected keyword` | PyAV 版本不兼容 | 脚本里改用 soundfile 加 scipy 自己读取音频，转成 16kHz 单声道后再传给模型（已处理） |
| `ndarray has no attribute ptp` | NumPy 2 移除了这个方法 | 改用 `np.ptp(x)` |
| zsh 报 `no matches found: p3_*` | 通配符没有匹配到文件时 zsh 会直接报错 | 改用 `find . -name 'p3_*' -delete`，或者先确认文件存在 |
| **成片画面一直在抖** | 随节拍的全局缩放、人物点头、闪白，每秒两次，静帧检查看不出来 | 不要做随节拍的运动。节奏靠卡点剪辑，运动只保留缓慢的推镜和漂移 |
| 推近镜头把头顶切掉 | 放大倍数太大，或者为了去水印做了裁边 | 推近倍数不超过约 1.15，焦点放在偏上的位置（y 约 0.2）；水印问题从源头解决，不要靠裁边 |
| 大字或印章挡住脸 | 位置写死在画面上方 | 对口型镜头的大字放在 top 约 660；印章放到画面空白的一侧 |
| 片尾标题没有显示 | 组件里的时间按绝对帧数写死，镜头比设计的短 | 按镜头时长 d 倒推出现时间，比如 `ease(f, d-100, d-70)` |
| Apple Vision 识别不出二次元人脸 | 人脸检测模型是用真人脸训练的 | 不依赖人脸检测。v4 改用即梦对口型以后，已经不需要检测嘴的位置了 |
| 本地口型切换（嘴型图加音量包络）效果呆板 | 只有三档嘴型，没有表情 | 默认用即梦 `lipsync`。只有在无法使用即梦时，才退回本地方案（见 `examples/no-stack-trace/project/tools/build_rig.py`、`mouth_env.py` 和 `project/src/components/LipShot.tsx`） |
| AVFoundation 的 720p 预设导出后文件反而更大 | `AVAssetExportPreset1280x720` 只缩小分辨率，不降低码率 | 用 `scripts/export_small.swift`，它用 AVAssetWriter 指定分辨率和码率 |
| zsh 里 `$T` 装了多个参数却只被当成一个传入 | zsh 不会自动按空格拆分变量 | 写成 `${=T}`，或者改用数组 |
| 镜头过渡时出现两份重影，看起来很乱 | glitch 转场叠加在两个内容接近的镜头上 | 想要"碎裂感"的切换用 `cut`，glitch 留给内容差异大的镜头之间 |

## 额度参考（Dreamina，maestro 会员）

| 内容 | 消耗 |
|---|---|
| 图片（text2image、image2image） | 基本不扣额度 |
| image2video，1080p，5 秒 | 约 165 |
| lipsync，1080p，4 秒 | 约 132（按时长计费） |
| 一支 3.5 分钟的 MV（约 20 段动作视频 + 17 段对口型） | 约 6000 到 7000 |
