// The creature body's skin, per pixel: spots, stripes and patches are evaluated from the rest-pose position
// (so they ride the skin as it bends) with antialiased, crisp edges at any distance, then the baked occlusion from
// the mesher darkens creases softly. Vertex colours keep the part colours, belly and the soft dorsal gradient.
//   aPat  = (pattern mask, occlusion, kind 0 none / 1 spots / 2 stripes / 3 patches, scale)
//   aPatC = (pattern colour rgb, seed 0..1)
export const SKIN = {
	vertexPars: /* glsl */ `
attribute vec4 aPat;
attribute vec4 aPatC;
varying vec3 vRest;
varying vec3 vRestN;
varying vec4 vPat;
varying vec4 vPatC;`,
	vertexBody: /* glsl */ `
	vRest = position;
	vRestN = normal;
	vPat = aPat;
	vPatC = aPatC;`,
	fragmentPars: /* glsl */ `
varying vec3 vRest;
varying vec3 vRestN;
varying vec4 vPat;
varying vec4 vPatC;
vec3 skH3(vec3 p) {
	p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
	return fract(sin(p) * 43758.5453123);
}
float skWorley(vec3 x) {
	vec3 i = floor(x), f = fract(x);
	float d = 9.0;
	for (int k = -1; k <= 1; k++)
		for (int j = -1; j <= 1; j++)
			for (int l = -1; l <= 1; l++) {
				vec3 g = vec3(float(l), float(j), float(k));
				vec3 o = skH3(i + g);
				d = min(d, length(g + o - f));
			}
	return d;
}
float skNoise(vec3 x) {
	vec3 i = floor(x), f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	float a = skH3(i).x, b = skH3(i + vec3(1, 0, 0)).x, c = skH3(i + vec3(0, 1, 0)).x, d = skH3(i + vec3(1, 1, 0)).x;
	float e = skH3(i + vec3(0, 0, 1)).x, g = skH3(i + vec3(1, 0, 1)).x, h = skH3(i + vec3(0, 1, 1)).x, k = skH3(i + vec3(1, 1, 1)).x;
	return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
/** an antialiased step: crisp at any distance, never aliased */
float skEdge(float edge, float v) {
	float w = max(fwidth(v), 1e-4) * 0.9;
	return smoothstep(edge - w, edge + w, v);
}`,
	fragmentBody: /* glsl */ `
	{
		float kind = vPat.z;
		float m = 0.0;
		if (kind > 0.5 && vPat.x > 0.002) {
			vec3 p = vRest / max(0.02, vPat.w) + vPatC.a * 37.0;
			if (kind < 1.5) m = 1.0 - skEdge(0.4, skWorley(p));
			else if (kind < 2.5) {
				float wob = skNoise(p) * 0.9;
				m = skEdge(0.45, sin((p.z + wob) * 3.4558));
			} else {
				float v = skNoise(p * 0.7) + 0.35 * skNoise(p * 1.9 + 9.0);
				m = skEdge(0.8, v);
			}
		}
		diffuseColor.rgb = mix(diffuseColor.rgb, vPatC.rgb, m * clamp(vPat.x, 0.0, 1.0));
		// soft crease occlusion (chins, where parts meet, under the belly)
		diffuseColor.rgb *= mix(0.62, 1.0, vPat.y);
	}`,
};
