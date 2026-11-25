# Clair de Lune V9 — soft light

V9 uses two flower detail levels. Nearby plants retain detailed geometry; distant plants use a single simpler mesh per species. The LOD has hysteresis (12/15 world units) and batches are rebuilt after camera movement of 2.3 units. Lab shows the number of high-detail flowers. The bloom strength and radius, plus the separate flower glow sprites, have been reduced. The bloom pass renders at a smaller resolution. Petal surfaces and flower centers have additional near-field detail. Default pixel ratio is capped at 1.0.

Run `npm install`, `npm run dev`. Run `npm test` for pure logic tests. Browser rendering and performance still require validation on the target machine. Music and attribution remain unchanged.

---

# Clair de Lune · ONEKO — V8: Wild meadow

Based on V7.1, not V7 (the opaque material shader regression remains removed).

- Five procedural flower species: cosmos, daisies, lavender, forget-me-nots and campanulas. Each species has its own stem/leaf, petal and center geometry. Spatially correlated placement creates mixed colonies. Per-species instance batches preserve density controls and silent sparkle interaction. Some species have very little baseline glow; touching any flower still produces a light pulse.
- Terrain: original seamless 512px soil color and height textures in `src/assets`, repeated at a world scale of approximately 2m, standard Three.js bump mapping, irregular earth path with gradual edges, and 900 small instanced stones. No third-party texture assets. The bump map affects lighting rather than adding actual geometry.
- Grass: narrower, taller, curved blades, darker root-to-tip gradient, natural green/olive hues, variable heights, patchy distribution, and a less abrupt path edge. Still 26,000 four-blade tufts in standard mode.
- Retains V7.1 clouds, mist, bloom, verses, narrative pauses, sound toggle, finale recording and Lab. Default remains 2,000 flowers. LOD remains pending; more species increase the number of instance batches but each model is intentionally lightweight.
- Validation: all JS modules pass `node --check`, all 11 Node tests pass (travel, journey and species distribution/prefix counts). These tests do not execute Three.js. npm's offline cache has no Three.js; browser rendering, production build, shaders, appearance and FPS have not been verified. Compare with V7.1 at the same station and quality settings. If a rendering issue arises, collect Chrome console errors.

# V7.1 hotfix

Restores the V6 terrain and vegetation material pipeline (including GPU wind), keeps V7 grass geometry, clouds and separate translucent ground mist banks. Removes the custom ground mist injection from opaque materials; distance fog uses Three.js built-in FogExp2. Mist toggle controls banks and additional distance fog. No browser rendering verification was available.

# Clair de Lune · ONEKO — V7

Original procedural Three.js portfolio experiment. Based on Flower Valley V6.

## Run

Use Node.js compatible with Vite 7 (20.19+ or 22.12+). In the extracted folder:

```sh
npm install
npm run dev
```

Open the local address shown by Vite. `npm test` runs the independent camera and narrative tests; `npm run build` builds the deployment assets.

## Controls

- Scroll / touch vertically / arrows to walk. The route ends at the meadow.
- At each of four stations, the camera eases to a full stop. Wait 2.2 seconds, then release the wheel briefly and scroll again, or click Continue to travel automatically to the next station. Continuous wheel momentum cannot skip a verse. Scroll up to go back after a pause.
- Brush flowers with the pointer or pass close to them to see the light pulse and sparkles; no per-flower sound. The finale recording starts only if sound is enabled. Home/End are direct diagnostic shortcuts to start/final station.
- Lab: 500 / 2,000 / 5,000 flowers; bloom, clouds and mist switches; Low GPU switch; FPS, calls, triangles and grass tuft count. Default 2,000 flowers, 26,000 tufts (13,000 Low GPU), 4 blades per tuft. Reduced motion preference disables moving sparkles, wind and atmospheric drift.

## Changes from V6

- `atmosphere.js`: tileable procedural noise shared by a drifting cloud shell, height-dependent ground haze and eight low-lying mist ribbons in one batch. The clouds blend in front of the stars and moon. No external texture assets.
- Four wider, shorter, curved grass blades per tuft; varied patches, brighter green and silver tips, clearer path and greener ground. 26,000 × 16 triangles = 416,000 grass triangles, versus 420,000 in V6.
- Lab now has independent Mist and Clouds switches. Low GPU disables the mist ribbons and reduces the height-haze intensity; the existing bloom switch is preserved.
- The V6 narrative, flower geometry, sparkles and audio behavior are unchanged. Flower LOD remains pending.

## Inherited changes from V5

