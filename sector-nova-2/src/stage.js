// ============================================================
// SECTOR NOVA 2 - Stage Management
// ------------------------------------------------------------
// Each stage describes its name, background theme, item drops and
// boss. Enemy appearances come from STAGE_TIMELINES (timeline.js).
//
// Phase 1: only Stage 1 is implemented (provisional timeline with
// SECTOR NOVA 1 enemies). Stages 2-6 are declared with their final
// names and become playable in Phase 4/5.
// ============================================================

// Item weights use the SECTOR NOVA 1 item set until Phase 2.
const DEFAULT_POWERUP_WEIGHTS = {
  [WEAPON_TRIPLE]: 0.20,
  [WEAPON_PIERCE]: 0.18,
  [WEAPON_FLAME]: 0.14,
  [ITEM_SHIELD]: 0.28,
  [ITEM_LIFE]: 0.12,
  [ITEM_MAX_LIFE]: 0.08,
};

const STAGES = {
  1: {
    stageNumber: 1,
    stageName: 'FROST RING',
    itemDropRate: 0.08,
    powerupWeights: DEFAULT_POWERUP_WEIGHTS,
    bossType: 'orbCore', // provisional; GLACIER MAW in Phase 4
    implemented: true,
  },
  2: { stageNumber: 2, stageName: 'DEAD HARBOR', bossType: 'dockTitan', implemented: false },
  3: { stageNumber: 3, stageName: 'STORM VEIL', bossType: 'thunderRay', implemented: false },
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

function isStagePlayable(stageNumber) {
  const stage = STAGES[stageNumber];
  return !!(stage && stage.implemented && stageNumber <= getUnlockedStage());
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
