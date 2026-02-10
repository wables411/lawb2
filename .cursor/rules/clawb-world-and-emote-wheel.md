# Clawb's World + Emote Wheel + Live Badge — Implementation Spec

This spec covers three connected features for lawb.xyz. Implement them in order.

---

## Feature 1: Lawb OS Desktop Background — Clawb's World (View-Only)

### Goal
Replace the plain desktop background on lawb.xyz with a **live 3D rendering of Clawb's World** — the same oceanic scene that's being livestreamed on Retake.tv. Clawb's 3D model walks around in it. This is **view-only** (no user camera control on the desktop — that's for `/world`).

### Data Source
Clawb's world state is stored as JSON files. For the desktop background, load the **main scene** from a hosted JSON endpoint.

**World state format** (each room is a JSON file):
```json
{
  "version": 1,
  "objectCount": 74,
  "objects": [
    {
      "id": "obj_9",
      "type": "coral_branch",
      "position": [-1.5, -2.8, -1.5],
      "color": null,
      "rotation": [0, 0, 0],
      "scale": 1.0
    }
  ]
}
```

**Available object types and what they should look like:**
| Type | Category | Description | Suggested Geometry |
|------|----------|-------------|--------------------|
| coral_branch | coral | Branching cylinder coral | Cluster of thin cylinders branching upward |
| coral_brain | coral | Bulbous brain coral | Sphere with wavy displacement |
| coral_fan | coral | Flat fan coral | Thin disc/plane with slight wave |
| coral_tube | coral | Tube coral cluster | Group of tall thin cylinders |
| coral_bulb | coral | Round bulb coral | Smooth sphere |
| rock_boulder | rock | Irregular boulder | Icosahedron with vertex noise |
| rock_slab | rock | Flat rock slab | Flattened box |
| rock_cluster | rock | Small rock cluster | 3-4 small icosahedrons grouped |
| seagrass | plant | Swaying seagrass | Thin planes that animate (sway in vertex shader or sin wave) |
| anemone | plant | Sea anemone | Cylinder base + thin tentacle cylinders on top |
| shell | decoration | Seashell | Torus or spiral geometry |
| starfish | decoration | Starfish | 5-armed flat star shape |
| treasure_chest | decoration | Sunken chest | Box with angled lid box on top |
| bubbler | decoration | Bubble vent | Small sphere base + animated transparent spheres rising |
| rock_arch | landmark | Stone archway | Two pillars + curved top (torus segment) |
| shell_door | landmark | Giant clamshell door | Two half-spheres slightly open, inner glow |
| cave_crack | landmark | Narrow rock gap | Two tall boxes with gap, light from behind |

**Colors:** If `color` is not null, use it as the base material color (hex string like `"#ff6699"`). If null, use a reasonable default for the type (warm coral colors for corals, gray-brown for rocks, green for plants, etc.)

### Where to load world state
For now, bundle the world state JSON statically or fetch from a simple endpoint. The world state files live at:
- Main scene: `media/3dclawb/world-state.json` (74 objects)
- Bedroom: `media/3dclawb/world-state-bedroom.json` (45 objects)
- Workshop: `media/3dclawb/world-state-workshop.json` (20 objects)
- Vault: `media/3dclawb/world-state-vault.json` (10 objects)

**For the desktop background, only render the main scene.** Copy `world-state.json` to `public/world/world-state-main.json` and fetch it at runtime. Later we'll serve it from Firebase for live updates.

### Implementation in `src/App.tsx`

