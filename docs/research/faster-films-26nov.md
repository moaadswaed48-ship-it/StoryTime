# Faster films for StoryTime: research, 26 Nov 2026

Method: web reading only, nothing installed. Every claim has a link. "UNVERIFIED" marks what I could not confirm. Numbers marked "my estimate" are arithmetic or judgement, not measurements. The Firecrawl tool had no credits left, so I used ordinary web search; I read search summaries, not always the full pages.

## Recommendation (read this first)

The slowness comes from drawing 3D fur frame by frame on a CPU. Three routes, best first:

1. **Switch most films to a flat, storybook 2D look, drawn in code (SVG/canvas, or flat-shaded three.js), and capture frames with headless Chromium through Remotion or HyperFrames.** Frames cost fractions of a second, not 30 seconds. Characters become reusable rigs, so each new film is mostly a script plus a shot list. This also fixes the token cost, because the agent edits small scene files instead of building a 3D scene each time. Keep Blender only for a few hero 3D shots.
2. **Keep Blender, but change the look so the CPU can cope:** toon shading with no real fur (fur as painted texture or a few shaped cards), 12 drawn frames per second ("on twos") interpolated to 24 by ffmpeg, low samples plus denoise, render at 640x360 and upscale with a classic filter. My estimate: 5-10x faster than today, no money needed.
3. **Rent a GPU only for the final render of hero Blender films.** A rented RTX 4090 costs about $0.34-0.89 per hour on RunPod (links below). My estimate is roughly $60-125 for all 3 hours of 720p 3D film. Needs an account and the owner's yes on money.

Not recommended: Blender EEVEE on this box. The official manual says there are no plans for CPU rendering of EEVEE, and a Blender developer wrote that headless EEVEE and Workbench are not supported (links in section 1). Software OpenGL (llvmpipe) might still run it, but I found no proof for Blender 4.2 to 5.x, and users call it very slow. Treat as UNVERIFIED; a 15-minute test would settle it, but I would not plan on it.

## Cost and time table

Assumptions: 24 frames per second of film. 30 s = 720 frames. 3 hours = 259,200 frames (half that if drawn "on twos"). Current speed: about 30 s per 720p fur frame (from the brief).

| Route | Time per frame | 30 s of film | 3 hours of film | Money | Needs account? |
|---|---|---|---|---|---|
| Today: Cycles CPU, fur, 720p | ~30 s | ~6 h | ~2,160 h (90 days) | $0 | no |
| Cycles CPU, 360p low samples (from brief) | ~6 s | ~1.2 h | ~430 h (18 days) | $0 | no |
| Route 2: toon Cycles, no fur, 360p, on twos, upscale (my estimate, UNVERIFIED) | ~1-3 s drawn | ~6-18 min | ~65-200 h | $0 | no |
| Route 1: 2D/2.5D in Chromium via Remotion/HyperFrames (my estimate, UNVERIFIED; no published fps found) | ~0.1-0.5 s | ~1-6 min | ~7-36 h | $0 (see licence note) | no |
| Route 3: GPU Cycles on rented RTX 4090 (speed my estimate: 2-3 s per fur frame) | ~2-3 s | ~25-35 min, about $0.2-0.4 | ~150-215 h, about $50-190 | $0.34-0.89 per hour | yes, plus money |
| SheepIt free farm | depends on queue | slow, uncertain | not planned | free but earns/spends points | yes (free account) |

Remotion's docs publish no frames-per-second figure; speed depends on the scene and the number of Chrome tabs, and they advise measuring with `npx remotion benchmark` ([Remotion performance](https://www.remotion.dev/docs/performance)). So the Route 1 numbers must be measured on our box with a 10-second test before committing.

## 1. Faster rendering on a CPU-only Linux box

