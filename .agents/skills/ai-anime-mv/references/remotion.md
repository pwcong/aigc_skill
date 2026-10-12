# Remotion 合成说明

## 模板结构

```
mv/
├── remotion.config.ts      # 使用系统 Chrome，并发 8
├── public/
│   ├── audio/song.wav, vocals.wav, vocal_slices/
│   ├── clips/              # 即梦视频：v_*.mp4、ls_*.mp4
│   └── images/             # bg/、keyframes/
└── src/
    ├── Root.tsx            # ASPECT = '16:9' | '9:16'
    ├── MV.tsx              # SHOTS / BGS / EXTRA：每个项目主要改这里
    ├── data/               # lyrics.json、audio_analysis.json、words.json
    ├── lib/                # timing（sec、pulse）、anim（ease、typed、typeScript）、transitions
    ├── components/         # Video（VideoShot、VideoBG、ImageBG）、Subtitle、Kinetic、Effects、Window、Phone、Stamp、Backgrounds
    └── scenes/Examples.tsx # 动效镜头示例：终端、代码窗口、聊天
```

## SHOTS 字段

```ts
{from, to, t, kind, clip?, C?, skip?, kin?, overlay?, push?, zoom?, flip?}
```

| 字段 | 说明 |
|---|---|
| `from` / `to` | 歌曲时间，单位秒。用对齐后的句首；一句太长（超过 5 秒）就在小节线上拆成两个镜头（1 小节 = 240/BPM 秒）。 |
| `t` | **进入**这个镜头时的转场。可选 `cut`、`dissolve`（10 帧）、`zoom`（8 帧）、`glitch`（5 帧）、`blur`（14 帧）、`leak`（14 帧）、`flash`（8 帧）、`slide`（8 帧）。 |
| `kind: 'lip'` | 对口型视频，1 倍速播放，`clipDur = max(4, ceil(to-from))`。 |
| `kind: 'vid'` | 动作视频。镜头比片段长时自动慢放，最低 0.55 倍速。 |
| `kind: 'code'` | 动效组件 `C`，底下显示 `BGS` 里该段落的背景视频。 |
| `skip` | 让动效组件从它自己时间线的第 N 帧开始播放，用来复用一个较长的组件里中间的一段。 |
| `kin` | 大字：`{text, glow?, size?, font?: 'heavy' \| 'display'}`。'display' 是 Didot 斜体，适合 "Seen 11:40" 这类带情绪的短句。 |
| `overlay` | 叠加在镜头上的小组件，比如印章、输入框、"正在输入"的三个点。 |

## 转场的实现原理

下一个镜头在它的拍点准时开始；上一个镜头的 Sequence 延长 `OV[next.t]` 帧。重叠期间，上一个镜头播放退场动画，下一个镜头播放入场动画。所以剪辑点始终准确落在句首。

**白闪和漏光**：在 MV 组件里统一计算。`flash` 转场在切点附近叠加 0.3 秒白光；`leak` 和 `flash` 转场会有暖色光斑扫过画面。

**选择转场的经验**
- **段落第一个镜头**：用 `flash`（副歌）或 `blur`（主歌、桥段）。
- **副歌内部**：`glitch` 和 `zoom` 交替使用。
- **情绪段落**：用 `blur` 或 `leak`。

## 字幕

- **数据来源**：`lyrics.json` 的 lines（`start`、`end`、`en`、`zh`、`singer`）。歌曲里没唱、但需要显示的对白，写进 MV.tsx 的 `EXTRA`。
- **效果**：整句淡入 0.45 秒、淡出 0.35 秒，同时轻微虚化。英文用 Avenir Next 44px，中文用苹方 Light 28px，女声句用暖色。
- **片尾标题**：出现之前停止渲染字幕（在 MV 里加条件判断）。

## 背景（BGS）

每个段落一段 `VideoBG`（片段放慢到 0.5 倍速循环播放，虚化 2 到 8px，压暗 0.2 到 0.7），段落之间交叉淡化 24 帧。没有视频时可以用 `ImageBG` 加 `Rain` 或 `Void` 粒子。

## 后期叠加（全局）

`Bokeh`（光斑）→ `ColorGrade`（暗部偏青、亮部偏暖；最后一段副歌可以调暖）→ `LightLeak` → `Vignette` → `Grain`（约 0.045）→ `Flash` → `Subtitles`。

## 渲染

- **调用方式**：用 `./node_modules/.bin/remotion`，不要用 `npx`。后台 shell 里 `npx` 会报 "could not determine executable"。
- **沙箱**：渲染需要在沙箱外执行（Chrome 要拿到 GPU 和系统服务）。
- **耗时**：半分辨率预览约 10 到 15 分钟，1080p 成片约 20 到 30 分钟（视频片段越多越慢）。一律用 `run_in_background` 运行，等完成通知。
- **单帧检查**：`remotion still src/index.ts MV out/stills/x.jpg --frame=<秒*30> --scale=0.5`，适合快速检查构图。
- **成片参数**：`--codec=h264 --crf=18 --audio-bitrate=320k`。3.5 分钟的 1080p 成片约 140 到 180MB。
- **类型检查**：修改代码后先跑 `npx tsc --noEmit`，Remotion 打包时不做类型检查。
