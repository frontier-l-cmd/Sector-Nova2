// ============================================================
// SECTOR NOVA 2 - Utils & Constants
// ------------------------------------------------------------
// Every tunable number lives here so balance can be adjusted
// without touching game logic (DESIGN.md section 0).
// ============================================================

// --- Debug ---
// Master switch for development-only helpers (debug hotkeys, the
// timeline clock in the HUD, the window.game handle). Set to false
// before shipping a release build.
const DEBUG_MODE = true;

// --- Canvas ---
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const FPS = 60; // the game is frame-based and assumes 60 fps

// --- Colors ---
const COLORS = {
  BG_DARK: '#0a0a1a',
  BG_NEBULA: '#0d0d2b',
  STAR_DIM: '#555577',
  STAR_BRIGHT: '#aaaadd',
  STAR_WHITE: '#ffffff',
  PLAYER_BODY: '#3399ff',
  PLAYER_WING: '#2266cc',
  PLAYER_ENGINE: '#ff6633',
  PLAYER_COCKPIT: '#66ccff',
  PLAYER_BULLET: '#66eeff',
  PLAYER_BULLET_GLOW: '#33aacc',
  ENEMY_A: '#cc3333',
  ENEMY_A_DARK: '#881111',
  ENEMY_B: '#33cc66',
  ENEMY_B_DARK: '#118833',
  ENEMY_C: '#cc66ff',
  ENEMY_C_DARK: '#8833aa',
  ENEMY_BULLET: '#ff4466',
  ENEMY_BULLET_GLOW: '#cc2244',
  BOSS_CORE: '#ff3366',
  BOSS_ARMOR: '#6644aa',
  BOSS_ARMOR_DARK: '#442277',
  BOSS_GLOW: '#ff66aa',
  BOSS_BULLET: '#ffaa33',
  BOSS_BULLET_GLOW: '#cc7711',
  EXPLOSION_INNER: '#ffffff',
  EXPLOSION_MID: '#ffaa33',
  EXPLOSION_OUTER: '#ff4411',
  HIT_FLASH: '#ffffff',
  UI_WHITE: '#ffffff',
  UI_BLUE: '#88bbff',
  UI_YELLOW: '#ffdd44',
  UI_RED: '#ff4444',
  UI_GREEN: '#44ff88',
  UI_DIM: '#667788',
  // --- Items (DESIGN.md 10): color + shape tell them apart ---
  ITEM_SPREAD: '#ff9933',      // orange orb "S"
  ITEM_RAIL: '#44aaff',        // blue orb "R"
  ITEM_CHAIN: '#bb66ff',       // purple orb "C"
  ITEM_HOMING: '#44ee88',      // green orb "H"
  ITEM_OPTION: '#ffffff',      // white ring
  ITEM_REFLECT: '#66eeff',     // cyan hexagon
  ITEM_REPAIR: '#ffdd44',      // yellow cross
  ITEM_HULL: '#ff66cc',        // pink heart
  ITEM_STAR: '#ffcc33',        // gold small star
  CRYSTAL_HUES: ['#ff5577', '#ffaa33', '#ffee55', '#55ff99', '#55ccff', '#aa77ff'], // NOVA CRYSTAL rainbow

  // --- Player weapons (glow halo + bright core) ---
  SPREAD_BULLET: '#ffbb66',
  SPREAD_BULLET_GLOW: '#ff7722',
  RAIL_BODY: '#66ddff',
  RAIL_GLOW: '#2299ff',
  CHAIN_BODY: '#cc88ff',
  CHAIN_GLOW: '#8833dd',
  HOMING_BODY: '#88ffbb',
  HOMING_GLOW: '#22aa66',
  OPTION_BODY: '#ddeeff',
  OPTION_GLOW: '#66aaff',

  // --- NOVA BURST / graze / gauge ---
  BURST_RING: '#fff6cc',
  BURST_GLOW: '#ffcc55',
  GRAZE_SPARK: '#cfefff',
  GAUGE_FILL: '#ffcc55',
  GAUGE_FULL: '#fff6cc',
  GAUGE_BG: '#2a2418',

  // SECTOR NOVA 1 enemy colors (provisional Stage 1 enemies)
  ENEMY_SHIELD: '#dddd55',
  ENEMY_SHIELD_DARK: '#888822',
  ENEMY_SHIELD_PLATE: '#bbbbcc',
  ENEMY_SPLIT: '#ff8844',
  ENEMY_SPLIT_DARK: '#aa5522',
  ENEMY_FORM: '#55ddcc',
  ENEMY_FORM_DARK: '#229988',
  ENEMY_RUSH: '#ff5599',
  ENEMY_RUSH_DARK: '#aa2266',
  ENEMY_TURRET: '#aa88cc',
  ENEMY_TURRET_DARK: '#664488',

  // --- SECTOR NOVA 2 small enemies: body / dark inner / bright core ---
  SHARD_BODY: '#9fe6ff', SHARD_DARK: '#3a7fa8', SHARD_CORE: '#ffffff',
  WISP_BODY: '#7fd8ff', WISP_DARK: '#2a6a9a', WISP_CORE: '#e8fbff',
  SNIPER_BODY: '#b8c4d8', SNIPER_DARK: '#4a5670', SNIPER_CORE: '#ff5566',
  MINE_LAYER_BODY: '#8fa0b4', MINE_LAYER_DARK: '#3c4656', MINE_LAYER_CORE: '#ffcc22',
  MINE_BODY: '#55606e', MINE_LIGHT: '#ff4433',
  GUN_DECK_BODY: '#7a8796', GUN_DECK_DARK: '#3a434e', GUN_DECK_CORE: '#ffcc22',
  CARRIER_BODY: '#8c96a8', CARRIER_DARK: '#434a5a', CARRIER_CORE: '#66ddff',
  DRONE_BODY: '#c8d2e0', DRONE_DARK: '#59657a', DRONE_CORE: '#ff7755',
  MIRROR_BODY: '#a28cd6', MIRROR_DARK: '#4b3a7a', MIRROR_SHIELD: '#e6f6ff',
  GHOST_BODY: '#c9b8ff', GHOST_DARK: '#5c4a99', GHOST_CORE: '#ffffff',
  SWARM_BODY: '#c4466e', SWARM_DARK: '#651c3a', SWARM_CORE: '#ffd0dd',
  FLARE_BODY: '#ff8833', FLARE_DARK: '#b83a10', FLARE_CORE: '#fff2b0',
  LINK_GUARD_BODY: '#9a4a8a', LINK_GUARD_DARK: '#4a1e44', LINK_GUARD_CORE: '#ff99ee',
  LINK_BEAM: '#ff99ee',
  HATCHLING_BODY: '#b03a64', HATCHLING_DARK: '#5a1630', HATCHLING_CORE: '#ffc0d8',
  GOLD_BODY: '#ffd34d', GOLD_DARK: '#a07818', GOLD_CORE: '#fffbe0',   // GOLD SHARD / GOLD GHOST

  // --- Bosses (Phase 4-1) ---
  SENTINEL_FROST: '#7fd0ff', SENTINEL_FROST_DARK: '#24597e', SENTINEL_FROST_CORE: '#e8fbff',
  GLACIER_ICE: '#bfe9ff', GLACIER_MID: '#7cc4ea', GLACIER_DARK: '#2f6f9e', GLACIER_DEEP: '#123352',
  GLACIER_CORE: '#8ff0ff', GLACIER_EYE: '#e8ffff',
  ICICLE_BODY: '#d8f4ff', ICICLE_SHADOW: '#0a2a4a',
  ASTEROID_BODY: '#8a96a8', ASTEROID_DARK: '#4a5262', ASTEROID_LIGHT: '#c8d2e0',
  COMM_BG: 'rgba(6, 14, 34, 0.85)', COMM_BORDER: '#5aa0d8', COMM_NAME: '#88ddff',
  WARNING_BAND: '#c81830', WARNING_STRIPE: '#ffcc22',

  // --- Stage 2 (Phase 4-2) ---
  SENTINEL_HARBOR: '#9aa8ba', SENTINEL_HARBOR_DARK: '#3a4452', SENTINEL_HARBOR_CORE: '#ffcc22',
  DOCK_BODY: '#7d8898', DOCK_DARK: '#363e4a', DOCK_PLATE: '#a9b4c2', DOCK_STRIPE: '#ffcc22',
  DOCK_CORE: '#ff7a3d', DOCK_CORE_HOT: '#ffe6b0', DOCK_MISSILE: '#d8dee8',
  WALL_BODY: '#4a5462', WALL_DARK: '#262d37', WALL_EDGE: '#8c99aa', WALL_STRIPE: '#ffcc22',
  WALL_PANEL_ODD: '#3fa89a', WALL_PANEL_ODD_LIGHT: '#a6f2e4',     // the NOVA CRYSTAL panel
  CAUTION_BAND: '#2a2410', CAUTION_STRIPE: '#ffcc22',
  FLOOR_LINE: '#222a35', FLOOR_RIVET: '#3a4554',

  // --- SECTOR NOVA 2: stage palettes ---
  // The journey runs cold blue -> gray -> purple -> red -> orange ->
  // white/gold as NOVA-II approaches HELIOS. BG_* tint the dark space
  // backdrop; the other entries are accents only.
  FROST_BG_TOP: '#0c1c36',      // S1 FROST RING
  FROST_BG_BOTTOM: '#050a18',
  FROST_ACCENT: '#88ddff',
  FROST_LIGHT: '#e8f8ff',
  HARBOR_BG_TOP: '#151b24',     // S2 DEAD HARBOR
  HARBOR_BG_BOTTOM: '#08090e',
  HARBOR_ACCENT: '#7a8ca3',
  HARBOR_WARN: '#ffcc22',
  STORM_BG_TOP: '#1d1829',      // S3 STORM VEIL
  STORM_BG_BOTTOM: '#0a0912',
  STORM_ACCENT: '#9a88bb',
  STORM_BOLT: '#f4f0ff',
  HIVE_BG_TOP: '#2a0a1e',       // S4 ECLIPSE HIVE
  HIVE_BG_BOTTOM: '#10040c',
  HIVE_ACCENT: '#aa3366',
  HIVE_VEIN: '#661a3d',
  CORONA_BG_TOP: '#3b0f08',     // S5 CORONA ZONE
  CORONA_BG_BOTTOM: '#160503',
  CORONA_ACCENT: '#ff6622',
  CORONA_FLARE: '#ffaa33',
  HELIOS_BG_TOP: '#3d3315',     // S6 HELIOS CORE
  HELIOS_BG_BOTTOM: '#14100a',
  HELIOS_ACCENT: '#ffe688',
  HELIOS_CORE: '#fffbe6',

  // --- SECTOR NOVA 2: hostile bullet variants (patterns.js) ---
  // Normal enemy bullets stay red and boss bullets orange (as in 1).
  REVENGE_BULLET: '#ff77cc',       // pink, slow death-burst bullets
  REVENGE_BULLET_GLOW: '#cc3399',
  REFLECT_BULLET: '#aaf4ff',       // cyan-white, REFLECT SHIELD / MIRROR
  REFLECT_BULLET_GLOW: '#55ccee',

  // --- SECTOR NOVA 2: telegraphed hazards (patterns.js Hazard) ---
  HAZARD_WARN: '#ff4444',
  HAZARD_GLOW: '#ffaa55',
  HAZARD_CORE: '#ffffff',

  // --- SECTOR NOVA 2: title / menu ---
  TITLE_SUBTITLE: '#ffcc66',       // "ECLIPSE" gold
  TEXT_SHADOW_GOLD: '#6a5418',     // fixed drop shadow under gold-themed titles
  MENU_DISABLED: '#3a4450',
};

