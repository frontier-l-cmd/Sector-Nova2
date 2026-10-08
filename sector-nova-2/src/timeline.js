// ============================================================
// SECTOR NOVA 2 - Stage Timelines
// ------------------------------------------------------------
// Stages are scripted as time-stamped data instead of random
// spawns (DESIGN.md 15-1):
//
//   { t: 2.0,   spawn: 'A', x: 80, count: 3, interval: 20, pattern: 'line' }
//   { t: 108.0, event: 'warning' }
//   { t: 111.0, event: 'boss', type: 'orbCore' }
//
//   t        : seconds from stage start (converted to frames)
//   spawn    : enemy key in ENEMY_FACTORIES
//   x        : px, or 'left' | 'center' | 'right' | 'random' | 'player'
//              (resolved once per entry, when its first member appears)
//   count    : members in the group (default 1)
//   interval : frames between members (default 0 = all at once)
//   pattern  : how members are placed around x (TIMELINE_PATTERNS)
//   spacing  : px between members for row / column / v (optional)
//   event    : see TIMELINE_EVENT_KINDS
//
// TimelineRunner keeps its own clock, so pause() (mid-boss fights)
// holds every later event until resume().
// ============================================================

const TIMELINE_EVENT_KINDS = [
  'spawn', 'midboss', 'boss', 'warning', 'comm', 'gimmickStart', 'gimmickEnd',
  'hazard', 'asteroid', 'goldEnemy', 'wall',
];

