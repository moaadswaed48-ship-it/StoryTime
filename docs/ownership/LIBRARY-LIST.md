# Code libraries in StoryTime, with their licences (generated)

**Generated on 2026-11-25 by `node docs/ownership/make-licence-list.mjs` from `package-lock.json`.**
Do not edit by hand: run the script again after any library is added, removed or updated.
Plain-language explanation of what each licence asks: `docs/ownership/THIRD-PARTY-LICENCES.md`.

- **Production** = libraries the site needs to run (some reach the visitor's browser; some are tools that only
  run on our side, for example the email preview tool inside `react-email`).
- **Development** = tools used only to build and test the site; none is sent to visitors.
- "Brought in by" names the library we chose directly in `package.json` that pulls this one in.

## Production (229 libraries)

| Licence | Libraries | Permissive? |
|---|---|---|
| MIT | 191 | yes |
| Apache-2.0 | 6 | yes |
| BlueOak-1.0.0 | 6 | yes |
| BSD-2-Clause | 6 | yes |
| 0BSD | 5 | yes |
| BSD-3-Clause | 5 | yes |
| ISC | 5 | yes |
| GSAP Standard "no charge" licence (not open source) | 2 | **NO: see note** |
| Unlicense | 1 | yes |
| CC0-1.0 | 1 | yes |
| (MIT OR CC0-1.0) | 1 | yes |
| **Total** | **229** | |