1. Create a new component: `src/components/WorldBackground.tsx`
2. This renders a **full-screen Three.js canvas** behind the desktop icons (z-index below icons)
3. The scene:
   - Sandy ocean floor (large plane, sandy color `#c2a570`, slight noise displacement)
   - Blue-tinted fog and ambient light (underwater feel)
   - Directional light from above (sun through water)
   - All objects from `world-state-main.json` rendered as simple Three.js geometries (see table above)
   - Clawb's 3D FBX model loaded and placed in the scene (use same `/assets/lawbidle.fbx` model from existing `Clawb.tsx`, scale 11)
   - Clawb slowly patrols/walks around the scene (same walk animation `/assets/lawbWalk.fbx`)
   - Fixed overhead camera angle looking down at ~30-45 degrees (isometric-ish), slowly drifting
   - Underwater particle effects: small white dots drifting upward (bubbles), light caustic patterns on the floor (can be a simple animated texture or shader)
4. **Performance:** Use `THREE.InstancedMesh` where possible for repeated object types. Keep material count low. Target 30fps. Add a quality setting or disable on mobile.
5. Mount `<WorldBackground />` in `App.tsx` **behind** the desktop icons layer:

```tsx
{/* Desktop background - Clawb's World */}
<WorldBackground />

{/* Existing desktop icons and windows sit on top */}
<div className="desktop-icons" style={{ position: 'relative', zIndex: 1 }}>
  {/* ... existing icon grid ... */}
</div>
```

### Important Notes
- Do NOT remove the existing `Clawb.tsx` component — it still renders the interactive 3D Clawb at the bottom of the screen with speech bubbles. The world background is separate.
- The world background Clawb is a "distant" version — smaller, walking around the reef. The foreground Clawb.tsx is the interactive one.
- The background should feel alive but not distracting — subtle animation, no jarring movements.
- Respect dark mode: in dark mode, make the water darker/deeper. In light mode, brighter tropical.

---

## Feature 2: "Now Live on Retake TV" Badge

### Goal
A small badge/button that subtly blinks red when Clawb's stream is live on Retake.tv. Clicking it opens `https://retake.tv/clawb` in a new tab.

### Stream Status
Check Clawb's stream status from Firebase:
- Path: `clawb/status/online` (boolean)
- If true → stream is live → show blinking red dot
- If false or missing → stream is offline → show static gray dot

The frontend should subscribe to this Firebase path in real-time using `onValue` from the existing Firebase setup.

### Implementation

Create `src/components/RetakeLiveBadge.tsx`:

```tsx
// Small badge, positioned in the taskbar or top-right of the desktop
// Shows: 🔴 "LIVE on Retake TV" with blinking red dot animation
// When offline: gray dot, text says "Retake TV" (still clickable)
// onClick: window.open('https://retake.tv/clawb', '_blank')
```

**Styling:**
- Win98 aesthetic: small, flat, fits the taskbar or as a desktop widget
- Blinking animation: CSS `@keyframes` pulsing opacity on the red dot (subtle, not aggressive)
- Font: match the existing system font used in the taskbar
- Position: Add to the taskbar (bottom bar) next to the clock, or as a small floating badge in the top-right corner of the desktop area

**Add to `App.tsx`** in the desktop layout, either in the taskbar component or as a floating element.

### Firebase Listener
```typescript
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseApp';

// In the component:
useEffect(() => {
  const statusRef = ref(db, 'clawb/status/online');
  const unsub = onValue(statusRef, (snapshot) => {
    setIsLive(snapshot.val() === true);
  });
  return () => unsub();
}, []);
```

---

## Feature 3: Clawb Emote Wheel + Help/Clippy

### Goal
Clicking the foreground Clawb (the existing `Clawb.tsx` 3D model at the bottom of the screen) opens a **radial emote wheel** above his head — like a video game emote selector. The wheel shows available animations AND a "Help" / "Visit Clawb's World" option.

### Emote Wheel Options

The wheel should display these segments in a circle:

