---
name: ai-anime-mv
description: 从一个故事想法出发，端到端制作二次元风格的 AI 音乐 MV：原创中英双语歌词 → Suno 提示词 → 人声分离与逐词对齐 → 即梦（Dreamina CLI）生成人景合一关键帧、动作视频、对口型视频 → Remotion 代码合成（双语字幕、卡点转场、动效排版）→ 1080p 成片。只要用户想做 MV、音乐视频、AI 歌曲配画面、"给这首歌做个视频"、对口型视频、动漫风短片，或给出一个故事/情绪想让它变成一支有歌有画面的成片，都使用此 skill，即使没明确提到 Suno、即梦或 Remotion。
---

# AI 二次元 MV 制作流程

这个流程把一个想法变成一支 3 分钟左右的 MV。分工是：
- **歌**：Suno（用户手动生成）。
- **画面**：即梦，包括图、动作视频、对口型视频。
- **代码**：Remotion，负责剪辑、字幕和动效。
- **本地分析**：Demucs 分离人声、Whisper 逐词对齐、librosa 检测节拍。

参考成片放在 skill 内的 `examples/no-stack-trace/`：
- `mv_v4_360p.mp4`：成片。
- `storyboard.jpg`：逐镜头抽帧。
- `project/src/MV3.tsx`：完整时间线。
- `project/src/scenes/`：全部动效镜头。
- `jobs.json`：全部即梦任务和提示词。

遇到不确定的实现，先看那里的 `README.md` 和现成代码，能复用就复用。

**原创边界**
- 歌词、角色、画面都必须是原创。
- 参考已有作品时只借鉴风格，不搬运具体内容：节奏、转场手法、画风可以借鉴，别人的歌词、角色设计、具体画面不可以。
- 用户要求"做成某个知名角色"时，改为设计一个气质相近的原创角色，并说明原因。

## 什么时候停下来问用户

整条流程尽量自动推进，**只在下面四处停下来**：
1. **歌词确认**：歌词定稿前给用户看中英对照版。
2. **歌曲生成**：Suno 没有 CLI，需要用户去生成并把音频文件放进项目目录。
3. **角色设定**：没有角色设定图时，先用即梦生成三视图（正面、侧面、背面，白底），让用户确认后再批量出图。
4. **成片验收**：交付成片和抽帧预览，等用户反馈后再迭代。

另外，开工时一次性确认这几项：画幅（16:9 还是 9:16）、画风（默认统一二次元）、即梦额度预算、字幕语言（默认上英下中）、成片是否需要"AI 生成"标识（默认不加，提醒用户在发布平台勾选 AI 声明）。

## 阶段 0：环境

```bash
SK=<本 skill 的目录>   # 用加载 skill 时给出的实际路径；在 aigc_skill 仓库里是 .agents/skills/ai-anime-mv（.claude/skills/ 是指向它的软链接）
bash $SK/scripts/setup_env.sh            # 首次运行：建 audioenv（librosa）和 mlenv（demucs、faster-whisper）
bash $SK/scripts/new_project.sh <项目目录>/mv   # 拷贝 Remotion 模板并执行 npm install
dreamina user_credit                       # 确认已登录且有额度；account not allowed 时让用户执行 `! dreamina relogin`
```

- **沙箱**：渲染（Chrome）和 dreamina 网络调用需要在沙箱外执行，第一次用到时向用户说明并征得同意。
- **剪辑**：本机没有 ffmpeg 也没关系，音视频读取和剪辑全部用 AVFoundation 的 swift 脚本加 Remotion 自带的工具完成。

## 阶段 1：歌词与 Suno 提示词

1. **先定故事线**：用一句话写出冲突和结尾，再按 Intro / Verse / Pre-Chorus / Chorus / Verse2 / Bridge / Final Chorus / Outro 写英文歌词。
   - 每句歌词都要能"拍成画面"。行业梗、具体物件、时间点（比如 11:40 → 11:41）最好拍。
   - 副歌要有一句可以做成大字的钩子。
   - 需要对唱时，用括号标出另一个角色的台词。
