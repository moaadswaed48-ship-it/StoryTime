// Third-person camera for playing as a creature.
//  - frames the body, not the feet: the look point sits above the creature's middle, the distance comes from its
//    size, and the pitch keeps the horizon in view;
//  - follows the ground under the creature (smoothed), never its bobbing body, so the view stays calm;
//  - drifts behind the direction of travel when you stop steering it;
//  - pulls in when terrain or a tree trunk is in the way, and never dips under the ground;
//  - a very gentle rotational wobble for big moments (never translation), a slightly wider view at a run;
//  - a hello view that frames both creatures from the side.
import * as THREE from 'three';
import type { Creature } from '../creature/creature';
import { damp, dampAngle } from '../juice/spring';
import type { World } from '../world/world';

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export class ThirdPersonCamera {
	yaw = 0;
	pitch = 0.4;
	zoom = 1;
	private dist = 6;
	private hit = 1;
	private focus = new THREE.Vector3();
	private groundY = 0;
	private fovKick = 0;
	trauma = 0;
	private shakeT = 0;
	/** set to frame an encounter (both creatures) */
	pair: Creature | null = null;
	private pairK = 0;
	private v = new THREE.Vector3();
	private look = new THREE.Vector3();
	private started = false;

	constructor(
		readonly camera: THREE.PerspectiveCamera,
		readonly world: World,
		readonly baseFov: number,
	) {}

	/** Natural framing distance for a creature. */
	frameDist(c: Creature) {
		const P = c.plan;
		const H = Math.max(P.top, P.footprint[1] * 1.2, 0.3);
		return clamp(H * 3.6 + 1.8, 2.6, 16);
	}

	snap(c: Creature) {
		this.yaw = c.yaw + Math.PI;
		this.focus.copy(c.pos);
		this.groundY = c.pos.y;
		this.dist = this.frameDist(c) * this.zoom;
		this.started = true;
	}

	kick(fov: number) {
		this.fovKick = Math.max(this.fovKick, fov);
	}
	shake(t: number) {
		this.trauma = Math.min(1, this.trauma + t);
	}

	update(c: Creature, dt: number, o: { lookYaw: number; lookPitch: number; manual: boolean; running: boolean }) {
		if (!this.started) this.snap(c);
		const P = c.plan;
		this.yaw += o.lookYaw;
		this.pitch = clamp(this.pitch + o.lookPitch, -0.2, 1.15);
		// drift behind the creature while it moves and you're not steering the view
		const moving = c.speed > P.walkSpeed * 0.4;
		if (!o.manual && moving && !this.pair) {
			const behind = c.yaw + Math.PI;
			this.yaw = dampAngle(this.yaw, behind, 0.9 * Math.min(1.5, c.speed / Math.max(0.2, P.walkSpeed)), dt);
		}
		// focus: the ground point under the creature (smoothed height), a little ahead of where it's going
		this.v.set(c.pos.x + c.vel.x * 0.18, 0, c.pos.z + c.vel.z * 0.18);
		this.focus.x = damp(this.focus.x, this.v.x, 12, dt);
		this.focus.z = damp(this.focus.z, this.v.z, 12, dt);
		const airY = c.airborne ? c.bodyPos.y - P.height : c.pos.y;
		this.groundY = damp(this.groundY, airY, c.airborne ? 3 : 6, dt);
		const H = Math.max(P.top, 0.25);
		let dist = this.frameDist(c) * this.zoom;
		let yaw = this.yaw,
			pitch = this.pitch;
		const lookY = this.groundY + H * 0.62 + dist * 0.05;
		this.look.set(this.focus.x, lookY, this.focus.z);
		// a hello: frame both from the side
		this.pairK = damp(this.pairK, this.pair ? 1 : 0, 3, dt);
		if (this.pairK > 0.001 && this.pair) {
			const o2 = this.pair;
			const mid = this.v.copy(c.pos).lerp(o2.pos, 0.5);
			const sep = Math.hypot(o2.pos.x - c.pos.x, o2.pos.z - c.pos.z);
			const ang = Math.atan2(o2.pos.x - c.pos.x, o2.pos.z - c.pos.z);
			// the side of the pair the camera is already on
			const side = Math.sin(this.yaw - ang) >= 0 ? 1 : -1;
			const eyaw = ang + (side * Math.PI) / 2 + side * 0.35;
			const H2 = Math.max(H, o2.plan.top);
			// an upright phone sees a narrow slice: stand further back so both creatures fit side by side
			const narrow = this.camera.aspect < 1.1 ? Math.min(2.3, 1.1 / this.camera.aspect) : 1;
			const edist = clamp((sep * 1.1 + H2 * 2.6 + 1.2) * narrow, 2.5, 34);
			const k = this.pairK;
			this.look.lerp(mid.setY(Math.max(c.pos.y, o2.pos.y) + H2 * 0.5), k);
			yaw = yaw + (((eyaw - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;
			pitch = pitch + (0.22 - pitch) * k;
			dist = dist + (edist - dist) * k;
			if (k > 0.99) this.yaw = yaw;
		}
		this.dist = damp(this.dist, dist, 5, dt);
		// collision: pull in when the ground or a trunk sits between the look point and the camera
		const cp = Math.cos(pitch);
		const dir = this.v.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
		let free = 1;
		const n = 14;
		for (let i = 1; i <= n; i++) {
			const t = i / n;
			const x = this.look.x + dir.x * this.dist * t,
				y = this.look.y + dir.y * this.dist * t,
				z = this.look.z + dir.z * this.dist * t;
			const g = this.world.ground(x, z) + 0.3;
			if (y < g) {
				free = Math.min(free, Math.max(0.15, t - 1 / n));
				break;
			}
		}
		for (const ob of this.world.scenery.obstacles) {
			if (ob.kind === 'bush') {
				// bushes: a sphere around the leaves; the camera never sits behind one
				const by = this.world.ground(ob.x, ob.z) + ob.top * 0.45;
				const br = Math.max(ob.r, ob.top * 0.5) * 1.05;
				const ox = ob.x - this.look.x,
					oy = by - this.look.y,
					oz = ob.z - this.look.z;
				const along = ox * dir.x + oy * dir.y + oz * dir.z;
				if (along < 0.3 || along > this.dist + br) continue;
				const px = ox - dir.x * along,
					py = oy - dir.y * along,
					pz = oz - dir.z * along;
				if (px * px + py * py + pz * pz < br * br) free = Math.min(free, Math.max(0.2, (along - br) / this.dist));
				continue;
			}
			if (ob.kind !== 'tree') continue;
			// ray vs trunk cylinder in plan view
			const ox = ob.x - this.look.x,
				oz = ob.z - this.look.z;
			const L = this.dist * Math.hypot(dir.x, dir.z);
			if (Math.hypot(ox, oz) > L + ob.r + 1) continue;
			const dl = Math.hypot(dir.x, dir.z) || 1;
			const ux = dir.x / dl,
				uz = dir.z / dl;
			const along = ox * ux + oz * uz;
			if (along < 0.2 || along > L) continue;
			const perp = Math.abs(ox * uz - oz * ux);
			if (perp < ob.r + 0.25) free = Math.min(free, Math.max(0.2, (along - ob.r - 0.3) / L));
		}
		// pull in fast, ease back out
		this.hit = free < this.hit ? damp(this.hit, free, 20, dt) : damp(this.hit, free, 2.5, dt);
		const d = this.dist * this.hit;
		const cam = this.camera;
		cam.position.set(this.look.x + dir.x * d, this.look.y + dir.y * d, this.look.z + dir.z * d);
		const g = this.world.ground(cam.position.x, cam.position.z) + 0.3;
		if (cam.position.y < g) cam.position.y = g;
		cam.lookAt(this.look);
		// trauma shake: small rotations only
		this.trauma = Math.max(0, this.trauma - dt * 1.4);
		this.shakeT += dt;
		const s = this.trauma * this.trauma;
		if (s > 0) {
			const t = this.shakeT * 22;
			cam.rotateY(0.035 * s * Math.sin(t * 1.1));
			cam.rotateX(0.035 * s * Math.sin(t * 1.3 + 1));
			cam.rotateZ(0.06 * s * Math.sin(t * 0.9 + 2));
		}
		// FOV: a little wider at a run
		this.fovKick = Math.max(0, this.fovKick - dt * 12);
		const want = this.baseFov + (o.running ? 3 : 0) + this.fovKick;
		cam.fov = damp(cam.fov, want, 6, dt);
		cam.updateProjectionMatrix();
		cam.updateMatrixWorld();
	}

	/** where the camera is looking on the ground plane (for camera-relative movement) */
	forward() {
		return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
	}
}
