# 提示词模板

## 目录
1. Suno 提示词
2. 角色设定三视图
3. 关键帧（对口型 / 动作 / 背景）
4. 视频与对口型提示词
5. jobs.json 示例
6. 抖音发布文案

---

## 1. Suno 提示词（`suno_prompt.txt`）

`suno_prompt.txt` 按 Suno 自定义模式的输入框分段：

```
==== Title ====
<歌名>

==== Style of Music ====
emotional J-pop ballad, city pop influence, clear male tenor lead, soft airy female vocal in bridge, piano, warm synths, light drums, 90 BPM, anthemic chorus, key change final chorus, bittersweet, hopeful

==== Exclude Styles ====
rap, heavy metal, autotune, screaming, EDM drop

==== Lyrics ====
[Intro]
[Soft piano]

[Verse 1]
[Male Vocal]
...

[Bridge]
[Female Vocal, Soft, Stripped Back Piano]
...

[Key Change]
[Final Chorus]
[Male Vocal, Powerful, Full Band]
...

[Outro]
[Soft piano, fade out]
[End]
```

- **不要唱出来的内容**：终端台词、旁白不放进歌词框，用 `[Instrumental]` 占位，到 MV 里用字幕表现。
- **读音改写**：数字、文件名、缩写改成读音写法，比如 `200` 写成 `two hundred`，`11:40` 写成 `eleven-forty`，`.md` 写成 `dot M-D`。
- **附操作说明**：在文件末尾写清楚怎么用：选 Custom 模式；不选 Vocal Gender；先生成 6 到 10 版挑旋律；不满意的段落用 Replace Section 单独重做；导出 WAV。

## 2. 角色设定三视图（用户没有提供设定图时）

```
Anime character design turnaround sheet of <外貌：发型发色、眼睛、体型> wearing <服装细节，越具体越稳定>.
Three full-body views side by side: front, side (facing left), back. Neutral standing pose, arms relaxed.
Clean cel-shaded anime illustration, plain pure white background, small labels FRONT SIDE BACK.
```

- **写实照片转二次元**：用 `image2image`，参考图放写实照片，再加一张已有的二次元设定图作为画风参考，提示词写 "Redraw the person from image 1 … in exactly the same anime art style as image 2. Keep identity and outfit."
- **身份描述字符串**：生成后为每个角色写一句固定的身份描述（例如 `the orange-haired girl from the reference (very long orange hair, sunflower hair ornament, white caped dress …)`），后面所有提示词都复用这一句，可以明显提升一致性。

## 3. 关键帧

风格后缀（所有关键帧都加）：
```
anime illustration, cel-shaded, cinematic lighting, highly detailed background art, soft glow, cinematic anime color palette with deep blues and warm oranges, 16:9, no text, no watermark
```
融合句（有人物的关键帧都加）：
```
the character is lit by the scene lighting and naturally integrated into the environment
```

**对口型关键帧**（`image2image`，refs 填角色设定图；画幅 16:9，竖屏项目用 9:16）：
```
{身份描述} {场景与动作}, singing emotionally with his/her mouth open, face clearly visible in three-quarter view, medium close-up, {光线：red alert light / cold blue monitor light / golden sunrise …}, {融合句}, {风格后缀}
```
- 这批关键帧再各做一张"闭嘴"编辑版，作为对口型视频的首帧：`Edit only the mouth: mouth gently closed, lips together. Keep everything else in the image exactly identical: same pose, same hair, same lighting, same background, same framing and composition, pixel-aligned.`
- 首帧用闭嘴版，模型会从自然状态开始驱动口型；用张嘴版，开头容易卡住。

**动作关键帧**：写清楚动作的"起始姿态"、景别（wide / full body / over-the-shoulder / close-up of hands）和场景光。
- 双人镜头的 refs 放两张设定图，提示词里两人的身份描述都要写全。