// --- Player ---
const PLAYER_SPEED = 4;
const PLAYER_MAX_LIVES = 3;
const PLAYER_STAGE_MAX_LIVES = 5;
const PLAYER_BULLET_SPEED = 8;
const PLAYER_HIT_RADIUS = 6; // smaller than visual
const PLAYER_INVINCIBLE_FRAMES = 90; // 1.5 seconds at 60fps
const PLAYER_BLINK_INTERVAL = 4;
const PLAYER_ITEM_PICKUP_RADIUS = 8; // added to the hit radius for items

// --- Enemies (SECTOR NOVA 1 set, used by the provisional Stage 1) ---
const ENEMY_A_HP = 1;
const ENEMY_A_SCORE = 100;
const ENEMY_A_SPEED = 2;
const ENEMY_A_RADIUS = 10;

const ENEMY_B_HP = 2;
const ENEMY_B_SCORE = 200;
const ENEMY_B_SPEED = 1.5;
const ENEMY_B_RADIUS = 12;
const ENEMY_B_WAVE_AMP = 40;
const ENEMY_B_WAVE_FREQ = 0.03;

const ENEMY_C_HP = 3;
const ENEMY_C_SCORE = 300;
const ENEMY_C_SPEED = 1;
const ENEMY_C_RADIUS = 14;
const ENEMY_C_FIRE_INTERVAL = 120; // frames
const ENEMY_C_BULLET_SPEED = 2.5;

