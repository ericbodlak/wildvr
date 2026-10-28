# Quest 3 & Desktop Virtual Environment Studio — Good Ideas & Architecture Roadmap

This document captures the architectural vision, tool specifications, and future expansion roadmap for developing interactive Quest 3 and desktop virtual environments in Antigravity.

---

## 1. Dual Aesthetic Rendering Modes (`beautiful-realism` & `beautiful-low-res`)

The studio must support two distinct, hot-swappable visual styles driven by the exact same underlying spatial entities and floorplan geometry:

### A. `beautiful-realism` (Architectural & Landscape Realism Mode)
* **Primary Use Case:** Experiencing, evaluating, and iterating on custom house designs, interior architectural finishes, natural daylighting, and realistic landscaping.
* **Rendering Pipeline:**
  * **Physically Based Rendering (PBR) Materials:** High-fidelity material definitions (`MeshPhysicalMaterial` / OpenXR PBR) featuring natural wood grain, troweled plaster/stucco, brushed architectural metals, travertine/flagstone surfaces, and physical glass with Fresnel reflections, refraction, and clearcoat (`transmission`, `ior: 1.5`, `roughness`).
  * **Realistic Lighting & Atmosphere:** Physical sun/sky model with time-of-day solar azimuth/elevation, HDRI environment reflections, soft contact shadows, ambient occlusion (SSAO / baked lightmaps), and realistic water shaders with subtle normal-map ripples and shoreline foam.
  * **Realistic Landscaping Assets:** Multi-layered botanical geometry (foliage cards/high-detail canopies, bark textures, groundcover, stone retaining walls, and warm architectural path lighting).

### B. `beautiful-low-res` (Serene *Walkabout*-Style Faceted Diorama Mode)
* **Primary Use Case:** Serene *Walkabout Mini Golf*-style exploration, mini-games, and ultra-responsive 90–120 Hz standalone Quest 3 sessions.
* **Rendering Pipeline:**
  * **PixPal Single-Palette Texturing:** Shared microscopic color palette textures with `Nearest` interpolation and zero per-object texture fetches.
  * **Crisp Faceted Shading:** Matte surfaces (`roughness: 0.95`, `metalness: 0.02`, `flatShading: true` or weighted bevel normals) where every polygon facet catches warm directional sunlight and cool hemisphere bounce light like a handcrafted tabletop diorama.

### C. Hybrid Aesthetic Rule (`beautiful-low-res` World + Optional `beautiful-realism` for User-Built Entities)
* **Wild Environment (`beautiful-low-res` Always):** All untouched natural terrain, waterways, trees, boulders, and sky domes use the serene, high-framerate `beautiful-low-res` faceted aesthetic.
* **User-Built Entities (`beautiful-realism` or `beautiful-low-res` Toggleable):** Every entity explicitly built by the user (custom house rooms, roofs, windows, furniture, decks, and custom landscaping) exposes material slots that can be toggled live on the wristwatch between **`beautiful-realism`** (PBR wood, refractive glass, stone, brushed metal) and **`beautiful-low-res`** (faceted PixPal diorama). This also concentrates 100% of the Quest 3's PBR shader budget on your custom architecture.

---

## 2. Interactive 2D/3D Computer CAD & Semantic Vision Sketching Tool

To make defining and editing a custom house and surrounding landscape effortless on a regular computer, we will build a **Vision Canvas & Floorplan Studio** tool:

### A. Geometric Drawing Primitives
Users can sketch layouts on a 2D/2.5D architectural grid (with optional background site-plan image overlay and snap-to-grid / angle-snap):
1. **Lines & Polylines:** Exterior/interior structural walls, property boundaries, fences, retaining walls, edges, and linear hedges.
2. **Splines / Bezier Curves:** Winding garden pathways, curved driveways, organic flowerbed borders, pond/shoreline contours, and curving mini-golf fairways.
3. **Boxes / Rectangles:** Room footprints, kitchen islands, decks, patios, lap pools, pergolas, skylights, and furniture zones.
4. **Ellipses / Circles:** Tree canopies, round firepit gathering areas, fountains, circular dining areas, and boulder clusters.
5. **Polygons:** Custom-angled rooms, bay windows, irregular terraces, property lots, and complex roof footprints.

### B. Semantic Instruction Text Boxes ("Vision Callouts")
* Any drawn primitive (line, spline, box, ellipse, polygon) or pinned canvas region can have an attached **Text Box** where the user types natural-language instructions describing their vision for that specific element or zone.
* **Examples of Shape + Text Box Pairings:**
  * *Rectangle `[8m x 6m]` + Text Box:* `"Great room with 14-foot vaulted cedar ceiling, exposed timber trusses, limestone fireplace on north wall, and floor-to-ceiling sliding glass doors opening to the west patio."`
  * *Spline `[15m curve]` + Text Box:* `"Winding flagstone garden path bordered by lavender, ornamental grasses, and warm low-voltage brass path bollards."`
  * *Ellipse `[4m x 4m]` + Text Box:* `"Sunken circular stone firepit with built-in curved redwood bench seating overlooking the water."`

### C. Deterministic Compilation Pipeline
* Exporting or saving the canvas serializes both the exact mathematical geometry (vertices, control points, dimensions, layer tags) and the user's text-box vision prompts into a structured specification (`vision_sketch.json`) that Antigravity translates into 3D entities.

---

## 3. Code-First Entity Persistence & Surgical Iteration

Once an architectural room, structural feature, or landscape element is generated from the Vision Canvas, it must **never** live inside a fragile monolithic blob.

### A. Modular, Version-Controlled Entity Files
* Every generated element is stored as a discrete, precisely coded module inside an organized hierarchy:
  * `entities/house/<entity_id>.py` (or `.js` / `.json` parametric descriptor) — e.g., `great_room.py`, `vaulted_cedar_roof.py`, `west_patio_deck.py`, `kitchen_island.py`.
  * `entities/landscape/<entity_id>.py` — e.g., `flagstone_garden_path.py`, `sunken_firepit.py`, `japanese_maple_cluster.py`.
  * `entities/minigames/<entity_id>.py` — e.g., `courtyard_putting_green.py`.

### B. "Preserve What We Like, Iterate on What We Don't"
* **Entity Locking (`locked: true`):** Any entity the user is happy with can be marked as locked/frozen in the scene manifest and verified by `tools/zero_truncation_enforcer.py` so subsequent iterations never alter it.
* **Surgical Tool Compatibility:** Because each entity is a standalone, well-typed code file adhering to the Humble Object Pattern:
  * We can inspect its caller/dependency blast radius with `tools/code_symbol_dag.py`.
  * We can modify a single window, roof pitch, or plant species using `/code_modify` or by updating its text box on the Vision Canvas and regenerating *only* that entity file.
  * Every entity file carries `@premise` traceability and unit tests verifying its bounding box, teleportable floor surfaces, and dual-style (`beautiful-realism` + `beautiful-low-res`) material mappings.

---

## 4. Additional Studio & Gameplay Refinements Backlog

1. **In-World 3D Room & Wall Manipulator:**
   * Point-and-click in 3D (desktop mouse or Quest 3 laser pointer) to select any entity, inspect its source file and vision text box, drag walls/furniture with live dimension readouts, and commit changes back to the entity's code file.
2. **Multi-Hole Walkabout Course & Minigame Generator:**
   * Expandable 9-hole or 18-hole procedural mini-golf course integrated into the landscape (bridges, ramps, water hazards, moving obstacles, and 6DoF putter club physics).
3. **Headless Blender (`bpy`) Dual-LOD `.glb` Asset Pipeline:**
   * A reusable Python tool (`tools/blender_entity_builder.py`) that invokes Blender headlessly (`blender -b -P ...`) to compile complex architectural joinery, custom furniture, and organic foliage into optimized `.glb` assets with both `beautiful-realism` PBR materials and `beautiful-low-res` PixPal UV mappings.

---

## 5. Password-Protected Co-Op Sharing, Spatial Voice Chat & Avatars

### A. GitHub Pages Worldwide Hosting, Double-Locked Password Gate & Spatial Voice (`WebRTC` + `Trystero`)
* **Primary Hosting Pathway — GitHub Pages (`https://<username>.github.io/<repo>/`):**
  * **100% Free Worldwide HTTPS:** GitHub Pages serves static WebXR assets over `https://` with global CDN caching, automatically satisfying Meta Quest Browser's strict secure-context requirement for both **Immersive WebXR (`navigator.xr`)** and **Microphone Access (`getUserMedia`)**.
  * **One-Command Git Deployment:** Managed as an isolated Git repository in `projects/wild_vr_studio/`, publishing updates worldwide is a single `git push` (with an automated GitHub Action or `gh-pages` branch publish step).
* **Double-Locked Password Protection (Private Scene + Private Multiplayer):**
  1. **Layer 1 — Client-Side AES-256-GCM Blueprint Encryption (`Web Crypto API`):** Because GitHub Pages sites use a public URL, our build tool can encrypt the house/landscape blueprint (`scene_blueprint.enc` via `PBKDF2` + `AES-256-GCM`) using your password before pushing. Visitors see only a clean password prompt until they enter the shared password, which decrypts the 3D environment directly in browser memory.
  2. **Layer 2 — End-to-End Encrypted WebRTC Room (`Trystero`):** That exact same password is fed into **Trystero** (`joinRoom({ appId, password }, roomName)`) to derive the encrypted peer-to-peer WebRTC signaling channel and punch through home routers worldwide via public STUN servers (`stun.l.google.com:19302` / `stun.cloudflare.com:3478`).
* **3D Positional Microphone Audio & Live State Sync:**
  * Browser-native `navigator.mediaDevices.getUserMedia({ audio: true })` streams each participant's microphone over WebRTC into a Three.js `THREE.PositionalAudio` node attached to their 3D avatar head (plus an `AnalyserNode` for real-time lip-sync), while house modifications and mini-golf shots sync across a WebRTC data channel.


### B. Avatar System (Meta-Avatar-Style Upper-Body IK & *Walkabout*-Style Avatars)
* **Why Native *Walkabout* and Official *Meta Avatars* Can't Be Pulled Directly via Browser API:**
  * *Walkabout Mini Golf* stores its avatars in a private, closed save file.
  * Meta's official **Meta Avatars SDK** (now End-of-Feature at v40.0.1) is restricted to compiled native **Unity/Unreal APKs** with Meta Store App ID entitlements and C++ `.so` binaries—Meta does not expose it to WebXR browsers or desktop visitors.
* **Our Drop-In Solution (Meta-Avatar-Style Half-Body `.glb` + Built-In Customizer):**
  1. **Meta-Avatar-Style Upper-Body Rig (`.glb` / VRM + 3-Point IK):** We use standard `.glb` / `.vrm` half-body avatars (with head, torso, arms, hands, hair, and glasses—identical in feel to Meta Avatars). In VR and desktop mode, 3-point Inverse Kinematics (IK) drives the head, torso lean, and left/right hands from your Quest 3 controllers, while a Web Audio `AnalyserNode` drives mouth/jaw lip-sync when you speak into your microphone.
  2. **Selfie-to-Avatar or Built-In Studio Customizer:** You and your guests can either generate a `.glb` avatar from a selfie (via free web tools like *MetaPerson* or *VRoid/OpenSourceAvatars*) or pick skin tone, hair, glasses, hat, and outfit in our built-in wristwatch customizer (stored as a clean code/JSON file in `entities/avatars/`).
  3. **Dual-Aesthetic Adaptation:** The avatar shader automatically renders with smooth PBR skin/fabric in `beautiful-realism` mode and crisp faceted shading in `beautiful-low-res` mode.

### C. Expressive Hand Gestures, Two-Finger Teleport/Flight & Arm-Flap Locomotion
Our gesture and locomotion system binds specific finger poses and arm kinematics to distinct actions across both Optical Hand Tracking (`XRHand`) and Quest 3 Touch Plus controllers (`xr-standard` Gamepad + capacitive sensors):
* **1-Finger Point (Index Finger Alone) $\rightarrow$ Selection & UI Interaction (`INDEX_POINT`):**
  * Extending the index finger alone ($e_{\text{index}} \ge 0.70$, middle/ring/pinky curled) projects a crisp selection ray to highlight architectural entities, inspect room specs, or press wristwatch buttons.
* **2-Finger Point (Index + Middle Together) $\rightarrow$ Parabolic Teleport (`TWO_FINGER_POINT`):**
  * Extending the index and middle fingers together side-by-side ($\text{spread} \le 18^\circ$, ring/pinky curled) projects the golden parabolic teleport arc onto valid floor/terrain surfaces; relaxing the fingers executes the teleport.
* **Flight Mode A — 2-Finger Sky Ignition + Continuous 3D Hand Steering:**
  * Pointing the **index and middle fingers together into the sky** ($\hat{\mathbf{f}}_{\text{hand}} \cdot \mathbf{u}_y \ge \sin 55^\circ$) ignites and latches flight mode.
  * Once airborne, keeping the index and middle fingers extended lets you aim your hand **in any 3D direction** (level, banking, climbing, or diving) and fly directly where you point.
* **Flight Mode B — Arm-Flapping Lift + Head-Direction Steering:**
  * Flapping both arms up and down ($|v_{L,y}| + |v_{R,y}| > \tau_{\text{flap}}$ relative to the head) charges a smooth flight momentum reservoir $E(t)$ while **your head gaze direction ($\hat{\mathbf{f}}_{\text{head}}$) dictates where you fly**.
* **Trigger-Gated Look Steering vs. Controller Steering + Joystick Throttle (`evaluate_dual_steered_flight`):**
  * While flying with a controller, **joystick vertical deflection ($s_{\text{joy}} \in [-1, 1]$) always controls flight speed** ($v = v_{\max} \cdot s_{\text{joy}}$):
    * **Trigger HELD (`buttons[0].pressed`):** Flight direction locks onto **where you are looking ($\hat{\mathbf{f}}_{\text{head}}$)**.
    * **Trigger NOT Held (`!buttons[0].pressed`):** Flight direction follows **where the controller is pointing ($\hat{\mathbf{f}}_{\text{ctrl}}$)**, letting you freely look around at the scenery while cruising along your controller's heading.
* **Ground Locomotion: Joystick Teleport vs. Trigger + Joystick Smooth Walking (`evaluate_ground_locomotion_and_clamp`):**
  * **Trigger NOT Held + Push Joystick Forward $\rightarrow$ Parabolic Teleport (`JOYSTICK_TELEPORT`):** Pushing the thumbstick forward on the ground projects the *Walkabout*-style parabolic teleport arc; releasing the stick teleports you cleanly to the target point on the terrain, trail, or house floor.
  * **Trigger HELD + Joystick $\rightarrow$ Standard Walking Pace (`SMOOTH_WALK`):** Holding the index trigger while tilting the joystick switches ground movement to smooth continuous locomotion at a natural human walking pace ($v_{\text{walk}} = 1.4\text{ m/s} \approx 3.1\text{ mph}$), gliding smoothly up and down topographic slopes and hiking trails.
  * **Strict Anti-Subterranean Ground Clamp ($y_{\text{feet}} \ge y_{\text{ground}}(x, z)$):** Neither flying, smooth walking, nor teleporting can ever move the user beneath the terrain surface or house floor. Any downward velocity or position below the local DEM/floor height $y_{\text{ground}}(x, z)$ is clamped to the surface tangent plane so you slide or land cleanly on your feet without clipping underground.
