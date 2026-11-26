# TECH-NOTES: measured facts, Blender 5.2.5 on this machine

Measured 26 Nov 2026. Blender 5.2.5 LTS (hash 5f2fd03c4701), Cycles on 4 CPU cores (Xeon 2.1 GHz), 15 GB RAM, no graphics card.
All timing renders were in memory (`bpy.ops.render.render(write_still=False)`): no picture was saved or looked at, so this
file holds times and API facts, not image quality and not advice on how anything should look. Lines marked (judgement)
are not measurements.

## 1. What a picture costs here

**These are timings of a synthetic test scene, not of any film shot.**

The scene:
- Ground: flat 3 m x 3 m grid (61 x 61 vertices), Principled BSDF.
- Ball: ellipsoid 10 x 14 x 9 cm, Principled BSDF with `Subsurface Weight` 0.5, subdivision render level 2.
- Camera: 50 mm lens, 36 mm sensor, `dof.use_dof=True`, `aperture_fstop=2.0`, focused on the ball, 7.5 cm above the ground, 45 cm from the ball. The ball covers about 17% of the frame (computed from lens and size).
- Day light: `hill.build_sky_and_sun(8.0, -100.0, 9.0)`: Sky Texture `MULTIPLE_SCATTERING` at Background strength 0.12, one SUN light of angle 2.2 degrees.
- Night light: uniform world colour #1a2c55 at strength 0.05; one SUN light (energy 0.5, angle 3 degrees); one AREA rectangle 0.8 x 0.6 m at 30 W; ten POINT lights of 0.004 W.
- Fur: `Curves` strands of 4 points, about 12 mm long, radius 0.12 mm at the root and 0.04 mm at the tip, on the upper part of the ball. Shader `ShaderNodeBsdfHairPrincipled`, `parametrization='COLOR'`, colour #e8d2b0, `Roughness` 0.35.
- Lawn: ten blade meshes from `hill.blade_mesh` (a ribbon of 14 vertices, 6 quads) scaled to roughly 2 to 8 cm, scattered by `hill.instancer` (one instance per blade); 100,000 blades on 9 m²; material from `hill.grass_material()`.

Common settings unless a row says otherwise:
`render.engine='CYCLES'`, `cycles.device='CPU'`, 1280x720, `cycles.samples=16`, `use_adaptive_sampling=True`, `adaptive_threshold=0.02`, `use_denoising=True`, `denoiser='OPENIMAGEDENOISE'`, `denoising_quality='BALANCED'`, `max_bounces=6`, `diffuse_bounces=3`, `glossy_bounces=2`, `transmission_bounces=4`, `transparent_max_bounces=8`, `caustics_reflective=False`, `caustics_refractive=False`, `sample_clamp_indirect=6.0`, `cycles_curves.shape='RIBBONS'`, `render.use_persistent_data=True`, `render.use_motion_blur=False`.

Times are seconds for the second or later frame in one Blender process; the first frame was 1 to 3 s slower.

