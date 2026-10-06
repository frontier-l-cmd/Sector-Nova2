// ============================================================
// SECTOR NOVA 2 - Player (NOVA-II) and Options
// ------------------------------------------------------------
// NOVA-II: slim twin-engine ship, ~24 px wide, hit radius 6.
//
// Weapon rules (DESIGN.md 6):
//   - NORMAL is always there and has no level.
//   - A weapon item switches to that weapon. Same color: Lv +1
//     (Lv3 again = bonus). Different color: switch, keep the Lv.
//   - Getting hit: Lv -1; at Lv1 the ship falls back to NORMAL.
//     A hit blocked by REFLECT SHIELD changes nothing.
// Options (max 2) trail behind, fire the same weapon at Lv1 and
// half power, and one is lost per hit. The NOVA gauge (0-100)
// lives here because it carries over between stages.
// ============================================================

/**
 * Small escort craft. Follows a slot beside / behind the ship with
 * a little lag and fires the ship's weapon at Lv1, half power.
 */
class OptionCraft {
  constructor(slot, x, y) {
    this.slot = slot; // -1 = left, 1 = right
    this.x = x;
    this.y = y;
    this.frame = 0;
  }

  update(player) {
    const tx = player.x + this.slot * OPTION_OFFSET_X;
    const ty = player.y + OPTION_OFFSET_Y;
    this.x += (tx - this.x) * OPTION_FOLLOW;
    this.y += (ty - this.y) * OPTION_FOLLOW;
    this.frame++;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 1 + Math.sin(this.frame * 0.2) * 0.15;

    ctx.fillStyle = COLORS.OPTION_GLOW;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Small arrowhead body
    ctx.fillStyle = COLORS.OPTION_BODY;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.PLAYER_COCKPIT;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - 60;
    this.maxLives = PLAYER_MAX_LIVES;
    this.lives = this.maxLives;
    this.hitRadius = PLAYER_HIT_RADIUS;
    this.fireTimer = 0;
    this.invincibleTimer = 0;
    this.alive = true;
    this.engineFrame = 0;
    // --- Weapon ---
    this.weaponType = WEAPON_NORMAL;
    this.weaponLevel = 1; // ignored while NORMAL
    // --- Options ---
    this.options = [];
    // --- REFLECT SHIELD ---
    this.reflectTimer = 0;
    // --- NOVA gauge (0-100) ---
    this.gauge = 0;
  }

  get weaponDef() {
    return WEAPONS[this.weaponType] || WEAPONS[WEAPON_NORMAL];
  }

  get hasLevel() {
    return this.weaponType !== WEAPON_NORMAL;
  }

  get isInvincible() {
    return this.invincibleTimer > 0;
  }

  get reflectActive() {
    return this.reflectTimer > 0;
  }

  get reflectSecondsLeft() {
    return Math.ceil(this.reflectTimer / 60);
  }

  get burstReady() {
    return this.gauge >= GAUGE_MAX;
  }

  // --- Weapon rules ------------------------------------------------

  /**
   * Weapon item pickup. Returns 'new' | 'levelUp' | 'switch' | 'max'
   * ('max' = same color at Lv3; the caller pays the bonus).
   */
  collectWeapon(type) {
    if (!this.hasLevel) {
      this.setWeapon(type, 1);
      return 'new';
    }
    if (type === this.weaponType) {
      if (this.weaponLevel >= WEAPON_MAX_LEVEL) return 'max';
      this.weaponLevel++;
      return 'levelUp';
    }
    this.setWeapon(type, this.weaponLevel);
    return 'switch';
  }

  setWeapon(type, level) {
    this.weaponType = type;
    this.weaponLevel = clamp(level || 1, 1, WEAPON_MAX_LEVEL);
    this.fireTimer = 0; // allow an immediate shot with the new weapon
  }

  levelUp() {
    if (this.hasLevel) this.weaponLevel = Math.min(WEAPON_MAX_LEVEL, this.weaponLevel + 1);
  }

  /** Hit penalty: Lv -1, or back to NORMAL from Lv1. */
  levelDown() {
    if (!this.hasLevel) return;
    if (this.weaponLevel > 1) this.weaponLevel--;
    else this.weaponType = WEAPON_NORMAL;
  }

  // --- Options / shield / gauge ---------------------------------------

  /** Add an option; returns false when already at OPTION_MAX. */
  addOption() {
    if (this.options.length >= OPTION_MAX) return false;
    const slot = this.options.some(o => o.slot === -1) ? 1 : -1;
    this.options.push(new OptionCraft(slot, this.x, this.y + OPTION_OFFSET_Y));
    return true;
  }

  loseOption() {
    this.options.pop();
  }

  setReflect() {
    this.reflectTimer = REFLECT_DURATION;
  }