#### MIT (191)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @babel/code-frame | 7.29.7 | @react-router/dev, react-email |
| @babel/generator | 7.29.15 | @react-router/dev, react-email |
| @babel/helper-globals | 7.29.7 | @react-router/dev, react-email |
| @babel/helper-string-parser | 7.29.15 | @react-router/dev, react-email |
| @babel/helper-validator-identifier | 7.29.7 | @react-router/dev, react-email |
| @babel/parser | 7.29.15 | @react-router/dev, react-email |
| @babel/parser | 7.29.2 | react-email |
| @babel/runtime | 7.29.15 | @react-three/drei, @react-three/fiber |
| @babel/template | 7.29.7 | @react-router/dev, react-email |
| @babel/traverse | 7.29.0 | react-email |
| @babel/types | 7.29.15 | @react-router/dev, react-email |
| @esbuild/aix-ppc64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/android-arm (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/android-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/android-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/darwin-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/darwin-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/freebsd-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/freebsd-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-arm (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-ia32 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-loong64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-mips64el (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-ppc64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-riscv64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-s390x (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/linux-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/netbsd-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/netbsd-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/openbsd-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/openbsd-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/openharmony-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/sunos-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/win32-arm64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/win32-ia32 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @esbuild/win32-x64 (optional, one computer type only) | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| @jridgewell/gen-mapping | 0.3.13 | @react-router/dev, @tailwindcss/vite, react-email |
| @jridgewell/resolve-uri | 3.1.3 | @react-router/dev, @tailwindcss/vite, react-email, vitest |
| @jridgewell/sourcemap-codec | 1.6.0 | @react-router/dev, @tailwindcss/vite, react-email, vitest |
| @jridgewell/trace-mapping | 0.3.31 | @react-router/dev, @tailwindcss/vite, react-email, vitest |
| @monogrid/gainmap-js | 3.7.3 | @react-three/drei |
| @react-email/render | 2.2.0 | @react-email/render, react-email |
| @react-router/node | 8.5.2 | @react-router/dev, @react-router/node |
| @react-three/drei | 10.7.9 | @react-three/drei |
| @react-three/fiber | 9.8.2 | @react-three/drei, @react-three/fiber |
| @remix-run/node-fetch-server | 0.14.2 | @react-router/dev, @react-router/node |
| @remix-run/route-pattern | 0.22.1 | @react-router/dev, @react-router/node, react-router |
| @selderee/plugin-htmlparser2 | 0.12.0 | @react-email/render, react-email |
| @socket.io/component-emitter | 3.1.2 | react-email |
| @supabase/auth-js | 2.119.0 | @supabase/supabase-js |
| @supabase/functions-js | 2.119.0 | @supabase/supabase-js |
| @supabase/phoenix | 0.4.5 | @supabase/supabase-js |
| @supabase/postgrest-js | 2.119.0 | @supabase/supabase-js |
| @supabase/realtime-js | 2.119.0 | @supabase/supabase-js |
| @supabase/storage-js | 2.119.0 | @supabase/supabase-js |
| @supabase/supabase-js | 2.119.0 | @supabase/supabase-js |
| @tweenjs/tween.js | 23.1.3 | @react-three/drei, @types/three |
| @types/cors | 2.8.19 | react-email |
| @types/draco3d | 1.4.10 | @react-three/drei |
| @types/node | 26.6.6 | @react-router/dev, @tailwindcss/vite, @types/node, react-email, vite, vitest |
| @types/offscreencanvas | 2019.7.3 | @react-three/drei |
| @types/react | 19.3.0 | @react-router/dev, @react-router/node, @react-three/drei, @react-three/fiber, @types/react, @types/react-dom, react-router, zustand |
| @types/react-dom | 19.3.0 | @react-router/dev, @react-router/node, @types/react-dom, react-router |
| @types/react-reconciler | 0.28.9 | @react-three/drei, @react-three/fiber |
| @types/stats.js | 0.17.4 | @react-three/drei, @types/three |
| @types/three | 0.187.0 | @react-three/drei, @types/three |
| @types/webxr | 0.5.24 | @react-three/drei, @react-three/fiber, @types/three |
| @types/ws | 8.18.2 | react-email |
| @use-gesture/core | 10.3.1 | @react-three/drei |
| @use-gesture/react | 10.3.1 | @react-three/drei |
| accepts | 1.3.8 | react-email |
| ajv | 8.20.0 | react-email |
| ajv-formats | 3.0.1 | react-email |
| atomically | 2.1.1 | react-email |
| balanced-match | 4.0.4 | react-email |
| base64-js | 1.5.1 | @react-three/drei, @react-three/fiber |
| bidi-js | 1.1.0 | @react-three/drei |
| brace-expansion | 5.0.13 | react-email |
| buffer | 6.0.3 | @react-three/drei, @react-three/fiber |
| camera-controls | 3.1.2 | @react-three/drei |
| chokidar | 5.0.0 | @react-router/dev, react-email |
| citty | 0.2.2 | react-email |
| commander | 13.1.0 | react-email |
| conf | 15.1.0 | react-email |
| cookie | 0.7.2 | react-email |
| cookie-es | 3.1.1 | @react-router/dev, @react-router/node, react-router |
| cors | 2.8.6 | react-email |
| cross-env | 7.0.3 | @react-three/drei |
| cross-spawn | 7.0.6 | @react-three/drei |
| css-tree | 3.2.1 | react-email |
| csstype | 3.2.4 | @react-router/dev, @react-router/node, @react-three/drei, @react-three/fiber, @types/react, @types/react-dom, react-router, zustand |
| debounce | 2.2.0 | react-email |
| debounce-fn | 6.0.0 | react-email |
| debug | 4.4.3 | @react-router/dev, react-email |
| detect-gpu | 5.0.70 | @react-three/drei |
| dom-serializer | 2.0.0 | @react-email/render, react-email |
| dot-prop | 10.2.0 | react-email |
| engine.io | 6.6.12 | react-email |
| engine.io-parser | 5.2.3 | react-email |
| env-paths | 3.0.0 | react-email |
| esbuild | 0.28.2 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| fast-deep-equal | 3.1.3 | react-email |
| fflate | 0.8.3 | @react-three/drei, @types/three |
| fflate | 0.6.11 | @react-three/drei |
| glsl-noise | 0.0.0 | @react-three/drei |
| html-to-text | 10.0.1 | @react-email/render, react-email |
| html5parser | 3.0.0 | @react-email/render, react-email |
| htmlparser2 | 10.1.0 | @react-email/render, react-email |
| iceberg-js | 0.8.1 | @supabase/supabase-js |
| immediate | 3.0.6 | @react-three/drei |
| is-promise | 2.2.2 | @react-three/drei |
| is-unicode-supported | 2.1.0 | react-email |
| its-fine | 2.1.1 | @react-three/drei, @react-three/fiber |
| jiti | 2.6.1 | react-email |
| js-tokens | 4.0.0 | @react-router/dev, react-email |
| jsesc | 3.1.0 | @react-router/dev, react-email |
| json-schema-traverse | 1.0.0 | react-email |
| json5 | 2.2.3 | @react-router/dev, react-email |
| kleur | 3.0.3 | react-email |
| leac | 0.7.0 | @react-email/render, react-email |
| lie | 3.3.0 | @react-three/drei |
| log-symbols | 7.0.1 | react-email |
| maath | 0.10.8 | @react-three/drei |
| marked | 15.0.12 | react-email |
| media-chrome | 4.19.4 | media-chrome |
| meshline | 3.3.1 | @react-three/drei |
| meshoptimizer | 1.1.1 | @react-three/drei, @types/three |
| mime-db | 1.52.0 | react-email |
| mime-db | 1.54.0 | react-email |
| mime-types | 2.1.35 | react-email |
| mime-types | 3.0.2 | react-email |
| mimic-function | 5.0.1 | react-email |
| minimist | 1.2.8 | react-email |
| ms | 2.1.3 | @react-router/dev, react-email |
| negotiator | 0.6.3 | react-email |
| nypm | 0.6.6 | react-email |
| object-assign | 4.1.1 | react-email |
| parseley | 0.13.1 | @react-email/render, react-email |
| path-key | 3.1.1 | @react-three/drei |
| pathe | 2.0.3 | @react-router/dev, react-email |
| peberminta | 0.10.0 | @react-email/render, react-email |
| picospinner | 3.1.2 | react-email |
| prettier | 3.10.1 | @react-email/render, react-email |
| prismjs | 1.30.0 | react-email |
| prompts | 2.4.2 | react-email |
| react | 19.3.1 | @gsap/react, @react-email/render, @react-router/dev, @react-router/node, @react-three/drei, @react-three/fiber, media-chrome, react, react-dom, react-email, react-router, zustand |
| react-dom | 19.3.1 | @react-email/render, @react-router/dev, @react-router/node, @react-three/drei, @react-three/fiber, react-dom, react-email, react-router |
| react-email | 6.11.8 | react-email |
| react-router | 8.5.2 | @react-router/dev, @react-router/node, react-router |
| react-use-measure | 2.1.7 | @react-three/drei, @react-three/fiber |
| readdirp | 5.1.1 | @react-router/dev, react-email |
| require-from-string | 2.0.2 | @react-three/drei, react-email |
| scheduler | 0.28.0 | @react-email/render, @react-router/dev, @react-router/node, @react-three/drei, @react-three/fiber, react-dom, react-email, react-router |
| selderee | 0.12.0 | @react-email/render, react-email |
| shebang-command | 2.0.0 | @react-three/drei |
| shebang-regex | 3.0.0 | @react-three/drei |
| sisteransi | 1.0.5 | react-email |
| socket.io | 4.8.4 | react-email |
| socket.io-adapter | 2.5.8 | react-email |
| socket.io-parser | 4.2.7 | react-email |
| stats-gl | 2.4.2 | @react-three/drei |
| stats.js | 0.17.0 | @react-three/drei |
| strip-bom | 3.0.0 | react-email |
| stubborn-fs | 2.0.0 | react-email |
| stubborn-utils | 1.0.2 | react-email |
| suspend-react | 0.1.3 | @react-three/drei, @react-three/fiber |
| tagged-tag | 1.0.0 | react-email |
| tailwindcss | 4.3.5 | @tailwindcss/vite, react-email, tailwindcss |
| three | 0.170.0 | @react-three/drei |
| three | 0.187.0 | @react-three/drei, @react-three/fiber, three |
| three-mesh-bvh | 0.8.3 | @react-three/drei |
| three-stdlib | 2.36.1 | @react-three/drei |
| tinyexec | 1.3.1 | react-email, vitest |
| troika-three-text | 0.52.5 | @react-three/drei |
| troika-three-utils | 0.52.5 | @react-three/drei |
| troika-worker-utils | 0.52.0 | @react-three/drei |
| tsconfig-paths | 4.2.0 | react-email |
| tunnel-rat | 0.1.2 | @react-three/drei |
| uint8array-extras | 1.6.0 | react-email |
| undici-types | 8.9.0 | @react-router/dev, @tailwindcss/vite, @types/node, react-email, vite, vitest |
| use-sync-external-store | 1.7.0 | @react-three/drei, @react-three/fiber, zustand |
| utility-types | 3.11.0 | @react-three/drei |
| vary | 1.1.2 | react-email |
| webgl-constants | 1.1.1 | @react-three/drei |
| webgl-sdf-generator | 1.1.1 | @react-three/drei |
| when-exit | 2.1.5 | react-email |
| ws | 8.21.3 | react-email |
| yoctocolors | 2.2.0 | react-email |
| zustand | 4.5.7 | @react-three/drei |
| zustand | 5.1.0 | @react-three/drei, @react-three/fiber, zustand |

#### Apache-2.0 (6)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @dimforge/rapier3d-compat | 0.12.0 | @react-three/drei, @types/three |
| @mediapipe/tasks-vision | 0.10.17 | @react-three/drei |
| draco3d | 1.5.9 | @react-three/drei |
| hls.js | 1.7.4 | @react-three/drei |
| promise-worker-transferable | 1.0.4 | @react-three/drei |
| typescript | 7.0.2 | @react-router/dev, @react-router/node, typescript |

#### BlueOak-1.0.0 (6)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @isaacs/nonrecursive-glob-match | 1.1.0 | react-email |
| glob | 14.0.6 | react-email |
| lru-cache | 11.5.3 | react-email |
| minimatch | 11.0.9 | react-email |
| minipass | 7.1.3 | react-email |
| path-scurry | 3.0.0 | react-email |

#### BSD-2-Clause (6)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| domelementtype | 2.3.0 | @react-email/render, react-email |
| domhandler | 5.0.3 | @react-email/render, react-email |
| domutils | 3.2.2 | @react-email/render, react-email |
| entities | 4.5.0 | @react-email/render, react-email |
| entities | 7.0.1 | @react-email/render, react-email |
| json-schema-typed | 8.0.2 | react-email |

#### 0BSD (5)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| tslib | 2.8.1 | @supabase/supabase-js |
| tslib | 2.8.1 | @supabase/supabase-js |
| tslib | 2.8.1 | @supabase/supabase-js |
| tslib | 2.8.1 | @supabase/supabase-js |
| tslib | 2.8.1 | @supabase/supabase-js |

#### BSD-3-Clause (5)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| ce-la-react | 0.3.2 | media-chrome |
| deepmerge-ts | 8.0.2 | @react-email/render, react-email |
| fast-uri | 3.1.9 | react-email |
| ieee754 | 1.2.1 | @react-three/drei, @react-three/fiber |
| source-map-js | 1.2.4 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |

#### ISC (5)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| isexe | 2.0.0 | @react-three/drei |
| picocolors | 1.1.1 | @react-router/dev, @tailwindcss/vite, react-email, vite, vitest |
| potpack | 1.0.2 | @react-three/drei |
| semver | 7.8.6 | @react-router/dev, react-email |
| which | 2.0.2 | @react-three/drei |

#### GSAP Standard "no charge" licence (not open source) (2) **FLAG: not a plain permissive licence**

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @gsap/react | 2.1.2 | @gsap/react |
| gsap | 3.15.1 | @gsap/react, gsap |

#### Unlicense (1)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| isbot | 5.2.3 | @react-router/dev, isbot |

#### CC0-1.0 (1)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| mdn-data | 2.27.1 | react-email |

#### (MIT OR CC0-1.0) (1)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| type-fest | 5.10.0 | react-email |


## Development only (144 libraries)

| Licence | Libraries | Permissive? |
|---|---|---|
| MIT | 95 | yes |
| Apache-2.0 | 27 | yes |
| MPL-2.0 | 12 | **NO: see note** |
| ISC | 6 | yes |
| 0BSD | 2 | yes |
| CC-BY-4.0 | 1 | **NO: see note** |
| BlueOak-1.0.0 | 1 | yes |
| **Total** | **144** | |

#### MIT (95)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @babel/compat-data | 7.29.7 | @react-router/dev |
| @babel/core | 7.29.13 | @react-router/dev |
| @babel/helper-compilation-targets | 7.29.13 | @react-router/dev |
| @babel/helper-module-imports | 7.29.7 | @react-router/dev |
| @babel/helper-module-transforms | 7.29.14 | @react-router/dev |
| @babel/helper-validator-option | 7.29.7 | @react-router/dev |
| @babel/helpers | 7.29.15 | @react-router/dev |
| @babel/traverse | 7.29.15 | @react-router/dev |
| @emnapi/core (optional, one computer type only) | 2.0.0-beta.2 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @emnapi/core (optional, one computer type only) | 1.11.3 | @tailwindcss/vite |
| @emnapi/runtime (optional, one computer type only) | 2.0.0-beta.2 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @emnapi/runtime (optional, one computer type only) | 1.11.3 | @tailwindcss/vite |
| @emnapi/wasi-threads (optional, one computer type only) | 2.2.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @emnapi/wasi-threads (optional, one computer type only) | 1.2.3 | @tailwindcss/vite |
| @jridgewell/remapping | 2.3.5 | @react-router/dev, @tailwindcss/vite |
| @napi-rs/wasm-runtime (optional, one computer type only) | 1.2.6 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @napi-rs/wasm-runtime (optional, one computer type only) | 1.2.2 | @tailwindcss/vite |
| @oxc-project/types | 0.156.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @react-router/dev | 8.5.2 | @react-router/dev |
| @rolldown/binding-android-arm-eabi (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-android-arm64 (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-darwin-arm64 (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-darwin-x64 (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-freebsd-x64 (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-arm-gnueabihf (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-arm64-gnu (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-arm64-musl (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-ppc64-gnu (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-s390x-gnu (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-x64-gnu (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-linux-x64-musl (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-openharmony-arm64 (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-wasm32-wasi (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-win32-arm64-msvc (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/binding-win32-x64-msvc (optional, one computer type only) | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @rolldown/pluginutils | 1.1.1 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @tailwindcss/node | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-android-arm64 (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-darwin-arm64 (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-darwin-x64 (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-freebsd-x64 (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-linux-arm-gnueabihf (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-linux-arm64-gnu (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-linux-arm64-musl (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-linux-x64-gnu (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-linux-x64-musl (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-wasm32-wasi (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-win32-arm64-msvc (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/oxide-win32-x64-msvc (optional, one computer type only) | 4.3.5 | @tailwindcss/vite |
| @tailwindcss/vite | 4.3.5 | @tailwindcss/vite |
| @tybys/wasm-util (optional, one computer type only) | 0.10.3 | @tailwindcss/vite |
| @tybys/wasm-util (optional, one computer type only) | 0.10.5 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| @types/chai | 5.2.3 | vitest |
| @types/deep-eql | 4.0.2 | vitest |
| @types/estree | 1.0.10 | vitest |
| @vitest/mocker | 5.1.1 | vitest |
| @vitest/spy | 5.1.1 | vitest |
| assertion-error | 2.0.1 | vitest |
| babel-dead-code-elimination | 1.0.12 | @react-router/dev |
| browserslist | 4.29.6 | @react-router/dev |
| chai | 6.3.0 | vitest |
| confbox | 0.3.2 | @react-router/dev |
| convert-source-map | 2.0.0 | @react-router/dev |
| dedent | 1.7.2 | @react-router/dev |
| enhanced-resolve | 5.27.0 | @tailwindcss/vite |
| es-module-lexer | 2.3.2 | @react-router/dev, vitest |
| escalade | 3.2.0 | @react-router/dev |
| estree-walker | 3.0.3 | vitest |
| exit-hook | 5.1.0 | @react-router/dev |
| exsolve | 1.2.0 | @react-router/dev |
| fdir | 6.5.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| fsevents (optional, one computer type only) | 2.3.3 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| gensync | 1.0.0-beta.2 | @react-router/dev |
| jiti | 2.7.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lodash | 4.18.1 | @react-router/dev |
| magic-string | 1.4.5 | @tailwindcss/vite, vitest |
| nanoid | 3.3.20 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| node-releases | 2.0.65 | @react-router/dev |
| obug | 3.0.0 | vitest |
| p-map | 7.1.1 | @react-router/dev |
| picomatch | 4.0.7 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| pkg-types | 2.4.0 | @react-router/dev |
| postcss | 8.5.33 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| react-refresh | 0.18.0 | @react-router/dev |
| rolldown | 1.2.19 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| std-env | 4.3.0 | vitest |
| tapable | 2.3.4 | @tailwindcss/vite |
| tinybench | 6.2.4 | vitest |
| tinyglobby | 0.2.17 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| update-browserslist-db | 1.4.0 | @react-router/dev |
| valibot | 1.5.0 | @react-router/dev |
| vite | 8.3.8 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| vitest | 5.1.1 | vitest |
| why-is-node-running | 3.2.1 | vitest |

#### Apache-2.0 (27)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| @electric-sql/pglite | 0.5.15 | @electric-sql/pglite |
| @playwright/test | 1.63.0 | @playwright/test |
| @typescript/typescript-aix-ppc64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-darwin-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-darwin-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-freebsd-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-freebsd-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-arm (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-loong64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-mips64el (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-ppc64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-riscv64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-s390x (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-linux-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-netbsd-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-netbsd-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-openbsd-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-openbsd-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-sunos-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-win32-arm64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| @typescript/typescript-win32-x64 (optional, one computer type only) | 7.0.2 | @react-router/dev, @react-router/node, typescript |
| baseline-browser-mapping | 2.11.39 | @react-router/dev |
| detect-libc | 2.1.2 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| expect-type | 1.4.0 | vitest |
| playwright | 1.63.0 | @playwright/test |
| playwright-core | 1.63.0 | @playwright/test |

#### MPL-2.0 (12) **FLAG: not a plain permissive licence**

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| lightningcss | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-android-arm64 (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-darwin-arm64 (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-darwin-x64 (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-freebsd-x64 (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-linux-arm-gnueabihf (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-linux-arm64-gnu (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-linux-arm64-musl (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-linux-x64-gnu (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-linux-x64-musl (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-win32-arm64-msvc (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |
| lightningcss-win32-x64-msvc (optional, one computer type only) | 1.33.0 | @react-router/dev, @tailwindcss/vite, vite, vitest |

#### ISC (6)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| electron-to-chromium | 1.5.492 | @react-router/dev |
| lru-cache | 5.1.1 | @react-router/dev |
| semver | 6.3.2 | @react-router/dev |
| semver | 6.3.2 | @react-router/dev |
| signal-exit | 4.1.0 | @react-router/dev |
| yallist | 3.1.1 | @react-router/dev |

#### 0BSD (2)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| tslib (optional, one computer type only) | 2.8.1 | @tailwindcss/vite |
| tslib (optional, one computer type only) | 2.9.1 | @react-router/dev, @tailwindcss/vite, vite, vitest |

#### CC-BY-4.0 (1) **FLAG: not a plain permissive licence**

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| caniuse-lite | 1.0.30001826 | @react-router/dev |

#### BlueOak-1.0.0 (1)

| Library | Version | Brought in by (our direct dependency) |
|---|---|---|
| graceful-fs | 4.2.12 | @tailwindcss/vite |