* **Social Emotes:**
  * **Thumbs-Up:** Side grip + index trigger squeezed while thumb is lifted off capacitive sensors.
  * **"Come Hither" (Beckoning):** Pulling the thumbstick backward while holding side grip runs a sinusoidal finger-curl wave.

---

## 6. Deterministic Lat/Lon Pristine Wilderness, Real Hiking Trails, Weather & Astronomical Sky

### A. Setting Origin by Latitude & Longitude $(\phi_0, \lambda_0)$ & Saved Locations
* Any real-world coordinate $(\phi_0, \lambda_0)$ can be designated as $(0, 0, 0)$ of the environment (with local East $= +X$, Up $= +Y$, South $= +Z$ in tangent-plane ENU coordinates).
* **Saved Locations Bookmarks (`SavedLocationBookmark`):** You can save, name, and switch between multiple favorite real-world $(\phi_0, \lambda_0)$ locations directly from your wristwatch or desktop UI (e.g., `"Home Site"`, `"Grand Canyon North Rim"`, `"Olympic Rainforest"`, `"Scottish Highlands"`). Each saved location stores its coordinates, custom wristwatch settings ($E_{\text{topo}}$, season, storm probability, time offset), and lets you choose whether user-built structures are pinned to that specific site or brought along with you.
* The landscape is reconstructed as **100% pristine, untouched wilderness**—ignoring all modern paved roads, powerlines, and third-party buildings—except for **real natural hiking trails** and the structures/landscaping **you explicitly build**.

### B. Multi-Source Pristine Wilderness & Real Hiking Trail Pipeline
To make generation 100% repeatable and featherweight on CPU and Quest 3 RAM, we separate **One-Time Offline Geospatial Compilation** (`tools/quest_xr_scaffolder.py` / `geospatial_wild_compiler.py`) from **Zero-Cost Runtime Rendering**:
1. **Bare-Earth Topography (DEM):**
   * Queries free bare-earth elevation rasters (**Copernicus DEM GLO-30/GLO-90** via Open-Meteo Elevation API, **USGS 3DEP**, or **AWS Terrain Tiles**), which inherently measure ground elevation stripped of human buildings.
   * Compiles the heightfield using **RTIN (Right-Triangulated Irregular Network)** adaptive mesh decimation into a crisp `beautiful-low-res` faceted mesh (~3,000–8,000 triangles) that preserves exact ridgelines, valleys, and shoreline contours while using $< 200\text{ KB}$ of memory.
2. **Real Hiking Trails & Footpaths (`highway=path|footway|track`, `route=hiking`):**
   * Queries **OpenStreetMap Overpass API** (and USGS National Map / USFS trail vectors) strictly for natural foot trails (`highway=path|footway|bridleway` or `route=hiking`, including `sac_scale`, `surface=dirt|gravel|rock|ground`, and `bridge=boardwalk|yes`), while excluding motor roads and urban sidewalks.
   * Projects trail polylines into local $(x, z)$ coordinates, drapes them onto the bare-earth DEM $y_{\text{DEM}}(x, z)$ with cross-slope bench flattening (so switchbacks have a level walking tread), carves a $1.8\text{ m}$ vegetation clearance corridor so trees never block the trail, and renders crisp `beautiful-low-res` packed-earth/stone trail facets with rustic timber water-bars and stream footbridges.
3. **Natural Waterways & Topographic Hydrology:**
   * Combines natural hydrography vectors (**OpenStreetMap Overpass** filtered strictly to `natural=water|coastline` and `waterway=river|stream|waterfall`) with **D8 Topographic Wetness Index** ($\text{TWI} = \ln(a / \tan\beta)$) derived from the DEM slope $\beta$ and upslope catchment area $a$ to carve natural stream beds, lakes, and riparian zones.
4. **Climate, Soil & Potential Natural Vegetation (PNV Biome Synthesis):**
   * Pulls historical climate normals (**Open-Meteo Climate API**: temperature, precipitation, solar radiation), soil composition (**ISRIC SoilGrids**: pH, sand/silt/clay, organic carbon), and satellite spectral baselines to determine the site's **Potential Natural Vegetation (PNV)**—what species of trees, shrubs, grasses, and rock outcrops naturally thrive there untouched by humans.
5. **Zero-Memory Deterministic Spatial Hash (`PristineGeoEnvironmentEngine`):**
   * Instead of storing millions of tree/rock coordinates in RAM, every $(x, z)$ cell evaluates a pure, seed-deterministic spatial hash $H(x, z, \phi_0, \lambda_0)$ weighted by local elevation $z$, slope $\beta$, solar aspect (north- vs. south-facing slope), and soil wetness $\text{TWI}$, minus an exclusion mask around real hiking trails and your user-built entities.
   * All trees, boulders, and understory plants render via GPU `THREE.InstancedMesh` in `beautiful-low-res` mode—yielding **100% identical placement on every run with near-zero RAM**.

### C. Real-Life Sun, Moon & Star Ephemeris with $\pm 12\text{-Hour}$ Time Scrubbing
* **Exact Spherical Astronomy (`AstronomicalSkyService`):**
  * Given $(\phi_0, \lambda_0)$, current UTC timestamp $t_0$, and a wristwatch time-offset slider $\Delta t \in [-12.0\text{ h}, +12.0\text{ h}]$:
    1. Computes Julian Date $JD(t_0 + \Delta t)$ and Local Sidereal Time $\theta_{\text{LST}}(\lambda_0, JD)$.
    2. Computes exact **Solar Right Ascension, Declination, Altitude, and Azimuth** ($\text{Alt}_\odot, \text{Az}_\odot$) to drive directional sunlight angle, shadow length, and horizon twilight colors.
    3. Computes exact **Lunar Position and Illumination Phase** ($\text{Alt}_\mathbb{C}, \text{Az}_\mathbb{C}, \text{Phase} \in [0, 1]$) to position and light the 3D Moon in the sky.
    4. Rotates a compact **Real Star Catalog Dome** (top ~1,500 naked-eye stars from the Yale Bright Star / Hipparcos catalog, requiring only ~18 KB of GPU vertex memory) by latitude $(90^\circ - \phi_0)$ and $\theta_{\text{LST}}$ so the exact real-world constellations and Milky Way arch overhead as you scrub time forward or backward by up to 12 hours.

### D. Real-Location Weather Mirroring, Wristwatch Season/Storm Controls & *Walkabout*-Style Low-Res Physics
* **Live Location Weather Mirroring + Wristwatch Season & Storm Probability ($0\text{--}100\%$):**
  * **Real-Time Weather Sync:** Can query **Open-Meteo's keyless Live Weather API** at $(\phi_0, \lambda_0)$ for real-time cloud cover, wind speed/direction, precipitation, and temperature—or switch to **Wristwatch Manual Override**:
    * **Season Selector (`Spring` | `Summer` | `Autumn` | `Winter` | `Live`):** Shifts the `beautiful-low-res` PixPal foliage and terrain palette (e.g., spring blossoms and bright greens, deep summer greens, golden/crimson autumn canopies with falling leaves, or winter snow-dusted facets and frozen pond edges) and adjusts seasonal solar/temperature baselines.
    * **Storm Probability Slider ($P_{\text{storm}} \in [0\%, 100\%]$):** Drives a deterministic weather intensity state machine:
      * **$0\text{--}25\%$ (Calm / Fair):** Crisp directional sunlight, gentle breeze, and sparse drifting low-poly cumulus clouds.
      * **$25\text{--}60\%$ (Breezy / Overcast / Light Precip):** Thickening faceted cloud decks casting moving ground shadows, visible wind gusts, whitecap waves, dust swirls (in dry biomes), or light rain/snow flurries.
      * **$60\text{--}85\%$ (Stormy / Gale):** Moody storm-diffused lighting, heavy driving rain, bouncing icosahedral hail pellets, heavy blizzard snow accumulation, steep Gerstner water waves, and lightning flashes with distance-delayed thunder.
      * **$85\text{--}100\%$ (Severe / Tornado Vortex):** Spawns a stylized `beautiful-low-res` **faceted tornado funnel** (stacked counter-rotating polygonal rings with orbiting debris facets and spiraling windstreams) that tracks across the valley floor.
* **How Environment Physics Work in `beautiful-low-res` (*Walkabout*-Style Windstreams & GPU Vertex Physics):**
  To make the world feel physically alive at 90–120 Hz on Quest 3 without heavy CPU rigid-body physics, everything responds to a **Unified Analytical Wind & Weather Vector Field** $\mathbf{W}(\mathbf{p}, t)$:
  1. ***Walkabout*-Style Ribbon Windstreams:**
     * Curving, semi-translucent geometric ribbon trails (extruded low-poly spline strips with animated UV dash scrolling) snake visibly through the air, cresting over ridges, whistling through mountain passes, and spiraling upward around tornadoes so you can *see* the air currents moving across the world.
  2. **Zero-CPU Vertex-Shader Foliage Sway & Gerstner Water Waves:**
     * Every instanced tree trunk, branch cluster, and grass tuft bends smoothly in the vertex shader proportional to $\mathbf{W}(\mathbf{p}, t) \cdot h^2$ (with per-tree phase offset from $H(x, z)$ so trees sway organically out of sync rather than robotically).
     * Lakes, streams, and coastlines displace their facet vertices via analytical **Gerstner waves** whose wave height $A_w$, wavelength, and faceted shoreline foam scale directly with wind speed $\|\mathbf{W}\|$.
  3. **Low-Poly Weather Particle & Player/Ball Coupling:**
     * Rain streaks, bouncing low-poly hail stones, tumbling snowflakes, swirling desert dust, and falling autumn leaves are rendered via a single GPU instanced buffer whose fall velocity tilts dynamically with the local wind vector $\mathbf{W}(\mathbf{p}, t)$.
     * Mini-golf balls and airborne players flying through strong windstream corridors or near a tornado vortex experience real aerodynamic drift and lift!

---

## 7. Conflict-Free Multi-Player Wristwatch Sync, Owner-Only Controls & Cross-Session Persistence

### A. Conflict-Free Shared Wristwatch Synchronization (`evaluate_wrist_sync_and_exaggeration`)
* **Shared Environmental Dials:** Every player's wristwatch displays the shared world settings (Saved Location selector, Time Offset $\Delta t \in [-12\text{h}, +12\text{h}]$, Season, Storm Probability $0\text{--}100\%$, and Palette).
* **Per-Control Soft-Lock Lease + Lamport Timestamps (Zero Conflicts):**
  * When any player touches or drags a shared wristwatch slider, their watch acquires an automatic $1.5\text{-second}$ renewable **Soft-Lock Lease** (`active_lock_holder = peer_id`) and broadcasts updates stamped with a monotonic Lamport clock $(L_t, \text{peerId})$.
  * While Player A is actively sliding a dial, all other players see the dial move live on their own wristwatches with a subtle indicator (`"Adjusted by Player A"`) and their local input on that specific dial is temporarily locked so two players can never send conflicting values simultaneously.

### B. Owner-Exclusive ("Architect / Host") Wristwatch Controls
* Your wristwatch includes a private **Owner Deck** (unlocked via your local cryptographic Owner Token) that only appears on your watch (`owner_only_control: true`).
* **Owner Control #1 — Topographic Steepness / Exaggeration Slider ($E_{\text{topo}} \in [1.0\times, 2.0\times]$):**
  * Scales all terrain elevations and slopes smoothly between $1.0\times$ (true real-world elevation) and $2.0\times$ (twice as steep/extreme) relative to the origin base elevation $y_0$:
    $$y'(x, z) = y_0 + E_{\text{topo}} \cdot \big(y_{\text{DEM}}(x, z) - y_0\big), \quad E_{\text{topo}} \in [1.0, 2.0]$$
  * Synchronizes live across all connected peers so everyone's ground clamp, hiking trails, trees, and megafauna stay locked to the exaggerated terrain surface.

### C. Automatic Cross-Session Persistence & Saved Locations Library
* Every wristwatch setting (both shared environmental dials, your **Saved Locations Library** of $(\phi_0, \lambda_0)$ bookmarks, and your owner-only controls such as $E_{\text{topo}}$) is automatically saved to browser `localStorage` (`walkabout_studio_watch_state_v1`) and exportable into `scene_blueprint.json`, restoring your exact configuration and saved locations across sessions.

---

## 8. Prehistoric Megaflora, Megafauna Encounters (Riding & Startle-Watchers) & Species Catalog

### A. Encounter Choreography & Multi-Player Joint Consensus (`evaluate_megafauna_encounter` & `evaluate_camera_and_multiplayer_spawn`)
1. **Non-Predator Megafauna (Scenic Discovery + Mountable Riding):**
   * **Scenic Reveal Placement (Never Startling):** Non-predators spawn strictly at scenic reveal anchors inside the hikers' forward field of view ($\hat{\mathbf{f}}_{\text{head}} \cdot \hat{\mathbf{d}} > 0.30$): (a) grazing in sun-lit **clearings**, (b) coming gradually into view as you **crest a hill or ridge**, or (c) calmly **crossing the hiking trail** ahead of you.
   * **Mountable Riding (`shoulder_height_m >= 1.8m`):** Pointing at the back of any large non-predator lets you teleport/mount onto its back (multiple hikers can even ride together on giant mounts like *Palaeoloxodon* or *Paraceratherium*).
2. **Predator Megafauna (Multi-Player Look-Away Startle Spawn + Guaranteed Joint Occlusion Vanish):**
   * **Shared Multi-Player Consensus (Up to 4 Players):** All hikers at the same location see the **exact same animals at the exact same coordinates**:
     * **Joint Look-Away Spawn:** A predator can spawn at a vantage point $\mathbf{x}_{\text{pred}}$ **if and only if NONE of the co-located players are looking toward it** ($\max_{i} (\hat{\mathbf{f}}_{\text{head}, i} \cdot \hat{\mathbf{d}}_i) < -0.15$) and **ALL** co-located players are at least $45\text{ m}$ away ($\min_{i} d_i \ge 45\text{ m}$).
     * **Joint Retreat & Standoff:** If **ANY** player approaches within $55\text{ m}$, the predator breaks its stare and retreats behind the nearest ridge crest, boulder outcrop, or giant tree trunk, enforcing $d_i \ge 35\text{ m}$ from every hiker.
     * **Joint Occluded Despawn:** The predator despawns **strictly when $100\%$ occluded from EVERY co-located player's line of sight simultaneously** ($\forall i,\, \text{is\_occluded}_i = \text{True}$), guaranteeing that no hiker ever sees a predator pop out of existence.