| # | Configuration | s per frame |
|---|---|---|
| 1 | No lawn, no fur, day, `use_denoising=False` | 8.5 |
| 2 | Row 1 with denoising, `denoising_quality='HIGH'` (factory default) | 12.2 to 12.6 |
| 3 | `denoising_quality='BALANCED'` | 10.1 |
| 4 | `denoising_quality='FAST'` | 9.7 |
| 5 | Row 3 with night light | 8.8 to 8.9 |
| 6 | Fur, 60,000 strands, day | 17.8 to 17.9 |
| 7 | Row 6 with `cycles_curves.shape='THICK'` | 20.7 to 20.8 |
| 8 | Row 6 with 150,000 strands | 19.4 to 20.1 |
| 9 | Row 6 with `render.use_motion_blur=True` (shutter 0.5, ball moving 12 mm per frame) | 19.2 |
| 10 | Row 6 with night light | 17.6 to 17.9 |
| 11 | Row 6 with the camera 20 cm from the ball (fur close-up) | 55.3 to 57.4 |
| 12 | Row 11 with `max_bounces=3` (diffuse 3, glossy 2, transmission 3) | 47.4 |
| 13 | Row 11 with hair colour #4a3020 | 42.4 |
| 14 | Row 11 with Principled BSDF on the strands | 32.5 |
| 15 | Row 11 with `samples=8` | 28.5 |
| 16 | Lawn, no fur, day, `hill.grass_material()` unchanged | 39.6 |
| 17 | Row 16 with blade `Transmission Weight` 0 (opaque; all later lawn rows too) | 37.0 and 40.5 (two batches) |
| 18 | Row 17 with 300,000 blades | 55.3 |
| 19 | Row 17 with 30,000 blades | 28.8 |
| 20 | Row 17 with the camera 30 cm high, so the lawn fills the frame | 55.7 |
| 21 | Row 17 with `max_bounces=2` (diffuse 2, glossy 2, transmission 2) | 38.9 |
| 22 | Row 17 with fast GI | 32.8 |
| 23 | Row 17 with instances realised | 35.2 |
| 24 | Row 17 as tufts | 27.1 |
| 25 | Row 24 realised | 32.8 |
| 26 | Row 17 with `emission_sampling='NONE'` on the grass material | 27.0 |
| 27 | Row 17 with a plain Principled BSDF on the blades | 26.1 |
| 28 | Tufts + row 26 + fast GI | 16.8 |
| 29 | Tufts + row 27 + fast GI | 14.2 to 14.7 |
| 30 | Lawn (row 17) + fur (row 6) + night light | 53.4 |
| 31 | Row 30 at 960x540 | 29.5 |
| 32 | Row 30 with tufts and `emission_sampling='NONE'` | 25.6 |
| 33 | Row 32 with Principled BSDF on the strands and fast GI | 15.0 |

What the terms mean:
- **Haze** (part of `hill.grass_material()`): `hill.add_haze` puts a Mix Shader between the Principled BSDF and an Emission shader (strength 0.9), mixed by camera distance. Rows 16 to 25 leave `material.cycles.emission_sampling` at its default `'AUTO'`; row 26 sets it to `'NONE'`.
- **Plain Principled BSDF on the blades** (row 27): `Base Color` #6f9a2c, `Roughness` 0.55, `Specular IOR Level` 0.35; no colour ramp, no haze mix.
- **Fast GI**: `cycles.use_fast_gi=True`, `cycles.fast_gi_method='REPLACE'`, `cycles.ao_bounces_render=1`.
- **Realised**: a `GeometryNodeRealizeInstances` node after Instance on Points. Peak memory 2.0 GB against 1.3 GB instanced.
- **Tufts**: eight meshes, each 25 blades merged into one mesh (350 vertices) inside a 3.5 cm radius; the scatter places 4,000 tuft instances instead of 100,000 blade instances. Peak memory 1.1 GB.
- **Principled BSDF on the strands** (rows 14, 33): `Base Color` #e8d2b0, `Roughness` 0.7, `Sheen Weight` 0.6, `Sheen Roughness` 0.4, `Specular IOR Level` 0.2, on the same `Curves` object in place of the hair shader.

Notes on the table:
- Row 11: the ball fills most of the frame, 85% or more (judgement).
- Rows 5 and 10 also had ten 3 mm emissive spheres hidden from diffuse, glossy, shadow and transmission rays; rows 30 to 33 did not.
- Row 29 ran with `sample_clamp_indirect` and caustics at factory defaults.
- Row 17 was measured twice and differed by about 10%; read every single number with that spread.
- Not measured: noise or image quality, scene build time, deforming geometry, anything with real characters.
- Yesterday's whole-film measurement, for scale: the 11-second hill shot (`docs/previews/studio3d/README.md`) averaged 47 s per picture, and its scene took about 50 s to build on every start.

## 2. Blender 5.2 API facts that differ from older tutorials