// --- SECTOR NOVA 2 small enemies (DESIGN.md 11) ---
// Common
const ENEMY_SPAWN_LEAVE_MARGIN = 30;      // removed this far outside the screen
const LINK_RANGE = 90;                    // LINK GUARD reaches enemies within this
const LINK_MAX_TARGETS = 2;
const SWARM_FORMATION_BONUS = 2000;       // whole SWARM formation destroyed
const MIRROR_FRONT_RAIL_CHAIN_SCALE = 0.25;
const MIRROR_REFLECT_SPEED = 1.8;         // NORMAL / SPREAD shots bounced back

// SHARD: straight (or diagonal) diver
const SHARD_HP = 1;
const SHARD_SCORE = 100;
const SHARD_SPEED = 2.2;
const SHARD_RADIUS = 8;

// WISP: sine-wave drifter, groups share one wave
const WISP_HP = 2;
const WISP_SCORE = 150;
const WISP_SPEED = 1.4;
const WISP_RADIUS = 9;
const WISP_WAVE_AMP = 44;
const WISP_WAVE_FREQ = 0.035;

// SNIPER: parks near the top, single aimed shots with a charge glow
const SNIPER_HP = 3;
const SNIPER_SCORE = 300;
const SNIPER_RADIUS = 10;
const SNIPER_ENTRY_SPEED = 1.5;
const SNIPER_STOP_Y = 70;
const SNIPER_FIRE_INTERVAL = 100;
const SNIPER_CHARGE_FRAMES = 45;          // core glows this long before a shot
const SNIPER_BULLET_SPEED = 3.0;
const SNIPER_STAY_FRAMES = 6 * 60;        // then it leaves upward
const SNIPER_LEAVE_SPEED = 1.2;

// MINE LAYER: crosses sideways laying mines
const MINE_LAYER_HP = 4;
const MINE_LAYER_SCORE = 300;
const MINE_LAYER_RADIUS = 12;
const MINE_LAYER_SPEED = 1.1;
const MINE_LAYER_Y = 110;                 // default lane when the timeline gives none
const MINE_LAYER_DROP_INTERVAL = 70;
const MINE_HP = 1;
const MINE_SCORE = 30;
const MINE_RADIUS = 7;
const MINE_FUSE = 120;                    // frames until it bursts
const MINE_RING_COUNT = 8;
const MINE_RING_SPEED = 1.8;
const MINE_DRIFT = 0.3;