2. **交给用户确认的文件**：`lyrics.md`（中英逐行对照）和 `lyrics_en.txt`。
3. **生成 `suno_prompt.txt`**，提示词模板见 `references/prompts.md`。要点：
   - 不该唱出来的终端台词、旁白，从歌词框里删掉。
   - 容易念错的写成读音，比如 `Claude dot M-D`、`eleven-forty`。
   - 给每段加 `[Male Vocal]` / `[Female Vocal, Soft]` 这类标签。
4. **请用户去 Suno 生成**，把音频（m4a、mp3、wav 都可以）放进项目目录。

## 阶段 2：音频分析与字幕时间轴

Suno 自带的时间轴只是粗略对齐，**一定要用人声轨重新对齐**。上一个项目里，第一句的实际起唱时间比 Suno 标的晚了 8 秒。

```bash
A=~/.cache/ai-anime-mv/audioenv/bin/python; M=~/.cache/ai-anime-mv/mlenv/bin/python
swift $SK/scripts/m4a_to_wav.swift song.m4a public/audio/song.wav
swift $SK/scripts/extract_lyrics_track.swift song.m4a > src/data/suno_timing.tsv   # Suno 导出的 m4a 自带 tx3g 字幕轨；没有就跳过
$A $SK/scripts/analyze_audio.py public/audio/song.wav src/data/audio_analysis.json  # BPM、拍点、能量曲线
$M -m demucs -n htdemucs --two-stems=vocals -d mps -o /tmp/sep public/audio/song.wav && cp /tmp/sep/htdemucs/song/vocals.wav public/audio/vocals.wav
$M $SK/scripts/transcribe_words.py public/audio/vocals.wav src/data/words.json "专有名词, 行话"
python3 $SK/scripts/make_lyrics_json.py lyrics_bilingual.txt src/data/lyrics.json --suno src/data/suno_timing.tsv
python3 $SK/scripts/align_lyrics.py src/data/lyrics.json src/data/words.json         # 输出新旧时间对比，偏差大的行后面会标 <<
```

- **歌词文本格式**：`lyrics_bilingual.txt` 每行写成 `m | English | 中文`，段落用 `[verse1]` 这样的标记。
- **对齐后的检查**：
  - 重复的副歌句会不会被配到后面那次出现的位置上（脚本已经做了"就近匹配"）。
  - 女声或对唱句有没有对上。
  - 最后一句的结束时间是否合理。
- **段落划分**：用能量曲线确认（主歌约 0.45，副歌约 0.75 以上，桥段末尾通常是全曲最低谷）。

## 阶段 3：分镜表

写进 `docs/plan.md`：一句歌词一行，标注时间、画面、镜头类型。**剪辑点放在对齐后的句首**（句首基本都落在强拍上），副歌每两小节切一次。

镜头类型有三种，混着用，节奏会更丰富：

| 类型 | 用途 | 做法 |
|---|---|---|
| `lip` 对口型 | 角色唱这一句 | 关键帧 + 那句的人声片段 → 即梦 `lipsync` |
| `vid` 动作 | 走路、转身、魔法特效、人和场景互动 | 关键帧 → 即梦 `image2video` |
| `code` 动效排版 | 终端、聊天、报错、时间戳等故事梗 | Remotion 组件，垫在段落的动态背景视频上面 |

经验比例：每段 2 到 4 个 `lip`，副歌里 `lip` 和 `code` 交替；`vid` 用在叙事转折和情绪高点。同一张关键帧可以配不同音频生成多段对口型视频，构图上用不同的推近倍数和焦点区分。

## 阶段 4：即梦素材

把所有任务写进项目根目录的 `jobs.json`，执行器会按依赖关系分批提交。格式和提示词模板见 `references/prompts.md`。

