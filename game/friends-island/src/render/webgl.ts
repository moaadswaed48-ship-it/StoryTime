// Render path A: classic WebGLRenderer + pmndrs postprocessing (merged effect passes).
import * as THREE from 'three';
import { BlendFunction, BloomEffect, Effect, EffectAttribute, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import type { QualityName } from '../config';
import { FlatProbe, TIERS, type Tier } from './common';
import { GRADE_FRAGMENT } from './grade.glsl';
import { defaultGrade, type ParticleMaterialOptions, type RenderPath } from './types';

class GradeEffect extends Effect {
	constructor() {
		super('GradeEffect', GRADE_FRAGMENT, {
			attributes: EffectAttribute.CONVOLUTION,
			uniforms: new Map<string, THREE.Uniform>([
				['tBloom', new THREE.Uniform(null)],
				['uBloomOn', new THREE.Uniform(1)],
				['uBloomStrength', new THREE.Uniform(0.16)],
				['uBloomTint', new THREE.Uniform(new THREE.Vector3(1, 0.82, 0.6))],
				['uWB', new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
				['uExposure', new THREE.Uniform(1)],
				['uSat', new THREE.Uniform(1)],
				['uSplitHi', new THREE.Uniform(new THREE.Vector3())],
				['uSplitLo', new THREE.Uniform(new THREE.Vector3())],
				['uCurve', new THREE.Uniform(0)],
				['uVignette', new THREE.Uniform(0)],
				['uCA', new THREE.Uniform(0)],
				['uFlash', new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
				['uFlashAmt', new THREE.Uniform(0)],
			]),
		});
	}
}

/** pmndrs mipmap bloom and three's BloomNode differ in energy; this matches them by eye. */
const BLOOM_SCALE = 2.2;

export async function createWebGLPath(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera): Promise<RenderPath> {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: false,
		stencil: false,
		depth: false,
		powerPreference: 'high-performance',
	});
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	renderer.info.autoReset = false;
	// Shader error checks force a synchronous status query per program, which defeats parallel compile
	// (KHR_parallel_shader_compile) and prints ANGLE's X4122 warnings. Keep them for dev and ?debug only.
	renderer.debug.checkShaderErrors = import.meta.env.DEV || location.search.includes('debug');

	const grade = defaultGrade();
	let tier: Tier = TIERS.high;
	const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: tier.msaa });
	const renderPass = new RenderPass(scene, camera);
	const bloom = new BloomEffect({
		blendFunction: BlendFunction.DST, // computed but not composited: GradeEffect adds it, tinted (halation)
		mipmapBlur: true,
		luminanceThreshold: grade.bloom.threshold,
		luminanceSmoothing: 0.08,
		intensity: 1,
		radius: grade.bloom.radius,
	});
	const gradeFx = new GradeEffect();
	gradeFx.uniforms.get('tBloom')!.value = bloom.texture;
	composer.addPass(renderPass);
	composer.addPass(new EffectPass(camera, bloom, gradeFx));

	const u = (k: string) => gradeFx.uniforms.get(k)!;
	const probe = new FlatProbe();

	const path: RenderPath = {
		kind: 'webgl',
		backend: 'WebGL2 (WebGLRenderer + pmndrs postprocessing)',
		canvas,
		renderer,
		grade,
		setSize(w, h, pr) {
			renderer.setPixelRatio(pr);
			renderer.setSize(w, h, false);
			composer.setSize(w, h, false);
		},
		setQuality(q: QualityName) {
			tier = TIERS[q];
			composer.multisampling = tier.msaa;
		},
		setCamera(cam) {
			renderPass.mainCamera = cam;
			composer.setMainCamera(cam);
		},
		setScene(sc) {
			renderPass.mainScene = sc;
			composer.setMainScene(sc);
		},
		render(dt) {
			renderer.info.reset();
			const g = grade;
			u('uBloomOn').value = g.bloom.enabled && tier.bloom ? 1 : 0;
			u('uBloomStrength').value = g.bloom.strength * BLOOM_SCALE;
			(u('uBloomTint').value as THREE.Vector3).fromArray(g.bloom.tint);
			(u('uWB').value as THREE.Vector3).fromArray(g.whiteBalance);
			u('uExposure').value = g.exposure;
			u('uSat').value = g.saturation;
			(u('uSplitHi').value as THREE.Vector3).fromArray(g.splitHighlights);
			(u('uSplitLo').value as THREE.Vector3).fromArray(g.splitShadows);
			u('uCurve').value = g.curve;
			u('uVignette').value = g.vignette;
			u('uCA').value = (tier.aberration ? g.aberration : 0) + g.aberrationPulse;
			(u('uFlash').value as THREE.Vector3).fromArray(g.flash);
			u('uFlashAmt').value = g.flashAmount;
			bloom.luminanceMaterial.threshold = g.bloom.threshold;
			bloom.mipmapBlurPass.radius = g.bloom.radius;
			composer.render(dt);
			probe.afterRender(canvas);
		},
		async compile(sc, cam) {
			await renderer.compileAsync(sc, cam);
			composer.render(0);
		},
		particleMaterial(o: ParticleMaterialOptions) {
			const m = new THREE.MeshBasicMaterial({
				map: o.map,
				transparent: true,
				depthWrite: false,
				depthTest: o.depthTest ?? true,
				blending: o.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
				toneMapped: false,
			});
			m.onBeforeCompile = (s) => {
				s.vertexShader = `attribute float aAlpha;\nvarying float vAlpha;\n${s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvAlpha = aAlpha;')}`;
				s.fragmentShader = `varying float vAlpha;\n${s.fragmentShader.replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n\tdiffuseColor.a *= vAlpha;')}`;
			};
			m.customProgramCacheKey = () => 'patch-particle-alpha';
			return m;
		},
		envFromScene(sc, position = [0, 2, 0], size = 128) {
			const pmrem = new THREE.PMREMGenerator(renderer);
			const rt = pmrem.fromScene(sc, 0.02, 0.1, 200, { size, position: new THREE.Vector3(...position) });
			pmrem.dispose();
			return rt.texture;
		},
		stats() {
			return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
		},
		isFlat() {
			return probe.request();
		},
	};
	return path;
}