// GUN DECK: ground turret scrolling with the floor, aimed 3-way
const GUN_DECK_HP = 4;
const GUN_DECK_SCORE = 250;
const GUN_DECK_RADIUS = 11;
const GUN_DECK_SCROLL = 0.8;              // moves with the background
const GUN_DECK_FIRE_INTERVAL = 110;
const GUN_DECK_BULLET_SPEED = 2.2;
const GUN_DECK_SPREAD = 0.25;

// CARRIER: slow mothership that releases DRONEs
const CARRIER_HP = 10;
const CARRIER_SCORE = 800;
const CARRIER_RADIUS = 14;
const CARRIER_SPEED = 0.45;
const CARRIER_SPAWN_INTERVAL = 90;
const CARRIER_SPAWN_COUNT = 2;
const DRONE_HP = 1;
const DRONE_SCORE = 50;
const DRONE_RADIUS = 7;
const DRONE_SPEED = 1.1;
const DRONE_TURN = 0.04;                  // radians per frame toward the ship
const DRONE_HOMING_FRAMES = 5 * 60;       // then it flies straight on

// MIRROR: reflects frontal NORMAL / SPREAD shots
const MIRROR_HP = 4;
const MIRROR_SCORE = 400;
const MIRROR_RADIUS = 12;
const MIRROR_SPEED = 0.9;

// PHASE GHOST: visible 90f / gone 60f, ripples before it appears
const PHASE_GHOST_HP = 3;
const PHASE_GHOST_SCORE = 400;
const PHASE_GHOST_RADIUS = 11;
const PHASE_GHOST_SPEED = 0.7;
const PHASE_GHOST_VISIBLE = 90;
const PHASE_GHOST_HIDDEN = 60;
const PHASE_GHOST_RIPPLE = 40;            // warning shimmer before (re)appearing

// SWARM: fast V formation
const SWARM_HP = 1;
const SWARM_SCORE = 80;
const SWARM_RADIUS = 7;
const SWARM_SPEED = 3.4;

// FLARE SPIRIT: wandering flame, slow 6-way burst when destroyed
const FLARE_SPIRIT_HP = 3;
const FLARE_SPIRIT_SCORE = 350;
const FLARE_SPIRIT_RADIUS = 10;
const FLARE_SPIRIT_SPEED = 0.8;
const FLARE_SPIRIT_BURST = 6;

// LINK GUARD: links up to 2 nearby enemies; linked enemies take no damage
const LINK_GUARD_HP = 5;
const LINK_GUARD_SCORE = 500;
const LINK_GUARD_RADIUS = 12;
const LINK_GUARD_SPEED = 0.6;

// HATCHLING (HIVE MOTHER eggs): SWARM type x3 or a strong WISP x1
const HATCHLING_HP = 1;
const HATCHLING_SCORE = 60;
const HATCHLING_RADIUS = 7;
const HATCHLING_SPEED = 2.6;
const HATCHLING_WISP_HP = 3;
const HATCHLING_WISP_SCORE = 200;

// --- Boss framework (boss.js) ---
const BOSS_SPEED = 1;
const BOSS_RADIUS = 40;
const BOSS_ENRAGE_HP_THRESHOLD = 0.5;      // HP ratio at which a boss enrages
const BOSS_BULLET_SPEED = 3;
const BOSS_ENTRY_LERP = 0.03;              // entry glide factor per frame
const BOSS_DEATH_FRAMES = 90;              // shaking + small explosions
const BOSS_DEATH_EXPLODE_INTERVAL = 8;
const BOSS_AFTERGLOW_FRAMES = 120;         // 2s calm after the big explosion
const BOSS_PHASE_TRANSITION_FRAMES = 120;  // 2s form-change presentation
const BOSS_DEFEAT_SCORE = 5000;
const BOSS_HIT_SCORE = 10;                 // per player hit on a boss

// ORB CORE: SECTOR NOVA 1's Stage 1 boss rebuilt on BossBase (Phase 1).
const ORB_CORE_HP = 80;
const ORB_CORE_FIRE_INTERVAL = 85;
const ORB_CORE_FIRE_INTERVAL_ENRAGED = 60;
const ORB_CORE_BULLET_SPEED_SCALE = 0.85;
const ORB_CORE_ENRAGED_SPEED_BONUS = 0.5;  // added to BOSS_BULLET_SPEED
const ORB_CORE_SPREAD = 0.3;               // radians between 3-way shots
const ORB_CORE_SPREAD_ENRAGED = 0.4;
const ORB_CORE_ENRAGED_MOVE_SCALE = 1.5;
const ORB_CORE_ARMOR_SPIN = 0.02;          // radians per frame

