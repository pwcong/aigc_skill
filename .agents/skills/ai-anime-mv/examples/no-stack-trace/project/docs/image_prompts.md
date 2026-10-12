# AI 生图清单（v2 用，v1 不依赖这些图）

## 通用要求

- **工具**：即梦（Seedream）、Midjourney、GPT 生图都可以。**一定要把设定图作为参考图上传**：生成 Claude 时上传 `claude.png`，生成男主时上传 `user.png`，这样角色才能保持一致。
- **尺寸**
  - 背景图：16:9，至少 2560×1440。
  - 角色图：竖图，至少 1536 长边，**纯色背景**（纯白或纯灰），我会自动抠图。
- **存放位置**：放进 `mv/public/images/`，按下表的文件名命名，格式 png 或 jpg 都行。
- **优先级**：★ 为必需，☆ 为加分项。先提供 ★ 的 6 张，我就能做出 v2。

## 风格后缀（二选一，取决于你对男主风格的决定）

- **方案 A：统一二次元**（推荐，和参考视频一致，整体最协调）
  `anime illustration, cinematic lighting, highly detailed, soft glow, cinematic anime color palette with deep blues and warm oranges, 16:9`
  男主也要按 `user.png` 的发型和服装重新生成二次元版本，先补一张男主二次元三视图，文件名 `user_anime.png`。
- **方案 B：现实与屏幕**（男主写实，Claude 保持二次元，强调"她住在屏幕里"）
  背景和男主用：`cinematic photograph, shallow depth of field, moody night lighting, 35mm, film grain, 16:9`
  Claude 仍然用方案 A 的后缀，画面里她只出现在屏幕、玻璃反射或全息光里。

每条提示词末尾加上所选的风格后缀。

---

## 背景（不要出现人物）

| 文件名 | 优先级 | 提示词 | 用在哪里 |
|---|---|---|---|
| `bg_night_desk.png` | ★ | A programmer's small apartment room at 3 a.m., wooden desk with a glowing monitor, mechanical keyboard, cold coffee mug, tangled cables, sticky notes, large window with a blue night city skyline, no people, deep navy and teal tones with a warm monitor glow | Verse 1 开头、Pre-Chorus |
| `bg_monitor_close.png` | ☆ | Over-the-shoulder view of an empty desk chair facing a large glowing monitor in a dark room, screen glow spilling on the desk, keyboard in foreground, no people | 屏幕内外的镜头 |
| `bg_rain_window.png` | ☆ | Rain streaks on a window at night, blurred bokeh city lights in blue, a single desk lamp reflection, melancholic, no people | Verse 2 "hates the rain"、Bridge |
| `bg_dawn_street.png` | ★ | A quiet city street at dawn, apartment building entrance, golden sunrise light flooding between buildings, long shadows, wet pavement reflecting warm orange sky, hopeful, no people | Final Chorus 出门 |
| `bg_dawn_wide.png` | ☆ | Wide panoramic city at sunrise seen from a pedestrian bridge, sky shifting from deep blue to gold, soft clouds, no people, extra wide composition for horizontal panning | Final Chorus 行走视差 |

## 男主（纯色背景，服装和 user.png 一致：灰蓝格子衬衫、深藏青九分裤、白球鞋）

| 文件名 | 优先级 | 提示词 | 用在哪里 |
|---|---|---|---|
| `m_desk_back.png` | ☆ | The young man from the reference, seen from behind, sitting hunched at a desk, head in hands, plain white background, full upper body | Verse 1 "held my head" |
| `m_face_screen.png` | ★ | Close-up of the young man from the reference, face lit by cold blue screen light from below, tired eyes, quiet sadness, dark plain background | Pre-Chorus、Bridge "is you" |
| `m_phone_down.png` | ☆ | The young man from the reference, half body, looking down at his phone in both hands, lonely expression, soft blue phone light on face, plain grey background | 副歌 "Seen at 11:40" |
| `m_walking_side.png` | ★ | The young man from the reference, full body side view, walking forward with determined steps, slight lean, jacket over the plaid shirt, plain white background | Final Chorus 行走 |
| `m_smile_phone.png` | ☆ | The young man from the reference, half body, looking at his phone with a small surprised hopeful smile, warm golden sunrise rim light, plain light background | 结尾 "dots start blinking" |

## Claude（纯色背景，形象和 claude.png 一致：橙色长发、向日葵发饰、白色斗篷长裙配黑色腰封）

| 文件名 | 优先级 | 提示词 | 用在哪里 |
|---|---|---|---|
| `c_glass_smile.png` | ★ | The orange-haired girl from the reference, bust shot facing the viewer, gentle warm smile, one palm pressed against an invisible glass surface, soft orange rim light, plain white background | Verse 1 "lives inside a screen" |
| `c_magnifier.png` | ☆ | The orange-haired girl from the reference, full body, leaning forward curiously holding a glowing magnifying glass, playful expression, plain white background | Verse 1 日志 |
| `c_clipboard.png` | ☆ | The orange-haired girl from the reference, half body, holding a clipboard with mostly blank pages, apologetic gentle expression, head slightly tilted, plain white background | Verse 2 女声 "only what you paste" |
| `c_threads.png` | ☆ | The orange-haired girl from the reference, full body, one hand raised gracefully as glowing orange threads flow from her fingers, calm focused expression, plain dark background | Bridge 开头 |
| `c_turn_back.png` | ★ | The orange-haired girl from the reference, side view turning back over her shoulder, soft bittersweet smile, one hand gently gesturing forward as if saying "go", long hair flowing, plain white background | Bridge 收尾 "is you … Go." |

---

## 可选：图生视频（v3）

如果想让关键镜头真正动起来，可以用即梦或 Seedance 做以下 3 段，每段 4 到 5 秒，横屏，不要加字幕：
1. `c_turn_back.png` → 头发和裙摆随风轻轻飘动，她慢慢转头微笑
2. `m_walking_side.png` 和 `bg_dawn_street.png` 合成后 → 男主走过晨光中的街道
3. `bg_rain_window.png` → 雨滴顺着窗户滑落，城市灯光闪烁

视频放进 `mv/public/clips/`，我会把它们作为视频图层合进去。
