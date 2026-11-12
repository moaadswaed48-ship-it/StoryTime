// Editor design fuzz (Node): 200 random builds -> compile -> mesh. Every build must be one connected piece, every
// attachment on or in the skin, legs that reach the ground, and the share code must round-trip exactly.
import { compileDesign, decodeDesign, encodeDesign, randomDesign } from '../src/creature/design.ts';
import { meshPlan } from '../src/creature/mesher.ts';
import { field } from '../src/creature/sdf.ts';
const N = Number(process.argv[2] ?? 200);
let bad = 0;
const kinds: Record<string, number> = {};
for (let i = 0; i < N; i++) {
	const d = randomDesign(`fuzz-${i}`);
	const code = encodeDesign(d);
	const again = encodeDesign(decodeDesign(code));
	const plan = compileDesign(d);
	kinds[plan.kind] = (kinds[plan.kind] ?? 0) + 1;
	const m = meshPlan(plan, 56);
	const solid = plan.parts.filter((p) => p.op !== 'paint');
	const hipsOut = plan.legs.filter((l) => field(solid, ...l.hip) > 0).length;
	const anchorsOut = plan.chains.filter((c) => field(solid, ...c.anchor) > 0.002).length + plan.arms.filter((a) => field(solid, ...a.shoulder) > 0).length;
	const reach = plan.legs.filter((l) => Math.hypot(l.hip[0] - l.foot[0], l.hip[1] - l.footR * 0.62, l.hip[2] - l.foot[2]) > (l.upper + l.lower + l.meta) * 0.97).length;
	let lowest = 1e9;
	for (const p of solid) if (p.op === 'add' && p.tag.startsWith('seg')) lowest = Math.min(lowest, p.c![1] - p.r![1]);
	const fail = [m.stats.components !== 1 && `components ${m.stats.components}`, again !== code && 'code mismatch', hipsOut && `hips outside ${hipsOut}`, anchorsOut && `anchors outside ${anchorsOut}`, reach && `legs can't reach ${reach}`].filter(Boolean);
	if (fail.length) {
		bad++;
		if (bad < 12) console.log(i, plan.kind, plan.legs.length, 'legs', d.spine.length, 'segs', fail.join(', '));
	}
}
console.log(kinds, `bad ${bad}/${N}`);