### B. Researched Prehistoric Megaflora Catalog (All Geological Eras)
Matched deterministically to continent, soil wetness ($\text{TWI}$), elevation, and climate:
* **Wetlands, Riparians & Lake Margins (Carboniferous–Permian Giants):**
  * ***Lepidodendron* (Giant Scale Tree):** $40\text{--}50\text{ m}$ tall, $2\text{ m}$ trunk diameter with geometric diamond-patterned green/teal photosynthetic bark cushions and a dichotomous canopy crown.
  * ***Sigillaria* (Seal-Bark Lycopsid):** $30\text{ m}$ tall columnar trunks with vertical fluted ribs and whorls of cone strobili.
  * ***Calamites* (Colossal Horsetail):** $20\text{--}30\text{ m}$ tall bamboo-like jointed hollow stems with radial whorls of needle foliage along riverbanks.
  * ***Psaronius* & *Dicksonia* (Giant Tree Ferns):** $10\text{--}15\text{ m}$ tall flared fibrous root-mantle trunks crowned by $4\text{ m}$ arching *Pecopteris* fronds.
  * ***Prototaxites* (Devonian Enigmatic Giant Spire):** $8.8\text{ m}$ tall, $1\text{ m}$ wide smooth spire-like terrestrial columns rising over mossy rocky flats.
* **Highlands, Ridges & Polar/Temperate Valleys (Mesozoic–Cenozoic Giants):**
  * ***Araucaria mirabilis*, *Agathis* & *Sequoiadendron* (Colossal Conifers):** $60\text{--}100\text{ m}$ tall cathedral-scale trunks ($3\text{--}6\text{ m}$ wide) with tiered umbrella canopies.
  * ***Glossopteris*, *Nothofagus* & *Medullosa* (Southern Gondwanan & Seed Ferns):** $10\text{--}35\text{ m}$ deciduous broad-tongue-leaved trees and ancient southern beeches (spanning South America, Africa, Australia, and prehistoric Antarctica).
  * ***Williamsonia*, *Encephalartos* & Giant Cycads / Bennettitales:** Armored barrel trunks with crowns of stiff palm-like fronds and star-shaped reproductive cones.

### C. Unified Prehistoric Non-Dinosaur Megafauna Catalog (All Eras: Mammals, Birds, Reptiles, Insects/Arthropods, Synapsids & Amphibians)
All non-dinosaur megafauna across Earth's geological eras are included and matched deterministically to your location's continent, climate, elevation, and waterways:

1. **Colossal Prehistoric Mammals:**
   * **Rideable Non-Predators (Clearings, Hill Crests & Trail Crossings):**
     * ***Palaeoloxodon namadicus* & *P. antiquus* (Giant Straight-Tusked Elephants — Asia & Europe):** $4.5\text{--}5.0\text{ m}$ ($16.5\text{ ft}$) shoulder height, **$15\text{--}22\text{ metric tons}$**—largest land mammal in Earth's history.
     * ***Paraceratherium transouralicum* (Indricothere Giant Hornless Rhino — Asia & Eastern Europe):** $4.8\text{ m}$ shoulder height ($7.0\text{ m+}$ head height), $7.4\text{ m}$ long, **$15\text{--}20\text{ metric tons}$**.
     * ***Mammuthus columbi*, *M. primigenius* & *M. trogontherii* (Columbian, Woolly & Steppe Mammoths — North America, Europe & Asia):** $4.0\text{--}4.5\text{ m}$ tall, **$10\text{--}14\text{ metric tons}$**.
     * ***Deinotherium giganteum* & *D. bozasi* ("Hoe-Tusked" Proboscideans — Africa, Europe & Asia):** $4.0\text{--}4.3\text{ m}$ shoulder height, **$10\text{--}14\text{ metric tons}$**.
     * ***Arsinoitherium zitteli* / *A. giganteum* (Twin-Horned Embrithopod — Africa):** $3.0\text{--}3.4\text{ m}$ long, $1.8\text{--}2.1\text{ m}$ shoulder height, **$1.5\text{--}2.0\text{ metric tons}$**—massive rhino-like African browser with twin side-by-side nasal horns.
     * ***Sivatherium giganteum* (Colossal Four-Horned Giraffid — Africa & South Asia):** $2.2\text{ m}$ shoulder height ($3.0\text{ m}$ total height), **$1.2\text{ metric tons}$**—moose-antlered giant giraffid.
     * ***Megatherium americanum* & *Eremotherium* (Giant Ground Sloths — South & North America):** $6.0\text{ m}$ ($20\text{ ft}$) long, **$4\text{ metric tons}$**, rearing up $4.0\text{ m}$ tall on hind legs.
     * ***Elasmotherium sibiricum* ("Giant Siberian Unicorn" — Europe & Asia):** $4.5\text{ m}$ long, $2.2\text{ m}$ shoulder height, **$4\text{--}5\text{ metric tons}$**.
     * ***Megaloceros giganteus* (Giant Irish Elk — Europe & Asia):** $2.1\text{ m}$ shoulder height with a **$3.65\text{ m}$ ($12\text{ ft}$) antler span**.
     * ***Doedicurus clavicaudatus* & *Glyptodon* (South & North America):** $3.6\text{--}4.0\text{ m}$ long, **$1.5\text{--}2.3\text{ metric tons}$**.
     * ***Chalicotherium*, *Moropus* & *Gigantopithecus blacki* ($3.0\text{ m}$ tall giant Asian ape):** $2.0\text{--}3.0\text{ m}$ tall forest browsers.
     * ***Diprotodon optatum*, *Zygomaturus* & *Palorchestes* (Giant Marsupials — Australia):** $3.0\text{--}3.8\text{ m}$ long, $1.8\text{--}2.0\text{ m}$ tall, **$2.5\text{--}2.8\text{ metric tons}$**.
   * **Distant Startle-Watching Predators (Look-Away Spawn + Occluded Vanish):**
     * ***Arctodus simus* & *Arctotherium angustidens* (Giant Short-Faced Bears — North & South America):** $1.6\text{ m}$ at the shoulder on all fours, standing **$3.4\text{--}4.0\text{ m}$ ($11\text{--}13\text{ ft}$) tall** upright, $800\text{--}1,200\text{ kg}$.
     * ***Panthera spelaea* & *Panthera atrox* (Eurasian Cave Lion & Giant American Lion — Europe, Asia & North America):** $2.5\text{--}3.5\text{ m}$ ($8\text{--}11.5\text{ ft}$) total length, $1.2\text{--}1.3\text{ m}$ ($4\text{ ft}$) shoulder height, **$230\text{--}380\text{ kg}$ ($500\text{--}800+\text{ lbs}$)**.
     * ***Miracinonyx trumani* (American Cheetah — North America):** $2.4\text{ m}$ ($8\text{ ft}$) total length, $0.9\text{ m}$ ($3\text{ ft}$) shoulder height, **$50\text{--}90\text{ kg}$**—perched on canyon ledges and crags.
     * ***Aenocyon dirus* (Dire Wolf Packs — North & South America):** $1.5\text{--}1.8\text{ m}$ long, **$60\text{--}70+\text{ kg}$** bone-crushing canids spawning in **coordinated packs of $4\text{--}8$ wolves** along ridge crests.
     * ***Smilodon populator*, *S. fatalis*, *Homotherium* & *Dinofelis* (Saber-Toothed & False Saber-Toothed Cats — Americas, Europe, Asia & Africa):** $1.0\text{--}1.2\text{ m}$ shoulder height, $120\text{--}400\text{ kg}$.
     * ***Andrewsarchus*, *Daeodon*, *Megistotherium* (Giant African/Eurasian Hyaenodont), *Simbakubwa* ("Great Lion of Africa", $1,300\text{ kg}$) & *Thylacoleo carnifex* (Australian Marsupial Lion).**

2. **Colossal Prehistoric Birds (Ground Giants & Sky Soarers):**
   * **Rideable Non-Predators:** ***Dromornis stirtoni* & *Genyornis*** ($3.0\text{ m}$, $500\text{ kg}$ — Australia), ***Aepyornis maximus* / *Vorombe titan*** ($3.0\text{ m}$, $730\text{ kg}$ — Africa/Madagascar), ***Dinornis robustus* (Giant Moa — Oceania)**, ***Gastornis* (*Diatryma* — Europe & North America)**, and ***Palaeeudyptes klekowskii* ("Colossus Penguin" — $2.0\text{ m}$ tall, $150\text{ kg}$ waddling along Antarctic shorelines)**.
   * **Distant Startle-Watching Predators & Sky Soarers:** ***Kelenken guillermoi*, *Phorusrhacos* & *Titanis walleri* (Giant Terror Birds — South & North America)**, ***Argentavis magnificens*** ($7.0\text{ m}$ wingspan — Americas), ***Pelagornis sandersi* & *Pelagornis* spp.** ($7.4\text{ m}$ wingspan — all ocean/Antarctic/continental coasts), and ***Haast's Eagle*** ($3.0\text{ m}$ wingspan — Oceania).

3. **Colossal Prehistoric Reptiles (Snakes, Crocodyliforms, Monitor Lizards & Giant Turtles):**
   * **Rideable Non-Predators:** ***Stupendemys geographicus*** ($3.3\text{ m}$ shell floating river/lake ferry — South America) and ***Megalochelys atlas*** ($2.7\text{ m}$, $2\text{ ton}$ giant land tortoise — Asia & Europe).
   * **Distant Startle-Watching Predators:** ***Titanoboa cerrejonensis* (South America)**, ***Vasuki indicus* (Asia — $15\text{ m}$)**, & ***Gigantophis garstini* (Africa — $10\text{ m}$)**; ***Wonambi naracoortensis* (Australian $6\text{ m}$ Madtsoiid Snake)**; ***Purussaurus* (South America)**, ***Deinosuchus* (North America)**, ***Sarcosuchus* & *Crocodylus thorbjarnarsoni* (Africa — $8\text{--}11\text{ m}$)**, ***Rhamphosuchus* (Asia — $10\text{ m}$)**; ***Barinasuchus* (South America)**, ***Quinkana* (Australia)**, & ***Boverisuchus* (Hoofed Land Croc — Europe & North America)**; and ***Megalania* (*Varanus priscus* — Australia)**.

4. **Colossal Prehistoric Insects & Arthropods (Myriapods, Griffinflies & Eurypterids):**
   * **Rideable / Trail-Crossing Non-Predators:** ***Arthropleura*** ($2.6\text{ m}$ — Europe & North America), ***Hibbertopterus*** ($2.3\text{ m}$ — Europe, Africa & Gondwana), and ***Mazothairos***.
   * **Distant Startle-Watching Predators:** ***Meganeuropsis permiana* & *Meganeura monyi*** ($75\text{ cm}$ wingspan — North America & Europe), ***Jaekelopterus rhenaniae*** ($2.6\text{ m}$ — Europe), and ***Pulmonoscorpius* / *Brontoscorpio*** ($70\text{--}90\text{ cm}$ — Europe & Gondwana).

5. **Pre-Mammalian Synapsids & Giant Temnospondyl Amphibians (Global Pangaean/Gondwanan Roster):**
   * **Rideable Non-Predators:** ***Lisowicia bojani*** ($4.5\text{ m}$, $9\text{ ton}$ dicynodont — Europe), ***Cotylorhynchus*** ($6.0\text{ m}$ — North America), ***Estemmenosuchus*** ($4.5\text{ m}$ — Eurasia), ***Moschops* & *Tapinocephalus*** ($3.5\text{--}4.5\text{ m}$ — Africa), ***Edaphosaurus*** (North America & Europe), and ***Kannemeyeria* / *Lystrosaurus*** (Antarctica, Africa, Asia & South America).
   * **Distant Startle-Watching Predators:** ***Anteosaurus magnificus* & *Rubidgea*** (Africa), ***Inostrancevia*** (Eurasia & Africa), ***Dimetrodon*** (North America & Europe), ***Prionosuchus*** (South America), ***Mastodonsaurus*** (Europe), ***Koolasuchus* & *Paracyclotosaurus*** (Australia), and ***Kryostega collinsoni* ($4.6\text{ m}$) & *Antarctosuchus polyodon* ($2.5\text{ m}$)** (Antarctica).

6. **Colossal Prehistoric Sharks, Armored Placoderms, Giant Fish & Marine Megafauna (Rivers, Lakes, Estuaries & Coastlines):**
   * **Rideable Non-Predators (Gentle Filter-Feeders & River Giants):**
     * ***Leedsichthys problematicus* (Colossal Pachycormiform Bony Fish — Europe & South America Coastlines):** **$12.5\text{--}16.5\text{ m}$ ($41\text{--}54\text{ ft}$) long**, **$20\text{--}40+\text{ metric tons}$**—the largest ray-finned bony fish in Earth's history; cruises calmly near the water surface as a living aquatic ferry that hikers can teleport onto and ride across bays and coastal channels!
     * ***Mawsonia gigas* / *M. lavocati* (Giant Prehistoric Coelacanth — South America & Africa Rivers/Estuaries):** **$3.5\text{--}6.0\text{ m}$ ($11.5\text{--}20\text{ ft}$) long** lobe-finned fish gliding peacefully through deep prehistoric river pools and lakes.
     * ***Onchopristis numidus* (Giant Freshwater Sawskate — Africa & North America):** **$4.0\text{ m}$ ($13\text{ ft}$) long** benthic river ray with a $1.5\text{ m}$ barbed rostrum cruising sandy riverbeds.
   * **Distant Startle-Watching Aquatic Predators (Dorsal-Fin & Shadow Stalkers in Lakes, Rivers & Coasts):**
     * ***Otodus megalodon* (Giant Megatoothed Shark — All Continental Coastlines):** **$15.0\text{--}20.0\text{ m}$ ($50\text{--}65\text{ ft}$) long**, **$50\text{--}70+\text{ metric tons}$**, cruising at $5\text{--}11\text{ m/s}$ with a $2.0\text{ m}$ ($6.5\text{ ft}$) dorsal fin slicing the offshore swells when hikers look away, before diving beneath a deep reef trench.
     * ***Rhizodus hibberti* (Colossal Carboniferous Freshwater Lobe-Finned Predator — Europe & North America Rivers/Swamps):** **$6.0\text{--}7.0\text{ m}$ ($20\text{--}23\text{ ft}$) long**, $3.5\text{ metric tons}$—the largest freshwater fish ever known, armed with **$22\text{ cm}$ ($8.7\text{ in}$) fangs**, lurking in deep coal-swamp lagoons and river bends.
     * ***Dunkleosteus terrelli* (Armored Devonian Arthrodire Placoderm — North America, Europe & Africa):** **$3.4\text{--}4.1+\text{ m}$ ($11\text{--}13.5\text{ ft}$) long**, $1.0\text{--}1.5\text{ metric tons}$ stout bone-plated predator with self-sharpening gnathal jaw blades capable of a $5,300+\text{ N}$ bite.
     * ***Helicoprion bessonowi* ("Buzzsaw-Whorl" Shark-Like Holocephalid — North America, Eurasia & Australia):** **$4.0\text{--}8.0\text{ m}$ ($13\text{--}26\text{ ft}$) long** cartilaginous predator with a $50\text{--}60\text{ cm}$ spiral tooth-whorl lower jaw.
     * ***Xiphactinus audax* ("Bulldog Tarpon" — North America, Europe & Australia):** **$4.5\text{--}6.0\text{ m}$ ($15\text{--}20\text{ ft}$) long** high-speed ($14\text{ m/s}$) predatory bony fish with upturned fang-lined jaws.
     * ***Livyatan melvillei* & *Basilosaurus cetoides* (Colossal Raptorial Sperm Whale & Serpentine Archaeocete — All Coastlines):** **$15.0\text{--}18.0\text{ m}$ ($50\text{--}60\text{ ft}$) long** marine mammal apex predators with $36\text{ cm}$ ($14\text{ in}$) interlocking teeth breaching in the offshore distance.