```bash
J="python3 $SK/scripts/dreamina_jobs.py jobs.json"
$J submit && $J fetch        # 第一批：关键帧和背景图（不扣额度或扣得很少）
# 用 contact_sheet.swift 拼图检查角色一致性，不合格的执行 `$J reset 名字`，改提示词后重新提交
$J submit && $J fetch        # 第二批：输入图都齐了，提交 image2video 和 lipsync（每 5 秒 1080p 约 130 到 165 额度）
```

- **长时间等待**：fetch 用 Bash `run_in_background` 跑，完成后会有通知，不要在前台循环等。
- **关键帧怎么写**：一定要写成"人物已经在场景里、被场景光照亮"的整体画面。对口型关键帧的脸要够大（中近景，三分之四侧脸），用闭嘴或自然状态做首帧。
- **水印**：开工前请用户在即梦里关掉水印。如果已经下载了带水印的素材，关掉后执行 `$J redownload`。用带水印的图做首帧生成的视频，水印会"烧"进画面，重新下载也去不掉，只能 `reset` 后重新生成。
- **背景视频**：给 `code` 镜头准备 4 到 7 段动态背景，比如城市夜景、雨、光带、星空、黎明，循环播放时放慢并虚化。

## 阶段 5：Remotion 合成

时间线写在 `src/MV.tsx` 里的 `SHOTS`、`BGS`、`EXTRA` 三个数组。组件说明、转场类型和渲染命令见 `references/remotion.md`。

- **字幕**：上英下中，整句淡入淡出加轻微虚化，女声句用暖色。不要做逐词点亮，用户觉得那样不好看。
- **转场**：相邻镜头重叠 5 到 14 帧，按段落选转场方式：副歌用 flash 或 glitch，桥段用 blur，黎明或温暖段落用 leak。
- **大字**：副歌钩子句在 `lip` 镜头上加 `kin`，放在画面中下部（top 约 660），避开脸。
- **动效**：**禁止随节拍缩放、点头或闪白**，每秒两次的脉冲在成片里看起来就是"画面一直在抖"，静帧检查发现不了。节奏只靠卡点剪辑体现，运动只保留缓慢的推镜和漂移。
- **对口型视频**：必须按 1 倍速从镜头起点播放（`kind: 'lip'` 已经处理好了）。

## 阶段 6：检查与出片

```bash
./node_modules/.bin/remotion render src/index.ts MV out/preview_half.mp4 --scale=0.5   # 半分辨率预览，后台运行
swift $SK/scripts/extract_frames.swift out/preview_half.mp4 /tmp/pv 2 6 10 ...         # 在每个镜头中点和转场中点抽帧
swift $SK/scripts/contact_sheet.swift /tmp/grid.jpg 3 /tmp/pv/*.jpg                     # 拼图后用 Read 查看
./node_modules/.bin/remotion render src/index.ts MV out/<名字>_v1.mp4 --codec=h264 --crf=18 --audio-bitrate=320k
swift $SK/scripts/media_info.swift out/<名字>_v1.mp4                                     # 核对时长和音视频轨
swift $SK/scripts/export_small.swift out/<名字>_v1.mp4 out/<名字>_720p.mp4 720 2500 192   # 需要小体积版本时：分辨率、视频码率、音频码率；360 700 96 约 20MB
```

抽帧时重点看这几项：头顶有没有被推近镜头切掉，大字、印章有没有挡住脸，字幕和演唱是否同步，转场中间帧是否干净，有没有残留水印。

**交付时**：给出成片路径和规格，简要说明这一版改了什么，列出需要用户留意的地方（比如估算出来的时间点），附上即梦额度的消耗和余额。用户要发抖音时，可以顺带提供标题、描述和封面文字（见 `references/prompts.md` 末尾）。

## 参考文档

- `references/prompts.md`：Suno 提示词、关键帧、视频、对口型提示词模板，`jobs.json` 示例，发布文案模板。
- `references/remotion.md`：模板组件、`SHOTS` 字段说明、转场类型、性能和渲染。
- `references/pitfalls.md`：踩过的坑和对应解法，出问题时先查这里。
- `examples/no-stack-trace/`：参考成片，完整源码、提示词清单、歌词和 360p 成片预览都在里面。
