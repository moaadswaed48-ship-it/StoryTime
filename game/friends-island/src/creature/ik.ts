// Analytic two-bone IK (law of cosines, knee in the plane of hip, target and pole). Exact, single pass, no drift,
// no iteration pops. Three-segment (digitigrade) legs pin the metatarsal first and solve the rest with two bones.
import * as THREE from 'three';

const _d = new THREE.Vector3();
const _p = new THREE.Vector3();

export interface IKResult {
	/** distance hip->target before clamping, as a fraction of the reachable length (1 = fully straight) */
	reach: number;
	clamped: boolean;
}

/**
 * Solves hip -> knee -> end. Writes the knee and the reached end (equal to target unless out of reach).
 * Returns how stretched the chain was.
 */
export function solveTwoBone(hip: THREE.Vector3, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3, outKnee: THREE.Vector3, outEnd: THREE.Vector3): IKResult {
	_d.subVectors(target, hip);
	let d = _d.length();
	const maxD = (a + b) * 0.9995;
	const minD = Math.abs(a - b) * 1.02 + 1e-5;
	const reach = d / (a + b);
	let clamped = false;
	if (d < 1e-6) {
		_d.set(0, -1, 0);
		d = minD;
	} else _d.divideScalar(d);
	if (d > maxD) {
		d = maxD;
		clamped = true;
	}
	if (d < minD) {
		d = minD;
		clamped = true;
	}
	outEnd.copy(hip).addScaledVector(_d, d);
	// angle at the hip between hip->end and hip->knee
	const cosA = Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)));
	const sinA = Math.sqrt(1 - cosA * cosA);
	// pole direction made perpendicular to the chain
	_p.copy(pole).addScaledVector(_d, -pole.dot(_d));
	if (_p.lengthSq() < 1e-8) {
		_p.set(0, 0, 1).addScaledVector(_d, -_d.z);
		if (_p.lengthSq() < 1e-8) _p.set(1, 0, 0);
	}
	_p.normalize();
	outKnee.copy(hip).addScaledVector(_d, cosA * a).addScaledVector(_p, sinA * a);
	return { reach, clamped };
}