### D. 7-Continent Biogeographic Mapping (`resolve_continent_for_lat_lon`)
Every $(\phi_0, \lambda_0)$ coordinate automatically resolves to its continent so only regionally authentic flora and megafauna appear:

| Continent | Representative Megaflora | Representative Rideable Non-Predators | Representative Startle-Watching Predators |
| :--- | :--- | :--- | :--- |
| **North America** | *Sequoiadendron*, *Lepidodendron*, *Calamites*, *Medullosa* | *Mammuthus columbi*, *Megatherium/Eremotherium*, *Cotylorhynchus*, *Edaphosaurus*, *Arthropleura* | *Arctodus simus*, *Panthera atrox*, *Miracinonyx* (American Cheetah), *Aenocyon dirus* (Dire Wolf Packs), *Smilodon*, *Deinosuchus*, *Dimetrodon*, *Meganeuropsis* |
| **South America** | *Araucaria mirabilis*, *Psaronius*, *Dicksonia*, *Glossopteris* | *Megatherium americanum*, *Doedicurus*, *Stupendemys* (River Ferry Turtle), *Macrauchenia* | *Smilodon populator*, *Arctotherium*, *Aenocyon dirus* Packs, *Kelenken* & *Phorusrhacos* (Terror Birds), *Argentavis*, *Titanoboa*, *Purussaurus*, *Barinasuchus*, *Prionosuchus* |
| **Europe** | *Lepidodendron*, *Sigillaria*, *Calamites*, *Araucaria* | *Palaeoloxodon antiquus*, *Megaloceros* (Irish Elk), *Elasmotherium*, *Lisowicia bojani*, *Arthropleura* | *Panthera spelaea* (Cave Lion), *Homotherium*, *Boverisuchus*, *Mastodonsaurus*, *Meganeura*, *Jaekelopterus*, *Pulmonoscorpius* |
| **Asia** | *Metasequoia*, *Calamites*, *Psaronius*, *Williamsonia* | *Palaeoloxodon namadicus*, *Paraceratherium*, *Elasmotherium*, *Deinotherium*, *Megalochelys*, *Estemmenosuchus* | *Panthera spelaea*, *Andrewsarchus*, *Sarkastodon*, *Vasuki indicus* ($15\text{ m}$ snake), *Rhamphosuchus*, *Inostrancevia* |
| **Africa & Madagascar** | *Encephalartos* (Giant Cycads), *Glossopteris*, *Podocarpus*, *Lepidodendron* | *Deinotherium bozasi*, *Arsinoitherium*, *Sivatherium*, *Aepyornis / Vorombe* (Elephant Bird), *Moschops*, *Tapinocephalus* | *Simbakubwa* ($1,300\text{ kg}$), *Megistotherium*, *Dinofelis*, *Sarcosuchus*, *Gigantophis* ($10\text{ m}$ snake), *Anteosaurus*, *Rubidgea* |
| **Australia & Oceania** | *Araucaria*, *Agathis* (Kauri), *Dicksonia*, *Glossopteris* | *Diprotodon optatum*, *Zygomaturus*, *Palorchestes*, *Dromornis stirtoni* (Thunder Bird), *Dinornis* (Giant Moa) | *Thylacoleo carnifex* (Marsupial Lion), *Megalania* ($7\text{ m}$ Ripper Lizard), *Quinkana* (Land Croc), *Wonambi* ($6\text{ m}$ Snake), *Haast's Eagle*, *Koolasuchus* |
| **Antarctica** | *Glossopteris*, *Araucaria*, *Nothofagus*, *Dicksonia* (in warm seasons) | *Palaeeudyptes klekowskii* ($2\text{ m}$ Colossus Penguin), *Kannemeyeria*, *Lystrosaurus*, *Notiolofos* | *Kryostega collinsoni* ($4.6\text{ m}$ Temnospondyl), *Antarctosuchus polyodon*, *Pelagornis* ($7\text{ m}$ wingspan coastal soarer), *Antarctic Phorusrhacid* |

---

## 9. Orbital Giant Globe Mode (`A` Button), 4-Player Independent Locations, Sky Giants & Wildlife Camera Codex

### A. Pressing `A` $\rightarrow$ Orbital Giant Globe Mode (`evaluate_giant_globe_and_sky_projection`)
* In *Walkabout Mini Golf*, pressing the **`A` button** (or `KeyG` on desktop) toggles Giant Mode. In our studio, pressing **`A`** lifts you into **Orbital Giant Globe Mode**:
  * You stand at giant scale around a **3D faceted `beautiful-low-res` Earth Globe** ($R_{\text{globe}} \approx 1.8\text{ m}$) that you can walk around in 360 degrees.
  * **Drop a Pin Anywhere to Teleport:** Point at any continent, mountain range, or coastline on the 3D globe and click to drop a destination pin and descend into that pristine prehistoric landscape.
  * **Click Saved Location Pins:** All of your **Saved Locations** appear as labeled pins on the globe for one-click travel.
  * **See & Join Other Players (Up to 4 Players):** Live beacons show where every connected player (up to **4 players maximum**) is currently hiking on Earth—clicking a friend's beacon teleports you directly to their side.

### B. Multi-Location Viability (4 Players Anywhere on Earth) & Seeing Giants in the Sky
* **100% Viable & Featherweight for 4 Players in Different Locations:**
  * Because terrain and biome generation is **client-side and deterministic from $(\phi_i, \lambda_i)$**, each player's headset only loads the $< 200\text{ KB}$ terrain mesh for their own current location while syncing lightweight $64\text{-byte}$ state packets over WebRTC across the 4-player room.
  * Whenever two or more players are at the same location, their avatars, voice chat, and shared animal encounters synchronize seamlessly.
* **Seeing Giant-Mode Players in the Sky from Earth's Surface:**
  * When a player is in **Orbital Giant Globe Mode** walking around the globe at sub-giant coordinate $(\phi_G, \lambda_G)$ and radial ratio $\rho_G = r_G / R_{\text{globe}} > 1$, surface hikers at $(\phi_S, \lambda_S)$ see that Giant player projected into their **real local sky dome** at exact spherical azimuth $\text{Az}_G$ and horizon elevation angle $\text{Alt}_G$:
    $$\tan(\text{Alt}_G) = \frac{\rho_G \cos\gamma - 1}{\rho_G \sin\gamma}$$
    where $\gamma$ is the great-circle central angle between $(\phi_S, \lambda_S)$ and $(\phi_G, \lambda_G)$.
  * Whenever $\text{Alt}_G > -5^\circ$ (the Giant player is walking on your side of the globe), you can look up from the hiking trail and see their colossal `beautiful-low-res` upper-body silhouette towering above the clouds in the exact direction and elevation corresponding to where they are standing around the globe!

### C. Side-Grip $\ge 5\text{s}$ Wildlife Camera, Actual Image Storage, Optical Autozoom & Giant-Globe Pins (`evaluate_camera_and_multiplayer_spawn` & `evaluate_autozoom_speed_cap_and_obstacle_slide`)
* **Dual-Duration Side-Grip Control:**
  * **Hold Side Button $< 5.0\text{ seconds}$:** Performs the friendly **Thumbs-Up** social gesture.
  * **Hold Side Button $\ge 5.0\text{ seconds}$:** Activates **Wildlife Camera Mode**, raising a holographic **Viewfinder Reticle** (`CAMERA_RETICLE`). Pulling the **index trigger** while aiming through the reticle snaps a photograph.
* **Optical Autozoom Framing & Actual Rendered Image Storage (`WebGLRenderTarget` $\rightarrow$ `WebP` in `IndexedDB`):**
  * **Automatic Animal Framing (`autozoom_fov_deg`):** When the reticle locks onto a creature of maximum body span $S_{\text{animal}} = \max(\text{height}, \text{length})$ at distance $d$, a secondary virtual `THREE.PerspectiveCamera` automatically centers on the animal's visual midpoint and computes the exact telephoto vertical Field of View to frame the creature with a clean $35\%$ scenic border:
    $$\text{FOV}_{\text{zoom}} = \text{clamp}\!\left(2 \arctan\!\left(\frac{1.35 \cdot S_{\text{animal}}}{2\,d}\right),\, 8^\circ,\, 60^\circ\right)$$
  * **Capturing & Storing the Real Image:** Pulling the trigger renders a crisp $512 \times 384$ frame from the autozoomed camera into an offscreen `THREE.WebGLRenderTarget`, encodes the actual image via `canvas.toDataURL('image/webp', 0.82)` (~$15\text{--}25\text{ KB}$ per photo), and stores the image persistently in browser **`IndexedDB`** (`walkabout_wildlife_photos_v1`).
* **Universal Photography: Wildlife Codex vs. Scenic Expedition Roll (`photo_log_type`):**
  * **First-Time Approved Animal (`FULL_ANIMAL_DOSSIER`):** When the reticle frames an approved prehistoric animal for the first time, it autozooms to frame the creature, saves the `WebP` photograph to your **Wildlife Codex**, logs the **exact $(\phi, \lambda)$ location and real calendar date/time**, and attaches its **Standardized Paleontological Dossier** (`Height`, `Length`, `Weight`, `Diet`, `Continental Range`, and `Geological Era`) plus Giant-Globe discovery pins.
  * **Photographing Anything Else (`LOCATION_AND_DATE_ONLY`):** You can take a photo of **anything**—friends, sunrises, volcanoes, eclipses, waterfalls, your custom house, or an already-cataloged animal! If the subject is not a newly discovered approved animal, the camera still captures and stores the actual `WebP` image in your wristwatch gallery, logging **only the $(\phi, \lambda)$ location and the real calendar date/timestamp**.
* **Giant-Globe Wildlife Pin Projection:**
  * When you are in **Giant Globe Mode (`A` button)** and open an animal's photo card on your wristwatch, the 3D Earth Globe automatically lights up with **pins showing where that animal was photographed and spotted** across the world!

### D. Accurate Animal Sizes & Speeds, $10\text{ m/s}$ Human Speed Cap & $\mathcal{O}(1)$ Obstacle Sliding Collision
* **Hard Human Speed Cap ($v_{\text{human, max}} = 10.0\text{ m/s}$):**
  * All player locomotion (smooth walking at $1.4\text{ m/s}$ and all flight modes) is strictly capped at **$\|\mathbf{v}_{\text{player}}\| \le 10.0\text{ m/s}$ ($36\text{ km/h} \approx 22.4\text{ mph}$)**.
* **True $1:1$ Paleontological Animal Sizes & Biomechanical Speeds:**
  * Every creature spawns at its exact $1:1$ metric height and length and moves at its biomechanically accurate gait and sprint speed (e.g., *Miracinonyx* at $28\text{ m/s}$, *Panthera atrox* at $17\text{ m/s}$, *Aenocyon dirus* packs at $15\text{ m/s}$, *Kelenken* at $17\text{ m/s}$, *Arctodus* at $14\text{ m/s}$). Combined with the $10.0\text{ m/s}$ human speed cap and $\ge 45\text{ m}$ standoff distance, predators can always slip behind nearby cover ($< 1\text{ s}$ to occlusion) long before a human could ever close the gap.
* **Featherweight $\mathcal{O}(1)$ Spatial-Hashed Obstacle Collision ("Go Around, Never Through"):**
  * Instead of expensive per-triangle mesh physics, every obstacle is represented as a fast analytical primitive indexed inside the **same deterministic spatial grid cell $(i_x, i_z)$** that generated it:
    1. **Megaflora Trunks, Boulders & Megafauna $\rightarrow$ 2.5D Vertical Cylinders $(x_k, z_k, r_k, y_{\min, k}, y_{\max, k})$:** Every frame checks only the $3 \times 3 = 9$ local grid cells around the player ($< 0.05\text{ ms}$ CPU). If the player's horizontal distance $d_\perp < r_k + R_{\text{player}}$ ($R_{\text{player}} = 0.35\text{ m}$) within the cylinder's height range, the player is pushed radially out to the boundary (`resolved_pos_xz`) and their velocity is projected onto the tangent plane ($\mathbf{v}_{\text{slide}} = \mathbf{v} - (\mathbf{v} \cdot \hat{\mathbf{n}})\,\hat{\mathbf{n}}$), making you **slide smoothly around** trunks, rocks, and animals.
    2. **User-Built Walls & Structures $\rightarrow$ 2.5D Oriented Wall Segments:** Circle-vs-segment tangent projection prevents walking or flying through walls or roofs (except through open doorways).
    3. **Teleport Arc Interception:** Parabolic teleport rays are tested against cylinders and wall segments along the arc; if an obstacle blocks the ray, the teleport ring stops in front of the obstacle face so you cannot teleport through solid objects.

---

## 10. Shared Natural Wonders, `B`-Button Secret IR Headlamp, Upright Climbing & Head-Collision Passthrough (`evaluate_photo_b_button_climb_and_passthrough`)