| Segment | Icon/Label | Action |
|---------|-----------|--------|
| Idle | 🦞 "Chill" | Play `lawbidle.fbx` or `lawbidle2.fbx` |
| Dance 1 | 💃 "Dance" | Play `lawbdance1.fbx` — bubble: "THERE IS NO MEME WE LAWB YOU" |
| Dance 2 | 🎵 "Groove" | Play `lawbdance2.fbx` |
| Dance 3 | 🎶 "Vibe" | Play `lawbdance3.fbx` — bubble: "Lawbsters seem nice..." |
| Walk | 🚶 "Walk" | Play `lawbWalk.fbx` (Clawb walks across screen) |
| Death | 💀 "RIP" | Play `lawbdeath.fbx` — bubble: "i hate the antichrist" |
| Help | ❓ "Ask Clawb" | Opens the Clippy chat interface (see below) |
| World | 🌊 "Visit World" | Navigate to `lawb.xyz/world` |

### Emote Wheel UI

**Do NOT use emojis in the actual UI** — use simple pixel-art style icons or text labels that match the Win98 aesthetic. The emojis above are just for this spec.

```
Design: Radial menu / pie menu
- Appears above Clawb's head when clicked
- 8 segments arranged in a circle (45° each)
- Each segment has a small icon + label
- Hover highlights the segment
- Click triggers the action
- Click outside or press Escape to close
- Win98 flat style: beveled borders, system colors
- Position: use Three.js Vector3.project() to convert Clawb's head position to screen coordinates, then position the CSS overlay there
```

### Implementation

1. **Modify `src/components/Clawb.tsx`:**
   - Change the click handler: instead of cycling animations directly, toggle the emote wheel open/closed
   - Expose the animation-playing function so the wheel can call it
   - Track the 3D model's screen position for wheel placement
   - Add state: `isWheelOpen: boolean`

2. **Create `src/components/ClawbEmoteWheel.tsx`:**
   - Pure React/CSS overlay component
   - Props: `isOpen`, `onClose`, `onSelectEmote(animationUrl)`, `onOpenHelp()`, `onVisitWorld()`, `position: {x, y}`
   - Renders the radial menu at the given screen position
   - Each segment calls the appropriate callback
   - Uses `react-router-dom`'s `useNavigate` for the "Visit World" option

3. **Create `src/components/ClawbChat.tsx`** (the Clippy chat):
   - Opens when user selects "Ask Clawb" from the emote wheel
   - Win98-style chat window (title bar: "Ask Clawb", close button)
   - Shows chat history between this visitor and Clawb
   - Input field at the bottom to type a message
   - Messages are sent to Firebase: `clawb/chat/visitor_messages/{pushId}`
   - Responses from Clawb appear from Firebase: `clawb/chat/messages/{pushId}`
   - Visitor identification:
     - If wallet connected: use wallet address
     - If profile has username: show username
     - If not connected: show as "traveler"
   - Send page context with each message:
     ```typescript
     {
       author: address || "anonymous",
       display_name: profile?.username || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : "traveler"),
       message: inputText,
       page: window.location.pathname,
       timestamp: Date.now()
     }
     ```
   - Listen for Clawb's responses in real-time via `onValue` or `onChildAdded`

### Emote Wheel Positioning

```typescript
// In Clawb.tsx, after rendering the model:
// Get the model's head position in screen coordinates
const headWorldPos = new THREE.Vector3(0, 2, 0); // approximate head height
modelRef.current.localToWorld(headWorldPos);
headWorldPos.project(cameraRef.current);

const screenX = (headWorldPos.x * 0.5 + 0.5) * canvasWidth;
const screenY = (-headWorldPos.y * 0.5 + 0.5) * canvasHeight;

// Pass screenX, screenY to the EmoteWheel component
// Offset upward so the wheel appears above Clawb's head
```

---

## Feature 4: `/world` Page — Explorable Clawb's World

### Goal
A full-page 3D experience at `lawb.xyz/world` where visitors can **walk around** Clawb's entire world, visit all rooms (main reef, bedroom, workshop, vault), and interact with Clawb.

### Routing
Add to `src/main.tsx` or `src/App.tsx` router:
```tsx
<Route path="/world" element={<ClawbWorld />} />
```