**背景**（`text2image`）：
```
{场景}, no people, {情绪}, {风格后缀}
```
- **常用组合**：夜景城市窗景、雨夜街道、副歌用的抽象光带（暖橙和红蓝各一张）、星空云海、黎明城市全景（21:9，方便横移）。

## 4. 视频与对口型

**image2video**（5 秒；镜头更长时 VideoShot 会自动放慢播放）：只写**运动**，不要重复描述画面内容。
```
{人物动作}, {环境动态：hair and dress flow / rain streaks / particles drift}, {运镜：slow push-in / slow orbit / camera tracks alongside}
```

**lipsync**（`multimodal2video`；音频取 `vocals.wav` 里对应的片段，脚本会自动切）：
```
The character in the image sings the vocals in the audio with accurate, expressive lip sync. Natural facial expression, occasional blinking, subtle head and shoulder movement, hair moving gently, slow cinematic camera push-in. Keep the character design, outfit, lighting and background exactly consistent with the image. No text.
```
- **音频用纯人声轨**：用 Demucs 分离出的人声，不要用混音。伴奏会干扰模型判断口型。
- **时长**：audio.start 和 audio.end 填这一镜头在歌曲中的起止时间，生成时长为 `max(4, ceil(end-start))`。

## 5. jobs.json 示例

```json
{
  "defaults": {"image_model": "5.0", "image_res": "2k", "video_model": "seedance2.0_vip", "video_res": "1080p"},
  "jobs": [
    {"name": "bg_city_night", "type": "text2image", "ratio": "16:9", "out": "public/images/bg",
     "prompt": "Night city skyline seen from a high-rise apartment window, ... no people, <风格后缀>"},
    {"name": "kf_m_rooftop", "type": "image2image", "refs": ["refs/male_sheet.png"], "ratio": "16:9", "out": "public/images/keyframes",
     "prompt": "<男主身份描述> on an apartment rooftop at night, singing emotionally ..."},
    {"name": "kf_m_rooftop_closed", "type": "image2image", "refs": ["public/images/keyframes/kf_m_rooftop.png"], "ratio": "16:9", "out": "public/images/keyframes",
     "prompt": "Edit only the mouth: mouth gently closed, lips together. Keep everything else ... pixel-aligned."},
    {"name": "v_city_night", "type": "image2video", "image": "public/images/bg/bg_city_night.png", "duration": 5, "out": "public/clips",
     "prompt": "city lights twinkle, cars move on the distant bridge, slight camera drift"},
    {"name": "ls_03_rooftop", "type": "lipsync", "image": "public/images/keyframes/kf_m_rooftop_closed.png",
     "audio": {"src": "public/audio/vocals.wav", "start": 46.4, "end": 50.1}, "out": "public/clips",
     "prompt": "The character in the image sings the vocals in the audio with accurate, expressive lip sync ..."}
  ]
}
```

**命名约定**
- `bg_*`：背景图
- `kf_*`：关键帧（`_closed` 表示闭嘴编辑版）
- `v_*`：动作或背景视频
- `ls_NN_*`：对口型视频，NN 按出现顺序编号，方便和 SHOTS 对照

## 6. 抖音发布文案

- **标题**：最多 30 字，三选一：
  - 故事钩子型（"AI 帮我修好了所有 bug，除了……"）
  - 圈层共鸣型
  - 原创 MV 型
- **描述**：用 3 到 5 句讲出故事的冲突和结尾，标注"原创歌曲《》"，末尾放一个互动提问，带 5 到 8 个话题，前两个放流量大的（#原创音乐 #AI音乐）。
- **封面**：选副歌主角演唱那一帧，配主标题（歌名）和一句钩子副标题。
- **置顶评论**：放一个彩蛋提示，引导观众回看。
- **提醒用户**：
  - 发布时勾选"作品含 AI 生成内容"。
  - 横屏视频在抖音上会有上下黑边，可以另出一版 9:16。
