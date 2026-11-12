// The meadow island: terrain, scenery, grass, water, sky, sun, and the contact map that lets the ground and
// grass know where creatures are (soft contact shadows, parting grass, water rings).
import * as THREE from 'three';
import type { WorldQuery } from '../creature/creature';
import { U } from '../look/materials';
import { Grass } from './grass';
import { Scenery } from './scenery';
import { makeSky } from './sky';
import { N, POND, Terrain } from './terrain';
import { makeWater } from './water';

const REPRO_FLIP = typeof location !== 'undefined' && new URLSearchParams(location.search).has('contactflip');

export class World implements WorldQuery {
	readonly root = new THREE.Group();
	readonly terrain = new Terrain();
	readonly scenery: Scenery;
	readonly grass: Grass;
	readonly sun: THREE.DirectionalLight;
	readonly sunDir = new THREE.Vector3(0.48, 0.72, 0.5).normalize();
	readonly sky: THREE.Mesh;
	readonly bounds = new THREE.Box3(new THREE.Vector3(-70, -4, -70), new THREE.Vector3(70, 20, 70));
	// contact map
	readonly contactRT: THREE.WebGLRenderTarget;
	readonly contactScene = new THREE.Scene();
	readonly contactCam: THREE.OrthographicCamera;
	readonly contactBlobs: THREE.InstancedMesh;
	private blobCount = 0;
	readonly contactSize = 64;
	private m = new THREE.Matrix4();
	private c = new THREE.Color();

