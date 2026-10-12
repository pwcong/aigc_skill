# AGENTS.md

这个仓库存放 AIGC 创作类的 Agent Skills，同时供 Codex 和 Claude Code 使用。本文件是写给在这里工作的 agent 的说明。`CLAUDE.md` 是指向本文件的软链接，只改这一份即可。

## 仓库结构

- `.agents/skills/<skill-name>/`：skill 本体，这是唯一的真实来源。
- `.claude -> .agents`：软链接，让 Claude Code 能通过 `.claude/skills/` 读到同一份 skill。**不要把它替换成真实目录，也不要在 `.claude/` 下单独新建文件**，否则两边会不同步。
- `README.md`：面向人的说明，包括 skill 列表、用法、环境要求。
- `AGENTS.md`（本文件）/ `CLAUDE.md -> AGENTS.md`：面向 agent 的工作约定。

当前的 skill：

| Skill | 说明 |
|---|---|
| `ai-anime-mv` | 从故事想法到二次元 AI 音乐 MV 成片（Suno + 即梦 + Remotion）。参考成片在 `examples/no-stack-trace/` |
| `video-remake-prompts` | 拆解参考原片，生成保留动作、运镜和节奏的复刻提示词；按用户选择分割出参考片段或使用整片。含 Codex 界面配置 `agents/openai.yaml`，修改 skill 名称或默认提示语时要同步更新 |

## 修改 skill 时的约定

**SKILL.md**
- 开头的 frontmatter 只写 `name` 和 `description`，`name` 必须与目录名一致。
- 可选的 `agents/openai.yaml` 是 Codex 的界面配置（`display_name`、`short_description`、`default_prompt`），Claude Code 会忽略它。保留这个文件，内容要和 SKILL.md 保持一致。
- `description` 是 agent 决定是否加载 skill 的唯一依据：要同时写清楚"做什么"和"什么时候用"，列出用户可能的多种说法，宁可具体一些。
- 正文控制在 500 行以内，写主流程和关键决策点。细节放进 `references/`，并在正文里注明什么时候去读。
- 指令里讲清楚**为什么**这么做（比如"随节拍缩放会让成片看起来一直在抖"），少用生硬的"必须"。

**路径**
- skill 内部互相引用用相对路径，或者写成"本 skill 的目录"。
- 不要写死本机绝对路径（例如 `~/Desktop/...`、`~/.claude/skills/...`），skill 会从仓库、`~/.claude/skills/`、`~/.agents/skills/` 等不同位置被加载。
- 脚本自己定位所在目录，例如 `SK="$(cd "$(dirname "$0")/.." && pwd)"`。

**脚本**（`scripts/`）
- 新项目要能直接用，不需要改代码；项目差异放进参数或配置文件（例如 `jobs.json`）。
- 依赖尽量用 macOS 自带的能力（AVFoundation、Vision 的 swift 脚本），Python 依赖统一由 `scripts/setup_env.sh` 安装。
- 长时间运行的步骤（即梦轮询、渲染）设计成可以中断后继续、可以在后台运行；状态文件每次读写都落到磁盘。

**踩坑记录**
- 解决了一个非显而易见的问题后，把"现象、原因、解法"补进对应 skill 的 `references/pitfalls.md`。

**内容边界**
- skill 产出的歌词、角色、画面必须是原创。参考已有作品时只借鉴风格，不搬运具体歌词、角色设计或画面；用户要求还原知名角色时，改为设计气质相近的原创角色。
- 不要在仓库里放密钥、账号 token、个人照片等敏感文件。

**体积**
- 单个文件不超过 50MB。示例视频先压缩，例如用 `scripts/export_small.swift ... 360 700 96` 转成 360p。
- 生成的素材（即梦视频、图片）不进仓库，只保留能复现它们的 `jobs.json`。

## 改完之后怎么验证

改了 skill 之后，至少做一次不消耗即梦额度的干跑：

```bash
SK=.agents/skills/ai-anime-mv
T=$(mktemp -d)
bash $SK/scripts/new_project.sh $T/mv                      # 模板能拷贝并安装依赖
python3 -c "import ast,sys;[ast.parse(open(f).read()) for f in sys.argv[1:]]" $SK/scripts/*.py   # Python 脚本语法
(cd $T/mv && ./node_modules/.bin/tsc --noEmit)             # 模板能通过类型检查
(cd $T/mv && ./node_modules/.bin/remotion still src/index.ts MV out/t.jpg --frame=60 --scale=0.5)  # 能渲染出画面（需要在沙箱外执行，调用系统 Chrome）
```

- **改了 `dreamina_jobs.py`**：用一个输入图不存在的 `jobs.json` 测试 `submit`，应该只输出 `waiting`，不会真正提交。
- **改了示例工程**：把 `examples/no-stack-trace/project/src` 覆盖进新工程的 `src/` 后，跑一遍 `tsc --noEmit`。
- **改了 README 或 SKILL.md 里的文件链接**：确认引用的路径都存在。

真实的端到端生成（会消耗即梦额度，还需要用户手动去 Suno 生成歌曲）只在用户明确要求时进行。

## 新增一个 skill

1. 创建 `.agents/skills/<skill-name>/SKILL.md`，按上面的约定写 frontmatter 和正文。
2. 按需建 `scripts/`、`references/`、`assets/`、`examples/`。
3. 在 `README.md` 的 Skill 列表里加一行，补一个简短章节；在本文件的"当前的 skill"表里也加一行。
4. 按"改完之后怎么验证"做一次干跑。

## Git

- 只在用户要求时才提交或推送。
- commit 信息用中文或英文都可以，第一行概括改了哪个 skill、改了什么，例如 `ai-anime-mv: 对口型改用即梦 multimodal2video`。
- 不要提交 `node_modules/`、`*.state.json`、渲染产物和生成的素材，`.gitignore` 已经排除了这些。
