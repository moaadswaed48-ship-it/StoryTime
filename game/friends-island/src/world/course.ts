// The animation lab's course over the big hill (kept clear of trees and bushes so the camera sees the feet).
import { HILL } from './terrain';

export const COURSE: Array<[number, number]> = [
	[HILL.x + 16, HILL.z - 6],
	[HILL.x + 5, HILL.z - 1],
	[HILL.x - 1, HILL.z + 2],
	[HILL.x + 4, HILL.z + 7],
	[HILL.x + 13, HILL.z + 4],
	[-14, 9],
	[-8, 13],
];

/** distance from x,z to the course polyline */
export function courseDist(x: number, z: number) {
	let best = Infinity;
	for (let i = 0; i + 1 < COURSE.length; i++) {
		const [ax, az] = COURSE[i],
			[bx, bz] = COURSE[i + 1];
		const dx = bx - ax,
			dz = bz - az;
		const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
		best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
	}
	return best;
}