### A. Shared Natural Wonders (100% Synchronized Across All Participants)
All atmospheric, geological, hydrological, and astronomical wonders are driven by the shared session seed and synchronized clock $(t_0 + \Delta t, \phi_0, \lambda_0)$ so every participant experiences and photographs them together in real time:
1. **Sunrises & Sunsets:** Vivid Rayleigh-Mie twilight sky gradients, long golden-hour facet shadows, and warm horizon glow when $\text{Alt}_\odot \in [-6^\circ, +8^\circ]$.
2. **Mammatus Clouds:** Cellular, pouch-like `beautiful-low-res` faceted cloud lobes hanging beneath storm anvils, dramatically lit from below at sunrise/sunset.
3. **Volcanoes:** Active faceted volcanic cones at volcanic coordinates (or triggered via Owner Wristwatch) with glowing magma calderas, rising low-poly ash plumes, lightning-laced eruption columns, and incandescent night lava flows.
4. **Waterfalls:** Cascading faceted water sheets where rivers/streams drop over steep DEM cliffs ($\Delta y > 4\text{ m}$), complete with rising mist particles, spatial roar audio, and sunlit rainbow arcs.
5. **Comets:** A twin-tailed astronomical comet (bright coma, curving white dust tail, and straight blue ion tail pointing anti-sunward) arching across the night/twilight sky dome.
6. **Solar & Lunar Eclipses:** Total Solar Eclipses (diamond-ring flash, pearly solar corona, $360^\circ$ sunset horizon, and daytime stars/comets) and Blood-Moon Lunar Eclipses synchronized for all hikers.
7. **Tornadoes:** Shared vortex funnel trajectories, swirling debris facets, and spiraling *Walkabout*-style ribbon windstreams.
8. **Meteor Showers:** Under dark night skies ($\text{Alt}_\odot < -12^\circ$), synchronized meteor streaks and occasional bright green/amber bolide fireballs radiate from astronomically accurate constellation radiants (Perseids, Geminids, Quadrantids) with persistent ionized trails.
9. **Northern & Southern Lights (Aurora Borealis & Aurora Australis at High Latitudes):** At high-latitude coordinates ($|\phi_0| \ge 52^\circ$) when $\text{Alt}_\odot < -12^\circ$, undulating vertical ribbon curtains of emerald green ($557.7\text{ nm}$ atomic oxygen emission) and upper-altitude crimson/violet ($630.0\text{ nm}$ / $\text{N}_2^+$) ripple across the polar sky dome— automatically labeled `AURORA_BOREALIS` in the Northern Hemisphere ($\phi_0 \ge 52^\circ$) and `AURORA_AUSTRALIS` in the Southern Hemisphere ($\phi_0 \le -52^\circ$).
10. **Post-Storm Primary & Double Rainbows:** At the tail end of any rainstorm (`is_storm_ending == True`) when the sun breaks through at $\text{Alt}_\odot \in (0^\circ, 42^\circ)$, a vivid primary rainbow arc at $42^\circ$ around the antisolar point (and a fainter reversed secondary bow at $51^\circ$) appears across the clearing mist for all players.

### B. `B` Button Headlamp & Owner-Secret IR / Thermal Vision (`headlamp_mode`)
* **Standard Guests (`is_owner == False` — 2-State Cycle on `B` Button):**
  * Pressing **`B`** toggles `OFF` $\leftrightarrow$ `STANDARD_HEADLAMP` (a warm-white directional headlamp beam attached to their head gaze, visible to all players at dusk, night, or inside caves).
* **Owner-Secret 3-State Cycle (`is_owner == True` on `B` Button):**
  * Pressing **`B`** on your controller cycles through **3 modes**:
    1. `OFF` $\rightarrow$
    2. `STANDARD_HEADLAMP` (visible to others) $\rightarrow$
    3. `SECRET_IR_THERMAL` (**Completely invisible to other players**—`ir_visible_to_others: false` so to guests your headlamp appears `OFF`!).
  * **What `SECRET_IR_THERMAL` Shows You:** Renders your view in a crisp night-vision thermal palette where **all humans (other players) and all prehistoric animals (including distant startle-watching predators!) glow brightly**, remaining visible **even through partial environmental occlusion** (bushes, tree trunks, mist, and thin rock ridges via an attenuated depth-peel shader $\alpha_{\text{IR}} = \exp(-\mu \cdot d_{\text{occluder}})$).

### C. Upright Climbing by Teleporting onto Steep Slopes, Cliffs & Giant Trees (`is_climbing_cling`)
* Unlike *Walkabout Mini Golf* (which rejects steep surfaces), aiming your parabolic teleport arc onto **steep cliff faces** ($\beta > 45^\circ$, $n_y < \cos 45^\circ$), **boulders**, or the **trunks and branches of giant prehistoric megaflora** (*Lepidodendron*, *Araucaria*, *Sequoiadendron*) activates **Upright Climbing Mode**:
  * You teleport onto the side of the cliff or tree while remaining **100% upright** ($\mathbf{u}_{\text{up}} = (0, 1, 0)$, preventing horizon-tilt motion sickness), positioned at a comfortable climbing stand-off distance $d_{\text{cling}} = 0.75\text{ m}$ ($\approx 2.5\text{ ft}$) out from the surface along its horizontal normal:
    $$\mathbf{p}_{\text{climb}} = \mathbf{p}_{\text{hit}} + d_{\text{cling}} \cdot \text{normalize}\!\big((n_x,\, 0,\, n_z)\big)$$
  * Gravity holds you anchored in place (`is_climbing_cling: true`) so you can hop from hold to hold up sheer canyon walls or climb $50\text{ m}$ up into the crown of a giant scale tree!

### D. Physical Head-Inside-Object Handling via Quest 3 Passthrough (`show_passthrough`)
* While joystick/flight movement slides smoothly around obstacles, in room-scale VR a player can physically lean or step their real head into a virtual wall, boulder, or tree trunk.
* Forcibly pushing the VR camera backward when your physical head moves forward causes vestibular discomfort; instead, we measure the HMD's penetration depth $\delta_{\text{head}}$ into any solid object:
  * As your head crosses within $12\text{ cm}$ of a solid surface ($\delta_{\text{head}} > 0$), the view smoothly cross-fades (`passthrough_alpha` $= \text{clamp}(\delta_{\text{head}} / 0.12,\, 0,\, 1)$) into **Quest 3 Real-World Passthrough** (with a subtle glowing boundary wireframe showing the virtual surface), while keeping your virtual body anchor outside the obstacle so you cannot walk through walls! Stepping your head back out smoothly restores $100\%$ of the prehistoric world.

### E. Picking Up, Throwing, Catching & Water-Skipping Rocks and Pinecones, Local Geology Rock Coloring & Bounded Teleport Arc Shaping (`evaluate_throwables_geology_arc_and_sky_phenomena`)
* **Joystick Pull-Back Pickup, Throwing & Multiplayer Catching (`is_picked_up`):**
  * Pointing your controller ray at any nearby **rock, river skipping stone, or giant prehistoric *Araucaria* / *Sequoiadendron* pinecone** within $3.5\text{ m}$ highlights it with a subtle facet rim; **pulling back on the joystick** (`stick_y < -0.55`) magnetically snaps the object into your hand (`is_picked_up: true`).
  * Swinging your arm and releasing the joystick (or flicking forward) launches the rock or pinecone along a deterministic ballistic trajectory synchronized across all 4 players via a compact `[item_id, t_launch, p_0, v_0, omega_0]` packet—allowing another player to **catch it in mid-air** by pointing and pulling back on their joystick as it approaches!
* **Skipping Stones Across Lakes, Rivers & Coastlines (`skip_bounces`):**
  * When a thrown rock strikes a water surface at a **shallow grazing entry angle** ($\theta_{\text{entry}} \le 22^\circ$) with horizontal speed $v_{\text{horiz}} \ge 3.5\text{ m/s}$, hydrodynamic lift rebounds the stone across the water surface (`did_skip_water: true`) for up to **8 consecutive skips**:
    $$N_{\text{skips}} = \min\!\left(8,\; \left\lfloor \frac{v_{\text{horiz}}}{1.85} \cdot \left(1 - \frac{\theta_{\text{entry}}}{26^\circ}\right) \right\rfloor\right)$$
    spawning expanding `beautiful-low-res` concentric ripple rings and spatial water-plip audio at every bounce!
* **Coloring Rocks Based on Local Real-World Geology (`rock_color_hex`):**
  * Using the keyless **Macrostrat Geologic Map API** (`https://macrostrat.org/api/v2/geologic_units/map?lat=...&lng=...`) alongside ISRIC SoilGrids at $(\phi_0, \lambda_0)$, all rocks, cliff faces, and skipping stones automatically adopt the authentic `beautiful-low-res` PixPal color palette of the local bedrock lithology:
    * **Basalt / Volcanic (`volcanic`):** Charcoal-obsidian `#2b2d42`
    * **Navajo / Red Sandstone (`sandstone`):** Warm terracotta-ochre `#e07a5f`
    * **Karst Limestone / Dolomite (`limestone`):** Pale chalk-ivory `#e5e5e5`
    * **Crystalline Granite / Gneiss (`granite`):** Speckled quartz-silver `#adb5bd`
    * **Metamorphic Slate / Schist (`slate`):** Deep blue-green `#52796f`
* **Intuitive, Fun, Bounded Parabolic Teleport Arc (`clamped_teleport_dist_m <= 12.0 m`):**
  * To make the teleport arc feel crisp, predictable, and never excessive (even when aiming downhill off a high mountain ridge), we launch the ray at a **comfort-tuned virtual launch speed $v_0 = 9.8\text{ m/s}$** with **elevated virtual arc gravity $g_{\text{arc}} = 12.5\text{ m/s}^2$** (which prevents flat, infinite laser trajectories), pitch-damped upward aiming, and a **smooth horizontal range envelope of $D_{\max} = 12.0\text{ m}$ ($\approx 39\text{ ft}$)**:
    $$d_{\text{clamped}} = \min(d_{\text{raw}},\, 12.0\text{ m})$$
    Inside $12.0\text{ m}$, the arc renders as a bright cyan/emerald ribbon with a pulsing ground ring; attempting to aim past $12.0\text{ m}$ smoothly curves the arc downward to the $12.0\text{ m}$ boundary ring so teleport hops remain natural and grounded.

---

## 11. Weather Fog, Camera Selfies, Predator Linger Window, Procedural Soundscape, Owner Secret `A`-Hold (Gemini AI Ultra / Dictation), Encounter Frequency Engine & Multiplayer Photo Hide-and-Seek (`evaluate_fog_selfie_linger_and_secret_a_hold` & `evaluate_encounter_frequency_and_photo_hide_and_seek`)

### A. Weather Fog, Camera Selfie Flip (`A` While Holding Side-Grip), Predator Observation Linger & Soothing Soundscape
* **Dynamic Weather Fog (`fog_active`, `fog_density`, `fog_visibility_m`):**
  * Added **Fog** as a first-class weather condition (alongside cloud cover, rain, snow, dust, and storms) controlled on the synchronized wristwatch (`fog_level` $\in [0.0, 1.0]$):
    $$\rho_{\text{fog}} = 0.045 \cdot \text{clamp}(\text{fog\_level},\, 0,\, 1), \quad d_{\text{vis}} \approx \frac{3.0}{\max(\rho_{\text{fog}},\, 0.0006)}$$
  * Supports valley radiation mist (pooling in low DEM elevations at dawn), coastal advection fog, and mountain cloud-deck fog. Moreover, your secret Owner `B`-button `SECRET_IR_THERMAL` headlamp cuts right through dense fog to reveal glowing wildlife and friends!
* **Camera Reticle Selfie Mode (`A` Button While Holding Side-Grip $\ge 5.0\text{ s}$):**
  * When you are holding the **side grip button** ($\ge 5.0\text{ s}$) so the **Camera Reticle is up**, pressing **`A`** overrides Giant Globe Mode and **flips the camera reticle $180^\circ$ around toward you (`is_selfie_mode: true`)** at a virtual selfie-stick/tripod distance of $1.8\text{ m}$!
  * The reticle displays a live mirrored viewfinder so you and your friends can pose together in front of waterfalls, mammoths, or volcanoes and pull the trigger to capture group selfies.
* **Generous Predator Linger / Observation Window (`OBSERVING_WAIT`):**
  * As long as no player encroaches closer than the **$35.0\text{ m}$ respectful standoff distance**, startle-spawned predators remain in a calm **`OBSERVING_WAIT`** state for **$45\text{--}60\text{ seconds}$**—perching on a rocky crag, pacing slowly along a ridge, or watching the group from a riverbank.
  * This guarantees that attentive hikers who stop moving toward the predator have plenty of time to admire its $1:1$ scale, point it out to friends, hold the side-grip for $5\text{ s}$, let optical autozoom frame the shot, and photograph it before it slips behind cover (`RETREATING_TO_COVER`).
* **Soothing Proximity / Circumstantial Procedural WebAudio Soundscape + Shared Wristwatch Soundtrack:**
  * **Zero-Download 3D Spatialized Nature Synthesis (`AudioContext` + HRTF `PannerNode`):**
    * **Water & Streams (`water_stream`):** Bandpass-filtered pink/brown noise coupled to local river DEM slope and proximity ($1/d^2$ rolloff) with resonant droplet bursts.
    * **Ocean & Lake Waves (`waves`):** Slow $0.15\text{ Hz}$ LFO-modulated surf wash along shorelines.
    * **Wind & Rain (`wind`, `rain`):** Elevation- and wind-speed-coupled noise sweeping through resonant filters as wind moves through giant *Araucaria* and *Lepidodendron* canopies.
    * **Birds & Insects (`birds`, `insects`):** Circumstantial FM/additive synthesis (dawn/dusk bird chorus, warm-afternoon insect stridulation, nighttime amphibian/cricket calls near water) that naturally hush when an apex predator is watching nearby!
  * **Shared Wristwatch Soundtrack (`soundtrack_playing`):**
    * Players can load custom audio tracks (`.mp3` / `.ogg` / `.wav` or the built-in ambient procedural score) and toggle the soundtrack `ON`/`OFF` on the shared wristwatch so everyone enjoys a synchronized musical backdrop or pure wilderness acoustics.

### B. Owner-Secret `A`-Hold ($\ge 3.0\text{ s}$): Muted-Mic Dictation Notes, Voice Environment Control & $0.00-Extra-Cost Gemini AI Ultra Live Companion
* **Trigger & Automatic Multiplayer Mic Mute:**
  * When the **Owner** (`is_owner == True`) **holds the `A` button for $\ge 3.0\text{ seconds}$** (distinct from a quick press `< 0.5\text{ s}` for Giant Globe or Selfie Flip):
    1. Your **multiplayer WebRTC microphone is immediately muted (`multiplayer_mic_muted: true`)** so other players cannot hear you talking to your assistant or dictating notes.
    2. A **Private Owner HUD Panel** opens (`secret_hud_visible_to_others: false`), rendered exclusively to your local display.
