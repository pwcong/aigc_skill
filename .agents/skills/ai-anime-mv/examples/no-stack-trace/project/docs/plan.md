# 《No Stack Trace for a Heart》MV 制作方案

## 1. 已就绪的物料

| 物料 | 路径 | 说明 |
|---|---|---|
| 歌曲 | `public/audio/song.wav` | 由 m4a（Opus）解码，211.2 秒，48kHz 立体声 |
| 双语字幕时间轴 | `src/data/lyrics.json` | 共 51 句，英文在上、中文在下，含段落和演唱者（男声 m / 女声 f） |
| Suno 原始时间轴 | `src/data/suno_lyrics_timing.tsv` | 从 m4a 内嵌的字幕轨（tx3g）提取 |
| 节拍与能量 | `src/data/audio_analysis.json` | 136 BPM，461 拍，116 小节，每秒能量值 |
| 角色抠图 | `public/characters/` | Claude 和男主各有正面、侧面、背面三张透明 PNG |
| 渲染工程 | Remotion 4.0.534（React 和 TypeScript） | 自带 FFmpeg 和无头浏览器，不需要另装 ffmpeg |

**时间轴说明**
- Suno 标的第一句起点是 0.4 秒，人声分析显示实际从 **4.0 秒** 开始，已改正。
- 两句女声 "(I can't read her heart…)" 和 "(You're absolutely right)" 在 Suno 时间轴里时长为 0，目前按估算拆成 90.2 秒和 108.4 秒起，**需要预览时用耳朵确认**。

## 2. 段落结构（以音频分析为准）

| 段落 | 时间 | 能量 | 镜头节奏 |
|---|---|---|---|
| Intro | 0:00–0:04 | 低 | 终端光标 |
| Verse 1 | 0:04–0:37 | 中 | 一句一个"Claude 帮我解决问题"的小场景 |
| Pre-Chorus 1 | 0:37–0:47 | 中，逐渐降低 | 放慢，聊天输入框 |
| Chorus 1 | 0:47–1:16 | 高 | 每 2 小节（约 3.5 秒）切一次，卡在强拍上 |
| Verse 2 | 1:16–1:48 | 中高 | 草稿、CLAUDE.md、会话失忆 |
| Pre-Chorus 2 | 1:48–1:54 | 低谷 | "absolutely right" 碎裂 |
| Chorus 2 | 1:54–2:24 | 高 | 副歌画面变体，颜色更浓 |
| Bridge | 2:24–2:52 | 中，在 2:44–2:52 降到全曲最低 | Claude 独白，最后是关掉标签页、"Go." |
| Final Chorus | 2:52–3:18 | 最高 | 色调从夜色转为黎明，男主出门 |
| Outro | 3:18–3:31 | 渐弱 | 终端对话和 CLAUDE.md 的改动，片尾标题 |

## 3. 视觉方案

**做法**：和参考视频一样分三层叠加。
1. **背景和角色图层**：用 AI 生成的静帧和抠好的角色，代码负责推拉缩放、视差、呼吸感微动、光效。
2. **动效排版图层**：终端、日志、CI、HTTP 响应、聊天界面、CLAUDE.md 编辑器、错误堆栈，全部用代码绘制。这是这支 MV 的主体，也是代码最擅长的部分。
3. **字幕图层**：英文在上，用衬线标题字体（Playfair Display）；中文在下，用思源黑体（Noto Sans SC），按句淡入淡出；女声句换成暖橙色。

**色彩语言**
- 男主的世界：深夜的海军蓝和冷灰，取自他格子衬衫的颜色。
- Claude：暖橙色（#E07A3F 左右，和角色头发一致），每次出现都带一圈橙色边缘光。
- "她"：**蓝色**，呼应歌词 "Her favorite color's blue"。她本人**不露脸**，只以蓝色聊天气泡、已读提示和蓝色光点出现。
- Final Chorus：整体从冷色转到黎明的金橙色。

**输出规格**：1920×1080，30fps，H.264 编码，音频 AAC 320k。

## 4. 分镜表

时间为歌曲时间。素材列的说明：**[代码]** 表示纯代码绘制；**[抠图]** 表示用现有的三视图抠图；**[图 X]** 表示需要你提供的 AI 图片，编号见 `image_prompts.md`。

