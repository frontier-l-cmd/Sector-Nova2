// ============================================================
// SECTOR NOVA 2 - Stage Management
// ------------------------------------------------------------
// Each stage describes its name, background theme, item drops and
// boss. Enemy appearances come from STAGE_TIMELINES (timeline.js).
//
// Stages 1-6 are complete (Phase 4-1 to 5-3). After Stage 6 comes
// the ending (game.js beginEnding).
// ============================================================

// Item weights (DESIGN.md 10). STAR CHIP drops often; NOVA CRYSTAL
// never drops at random.
const DEFAULT_POWERUP_WEIGHTS = {
  [ITEM_STAR_CHIP]: 0.40,
  [WEAPON_SPREAD]: 0.10,
  [WEAPON_RAIL]: 0.08,
  [WEAPON_CHAIN]: 0.08,
  [WEAPON_HOMING]: 0.08,
  [ITEM_OPTION]: 0.06,
  [ITEM_REFLECT]: 0.08,
  [ITEM_REPAIR]: 0.07,
  [ITEM_HULL_UP]: 0.05,
};

// S5: REPAIR about 3 per stage (HULL UP stays about 1) for the hot
// zone before the core; STAR CHIP gives way (README).
const STAGE5_POWERUP_WEIGHTS = {
  ...DEFAULT_POWERUP_WEIGHTS,
  [ITEM_STAR_CHIP]: 0.33,
  [ITEM_REPAIR]: 0.14,
};

const STAGES = {
  // Stage 0: TEST RANGE - every small enemy in turn (DEBUG_MODE only,
  // picked from the title menu). No boss, no saves.
  0: {
    stageNumber: 0,
    stageName: 'TEST RANGE',
    itemDropRate: POWERUP_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    test: true,
    implemented: DEBUG_MODE,
  },
  1: {
    stageNumber: 1,
    stageName: 'FROST RING',
    itemDropRate: POWERUP_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'glacierMaw',
    bgm: 'stageA',              // audio.js BGM_SONGS (stages share in pairs)
    bossExpectedTime: [30, 45], // seconds (DESIGN.md 14), used by the rank
    story: 'stage1',            // LYRA's message at the stage start
    implemented: true,
  },
  2: {
    stageNumber: 2,
    stageName: 'DEAD HARBOR',
    itemDropRate: STAGE2_ITEM_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'dockTitan',
    bgm: 'stageA',
    bossExpectedTime: [45, 60],
    story: 'stage2',
    implemented: true,
  },
  3: {
    stageNumber: 3,
    stageName: 'STORM VEIL',
    itemDropRate: STAGE3_ITEM_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'thunderRay',
    bgm: 'stageB',
    bossExpectedTime: [50, 70],
    story: 'stage3',
    implemented: true,
  },
  4: {
    stageNumber: 4,
    stageName: 'ECLIPSE HIVE',
    itemDropRate: STAGE4_ITEM_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'hiveMother',
    bgm: 'stageB',
    bossExpectedTime: [60, 80],
    story: 'stage4',
    implemented: true,
  },
  5: {
    stageNumber: 5,
    stageName: 'CORONA ZONE',
    itemDropRate: STAGE5_ITEM_DROP_CHANCE,
    powerupWeights: STAGE5_POWERUP_WEIGHTS,
    bossType: 'coronaSerpent',
    bgm: 'stageC',
    bossExpectedTime: [60, 80],
    story: 'stage5',
    implemented: true,
  },
  6: {
    stageNumber: 6,
    stageName: 'HELIOS CORE',
    itemDropRate: STAGE6_ITEM_DROP_CHANCE,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'eclipseCrown',
    bgm: 'stageC',
    bossExpectedTime: [120, 150],
    story: 'stage6',
    implemented: true,
  },
};

const MAX_STAGE = 6;

// BOSS RUSH (DESIGN.md 13): the six bosses and NEBULA HEART, in stage
// order, each over its own stage's backdrop.
const BOSS_RUSH_ORDER = [
  { type: 'glacierMaw', stage: 1 },
  { type: 'dockTitan', stage: 2 },
  { type: 'thunderRay', stage: 3 },
  { type: 'hiveMother', stage: 4 },
  { type: 'coronaSerpent', stage: 5 },
  { type: 'nebulaHeart', stage: 6 },
  { type: 'eclipseCrown', stage: 6 },
];

function highestImplementedStage() {
  let highest = 1;
  for (const key in STAGES) {
    const stage = STAGES[key];
    if (stage.implemented) {
      highest = Math.max(highest, stage.stageNumber);
    }
  }
  return highest;
}

/**
 * Highest stage STAGE SELECT offers: the unlocked stage, or in
 * DEBUG_MODE every implemented stage (for testing; the saved unlock
 * is not changed).
 */