- Compositor tree: `scene.compositing_node_group`, assigned a group made with `bpy.data.node_groups.new(name, 'CompositorNodeTree')`. `scene.node_tree` does not exist.
- Compositor output: `CompositorNodeComposite` does not exist. Use a `NodeGroupOutput` node plus `ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')`.
- `CompositorNodeMixRGB` does not exist. (Which mix node a compositor tree accepts was not tested.)
- `scene.render.compositor_device`: values `'CPU'`, `'GPU'`; factory default `'GPU'`, which aborts Blender here (section 3). The shared harness sets it to `'CPU'` after your build. `scene.render.compositor_precision`: `'AUTO'`, `'FULL'`.
- `CompositorNodeGlare`: settings are input sockets (`Type`, `Quality`, `Threshold`, `Smoothness`, `Strength`, `Saturation`, `Tint`, `Size`, `Streaks`, `Iterations`, `Fade`, and more), not node properties. Outputs: `Image`, `Glare`, `Highlights`.
- `CompositorNodeRLayers` default outputs: `Image`, `Alpha`.
- Engine identifiers accepted: `'CYCLES'`, `'BLENDER_EEVEE'`, `'BLENDER_WORKBENCH'`. `'BLENDER_EEVEE_NEXT'` is rejected. Only Cycles renders here (section 3).
- Sky Texture `sky_type`: `'SINGLE_SCATTERING'`, `'MULTIPLE_SCATTERING'` (default), `'PREETHAM'`, `'HOSEK_WILKIE'`. Properties: `sun_elevation`, `sun_rotation`, `sun_disc`, `sun_size`, `sun_intensity`, `altitude`, `air_density`, `aerosol_density`, `ozone_density`.
- Curve render shape: `scene.cycles_curves.shape` in `'RIBBONS'` (default), `'THICK'`, `'THICK_LINEAR'`; `scene.cycles_curves.subdivisions` default 2.
- Hair curves:
  - `bpy.data.hair_curves.new(name)` returns a `Curves` datablock; `bpy.data.objects.new(name, hc).type == 'CURVES'`.
  - Add strands with `hc.add_curves([points_per_strand, ...])`; set points with `hc.position_data.foreach_set('vector', flat)`.
  - Only `position` exists at creation; make the radius with `hc.attributes.new('radius', 'FLOAT', 'POINT')`.