// --- Boss damage soft cap (DESIGN.md 14) ---
// Damage a boss takes beyond its per-second cap counts only half.
// Each boss sets its own cap (damageCap in its definition).
const BOSS_DAMAGE_CAP_WINDOW = 60;         // frames (1 second)
const BOSS_DAMAGE_OVER_CAP_RATE = 0.5;
const BOSS_ESCAPE_SPEED = 2;               // mid-boss flying away

// SENTINEL: mid-boss of S1-S5 (DESIGN.md 14), colored per stage
const SENTINEL_HP_BASE = 60;               // S1; +15 per later stage
const SENTINEL_HP_PER_STAGE = 15;
const SENTINEL_DAMAGE_CAP = 8;             // decided (DESIGN.md 14)
const SENTINEL_SCORE = 3000;
const SENTINEL_RADIUS = 24;
const SENTINEL_TARGET_Y = 90;
const SENTINEL_ESCAPE_FRAMES = 25 * 60;    // flees if not beaten in 25s
const SENTINEL_CHARGE_FRAMES = 30;         // core swells before every shot (telegraph)
const SENTINEL_FIRE_INTERVAL = 80;          // shot to shot, charge included
const SENTINEL_FIRE_INTERVAL_ENRAGED = 58;
const SENTINEL_FAN_COUNT = 5;
const SENTINEL_FAN_STEP = 0.22;
const SENTINEL_FAN_SPEED = 2.4;
const SENTINEL_RING_COUNT = 12;
const SENTINEL_RING_SPEED = 1.8;
const SENTINEL_DEATH_FRAMES = 50;
const SENTINEL_AFTERGLOW_FRAMES = 30;

// GLACIER MAW: S1 boss (DESIGN.md 14)
const GLACIER_MAW_HP = 200;                // NORMAL ~45s / max loadout >= 15s (README)
const GLACIER_MAW_DAMAGE_CAP = 8;          // decided (DESIGN.md 14), just above NORMAL
const GLACIER_MAW_SCORE = 10000;
const GLACIER_MAW_RADIUS = 40;
const GLACIER_MAW_TARGET_Y = 78;
const GLACIER_MAW_CYCLE = 6 * 60;          // jaw cycle
const GLACIER_MAW_OPEN = 3 * 60;           // open part of the cycle
const GLACIER_MAW_OPEN_ENRAGED = 4 * 60;
const GLACIER_MAW_JAW_MOVE = 20;           // frames to open / close (visible warning)
const GLACIER_MAW_CLOSED_DAMAGE = 0.2;     // hitting the jaws
const GLACIER_MAW_FAN_COUNT = 5;
const GLACIER_MAW_FAN_STEP = 0.24;
const GLACIER_MAW_FAN_SPEED = 2.3;
const GLACIER_MAW_FAN_REPEAT = 18;         // enraged: second volley this much later
const GLACIER_MAW_FAN_WARN = 30;           // core flashes before the mid-open fan
const GLACIER_MAW_SWAY = 40;               // px of slow side-to-side drift
const GLACIER_MAW_ICICLE_INTERVAL = 150;
const GLACIER_MAW_ICICLE_INTERVAL_ENRAGED = 95;
const ICICLE_HP = 2;
const ICICLE_SCORE = 100;
const ICICLE_RADIUS = 7;
const ICICLE_WARN_FRAMES = 40;             // shadow before it drops
const ICICLE_SPEED = 4.5;
const ICICLE_STAR_CHIP_CHANCE = 0.3;

// DOCK TITAN: S2 boss (DESIGN.md 14). Core + two arm turrets.
const DOCK_TITAN_HP = 200;                 // core (see README for the kill-time measurement)
const DOCK_TITAN_ARM_HP = 60;
const DOCK_TITAN_ARM_BONUS = 10000;        // part-break bonus per arm
const DOCK_TITAN_DAMAGE_CAP = 8;           // decided (DESIGN.md 14)
const DOCK_TITAN_SCORE = 15000;
const DOCK_TITAN_RADIUS = 18;              // core hit radius
const DOCK_TITAN_ARM_X = 48;               // arm offset from the core
const DOCK_TITAN_ARM_RADIUS = 16;
const DOCK_TITAN_TARGET_Y = 82;
const DOCK_TITAN_ARMED_DAMAGE = 0.3;       // core damage while an arm is left
const DOCK_TITAN_SWAY = 60;                // px of side-to-side movement
const DOCK_TITAN_SWAY_SPEED = 0.006;       // radians per frame (arms phase)
const DOCK_TITAN_SWAY_SPEED_CORE = 0.01;   // core phase
const DOCK_TITAN_SWAY_SPEED_ENRAGED = 0.018;
const DOCK_TITAN_CHARGE = 30;              // telegraph before every attack
const DOCK_TITAN_ARM_REST = 60;            // after an arm volley (widened for the S2 fire guideline)
const DOCK_TITAN_FAN_COUNT = 3;
const DOCK_TITAN_FAN_STEP = 0.25;
const DOCK_TITAN_FAN_SPEED = 2.4;
const DOCK_TITAN_MISSILES = 4;
const DOCK_TITAN_MISSILES_ENRAGED = 6;
const DOCK_TITAN_MISSILE_REST = 100;
const DOCK_TITAN_RING_COUNT = 12;
const DOCK_TITAN_RING_SPEED = 1.9;
const DOCK_TITAN_RING_REST = 110;
const TITAN_MISSILE_HP = 1;
const TITAN_MISSILE_SCORE = 50;
const TITAN_MISSILE_RADIUS = 5;
const TITAN_MISSILE_SPEED = 1.5;
const TITAN_MISSILE_TURN = 0.03;           // radians per frame (slow homing)
const TITAN_MISSILE_LIFE = 6 * 60;
const TITAN_ARM_HP = 8;                    // the broken arm, falling
const TITAN_ARM_SCORE = 1000;
const TITAN_ARM_WARN_FRAMES = 40;          // shadow lane before it drops
const TITAN_ARM_FALL_SPEED = 0.8;

