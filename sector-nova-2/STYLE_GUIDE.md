# SECTOR NOVA 2 — Style Guide

This guide exists so that future contributors (including other AIs such as Codex) can
extend the game **without breaking the established look and feel**. Read this before
adding new enemies, weapons, bosses, or effects.

The single most important rule: **new content must blend in with what already exists.**
Match the existing size, color, and particle vocabulary rather than introducing a new one.

SECTOR NOVA 2 inherits the SECTOR NOVA 1 visual rules unchanged (sections 1–6). Section 7
lists what the sequel adds; it is being extended phase by phase (see `DESIGN.md` 16).

---

## 1. Core Visual Identity

- **SFC / Super Famicom-era aesthetic.** Low resolution, chunky shapes, punchy colors.
- **Internal resolution is fixed at 320 × 480** (`CANVAS_WIDTH` × `CANVAS_HEIGHT`). The
  canvas is scaled up with `image-rendering: pixelated` for a crisp pixel look. Design
  for this small space — keep sprites small and readable.
- **Canvas drawing only.** Everything is drawn procedurally with the Canvas 2D API
  (`fillRect`, `arc`, `moveTo/lineTo` polygons, radial gradients).
- **No image assets.** Do not add PNG/JPG/SVG/spritesheets or external fonts. The only
  font used is the built-in monospace (`'... px monospace'`).
- **No external libraries.** Plain ES6 classes loaded via `<script>` tags in
  dependency order (see `index.html`).
- **No audio files.** Every sound is generated with the Web Audio API (`src/audio.js`).

## 2. Color Palette

All colors live in the `COLORS` object in `src/utils.js`. **Reuse existing entries**
where possible; if a new color is truly needed, add it there (don't inline hex codes
scattered across files).

- **Background:** black to dark navy space. `BG_DARK (#0a0a1a)`, `BG_NEBULA (#0d0d2b)`,
  with subtle parallax stars (`STAR_DIM`, `STAR_BRIGHT`, `STAR_WHITE`) and faint nebula clouds.
- **Accents (use these as the highlight language):**
  - **Bright blue** — the player & player bullets (`PLAYER_BODY #3399ff`, `PLAYER_BULLET #66eeff`).
  - **Yellow** — UI highlights, cores, score (`UI_YELLOW #ffdd44`).
  - **Red** — danger, enemy bullets, enrage, lives (`UI_RED`, `ENEMY_BULLET`).
  - **Green** — success / defensive shield / "stage clear" (`UI_GREEN`, `ITEM_SHIELD`).
- **Per-role tints already defined:** enemies A/B/C, the SECTOR NOVA 1 enemy types
  (`ENEMY_SHIELD/SPLIT/FORM/RUSH/TURRET`), weapons (`SPREAD_*`, `RAIL_*`, `CHAIN_*`, `HOMING_*`),
  items (`ITEM_*`, see below), and bosses.

Items (SECTOR NOVA 2) — **color and shape** both identify an item:

| Color | Shape | Item | Token |
|---|---|---|---|
| Orange | orb + "S" | SPREAD FAN | `ITEM_SPREAD` |
| Blue | orb + "R" | RAIL LANCER | `ITEM_RAIL` |
| Purple | orb + "C" | CHAIN BOLT | `ITEM_CHAIN` |
| Green | orb + "H" | HOMING NEEDLE | `ITEM_HOMING` |
| White | ring | OPTION | `ITEM_OPTION` |
| Cyan | hexagon | REFLECT SHIELD | `ITEM_REFLECT` |
| Yellow | cross | REPAIR | `ITEM_REPAIR` |
| Pink | heart | HULL UP | `ITEM_HULL` |
| Gold | small star | STAR CHIP | `ITEM_STAR` |
| Rainbow (cycles) | large diamond | NOVA CRYSTAL | `CRYSTAL_HUES` |

Only the four orbs change the weapon. REFLECT SHIELD must not prevent firing. Recovery
items (REPAIR, HULL UP) must not change the weapon, shield, or options.

