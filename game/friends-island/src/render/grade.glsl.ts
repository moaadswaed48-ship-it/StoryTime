// The Pond Line grade as GLSL for pmndrs postprocessing. Mirrors grade in webgpu.ts line for line.
export const GRADE_FRAGMENT = /* glsl */ `
uniform sampler2D tBloom;
uniform float uBloomOn;
uniform float uBloomStrength;
uniform vec3 uBloomTint;
uniform vec3 uWB;
uniform float uExposure;
uniform float uSat;
uniform vec3 uSplitHi;
uniform vec3 uSplitLo;
uniform float uCurve;
uniform float uVignette;
uniform float uCA;
uniform vec3 uFlash;
uniform float uFlashAmt;

// Khronos PBR Neutral (same as three's NeutralToneMapping)
vec3 neutralTM(vec3 color) {
	const float startCompression = 0.8 - 0.04;
	const float desaturation = 0.15;
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max(color.r, max(color.g, color.b));
	if (peak < startCompression) return color;
	float d = 1.0 - startCompression;
	float newPeak = 1.0 - d * d / (peak + d - startCompression);
	color *= newPeak / peak;
	float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
	return mix(color, vec3(newPeak), g);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec2 d = uv - 0.5;
	vec2 off = d * (uCA * 2.0);
	vec3 c = vec3(texture2D(inputBuffer, uv - off).r, inputColor.g, texture2D(inputBuffer, uv + off).b);
	if (uBloomOn > 0.5) c += texture2D(tBloom, uv).rgb * uBloomTint * uBloomStrength;
	c *= uWB;
	c = neutralTM(c * uExposure);
	float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
	c = mix(vec3(l), c, uSat);
	c += uSplitHi * smoothstep(0.35, 1.0, l) + uSplitLo * (1.0 - smoothstep(0.0, 0.5, l));
	vec3 g = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
	g = mix(g, g * g * (3.0 - 2.0 * g), uCurve);
	float v = smoothstep(0.25, 0.9, length(d) * 1.35);
	g *= 1.0 - uVignette * v;
	g = mix(g, uFlash, uFlashAmt);
	outputColor = vec4(pow(max(g, vec3(0.0)), vec3(2.2)), inputColor.a);
}
`;