// --- Stage gimmicks (gimmicks.js) ---
// S1 giant asteroid: shoot it, its fragments hit enemies only
const ASTEROID_HP = 12;
const ASTEROID_SCORE = 500;
const ASTEROID_RADIUS = 28;
const ASTEROID_SPEED = 0.7;
const ASTEROID_FRAGMENTS = 5;
const ASTEROID_FRAGMENT_DAMAGE = 3;
const ASTEROID_FRAGMENT_SPEED = 3.2;
const ASTEROID_FRAGMENT_LIFE = 70;

// S2 narrow passage: walls scroll in with the floor
const PASSAGE_MIN_GAP = 140;               // the passage is never narrower
const PASSAGE_SCROLL = GUN_DECK_SCROLL;    // same speed as the floor and GUN DECKs
const PASSAGE_CAUTION_FRAMES = 180;        // CAUTION before the walls reach the screen
const PASSAGE_PUSHBACK = 10;               // px the ship is pushed back from a wall
const WALL_PANEL_HP = 6;
const WALL_PANEL_SCORE = 1000;
const WALL_PANEL_RADIUS = 10;

// --- NOVA CRYSTAL conditions ---
const GOLD_SHARD_WINDOW = 5 * 60;          // S1: destroy within 5s of appearing

// --- LYRA comm window (story.js) ---
const COMM_CHARS_PER_FRAME = 0.5;          // typing speed
const COMM_HOLD_FRAMES = 150;              // stays after the text is complete
const STAGE_INTRO_FRAMES = 150;

// --- Stage result / rank (DESIGN.md 15-6) ---
const RANK_HIT_POINTS = [40, 25, 10];       // 0 / 1 / 2 hits, 3+ = 0
const RANK_TIME_POINTS = [30, 15];          // within lower / upper expected time
const RANK_COMBO_POINTS = [[50, 30], [25, 20], [10, 10]];
const RANKS = [['S', 90, 50000], ['A', 70, 30000], ['B', 45, 10000], ['C', 0, 0]];
const RESULT_RANK_FRAME = 70;               // the rank appears after the rows
const RESULT_INPUT_DELAY = 90;              // frames before ENTER is accepted (rank shown first)

// --- Bullet patterns & hazards (patterns.js) ---
const ENEMY_BULLET_MAX_SPEED = 4.0;        // cap at NORMAL difficulty
const REVENGE_BULLET_SPEED = 1.6;
const HAZARD_MIN_WARN_FRAMES = 40;         // every danger is telegraphed >= 40f
const HAZARD_DEFAULT_WARN_FRAMES = 60;
const HAZARD_DEFAULT_ACTIVE_FRAMES = 20;
const HAZARD_DEFAULT_WIDTH = 12;

// --- Timeline (timeline.js) ---
const TIMELINE_SPAWN_Y = -20;
const TIMELINE_X_POSITIONS = { left: 60, center: 160, right: 260 };
const TIMELINE_EDGE_MARGIN = 16;           // spawns are clamped inside this
const TIMELINE_RANDOM_X_MARGIN = 30;
const TIMELINE_SIDES_MARGIN = 30;          // 'sides' pattern x inset
const TIMELINE_DEFAULT_SPACING = 30;       // px between row / v / column members
const TIMELINE_V_DEPTH = 18;               // px each V rank trails the leader
const WARNING_FRAMES = 180;                // 3s WARNING before the boss

// --- Large text ---
// Big titles never move; their drop shadow sits at this fixed offset
// in the same font (STYLE_GUIDE.md 3).
const TEXT_SHADOW_OFFSET = 2;

// --- Game States ---
const STATE = {
  TITLE: 'title',
  OPENING: 'opening',         // LYRA's prologue before a NEW GAME
  STAGE_INTRO: 'stageintro',  // stage name + first comm, ~2.5s
  STAGE_RESULT: 'stageresult',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
};

// --- Difficulty (DESIGN.md 13) ---
// Selected on the title screen and saved. Applied in later phases:
// bullet speed / fire rate in patterns.js (Phase 3), the rest in Phase 6.
const DIFFICULTY_LEVELS = ['EASY', 'NORMAL', 'HARD'];
const DEFAULT_DIFFICULTY = 'NORMAL';
const DIFFICULTY_SETTINGS = {
  EASY:   { lives: 4, bulletSpeed: 0.8,  fireRate: 0.75, revenge: 0,   gaugeRate: 1.5, scoreRate: 0.5 },
  NORMAL: { lives: 3, bulletSpeed: 1.0,  fireRate: 1.0,  revenge: 1,   gaugeRate: 1.0, scoreRate: 1.0 },
  HARD:   { lives: 3, bulletSpeed: 1.15, fireRate: 1.3,  revenge: 1.5, gaugeRate: 1.0, scoreRate: 1.5 },
};