**EEVEE / Workbench headless**
- Blender's manual says there is no plan to support CPU (software) rendering for EEVEE because a rasteriser is built for GPUs ([manual, EEVEE limitations](https://docs.blender.org/manual/en/5.1/render/eevee/limitations/limitations.html); the page returned an error when I opened it, so this wording comes from a search summary; UNVERIFIED in full).
- A Blender developer: headless support for Workbench and EEVEE "would be nice at some point" and is "not considered a bug" ([devtalk thread](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-eevee/1436/19); old, written before EEVEE Next).
- Workaround people use: a virtual screen (Xvfb) with Mesa llvmpipe. One user said it works but is "super slow" (same thread). Whether this works for EEVEE Next in Blender 4.2 to 5.x: UNVERIFIED. A cloud-farm vendor claims EEVEE Next cannot run as a command-line binary on headless servers ([iRender](https://irendering.net/eevee-next-headless-dilemma-cloud-render-farm-guide/)); the vendor sells GPU rendering, so treat it as a claim, not a fact.
- A Blender tracker item about OpenGL background rendering is marked resolved, but I could not confirm which version or what it enables ([issue 54633](https://projects.blender.org/blender/blender/issues/54633)).
- Cycles has no such problem. It runs headless on CPU, which is what you use now.

**Cycles tricks for a stylised look** (general Blender practice; I did not find a source I could cite for exact speed-ups, so these are UNVERIFIED as numbers):
- Toon look without fur: flat or two-step shading, a colour-ramp shader, Freestyle or an outline pass. Replace fur with a painted texture or a small number of shaped cards. Fur is likely most of your 30 s.
- Low samples with a denoiser, "on twos" (draw 12 per second, let ffmpeg repeat or blend to 24), and render only the moving layers; reuse a still background.
- Grease Pencil gives hand-drawn 2D inside 3D; a Blender issue reports command-line renders failing with Grease Pencil objects in 2.82/2.90, so test before relying on it ([issue 75952](https://projects.blender.org/blender/blender/issues/75952)).
- Upscaling with a classic filter (ffmpeg lanczos, then light sharpening) is fine for flat toon art; fur and noise upscale badly. No source needed, but it is my judgement.

## 2. Browser and code animation pipelines

| Tool | What it is | Speed evidence | Notes |
|---|---|---|---|
| Remotion | React code makes video, frames captured by headless Chromium, encoded with ffmpeg | No fps figure published. Docs: concurrency = number of browser tabs, default half the CPU threads, lower resolution is faster, H.264 fastest, parallel encoding on by default ([docs](https://www.remotion.dev/docs/performance), [parallel encoding](https://www.remotion.dev/docs/parallel-encoding)). One user could only use concurrency 2 because of memory ([discussion](https://github.com/orgs/remotion-dev/discussions/862)) | Licence terms for companies: UNVERIFIED here; check before commercial use |
| HyperFrames (HeyGen) | HTML/CSS/JS scene played in headless browser, rendered to MP4/MOV/WebM, Apache 2.0, built for agents ([HeyGen docs](https://developers.heygen.com/hyperframes-overview), [repo](https://github.com/heygen-com/hyperframes)) | No benchmark found | Launched about April 2026 per a review ([DEV review](https://dev.to/andrew-ooo/hyperframes-review-heygens-html-to-video-for-ai-agents-170i)); young. Many unofficial forks exist; use only the heygen-com repo |
| Revideo / Motion Canvas | Motion Canvas animates 2D in TypeScript but renders from its editor; Revideo is a fork with a headless render API and parallel rendering ([Revideo README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)) | No independent benchmark found | Good for 2D vector animation with a timeline |
| three.js in headless Chromium | Draw 2.5D/3D flat-shaded scenes, capture each frame | No measured server fps found. Without a graphics card WebGL runs on SwiftShader, needs flags like `--use-angle=swiftshader-webgl --enable-unsafe-swiftshader`; heavy scenes reported at single-digit fps ([Microlink on WebGL without a GPU](https://microlink.io/blog/webgl-without-a-gpu)); one team found llvmpipe faster than SwiftShader (same source family, anecdote) | Fine for simple flat shapes, poor for heavy lighting |
| SVG/canvas 2D + Chromium or node-canvas | Cheapest of all; no WebGL needed | My expectation only | Best fit for Route 1 |
| Lottie / Rive | Runtime players for pre-made vector animation | Not researched; UNVERIFIED | They play animations made in a designer tool, so they do not solve "the agent builds it from code" |

Rule of thumb from these sources: anything not needing WebGL avoids the software-GPU penalty, so 2D (SVG/canvas/CSS) is the safe fast path.

## 3. Renting a GPU only for rendering

Prices are third-party snapshots and disagree; confirm on the day.
- RunPod RTX 4090: about $0.34/h Community Cloud, $0.69-0.89/h Secure Cloud, billed per second ([RunPod 4090](https://www.runpod.io/gpu-models/rtx-4090), [comparison](https://tech-insider.org/runpod-vs-lambda-vs-vast-ai-2026/)).
- Vast.ai (marketplace, host-set prices): 4090 floor reported $0.13-0.20, typical $0.29-0.50/h; reliability varies by host ([price guide](https://vast.ai/article/how-much-does-it-cost-to-rent-a-gpu-in-the-cloud-live-pricing-guide), [tracker](https://getdeploying.com/reference/cloud-gpu/nvidia-rtx4090)).
- Lambda: A6000 about $1.09/h; H100 about $3.99-4.29/h; not cheap for rendering ([pricing roundup](https://neurohive.io/en/guides/cloud-gpu-pricing/), [comparison](https://tech-insider.org/runpod-vs-lambda-vs-vast-ai-2026/)). Paperspace: no price found, UNVERIFIED.
- GPU speed-up for Cycles: I found benchmark scores but no clean CPU-versus-4090 render-time ratio ([Blender Open Data via Notebookcheck](https://www.notebookcheck.net/GeForce-RTX-5090-crushes-RTX-4090-in-Blender-benchmark-leads-predecessor-by-almost-37.948848.0.html)). The "2-3 s per frame" in the table is my estimate and needs a one-hour test.
- SheepIt free farm: you earn points by lending your own computer's idle time and spend them to get frames rendered; spending costs 10 points per render-minute, earning gives 38 per render-minute ([SheepIt FAQ](https://www.sheepit-renderfarm.com/faq)). It lists Cycles, Eevee and Workbench. It needs a free account, your project is uploaded to strangers' machines, and a third party warns projects can be paused ([guide](https://superrendersfarm.com/article/sheepit-render-farm-free-point-system-blender-users)). Not suited to 3 hours of film on a schedule. Our container cannot "lend" time cheaply without hurting our own renders.
- Needs the owner's yes: any paid GPU, any account (RunPod, Vast.ai, SheepIt). Paid Blender farms (iRender, Fox, etc.): prices not researched, UNVERIFIED.

## 4. Claude Code skills, plugins and MCP servers for video

| Item | What it does | Maturity | Red flags / checks |
|---|---|---|---|
| Remotion agent skills ([Remotion skills](https://www.remotion.dev/docs/ai/skills)) | Teaches the agent Remotion's conventions; installed with `npx remotion skills add` inside a project ([guide](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code)) | Official, from the Remotion team | Installer step downloads from npm: read it first, pin the version (project rule 10) |
| HyperFrames skills ([repo](https://github.com/heygen-com/hyperframes)) | Plan, write HTML, lint, preview, render loop; `npx skills add heygen-com/hyperframes`; also a Claude plugin listing ([claude.com/plugins/hyperframes](https://claude.com/plugins/hyperframes)) | Official HeyGen, Apache 2.0, about 7 months old | HeyGen also sells a hosted render and MCP; never use the sign-in or hosted step (project rule 10). Not audited by me: UNVERIFIED code |
| blender-mcp ([ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)) | Lets Claude drive a running Blender through a local socket; `claude mcp add blender uvx blender-mcp` ([guide](https://vibehackers.io/claude-code/skills/blender-mcp)) | Popular community project, not official | Needs Blender GUI add-on running, so it is a poor fit for a headless box; some features fetch assets from online libraries (network calls). For us, plain headless Blender Python scripts are simpler |
| Third-party Blender skill packs ([example](https://gitee.com/mf/blender-skills), [example](https://skills.sh/nousresearch/hermes-agent/blender-mcp)) | Prompt packs wrapping blender-mcp | Community, quality varies | Treat as advice only; read before use; many are promotional |
| Motion Canvas / Revideo skills | Not found as official skills; one third-party Helios skill appeared in search ([skills.sh](https://www.skills.sh/bintzgavin/helios-skills/helios-renderer)) | Unknown | UNVERIFIED |

I found no official Anthropic or Blender Foundation video skill, and no published workflow joining Blender MCP with Remotion.

## 5. Workflow for making many films cheaply

1. **Build once, reuse forever.** One "film kit" repo: character rigs (a few body parts as SVG groups with joints: walk, run, wave, sit, talk, blink), prop library, backgrounds as layered parallax plates, camera moves (pan, push-in, shake), colour palettes per story, and a mouth-shape set matched to the read-along audio.
2. **A film is data, not code.** Each film = a small JSON/TS file: scenes, which character, which action, start time from the audio timestamps, camera move. The agent writes this file only (hundreds of lines, not thousands). A validator checks it before any render.
3. **Cheap checks first.** Render one still per scene at 320x180 (a contact sheet), review it, and only then render the full film. Use rendering of a 5-second slice to catch problems.
4. **Models (our rules say Sonnet reads, Opus builds, Fable for style and pilots):** Fable high once, to design the kit and the first pilot film; Opus 5.5 to write each film's shot file from the story text; Sonnet 5.5 for batch rendering, contact-sheet checks, ffmpeg and file work. Pin helpers to Sonnet (owner rule).
5. **Brief template for the agent (same every film):** story text and audio timings; list of characters and props already in the kit; shot list limits (max N shots, max M new props); look rules (flat colours, rest state for reduced motion); the definition of done (contact sheet approved, MP4 plays, length within 5% of audio).
6. **Test in batches** and write a short handoff note after each film so a fresh session can continue.

## Open questions (need a test, about one hour in total)
- Blender EEVEE under Xvfb/llvmpipe on this box: does it start and how many seconds per frame? (UNVERIFIED)
- Remotion and HyperFrames: real frames per second for a 2D scene with 3 characters at 1280x720 on 4 cores, and memory per tab. (UNVERIFIED)
- Remotion commercial licence terms. (UNVERIFIED)
- GPU Cycles seconds per fur frame on a rented 4090. (UNVERIFIED; only needed if Route 3 is chosen)
