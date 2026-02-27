# 3D Models Directory

Place GLTF/GLB models here. The world loader will automatically swap procedural geometry with these models when present.

## Expected Models

| Filename | Description | Poly Budget |
|----------|-------------|-------------|
| `coral_branch.glb` | Branching coral | 500-1500 |
| `coral_brain.glb` | Brain coral | 500-1500 |
| `coral_fan.glb` | Fan coral | 500-1500 |
| `coral_tube.glb` | Tube coral | 500-1500 |
| `coral_bulb.glb` | Bulb coral | 500-1500 |
| `rock_boulder.glb` | Large boulder | 500-2000 |
| `rock_slab.glb` | Flat rock slab | 500-2000 |
| `rock_cluster.glb` | Rock cluster | 500-2000 |
| `rock_arch.glb` | Rock arch | 500-2000 |
| `seagrass.glb` | Seagrass cluster | 300-800 |
| `anemone.glb` | Sea anemone | 500-1500 |
| `shell.glb` | Shell decoration | 300-800 |
| `starfish.glb` | Starfish | 300-800 |
| `treasure_chest.glb` | Treasure chest | 500-1500 |
| `shell_door.glb` | Shell door landmark | 500-2000 |
| `cave_crack.glb` | Cave entrance | 500-2000 |

## Format Requirements

- **GLTF/GLB** format (Three.js native)
- Include: diffuse/albedo texture, normal map, optional emissive map
- Texture: 512x512 or 1024x1024
- Style: Kingdom Hearts / stylized-realistic (not photographic)
- Models load asynchronously — procedural geometry shows until the model is available