Player weapon colors follow the item that grants them: SPREAD orange (`SPREAD_BULLET`),
RAIL blue-cyan beams (`RAIL_BODY/GLOW`), CHAIN purple fading to white (`CHAIN_BODY/GLOW`,
zigzag lightning), HOMING green needles (`HOMING_BODY/GLOW`). NORMAL stays cyan. Options are
pale white-blue (`OPTION_BODY/GLOW`). NOVA BURST is white to gold (`BURST_RING`, `BURST_GLOW`),
graze sparks are pale cyan (`GRAZE_SPARK`), and the NOVA gauge is gold (`GAUGE_*`).

Keep saturation high and values bright against the dark background. Avoid pastel,
grayscale, or photo-realistic gradients.

### Stage palettes (SECTOR NOVA 2)

The journey toward HELIOS is told through color: **cold blue → gray → purple → red →
burning orange → white and gold**. Each stage has a token group in `COLORS`. `*_BG_TOP` /
`*_BG_BOTTOM` tint the backdrop gradient (`src/background.js`); every other entry is an
**accent only** — the backdrop stays a dark space by default.

| Stage | Name | Tokens | Role |
|---|---|---|---|
| S1 | FROST RING | `FROST_BG_TOP #0c1c36`, `FROST_BG_BOTTOM #050a18`, `FROST_ACCENT #88ddff`, `FROST_LIGHT #e8f8ff` | icy blue / white |
| S2 | DEAD HARBOR | `HARBOR_BG_TOP #151b24`, `HARBOR_BG_BOTTOM #08090e`, `HARBOR_ACCENT #7a8ca3`, `HARBOR_WARN #ffcc22` | iron gray-blue, yellow warning lights |
| S3 | STORM VEIL | `STORM_BG_TOP #1d1829`, `STORM_BG_BOTTOM #0a0912`, `STORM_ACCENT #9a88bb`, `STORM_BOLT #f4f0ff` | violet gray, lightning white |
| S4 | ECLIPSE HIVE | `HIVE_BG_TOP #2a0a1e`, `HIVE_BG_BOTTOM #10040c`, `HIVE_ACCENT #aa3366`, `HIVE_VEIN #661a3d` | dark red-violet, organic |
| S5 | CORONA ZONE | `CORONA_BG_TOP #3b0f08`, `CORONA_BG_BOTTOM #160503`, `CORONA_ACCENT #ff6622`, `CORONA_FLARE #ffaa33` | red / orange |
| S6 | HELIOS CORE | `HELIOS_BG_TOP #3d3315`, `HELIOS_BG_BOTTOM #14100a`, `HELIOS_ACCENT #ffe688`, `HELIOS_CORE #fffbe6` | white / gold |

S5 and S6 become bright in Phase 5. **Enemy bullets and the player must never sink into
a bright background** — check readability first and add a dark outline to bullets if needed.

### Bullet and hazard colors (SECTOR NOVA 2)

| Kind | Tokens | Notes |
|---|---|---|
| Enemy bullet | `ENEMY_BULLET`, `ENEMY_BULLET_GLOW` | red, as in SECTOR NOVA 1 |
| Boss bullet | `BOSS_BULLET`, `BOSS_BULLET_GLOW` | orange, as in SECTOR NOVA 1 |
| Revenge bullet | `REVENGE_BULLET #ff77cc`, `REVENGE_BULLET_GLOW` | pink, slow (death bursts) |
| Reflected bullet | `REFLECT_BULLET #aaf4ff`, `REFLECT_BULLET_GLOW` | cyan-white (REFLECT SHIELD / MIRROR) |
| Hazard warning | `HAZARD_WARN #ff4444` | thin blinking guide, never filled |
| Hazard strike | `HAZARD_GLOW #ffaa55`, `HAZARD_CORE #ffffff` | glow band + white core |

Title / menu: `TITLE_SUBTITLE #ffcc66` (the gold "ECLIPSE"), `MENU_DISABLED #3a4450`
(locked rows such as BOSS RUSH "???").

## 3. UI

- **All UI is drawn inside the canvas** — no HTML/DOM overlays, no CSS-styled HUD.
- Monospace font, small sizes (`7px`–`12px` for HUD, up to `~30px` for titles).
- In-game text is English.
- HUD layout (`src/hud.js`, DESIGN.md 15-4): lives top-left, score top-center, stage
  top-right, boss name + HP bar under the top bar, weapon panel bottom-left. The NOVA
  gauge goes bottom-right and the LYRA comm window along the bottom (later phases).