const STAGE_TIMELINES = {
  // ----------------------------------------------------------
  // Stage 0 TEST RANGE (DEBUG_MODE): each SECTOR NOVA 2 enemy in turn,
  // one block every ~8 seconds, names shown under the enemies.
  // ----------------------------------------------------------
  0: [
    { t: 2.0, spawn: 'SHARD', x: 'center', count: 3, interval: 20, pattern: 'line' },
    { t: 4.0, spawn: 'SHARD', x: 40 },                      // diagonal from the left
    { t: 4.5, spawn: 'SHARD', x: 280 },                     // diagonal from the right
    { t: 8.0, spawn: 'WISP', x: 'center', count: 4, interval: 18, pattern: 'wave' },
    { t: 14.0, spawn: 'SNIPER', x: 'center' },
    { t: 22.0, spawn: 'MINE_LAYER', x: 'left', y: 130 },     // lays MINEs
    { t: 30.0, spawn: 'GUN_DECK', x: 80 },
    { t: 30.0, spawn: 'GUN_DECK', x: 240 },
    { t: 38.0, spawn: 'CARRIER', x: 'center' },             // releases DRONEs
    { t: 48.0, spawn: 'MIRROR', x: 100 },
    { t: 48.0, spawn: 'MIRROR', x: 220 },
    { t: 56.0, spawn: 'PHASE_GHOST', x: 110 },
    { t: 56.0, spawn: 'PHASE_GHOST', x: 210 },
    { t: 64.0, spawn: 'SWARM', x: 'center', count: 7, pattern: 'v', spacing: 22 },
    { t: 70.0, spawn: 'FLARE_SPIRIT', x: 'center', count: 3, pattern: 'row', spacing: 70 },
    { t: 78.0, spawn: 'LINK_GUARD', x: 'center' },
    { t: 78.0, spawn: 'GUN_DECK', x: 120 },                 // shielded by the guard
    { t: 78.0, spawn: 'GUN_DECK', x: 200 },
    { t: 88.0, spawn: 'HATCHLING', x: 'center', count: 3, pattern: 'row', spacing: 30 },
    { t: 90.0, spawn: 'HATCHLING_WISP', x: 'center' },
    { t: 95.0, spawn: 'GOLD_SHARD', x: 'center' },
    { t: 98.0, spawn: 'GOLD_GHOST', x: 'center' },
  ],

  // ----------------------------------------------------------
  // Stage 1 FROST RING (DESIGN.md 12): SHARD / WISP, SNIPER in the
  // second half, giant asteroids as the gimmick, GOLD SHARD for the
  // NOVA CRYSTAL, FROST SENTINEL at 50s, GLACIER MAW at 111s.
  // Opening -> middle (asteroids) -> mid-boss -> late -> WARNING -> boss
  // ----------------------------------------------------------
  1: [
    // Opening: one idea at a time
    { t: 2.0, spawn: 'SHARD', x: 'center', count: 3, interval: 20, pattern: 'line' },
    { t: 5.0, spawn: 'SHARD', x: 80, count: 3, interval: 18, pattern: 'line' },
    { t: 6.0, spawn: 'SHARD', x: 240, count: 3, interval: 18, pattern: 'line' },
    { t: 9.0, spawn: 'WISP', x: 'center', count: 4, interval: 18, pattern: 'wave' },
    { t: 13.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 16.0, spawn: 'WISP', x: 'left', count: 3, interval: 18, pattern: 'wave' },
    { t: 17.0, spawn: 'WISP', x: 'right', count: 3, interval: 18, pattern: 'wave' },
    { t: 20.0, spawn: 'SHARD', count: 6, interval: 20, pattern: 'sides' },

    // Middle: the asteroid gimmick (break it into the enemies behind)
    { t: 23.0, event: 'asteroid', x: 160 },
    { t: 26.0, spawn: 'SHARD', x: 'center', count: 4, pattern: 'row', spacing: 34 },
    { t: 28.0, event: 'asteroid', x: 90 },
    { t: 29.5, spawn: 'WISP', x: 230, count: 4, interval: 18, pattern: 'wave' },
    { t: 33.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'v' },
    { t: 36.0, event: 'asteroid', x: 230 },
    { t: 37.0, spawn: 'SHARD', x: 'player', count: 3, interval: 14, pattern: 'line' },
    { t: 40.0, spawn: 'WISP', x: 'center', count: 4, interval: 18, pattern: 'wave' },
    { t: 42.0, event: 'goldEnemy', type: 'SHARD', x: 240 },   // NOVA CRYSTAL
    { t: 45.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 36 },

    // Mid-boss (the timeline waits until it is beaten or flees)
    { t: 50.0, event: 'midboss', type: 'sentinel' },

    // Late: SNIPERs join
    { t: 52.0, spawn: 'SNIPER', x: 100 },
    { t: 54.0, spawn: 'SHARD', count: 8, interval: 15, pattern: 'sides' },
    { t: 58.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 59.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 62.0, spawn: 'SNIPER', x: 220 },
    { t: 64.0, event: 'asteroid', x: 120 },
    { t: 66.0, spawn: 'SHARD', x: 'center', count: 7, pattern: 'v' },
    { t: 70.0, spawn: 'WISP', count: 4, interval: 25, pattern: 'random' },
    { t: 74.0, spawn: 'SNIPER', x: 80 },
    { t: 74.5, spawn: 'SNIPER', x: 240 },
    { t: 77.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 81.0, event: 'asteroid', x: 200 },
    { t: 82.0, spawn: 'SHARD', x: 'player', count: 4, interval: 12, pattern: 'line' },
    { t: 86.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 90.0, spawn: 'SHARD', count: 10, interval: 12, pattern: 'sides' },
    { t: 94.0, spawn: 'SNIPER', x: 'center' },
    { t: 96.0, spawn: 'WISP', x: 'center', count: 5, pattern: 'v', spacing: 34 },
    { t: 100.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 103.0, spawn: 'SHARD', x: 'player', count: 3, interval: 12, pattern: 'line' },

    // Boss
    { t: 108.0, event: 'warning' },
    { t: 111.0, event: 'boss', type: 'glacierMaw' },
  ],

  // ----------------------------------------------------------
  // Stage 2 DEAD HARBOR (DESIGN.md 12): + GUN DECK / MINE LAYER /
  // CARRIER. HARBOR SENTINEL at 50s, then the narrow passage (CAUTION
  // at 54s, walls from 57s; a GUN DECK and the odd NOVA CRYSTAL panel
  // are built into the walls), DOCK TITAN at 111s.
  // Enemy fire is kept within DESIGN.md 17 (S2 = 1.3x S1): few
  // shooters (one MINE LAYER, one SNIPER, the wall GUN DECK) and quiet
  // gaps; most of the traffic is SHARD / WISP and CARRIER drones.
  // ----------------------------------------------------------
  2: [
    // Opening
    { t: 2.0, spawn: 'SHARD', x: 'center', count: 3, interval: 20, pattern: 'line' },
    { t: 4.5, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 38 },
    { t: 8.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 9.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 12.0, spawn: 'CARRIER', x: 'center' },
    { t: 17.0, spawn: 'SHARD', count: 6, interval: 20, pattern: 'sides' },
    { t: 21.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'v' },

    // Middle (a breather at 23-26s, then the MINE LAYER on its own)
    { t: 26.0, spawn: 'MINE_LAYER', x: 'left', y: 120 },
    { t: 31.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 35.0, spawn: 'CARRIER', x: 100 },
    { t: 40.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 44.0, spawn: 'SNIPER', x: 160 },
    { t: 46.0, spawn: 'SHARD', x: 'player', count: 3, interval: 14, pattern: 'line' },

    // Mid-boss (the timeline waits until it is beaten or flees)
    { t: 50.0, event: 'midboss', type: 'sentinel' },
    { t: 52.0, spawn: 'SHARD', x: 'center', count: 4, pattern: 'row', spacing: 34 },

    // The narrow passage: light traffic inside, one GUN DECK in the wall
    { t: 54.0, event: 'wall', type: 'passage' },
    { t: 60.0, spawn: 'SHARD', x: 'player', count: 3, interval: 16, pattern: 'line' },
    { t: 64.0, spawn: 'WISP', x: 'player', count: 3, interval: 18, pattern: 'wave' },
    { t: 68.0, spawn: 'SHARD', x: 'player', count: 3, interval: 16, pattern: 'line' },
    { t: 72.0, spawn: 'WISP', x: 'player', count: 3, interval: 18, pattern: 'wave' },
    { t: 76.0, spawn: 'SHARD', x: 'player', count: 3, interval: 16, pattern: 'line' },

    // Late: drones and small fry, no gunners before the boss
    { t: 82.0, spawn: 'CARRIER', x: 'center' },
    { t: 86.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 87.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 91.0, spawn: 'SHARD', count: 8, interval: 15, pattern: 'sides' },
    { t: 95.0, spawn: 'CARRIER', x: 220 },
    { t: 98.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 101.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 104.0, spawn: 'SHARD', x: 'player', count: 3, interval: 12, pattern: 'line' },

    // Boss
    { t: 108.0, event: 'warning' },
    { t: 111.0, event: 'boss', type: 'dockTitan' },
  ],

  // ----------------------------------------------------------
  // Stage 3 STORM VEIL (DESIGN.md 12): + MIRROR / PHASE GHOST.
  // Gimmick: lightning (the storm, plus a few scripted bolts) and
  // cloud bands that hide enemies (never bullets). GOLD GHOST waits in
  // its own cloud (NOVA CRYSTAL). STORM SENTINEL at 50s, THUNDER RAY at
  // 111s. Fire is kept within DESIGN.md 17 (S3 = about 1.6x S1).
  // ----------------------------------------------------------
  3: [
    // Opening: MIRROR and PHASE GHOST, still clear skies
    { t: 2.0, spawn: 'SHARD', x: 'center', count: 3, interval: 20, pattern: 'line' },
    { t: 4.5, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 5.5, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 9.0, spawn: 'MIRROR', x: 100 },
    { t: 9.0, spawn: 'MIRROR', x: 220 },
    { t: 13.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 16.0, event: 'gimmickStart', type: 'clouds' },
    { t: 17.0, spawn: 'PHASE_GHOST', x: 110 },
    { t: 17.0, spawn: 'PHASE_GHOST', x: 210 },
    { t: 21.0, spawn: 'SHARD', count: 6, interval: 20, pattern: 'sides' },

    // Middle: the storm begins (a single bolt first, then the storm)
    { t: 23.0, event: 'hazard', type: 'lightning', x: 'player' },
    { t: 26.0, event: 'gimmickStart', type: 'storm' },
    { t: 26.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 29.0, spawn: 'SNIPER', x: 160 },
    { t: 31.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 34.0, spawn: 'MIRROR', x: 160 },
    { t: 36.0, spawn: 'PHASE_GHOST', x: 'center' },
    { t: 38.0, spawn: 'GUN_DECK', x: 80 },
    { t: 40.0, event: 'goldEnemy', type: 'GHOST', x: 240, inCloud: true },  // NOVA CRYSTAL
    { t: 43.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'v' },
    { t: 46.0, spawn: 'SNIPER', x: 80 },
    { t: 46.5, spawn: 'SNIPER', x: 240 },
    { t: 48.0, event: 'gimmickEnd', type: 'storm' },

    // Mid-boss (the timeline waits until it is beaten or flees)
    { t: 50.0, event: 'midboss', type: 'sentinel' },
    { t: 52.0, spawn: 'SHARD', x: 'center', count: 4, pattern: 'row', spacing: 34 },

    // Late: storm again
    { t: 54.0, event: 'gimmickStart', type: 'storm' },
    { t: 56.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 57.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 60.0, spawn: 'MINE_LAYER', x: 'right', y: 130 },
    { t: 63.0, spawn: 'PHASE_GHOST', x: 100 },
    { t: 63.0, spawn: 'PHASE_GHOST', x: 220 },
    { t: 66.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 69.0, spawn: 'MIRROR', x: 100 },
    { t: 69.0, spawn: 'MIRROR', x: 220 },
    { t: 72.0, spawn: 'SNIPER', x: 'center' },
    { t: 75.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 78.0, spawn: 'GUN_DECK', x: 240 },
    { t: 80.0, spawn: 'SHARD', count: 8, interval: 15, pattern: 'sides' },
    { t: 84.0, spawn: 'PHASE_GHOST', x: 'center', count: 3, pattern: 'row', spacing: 70 },
    { t: 88.0, spawn: 'SNIPER', x: 120 },
    { t: 90.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 94.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 95.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 98.0, event: 'gimmickEnd', type: 'storm' },
    { t: 99.0, spawn: 'MIRROR', x: 160 },
    { t: 101.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 103.0, event: 'gimmickEnd', type: 'clouds' },
    { t: 104.0, spawn: 'SHARD', x: 'player', count: 3, interval: 12, pattern: 'line' },

    // Boss
    { t: 108.0, event: 'warning' },
    { t: 111.0, event: 'boss', type: 'thunderRay' },
  ],

  // ----------------------------------------------------------
  // Stage 4 ECLIPSE HIVE (DESIGN.md 12): + SWARM / LINK GUARD.
  // Gimmick: the flesh wall maze (CAUTION at 54s, rows from ~56s to
  // ~79s; one odd-patterned block holds the NOVA CRYSTAL). No LINK
  // GUARD near the maze, so every block can always be shot open.
  // HIVE SENTINEL at 50s, HIVE MOTHER at 111s. Fire is kept within
  // DESIGN.md 17 (S4 = about 1.9x S1).
  // ----------------------------------------------------------
  4: [
    // Opening: the swarm
    { t: 2.0, spawn: 'SWARM', x: 'center', count: 7, pattern: 'v', spacing: 22 },
    { t: 5.0, spawn: 'SHARD', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 8.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 9.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 12.0, spawn: 'LINK_GUARD', x: 'center' },
    { t: 12.0, spawn: 'GUN_DECK', x: 120 },                  // shielded by the guard
    { t: 12.0, spawn: 'GUN_DECK', x: 200 },
    { t: 17.0, spawn: 'SWARM', x: 'player', count: 7, pattern: 'v', spacing: 22 },
    { t: 21.0, spawn: 'SHARD', count: 6, interval: 20, pattern: 'sides' },

    // Middle
    { t: 25.0, spawn: 'MINE_LAYER', x: 'left', y: 120 },
    { t: 28.0, spawn: 'PHASE_GHOST', x: 100 },
    { t: 28.0, spawn: 'PHASE_GHOST', x: 220 },
    { t: 31.0, spawn: 'SWARM', x: 'center', count: 7, pattern: 'v', spacing: 22 },
    { t: 34.0, spawn: 'SNIPER', x: 80 },
    { t: 34.5, spawn: 'SNIPER', x: 240 },
    { t: 37.0, spawn: 'WISP', x: 'center', count: 5, interval: 16, pattern: 'wave' },
    { t: 40.0, spawn: 'CARRIER', x: 'center' },
    { t: 43.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 46.0, spawn: 'SWARM', x: 'player', count: 7, pattern: 'v', spacing: 22 },

    // Mid-boss (the timeline waits until it is beaten or flees)
    { t: 50.0, event: 'midboss', type: 'sentinel' },
    { t: 52.0, spawn: 'SHARD', x: 'center', count: 4, pattern: 'row', spacing: 34 },

    // The flesh wall maze: little else around it
    { t: 54.0, event: 'wall', type: 'flesh' },
    { t: 62.0, spawn: 'SWARM', x: 'center', count: 5, pattern: 'v', spacing: 22 },
    { t: 70.0, spawn: 'SHARD', x: 'player', count: 3, interval: 16, pattern: 'line' },

    // Late
    { t: 81.0, spawn: 'LINK_GUARD', x: 'center' },
    { t: 81.0, spawn: 'MIRROR', x: 100 },
    { t: 81.0, spawn: 'MIRROR', x: 220 },
    { t: 84.0, spawn: 'MINE_LAYER', x: 'right', y: 140 },
    { t: 87.0, spawn: 'SWARM', x: 'center', count: 7, pattern: 'v', spacing: 22 },
    { t: 90.0, spawn: 'SNIPER', x: 'center' },
    { t: 92.0, spawn: 'GUN_DECK', x: 160 },
    { t: 94.0, spawn: 'WISP', x: 'left', count: 4, interval: 18, pattern: 'wave' },
    { t: 95.0, spawn: 'WISP', x: 'right', count: 4, interval: 18, pattern: 'wave' },
    { t: 97.0, spawn: 'SNIPER', x: 100 },
    { t: 98.0, spawn: 'SNIPER', x: 220 },
    { t: 99.0, spawn: 'SWARM', x: 'player', count: 7, pattern: 'v', spacing: 22 },
    { t: 102.0, spawn: 'SHARD', x: 'center', count: 6, pattern: 'row', spacing: 40 },
    { t: 104.0, spawn: 'SHARD', x: 'player', count: 3, interval: 12, pattern: 'line' },

    // Boss
    { t: 108.0, event: 'warning' },
    { t: 111.0, event: 'boss', type: 'hiveMother' },
  ],
};

