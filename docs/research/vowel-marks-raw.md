# Vowel marks (Arabic tashkeel, Hebrew niqqud), auto-vowelling tools, ElevenLabs: raw research (StoryTime)

Research date: 2026-11-22. "[unconfirmed]" = could not verify from a source I could open. Many details came from page fetches summarised by the fetch tool, not from reading full pages: re-check before relying on them.

## 1. Arabic marks (tashkeel) in children's books
Findings with sources:
- Full vowelling helps beginners with pronunciation and word recognition; readers rely on context and morphology more as they gain experience. Review of diacritics and word recognition (via search): https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2022.984340/full (Bin Sawad, Law, Tibi, Boese 2022, scoping review of 16 studies, grades 1-12).
- Same review: two kinds of marks: phonemic (short vowels on letters) and morpho-syntactic (word-final case/mood endings). Shadda is not analysed separately in that review. Evidence is "mixed, small samples". Vowelised texts gave higher comprehension in some grades (grades 5 and 9 in Abu Rabia and Hijjazi 2020) but vowelling slows skilled readers and increases fixations. The review does not examine children's-book practice.
- A study of 1,516 children (grades 1-6) examined how short-vowel marks affect oral reading accuracy and fluency (found via search; paper not opened): https://informahealthcare.com/doi/full/10.1080/17586801.2017.1400493 [exact conclusions unconfirmed].
- Haifa study on reading with vs without short-vowel marks: https://cris.haifa.ac.il/en/publications/reading-arabic-with-the-diacritics-for-short-vowels-vowelised-but/ (title suggests: vowelised but not easier; unopened).
- Meta-synthesis: role of diacritics varies by grade level, word frequency and text type; policy on when to stop vowelling is "largely anecdotal": https://core.ac.uk/download/424776331.pdf (unopened; per search summary).
- Corpus study: diacritics appear mainly where correct reading matters, including children's books, adult-literacy books and learner texts: https://arxiv.org/html/2406.05760v1 ("Arabic Diacritics in the Wild").
- Not found: any publisher or style guide stating a rule per age (e.g. "full for 2-5, partial 6-8"), and anything on shadda specifically or on when case endings (i'rab) are shown. [unconfirmed]
Working convention (my synthesis, NOT a sourced standard; mark for review by a native Arabic children's editor):
- Ages 2-3 and 3-5 (read aloud to the child; adult reads): full tashkeel including shadda, tanwin, sukun; case endings shown on the last letter only if the adult should read them in fusha; many dialect-leaning picture books omit end-case marks while keeping all internal vowels.
- Ages 6-8 (early independent readers): full tashkeel in grade 1-2 style; from about age 7-8 partial: keep shadda, tanwin, and marks that remove ambiguity (e.g. different readings of a word), drop marks on very common words. Rule of thumb that shadda is "always kept" is plausible practice but unsourced.
- Keep the tashkeel layer separate from the plain-text layer so it can be turned off for older readers and fed to TTS.

## 2. Hebrew marks (niqqud) in children's books
- Children first read pointed (vocalised) script and shift gradually to unpointed text by about grade 3. Source: https://cris.iucc.ac.il/en/publications/reading-different-orthographic-structures-in-the-shallow-pointed-/ (Hebrew reading across grades 2/4/6, via search).
- Grade 2: accuracy on vowelised words mediated later reading of unvowelised text; pointed text supports the move to unpointed reading (Schiff 2012, J. Psycholinguistic Research, 126 native speakers grades 2/4/6): https://education.biu.ac.il/en/node/4541
- Niqqud remains in texts for children, new immigrants, poetry and dictionaries: https://en.wikipedia.org/wiki/Ktiv_menuqad (secondary).
- Israeli Ministry of Education document on niqqud (https://meyda.education.gov.il/files/Mazkirut_Pedagogit/HebrewPrimary/learning-teaching/books/nikod.pdf): fetched but the PDF content was compressed and unreadable; saved locally by the tool; NOT read. [unconfirmed]
- No source found for: partial niqqud in children's books by age, or which marks are always kept (e.g. dagesh, shin/sin dots). Dots on shin/sin are necessary to tell sounds apart, so they are commonly kept in "partial" systems [general knowledge, unsourced].
Working convention (synthesis, unsourced): ages 2-3 and 3-5: full niqqud (plus stress marks only if the TTS needs them); ages 6-8: full niqqud in early picture-book text, partial or "ktiv male" with niqqud only on ambiguous words from about age 7-8; keep shin/sin dots, dagesh, vav/yod mater clarifications. Hebrew editor review needed.

## 3. Auto-vowelling tools (second opinion only)
Caveat: GitHub API was blocked in this session, so last-commit dates could not be read. All dates "[not confirmed]".

### Arabic
| Tool | Licence | Offline / API | Reported accuracy | Last update |
|---|---|---|---|---|
| CATT (abjadai/catt) https://github.com/abjadai/catt | Apache-2.0 (repo switched from CC-BY-NC to Apache 2.0, per README) | `pip install catt-tashkeel`; `CATTEncoderOnly` (faster) / `CATTEncoderDecoder` (more accurate); also PyTorch checkpoints and ONNX export, run locally. No hosted API on the page; HF Space demo only. An ONNX mirror exists: https://huggingface.co/TigreGotico/catt-diacritizer | None on the README page. Paper figures not retrieved. | not confirmed (repo shows 20 commits; (c) 2026 footer) |
| Sadeed (misraj-ai) https://github.com/misraj-ai/Sadeed ; paper https://arxiv.org/abs/2504.21635 | Not stated on the repo page; dataset Misraj/Sadeed_Tashkeela is research-only; model-weights licence not found | Repo page gave no run instructions; no HF model name found [unconfirmed]. It is a fine-tuned 1.5B decoder (Kuwain), so GPU is advisable. | 2.4% WER, 1.2% DER on its own benchmark SadeedDiac-25 (1,200 paragraphs, MSA and Classical), per repo | Paper v1 Apr 2025, revised Aug 2025; code date not confirmed |
| Mishkal (linuxscout) https://github.com/linuxscout/mishkal | GPL-3.0 (copyleft: check before bundling in a product) | `pip install mishkal` (release "1.10 Bouira"); `TashkeelClass().tashkeel(text)`; console, GUI, local web server; JSON API example uses tahadz.com (online) | None reported. Rule-based (morphology, syntax, semantics): can be slow and weaker on context | not confirmed (206 commits) |
| libtashkeel (mush42) https://github.com/mush42/libtashkeel (note: NOT thewh1teagle: a guess of mine that was wrong) | MIT per Hugging Face mirror https://huggingface.co/TigreGotico/libtashkeel-diacritizer ; repo licence file not opened | Rust library and CLI; Python wheel must be built locally (no PyPI package found); ONNX model available (fp32 recommended; int8 differs on about 10% of outputs per mirror). Alternative bundle: https://pypi.org/project/text2tashkeel | None found; trained mainly on MSA data | not confirmed |
| Farasa (QCRI/HBKU) https://alt.qcri.org/farasa/ | Research-only; commercial use needs HBKU licence (innovation@hbku.edu.qa); farasapy wrapper is MIT but toolkit is not | Java toolkit; web API/demo at https://farasa.qcri.org/demo/diacritization | Paper: https://aclanthology.org/W17-1302/ (figures not retrieved) | not confirmed |
Also surfaced (not requested): Shakkala, Rababa (interscript/rababa), Hareef (mush42/hareef), TigreGotico rawi models; Tashkeel-v3 (gyoom-sa) 2.85% DER on SadeedDiac-25, Apache-2.0: https://huggingface.co/gyoom-sa/Tashkeel-v3
Product note: Sadeed and CATT are the more accurate neural options; Farasa and Sadeed licences may block commercial use: use only as a second opinion, with a human editor deciding.

### Hebrew
| Tool | Licence | Offline / API | Reported accuracy | Last update |
|---|---|---|---|---|
| Dicta Nakdan https://nakdanpro.dicta.org.il (paper https://arxiv.org/abs/2005.03312) | Free for public use online per ACL 2020 paper; formal licence and API terms not found | Web service; REST API details not confirmed; no offline version confirmed | Own paper: 88.23% word / 95.12% character on a 6,000-word gold set. In the Nakdimon comparison (https://arxiv.org/pdf/2105.05209, table reproduced in https://arxiv.org/pdf/2402.00075) Dicta scored about 94.1 / 94.9 vs Nakdimon about 89.8 / 91.6 (column labels my inference) | not confirmed |
| Phonikud https://github.com/thewh1teagle/phonikud (also PyPI `phonikud`) | Page says code CC BY 4.0; datasets have separate licences (ILSpeech and Saspeech non-commercial). Verify model licence before commercial use | `pip install phonikud phonikud-onnx`, download `phonikud-1.0.int8.onnx` from Hugging Face; runs locally; `add_diacritics(text)` returns niqqud; `phonemize()` gives IPA with stress; useful to feed TTS with phonemes | No figures on page; paper listed as Interspeech 2026 (arXiv link not opened); known limits: formal-sounding niqqud, names wrong | 658 commits; date not confirmed |
| UNIKUD https://github.com/morrisalp/unikud | MIT | PyPI package; `Unikud()` downloads model files on first run (then local); metrics only on DagsHub experiments tab | No figures on page; blog says better on formal text than informal Modern Hebrew: https://towardsdatascience.com/unikud-adding-vowels-to-hebrew-text-with-deep-learning-powered-by-dagshub-56d238e22d3f | 113 commits; date not confirmed |
Also relevant: Nakdimon (https://github.com/elazarg/nakdimon) and D-Nikud (https://arxiv.org/abs/2402.00075).

## 4. ElevenLabs text-to-speech
Official pages used: models https://elevenlabs.io/docs/overview/models ; capabilities https://elevenlabs.io/docs/overview/capabilities/text-to-speech ; best practices https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices ; v4 https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4 ; dialogue https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue ; timestamps https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps ; dialogue timestamps https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps ; pronunciation dictionary https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules ; docs index https://elevenlabs.io/docs/llms.txt

### 4.1 Models and languages (per the models page)
- eleven_v4: Arabic yes, Hebrew yes, Danish yes (90+ languages, 100,000-character limit, multi-speaker dialogue). eleven_v4_turbo: yes/yes/yes (~100 ms, audio tags). eleven_v3: yes/yes/yes (70+ languages, 5,000-character limit, multi-speaker). eleven_v3_conversational: yes/yes/yes. eleven_multilingual_v2: Arabic yes, Hebrew NO, Danish yes (29 languages, most stable for long form). eleven_flash_v2_5: Arabic yes, Hebrew NO, Danish yes. eleven_flash_v2: English only.
- Product consequence: for Hebrew use v4 or v3 only.

### 4.2 Vowel marks and pronunciation
- The official docs I opened say nothing about how Arabic tashkeel or Hebrew niqqud change pronunciation. No credible ElevenLabs-specific report found. [unconfirmed]
- General research: unvowelled Arabic leaves pronunciation under-specified and commercial Arabic TTS still struggles with diacritization (CACM: https://cacm.acm.org/arab-world-regional-special-section/unlocking-the-potential-of-arabic-voice-generation-technologies ; https://arxiv.org/pdf/2311.10771v2.pdf). Hence: test each model with the same sentence with and without marks, and listen with a native speaker. For Hebrew, Phonikud phonemes/IPA may be a more controllable route (IPA in slashes works on v4, below).
- Pronunciation control (best-practices page): IPA inside forward slashes works on Eleven v4 (e.g. /ˌbaɪoʊˈkemɪstri/, include stress marks, results vary by voice). SSML `<phoneme>` tags (CMU Arpabet or IPA) work only with eleven_flash_v2 (English only), so they are of no use for Arabic/Hebrew/Danish. Alias tags (`<lexeme>`/`<alias>` or respelling) are for models without phoneme support such as Multilingual v2. Pronunciation dictionaries (TXT or .PLS upload; API `POST /v1/pronunciation-dictionaries/add-from-rules`) take alias or phoneme (alphabet "ipa") rules; matching is case-sensitive; first matching rule wins. Which models honour dictionaries, and how to attach a dictionary to a TTS call, were not stated on the pages fetched [unconfirmed]; the TTS convert reference likely has a `pronunciation_dictionary_locators` field [unconfirmed].
- v4: SSML not supported; no break tags (v3 and v4); use ellipses/punctuation. Speed and Style sliders are not available in v4 (Stability and Similarity only). Break tags `<break time="1.0s"/>` only on v2 models.

### 4.3 Timestamps
- `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps` returns `audio_base64`, `alignment` and `normalized_alignment`, each with `characters`, `character_start_times_seconds`, `character_end_times_seconds`. Character level only; word timing must be built by grouping characters at spaces. Default model_id eleven_multilingual_v2; use `GET /v1/models` to check models. Supported-model list for v4 not stated [unconfirmed].
- Dialogue: `POST https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps` returns `voice_segments` (voice_id, start/end seconds, character indices, dialogue_input_index) plus the same character alignment; model default eleven_v3; at most 10 unique voices; combined text 2,000 characters or less per request.
- Alternative for word-level timestamps: Scribe speech-to-text models give word timestamps (models page), could re-align generated audio; not tested.
- Note: with Arabic/Hebrew, check that character alignment stays correct when diacritics are present (combining marks may be separate characters in the array) [untested, important for highlighting words as read aloud].

### 4.4 Emotion and multiple voices (newest model, v4)
- Audio tags in square brackets, e.g. [whispering], [shouting], [laughing], [giggling]; tag-following is "not perfect yet"; describe the voice quality; tags work best if the voice's training data contains that delivery; the model may read guidance text aloud, so remove it afterwards. Emotion can also come from narrative context; explicit tags are more predictable.
- Multiple speakers: v4 "handles multi-voice prompts well": label lines with speaker names and give each speaker a distinct voice; or use the Text-to-Dialogue endpoint, one object per turn with its own `voice_id` and `text`; `seed` improves consistency; `audio_effects` adds a scene (API only).
- Cross-language: when the target language differs from the reference voice, v4 aims for fluent speech in the target language rather than keeping the accent.
- Commercial use requires a paid plan (dialogue page).

## 10-line summary
1. Research on Arabic: vowel marks help beginners; evidence for when to drop them is mixed, with no published publisher rule found.
2. Research on Hebrew: children read pointed text first and move to unpointed text by about grade 3.
3. No source gave an age-by-age standard for "full vs partial"; my convention (full for 2-5, partial from 7-8) is unsourced and needs a native editor.
4. Arabic tools: CATT (Apache-2.0, pip, local) and Sadeed (1.2% DER, licence unclear) are the strongest; Mishkal is GPL-3.0; Farasa is research-only.
5. Libtashkeel is mush42's MIT-licensed Rust project with ONNX, not thewh1teagle's.
6. Hebrew tools: Dicta Nakdan is best-reported but web-only; Phonikud (local ONNX, gives phonemes) and UNIKUD (MIT) can run locally.
7. ElevenLabs Hebrew needs v3 or v4 (Multilingual v2 and Flash v2.5 lack Hebrew); Arabic and Danish work in all but Flash v2.
8. IPA in slashes works on v4; SSML phoneme tags work only on the English-only Flash v2; v4 has no SSML or break tags.
9. Timestamps are character-level only (with-timestamps endpoints); build word timings yourself.
10. Emotion: bracket audio tags; multiple voices through Text-to-Dialogue (max 10 voices, 2,000 characters per call).

## Could not verify
- Any publisher/style-guide rule for tashkeel or niqqud by age; shadda and case-ending practice.
- Israeli Ministry niqqud PDF content (unreadable); Hebrew partial-niqqud conventions.
- Last-update dates for every tool (GitHub API blocked); accuracy for CATT, Mishkal, libtashkeel, Farasa, Phonikud, UNIKUD; Sadeed model licence and HF name; Dicta API terms and licence.
- ElevenLabs: effect of tashkeel/niqqud on pronunciation; which models accept pronunciation dictionaries and the locator field; timestamp behaviour with diacritics; whether v4 works with the with-timestamps endpoint.
- Most statements come from fetch-tool summaries of pages, not full reads.