- `journey.js`: finite route, reading stops, inertial gesture protection, repeatable navigation.
- `sparkles.js`: a single pooled point-sprite batch (320 particles maximum).
- `world.js`: curved three-blade tufts, distributed patches, softer path and lighter grass tips. 15 triangles per tuft, previously 16. Reduced moon intensity and halo; lower baseline flower glow. No flower LOD yet.
- `effects.js`: restrained bloom; retains grade/vignette. Low GPU uses direct render.
- `audio.js`: final music only; removed individual piano samples and their unused source tools.

## Credits and recording

Poetry: selected lines from Paul Verlaine, *Fêtes galantes*, 1869 (public domain); English renderings written for this experiment. Composition: Claude Debussy, *Clair de lune* (public domain). The V5 recording source is retained: Laurens Goedhart, CC BY 3.0, as credited in the interface. The recording is not bundled; the remote source and its playback have not been reverified in this revision. You may place an appropriately licensed copy at `public/audio/clair-de-lune.ogg` or select a local recording using the UI if the remote source fails. Keep the correct attribution for any recording you distribute. No music plays without opting in.

## Validation

All JavaScript files pass the syntax check and nine existing Node tests pass (camera and narrative only). The container cannot reach the npm registry; browser rendering, WebGL shader compilation, production bundling, sound playback and real FPS have not been verified here. Compare V6 and V7 on the same machine, scene, quality and flower count. The new particle batch adds at most one draw call when visible; actual performance is hardware dependent.

## V10 — Distant Horizons
- Three flower LODs with hysteresis: detailed geometry, simplified geometry, alpha-tested botanical cards (two triangles per flower). Cards are original procedural illustrations, not photographic assets. Lab reports HD and card counts.
- Three layered distant ridgelines, a slightly lower opening viewpoint, subtler flower halos and more varied ground tint.
- Wind time is updated explicitly (the previous uniform was an alias of the same object; no behavior change intended).
- Original four poem stations, finite walk, sparkles, sound controls and final audio source retained.
- Tests: `npm test` (14 pure logic tests). WebGL and build not verified in the development environment: Three.js and Vite are unavailable in the local npm cache. Compare with V9 on the same machine at 5k, same viewport and effect toggles. No external graphic assets were added.


## V10.1 — No cards
- Reverted the third floral LOD introduced in V10. Distant flowers now use the previous simplified flower geometry instead of botanical cards, to avoid visible popping when assets swap in.
- Kept V10's distant ridgelines, lower opening viewpoint and more restrained glow.
- Browser rendering and FPS still need to be verified on the target Mac.


## V11 — Petal & Light
- Based on V10.1. Two geometric LODs retained; no botanical cards.
- Original grayscale petal-vein texture, UVs on botanical surfaces, subtle petal shape variation, softer soil microrelief and smaller gravel. Lighting and grass tones adjusted. No external models or scanned materials added.
- Conservative per-flower frustum filtering repacks existing instance batches; it does not change flower density or replace flowers with cards. The margin anticipates camera motion and plant movement. `Cull` in Lab toggles filtering (enabled by default). Lab displays the number of flowers submitted to the geometric batches, not an exact onscreen count. Glow points remain separate.
- Optional `Auto res` changes render scale between 76% and 100% in steps, sampling over three seconds. Off by default to preserve the baseline for comparison. Low GPU remains independent.
- Test with 5k, same camera position and effects: toggle Cull off/on, compare FPS and drawn flowers; then try Auto res. Check that no plants disappear near the screen edges during motion.
- 16 pure logic tests and JavaScript syntax checks passed. Browser/WebGL, texture upload, production build and actual FPS remain unverified because Three.js and Vite are not cached locally. Final music source unchanged.


## V12 — Operation Intel Rescue
- Based on V11. Retains all flower geometry, terrain, camera, poem, sparkle and music systems. No distant cards or new external assets.
- Replaces UnrealBloomPass with one low-resolution highlight extraction and two separable Gaussian blur passes (36% of scene width and height, approximately 13% of its pixels). Combines the glow and color grade into one composite; retains OutputPass for display conversion. Visual parity with V11 is not guaranteed: the new kernel has a different falloff.
- Clouds and mist use precombined channels in a single tileable noise texture, with one texture lookup per fragment. Clouds omit unused geometry below the horizon. Five mist ribbons span the original route instead of eight; their opacity is adjusted and they use single-pass transparent double-sided rendering.
- Cull starts disabled, as it lowered FPS on the target Mac; no camera-angle-driven flower batch rebuilds in that mode. Auto res starts enabled. Both remain independently toggleable in Lab. Flower count defaults to 2,000, with 5,000 available.
- Benchmark: select 5k, remain at the same point and viewport, disable Auto res for a native-resolution comparison, and record FPS with all three atmospheric effects enabled and Cull disabled. Then enable Auto res and allow at least 10 seconds to settle; report FPS and render resolution. Toggle effects individually if needed.
- Validation: 18 pure Node tests and JS syntax checks. The npm offline cache lacks Three.js and Vite; no production build, GLSL compilation, browser render, audio playback or hardware FPS verification was possible here.

