// ============================================================
// SECTOR NOVA 2 - GLACIER MAW (S1 boss, DESIGN.md 14)
// ------------------------------------------------------------
// A giant ice head with an upper and a lower jaw; the core sits
// deep in the mouth.
//   - Jaw cycle (6s): closed 3s, open 3s. While closed, hits land
//     on the jaws for 20% damage; while open the core takes 100%.
//     The jaw visibly starts opening 20 frames before it is open.
//   - Opening the mouth fires an aimed 5-way fan (the jaw movement is
//     its telegraph); a second fan comes halfway through the open
//     time, after the core flashes for GLACIER_MAW_FAN_WARN frames.
//   - Icicles drop from the top: a shadow lane shows for 40 frames
//     first. They can be shot down and sometimes leave a STAR CHIP.
//   - Below 50% HP: open 4s of each 6s cycle, every fan is fired
//     twice, more icicles.
// Teaches "shoot when the weak point shows".
// ============================================================

const GLACIER_MAW_NAME = 'GLACIER MAW';

/**
 * Icicle dropped by GLACIER MAW. For ICICLE_WARN_FRAMES it is only a
 * shadow lane (cannot hit or be hit), then it falls straight down.
 */
class Icicle extends Enemy {
  constructor(x) {
    super(x, -14, 'ICICLE');
    this.hp = ICICLE_HP;
    this.score = ICICLE_SCORE;
    this.radius = ICICLE_RADIUS;
    this.warn = ICICLE_WARN_FRAMES;
    this.fromBoss = true;
    this.dropOverride = { type: ITEM_STAR_CHIP, chance: ICICLE_STAR_CHIP_CHANCE };
  }

  get isHittable() {
    return this.warn <= 0;
  }

  update() {
    this.frame++;
    if (this.warn > 0) {
      this.warn--;
      return;
    }
    this.y += ICICLE_SPEED;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    if (this.warn > 0) {
      // Shadow lane + a crack at the top where it will fall.
      ctx.save();
      ctx.globalAlpha = Math.floor(this.warn / 5) % 2 === 0 ? 0.35 : 0.2;
      ctx.fillStyle = COLORS.ICICLE_SHADOW;
      ctx.fillRect(this.x - 9, 0, 18, CANVAS_HEIGHT);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = COLORS.ICICLE_BODY;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x - 6, 18);
      ctx.lineTo(this.x, 26);
      ctx.lineTo(this.x + 6, 18);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.GLACIER_MID;
    fillPolygon(ctx, [[-6, -12], [6, -12], [0, 12]]);
    ctx.fillStyle = COLORS.ICICLE_BODY;
    fillPolygon(ctx, [[-3, -12], [3, -12], [0, 6]]);
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillRect(-0.5, -10, 1, 8);
    ctx.restore();
  }
}

class GlacierMaw extends BossBase {
  constructor() {
    super({
      name: GLACIER_MAW_NAME,
      maxHp: GLACIER_MAW_HP,
      radius: GLACIER_MAW_RADIUS,
      targetY: GLACIER_MAW_TARGET_Y,
      score: GLACIER_MAW_SCORE,
      damageCap: GLACIER_MAW_DAMAGE_CAP,
      phases: [{
        name: GLACIER_MAW_NAME,
        attacks: [{ run: 'tick', duration: 1, rest: 0 }],
      }],
    });
    this.cycle = 0;
    this.repeatTimer = 0;
    this.icicleTimer = GLACIER_MAW_ICICLE_INTERVAL;
  }

  get openLength() {
    return this.isEnraged ? GLACIER_MAW_OPEN_ENRAGED : GLACIER_MAW_OPEN;
  }

  get closedLength() {
    return GLACIER_MAW_CYCLE - this.openLength;
  }

  /** 0 = shut, 1 = wide open; ramps over GLACIER_MAW_JAW_MOVE frames. */
  get openAmount() {
    if (this.state !== 'active' && this.state !== 'dying') return 0;
    const c = this.cycle % GLACIER_MAW_CYCLE;
    const shut = this.closedLength;
    if (c < shut - GLACIER_MAW_JAW_MOVE) return 0;
    if (c < shut) return (c - (shut - GLACIER_MAW_JAW_MOVE)) / GLACIER_MAW_JAW_MOVE;
    if (c < GLACIER_MAW_CYCLE - GLACIER_MAW_JAW_MOVE) return 1;
    return (GLACIER_MAW_CYCLE - c) / GLACIER_MAW_JAW_MOVE;
  }

  /** 0..1 while the core flashes before the mid-open fan. */
  get fanWarn() {
    if (this.state !== 'active') return 0;
    const mid = this.closedLength + Math.floor(this.openLength / 2);
    const left = mid - (this.cycle % GLACIER_MAW_CYCLE);
    return left > 0 && left <= GLACIER_MAW_FAN_WARN ? 1 - left / GLACIER_MAW_FAN_WARN : 0;
  }

  get mouthOpen() {
    return this.openAmount >= 1;
  }

  damageMultiplier() {
    return this.mouthOpen ? 1 : GLACIER_MAW_CLOSED_DAMAGE;
  }

