// ============================================================
// SECTOR NOVA 2 - Scoring: combo (DESIGN.md 9)
// ------------------------------------------------------------
// Each kill within COMBO_WINDOW frames of the previous one keeps
// the combo going. Running out of time or getting hit resets it.
// The multiplier (x1 / x2 / x4 / x8 by COMBO_TIERS) applies to kill
// points, graze points and boss-part break points.
// Graze detection lives in Game.checkGraze(); stage ranks join
// this file in Phase 4.
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