	constructor() {
		this.scenery = new Scenery(this.terrain);
		this.grass = new Grass();
		this.grass.setGroundColors(this.terrain.colors, N);
		this.root.add(this.terrain.mesh, this.scenery.root, this.grass.mesh);
		this.root.add(makeWater(this.terrain.pondLevel, 'disc', POND.r * 1.25).translateX(POND.x).translateZ(POND.z));
		this.root.add(makeWater(0, 'sea', 900));
		this.sky = makeSky(this.sunDir);
		this.root.add(this.sky);

		this.sun = new THREE.DirectionalLight(0xfff1dc, 1);
		this.sun.castShadow = true;
		this.sun.shadow.mapSize.setScalar(4096);
		this.sun.shadow.bias = -0.0005;
		this.sun.shadow.normalBias = 0.03;
		this.sun.shadow.radius = 2;
		const sc = this.sun.shadow.camera;
		sc.left = -34;
		sc.right = 34;
		sc.top = 34;
		sc.bottom = -34;
		sc.near = 1;
		sc.far = 160;
		this.root.add(this.sun, this.sun.target);
		U.uSunColor.value.set(1.0, 0.94, 0.82);
		U.uSunIntensity.value = 1.08;

		// contact map: soft additive discs drawn top-down; R = occupancy, G = ground height at the disc
		this.contactRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, depthBuffer: false });
		this.contactRT.texture.minFilter = THREE.LinearFilter;
		this.contactRT.texture.magFilter = THREE.LinearFilter;
		this.contactCam = new THREE.OrthographicCamera(-this.contactSize / 2, this.contactSize / 2, this.contactSize / 2, -this.contactSize / 2, 1, 200);
		// looking UP from below with +Z as screen-up, so texture u follows +X and v follows +Z, the same mapping
		// every shader uses ((xz - centre) / size + 0.5). 0.1.0 looked down with -Z up, which mirrored the map in Z:
		// grass parted and shadows sat where no creature was ("invisible creatures").
		this.contactCam.up.set(0, 0, 1);
		this.contactCam.lookAt(0, 1, 0);
		const disc = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
		const mat = new THREE.ShaderMaterial({
			transparent: true,
			side: THREE.DoubleSide,
			depthTest: false,
			depthWrite: false,
			blending: THREE.CustomBlending,
			blendEquation: THREE.MaxEquation,
			blendSrc: THREE.OneFactor,
			blendDst: THREE.OneFactor,
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				varying vec3 vC;
				void main() {
					vUv = uv * 2.0 - 1.0;
					vC = instanceColor;
					gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
				}`,
			fragmentShader: /* glsl */ `
				varying vec2 vUv;
				varying vec3 vC;
				void main() {
					float d = length(vUv);
					float a = (1.0 - smoothstep(0.0, 1.0, d));
					a = a * a * vC.r;
					gl_FragColor = vec4(a, a > 0.001 ? vC.g : -100.0, 0.0, 1.0);
				}`,
		});
		this.contactBlobs = new THREE.InstancedMesh(disc, mat, 2048);
		this.contactBlobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.contactBlobs.setColorAt(0, new THREE.Color());
		this.contactBlobs.frustumCulled = false;
		this.contactScene.add(this.contactBlobs);
		U.uContact.value = this.contactRT.texture;
		U.uContactSize.value = this.contactSize;
	}

	// ---- WorldQuery ----
	private nTmp = new THREE.Vector3();
	ground(x: number, z: number, n?: THREE.Vector3): number {
		const t = this.terrain.heightAt(x, z, n);
		const r = this.scenery.rockHeight(x, z, n ? this.nTmp : undefined);
		if (r > t) {
			if (n) n.copy(this.nTmp);
			return r;
		}
		if (n && r > -Infinity) this.terrain.heightAt(x, z, n);
		return t;
	}
	water(x: number, z: number) {
		return this.terrain.waterDepth(x, z);
	}

	// ---- contact map ----
	beginContacts(focus: THREE.Vector3) {
		this.blobCount = 0;
		const texel = this.contactSize / 512;
		const cx = Math.round(focus.x / texel) * texel,
			cz = Math.round(focus.z / texel) * texel;
		U.uContactCenter.value.set(cx, cz);
		if (REPRO_FLIP) {
			// ?contactflip=1 reproduces 0.1.0's mirrored map (for the before/after proof only)
			this.contactCam.position.set(cx, 50, cz);
			this.contactCam.up.set(0, 0, -1);
		} else {
			this.contactCam.position.set(cx, -50, cz);
			this.contactCam.up.set(0, 0, 1);
		}
		this.contactCam.lookAt(cx, 0, cz);
		this.contactCam.updateMatrixWorld();
	}
	contact(x: number, y: number, z: number, radius: number, strength: number) {
		if (this.blobCount >= 2048) return;
		this.m.makeScale(radius, 1, radius).setPosition(x, 0, z);
		this.contactBlobs.setMatrixAt(this.blobCount, this.m);
		this.contactBlobs.setColorAt(this.blobCount, this.c.setRGB(strength, y, 0));
		this.blobCount++;
	}
	/** Read the contact map back (8-bit copy) for the self-check: R occupancy at a world point, 0..1. */
	readContacts(renderer: THREE.WebGLRenderer): (x: number, z: number) => number {
		const rt = new THREE.WebGLRenderTarget(512, 512, { depthBuffer: false });
		const prev = renderer.getRenderTarget();
		renderer.setRenderTarget(rt);
		renderer.setClearColor(0x000000, 0);
		renderer.clear(true, false, false);
		renderer.render(this.contactScene, this.contactCam);
		const px = new Uint8Array(512 * 512 * 4);
		renderer.readRenderTargetPixels(rt, 0, 0, 512, 512, px);
		renderer.setRenderTarget(prev);
		rt.dispose();
		const cx = U.uContactCenter.value.x,
			cz = U.uContactCenter.value.y;
		// exactly the lookup every shader does: uv = (xz - centre) / size + 0.5 (texture row 0 = v 0)
		return (x: number, z: number) => {
			const u = (x - cx) / this.contactSize + 0.5,
				v = (z - cz) / this.contactSize + 0.5;
			if (u < 0 || v < 0 || u >= 1 || v >= 1) return 0;
			const i = Math.floor(u * 512),
				j = Math.floor(v * 512);
			return px[(j * 512 + i) * 4] / 255;
		};
	}

	renderContacts(renderer: THREE.WebGLRenderer) {
		this.contactBlobs.count = this.blobCount;
		this.contactBlobs.instanceMatrix.needsUpdate = true;
		if (this.contactBlobs.instanceColor) this.contactBlobs.instanceColor.needsUpdate = true;
		const prev = renderer.getRenderTarget();
		const prevClear = renderer.getClearColor(new THREE.Color());
		const prevAlpha = renderer.getClearAlpha();
		renderer.setRenderTarget(this.contactRT);
		renderer.setClearColor(0x000000, 0);
		renderer.clear(true, false, false);
		renderer.render(this.contactScene, this.contactCam);
		renderer.setRenderTarget(prev);
		renderer.setClearColor(prevClear, prevAlpha);
	}

	/** Fit the sun's shadow box around a focus point (snapped to texels so shadows don't swim). */
	fitSun(focus: THREE.Vector3, radius = 30) {
		const sc = this.sun.shadow.camera;
		sc.left = -radius;
		sc.right = radius;
		sc.top = radius;
		sc.bottom = -radius;
		sc.updateProjectionMatrix();
		const texel = (radius * 2) / this.sun.shadow.mapSize.x;
		// snap in light space
		const lightRot = new THREE.Matrix4().lookAt(this.sunDir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
		const inv = lightRot.clone().invert();
		const p = focus.clone().applyMatrix4(inv);
		p.x = Math.round(p.x / texel) * texel;
		p.y = Math.round(p.y / texel) * texel;
		p.applyMatrix4(lightRot);
		this.sun.target.position.copy(p);
		this.sun.position.copy(p).addScaledVector(this.sunDir, 80);
		this.sun.target.updateMatrixWorld();
		this.sun.updateMatrixWorld();
	}

	/** A random spot on open land (not water, not inside an obstacle). */
	randomLand(rand: () => number, near?: THREE.Vector3, radius = 20): THREE.Vector3 {
		for (let i = 0; i < 200; i++) {
			const a = rand() * Math.PI * 2;
			const d = Math.sqrt(rand()) * (near ? radius : this.terrain.islandRadius * 0.75);
			const x = (near?.x ?? 0) + Math.cos(a) * d,
				z = (near?.z ?? 0) + Math.sin(a) * d;
			if (this.isOpen(x, z, 1.0)) return new THREE.Vector3(x, this.ground(x, z), z);
		}
		return new THREE.Vector3(2, this.ground(2, 4), 4);
	}

	isOpen(x: number, z: number, margin: number) {
		if (this.water(x, z) > -0.15) return false;
		if (Math.hypot(x, z) > this.terrain.islandRadius * 0.86) return false;
		for (const o of this.scenery.obstacles) if (o.kind !== 'rock' && Math.hypot(o.x - x, o.z - z) < o.r + margin) return false;
		return true;
	}
}