  updateMovement() {
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.activeFrames * 0.008) * GLACIER_MAW_SWAY;
  }

  /** Runs every frame: jaw cycle, fans, icicles. */
  tick(world) {
    this.cycle++;
    const c = this.cycle % GLACIER_MAW_CYCLE;
    const shut = this.closedLength;
    if (c === shut || c === shut + Math.floor(this.openLength / 2)) {
      this.fireFan(world);
      if (this.isEnraged) this.repeatTimer = GLACIER_MAW_FAN_REPEAT;
    }
    if (this.repeatTimer > 0 && --this.repeatTimer === 0) this.fireFan(world);

    if (--this.icicleTimer <= 0) {
      this.icicleTimer = scaledFireInterval(this.isEnraged
        ? GLACIER_MAW_ICICLE_INTERVAL_ENRAGED : GLACIER_MAW_ICICLE_INTERVAL);
      // Half the icicles aim at the ship's lane, half fall anywhere.
      const x = Math.random() < 0.5
        ? clamp(world.player.x + randInt(-30, 30), 20, CANVAS_WIDTH - 20)
        : randInt(20, CANVAS_WIDTH - 20);
      world.addEnemy(new Icicle(x));
    }
  }

  fireFan(world) {
    world.addEnemyBullets(Patterns.fan({
      x: this.x, y: this.y + 16,
      angle: angleTo(this.x, this.y + 16, world.player.x, world.player.y),
      count: GLACIER_MAW_FAN_COUNT, step: GLACIER_MAW_FAN_STEP,
      speed: GLACIER_MAW_FAN_SPEED, kind: 'boss',
    }));
  }

  drawBody(ctx) {
    const open = this.openAmount;
    const drop = open * 16;           // lower jaw swings down
    const enraged = this.isEnraged;

    // Frost aura
    ctx.fillStyle = COLORS.GLACIER_MID;
    ctx.globalAlpha = 0.15 + Math.sin(this.frame * 0.04) * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Mouth cavity + core (visible as the jaw opens)
    if (open > 0) {
      ctx.fillStyle = COLORS.GLACIER_DEEP;
      ctx.beginPath();
      ctx.ellipse(0, 8 + drop / 2, 26, 4 + drop / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      const pulse = 1 + Math.sin(this.frame * 0.25) * 0.15;
      ctx.globalAlpha = open;
      ctx.fillStyle = COLORS.GLACIER_CORE;
      ctx.beginPath();
      ctx.arc(0, 8 + drop / 2, 9 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.beginPath();
      ctx.arc(0, 8 + drop / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      // Mid-open fan telegraph: a white ring closing on the core
      const warn = this.fanWarn;
      if (warn > 0) {
        ctx.strokeStyle = COLORS.UI_WHITE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + warn * 0.6;
        ctx.beginPath();
        ctx.arc(0, 8 + drop / 2, 26 - warn * 14, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Lower jaw
    ctx.save();
    ctx.translate(0, drop);
    ctx.fillStyle = COLORS.GLACIER_MID;
    fillPolygon(ctx, [[-40, 6], [40, 6], [32, 22], [14, 30], [-14, 30], [-32, 22]]);
    ctx.fillStyle = COLORS.GLACIER_DARK;
    fillPolygon(ctx, [[-30, 10], [30, 10], [24, 20], [-24, 20]]);
    ctx.fillStyle = COLORS.GLACIER_ICE;        // lower fangs
    for (let i = -3; i <= 3; i++) fillPolygon(ctx, [[i * 9 - 3, 8], [i * 9 + 3, 8], [i * 9, 2]]);
    ctx.restore();

    // Upper jaw / skull: jagged ice crown
    ctx.fillStyle = COLORS.GLACIER_ICE;
    fillPolygon(ctx, [
      [-50, 6], [-46, -14], [-38, -30], [-26, -24], [-18, -42], [-8, -30],
      [0, -48], [8, -30], [18, -42], [26, -24], [38, -30], [46, -14], [50, 6],
    ]);
    ctx.fillStyle = COLORS.GLACIER_MID;
    fillPolygon(ctx, [[-40, 4], [-34, -16], [-18, -24], [0, -32], [18, -24], [34, -16], [40, 4]]);
    ctx.fillStyle = COLORS.GLACIER_DARK;
    fillPolygon(ctx, [[-28, 4], [-22, -10], [0, -16], [22, -10], [28, 4]]);
    ctx.fillStyle = COLORS.GLACIER_ICE;        // upper fangs
    for (let i = -3; i <= 3; i++) fillPolygon(ctx, [[i * 9 - 3, 5], [i * 9 + 3, 5], [i * 9, 12]]);

    // Eyes: glow brighter while the mouth is open, red when enraged
    ctx.fillStyle = enraged ? COLORS.UI_RED : COLORS.GLACIER_EYE;
    ctx.globalAlpha = 0.6 + open * 0.4;
    fillPolygon(ctx, [[-24, -10], [-12, -14], [-14, -8]]);
    fillPolygon(ctx, [[24, -10], [12, -14], [14, -8]]);
    ctx.globalAlpha = 1;
  }
}

registerBoss('glacierMaw', GlacierMaw, GLACIER_MAW_NAME);
