# Story content format (the contract between the Story Room, the Studio and the site)

One folder per story: `content/stories/<id>/` (`<id>` is the outline id in lowercase, e.g. `a04`).
Text is never baked into pictures. Pictures carry no words, so one picture serves all four languages.

## `story.json` (language-neutral; written by the Story Room, pictures added by the Studio)
```jsonc
{
  "id": "a04",
  "ageGroups": ["2-3"],                // one or more of "2-3", "4-5", "6-8"
  "owner": "storytime",                // or "author" for the author's own story
  "lesson": "one line, English, internal",
  "cast": ["sami", "sami-grandpa"],    // character sheet ids (sheets live in content/stories/<id>/cast.json)
  "pages": [
    {
      "n": 1,
      "art": "What the picture shows: place, light, who, what they do, the feeling. English, for the Studio.",
      "zone": { "side": "start", "v": "bottom", "size": "m" },
      // where the calm area for words sits: side "start" | "end" | "full" (start = right in Arabic and Hebrew),
      // v "top" | "middle" | "bottom", size "s" | "m" | "l". The layout mirrors by direction; the art does not flip.
      "image": null                    // filled by the Studio export: path of the rendered picture
    }
  ],
  "film": {
    "targetSeconds": 150,
    "shots": [
      {
        "n": 1,
        "page": 1,                     // which book page this shot grows from (or null)
        "action": "What moves and how the camera moves. English, for the Studio.",
        "sound": ["footsteps on gravel", "a bee"],
        "lines": ["f01", "f02"]        // ids of film lines spoken during this shot
      }
    ]
  },
  "activity": {
    "minutes": 10,
    "materials": ["cushion", "plastic cup"],   // internal ids, English
    "steps": [ { "n": 1, "picture": "What the instruction picture shows. English.", "loop": false } ],
    "checkedAgainst": "docs/story-room/age-2-3.md safety list, date"
  }
}
```

## `<lang>.json` for `ar`, `he`, `en`, `da` (written natively per language, same shape in all four)
```jsonc
{
  "title": "…",
  "names": { "sami": "…", "sami-grandpa": "…" },
  "pages": [
    { "n": 1, "text": "What the reader sees.", "speech": "What the future voice reads." }
    // Arabic and Hebrew: "text" carries the light vowel marks, "speech" the full marks. English and Danish: the
    // two are the same unless a word needs a pronunciation hint.
  ],
  "film": [
    { "id": "f01", "speaker": "narrator", "text": "…", "speech": "…", "emotion": "warm, slow" }
    // speaker is "narrator" or a cast id. The film script is its own text, not a copy of the book.
    // Captions on screen are the "text" of the line being spoken.
  ],
  "activity": {
    "title": "…",
    "goal": "One line: what the child learns.",
    "materials": ["…"],
    "steps": [ { "n": 1, "caption": "Very short. FAQ tone." } ],
    "safety": "One or two plain lines.",
    "forAdult": "The whole idea explained to the parent or teacher: why this activity, what to watch for, how to make it easier or harder.",
    "inClass": "How a teacher does it with a group."
  }
}
```

## Rules
- All four language files have identical `pages[].n`, `film[].id` and `activity.steps[].n`.
- The author's own story has only `ar.json`, with `text` byte-identical to her manuscript and no `speech` marks added.
- Nothing in these files may be shown to a signed-out or lapsed account; they are loaded through the data layer.
