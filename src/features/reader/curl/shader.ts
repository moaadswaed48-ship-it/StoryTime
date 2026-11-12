/**
 * The whole book is drawn by one full-screen triangle. For every pixel the fragment shader asks which
 * sheet of paper is on top there: the back of the turning leaf (folded over, or on the upper half of the
 * roll), its front (flat, or climbing the roll), or the pages lying underneath, and lights it.
 * No mesh, so the silhouette and the shading are exact at any size and the per-frame CPU work is a
 * handful of uniforms. Written in GLSL ES 1.00 so it runs on WebGL 1 and 2.
 */
export const VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

export const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;      // canvas size, px
uniform vec2 uPage;     // one page, px
uniform vec2 uSpine;    // top end of the spine, px from the canvas's top-left
uniform float uFlip;    // +1: free edge to the right of the spine; -1: mirrored (right-to-left book)
uniform float uSpread;  // 1 when the far page (other side of the spine) is shown
uniform float uOn;      // 1 while a leaf is in the air
uniform vec3 uCyl;      // axis point x, y and radius (leaf frame)
uniform vec2 uN;        // unit normal of the axis, towards the curled side
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform sampler2D uUnder;
uniform sampler2D uFar;
uniform vec4 uHas;      // front, back, under, far: 1 when that page exists
uniform float uGhost;   // 1: one-page book, the back of the leaf shows the front faintly, mirrored
uniform vec3 uPaper;
uniform vec4 uHoleNear; // window in the near page (uv x0, y0, x1, y1) that shows the film underneath
uniform vec4 uHoleFar;
uniform vec2 uHoleMix;  // how open each window is

const float PI = 3.14159265;

