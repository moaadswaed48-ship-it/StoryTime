# Friends Island (جزيرة الأصدقاء)

The game of the StoryTime children's storybook service. It is a remix of **Wigglewild by Patch** (`blendi/wigglewild`
on patch.gg, version 0.4.3): the code under the MIT licence (see LICENSE), the art and sounds under CC0 1.0 (see
LICENSE-ART). The original notices and credits are kept whole below.

What this remix changed: the fighting half of the game is gone (biting, charging, striking, spitting, the stomping
giant, health, hunger, fainting, hunters); the editor, the Lab and the Meadow sandbox are not part of it; missions,
saved progress, touch controls, Arabic and English text, a friends book and a simple "make your creature" sheet were
added. These changes are released under the same MIT licence.

Sounds of the original that this remix does not ship (they belonged to fights and to the night): amb_night, owl,
hit1-3, chomp, whoosh1-2, spit, splat, growl1-2, yelp, roar, rumble, miss, faint. They are still listed below because
the list is the original's.

Added in this remix:

| What | Licence | Source |
| --- | --- | --- |
| IBM Plex Sans Arabic (weights 500 and 700, Arabic subset), the Arabic typeface | SIL Open Font License 1.1 (LICENSES/IBM-Plex-Sans-Arabic-OFL.txt) | github.com/IBM/plex, packaged by Fontsource |

---

The original credits, unchanged:

# Credits

Wigglewild by Patch. Code MIT (see LICENSE). Art CC0: every creature, tree, rock, flower, the island, the sky,
and all effects are generated in code at load time. Sounds are real recordings, all CC0 (listed below).

## Libraries bundled in this build

| Library | Version | License | Source |
| --- | --- | --- | --- |
| three.js | 0.186.1 | MIT | github.com/mrdoob/three.js |
| postprocessing (pmndrs) | 6.39.5 | Zlib | github.com/pmndrs/postprocessing |

## Techniques, with thanks

- Smooth-min and SDF primitives: Inigo Quilez's articles (iquilezles.org).
- Surface nets: Sarah Gibson; Mikola Lysenko's write-up (0fps.net).
- Gait phases and duty factors: Chris Hecker et al., "Real-time Motion Retargeting to Highly Varied User-Created Morphologies" (SIGGRAPH 2008).
- Second-order motion: t3ssel8r's procedural animation talk.
- Colour: Björn Ottosson's OKLab.

## Sounds (all CC0 1.0, real recordings)

Trimmed, loudness-normalised (one-shots by max momentary loudness, ambience by integrated loudness, -1 dBTP ceiling) and re-encoded for this game; levels are in audio/manifest.json.

- amb_meadow: "Summer afternoon Meadow ATM birds and crickets.wav" by DanGasior (https://freesound.org/people/DanGasior/sounds/414907/), CC0 1.0, via Freesound
- amb_wind: "a gentle breeze, wind 6" by mario1298 (https://freesound.org/people/mario1298/sounds/181255/), CC0 1.0, via Freesound
- step0: "Footstep grass" (Impact Sounds pack) by Kenney (kenney.nl), CC0 1.0
- squeak: "Mice Squeaks" by berboberbo (https://freesound.org/people/berboberbo/sounds/727114/), CC0 1.0, via Freesound
- quack1: "Duck Quack" by gibarroule (https://freesound.org/people/gibarroule/sounds/365133/), CC0 1.0, via Freesound
- croak: "Frog Croaking (UK Common Frog)" by shaunhillyard (https://freesound.org/people/shaunhillyard/sounds/532235/), CC0 1.0, via Freesound
- pop1: "mouthPop_02.wav" by carlSablowEdwards (https://freesound.org/people/carlSablowEdwards/sounds/47498/), CC0 1.0, via Freesound
- pop2: "Pop 01" by LilMati (https://freesound.org/people/LilMati/sounds/506546/), CC0 1.0, via Freesound
- chime: "ANI - Wine Glass - Hard" by ani_music (https://freesound.org/people/ani_music/sounds/198401/), CC0 1.0, via Freesound
- flap: "Beating wings of a pigeon" by gerardcatala (https://freesound.org/people/gerardcatala/sounds/153277/), CC0 1.0, via Freesound
- thump: "Rabbit Thump on Soil" by kessir (https://freesound.org/people/kessir/sounds/386007/), CC0 1.0, via Freesound
- click: "Click" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- select: "Select" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- confirm: "Confirmation" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- quack2: "Duck Quack" by gibarroule (https://freesound.org/people/gibarroule/sounds/365133/), CC0 1.0, via Freesound
- amb_night: "cricket night ambience lebanon pine forest .wav" by The_Sound_Side (https://freesound.org/people/The_Sound_Side/sounds/580353/), CC0 1.0, via Freesound; "TAWNY OWL in calm Environment-natural reverb_4-Channel_44kHz.wav" by BlueDelta (https://freesound.org/people/BlueDelta/sounds/367964/), CC0 1.0, via Freesound
- hit1: "Impact punch heavy" (Impact Sounds) by Kenney (kenney.nl), CC0 1.0
- hit2: "Impact punch heavy" (Impact Sounds) by Kenney (kenney.nl), CC0 1.0
- hit3: "Impact punch heavy" (Impact Sounds) by Kenney (kenney.nl), CC0 1.0
- chomp: "Impact plank medium" (Impact Sounds) by Kenney (kenney.nl), CC0 1.0
- whoosh1: "Draw knife" (RPG Audio) by Kenney (kenney.nl), CC0 1.0
- whoosh2: "Draw knife" (RPG Audio) by Kenney (kenney.nl), CC0 1.0
- spit: "Fish Splashing Release 2.wav" by paulprit (https://freesound.org/people/paulprit/sounds/507093/), CC0 1.0, via Freesound
- splat: "Fish Jumping Splash 2.wav" by paulprit (https://freesound.org/people/paulprit/sounds/507091/), CC0 1.0, via Freesound
- growl1: "Fox Barking" by gadzooks (https://freesound.org/people/gadzooks/sounds/397655/), CC0 1.0, via Freesound
- growl2: "Fox Barking" by gadzooks (https://freesound.org/people/gadzooks/sounds/397655/), CC0 1.0, via Freesound
- yelp: "roe deer.wav" by bruno.auzet (https://freesound.org/people/bruno.auzet/sounds/690392/), CC0 1.0, via Freesound
- roar: "Zombie 2" by Under7dude (freesound.org/s/163439), CC0 1.0, pitched down
- rumble: "Distant Thunder 3" by Fission9 (https://freesound.org/people/Fission9/sounds/581124/), CC0 1.0, via Freesound
- munch: "Impact mining" (Impact Sounds) by Kenney (kenney.nl), CC0 1.0
- tick: "Click" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- good: "Select" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- great: "Confirmation" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- miss: "Error" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- friend: "Confirmation" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
- owl: "TAWNY OWL in calm Environment-natural reverb_4-Channel_44kHz.wav" by BlueDelta (https://freesound.org/people/BlueDelta/sounds/367964/), CC0 1.0, via Freesound
- faint: "Error" (Interface Sounds) by Kenney (kenney.nl), CC0 1.0