- Principled BSDF input names: `Base Color`, `Metallic`, `Roughness`, `IOR`, `Alpha`, `Thin Wall`, `Normal`, `Diffuse Roughness`, `Subsurface Weight`, `Subsurface Radius`, `Subsurface Scale`, `Subsurface IOR`, `Subsurface Anisotropy`, `Specular IOR Level`, `Specular Tint`, `Anisotropic`, `Anisotropic Rotation`, `Tangent`, `Transmission Weight`, `Coat Weight`, `Coat Roughness`, `Coat IOR`, `Coat Tint`, `Coat Normal`, `Sheen Weight`, `Sheen Roughness`, `Sheen Tint`, `Emission Color`, `Emission Strength`, `Thin Film Thickness`, `Thin Film IOR`. (No `Subsurface`, `Specular`, `Transmission`, `Clearcoat`, `Sheen` or `Emission`.)
- Principled BSDF enums: `subsurface_method` in `'BURLEY'`, `'RANDOM_WALK'` (default), `'RANDOM_WALK_SKIN'`, `'RANDOM_WALK_LEGACY'`; `distribution` in `'GGX'`, `'MULTI_GGX'` (default).
- `ShaderNodeBsdfHairPrincipled`: `model` in `'CHIANG'` (default), `'HUANG'`; `parametrization` in `'ABSORPTION'`, `'MELANIN'`, `'COLOR'` (default). Inputs with `'COLOR'`: `Color`, `Roughness`, `Radial Roughness`, `Coat`, `IOR`, `Offset`, `Random Roughness`, `Random`.
- Shader node types that do not exist: `ShaderNodeSeparateRGB`, `ShaderNodeCombineRGB`, `ShaderNodeTexMusgrave`, `ShaderNodeBsdfVelvet`.
- Shader node types that exist: `ShaderNodeSeparateColor`, `ShaderNodeCombineColor`, `ShaderNodeBsdfSheen`, `ShaderNodeMix`, `ShaderNodeMixRGB`, `ShaderNodeBsdfRayPortal`, `ShaderNodeTexGabor`.
- Noise Texture: inputs `Vector`, `Scale`, `Detail`, `Roughness`, `Lacunarity`, `Distortion`; outputs `Factor`, `Color`; `noise_type` in `'MULTIFRACTAL'`, `'RIDGED_MULTIFRACTAL'`, `'HYBRID_MULTIFRACTAL'`, `'FBM'`, `'HETERO_TERRAIN'`.
- Sockets shown as `Factor` (Noise, Wave and Attribute outputs; Color Ramp and Mix Shader inputs) still answer to the key `'Fac'`.
- `ShaderNodeMix` with `data_type='RGBA'`: inputs `Factor`, `A`, `B`; output `Result`. `data_type` in `'FLOAT'`, `'VECTOR'`, `'RGBA'`, `'ROTATION'`.
- Emission as a light source: `material.cycles.emission_sampling` in `'NONE'`, `'AUTO'` (default), `'FRONT'`, `'BACK'`, `'FRONT_BACK'`.
- Displacement: `material.displacement_method` in `'BUMP'`, `'DISPLACEMENT'`, `'BOTH'`.
- Light linking: `light_object.light_linking.receiver_collection` and `.blocker_collection`.
- Ray visibility: objects have `visible_camera`, `visible_diffuse`, `visible_glossy`, `visible_transmission`, `visible_volume_scatter`, `visible_shadow`; the world has `world.cycles_visibility.camera`, `.diffuse`, `.glossy`, `.transmission`, `.shadow`, `.scatter`.
- Persistent data is `scene.render.use_persistent_data` (not on `scene.cycles`).
- Motion blur: `scene.render.use_motion_blur`, `motion_blur_shutter`, `motion_blur_position`; per object `object.cycles.use_motion_blur`, `use_deform_motion`, `motion_steps`.
- Denoiser: `scene.cycles.denoising_quality` in `'HIGH'` (default), `'BALANCED'`, `'FAST'`; `denoising_prefilter` in `'NONE'`, `'FAST'`, `'ACCURATE'` (default); `denoising_input_passes` in `'RGB'`, `'RGB_ALBEDO'`, `'RGB_ALBEDO_NORMAL'` (default).
- Cycles factory defaults: `samples` 4096, `adaptive_threshold` 0.01, `max_bounces` 12, `diffuse_bounces` 4, `glossy_bounces` 4, `transmission_bounces` 12, `transparent_max_bounces` 8, `sample_clamp_indirect` 10, `volume_bounces` 0, `use_light_tree` True, `use_animated_seed` False.
- Dither: `scene.render.dither_intensity`, default 1.0.
- View transforms accepted: `'Standard'`, `'Filmic'`, `'AgX'`, `'Khronos PBR Neutral'`, `'Raw'`, `'False Color'`, `'Filmic Log'`, `'ACES 1.3'`, `'ACES 2.0'`.
- Looks accepted with AgX: `'None'`, `'AgX - Punchy'`, `'AgX - Base Contrast'`, `'AgX - Greyscale'`, and `'AgX - Very Low Contrast'`, `'AgX - Low Contrast'`, `'AgX - Medium Low Contrast'`, `'AgX - Medium High Contrast'`, `'AgX - High Contrast'`, `'AgX - Very High Contrast'`. `'Punchy'` alone is rejected.
- Other view settings: `view_settings.exposure`, `gamma`, `use_white_balance`, `white_balance_temperature`, `white_balance_tint`.
- Image output: `scene.render.image_settings.media_type` in `'IMAGE'` (default), `'MULTI_LAYER_IMAGE'`, `'VIDEO'`; `file_format='PNG'`; `color_depth` default `'8'`; `color_mode` default `'RGBA'`; `compression` default 15. (The shared harness sets PNG, RGB, 8-bit.)
- Geometry node groups: `bpy.data.node_groups.new(name, 'GeometryNodeTree')` with `ng.interface.new_socket('Geometry', in_out='INPUT' or 'OUTPUT', socket_type='NodeSocketGeometry')`.
- Simulation zone: `GeometryNodeSimulationInput` and `GeometryNodeSimulationOutput`, joined with `sim_in.pair_with_output(sim_out)`.
- Camera focus: `camera.dof.use_dof`, `focus_distance`, `focus_object`, `aperture_fstop`, `aperture_blades`, `aperture_rotation`, `aperture_ratio`.
- Lights: `energy`, `color`, `shadow_soft_size`, `use_soft_falloff`, `exposure`, `normalize`, `use_temperature`, `temperature`; area lights add `shape`, `size`, `size_y`, `spread`.
- `Material.use_nodes = True` and `World.use_nodes = True` still work but print a deprecation warning.

## 3. What works headless on this machine and what does not