// --- Powerup ---
const POWERUP_DROP_CHANCE = 0.12; // chance on enemy kill (stages can override)
const STAGE2_ITEM_DROP_CHANCE = 0.17; // S2 has fewer droppers (fire guideline); keeps items about S1's level
const POWERUP_SPEED = 1.2;
const POWERUP_RADIUS = 8;

// --- Weapons (DESIGN.md 6): NORMAL + 4 weapons with Lv 1-3 ---
const WEAPON_NORMAL = 'normal';
const WEAPON_SPREAD = 'spread';
const WEAPON_RAIL = 'rail';
const WEAPON_CHAIN = 'chain';
const WEAPON_HOMING = 'homing';
const WEAPON_MAX_LEVEL = 3;
const WEAPON_MAX_LEVEL_BONUS = 5000;     // same color picked at Lv3
const WEAPON_MAX_LEVEL_GAUGE = 15;       // ... plus NOVA gauge %

// NORMAL: single straight shot
const NORMAL_FIRE_INTERVAL = 8;          // frames between shots
const NORMAL_DAMAGE = 1;

// SPREAD FAN: 3 / 4 / 5 ways
const SPREAD_FIRE_INTERVAL = 10;
const SPREAD_BULLET_SPEED = 8;
const SPREAD_STEP = 0.16;                // radians between shots
const SPREAD_DAMAGE = 1;

// RAIL LANCER: piercing beam, each enemy hit once
const RAIL_FIRE_INTERVAL = 12;
const RAIL_BULLET_SPEED = 12;
const RAIL_DAMAGE = 2;
const RAIL_WIDTH_THIN = 3;               // collision half-width, Lv1
const RAIL_WIDTH_THICK = 6;              // Lv2 / Lv3
const RAIL_TWIN_OFFSET = 7;              // Lv3: two beams this far apart from center
const RAIL_MOVE_SCALE = 0.75;            // ship speed while equipped

// CHAIN BOLT: lightning jumps to the nearest other enemy
const CHAIN_FIRE_INTERVAL = 10;
const CHAIN_BULLET_SPEED = 9;
const CHAIN_DAMAGE = 1;                  // direct hit
const CHAIN_JUMP_DAMAGE = 1;             // each jump
const CHAIN_RANGE = 80;                  // px from the last enemy hit
const CHAIN_ARC_FRAMES = 10;             // how long a lightning arc stays visible

// HOMING NEEDLE: 1 / 2 / 3 needles that steer to the nearest enemy
const HOMING_FIRE_INTERVAL = 14;
const HOMING_BULLET_SPEED = 6;
const HOMING_TURN_RATE = 0.12;           // radians per frame
const HOMING_DAMAGE = 1;
const HOMING_LIFE = 150;                 // frames

// --- Item types (DESIGN.md 10). Weapon items use the weapon ids. ---
const ITEM_OPTION = 'option';
const ITEM_REFLECT = 'reflect';
const ITEM_REPAIR = 'repair';
const ITEM_HULL_UP = 'hullUp';
const ITEM_STAR_CHIP = 'starChip';
const ITEM_NOVA_CRYSTAL = 'novaCrystal';

// --- Options (DESIGN.md 5) ---
const OPTION_MAX = 2;
const OPTION_POWER = 0.5;                // damage scale; options fire at Lv1
const OPTION_FOLLOW = 0.18;              // lerp factor toward their slot
const OPTION_OFFSET_X = 20;              // left / right rear slots
const OPTION_OFFSET_Y = 12;
const OPTION_CAP_BONUS = 3000;           // OPTION picked with 2 options

// --- REFLECT SHIELD ---
const REFLECT_DURATION = 20 * 60;
const REFLECT_RADIUS = 60;               // enemy bullets reversed within this
const REFLECT_DRAW_RADIUS = 20;
const REFLECT_BULLET_DAMAGE = 1;

// --- Recovery / score items ---
const REPAIR_FULL_BONUS = 1000;
const HULL_UP_FULL_BONUS = 1500;
const STAR_CHIP_SCORE = 500;
const STAR_CHIP_GAUGE = 10;

// --- NOVA BURST (DESIGN.md 7) ---
const GAUGE_MAX = 100;                   // percent
const GAUGE_KILL = 2;
const GAUGE_KILL_LARGE = 4;
const GAUGE_GRAZE = 3;
const GAUGE_PART_BREAK = 10;
const LARGE_ENEMY_RADIUS = 13;           // enemies this big count as "large"
const BURST_ENEMY_DAMAGE = 30;
const BURST_BOSS_DAMAGE_RATIO = 0.08;    // cap: 8% of the boss's max HP
const BURST_BULLET_SCORE = 10;           // per cleared hostile bullet
const BURST_INVINCIBLE_FRAMES = 120;
const BURST_RING_FRAMES = 40;