### Intro 0:00–0:04
- 全黑，终端光标闪烁，打出 `> claude, you there?`，接着出现回复 `Always. What are we fixing tonight?`，和歌里的键盘声同步。[代码]

### Verse 1 0:04–0:37：Claude 无所不能的蒙太奇
| 时间 | 歌词 | 画面 | 素材 |
|---|---|---|---|
| 0:04 | Three a.m., the server's down | 红色告警界面随节拍闪烁，时钟显示 03:00，监控曲线断崖下跌；男主背影坐在桌前 | [代码] + [图 B1] [图 M1] |
| 0:12 | ten thousand lines of logs | 日志高速滚动，Claude 从侧面滑入，放大镜框住一行 ERR | [代码] + [抠图] |
| 0:15 | race condition in the cache | 两条线程轨道撞向 cache 节点后被理顺 | [代码] |
| 0:19 | rolled back the bad migration | 数据库图标，进度条倒着走，盖上 ROLLBACK ✓ 印章 | [代码] |
| 0:22 | unit tests / CSS | 测试列表逐条变绿；错位的方块"啪"地对齐到网格 | [代码] |
| 0:26 | résumé | 简历卡片飞入，关键词高亮，盖上 Senior 印章 | [代码] |
| 0:29 | shades of green | CI 流水线方块卡着节拍由红翻绿 | [代码] |
| 0:33 | lives inside a screen | 显示器边框里是 Claude，屏幕外是男主正面，两人之间隔着一层玻璃反光 | [抠图] 或 [图 C1] |

### Pre-Chorus 1 0:37–0:47
- 灯光变暗，只剩一个聊天输入框。男主一个字一个字地打 "She stopped replying Tuesday…"，中途删掉重打，最后发送。日历上的 "Tue" 被蓝色圈出。[代码] + [图 M2]

### Chorus 1 0:47–1:16：卡在强拍上切
| 时间 | 歌词 | 画面 |
|---|---|---|
| 0:47 | no stack trace for a heart | 满屏大字报错 `Uncaught HeartbreakError`，堆栈只有一行 `at ??? (unknown)` |
| 0:50 | where it fell apart | 代码行号从 1 跳到 9999，没有任何一行被高亮 |
| 0:54 | fix my code in a minute flat | 计时器显示 00:59，diff 刷屏后全部通过 |
| 0:57 | git revert the night I said that | `$ git revert that-night` 返回 `fatal: cannot revert`，红色抖动 |
| 1:01 | 200 OK, body's empty | HTTP 响应面板：`200 OK`、`Content-Length: 0` |
| 1:04 | Seen at 11:40 | 手机聊天界面，男主的蓝色气泡下显示 "Seen 11:40"，再没有回复 |
| 1:08 | solve it all | 任务列表全部打勾，快速闪过 |
| 1:11 | no stack trace for a heart | Claude 正面和男主背面相对，橙色和蓝色的光在两人中间交汇 |

全部 [代码]，人物用 [抠图] 或 [图 C2] [图 M3]。