Does not work (each ends the Blender process with exit code 134, "Couldn't open libEGL.so.1"):
- Rendering with `'BLENDER_EEVEE'`.
- Rendering with `'BLENDER_WORKBENCH'`.
- Rendering with a compositing node group while `scene.render.compositor_device` is `'GPU'`, which is the factory default.

Works (each was run):
- Cycles on CPU with OpenImageDenoise, adaptive sampling, depth of field, object motion blur, subsurface scattering, subdivision modifiers.
- `Curves` strands in `'RIBBONS'` and `'THICK'`, with the hair shader or a Principled BSDF.
- Geometry Nodes scattering and instancing, and Realize Instances.
- Compositor on `'CPU'` with a Glare node: a 1280x720 frame took 0.9 s against 0.8 s without (output not looked at).
- Light linking (a SUN light with a receiver collection rendered).
- World Volume Scatter: 1.4 s against 1.0 s without, on a one-sphere scene at 640x360, 16 samples.
- Shape keys; the cloth modifier, when frames are stepped in order.
- Text objects: the built-in font is "Bfont Regular" and converts to a mesh.
- Simulation zones, with a catch: stepping frames 1 to 5 in order accumulated correctly, and going back to frame 3 returned the stored value, but jumping from frame 5 to frame 9 advanced only one step. A simulation gives the same result only if every frame is stepped in order in the same process (see `sequential=True` in `src/studio3d/bakeoff/common/harness.py`).

Other facts:
- Every start prints "CUEW initialization failed"; it had no effect on any render.
- Build flags report Embree, OpenImageDenoise, OSL and path guiding as present; OSL and path guiding were not exercised.
- Not tested: armatures, legacy particle hair, rigid bodies, Grease Pencil.
- Blender's Python is 3.13 with numpy.
- System Node 22 imports `src/audio/mix.ts` and `src/audio/sfx.ts` directly. The 16 existing effects are: step, cane, door, knock, rain, wind, birds, bee, splash, laugh, clap, whoosh, bell, thud, pop, rustle.
- System ffmpeg is 6.1.1.

## 4. Background drawing at lowest priority

A second Blender process started with `chrt -i 0 nice -n 19` did not slow a normal-priority one: three test pictures took
15.3, 14.6, 14.3 s alone and 15.5, 14.7, 14.1 s with the low-priority process drawing. (Organisers may be drawing an
earlier film this way while you work; your wrapper calls are not slowed by it.)

## 5. The timing code

The scene described in section 1 was built first (with `lib` and `hill` imported from `src/studio3d/blender`). This is the
measuring part, exactly as used:

```python
import time, resource, bpy
sc = bpy.context.scene; c = sc.cycles
sc.render.engine = "CYCLES"; c.device = "CPU"
c.samples = 16; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.02
c.use_denoising = True; c.denoiser = "OPENIMAGEDENOISE"; c.denoising_quality = "BALANCED"
c.max_bounces = 6; c.diffuse_bounces = 3; c.glossy_bounces = 2; c.transmission_bounces = 4
c.transparent_max_bounces = 8; c.caustics_reflective = False; c.caustics_refractive = False
c.sample_clamp_indirect = 6.0
sc.cycles_curves.shape = "RIBBONS"
sc.render.use_persistent_data = True
sc.render.resolution_x = 1280; sc.render.resolution_y = 720; sc.render.resolution_percentage = 100
out = []
for f in (1, 2, 3):
    ta = time.time(); sc.frame_set(f); bpy.ops.render.render(write_still=False); out.append(time.time() - ta)
ru = resource.getrusage(resource.RUSAGE_SELF)
print("BENCH frames %s | cpu %.0f s | maxrss %.0f MB" % (" ".join("%.1f" % x for x in out),
      ru.ru_utime + ru.ru_stime, ru.ru_maxrss / 1024), flush=True)
```

The realise variant (rows 23, 25) inserted the node into the group made by `hill.instancer`:

```python
ng = obj.modifiers[0].node_group
jn = [n for n in ng.nodes if n.bl_idname == "GeometryNodeJoinGeometry"][0]
lk = jn.inputs[0].links[0]; src = lk.from_socket; ng.links.remove(lk)
rn = ng.nodes.new("GeometryNodeRealizeInstances")
ng.links.new(src, rn.inputs[0]); ng.links.new(rn.outputs[0], jn.inputs[0])
```