  addGauge(amount) {
    this.gauge = clamp(this.gauge + amount, 0, GAUGE_MAX);
  }

  // --- Update / fire ---------------------------------------------------

  update(input) {
    if (!this.alive) return;

    // --- Movement (RAIL LANCER slows the ship) ---
    const speed = this.weaponType === WEAPON_RAIL ? PLAYER_SPEED * RAIL_MOVE_SCALE : PLAYER_SPEED;
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= speed;
    if (input.right) dx += speed;
    if (input.up) dy -= speed;
    if (input.down) dy += speed;

    // Diagonal movement normalization
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    this.x = clamp(this.x + dx, 12, CANVAS_WIDTH - 12);
    this.y = clamp(this.y + dy, 12, CANVAS_HEIGHT - 12);

    if (this.fireTimer > 0) this.fireTimer--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.reflectTimer > 0) this.reflectTimer--;

    for (const o of this.options) o.update(this);
    this.engineFrame++;
  }

  /** Fire the current weapon (and the options). Returns projectiles. */
  shoot() {
    if (!this.alive || this.fireTimer > 0) return [];
    const def = this.weaponDef;
    this.fireTimer = def.fireInterval;
    const shots = def.fire(this.x, this.y, this.hasLevel ? this.weaponLevel : 1, 1);
    for (const o of this.options) shots.push(...def.fire(o.x, o.y + 6, 1, OPTION_POWER));
    return shots;
  }

  /**
   * Take a real hit (REFLECT is handled by the game first).
   * Returns true if the player died.
   */
  takeDamage() {
    if (this.invincibleTimer > 0) return false;

    this.lives--;
    this.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
    this.levelDown();
    this.loseOption();

    if (this.lives <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  heal(amount) {
    amount = amount || 1;
    const before = this.lives;
    this.lives = Math.min(this.maxLives, this.lives + amount);
    return this.lives > before;
  }

  increaseMaxLives(amount) {
    amount = amount || 1;
    const beforeMax = this.maxLives;
    const beforeLives = this.lives;
    this.maxLives = Math.min(PLAYER_STAGE_MAX_LIVES, this.maxLives + amount);
    const maxIncreased = this.maxLives > beforeMax;
    this.lives = this.maxLives;
    return maxIncreased || this.lives > beforeLives;
  }

  // --- Draw -------------------------------------------------------------

  drawOptions(ctx) {
    if (!this.alive) return;
    for (const o of this.options) o.draw(ctx);
  }

  draw(ctx) {
    if (!this.alive) return;

    // Blinking when invincible
    if (this.isInvincible && Math.floor(this.invincibleTimer / PLAYER_BLINK_INTERVAL) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // --- Twin engine flames ---
    const flicker = Math.sin(this.engineFrame * 0.5) * 2;
    const flameLen = 7 + flicker;
    for (const ex of [-4, 4]) {
      ctx.fillStyle = COLORS.PLAYER_ENGINE;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(ex, 10, 4 + flicker * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.moveTo(ex - 2, 8);
      ctx.lineTo(ex, 8 + flameLen);
      ctx.lineTo(ex + 2, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.beginPath();
      ctx.moveTo(ex - 1, 8);
      ctx.lineTo(ex, 8 + flameLen * 0.6);
      ctx.lineTo(ex + 1, 8);
      ctx.closePath();
      ctx.fill();
    }

    // --- Swept wings (thin, sharp) ---
    ctx.fillStyle = COLORS.PLAYER_WING;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(3 * s, -2);
      ctx.lineTo(12 * s, 6);
      ctx.lineTo(12 * s, 9);
      ctx.lineTo(4 * s, 5);
      ctx.closePath();
      ctx.fill();
    }

    // --- Engine nacelles ---
    ctx.fillStyle = COLORS.PLAYER_WING;
    ctx.fillRect(-6, 2, 4, 7);
    ctx.fillRect(2, 2, 4, 7);

    // --- Main body: long narrow needle nose ---
    ctx.fillStyle = COLORS.PLAYER_BODY;
    ctx.beginPath();
    ctx.moveTo(0, -14);      // nose
    ctx.lineTo(-3, -4);
    ctx.lineTo(-4, 6);
    ctx.lineTo(0, 8);
    ctx.lineTo(4, 6);
    ctx.lineTo(3, -4);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = COLORS.PLAYER_COCKPIT;
    ctx.beginPath();
    ctx.ellipse(0, -3, 1.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-0.5, -12, 1, 6);
    ctx.globalAlpha = 1;

    // Wing-tip accents
    ctx.fillStyle = COLORS.PLAYER_ENGINE;
    ctx.fillRect(-12, 6, 1.5, 3);
    ctx.fillRect(10.5, 6, 1.5, 3);

    ctx.restore();
  }
}