## V12.1 — Frame resize hotfix
- Canvas and composer resolution changes are queued and applied before the frame is drawn, never after it. This addresses a plausible source of black flashes in V12; the original symptom has not been reproduced here.
- Avoid redundant composer resize calls when only pixel ratio or dimensions change. Lab reports resize count to help correlate any remaining flashes.
- No art changes or extra visual effects. Auto res remains enabled; disable it in Lab for a fixed-resolution comparison.
- Tests cover logic and source ordering only, not real WebGL presentation.

## V13 — Moonlit Lake

- A continuous terrain basin and irregular shoreline beyond the last station. Vegetation and gravel are moved out of the water; the initial camera and verse stops are unchanged.
- The final camera gradually rises and looks across the lake, with the final verse positioned higher to leave the water visible.
- One opaque water mesh (96 triangles), with analytic moon and sky reflections, gentle animated ripples, Fresnel and atmospheric haze. No secondary scene render or physical reflections of the landscape.
- The 2,000-flower default is retained, with those flowers biased closer to the trail. The 5,000-flower option remains. Final lighting transitions gradually to stronger moonlight and reduced ambient fill.
- Retains V12.1's before-render resize fix, current poem, effects, audio source and quality controls.
- Production comparison: `npm install`, `npm run build`, `npm run preview`. Vercel: import the project root containing `package.json` and `vercel.json`; Vite preset, `npm run build`, output `dist`. Hosting does not move WebGL work to the server. A local licensed audio copy may be placed at `public/audio/clair-de-lune.ogg` (existing attribution must match recording).
- Validation: 23 Node logic tests, JavaScript syntax checks. Real WebGL shader compilation, appearance, audio and FPS remain unverified here.


## V14 — Shore & portrait
- Portrait camera FOV blends from 57° to 80° by aspect ratio; pointer motion is gentler and the final framing is raised slightly. The world, stations and travel speed are unchanged.
- Low GPU is now opt-in on all devices. Adaptive resolution remains enabled; the initial ratio is capped at 1 on landscape and up to 1.5 in portrait with a 1.9 million pixel budget. Lab reports actual device pixel ratio in percent.
- Safe-area layout, portrait verse sizing and touch hints; touch release recenters the camera pointer.
- Lake: irregular terrain and water edge, clustered reeds (720 tufts), 180 shore stones, shallow edge tint, subdued ripples, approximate reflected ridgelines, and a low mist bank. Reflections remain analytic, not a second scene render.
- Vercel configuration and .gitignore retained. No dependencies or build output included.
- Verification: run `npm test`, `npm run build`, then test on Intel, Xiaomi and iPhone Safari. Browser visual rendering, audio autoplay and frame rate have not been verified in this environment. Audio source unchanged from V13.


## V15 — Living Lake
- Builds on V14's mobile framing and performance gains. The goal is not a bigger lake, but a fuller finale.
- Lake polish: analytic water shading now has subtler wave layering, darker edge depth, a gentler moon path and more variation across the surface.
- Added a thin drifting surface mist sheet, floating motes/firefly-like glints above the water, and small lily pads clustered near the edges to stop the lake feeling empty.
- Shoreline life increased: denser reeds and more shore stones, still leaving the central arrival open. Performance target is to stay close to V14 rather than adding expensive real reflections.
- Verification still depends on the target devices. Run `npm test`, then compare V14 and V15 at the same station and flower count.

## V16 — Moonlit finale
- Based on the delivered V15. Keeps the existing four stations, music source, density settings, two geometric flower LODs and adaptive rendering. No real scene reflections or additional full-screen postprocessing passes.
- Camera rises on the last stretch, reduces pointer influence and settles gently at the lake. Final framing is adjusted separately for portrait. The final verse remains for nine seconds and can be hidden or restored by an explicit button; reduced-motion users retain the text unless they dismiss it. Replay remains available.
- Deterministic clusters of notched floating lily leaves, sculpted water lily blossoms and distinct cattails along the banks. All use instanced meshes. Fixes the previous surface mist's double vertical offset, honors the Mist and Low GPU controls, and scales water motes with render height. Adds a restrained elongated analytic moon reflection. The cattails are static, while the inherited grasses and water animate.
- Validation: 30 Node logic tests and JavaScript syntax checks. Three.js/Vite are not installed in the current environment; shader compilation, visual appearance, production build, playback and real FPS require browser testing. Compare at the final station using End on desktop and the same flower count, resolution and effects. The water reflection is still simulated.