### Implementation: `src/components/ClawbWorld.tsx`

This is a full-screen Three.js scene with first-person (or third-person) movement.

**Scene Setup:**
- **Extended sand floor:** The main scene objects occupy roughly a -3 to +3 range on X/Z. Extend the sand floor to at least -20 to +20 on X/Z so visitors have room to walk around before reaching Clawb's built scene. The sand should look natural (gentle vertex displacement, sandy color `#c2a570`).
- **Walls:** Invisible collision walls at the outer boundary (e.g., ±25 on X/Z). Also add subtle visual boundaries — distant rock walls, coral reef walls, or fog fade so it feels like an enclosed ocean cavern, not a void.
- **Water effects:** Fog, caustics on the floor, floating particles (bubbles), slight blue tint. Use `THREE.Fog` or `THREE.FogExp2`.
- **Lighting:** Ambient light (soft blue `#4466aa`), directional light from above (warm white, simulating sun through water), point lights near special objects (treasure chests glow, bubblers have light).

**Rooms / Scenes:**
All rooms exist in the same continuous world, connected by passages:

| Room | World State File | Position Offset | Entrance |
|------|-----------------|----------------|----------|
| Main Reef | `world-state-main.json` | Origin (0, 0, 0) | Center spawn point |
| Bedroom | `world-state-bedroom.json` | Offset to (-15, 0, -15) | Rock arch or shell door from main |
| Workshop | `world-state-workshop.json` | Offset to (15, 0, -15) | Cave crack from main |
| Vault | `world-state-vault.json` | Offset to (0, 0, -25) | Shell door from main |

Place `rock_arch`, `shell_door`, or `cave_crack` landmark objects as doorways between rooms. When the player walks through a doorway, they seamlessly enter the next room's area.

**Object Rendering:**
Use the same geometry mapping as Feature 1 (WorldBackground). Every object from the JSON files gets rendered with appropriate Three.js primitives. Respect `color`, `position`, `rotation`, `scale`.