float sdPage(vec2 q) {
  vec2 h = uPage * 0.5;
  vec2 d = abs(q - h) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float cover(float sd) {
  return clamp(0.5 - sd, 0.0, 1.0);
}
// Leaf coordinates to texture coordinates. Pages are painted the way they are read, so a mirrored book flips u.
vec2 uvNear(vec2 q) {
  float u = q.x / uPage.x;
  return vec2(uFlip > 0.0 ? u : 1.0 - u, q.y / uPage.y);
}
vec2 uvFar(vec2 q) {
  float u = 1.0 - q.x / uPage.x;
  return vec2(uFlip > 0.0 ? u : 1.0 - u, q.y / uPage.y);
}
float inside(vec2 uv, vec4 box) {
  vec2 a = step(box.xy, uv) * step(uv, box.zw);
  return a.x * a.y;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 c = vec2((px.x - uSpine.x) * uFlip, px.y - uSpine.y);

  float r = max(uCyl.z, 0.01);
  vec2 n = uN;
  float d = uOn > 0.5 ? dot(c - uCyl.xy, n) : -1.0;
  float phi = asin(clamp(d / r, 0.0, 1.0));

  // Which point of the leaf could be here: on its front (flat or lower half of the roll) ...
  float kF = d <= 0.0 ? 0.0 : r * phi - d;
  vec2 qF = c + n * kF;
  // ... and on its back (upper half of the roll, or folded flat on top).
  float kB = d <= 0.0 ? PI * r - 2.0 * d : r * (PI - phi) - d;
  vec2 qB = c + n * kB;

  float rim = uOn > 0.5 ? clamp(r - d + 0.5, 0.0, 1.0) : 1.0;
  float sdB = sdPage(qB);
  float aF = cover(sdPage(qF)) * rim * uHas.x;
  float aB = cover(sdB) * rim * uOn;

  // Every page is sampled every time: lookups inside branches would break the mip selection.
  vec3 tFront = texture2D(uFront, uvNear(qF)).rgb;
  vec3 tBack = texture2D(uBack, uGhost > 0.5 ? uvNear(qB) : uvFar(qB)).rgb;
  vec3 tUnder = texture2D(uUnder, uvNear(c)).rgb;
  vec2 cFar = vec2(-c.x, c.y);
  vec2 farUv = uvFar(cFar);
  vec3 tFar = texture2D(uFar, farUv).rgb;

  float aNear = cover(sdPage(c));
  float aFar = cover(sdPage(cFar)) * uSpread * uHas.w;

  // The gutter: both pages sink into the binding. One-page books only get a soft shade at the bound edge.
  float ax = abs(c.x);
  float gutter = uSpread > 0.5
    ? 1.0 - 0.30 * exp(-ax / (0.016 * uPage.x)) - 0.10 * exp(-ax / (0.085 * uPage.x))
    : 1.0 - 0.07 * exp(-ax / (0.03 * uPage.x));
  // The far edge of each page falls away a little, as a page block does.
  float edge = uSpread > 0.5 ? 1.0 - 0.05 * smoothstep(0.86, 1.0, ax / uPage.x) : 1.0;
  float flatLight = gutter * edge;

  // Shadow the leaf throws on whatever lies below it: soft, and wider the higher the paper is.
  float lift = smoothstep(0.0, 14.0, r) * uOn;
  // (Every exponent below is kept at or under zero: a huge one overflows, and infinity times a zero weight is NaN, which paints black.)
  float away = max(sdB, 0.0) + max(d - r, 0.0);
  float shadow = lift * 0.40 * exp(-away / (1.15 * r + 6.0));
  // A tighter contact shadow right at the roll, so the paper reads as touching the page there.
  shadow += lift * 0.26 * exp(-away / (0.2 * r + 1.5));

  // 1. the pages underneath
  vec3 col = tUnder * uHas.z;
  float alpha = aNear * uHas.z;
  col = mix(col, tFar, aFar);
  alpha = max(alpha, aFar);
  float light = flatLight * (1.0 - shadow);

  // 2. the front of the leaf: flat, then darkening as it climbs away from the light
  float climb = sin(phi);
  float frontLight = mix(flatLight, 1.0, clamp(d / r, 0.0, 1.0)) * (1.0 - 0.42 * climb * climb) * (1.0 - shadow);
  col = mix(col, tFront, aF);
  light = mix(light, frontLight, aF);
  alpha = max(alpha, aF);

  // 3. the back of the leaf: paper seen from behind, bright along the top of the roll, dark where it dives under
  float t = clamp(d / r, 0.0, 1.0);
  vec3 paperBack = uPaper * 0.985;
  vec3 back = uGhost > 0.5 ? mix(paperBack, tBack, 0.13) : mix(paperBack, tBack, uHas.y);
  // Lit from above: the roll is brightest on its crest and falls into shade as it turns edge-on at the rim.
  float facing = sqrt(max(0.0, 1.0 - t * t));
  float roll = 0.34 + 0.66 * pow(facing, 1.15) + 0.07 * exp(-pow((t - 0.3) / 0.2, 2.0)) * lift;
  // Just behind the crest the folded sheet is still settling: a soft valley of shade that fades into the flat part.
  float valley = 1.0 - 0.11 * lift * exp(min(d, 0.0) / (1.6 * r + 2.0));
  // A sheet in the air is clear of the gutter; it sinks into it only as it lands.
  float backFlat = mix(1.0, flatLight, 1.0 - lift);
  float backLight = mix(1.0, roll, lift) * valley * backFlat * (uGhost > 0.5 ? 0.965 : 1.0);
  // A sheet in the air is bowed, not a board: its light falls away gently towards its own edges ...
  backLight *= 1.0 - 0.085 * lift * exp(min(sdB, 0.0) / (1.1 * r + 8.0));
  backLight *= 1.0 + 0.04 * lift * sin(PI * clamp(-d / uPage.x, 0.0, 1.0));
  // ... and a hairline of shade along the edge keeps it distinct from the page it lies on.
  backLight *= 1.0 - 0.10 * lift * smoothstep(-2.5, 0.0, sdB);
  col = mix(col, back, aB);
  light = mix(light, backLight, aB);
  alpha = max(alpha, aB);

  // Windows onto the film playing underneath the canvas (only while the book is at rest).
  float hole = 0.0;
  if (uOn < 0.5) {
    hole = inside(uvNear(c), uHoleNear) * uHoleMix.x * aF;
    hole = max(hole, inside(farUv, uHoleFar) * uHoleMix.y * aFar * (1.0 - aF));
  }

  vec3 rgb = col * light * alpha * (1.0 - hole);
  float a = alpha * ((1.0 - hole) + hole * (1.0 - clamp(light, 0.0, 1.0)));
  gl_FragColor = vec4(rgb, a);
}
`