### Verse 2 1:16–1:48
| 时间 | 歌词 | 画面 | 素材 |
|---|---|---|---|
| 1:16 | asked you for a message | 草稿卡片 Draft 1…7 扇形展开 | [代码] |
| 1:23 | seven drafts | 七张卡片依次亮起后叠成一摞 | [代码] |
| 1:26 | "I just need some space" | 蓝色气泡在黑屏中央，四周留白不断扩大 | [代码] |
| 1:30 | (I can't read her heart…) 女声 | Claude 面前只有一块剪贴板，粘贴进来的文字之外是一片空白 | [图 C3] 或 [抠图] |
| 1:33 | put her in my CLAUDE.md | 编辑器里逐行打出 `## Her`、`- oat milk, no sugar` 等 | [代码] |
| 1:37 | oat milk… hates the rain… blue | 每一项各配一个小动效：燕麦奶杯、雨滴、蓝色色块 | [代码] |
| 1:40 | every session you forget | `New session` 擦屏，Claude 那边清空重来，只有男主留在原处 | [代码] + [抠图] |
| 1:44 | context of our ordinary days | 一堆旧聊天截图和便签漂浮后堆成一座小山 | [代码] |

### Pre-Chorus 2 1:48–1:54
- 1:48 巨大的对话气泡打出 "You're absolutely right"，盖上绿色 ✓ 印章。
- 1:50 印章裂开，画面出现故障效果，接 "but I was wrong"。[代码]

### Chorus 2 1:54–2:24
- 沿用副歌的画面母题，换成变体：
  - "Friday night"：部署进度条冲到 100%，烟花。
  - "I'm sorry compile right"：编辑器里 `"I'm sorry"` 下面有红色波浪线，报错 `error: 'sorry' is not assignable to type 'Forgiveness'`。
- 其他句子复用副歌的组件，饱和度更高，切得更快。[代码] + [图 M3]

### Bridge 2:24–2:52：Claude 独白（全片情绪核心）
| 时间 | 歌词 | 画面 | 素材 |
|---|---|---|---|
| 2:24 | trace a thousand threads | 上千条橙色细线缠成一团，Claude 用手一拨就理顺了 | [代码] + [图 C4] |
| 2:29 | the way she laughs / "yes" | 一个蓝色的人形轮廓，只有外框，里面是问号和噪点 | [代码] |
| 2:35 | no prompt can make them true | 提示词输入框里的字一个个散成粒子 | [代码] |
| 2:43 | The only one who holds the context | Claude 转身看向男主（用侧面抠图），光从她身上流向他 | [图 C5] 或 [抠图] |
| 2:47 | is you | 全片最低谷，画面静止，只有字幕 | [图 M2] |
| 2:50 | So I closed the tab | 浏览器标签页关闭，屏幕熄灭 | [代码] |
| 2:51 | (Go.) | 黑屏上一个橙色的 "Go." | [代码] |

### Final Chorus 2:52–3:18（升调，冷色转暖）
| 时间 | 歌词 | 画面 | 素材 |
|---|---|---|---|
| 2:52 | no stack trace for a heart | 天亮了，男主推门走上街 | [图 B4] [图 M4] |
| 2:55 | walk in blind | 男主侧面行走，背景城市视差滚动 | [图 M4] + [抠图] |
| 2:59 | no autocomplete, no suggested reply | 手机键盘上方的推荐词栏变成空白，被划掉 | [代码] |
| 3:02 | shaking voice and a real "hi" | 输入框里的 "hi" 带着轻微抖动 | [代码] |
| 3:06 | typos and all | 打出 "im sory" 后保留不改，直接发送 | [代码] |
| 3:09 | Sent at 11:41 | 时间戳 11:41 发光 | [代码] |
| 3:13 | dots start blinking | 对方的"正在输入"三个点开始闪，画面泛起暖光 | [代码] + [图 M5] |

### Outro 3:18–3:31
- 终端：`> claude, I didn't use your draft.`
- 回复：`Good. Tell me how it goes — …well, you'll have to tell me twice.`
- CLAUDE.md 新增一行（绿色）：`+ - Some bugs you fix yourself.`
- 片尾标题：《No Stack Trace for a Heart / 心没有报错栈》，淡出。[代码]

## 5. 工程结构（规划）

```
mv/
├── public/
│   ├── audio/song.wav
│   ├── characters/         现有抠图（6 张）
│   └── images/             ← 你提供的 AI 图放这里（命名见 image_prompts.md）
├── src/
│   ├── data/lyrics.json    双语字幕 + 段落
│   ├── components/         Terminal、ChatBubble、Subtitle、CIPipeline、HttpPanel…
│   ├── scenes/             按段落拆：Intro、Verse1、Chorus…
│   └── MV.tsx              总时间轴（按 lyrics.json 自动排布）
└── out/mv.mp4
```

**渲染方式**
- 预览：`npm run studio`，在浏览器里实时拖动时间轴查看。
- 出片：`npm run render`。

## 6. 推进顺序

1. **v1（不依赖任何新图片）**：先用现有抠图加纯代码动效做出完整 3 分 31 秒的成片，确认节奏、字幕和分镜。
2. **v2**：你陆续提供 AI 图片，我逐个替换进去，画面质感会接近参考视频。
3. **可选**：挑 3 到 5 个关键镜头做图生视频（即梦或 Seedance），作为视频图层叠进去。