function highestSelectableStage() {
  return DEBUG_MODE ? Math.max(highestImplementedStage(), getUnlockedStage()) : getUnlockedStage();
}

function isStagePlayable(stageNumber) {
  const stage = STAGES[stageNumber];
  if (stage && stage.test) return !!stage.implemented;
  return !!(stage && stage.implemented && stageNumber <= highestSelectableStage());
}

function loadUnlockedStage() {
  return clamp(loadSavedInt(SAVE_KEYS.UNLOCKED_STAGE, 1), 1, highestImplementedStage());
}

function saveUnlockedStage(stageNumber) {
  const unlocked = clamp(stageNumber, 1, highestImplementedStage());
  // Never lower an existing unlock (e.g. replaying Stage 1 later).
  if (unlocked > loadUnlockedStage()) storageSet(SAVE_KEYS.UNLOCKED_STAGE, unlocked);
  return loadUnlockedStage();
}

function getUnlockedStage() {
  return loadUnlockedStage();
}

function loadScore(key) {
  return Math.max(0, loadSavedInt(key, 0));
}

function saveScoreIfHigher(key, score) {
  const normalized = Math.max(0, Math.floor(Number(score) || 0));
  if (normalized <= loadScore(key)) return false;
  storageSet(key, normalized);
  return true;
}

function loadBestScore() {
  return loadScore(SAVE_KEYS.BEST_SCORE);
}

function saveBestScore(score) {
  return saveScoreIfHigher(SAVE_KEYS.BEST_SCORE, score);
}

function loadBestClearScore() {
  return loadScore(SAVE_KEYS.BEST_CLEAR_SCORE);
}

function saveBestClearScore(score) {
  return saveScoreIfHigher(SAVE_KEYS.BEST_CLEAR_SCORE, score);
}

/** Best rank per stage, e.g. { "1": "A" } (sectorNova2_bestRanks). */
function loadBestRanks() {
  try {
    return JSON.parse(storageGet(SAVE_KEYS.BEST_RANKS)) || {};
  } catch (e) {
    return {};
  }
}

/** Save a stage rank if it beats the stored one. Returns true if saved. */
function saveBestRank(stageNumber, rank) {
  const order = RANKS.map(r => r[0]); // S, A, B, C
  const ranks = loadBestRanks();
  const old = ranks[stageNumber];
  if (old && order.indexOf(old) <= order.indexOf(rank)) return false;
  ranks[stageNumber] = rank;
  storageSet(SAVE_KEYS.BEST_RANKS, JSON.stringify(ranks));
  return true;
}

function loadDifficulty() {
  const saved = storageGet(SAVE_KEYS.DIFFICULTY);
  return DIFFICULTY_LEVELS.includes(saved) ? saved : DEFAULT_DIFFICULTY;
}

function saveDifficulty(level) {
  if (DIFFICULTY_LEVELS.includes(level)) storageSet(SAVE_KEYS.DIFFICULTY, level);
}

/** BOSS RUSH unlocks after reaching NORMAL END on any difficulty. */
function isBossRushUnlocked() {
  return loadSavedBool(SAVE_KEYS.NORMAL_END_CLEARED);
}

function isTrueEndCleared() {
  return loadSavedBool(SAVE_KEYS.TRUE_END_CLEARED);
}

/** BOSS RUSH best clear time in seconds, or null (shorter is better). */
function loadBossRushBestTime() {
  const v = Number(storageGet(SAVE_KEYS.BOSS_RUSH_BEST_TIME));
  return Number.isFinite(v) && v > 0 ? v : null;
}

function saveBossRushBestTime(seconds) {
  storageSet(SAVE_KEYS.BOSS_RUSH_BEST_TIME, seconds.toFixed(2));
}

/** 83.4 -> '1:23.4' */
function formatRushTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--.-';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
}

/**
 * Tracks which stage is active and exposes its config.
 */
class StageManager {
  constructor() {
    this.current = 1;
  }

  reset() {
    this.current = 1;
  }

  setStage(stageNumber) {
    const stage = STAGES[stageNumber];
    if (!stage || !stage.implemented) return false;
    this.current = stageNumber;
    return true;
  }

  get config() {
    return STAGES[this.current];
  }

  /**
   * True if a *next* playable (implemented) stage exists.
   */
  hasNextImplemented() {
    const next = STAGES[this.current + 1];
    return !!(next && next.implemented);
  }

  /**
   * Advance to the next stage. Returns the new config, or null if
   * there is no further implemented stage (campaign complete).
   */
  advance() {
    if (this.hasNextImplemented()) {
      this.current++;
      return this.config;
    }
    return null;
  }
}
