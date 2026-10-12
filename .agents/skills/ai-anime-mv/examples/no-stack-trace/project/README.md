# No Stack Trace for a Heart — MV 工程

用 Remotion（React）把歌曲、双语字幕、AI 生成的图片和代码动效合成为 1920×1080、30fps 的 MV。

## 常用命令

```bash
npm run studio                 # 浏览器实时预览，可以拖动时间轴
npm run render                 # 出片 → out/mv.mp4
npx remotion render src/index.ts MV out/preview.mp4 --scale=0.5   # 半分辨率快速预览
```

渲染时调用系统的 Google Chrome，配置在 `remotion.config.ts`，因为 Remotion 自带的浏览器在这台机器上会崩溃。渲染需要在命令沙箱外执行。

## 改哪里

| 想改的内容 | 文件 |
|---|---|
| 字幕文字或时间 | `src/data/lyrics.json`（`start`/`end` 单位为秒，`en` 在上、`zh` 在下，`singer: "f"` 显示为橙色女声） |
| 片头和片尾的对白字幕 | `src/MV.tsx` 里的 `EXTRA` |
| 每个镜头的起止时间 | `src/MV.tsx` 里的 `SHOTS` |
| 各段的背景（夜景、网格、黎明） | `src/MV.tsx` 里的 `BGS` |
| 单个镜头的画面 | `src/scenes/*.tsx` |
| 配色和字体 | `src/theme.ts` |

## 素材

- `public/audio/song.wav`：从 Suno 导出的 m4a 解码而来。
- `public/characters/`：设定图抠图，包括 Claude 和二次元男主各三个视角；`user_photo_*` 是男主写实版，留作备用。
- `public/images/raw/`：即梦生成的原图。
- `public/images/cut/`：角色姿势的抠图。
- `public/images/bg/`：裁边后的背景图。

## 重新生成 AI 图

```bash
python3 tools/gen_images.py submit   # 按脚本里的 JOBS_DEF 提交，已提交过的会跳过
python3 tools/gen_images.py fetch    # 轮询并下载到 public/images/raw/
```

要重画某一张，先删掉 `tools/jobs.json` 里对应的条目，再重新 submit。

其他工具都在 `tools/` 里，基于 macOS 自带框架，用 `swift <脚本> <参数>` 直接运行：

- `cutout_pose.swift <in.png> <out.png>`：单张姿势图抠图（Vision 框架）
- `cutout_sheet.swift <in.png> <outdir> <prefix>`：三视图拆成三张抠图
- `m4a_to_wav.swift <in.m4a> <out.wav>`：音频解码
- `extract_lyrics_track.swift <in.m4a>`：提取 Suno 导出文件里内嵌的逐句时间轴

## 发布

成片不带 AI 标识。发布到抖音、视频号、B 站等平台时，请勾选平台的“AI 生成内容”声明。
