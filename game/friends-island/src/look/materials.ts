// Stylised lighting for the whole game, written as patches onto three's MeshLambertMaterial (WebGL path).
// The recipe follows MeshDefaultMaterial in Bruno Simon's folio-2025 (MIT): a smoothstep core shadow instead of Lambert's falloff,
// shadows tinted from each surface's own colour (never grey), ground bounce on downward faces, fog last.
// Creatures add a glossy toon highlight, a sky rim light and a warm subsurface band at the terminator.
import * as THREE from 'three';

/** Uniforms shared by every patched material (one object each, so updating .value updates all). */
export const U = {
	uTime: { value: 0 },
	uSunColor: { value: new THREE.Color(1, 0.95, 0.85) },
	uSunIntensity: { value: 1.0 },
	uShadowTint: { value: new THREE.Color(0.56, 0.6, 0.86) },
	uSkyColor: { value: new THREE.Color(0.55, 0.75, 1.0) },
	uBounceColor: { value: new THREE.Color(0.35, 0.55, 0.15) },
	uRimColor: { value: new THREE.Color(0.85, 0.93, 1.0) },
	// contact map: top-down occupancy around the camera focus (contact shadows, grass parting)
	uContact: { value: null as THREE.Texture | null },
	uContactCenter: { value: new THREE.Vector2() },
	uContactSize: { value: 64 },
	// terrain height map (grass, water)
	uHeight: { value: null as THREE.Texture | null },
	uHeightOrigin: { value: new THREE.Vector2(-110, -110) },
	uHeightSize: { value: 220 },
	uWind: { value: new THREE.Vector2(1, 0.35) },
	uFocus: { value: new THREE.Vector2() },
	/** 0 day .. 1 night (sky, stars) */
	uNight: { value: 0 },
};

const PARS = /* glsl */ `
varying vec3 vViewPosition;
struct LambertMaterial { vec3 diffuseColor; float specularStrength; };
float tNdl = 1.0;
vec3 tLight = vec3(0.0);
vec3 tDir = vec3(0.0, 1.0, 0.0);
vec3 tNormal = vec3(0.0, 1.0, 0.0);
vec3 tView = vec3(0.0, 0.0, 1.0);
vec3 tAmbient = vec3(0.0);
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	tNdl = dot( geometryNormal, directLight.direction );
	tLight = directLight.color;
	tDir = directLight.direction;
	tNormal = geometryNormal;
	tView = geometryViewDir;
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	tAmbient += irradiance;
}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uShadowTint;
uniform vec3 uSkyColor;
uniform vec3 uBounceColor;
uniform vec3 uRimColor;
uniform sampler2D uContact;
uniform vec2 uContactCenter;
uniform float uContactSize;
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
float tLum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 tSat(vec3 c, float s) { float l = tLum(c); return max(vec3(0.0), mix(vec3(l), c, s)); }
float contactAO(vec3 wp) {
	vec2 uv = (wp.xz - uContactCenter) / uContactSize + 0.5;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
	vec4 c = texture2D(uContact, uv);
	// fade with height above the ground the blob was drawn at
	float h = max(0.0, wp.y - c.g);
	return c.r * (1.0 - smoothstep(0.0, 0.6, h));
}
`;

/** One finish for every creature part (body, limbs, blobs, lids), so parts read as one body. */
export const CREATURE_FINISH = { gloss: 0.85, rim: 0.3, sss: 0.1, edge: [-0.32, 0.5] as [number, number], satin: true };

export interface ToonOptions {
	/** glossy toon highlight strength (creatures ~1, world 0) */
	gloss?: number;
	/** sky rim strength */
	rim?: number;
	/** warm subsurface band strength */
	sss?: number;
	/** receive contact shadows from the contact map */
	contact?: boolean;
	/** core shadow softness: smoothstep edges on N.L */
	edge?: [number, number];
	/** extra GLSL in the vertex shader after begin_vertex (may edit `transformed`) */
	vertexBody?: string;
	vertexPars?: string;
	/** extra GLSL in the fragment shader before shading (may edit diffuseColor) */
	fragmentBody?: string;
	fragmentPars?: string;
	/** treat normals as pointing up for lighting (grass, flowers) */
	flatUp?: boolean;
	/** satin creature finish: one soft, controlled highlight instead of a big glossy toon spot */
	satin?: boolean;
	/** extra uniforms */
	uniforms?: Record<string, { value: unknown }>;
	key: string;
}