* **How We Achieve Full Voice Notes, Scene Control & Gemini AI Ultra Chat at \$0.00 Extra Cost:**
  * Because Meta Quest Browser does not expose `window.SpeechRecognition` natively (whereas Desktop Chrome does), and because you already have a **Google AI Ultra subscription** (and don't want separate per-token API billing), we combine three zero-cost layers:
    1. **Mode 1 — Private Voice Dictation Field Notes (`DICTATION_NOTES`):** Uses `navigator.mediaDevices.getUserMedia` routed to a lightweight in-browser WebAssembly/WebGPU **`whisper-tiny.en` Web Worker** on Quest 3 (or native `webkitSpeechRecognition` on desktop) plus audio memo recording. Everything you say is transcribed at $0.00 cost and saved to your persistent **`IndexedDB` Field Notes (`walkabout_owner_notes_v1`)** tagged with your exact $(\phi_0, \lambda_0)$ coordinates and timestamp.
    2. **Mode 2 — Realtime Voice Environment Control (`VOICE_ENV_CONTROL`):** Parses your spoken commands locally to adjust the world hands-free (*"Set weather to valley fog"*, *"Set time to sunset"*, *"Set terrain steepness to 1.7x"*, *"Trigger meteor shower"*).
    3. **Mode 3 — Live Gemini AI Ultra Companion Window & Transcript Archiver (`GEMINI_ULTRA_LIVE`):**
       * Opens/focuses your authenticated **Google Gemini Web App (`https://gemini.google.com/app`)** in a connected Quest Browser multitasking side-panel (or via your local Antigravity host bridge on `localhost:8765`), where your **Google AI Ultra subscription** gives you unlimited access to **Gemini Live** voice/text chat at **$0.00 extra cost**.
       * Automatically injects a context header with your current $(\phi_0, \lambda_0)$ coordinates, local geology, and nearby prehistoric flora/fauna so you can ask *"What kind of prehistoric creatures lived in this valley?"* or brainstorm design ideas, and **automatically saves the entire conversation transcript into your wristwatch Field Notes** for reference!

### C. Accurate $1:1$ Scale & Blending Sighting Frequencies (Collective Unseen Weighting + Intrinsic Hourly Rates)
* To make every hike lively right away **while still rewarding 10–50+ hours of play across many sessions**, we blend a **4-Tier Intrinsic Hourly Rate Pyramid ($\lambda_{\text{base}, k}$)** with a **Collective Multiplayer Unseen Multiplier ($M_{\text{novelty}}$)**:
  1. **The 4-Tier Intrinsic Frequency Pyramid:**
     * **Tier 0 — Ambient Stock Wildlife ($\lambda_{\text{base}} \approx 35\text{--}60\text{ / hour}$, every $1\text{--}2\text{ min}$):** Smaller/common creatures (*Meganeura* griffinflies, *Lystrosaurus*, early horses, trilobites/king crabs in streams, prehistoric songbirds, jumping fish, pinecones/skipping stones). Keeps the trail vibrant at all times.
     * **Tier 1 — Regional Herbivores & Weather Wonders ($\lambda_{\text{base}} \approx 6\text{--}10\text{ / hour}$, every $6\text{--}10\text{ min}$):** *Megaloceros*, *Glyptodon*, *Diprotodon*, *Macrauchenia*, post-storm rainbows, mammatus clouds.
     * **Tier 2 — Spectacular Megafauna & Signature Predators ($\lambda_{\text{base}} \approx 1.5\text{--}3.0\text{ / hour}$, every $20\text{--}40\text{ min}$):** Rideable *Mammuthus*, *Paraceratherium*, *Megatherium*, *Leedsichthys*; startle-watching *Smilodon*, *Dire Wolf* packs, *Miracinonyx* (American Cheetah), *Panthera atrox*; auroras, meteor showers.
     * **Tier 3 — Mythic / Elusive Giants & Rare Cosmic Wonders ($\lambda_{\text{base}} \approx 0.15\text{--}0.40\text{ / hour}$, once every $2.5\text{--}6+\text{ hours}$):** *Titanoboa*, *Vasuki*, *Otodus megalodon* offshore breach, *Arctodus* / *Arctotherium*, *Kelenken*, Great Comets, Total Solar Eclipses, Volcanic Eruptions.
  2. **Collective Unseen Novelty & Longevity Formula (`evaluate_encounter_frequency_and_photo_hide_and_seek`):**
     For any species/phenomenon $k$, let $u_k \in \{0..N_{\text{players}}\}$ be the number of current players in the session who have **never photographed or witnessed** $k$:
     $$\lambda_{\text{eff}, k} = \lambda_{\text{base}, k} \cdot \underbrace{\left(1 + 1.5\,\frac{u_k}{N_{\text{players}}} + 1.0\cdot\mathbb{I}(u_k = N_{\text{players}})\right)}_{M_{\text{novelty}} \in [1.0,\, 3.5]} \cdot \underbrace{\Big(1 + 0.15\,\min(5.0,\, t_{\text{hours\_played}})\Big)}_{M_{\text{longevity}} \in [1.0,\, 1.75]}$$
     * **Shared New Experience Boost ($3.5\times$):** Animals or wonders that **none** of the current players have ever seen ($u_k = N_{\text{players}}$) receive a $3.5\times$ relative probability boost so friends playing together regularly share brand-new discoveries!
     * **Sherpa / Newcomer Synergy:** If you bring a friend who hasn't seen a *Mammoth* yet ($u_k \ge 1$), its spawn weight stays elevated ($1.375\times\text{--}2.5\times$) until your friend captures their first photo.
     * **Long-Session Elusive Reward:** Once the group has photographed most Tier 1/2 creatures ($M_{\text{novelty}} \rightarrow 1.0$ for common animals), the $3.5\times$ novelty multiplier on remaining unseen **Tier 3 Mythic creatures** combined with $M_{\text{longevity}}$ naturally shifts the ecosystem toward elusive sightings over multi-hour expeditions!

### D. Multiplayer Photo Hide-and-Seek ("Prehistoric Paparazzi Stalker") — Finalized Rules & 1,000-Trial 2D Monte Carlo Equilibrium
* **Finalized Core Rules (`evaluate_refined_hide_and_seek_rules`):**
  1. **Consensus Wristwatch Launch, $5\text{ s}$ Countdown & $260\text{ m}$ Dispersion:** All active players select **Hide & Seek** on their wristwatch (`all_players_selected_game == True`), triggering a **$5.0\text{ s}$ countdown** and dispersing players $150\text{--}300\text{ m}$ apart ($R_{\text{disp}} = 260\text{ m}$) around $(\phi_0, \lambda_0)$ behind natural terrain/foliage cover.
  2. **Uncapped Distance + $+1\text{ pt}$ per $10\text{ m}$ Increment Newly Broken:**
     * **No arbitrary distance cap (`distance_capped: false`):** If you can recognizably capture another player's **head** in your viewfinder (even across a valley using $8\times$ optical zoom!), the shot counts at any distance $d$.
     * **4-Part Cumulative $10\text{ m}$ Closeness Scoring ($b = \min(B_0, \lfloor d / 10.0 \rfloor)$, with $B_0 = 10$ [$100\text{ m}$]):**
       * **Global First on Target (`+1 pt`):** First player out of all players to photograph target $j$.
       * **Pairwise First (`+1 pt`):** First player out of the pair $\{i, j\}$ to photograph the other.
       * **Global Closeness Points (`+1 pt` initial + $+1\text{ pt}$ per $10\text{ m}$ step closer):** $+1\text{ pt}$ for setting the initial record plus $B_0 - b$ points on the first photo of target $j$, and $\Delta b_{\text{global}} = b_{\text{prev\_global}}(j) - b$ points on every closer photo of target $j$!
       * **Pairwise Closeness Points (`+1 pt` initial + $+1\text{ pt}$ per $10\text{ m}$ step closer):** $+1\text{ pt}$ for setting the initial record plus $B_0 - b$ points on the first photo between $\{i, j\}$, and $\Delta b_{\text{pair}} = b_{\text{prev\_pair}}(\{i, j\}) - b$ points on every closer photo between $\{i, j\}$!
  3. **`A` Button Cycles $1\times, 2\times, 4\times, 8\times$ Optical Zoom & $360^\circ$ Recognizable Head Gate (`head_recognizably_visible`):**
     * Pressing **`A`** during Hide & Seek cycles the permanent camera reticle through **$1\times \rightarrow 2\times \rightarrow 4\times \rightarrow 8\times \rightarrow 1\times$ optical zoom** ($\text{FOV} = 60^\circ / Z \in \{60^\circ, 30^\circ, 15^\circ, 7.5^\circ\}$).
     * **$360^\circ$ Recognizable Head Requirement (`head_recognizably_visible`):** The captured image must recognizably contain the target player's **head from any angle** (front, profile, or back of the head—so a stealth player who sneaks up behind a target who is facing away is **never penalized**, and nobody can cheese the camera by turning their back!).
     * **$3.0\text{ s}$ Camera Recharge & $5\text{--}8\text{ s}$ Delayed Scoreboard Update:** Prevents blind trigger-spamming and prevents targets from using wristwatch score ticks as a real-time alert.
  4. **`B` Button Faint Ground-Glow Night Vision (`FAINT_GROUND_GLOW`) + Owner Secret IR Thermal (`SECRET_IR_THERMAL`):**
     * Standard `B` headlamp does **not** cast a visible spotlight beam in Hide & Seek; instead, it illuminates the ground faintly around your feet ($r \approx 2.5\text{ m}$) for subtle night navigation (`OFF` $\leftrightarrow$ `FAINT_GROUND_GLOW`).
     * The **Owner** (`is_owner == True`) retains the 3-state `B` toggle (`OFF` $\rightarrow$ `FAINT_GROUND_GLOW` $\rightarrow$ `SECRET_IR_THERMAL`).
  5. **Wristwatch "Remaining Points Available" Counter (`remaining_points_available`) & Natural Match Completion:**
     * In a 4-player match ($4$ targets + $6$ pairs), the total match pool is exactly **$120\text{ Points}$** ($4 \times 12\text{ pts} + 6 \times 12\text{ pts}$).
     * Instead of technical "brackets", every player's wristwatch displays **"Remaining Points Available: $P_{\text{rem}}$"** counting down from $120 \rightarrow 0$. Once a pair reaches $< 10\text{ m}$, no more pairwise points exist between them and they must hunt other players. If **Remaining Points Available** reaches **`0`** (`game_over_all_points_exhausted: true`), the match concludes immediately!
  6. **Time-Paced Teleportation ($\le 5.0\text{ m/s}$), Trackable Footsteps ($< 30\text{ s}$), Tree Climbing & The 4-Band Ecological Tell System:**
     * **Teleport Range Pacing:** $D_{\text{tp\_max}}(\Delta t) = \min(12.0\text{ m},\, 5.0\text{ m/s} \cdot \Delta t_{\text{since\_last\_tp}})$.
     * **Trackable Footsteps ($< 30.0\text{ s}$ Old — `footstep_trackable`, `footstep_opacity`):** Every step or landing leaves directional footprints in snow, mud, sand, or forest duff that fade linearly over **$30.0\text{ seconds}$** ($\alpha_{\text{print}} = \max(0, 1 - t_{\text{age}} / 30.0)$). Any tracker who crosses a rival's path within $30\text{ s}$ can visually follow their footprints!
     * **Tree & Cliff Climbing Allowed (`tree_climbing_allowed: true`) With Speed-Based Animal Tells Still Active:** Players can climb giant prehistoric trees (*Sequoiadendron*, *Araucaria*, *Lepidodendron*) or cliffs to break their ground footprint trail and gain elevated sightlines over low boulders—**but all speed-based animal tells remain active in the canopy!** Perching in a tree at $< 0.5\text{ m/s}$ for $30\text{ s}$ still attracts **Circling Vultures** above your tree, and canopy-sprinting at $4\text{--}5\text{ m/s}$ for $> 5\text{ s}$ still flushes **Startled Birds** from the branches!
     * **Circling Vultures (`avg_speed_30s_mps < 0.5` over $30\text{ s}$):** Prehistoric vultures/teratorns circle high overhead above any player who camps or creeps below $0.5\text{ m/s}$ average speed over $30\text{ seconds}$ (whether on the ground or perched in a tree).
     * **Silent Stealth Band ($0.5\text{ m/s} \le v \le 4.0\text{ m/s}$):** Zero velocity tells!
     * **Startled Birds ($4.0\text{--}5.0\text{ m/s}$ Sprinting or Equivalent Teleporting for $> 5.0\text{ s}$):** Flushes noisy flocks of prehistoric birds out of the canopy.
     * **Curious Prehistoric Herbivores + $90\text{ s}$ Drought Herding (`herbivore_curiosity_radius_m`):** Whenever a player enters the unobstructed line-of-sight of nearby herbivores ($R_{\text{herb}} = 65.0\text{ m}$), the animals turn toward that player and slowly, curiously walk in their direction. If $90\text{ seconds}$ elapse without any player scoring a point (`drought_sec >= 90.0`), the herbivores' curiosity radius expands to **$120.0\text{ m}$** to organically herd the remaining players together!
  7. **Post-Match "Paparazzi Reveal Gallery":** Displays the actual `WebP` ambush photos taken during the match when the round concludes.

* **Re-Optimized 1,000-Trial 2D Monte Carlo Equilibrium with $< 30\text{ s}$ Footsteps, Tree Climbing & Navigable Obstacles (`simulate_hide_and_seek_monte_carlo`):**
  Using our updated simulator ($R_{\text{disp}} = 250\text{ m}$, $42$ random-sized Poisson-disk obstacles with radii $r \in [4.5\text{ m}, 13.0\text{ m}]$ and guaranteed $\ge 2.2\text{ m}$ clear navigable corridors, $< 30\text{ s}$ footstep tracking, tree climbing with canopy sightlines and speed tells, $360^\circ$ recognizable head capture, and $120\text{ Total Points}$), we re-optimized all 4 strategies over **1,000 full matches**:

  | Player Strategy Archetype | Speed, Zoom & Verticality Profile | Ecological & Tracking Counterplay | Calibrated Mean Score (out of $120\text{ pts}$) | Calibrated Win Rate (Ideal: $25.0\%$) |
  | :--- | :--- | :--- | :---: | :---: |
  | **`STEALTH_PROWLER`** | $3.2\text{ m/s}$ (Silent Band), $4\times$ Zoom ($154\text{ m}$ reach), climbs trees to shed footprint trails | Never triggers birds or vultures; stalks `SNIPER_CAMPER` via vultures & follows $< 30\text{ s}$ footprints | **$29.68\text{ pts}$** | **$25.7\%$** |
  | **`SNIPER_CAMPER`** | $0.45\text{ m/s}$ + tree-canopy relocate every $48\text{ s}$, $8\times$ Zoom ($285\text{ m}$ reach) | Climbs trees for elevated sightlines over boulders; snipes `SPRINT_RUSHER` when birds flush | **$31.51\text{ pts}$** | **$24.2\%$** |
  | **`SPRINT_RUSHER`** | $4.6\text{ m/s}$, $1\times/2\times$ Wide FOV ($102\text{ m}$ reach) | Rapidly tracks fresh $< 30\text{ s}$ footprints at high speed to ambush from behind (`360°` head) | **$29.34\text{ pts}$** | **$27.9\%$** |
  | **`BALANCED_HIKER`** | $3.15\text{ m/s}$, $2\times/4\times$ Zoom ($148\text{ m}$ reach), mixes tree climbs & ground tracking | Combines **Curious Herbivore** watching with $< 30\text{ s}$ footprint tracking | **$29.15\text{ pts}$** | **$26.0\%$** |

  * **Key Re-Optimized Telemetry Across 1,000 Simulated Matches:**
    * **Strategy Win-Rate Parity:** All four strategies win between **$24.2\%$ and $27.9\%$** of matches (`STEALTH_PROWLER` $25.7\%$, `SNIPER_CAMPER` $24.2\%$, `SPRINT_RUSHER` $27.9\%$, `BALANCED_HIKER` $26.0\%$) with mean scores clustered between **$29.15\text{ pts}$ and $31.51\text{ pts}$**!
    * **Faster, Action-Packed Match Pacing ($\approx 5.9\text{ Minutes}$):** Adding **$< 30\text{ s}$ Trackable Footsteps** ($80.0$ footstep-trail locks per match) and **Tree-Canopy Climbing** ($29.4$ tree climbs per match) brings the average match completion time to **$352.3\text{ seconds}$ ($\approx 5.87\text{ minutes}$)**—making a **$6\text{ to } 7\text{ minute}$ default match timer** ideal!
    * **Complete Point-Pool Depletion:** **$79.7\%$** of matches claim all $120\text{ points}$ (`Remaining Points Available = 0`), with an average of only **$0.32\text{ Remaining Points}$** left unclaimed!

---

### E. Elevation & Latitude Snow/Ice/Frozen Water, Global Biomes, Navigable Obstacle Spacing ($\ge 2.2\text{ m}$) & Pinned House-Building (`evaluate_footsteps_tree_climb_biomes_and_cryosphere`)
* **Elevation & Latitude Cryosphere: Snow, Alpine Ice & Walkable Frozen Water:**
  * Using the standard tropospheric environmental lapse rate ($\Gamma = 6.5^\circ\text{C} / 1000\text{ m}$ elevation gain) combined with latitude $|\phi_0|$ and wristwatch seasonal offset $\Delta T_{\text{season}}$:
    $$T_{\text{surface}}(\phi_0, h_{\text{elev}}) = \big(28.0^\circ\text{C} - 0.55 \cdot |\phi_0| + \Delta T_{\text{season}}\big) - 0.0065 \cdot h_{\text{elev}}$$
  * **Snow & Ice Above Snowline / High Latitudes (`snow_and_ice_active: true` when $T_{\text{surface}} \le 0.0^\circ\text{C}$):** Terrain facets, cliff ledges, and megaflora branches above the snowline (or at high latitudes) automatically render with crisp `beautiful-low-res` snow and glacial ice palettes, preserving high-contrast $30\text{ s}$ snow footprints.
  * **Walkable Frozen Lakes, Ponds & Rivers (`frozen_water_walkable: true` when $T_{\text{surface}} \le -2.0^\circ\text{C}$):** Water bodies freeze into solid, translucent low-poly ice sheets that players and megafauna can walk and slide across!
* **Authentic Pristine Biomes (`biome_type`):**
  * Automatically resolves any coordinate's temperature $T_{\text{surface}}$ and annual precipitation $P_{\text{annual}}$ (via WorldClim / Open-Meteo) into:
    1. `ALPINE_GLACIER_ICE` ($T_{\text{surface}} \le -2.0^\circ\text{C}$)
    2. `SNOWY_TUNDRA_TAIGA` ($-2.0^\circ\text{C} < T_{\text{surface}} \le 2.0^\circ\text{C}$ — e.g., Mammoth Steppe, Boreal *Araucaria*/*Pinus* Taiga)
    3. `ARID_DESERT_DUNES` ($T_{\text{surface}} > 2.0^\circ\text{C}$ and $P_{\text{annual}} < 250\text{ mm}$ — red sandstone canyons, wind-sculpted dunes, sparse cycad oases)
    4. `OPEN_PRAIRIE_STEPPE` ($250\text{ mm} \le P_{\text{annual}} < 600\text{ mm}$ — sweeping grasslands, *Megaloceros* / *Mammuthus* / *Bison antiquus* herds, scattered boulder outcrops)
    5. `PREHISTORIC_FOREST` ($P_{\text{annual}} \ge 600\text{ mm}$ — towering *Sequoiadendron*, *Araucaria*, *Lepidodendron*, and tree-fern canopies)
* **Guaranteed Navigable Inter-Obstacle Clearance (`corridor_navigable: true`, $C_{\min} \ge 2.2\text{ m}$):**
  * Even in the densest `PREHISTORIC_FOREST` or boulder field, obstacle placement enforces a strict **Poisson-Disk Minimum Edge-to-Edge Clearance**:
    $$d_{\text{edge}}(a, b) = \sqrt{(x_a - x_b)^2 + (z_a - z_b)^2} - (r_a + r_b) \ge 2.20\text{ m}$$
    with a maximum area packing fraction capped at $\eta_{\max} \le 0.28$. Since the human collision cylinder is $2 R_{\text{player}} = 0.70\text{ m}$ wide, a $\ge 2.20\text{ m}$ clear corridor between every pair of trees and boulders guarantees that players can **always** walk, run, or teleport smoothly between and around obstacles without ever getting wedged!
* **House-Building Features Pinned (`house_building_pinned: true`):**
  * Per project direction, all custom house/architectural building features are **pinned/shelved for now** so that $100\%$ of the studio's active focus is dedicated to the **pristine, untouched prehistoric hiking, wildlife photography, and multiplayer Hide-and-Seek wilderness experience**.

---

### F. Unified Obstacle Distribution, Rare UFO & Bigfoot Easter-Egg Sightings, Quest 3 Breath-Hold Underwater Diving vs. Passthrough, Immediate Passthrough Vultures & Predator Startles (`evaluate_easter_eggs_breathing_dive_and_passthrough_tells`)
* **Identical Navigable Obstacle Distribution Across Regular Hikes & Hide-and-Seek (`shared_obstacle_distribution_across_modes: true`):**
  * Both `REGULAR_HIKE` and `HIDE_AND_SEEK` share the exact same Poisson-disk obstacle generator (`_generate_navigable_obstacles`, minimum inter-obstacle edge-to-edge clearance $C_{\min} \ge 2.20\text{ m}$, max packing fraction $\eta_{\max} \le 0.28$), ensuring natural forest/boulder spacing and muscle memory carry seamlessly between casual hiking and competitive Hide-and-Seek.
* **Rare UFO & Bigfoot Sightings (Photographable Non-Animal Easter Eggs):**
  * **Bigfoot (`BIGFOOT`)** ($\lambda_{\text{Bigfoot}} = 0.015/\text{hr}$ base rate, $\approx 1$ per $66\text{ hours}$, boosted up to $3.5\times$ if unseen by the current party) can occasionally be glimpsed striding between distant redwoods or alpine ridges.
  * **UFO (`UFO`)** ($\lambda_{\text{UFO}} = 0.010/\text{hr}$ base rate, $\approx 1$ per $100\text{ hours}$) can silently hover or streak across twilight/night skies.
  * **Non-Official Animal Photo Rule (`is_official_prehistoric_animal: false`, `photographable: true`):** Photographing Bigfoot or a UFO captures the actual camera image in the wristwatch album and logs **only the GPS location and real-world date/time** (`photo_logged_metadata = "GPS_LOCATION_AND_REAL_DATE_ONLY"`, `standardized_animal_stats_populated: false`), matching the rule for photographing non-official subjects and natural wonders.
* **Quest 3 Breathing Detection & Underwater Breath-Hold vs. Surface Floating vs. Passthrough (`_evaluate_breathing_water_state`):**
  * **Can the Quest 3 Detect Breathing? Yes (`quest_breathing_detection_supported: true`):**
    1. **Microphone Breath Acoustic Envelope (`WebAudio AnalyserNode`):** The Quest 3 dual-microphone array sits $\approx 3\text{ cm}$ below the nostrils and mouth. Filtering mic input through a $150\text{--}1800\text{ Hz}$ respiratory bandpass filter and measuring short-window RMS energy (`mic_breath_rms_dbfs >= -42.0 dBFS`) + spectral flatness detects active inhalation/exhalation airflow versus silence (holding your breath), paired with a $45\text{ s}$ safety auto-surface timer.
    2. **Headset Micro-Kinematics (`WebXR ViewerPose`):** Subtle $0.2\text{--}0.4\text{ Hz}$ vertical/pitch respiratory micro-oscillation reinforces the acoustic detector.
  * **Three Intuitive Water States & Underwater Flight-Style Swimming (`_compute_underwater_flight_swim`):**
    * **Holding Your Breath (`is_breathing == False` and submerging):** You dive **underwater** (`water_state = "SUBMERGED_BREATH_HELD"`, `underwater_submerged: true`) for as long as you hold your breath!
      * **Underwater Flight-Style Locomotion Capped at $\frac{1}{4}$ Max Speed (`underwater_locomotion_mode = "UNDERWATER_3D_FLIGHT_SWIM"`, `underwater_speed_ratio = 0.25`):** While submerged, you move through the water **just like flying**—point your controller in any 3D direction (diving deeper, gliding along the riverbed/reef, or ascending) and push the thumbstick forward (`swim_thumbstick_y > 0.15`) to glide smoothly along your controller's aiming vector $\mathbf{v}_{\text{swim}} = v_{\text{swim, max}} \cdot \text{stick}_y \cdot \hat{\mathbf{d}}_{\text{ctrl}}$, where $v_{\text{swim, max}} = \frac{1}{4} v_{\text{ground/flight, max}}$ (**$2.50\text{ m/s}$** on Regular Hikes where max ground/flight speed is $10.0\text{ m/s}$, and **$1.25\text{ m/s}$** in Hide-and-Seek where max speed is $5.0\text{ m/s}$)!
      * While swimming underwater, you can observe prehistoric aquatic giants (*Megalodon*, *Leedsichthys*, *Xiphactinus*)—and during **Hide-and-Seek**, gliding underwater while holding your breath acts as a **sneaky underwater hiding & repositioning trick** (`sneaky_underwater_hiding_active: true`)!
    * **Breathing While in Water (`is_breathing == True`):** As soon as you breathe, underwater flight-swimming disengages and buoyancy gently **floats you up to/on the water surface** (`water_state = "FLOATING_ON_SURFACE"`, `floating_on_surface: true`).
    * **Trying to Go Underwater While Breathing (`is_breathing == True` and `attempting_submerge == True`):** The water surface acts like a solid boundary—forcing your head downward into water while breathing immediately switches your view to **MR Passthrough (`water_state = "PASSTHROUGH_WATER_BLOCKED"`, `water_passthrough_active: true`)**, just like walking into a rock or tree!
* **Immediate Swirling Vultures on Any Passthrough (`immediate_passthrough_vulture_tell: true`, `vulture_trigger_delay_sec: 0.0`):**
  * To prevent players from exploiting MR Passthrough by stepping inside rocks, tree trunks, cliffs, or water-while-breathing to hide their head out of sight, **entering any object or water-while-breathing Passthrough (`passthrough_active: true`) causes vultures to immediately begin swirling overhead (`0.0s` delay instead of `30.0s`)**, instantly broadcasting their exact location to every hunter!
* **Predators Continue to Startle Players During Hide-and-Seek (`predator_startle_enabled_in_hide_and_seek: true`):**
  * Prehistoric ambush predators (*Smilodon*, *Cave Lion*, *American Cheetah*, *Dire Wolf Pack*, *Haast's Eagle*, *Titanoboa*, *Deinosuchus*) remain active during Hide-and-Seek matches (`predator_startle_triggered: true` when within $\le 12.0\text{ m}$ and unobserved), startling campers out of cover and keeping the prehistoric wilderness alive!

---

### G. Walkabout Lost-Ball-Inspired Collectible Trail Artifacts: One-of-a-Kind Arrowheads & Stone Tools (`evaluate_collectible_trail_artifact`)
* **Procedural One-of-a-Kind Lithic Artifacts (`_generate_unique_artifact_spec`):**
  * Inspired by hunting for hidden lost golf balls in *Walkabout Mini Golf*, hikers can spot and collect **procedurally unique prehistoric arrowheads, spearpoints, and stone tools** lying on or near game trails, dry washes, gravel bars, and cliff overhangs ($\le 6.0\text{ m}$ from trail centerlines).
  * Every single artifact (`artifact_uid`) is deterministically synthesized from a unique seed so **no two arrowheads are ever identical**:
    * **Shape Typologies (`shape_typology`):** *Clovis Fluted Spearpoint*, *Folsom Lanceolate Point*, *Side-Notched Arrowhead*, *Corner-Notched Tang Point*, *Solutrean Laurel-Leaf Blade*, *Acheulean Bifacial Teardrop*, and *Serrated Dalton Point*.
    * **Local & Exotic Stone Types (`stone_type`):** *Black Volcanic Obsidian*, *Banded Chert*, *Translucent Agate Chalcedony*, *Red Jasper*, *Dark Nodular Flint*, *Petrified Araucaria Wood*, and *Hyaline Quartz Crystal*.
    * **Parametric Dimensions & Knapping Geometry:** Continuous length $L \in [2.4\text{ cm}, 13.8\text{ cm}]$, width $W$, thickness $T$, individual pressure-flaking scar count ($14\text{--}58$ facets), edge serration teeth ($0\text{--}22$), and craftsmanship tier (`UTILITARIAN_FLAKE`, `HUNTER_GRADE`, `FINE_PRESSURE_FLAKED`, `MASTERWORK_CEREMONIAL`).
* **Exclusive First-Finder Pickup via Thumbstick Pull-Back (`exclusive_single_player_claim: true`):**
  * Pointing at an artifact within $6.5\text{ m}$ and **pulling back on the joystick** (`joystick_pull_back_y < -0.5`—the same intuitive gesture used for picking up lost balls in *Walkabout* and throwing rocks/pinecones) vacuums the arrowhead into your hand.
  * **Atomic Single-Player Ownership:** Each artifact in the world can **only be picked up by one person** (`pickup_succeeded: true` for the first finder; `already_claimed_conflict_blocked: true` if another player tries to grab it afterward).
* **High-Impact Design Tweaks & Enhancements (Approved):**
  1. **Natural "Flint Glint" Specular Sparkle + Post-Rain Washout Boost (`flint_glint_specular_intensity`):** Instead of immersion-breaking floating UI arrows, arrowheads catch sunlight, moonlight, or your **B-button Headlamp** with a realistic glassy **flint glint**. Immediately after a **rainstorm**, surface dust washes away (`post_rain_washout_multiplier = 1.5`), making arrowheads $50\%$ brighter to spot along muddy trails and streambeds—just like real-world surface hunting after a rain!
  2. **1:1 Hand Inspection & Wristwatch Velvet Display Case (`saved_to_wristwatch_artifact_case: true`, `one_to_one_hand_inspection_enabled: true`):** Pulling an arrowhead into your hand lets you rotate your wrist to inspect its translucent flaking scars against the sky and show it to nearby friends before stowing it in your **Wristwatch Velvet Display Case** (which also drops a **Golden Arrowhead Pin** on the Giant-Mode 3D Globe at the exact discovery coordinates!).
  3. **Player-to-Player Hand-Off Gifting (`gifted_to_player_id`):** Because each arrowhead is 1-of-1 and can only be picked up by one person, holding a discovered arrowhead out toward a friend allows them to pull back on their joystick to **receive it as a gift**, transferring ownership in the persistent collection!
  4. **Realistic Micro-Terrain Hotspots (`micro_terrain_hotspot`):** Concentrating spawns along **worn herbivore/hiking trails, river gravel bars, dry lakebeds, and cliff overhangs** rewards observant hikers who learn to read the prehistoric terrain, while locking/muting artifact pickups during active `HIDE_AND_SEEK` matches (`collectible_in_current_mode: false` in Hide-and-Seek) keeps competitive matches focused.

---

## 12. Runtime Efficiency & Quest 3 90Hz Optimization Architecture (`evaluate_runtime_efficiency_optimizations`)

To run this entire global prehistoric hiking, photography, artifact-hunting, and multiplayer Hide-and-Seek experience at a **locked $90\text{ Hz}$ ($11.1\text{ ms}$ frame budget)** on Meta Quest 3 (`WebXR`) and desktop browsers with zero server cost, the engine implements **8 Core Efficiency Pillars**:

1. **GPU `InstancedMesh` Batching + $16 \times 16$ `PixPal` Vertex-Color Palette Atlas (`instanced_palette_atlas_active: true`):**
   * Replaces hundreds of individual PBR material textures and draw calls with a single $16 \times 16$ (`256-pixel`) flat-shaded + specular-luster palette atlas and Three.js `InstancedMesh` buffers for all regional trees, boulders, `< 30s` footsteps, and trail arrowheads.
   * **Efficiency Gain:** Compresses $> 1,600$ unbatched draw calls down to **$\le 24$ draw calls per frame** ($> 98.5\%$ draw-call reduction).
2. **Deterministic 64-Bit Seed Multiplayer Sync (`deterministic_seed_network_sync: true`):**
   * Because Poisson-disk obstacle placement (`_generate_navigable_obstacles`), biome/cryosphere state, animal paths, and 1-of-1 trail arrowheads (`_generate_unique_artifact_spec`) are pure deterministic functions of `(world_seed, lat, lon, time_bucket)`, peers never transmit 3D geometry or obstacle arrays over the network.
   * **Efficiency Gain:** Each player only broadcasts compact $48\text{-byte}$ state packets at $20\text{ Hz}$ over P2P WebRTC (`PeerJS`), keeping bandwidth under **$2.88\text{ KB/s}$ per player** ($< 8\text{ KB/s}$ total for a 4-player lobby).
3. **$10\text{ m} \times 10\text{ m}$ 2D Spatial Hash Grid (`spatial_hash_cell_size_m: 10.0`):**
   * Partitions the local tile into $10\text{ m} \times 10\text{ m}$ buckets so sliding cylinder collision ($0.35\text{ m}$ human radius), `< 30s` footstep trail lookup, $6.5\text{ m}$ arrowhead pull-back pickup, and Hide-and-Seek line-of-sight raycasts only inspect the **9 neighboring cells ($3 \times 3$)** in $O(1)$ time ($< 0.25\text{ ms}$ CPU per frame).
4. **Zero-GC Pre-Allocated 256-Slot GPU Ring Buffer for $< 30\text{ s}$ Footsteps (`footstep_gc_allocations_per_step: 0`):**
   * Pre-allocates a fixed 256-instance ring buffer (`slot = (slot + 1) % 256`) where each new footstep overwrites the oldest slot's transform matrix and `uSpawnTime` attribute. The vertex shader fades opacity linearly over $30.0\text{ s}$ (`alpha = max(0.0, 1.0 - age / 30.0)`) on the GPU with **zero JavaScript heap allocations or garbage-collection stutters**.
5. **Zoom-Aware 3-Tier Animal LOD + 12-Triangle Conic-Hull Impostors (`_select_animal_lod_tier`):**
   * Dynamically selects `LOD0_FULL_ARTICULATED_HIGH` ($\approx 800$ tris) within $0\text{--}60\text{ m}$, `LOD1_MID_POLY_45HZ` ($\approx 140$ tris, half-rate skeletal update) at $60\text{--}180\text{ m}$, and `LOD2_CONIC_HULL_SILHOUETTE_IMPOSTOR` ($12$ tris) beyond $180\text{ m}$.
   * **Smart Zoom Promotion (`zoom_frustum_lod_promotion_active: true`):** When a player aims the camera with **$2\times, 4\times, \text{or } 8\times$ optical zoom**, the effective LOD distance divides by the zoom factor ($d_{\text{eff}} = d / Z$) solely inside the narrow camera reticle cone, promoting distant targets to full `LOD0` detail so their head and species features are crisp!
6. **Off-Thread `WebWorker` Terrain Streaming & `OffscreenCanvas` WebP Photo Encoding (`webworker_terrain_and_webp_photo_encoding: true`):**
   * Runs AWS Terrarium elevation decoding, Poisson-disk obstacle generation, and `OffscreenCanvas.convertToBlob({ type: 'image/webp', quality: 0.82 })` photo compression off the main WebXR render thread so snapping a photo or teleporting never drops a 90 Hz frame.
7. **Quest 3 Fixed Foveated Rendering (`FFR = 0.85`) + High-DPI `WebXR Quad Layer` Wristwatch & Reticle (`webxr_quad_layer_wristwatch_reticle: true`):**
   * Uses native `XRProjectionLayer.fixedFoveation = 0.85` to reduce peripheral fragment shading by $\approx 30\%$, while compositing the Wristwatch Album/Artifact Case and Camera Reticle onto a dedicated hardware `XRQuadLayer` for crystal-clear text and photo viewing.
8. **8-Voice Procedural `WebAudio` Synthesizer Pool (`procedural_webaudio_voice_pool_size: 8`):**
   * Synthesizes wind, rain, water waves, bird calls, insect stridulation, rock skips, and predator roars in real time using an 8-voice HRTF-spatialized `WebAudio` node pool ($< 15\text{ KB}$ total code, zero multi-megabyte `.wav` downloads).

---

## 13. 9-Stage Hierarchical Development & In-Headset Interactive Playtest Plan (`get_hierarchical_development_and_playtest_plan`)

Ordered topologically from **Tier 1 (Foundational Engine & Locomotion Bedrock)** $\rightarrow$ **Tier 2 (Interactive Ecosystem, Physics, Photography & Weather)** $\rightarrow$ **Tier 3 (Multiplayer, Competitive Hide-and-Seek & Cherry-on-Top Secret Features)**. At the end of **every stage**, you can step directly into the Quest 3 (or desktop browser), test the new mechanics in isolation, and adjust the live Wristwatch Developer Sliders until the feel is locked in before advancing:

| Stage | Tier | Focus & Core Deliverables | Step-In Playtest Actions | Live Tweak Knobs (In-Headset Sliders) |
| :---: | :--- | :--- | :--- | :--- |
| **Stage 0** | **Tier 1: Bedrock** | **Core Engine, `PixPal` Instanced Renderer & Dual-Mode (`WebXR` + Desktop) Entry:** $16 \times 16$ palette atlas, GPU `InstancedMesh` ($\le 24$ draw calls), Quest 3 $90\text{ Hz}$ `FFR = 0.85`, frame-time HUD. | Step into test clearing on Quest 3 & desktop; cycle `PixPal` palettes; verify locked $90\text{ FPS}$ & $1:1$ scale. | `palette_contrast`, `hemi_sky_ground_ratio`, `sun_elevation_deg`, `ffr_level` |
| **Stage 1** | **Tier 1: Bedrock** | **Locomotion, Sliding Collisions, Passthrough, Climbing, $<30\text{s}$ Footsteps & Breath-Hold Water:** Parabolic arc teleport ($15\text{ m}$), point-up flight ($>55^\circ$, $10\text{ m/s}$), $0.35\text{ m}$ sliding cylinder, head-in-object MR Passthrough, $0.6\text{ m}$ upright cliff/tree climbing, 256-slot footprint ring buffer, Quest 3 mic breath-hold underwater diving + $\frac{1}{4}$ flight-swim ($2.5\text{ m/s}$ hike). | Walk, teleport, fly, and slide around boulders; lean head into rock for Passthrough; climb cliffs & trees; watch footprints fade over $30\text{ s}$; hold breath to dive & fly-swim underwater at $2.5\text{ m/s}$ or breathe to float up. | `teleport_v0_mps`, `climb_standoff_m`, `passthrough_fade_cm`, `footstep_fade_sec`, `mic_breath_threshold_dbfs` |
| **Stage 2** | **Tier 1: Bedrock** | **Global Terrain Streaming, Cryosphere, 5 Biomes, Navigable Obstacles & Giant-Mode Globe:** `WebWorker` AWS Terrarium tiles, local rock geology colors, elevation/latitude lapse rate (snow, glacier ice, walkable frozen lakes), 5 biomes, $\ge 2.2\text{ m}$ obstacle corridors, Wristwatch UI & `A`-button Giant Mode 3D Earth Globe with pins. | Press `A` for Giant Mode, walk around Earth Globe, drop pins on all 7 continents & alpine peaks; shrink into each biome to walk on frozen water, desert dunes, and dense forests ($\ge 2.2\text{ m}$ gaps). | `min_obstacle_clearance_m`, `max_packing_fraction`, `snowline_temp_offset_c`, `globe_scale` |
| **Stage 3** | **Tier 2: Ecosystem** | **Tactile Trail Physics — Rocks, Pinecones, Water Skipping & Collectible Arrowheads:** Joystick pull-back (`< -0.5`) pickup for rocks/pinecones, throwing/catching, water skipping, and 1-of-1 procedural trail arrowheads with sunlight/headlamp **flint glint**, $1.5\times$ post-rain washout boost, $1:1$ hand inspection & Wristwatch Velvet Display Case. | Pull back joystick to grab rocks/pinecones and skip flat stones across lakes; hunt trails/streambeds for the flint glint of unique arrowheads, inspect at $1:1$ scale, and stow in Display Case. | `throw_velocity_scale`, `skip_max_pitch_deg`, `artifact_trail_spawn_density`, `flint_glint_intensity` |
| **Stage 4** | **Tier 2: Ecosystem** | **Prehistoric Megaflora, 60+ Global Megafauna, Predator Linger/Startle & Speed Tells:** 14+ megaflora, 60+ non-dinosaur megafauna + giant fish/sharks underwater, 3-tier LOD + impostors, $45\text{ s}$ predator linger ($\ge 35\text{ m}$), unobserved predator startle, and speed tells (birds $>4\text{ m/s}$ for $>5\text{ s}$; vultures $<0.5\text{ m/s}$ for $30\text{ s}$ or $0\text{ s}$ on passthrough; curious herbivores). | Hike & dive across continents to observe Mammoths, *Paraceratherium*, *Smilodon*, *Cave Lions*, *Dire Wolves*, *Titanoboa*, and *Megalodon*; test $45\text{ s}$ predator linger, bird flush, vulture swirl, and curious herbivores. | `predator_linger_sec`, `predator_safe_dist_m`, `vulture_speed_threshold_mps`, `herbivore_los_radius_m` |
| **Stage 5** | **Tier 2: Ecosystem** | **Camera Reticle, Auto-Zoom, Selfie Flip, WebP Capture & Wristwatch Field Guide:** Side-grip hold ($<5\text{ s}$ Thumbs-Up vs. $\ge 5\text{ s}$ Camera), auto-zoom framing, `A`-button $180^\circ$ Selfie Flip, `OffscreenCanvas` WebP storage in `IndexedDB`, first-time animal taxonomy cards + Globe pins vs. GPS/date logging for non-official subjects. | Hold side-grip $\ge 5\text{ s}$ to raise camera, auto-zoom on megafauna, snap discovery photos, and scroll Wristwatch Field Guide; press `A` with camera up for a selfie; photograph scenic wonders. | `auto_zoom_framing_fill`, `auto_zoom_lerp_speed`, `webp_quality`, `reticle_fov_deg` |
| **Stage 6** | **Tier 2: Ecosystem** | **Dynamic Weather, Natural Wonders, Night Phenomena, Headlamps & Soundscape:** Sunrises/sunsets, fog, storms $\rightarrow$ rainbows ($+1.5\times$ arrowhead glint), mammatus clouds, volcanoes, waterfalls, tornadoes, comets, eclipses, meteor showers, Auroras, `B`-button Headlamp + **Owner Secret IR Thermal**, 8-voice procedural soundscape & shared soundtrack toggle. | Preview fog, storm-to-rainbow, tornado, volcano, eclipse, and night aurora + meteor shower; toggle `B`-button standard headlamp & Secret Owner IR Thermal vision in dark/foggy woods; test audio & soundtrack. | `fog_density`, `ir_thermal_occlusion_m`, `ambient_soundscape_gain`, `phenomena_hourly_rate` |
| **Stage 7** | **Tier 3: Multiplayer** | **4-Player WebRTC Multiplayer, Sky-Titan Projection, Gifting & Collective Novelty:** Deterministic seed P2P sync ($<3\text{ KB/s}$), independent/shared hikes, click-to-join on Giant Globe, **Sky-Titan** horizon projection of Giant players, hand-to-hand arrowhead gifting, group selfies & Collective Unseen Novelty Multiplier ($1.0\text{--}3.5\times$). | Connect 2–4 players (or test bots), watch a Giant friend tower as a Sky-Titan on the horizon, click their globe pin to join, gift a 1-of-1 arrowhead hand-to-hand, and snap a group selfie. | `collective_novelty_max_mult`, `sky_titan_opacity`, `webrtc_sync_hz` |
| **Stage 8** | **Tier 3: Cherry on Top** | **Competitive Photo Hide-and-Seek, UFO/Bigfoot Easter Eggs & Secret Gemini AI Live Notes:** Wristwatch ready-up $\rightarrow$ $5\text{ s}$ countdown $\rightarrow$ $250\text{ m}$ dispersion, $5\text{ m/s}$ cap ($1.25\text{ m/s}$ underwater swim), permanent camera ($3\text{ s}$ recharge), `A`-button $1\times/2\times/4\times/8\times$ zoom, `B`-button faint ground glow + Owner IR, $360^\circ$ head capture, $10\text{ m}$ increments, $15\text{ s}$ score delay, Remaining Points ($120 \rightarrow 0$), rare **UFO & Bigfoot**, and **Owner Secret `A`-Hold ($\ge 3\text{ s}$) Muted-Mic Dictation / Gemini AI Ultra Live**. | Play a full $\approx 6\text{-min}$ Hide-and-Seek match (with friends or Monte Carlo bots) using tree climbs, $<30\text{ s}$ footsteps, underwater hiding, and $8\times$ zoom; photograph Bigfoot/UFO; hold `A` $\ge 3\text{ s}$ for private Gemini AI Live / Voice Notes. | `match_duration_sec`, `dispersion_radius_m`, `shutter_cooldown_sec`, `score_delay_sec`, `drought_herbivore_sec` |
