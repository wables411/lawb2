World Asset Starter Pack (CC0)

This folder contains a first-pass texture pack for Clawb's World.

Sources:
- ambientCG (CC0): `Ground103`, `Rock063`, `Grass005`
- Poly Haven (CC0): `rocks_ground_04`
- Poly Haven Models (CC0): `coast_rocks_01`, `coast_rocks_02`, `lambis_shell`
- Poly Haven Models (CC0): `dry_branches_medium_01`, `rock_moss_set_01`, `flower_heliophila`, `crystalline_iceplant`, `dead_quiver_branch_01`

Local paths used by runtime:
- `public/world-assets/materials/Ground103/*`
- `public/world-assets/materials/Rock063/*`
- `public/world-assets/materials/Grass005/*`
- `public/world-assets/polyhaven/rocks_ground_04_*`
- `public/models/polyhaven/coast_rocks_01/*`
- `public/models/polyhaven/coast_rocks_02/*`
- `public/models/polyhaven/lambis_shell/*`
- `public/models/polyhaven/dry_branches_medium_01/*`
- `public/models/polyhaven/rock_moss_set_01/*`
- `public/models/polyhaven/flower_heliophila/*`
- `public/models/polyhaven/crystalline_iceplant/*`
- `public/models/polyhaven/dead_quiver_branch_01/*`

Notes:
- All imported packs are currently 2K variants for stream-safe performance.
- Imported model bundles are 1K glTF variants for stream-safe performance.
- Coral/anemone placeholders now map to scanned organic stand-ins until true marine coral packs are added.
- `src/utils/worldObjects.ts` now prefers these textures and falls back to procedural maps if unavailable.
