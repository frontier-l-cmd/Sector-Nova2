// ============================================================
// SECTOR NOVA 2 - Scoring: combo (DESIGN.md 9)
// ------------------------------------------------------------
// Each kill within COMBO_WINDOW frames of the previous one keeps
// the combo going. Running out of time or getting hit resets it.
// The multiplier (x1 / x2 / x4 / x8 by COMBO_TIERS) applies to kill
// points, graze points and boss-part break points.
// Graze detection lives in Game.graze().
// Stage rank (DESIGN.md 15-6) is calculated by calcStageRank().
// ============================================================

function comboMultiplierFor(count) {
  for (const [min, mul] of COMBO_TIERS) {
    if (count >= min) return mul;
  }
  return 1;
}

class ComboCounter {
  constructor() {
    this.reset();
    this.best = 0;
  }

  reset() {
    this.count = 0;
    this.timer = 0;
    this.popupText = '';
    this.popupTimer = 0;
  }

  get multiplier() {
    return comboMultiplierFor(this.count);
  }

  /** Remaining time as 0..1 (for the HUD bar). */
  get timeRatio() {
    return this.timer / COMBO_WINDOW;
  }

  /** Register a kill. Returns the multiplier to apply to its points. */
  addKill() {
    const before = this.multiplier;
    this.count++;
    this.timer = COMBO_WINDOW;
    this.best = Math.max(this.best, this.count);
    if (this.multiplier > before) {
      this.popupText = '×' + this.multiplier + '!';
      this.popupTimer = COMBO_POPUP_FRAMES;
    }
    return this.multiplier;
  }

  /** Combo broken by a hit. */
  break() {
    this.count = 0;
    this.timer = 0;
  }

  update() {
    if (this.popupTimer > 0) this.popupTimer--;
    if (this.timer > 0 && --this.timer <= 0) this.count = 0;
  }
}

/**
 * Stage rank out of 100 points (DESIGN.md 15-6):
 *   hits taken  0 = 40 / 1 = 25 / 2 = 10 / 3+ = 0
 *   boss time   within the expected lower bound = 30 / upper = 15
 *   max combo   50+ = 30 / 25+ = 20 / 10+ = 10
 * Returns { hitPoints, timePoints, comboPoints, points, rank, bonus }
 * with the bonus already scaled by the difficulty's score rate.
 */
function calcStageRank(stats, expectedTime, scoreRate) {
  const hitPoints = RANK_HIT_POINTS[stats.hits] ?? 0;
  let timePoints = 0;
  if (stats.bossSeconds !== null && expectedTime) {
    if (stats.bossSeconds <= expectedTime[0]) timePoints = RANK_TIME_POINTS[0];
    else if (stats.bossSeconds <= expectedTime[1]) timePoints = RANK_TIME_POINTS[1];
  }
  let comboPoints = 0;
  for (const [min, pts] of RANK_COMBO_POINTS) {
    if (stats.maxCombo >= min) {
      comboPoints = pts;
      break;
    }
  }
  const points = hitPoints + timePoints + comboPoints;
  const [rank, , bonus] = RANKS.find(([, min]) => points >= min);
  return { hitPoints, timePoints, comboPoints, points, rank, bonus: Math.round(bonus * scoreRate) };
}