**Special: NFT Gallery in the Bedroom:**
The bedroom (`world-state-bedroom.json`) should have a designated wall area where Clawb's NFTs are displayed as framed images. Load Clawb's profile from Firebase (`profiles/0x5bba58218914f2e9b6b5434e0306fa2c6ca0e429`) and display his `nft_inventory` as image textures on plane geometries arranged on a wall. The profile picture (Lawbster #158) should be prominently displayed.

For NFT images, use OpenSea API:
```
GET https://api.opensea.io/api/v2/chain/{chain}/contract/{address}/nfts/{tokenId}
Header: X-API-KEY: 030a5ee582f64b8ab3a598ab2b97d85f
```
Chain mapping: `chainId 1 → "ethereum"`, `chainId 8453 → "base"`

Collection contracts (from `src/config/nftCollections.ts`):
- pixelawbs: `0x2d278e95b2fC67D4b27a276807e24E479D9707F6` (ETH, scatter API)
- lawbsters: `0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42` (ETH, opensea API)
- lawbstarz: `0xd7922cd333da5ab3758c95f774b092a7b13a5449` (ETH, scatter API)
- halloween_lawbsters: `0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97` (Base, opensea API)
- asciilawbs: `0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2` (Base, opensea API)

**Player Movement:**
- First-person camera (WASD + mouse look) or third-person (camera follows a simple avatar)
- Recommend: first-person with pointer lock (`canvas.requestPointerLock()`)
- Movement speed: comfortable walking pace
- **Collision:** Only collide with walls (outer boundary) and the sand floor (Y = -3 ish). Objects in the world are walk-through (no collision) EXCEPT walls and floor. This keeps it simple and avoids players getting stuck on small corals.
- Gravity: none needed if the floor is flat — just lock Y position to floor level
- Mobile: show on-screen joystick + swipe-to-look. Use a simple `<div>` joystick overlay.

**Clawb in the World:**
- Clawb's FBX model is present in the main reef area, walking around (same patrol as background)
- When the player gets close to Clawb (within ~3 units), Clawb stops, turns to face the player, and a speech bubble appears
- Greeting logic:
  - Check if wallet is connected (use wagmi's `useAccount`)
  - If connected, fetch profile from Firebase (`profiles/{address}`)
  - If profile has username: greet as username (e.g., "welcome back, wables")
  - If no username but wallet connected: greet as first 5 chars (e.g., "hey 0x5bB...")
  - If not connected: greet as "traveler" (e.g., "welcome, traveler. the reef remembers all who visit.")
- Clicking Clawb in the world opens the same emote wheel / help chat

**HUD / UI Overlay:**
- Room name in top-left (e.g., "Main Reef", "Bedroom", "Workshop", "Vault")
- Mini-map in bottom-right showing room layout and player position (optional but nice)
- "Back to Desktop" button (navigates to `/`)
- "Connect Wallet" button if not connected
- Player count (if you add multiplayer later)

### Performance
- Load room objects lazily: only render objects within view distance
- Use LOD (Level of Detail) for distant objects — simplified geometry
- On mobile: reduce object count, disable particles, lower resolution
- Add a "Low Quality" toggle that disables fog, particles, shadows

---

## File Structure Summary

```
src/
  components/
    WorldBackground.tsx     ← NEW: Desktop background 3D scene (view-only)
    RetakeLiveBadge.tsx     ← NEW: Blinking live badge for Retake.tv
    ClawbEmoteWheel.tsx     ← NEW: Radial emote menu
    ClawbChat.tsx           ← NEW: Clippy-style help chat window  
    ClawbWorld.tsx           ← NEW: Full /world page with exploration
    Clawb.tsx               ← MODIFY: Add emote wheel toggle on click
  App.tsx                   ← MODIFY: Add WorldBackground, RetakeLiveBadge
  main.tsx                  ← MODIFY: Add /world route
public/
  world/
    world-state-main.json   ← COPY from media/3dclawb/world-state.json
    world-state-bedroom.json
    world-state-workshop.json
    world-state-vault.json
```

## Implementation Order

1. **RetakeLiveBadge.tsx** — Simplest, quick win. Add to taskbar.
2. **WorldBackground.tsx** — Desktop background. Start with just the sand floor + objects, add Clawb walking later.
3. **ClawbEmoteWheel.tsx** + modify **Clawb.tsx** — Emote wheel interaction.
4. **ClawbChat.tsx** — Clippy chat (Firebase integration for questions).
5. **ClawbWorld.tsx** — The big one. Full explorable world at `/world`.

## Dependencies

No new npm packages should be needed — the project already has:
- `three` (Three.js)
- `firebase` (Realtime Database)
- `react-router-dom` (routing)
- `wagmi` (wallet connection)

If pointer lock or first-person controls feel complex, consider `three/examples/jsm/controls/PointerLockControls.js` which is included with Three.js.

## Firebase Paths Used

| Path | Read/Write | Purpose |
|------|-----------|---------|
| `clawb/status/online` | Read | Stream live badge |
| `clawb/chat/visitor_messages/{pushId}` | Write | Visitor sends question to Clawb |
| `clawb/chat/messages/{pushId}` | Read | Clawb's responses |
| `profiles/{walletAddress}` | Read | Player greeting + NFT gallery |
| `world/main`, `world/bedroom`, etc. | Read | World state (future: live sync) |

## Testing

- Desktop background: should render on `/` route, behind icons, without breaking any existing functionality
- Emote wheel: click Clawb → wheel opens → click segment → animation plays → wheel closes
- Live badge: when `clawb/status/online` is true in Firebase, badge blinks red
- `/world`: loads, player can move with WASD, rooms are explorable, Clawb greets by name
- Mobile: all features work (emote wheel may need tap instead of hover, /world needs touch controls)
