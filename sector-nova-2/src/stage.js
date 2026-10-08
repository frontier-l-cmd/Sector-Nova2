// ============================================================
// SECTOR NOVA 2 - Stage Management
// ------------------------------------------------------------
// Each stage describes its name, background theme, item drops and
// boss. Enemy appearances come from STAGE_TIMELINES (timeline.js).
//
// Stages 1-3 are complete (Phase 4-1 to 4-3). Stages 4-6 are declared
// with their final names and become playable in Phase 5.
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
    bossExpectedTime: [50, 70],
    story: 'stage3',
    implemented: true,
  },
  4: { stageNumber: 4, stageName: 'ECLIPSE HIVE', bossType: 'hiveMother', implemented: false },
  5: { stageNumber: 5, stageName: 'CORONA ZONE', bossType: 'coronaSerpent', implemented: false },
  6: { stageNumber: 6, stageName: 'HELIOS CORE', bossType: 'eclipseCrown', implemented: false },
};

const MAX_STAGE = 6;

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

/** BOSS RUSH unlocks after reaching NORMAL END on any difficulty (Phase 6). */
function isBossRushUnlocked() {
  return loadSavedBool(SAVE_KEYS.NORMAL_END_CLEARED);
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