/** A MeshLambertMaterial patched with the stylised shading. Works with skinning, instancing and vertex colours. */
export function toonMaterial(params: THREE.MeshLambertMaterialParameters, o: ToonOptions): THREE.MeshLambertMaterial {
	const m = new THREE.MeshLambertMaterial(params);
	const gloss = (o.gloss ?? 0).toFixed(3);
	const rim = (o.rim ?? 0).toFixed(3);
	const sss = (o.sss ?? 0).toFixed(3);
	const [e0, e1] = o.edge ?? [-0.1, 0.25];
	m.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, U, o.uniforms ?? {});
		s.vertexShader = s.vertexShader
			.replace(
				'#include <common>',
				`#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;\nuniform float uTime;\nuniform sampler2D uContact;\nuniform vec2 uContactCenter;\nuniform float uContactSize;\nuniform sampler2D uHeight;\nuniform vec2 uHeightOrigin;\nuniform float uHeightSize;\nuniform vec2 uWind;\nuniform vec2 uFocus;\n${o.vertexPars ?? ''}`,
			)
			.replace('#include <begin_vertex>', `#include <begin_vertex>\n${o.vertexBody ?? ''}`)
			.replace(
				'#include <project_vertex>',
				`#include <project_vertex>
	{
		vec4 wp = vec4(transformed, 1.0);
		#ifdef USE_BATCHING
			wp = batchingMatrix * wp;
		#endif
		#ifdef USE_INSTANCING
			wp = instanceMatrix * wp;
		#endif
		wp = modelMatrix * wp;
		vWorldPos = wp.xyz;
		vec3 wn = objectNormal;
		#ifdef USE_INSTANCING
			wn = mat3(instanceMatrix) * wn;
		#endif
		vWorldNormal = normalize(mat3(modelMatrix) * wn);
	}`,
			);
		s.fragmentShader = s.fragmentShader
			.replace('#include <lights_lambert_pars_fragment>', `${PARS}\n${o.fragmentPars ?? ''}`)
			.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${o.fragmentBody ?? ''}`)
			.replace(
				'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
				`
	vec3 base = diffuseColor.rgb;
	vec3 N = tNormal;
	float ndl = tNdl;
	${o.flatUp ? 'ndl = dot((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, tDir);' : ''}
	float sunLum = max(1e-4, tLum(uSunColor) * uSunIntensity);
	float shadow = clamp(tLum(tLight) / sunLum, 0.0, 1.0);
	float core = smoothstep(${e0.toFixed(3)}, ${e1.toFixed(3)}, ndl);
	float ao = ${o.contact ? 'contactAO(vWorldPos)' : '0.0'};
	float lit = core * shadow;
	vec3 shadowCol = tSat(base * uShadowTint, 1.25) * (0.75 + 0.25 * clamp(vWorldNormal.y, 0.0, 1.0))${o.satin ? ' * 0.78' : ''};
	vec3 litCol = base * uSunColor * uSunIntensity;
	vec3 col = mix(shadowCol, litCol, lit);
	// sky fill on upward faces, ground bounce on downward faces (folio)
	col += base * uSkyColor * ${o.satin ? '0.08' : '0.12'} * (0.5 + 0.5 * vWorldNormal.y);
	float down = smoothstep(0.1, -0.8, vWorldNormal.y) * (1.0 - smoothstep(0.0, 3.0, vWorldPos.y - 0.0));
	col = mix(col, col + base * uBounceColor * 0.55, down * 0.6);
	${o.satin ? 'col = tSat(col, 1.1);' : ''}
	${
		o.sss
			? `{
		float band = smoothstep(-0.45, 0.05, ndl) * (1.0 - smoothstep(0.05, 0.45, ndl));
		col += tSat(base, 1.6) * vec3(1.0, 0.55, 0.4) * band * ${sss} * (0.35 + 0.65 * shadow);
	}`
			: ''
	}
	${
		o.gloss && o.satin
			? `{
		vec3 H = normalize(tDir + tView);
		float nh = max(dot(N, H), 0.0);
		float spec = pow(nh, 60.0) * 0.3 + smoothstep(0.9935, 0.9985, nh) * 0.16;
		col += uSunColor * spec * shadow * ${gloss};
	}`
			: o.gloss
				? `{
		vec3 H = normalize(tDir + tView);
		float nh = max(dot(N, H), 0.0);
		float spec = smoothstep(0.965, 0.985, nh) * 0.9 + pow(nh, 28.0) * 0.16;
		col += uSunColor * spec * shadow * ${gloss};
	}`
				: ''
	}
	${
		o.rim
			? `{
		float fr = pow(1.0 - clamp(dot(N, tView), 0.0, 1.0), 3.0);
		float up = 0.55 + 0.45 * clamp(vWorldNormal.y + 0.3, 0.0, 1.0);
		col += uRimColor * fr * up * ${rim} * (0.45 + 0.55 * shadow) * (0.6 + 0.4 * tLum(base));
	}`
			: ''
	}
	col *= 1.0 - ao * 0.55;
	vec3 outgoingLight = col + totalEmissiveRadiance;`,
			);
	};
	m.customProgramCacheKey = () => `toon-${o.key}${o.satin ? '-satin' : ''}`;
	return m;
}
