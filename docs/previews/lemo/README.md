# Lemo-Opuscar: film-look options for StoryTime (trial, 25 Nov 2026)

**In short:** the add-on is safe to use, its films are drawn entirely in code, and films we make with it are ours, including for sale. Of the three test films, **Paper Pop-up Book** looks clearly the best for small children: the characters are appealing, and real light and lens blur make them feel alive. **Risograph** comes second: tasteful and calm, but the characters are small and simple. **Crayon World 3D** is charming as an idea, but the characters look crude and stiff and their faces are rarely seen. Recommendation at the end.

## 1. Safety verdict: clean (with three cautions)

Read before anything was run, at commit `8ca0dd8` (version 2.0.0). Full record: `docs/SKILLS.md`, section "Lemo-Opuscar film-style library".

- The setup script downloads only the add-on itself, two pinned code packages (Playwright and three.js, neither runs install scripts), a headless Chrome and six common Python packages. It reports missing system tools but installs none.
- The asset downloader fetches only from the add-on's own GitHub release, and it checks every file's fingerprint (SHA-256) before unpacking.
- No tracking, no analytics, no reading of passwords or keys. The local preview server can only be reached from this machine.
- Cautions: (1) six styles marked ✦ need an AI image generator and break our rule, so they are excluded; (2) two voice options (Edge, Doubao) are online services, so they are excluded; (3) the music sampler downloads instrument packs automatically the first time a score needs them. Our tests used none of these: all music and sound here is synthesised in code.

## 2. The licence in plain words

- **Films we make with it are ours**, including for sale, with no credit needed. The licence says so word for word: "Films you make with the library are yours, commercial films included, and need no credit".
- **The code** (the drawing and rendering engines) is MIT: free to use and change, also commercially.
- **The style guides and prompts** (the written instructions) are CC BY-NC 4.0, plus a special permission to follow and adapt them to make our own films, commercial ones included. We may **not** put the guides themselves inside our product or sell them.
- **The demo films and their stills** (everything in `styles/` below) are CC BY 4.0: fine for us to look at; if we ever show them publicly they need a credit line ("Lemo-Opuscar by Lemomo (LemoLab), CC BY 4.0").
- Music: our tests use only code-synthesised instruments, so no sample-library credits are owed. If a later film uses the add-on's sampled instruments, some of them (for example the piano) need a credit line in the app.

## 3. The style shortlist (from 99 styles)

I kept the 19 styles that suit a warm, friendly, readable picture book with characters or animals, and dropped neon, glitch, horror, news, tech and data styles.

- `shortlist-1.jpg`, `shortlist-2.jpg`: one picture per style, with its number and name.
- `styles/NN-name.jpg`: four frames from each style's own demo film (at 15 %, 38 %, 62 % and 85 % of the film).

| No. | Style | File |
|---|---|---|
| 09 | Crayon Picture Book | `styles/09-crayon-book.jpg` |
| 10 | Watercolor Brush | `styles/10-watercolor.jpg` |
| 11 | Impasto Oil Painting | `styles/11-impasto.jpg` |
| 12 | Urban Sketch (pen and wash) | `styles/12-urban-sketch.jpg` |
| 13 | Colored-Pencil Illustration | `styles/13-colored-pencil.jpg` |
| 22 | Shadow Puppetry | `styles/22-shadow-puppet.jpg` |
| 27 | Gilded Illumination | `styles/27-gilded-illumination.jpg` |
| 28 | Risograph Print | `styles/28-risograph.jpg` |
| 29 | Halftone Dossier | `styles/29-halftone-dossier.jpg` |
| 43 | Silhouette Rhythm | `styles/43-silhouette-rhythm.jpg` |
| 52 | 1930s Rubber Hose Cartoon | `styles/52-rubber-hose.jpg` |
| 55 | Mid-century Cartoon | `styles/55-midcentury-toon.jpg` |
| 58 | 16-bit Pixel RPG | `styles/58-pixel-rpg.jpg` |
| 74 | Firefly Pointillism | `styles/74-firefly-pointillism.jpg` |
| 78 | Brick Toy | `styles/78-brick-toy.jpg` |
| 79 | Paper Pop-up Book | `styles/79-paper-popup.jpg` |
| 81 | Low-poly Isometric Island | `styles/81-lowpoly-island.jpg` |
| 83 | Memphis Diorama | `styles/83-memphis-diorama.jpg` |
| 85 | Crayon World 3D | `styles/85-crayon-world.jpg` |

The full gallery with every demo film: https://lemomo-ai.github.io/lemo-opuscar/

## 4. The three test films (in `tests/`)

