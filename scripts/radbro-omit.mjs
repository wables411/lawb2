// Assets deliberately LEFT OUT of the radbro.fun standalone ZIP.
//
// Single source of truth, imported by BOTH vite.radbro.config.ts (which forwards it to the
// app as VITE_ARCADE_OMIT so the loaders never request them) and build-radbro-zip.mjs (which
// copies everything in public/arcade-assets EXCEPT these). If the two ever disagreed, the
// build would ship a game that fetches 404s on every menu interaction — which is exactly the
// bug this file exists to prevent.
//
// Why each is omitted:
//   coral2 / trash-cube — the two heaviest GLBs (7.3 MB + 4.8 MB); the coral and trash
//                         rotations have plenty of other variants.
//   *dance FBX          — menu dance loop only; ~10 MB across the trio for an idle flourish.
//   lawbkick / lawbpunchcombo — clawb combat clips from another feature; Reef Run never
//                         references them (not in ARCADE_CHARACTERS).
export const RADBRO_OMITTED_ASSETS = [
  'coral2.glb',
  'trash-cube.glb',
  'lawbdance1.fbx',
  'radbrodance.fbx',
  'milady11dance.fbx',
  'lawbkick.fbx',
  'lawbpunchcombo.fbx',
];