// --- Graze (DESIGN.md 8) ---
const GRAZE_RADIUS = 20;                 // px from the ship's center
const GRAZE_SCORE = 20;

// --- Combo (DESIGN.md 9) ---
const COMBO_WINDOW = 90;                 // frames to the next kill
const COMBO_TIERS = [                    // [min combo, multiplier], highest first
  [50, 8],
  [25, 4],
  [10, 2],
  [0, 1],
];
const COMBO_POPUP_FRAMES = 45;

// --- SECTOR NOVA 1 enemies (continued) ---
const ENEMY_SHIELD_HP = 4;
const ENEMY_SHIELD_SCORE = 250;
const ENEMY_SHIELD_SPEED = 1.2;
const ENEMY_SHIELD_RADIUS = 13;
const ENEMY_SHIELD_FRONT_REDUCTION = 0.25; // frontal hits do 25% damage

const ENEMY_SPLIT_HP = 3;
const ENEMY_SPLIT_SCORE = 200;
const ENEMY_SPLIT_SPEED = 1.3;
const ENEMY_SPLIT_RADIUS = 13;
const ENEMY_SPLITLING_HP = 1;
const ENEMY_SPLITLING_SCORE = 50;
const ENEMY_SPLITLING_SPEED = 2.2;
const ENEMY_SPLITLING_RADIUS = 7;

const ENEMY_FORM_HP = 2;
const ENEMY_FORM_SCORE = 150;
const ENEMY_FORM_SPEED = 1.6;
const ENEMY_FORM_RADIUS = 10;

const ENEMY_RUSH_HP = 2;
const ENEMY_RUSH_SCORE = 250;
const ENEMY_RUSH_SPEED = 0.8;
const ENEMY_RUSH_RADIUS = 11;
const ENEMY_RUSH_CHARGE_TIME = 70;  // frames before dashing
const ENEMY_RUSH_DASH_SPEED = 6;

const ENEMY_TURRET_HP = 5;
const ENEMY_TURRET_SCORE = 300;
const ENEMY_TURRET_SPEED = 1;
const ENEMY_TURRET_RADIUS = 13;
const ENEMY_TURRET_STOP_Y = 60;     // settles near top
const ENEMY_TURRET_FIRE_INTERVAL = 90;
const ENEMY_TURRET_BULLET_SPEED = 2.6;

// --- Touch controls (touch.js, provisional) ---
const TOUCH_DRAG_SCALE = 1.2; // ship moves this many px per px of finger drag
const TOUCH_BURST_X = CANVAS_WIDTH - 34;   // BURST button center (bottom-right,
const TOUCH_BURST_Y = CANVAS_HEIGHT - 66;  // just above the NOVA gauge)
const TOUCH_BURST_RADIUS = 18;
const TOUCH_BURST_HIT_MARGIN = 8;          // finger slack around the button
const TOUCH_STAGE_ARROW_X = 176;           // title STAGE SELECT value: taps from here change the stage
const TOUCH_STAGE_ARROW_SPLIT = 230;       // left of this = -1, right = +1

// --- Audio (audio.js) ---
const AUDIO_MASTER_VOLUME = 0.3;
const AUDIO_SFX_VOLUME = 1.0;
const AUDIO_BGM_VOLUME = 0.5;          // BGM sits under the effects
const AUDIO_SHOT_MIN_INTERVAL = 0.07;  // seconds; thins rapid-fire shot sounds

// --- Save keys (localStorage) ---
// Fully separate from SECTOR NOVA 1's sectorNova_* keys (DESIGN.md 15-10).
const SAVE_KEYS = {
  UNLOCKED_STAGE: 'sectorNova2_unlockedStage',
  BEST_SCORE: 'sectorNova2_bestScore',
  BEST_CLEAR_SCORE: 'sectorNova2_bestClearScore',
  BEST_RANKS: 'sectorNova2_bestRanks',
  DIFFICULTY: 'sectorNova2_difficulty',
  MUTED: 'sectorNova2_muted',
  NORMAL_END_CLEARED: 'sectorNova2_normalEndCleared',
  TRUE_END_CLEARED: 'sectorNova2_trueEndCleared',
  BOSS_RUSH_BEST_TIME: 'sectorNova2_bossRushBestTime',
};

// --- Utility Functions ---

/**
 * Calculate distance between two points
 */
function dist(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check circle-circle collision
 */
function circleCollision(x1, y1, r1, x2, y2, r2) {
  return dist(x1, y1, x2, y2) < r1 + r2;
}

/**
 * Clamp a value between min and max
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Random integer between min (inclusive) and max (inclusive)
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Calculate angle from (x1,y1) to (x2,y2)
 */
function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// --- Storage helpers ---
// localStorage can be unavailable in private or restricted contexts,
// so every access is wrapped and falls back quietly.

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch (e) {
    return false;
  }
}

function loadSavedInt(key, fallback) {
  const parsed = parseInt(storageGet(key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadSavedBool(key) {
  return storageGet(key) === '1';
}

function saveBool(key, value) {
  return storageSet(key, value ? '1' : '0');
}