- Menus and full-screen overlays live in `src/menu.js`. The title menu uses a `>`
  cursor with the selected row in yellow, other rows in `UI_BLUE`, locked rows in
  `MENU_DISABLED`; changeable values show `< VALUE >` while selected.
- Use `ctx.save()/restore()` around any state changes (alpha, font, alignment).
- Blinking prompts use `Math.floor(frame / 30) % 2`.

## 4. Sprites — Size & Shape Language

Drawn with simple polygons + circles, centered via `ctx.translate(x, y)`.

- **Player ship (NOVA-II):** ~24 px wide, slimmer and sharper than SECTOR NOVA 1: needle nose,
  thin swept wings, **twin engines** with orange/yellow flames, cyan cockpit, blue `PLAYER_*` colors.
  Small hit radius (`PLAYER_HIT_RADIUS = 6`) relative to the visual. Options are ~10 px arrowheads.
- **Enemies:** radius roughly **7–14 px**. Each type has a distinct silhouette
  (diamond, winged oval, ringed circle, arrowhead, spiky hexagon, turret) and a
  light "eye/core" detail. New enemies should stay in this size band and follow the
  same body + dark-inner + bright-core layering.
- **Bullets:** small glowing circles (player ~3 px cyan, enemy ~3 px red, boss ~4 px
  orange) with a translucent glow halo and a 1–2 px white center. Special weapons keep
  the glow-halo + bright-core idea (laser = thin bright beam, flame = small red/orange glow).
- **Bosses:** ~40 px radius, layered armor plates + rotating elements + a pulsing core,
  with an enrage state. In SECTOR NOVA 2 **every boss has its own silhouette** (no
  palette swaps); keep the armor + rotating parts + pulsing core vocabulary.

## 5. Effects & Animation

- **Particles** (`src/effects.js`): explosions, hit sparks, pickups, big boss death.
  Reuse `EffectsManager` (`explode`, `bigExplode`, `hitSpark`, `powerupPickup`) instead
  of writing bespoke particle code. Particle colors come from the explosion palette
  (`EXPLOSION_INNER/MID/OUTER`) — white-hot center fading to orange/red.
- **Motion** is frame-based (60 fps assumed); animate with `this.frame++` and
  `Math.sin(frame * speed)` for pulsing/twinkling/flicker. Keep pulses subtle (±10–20%).
- **Glow** is faked with a larger, low-`globalAlpha` shape behind the solid shape.
- Always reset `globalAlpha` back to `1` after use.

## 6. Checklist When Adding Content

- [ ] Drawn purely with Canvas 2D — no images, no DOM.
- [ ] Colors taken from / added to `COLORS` in `utils.js`, matching the accent language.
- [ ] Sprite size fits the existing band (enemies ~7–14 px, bullets ~3–4 px, boss ~40 px).
- [ ] Uses `EffectsManager` for explosions/sparks rather than new particle systems.
- [ ] Tunable constants added to `utils.js` (don't hardcode magic numbers in logic).
- [ ] Looks at home next to the current player, enemies, bullets, and explosions.
- [ ] Hostile bullets are created through `Patterns` (`src/patterns.js`), never with `new` directly.
- [ ] Anything dangerous that is not a bullet is a `Hazard` with a warning of at least 40 frames.

## 7. SECTOR NOVA 2 Additions (in progress)

- **Draw order** (`Game.drawGameplay`): background → items → enemies → boss → hazards →
  options → REFLECT SHIELD → player → player bullets → **hostile bullets** → effects → HUD. Hostile bullets are
  always drawn above clouds, darkness, and bright backdrops — never hide them.
- **Telegraphs:** lasers, lightning, flares, falling ice, etc. use `Hazard`: a thin blinking
  `HAZARD_WARN` guide first (harmless), then a `HAZARD_GLOW` band with a white core.
- **Background shimmer** (S5) moves only the background, never the player, enemies, or bullets.
- **Bosses** extend `BossBase` (`src/boss.js`), one file each in `src/bosses/`. Form changes
  clear hostile bullets and show the form name; defeat = shaking explosions → big explosion
  → 2 s calm.