The same 30-second opening of A04 "Slow, Slow, Together" in all three, so the looks can be compared and not the stories: Grandpa points up the green hill at the red anemones, Sami runs up, stops and looks back, Grandpa waves far below (step... tap), Sami runs back and takes his hand, and they walk up together. One English caption line at a time, no speech (voices come later), code-made music and footsteps. Each is an H.264 MP4 at 1280×720, under 15 MB, with a sheet of ten frames next to it.

### 2-paper-popup-book.mp4 (style 79) — the best of the three
A real pop-up book open on a wooden desk, with a lamp and a teacup softly blurred behind it. The hill is a paper ramp that springs up at the start, the red anemones are cut-paper flowers, the sky is the standing back page with a sun on a stick. Sami and Grandpa are flat cut-out cards with a white paper border, lit by real light and casting cut-out shadows; Sami turns around by flipping the card, as the style prescribes.
- **Looks:** the most appealing by far. Sami has big shiny eyes, rosy cheeks and curls and reads as a lovable three-year-old; Grandpa (glasses, white beard, rust jumper, stick) is warm and recognisable. The material and the lens blur make even simple poses feel alive.
- **Weak points:** the walk is only two drawings, so it is a little stiff close up; the two hands meet but do not clearly hold each other in the close shot; the overall colour is quite warm and slightly hazy; one tree throws a big dark shadow on the back hill.
- **Cost here:** about 10 seconds per frame on this machine (no graphics card); the 30 seconds took 23 minutes to render at 720p.

### 3-risograph.mp4 (style 28) — good, calm, graphic
Looks like a print from a small risograph press: three spot inks (blue, yellow, red) overprinted on warm paper, halftone dots, slight misregistration. Side view: a long green hill rising to the right, a big yellow sun, red anemones at the top, the captions printed on a paper-white strip.
- **Looks:** tasteful and clear, very "designed picture book". The characters are simple flat shapes with dot eyes; Grandpa reads well, Sami is sweet but small in the wide shots.
- **Weak points:** characters are small in two shots; the side-view figures have little expression; the turn-around is a simple flip.
- **Cost here:** about 1 second per frame; 30 seconds of film in about 8 minutes.

### 1-crayon-world-3d.mp4 (style 85) — interesting, but not for us as made
A 3D world redrawn 12 times a second in wax crayon, like a child's drawing: scribbled green hill, crayon sky, a strip of blank paper at the top for the words.
- **Looks:** it really looks like a child drew it, and the camera moves through the world. But the characters are crude tube figures, mostly seen from behind, faces small or hidden; they look stiff. The last frames cut the two off at the edge of the picture.
- **Cost here:** about 1 second per frame; 30 seconds in about 12 minutes.

### Compared with our rejected attempt (`docs/previews/stage3/`)
The stage 3 drawings are more detailed and have more facial expressions than any of these three. The problem there was the feel: stiff, slightly mannequin-like bodies and flat lighting. **Paper Pop-up is better** than stage 3 for small children: fewer details, but a clear, friendly character design and a real, tactile world. **Risograph is about as good**, in a cleaner, calmer way. **Crayon World is worse**: more naive and less appealing than stage 3.

## 5. What it needs, time and cost

- **Money:** nothing. All free and open-source; no accounts, no paid services were used.
- **Software:** Node 20+, Python 3.11+, ffmpeg 7+ (this machine has 6.1, so a free static ffmpeg 7.0.2 build from johnvansickle.com was used, checksum verified, kept in the scratch folder), and a headless Chrome (installed by the setup script).
- **Machine:** a computer with a graphics card renders the 3D styles many times faster; this cloud machine has none, so Paper Pop-up was rendered at 720p.
- **My time per film:** about 30 to 60 minutes of building and checking per style for a first 30-second scene, because the add-on supplies an engine and a style guide, not finished characters: the characters and every shot are drawn in code for each story.

## 6. Recommendation for StoryTime

**Use it as a style source and engine, not as an all-in-one film maker.** Concretely:
1. Adopt **Paper Pop-up Book** as the lead look for the films (and possibly the book art: the same cut-paper characters on a page). It fits a story library: every story becomes "a book that opens", which is the brand without any single story's look becoming the brand.
2. Keep **Risograph** as the second option if the owner prefers a flatter, calmer, more graphic look.
3. Do not use Crayon World 3D for our characters.
4. Before committing: design Sami and Grandpa properly as a cut-paper model sheet (more poses, 3 to 4 walk drawings, a front view), render one A04 shot at full quality, and check it on an iPhone. That is the next step if the owner likes this direction.

Files made for this test live outside the project (scratch folder); only the previews above were added to the repository.
