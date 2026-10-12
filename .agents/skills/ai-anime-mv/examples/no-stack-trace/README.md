# 参考成片：《No Stack Trace for a Heart / 心没有报错栈》（v4）

3 分 31 秒的二次元 MV：程序员男主靠 AI 编程助手（橙发少女 Claude）解决了所有技术问题，却解决不了感情；最后关掉对话框，用自己的话发出带错别字的消息。

| 文件 | 内容 |
|---|---|
| `mv_v4_360p.mp4` | 成片 360p 预览版，约 21MB（原片为 1080p、186MB，这里压缩后方便随 skill 存放） |
| `storyboard.jpg` | 55 个镜头的中点抽帧，标注了时间，不看视频也能对照 |
| `lyrics.md` / `lyrics_en.txt` | 中英对照歌词 / 纯英文歌词 |
| `suno_prompt.txt` | 交给 Suno 的完整提示词（风格、排除风格、带标签和读音改写的歌词） |
| `jobs.json` | 本片全部即梦任务：76 个，含背景、关键帧、闭嘴编辑、动作视频、17 段对口型，可以直接给 `scripts/dreamina_jobs.py` 用 |
| `refs/` | 角色设定三视图：`claude_sheet.png`（女主）、`male_lead_sheet.png`（二次元男主） |
| `project/src/MV3.tsx` | **v4 时间线**：59 个镜头的 SHOTS、各段背景、对白字幕；`USE_LS_VIDEO = true` 时演唱镜头使用即梦对口型视频 |
| `project/src/scenes/` | 所有动效镜头：终端、日志、竞态条件、CI、报错堆栈、git revert、HTTP 200 空响应、已读、CLAUDE.md、草稿卡片、关标签页、手机打字等 |
| `project/src/components/` | 组件，包括 LipShot.tsx 里的 VideoShot、VideoBG 和旧版本地口型切换组件 |
| `project/docs/plan.md` | 当时的分镜方案（v1 阶段写的，镜头细节以 MV3.tsx 为准） |
| `project/tools/` | 当时的生成和处理脚本：gen_v3.py（v3/v4 的提示词源头）、build_rig.py、mouth_env.py（本地口型方案）等 |

项目没有包含即梦生成的素材（约 960MB）和 node_modules。要完整复现：
1. 用 `scripts/new_project.sh` 新建工程，把 `project/src` 覆盖进去。
2. 把 `refs/` 拷到工程根目录。
3. 把歌曲放进 `public/audio`，按 SKILL.md 阶段 2 生成 `vocals.wav`。
4. 执行 `dreamina_jobs.py jobs.json submit/fetch` 两轮。

注意：MV3.tsx 引用的 `rigs/`、`characters/`、`images/bg/*.jpg` 来自早期版本，从零复现时把用到它们的地方改成新素材，或者直接走 v4 的对口型视频路径。