// ------------------------------------------------------------
// Placement patterns: (member index, group size, base x, spacing)
// -> { x, y } offsets for one member. Enemies enter from the top.
// ------------------------------------------------------------
const TIMELINE_PATTERNS = {
  // Same spot; use `interval` to stream them in one after another.
  line: (i, n, x) => ({ x, y: TIMELINE_SPAWN_Y }),
  // Same spot and the same wave phase, so weaving enemies trace one path.
  wave: (i, n, x) => ({ x, y: TIMELINE_SPAWN_Y, sameWave: true }),
  // Stacked vertically, entering together (a vertical column).
  column: (i, n, x, gap) => ({ x, y: TIMELINE_SPAWN_Y - i * gap }),
  // Side by side, centered on x.
  row: (i, n, x, gap) => ({ x: x + (i - (n - 1) / 2) * gap, y: TIMELINE_SPAWN_Y }),
  // V pointing down: leader first, wings trail behind alternately.
  v: (i, n, x, gap) => {
    const rank = Math.ceil(i / 2);
    const side = i % 2 === 1 ? -1 : 1;
    return { x: x + side * rank * gap, y: TIMELINE_SPAWN_Y - rank * TIMELINE_V_DEPTH };
  },
  // Alternating left / right screen edges (x is ignored).
  sides: (i) => ({
    x: i % 2 === 0 ? TIMELINE_SIDES_MARGIN : CANVAS_WIDTH - TIMELINE_SIDES_MARGIN,
    y: TIMELINE_SPAWN_Y,
  }),
  // A fresh random x for each member.
  random: () => ({ x: randomSpawnX(), y: TIMELINE_SPAWN_Y }),
};

