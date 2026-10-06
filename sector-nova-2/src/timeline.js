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
  // Stage 1 FROST RING - Phase 1 provisional content built from
  // SECTOR NOVA 1 enemies (A straight, B weave, C shooter, plus a
  // few FORM / SPLIT / RUSH / TURRET). Replaced in Phase 4.
  // Opening -> middle -> (mid-boss slot ~50s) -> late -> WARNING -> boss
  // ----------------------------------------------------------
  1: [
    // Opening: single types, one idea at a time
    { t: 2.0, spawn: 'A', x: 80, count: 3, interval: 20, pattern: 'line' },
    { t: 4.0, spawn: 'A', x: 240, count: 3, interval: 20, pattern: 'line' },
    { t: 7.0, spawn: 'B', x: 'center', count: 3, interval: 24, pattern: 'wave' },
    { t: 10.0, spawn: 'A', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 13.0, spawn: 'C', x: 100 },
    { t: 14.0, spawn: 'A', x: 'right', count: 4, interval: 16, pattern: 'line' },
    { t: 17.0, spawn: 'B', x: 90, count: 3, interval: 24, pattern: 'wave' },
    { t: 17.5, spawn: 'B', x: 230, count: 3, interval: 24, pattern: 'wave' },
    { t: 21.0, spawn: 'A', x: 'player', count: 3, interval: 12, pattern: 'line' },
    { t: 23.0, spawn: 'C', x: 220 },
    { t: 24.0, spawn: 'A', count: 6, interval: 20, pattern: 'sides' },
    { t: 27.0, spawn: 'FORM', x: 'center', count: 4, pattern: 'column' },
    { t: 30.0, spawn: 'B', count: 4, interval: 30, pattern: 'random' },

    // Middle: mixes and formations
    { t: 32.0, spawn: 'A', x: 'center', count: 5, pattern: 'v' },
    { t: 34.0, spawn: 'C', x: 70 },
    { t: 35.0, spawn: 'C', x: 250 },
    { t: 37.0, spawn: 'FORM', x: 80, count: 4, pattern: 'column' },
    { t: 38.5, spawn: 'FORM', x: 240, count: 4, pattern: 'column' },
    { t: 41.0, spawn: 'B', x: 'left', count: 4, interval: 20, pattern: 'wave' },
    { t: 43.0, spawn: 'B', x: 'right', count: 4, interval: 20, pattern: 'wave' },
    { t: 46.0, spawn: 'SPLIT', x: 'center' },
    { t: 48.0, spawn: 'A', x: 'center', count: 6, pattern: 'row', spacing: 36 },
    // 50-54s: quiet slot reserved for the mid-boss (Phase 4)
    { t: 54.0, spawn: 'C', count: 2, interval: 60, pattern: 'random' },
    { t: 56.0, spawn: 'A', count: 8, interval: 15, pattern: 'sides' },
    { t: 60.0, spawn: 'B', x: 'center', count: 5, pattern: 'v', spacing: 36 },
    { t: 63.0, spawn: 'RUSH', x: 80 },
    { t: 64.0, spawn: 'RUSH', x: 240 },
    { t: 66.0, spawn: 'FORM', x: 'center', count: 5, pattern: 'row', spacing: 40 },
    { t: 68.0, spawn: 'A', x: 'player', count: 4, interval: 10, pattern: 'line' },
    { t: 70.0, spawn: 'SPLIT', x: 100 },
    { t: 72.0, spawn: 'SPLIT', x: 220 },
    { t: 74.0, spawn: 'C', x: 'center' },
    { t: 74.5, spawn: 'A', x: 'center', count: 4, pattern: 'row', spacing: 50 },

    // Late: denser combinations
    { t: 76.0, spawn: 'TURRET', x: 80 },
    { t: 78.0, spawn: 'TURRET', x: 240 },
    { t: 79.0, spawn: 'A', x: 'center', count: 6, interval: 14, pattern: 'line' },
    { t: 82.0, spawn: 'B', x: 'left', count: 4, interval: 20, pattern: 'wave' },
    { t: 83.0, spawn: 'B', x: 'right', count: 4, interval: 20, pattern: 'wave' },
    { t: 86.0, spawn: 'FORM', x: 'player', count: 5, pattern: 'column' },
    { t: 88.0, spawn: 'A', x: 'center', count: 7, pattern: 'v' },
    { t: 91.0, spawn: 'C', x: 60 },
    { t: 91.0, spawn: 'C', x: 260 },
    { t: 93.0, spawn: 'RUSH', count: 3, interval: 40, pattern: 'random' },
    { t: 96.0, spawn: 'A', count: 10, interval: 12, pattern: 'sides' },
    { t: 100.0, spawn: 'B', x: 'center', count: 5, pattern: 'row', spacing: 50 },
    { t: 103.0, spawn: 'A', x: 'player', count: 3, interval: 12, pattern: 'line' },

    // Boss
    { t: 108.0, event: 'warning' },
    { t: 111.0, event: 'boss', type: 'orbCore' },
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
    if (!hasBoss) console.warn('timeline ' + stage + ': no boss event');
  }
}