function randomSpawnX() {
  return randInt(TIMELINE_RANDOM_X_MARGIN, CANVAS_WIDTH - TIMELINE_RANDOM_X_MARGIN);
}

/** Resolve an entry's x field to pixels. */
function resolveTimelineX(x, player) {
  if (typeof x === 'number') return x;
  if (x === 'player') return player ? player.x : CANVAS_WIDTH / 2;
  if (x === 'random' || x === undefined) return randomSpawnX();
  return TIMELINE_X_POSITIONS[x] ?? CANVAS_WIDTH / 2;
}

/**
 * Create the enemy for one compiled spawn event. Returns the enemy,
 * or null for an unknown type.
 */
function spawnTimelineEnemy(ev, player) {
  const entry = ev.group.entry;
  const factory = ENEMY_FACTORIES[entry.spawn];
  if (!factory) return null;

  if (ev.group.baseX === null) ev.group.baseX = resolveTimelineX(entry.x, player);
  const placeAt = TIMELINE_PATTERNS[entry.pattern] || TIMELINE_PATTERNS.line;
  const gap = entry.spacing ?? TIMELINE_DEFAULT_SPACING;
  const pos = placeAt(ev.index, ev.group.count, ev.group.baseX, gap);

  const x = clamp(pos.x, TIMELINE_EDGE_MARGIN, CANVAS_WIDTH - TIMELINE_EDGE_MARGIN);
  const enemy = factory(x, entry.y ?? pos.y);
  enemy.spawnX = x;
  if (pos.sameWave && enemy.waveOffset !== undefined) enemy.waveOffset = 0;
  if (enemy.formationBonus) enemy.formation = ev.group; // SWARM bonus group
  return enemy;
}

class TimelineRunner {
  constructor(entries) {
    this.events = TimelineRunner.compile(entries || []);
    this.frame = 0;   // timeline clock (stops while paused)
    this.index = 0;   // next event to dispatch
    this.paused = false;
  }

  /**
   * Flatten entries into frame-sorted events. A spawn entry with
   * `count` members becomes one event per member, `interval` apart.
   */
  static compile(entries) {
    const events = [];
    entries.forEach((entry, order) => {
      const frame = Math.round(entry.t * FPS);
      if (entry.spawn) {
        const count = entry.count || 1;
        const group = { entry, count, baseX: null };
        for (let i = 0; i < count; i++) {
          events.push({ kind: 'spawn', frame: frame + i * (entry.interval || 0), order, index: i, group, entry });
        }
      } else {
        events.push({ kind: entry.event, frame, order, index: 0, entry });
      }
    });
    events.sort((a, b) => a.frame - b.frame || a.order - b.order || a.index - b.index);
    return events;
  }

  get seconds() {
    return this.frame / FPS;
  }

  get finished() {
    return this.index >= this.events.length;
  }

  /**
   * Advance one frame, calling handler(event) for every event that is
   * due. A handler may pause() the runner (e.g. a mid-boss appears);
   * remaining events then wait until resume().
   */
  update(handler) {
    if (this.paused) return;
    while (!this.paused && this.index < this.events.length &&
           this.events[this.index].frame <= this.frame) {
      handler(this.events[this.index++]);
    }
    if (!this.paused) this.frame++;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  /** Next not-yet-dispatched event of a kind, or null. */
  findNext(kind) {
    for (let i = this.index; i < this.events.length; i++) {
      if (this.events[i].kind === kind) return this.events[i];
    }
    return null;
  }

  /**
   * Jump the clock to the next event of `kind`, skipping everything
   * before it (debug key 9 -> 'warning'). Returns false if none is left.
   */
  skipTo(kind) {
    const target = this.findNext(kind);
    if (!target) return false;
    this.index = this.events.indexOf(target);
    this.frame = target.frame;
    return true;
  }
}

/**
 * DEBUG_MODE authoring check: unknown events / enemy types, bad times,
 * or a stage without a boss. Problems are reported with console.warn.
 */
function validateTimelines() {
  for (const stage in STAGE_TIMELINES) {
    const entries = STAGE_TIMELINES[stage];
    let hasBoss = false;
    entries.forEach((entry, i) => {
      const where = 'timeline ' + stage + '[' + i + ']';
      if (typeof entry.t !== 'number' || entry.t < 0) console.warn(where + ': bad t', entry);
      if (entry.spawn) {
        if (!ENEMY_FACTORIES[entry.spawn]) console.warn(where + ': unknown enemy', entry.spawn);
        if (entry.pattern && !TIMELINE_PATTERNS[entry.pattern]) console.warn(where + ': unknown pattern', entry.pattern);
      } else if (!TIMELINE_EVENT_KINDS.includes(entry.event)) {
        console.warn(where + ': unknown event', entry.event);
      }
      if (entry.event === 'boss') {
        hasBoss = true;
        if (!BOSS_REGISTRY[entry.type]) console.warn(where + ': unknown boss', entry.type);
      }
    });
    if (!hasBoss && !(STAGES[stage] && STAGES[stage].test)) console.warn('timeline ' + stage + ': no boss event');
  }
}
