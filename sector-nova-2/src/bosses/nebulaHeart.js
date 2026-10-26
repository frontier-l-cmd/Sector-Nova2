// ============================================================
// SECTOR NOVA 2 - NEBULA HEART, eroded (S6 mid-boss, DESIGN.md 14)
// ------------------------------------------------------------
// SECTOR NOVA 1's last boss returns, eaten into by ECLIPSE: the same
// core, rotating plates and side armor (drawn after SECTOR NOVA 1's
// boss.js), with black cracks and a purple aura added.
//   - SECTOR NOVA 1 style aimed 3-way spread, alternating with a
//     12-way ring. The core swells and a white ring closes in for
//     NEBULA_HEART_CHARGE frames before every shot (telegraph).
//   - Below 50% HP: the erosion cracks flare in turn and fire aimed
//     shots (each flares NEBULA_EROSION_CHARGE frames first).
//   - A mid-boss that never flees: the stage waits until it falls.
//   - NOVA CRYSTAL (S6): beaten without NOVA BURST (Game.useBurst
//     marks `burstUsed` on the boss on screen).
// ============================================================

const NEBULA_HEART_NAME = 'NEBULA HEART';

// Erosion cracks (offsets from the center); the enraged shots come from here.
const NEBULA_EROSION_POINTS = [[-27, 4], [27, 4], [0, -22]];

class NebulaHeart extends BossBase {
  constructor() {
    super({
      name: NEBULA_HEART_NAME,
      maxHp: NEBULA_HEART_HP,
      radius: NEBULA_HEART_RADIUS,
      targetY: NEBULA_HEART_TARGET_Y,
      score: NEBULA_HEART_SCORE,
      damageCap: NEBULA_HEART_DAMAGE_CAP,
      midboss: true,
      escapeAfter: 0,
      phases: [{
        name: NEBULA_HEART_NAME,
        startDelay: 50,
        attacks: [
          { run: 'fireSpread', duration: NEBULA_HEART_CHARGE, rest: (b) => b.fireRest },
          { run: 'fireRing', duration: NEBULA_HEART_CHARGE, rest: (b) => b.fireRest },
        ],
      }],
    });
    this.armorAngle = 0;
    this.charge = 0;          // 0..1 while charging a shot
    this.ringTurn = 0;
    this.erosionTimer = NEBULA_EROSION_INTERVAL;
    this.erosionIndex = 0;
    this.erosionFlare = -1;   // crack that is flaring (-1 = none)
    this.burstUsed = false;
  }

  get fireRest() {
    return scaledFireInterval(this.isEnraged ? NEBULA_HEART_REST_ENRAGED : NEBULA_HEART_REST);
  }

  /** Charge for the attack's frames, fire on the last one. */
  charging(t) {
    this.charge = (t + 1) / NEBULA_HEART_CHARGE;
    if (t < NEBULA_HEART_CHARGE - 1) return false;
    this.charge = 0;
    return true;
  }

  updateMovement(world) {
    this.armorAngle += this.isEnraged ? 0.035 : 0.02;
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.activeFrames * 0.01) * 60;
    this.updateErosion(world);
  }

  fireSpread(world, t) {
    if (!this.charging(t)) return;
    world.addEnemyBullets(Patterns.fan({
      x: this.x, y: this.y + 30,
      angle: angleTo(this.x, this.y, world.player.x, world.player.y),
      count: 3, step: this.isEnraged ? NEBULA_HEART_SPREAD_ENRAGED : NEBULA_HEART_SPREAD,
      speed: NEBULA_HEART_SPEED, kind: 'boss',
    }));
  }

  fireRing(world, t) {
    if (!this.charging(t)) return;
    this.ringTurn += Math.PI / NEBULA_HEART_RING_COUNT; // alternate the gaps
    world.addEnemyBullets(Patterns.ring({
      x: this.x, y: this.y, count: NEBULA_HEART_RING_COUNT,
      speed: NEBULA_HEART_RING_SPEED, offset: this.ringTurn, kind: 'boss',
    }));
  }

  /** Enraged: a crack flares, then fires one aimed shot. */
  updateErosion(world) {
    if (!this.isEnraged) return;
    if (--this.erosionTimer === NEBULA_EROSION_CHARGE) {
      this.erosionFlare = this.erosionIndex;
    }
    if (this.erosionTimer > 0) return;
    const [ox, oy] = NEBULA_EROSION_POINTS[this.erosionFlare >= 0 ? this.erosionFlare : this.erosionIndex];
    world.addEnemyBullets(Patterns.aimed({
      x: this.x + ox, y: this.y + oy, tx: world.player.x, ty: world.player.y,
      speed: NEBULA_EROSION_SPEED, kind: 'boss',
    }));
    this.erosionFlare = -1;
    this.erosionIndex = (this.erosionIndex + 1) % NEBULA_EROSION_POINTS.length;
    this.erosionTimer = scaledFireInterval(NEBULA_EROSION_INTERVAL);
  }

  beginDefeat(world) {
    // NOVA CRYSTAL: beaten without NOVA BURST.
    const stage = world.stage.stageNumber;
    if (!this.burstUsed && !world.crystalStages.has(stage)) {
      world.addPowerup(new Powerup(clamp(this.x, 24, CANVAS_WIDTH - 24), this.y, ITEM_NOVA_CRYSTAL));
    }
    super.beginDefeat(world);
    world.comm.show('nebulaDown');
  }

  drawBody(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.05) * 0.05;
    const corePulse = 1 + Math.sin(this.frame * 0.1) * 0.15;
    const enraged = this.isEnraged;

    // Purple aura (the erosion), flickering
    ctx.fillStyle = COLORS.NEBULA_AURA;
    ctx.globalAlpha = 0.16 + Math.sin(this.frame * 0.07) * 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, 56 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Outer shield ring
    ctx.strokeStyle = enraged ? COLORS.NEBULA_GLOW : COLORS.NEBULA_ARMOR;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3 + Math.sin(this.frame * 0.03) * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, 48 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Rotating armor plates
    for (let i = 0; i < 4; i++) {
      const a = this.armorAngle + (Math.PI / 2) * i;
      const ax = Math.cos(a) * 28 * pulse;
      const ay = Math.sin(a) * 28 * pulse;
      ctx.fillStyle = COLORS.NEBULA_ARMOR;
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.NEBULA_ARMOR_DARK;
      ctx.beginPath();
      ctx.arc(ax, ay, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side armor (left and right)
    for (const s of [-1, 1]) {
      ctx.fillStyle = COLORS.NEBULA_ARMOR;
      fillPolygon(ctx, [[s * 35, -10], [s * 20, -20], [s * 15, 0], [s * 20, 15], [s * 35, 10]]);
      ctx.fillStyle = COLORS.NEBULA_ARMOR_DARK;
      fillPolygon(ctx, [[s * 32, -6], [s * 22, -14], [s * 18, 0], [s * 22, 10], [s * 32, 6]]);
    }

    // Core, swelling while it charges
    const charge = this.state === 'active' ? this.charge : 0;
    ctx.fillStyle = COLORS.NEBULA_CORE;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse + charge * 3, 0, Math.PI * 2);
    ctx.fill();
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * pulse);
    gradient.addColorStop(0, COLORS.UI_WHITE);
    gradient.addColorStop(0.3, COLORS.NEBULA_GLOW);
    gradient.addColorStop(1, COLORS.NEBULA_CORE);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Black cracks across the body (ECLIPSE's mark)
    ctx.strokeStyle = COLORS.NEBULA_CRACK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, -4); ctx.lineTo(-22, 2); ctx.lineTo(-12, -6); ctx.lineTo(-4, 4);
    ctx.moveTo(30, -8); ctx.lineTo(20, 6); ctx.lineTo(9, 0); ctx.lineTo(3, 12);
    ctx.moveTo(-6, -20); ctx.lineTo(0, -12); ctx.lineTo(6, -18);
    ctx.stroke();

    // Erosion cracks glow; the flaring one burns bright (telegraph)
    NEBULA_EROSION_POINTS.forEach(([ex, ey], i) => {
      const flaring = this.erosionFlare === i;
      ctx.fillStyle = flaring ? COLORS.UI_WHITE : COLORS.NEBULA_EROSION;
      ctx.globalAlpha = flaring ? 1 : (enraged ? 0.8 : 0.45);
      ctx.beginPath();
      ctx.arc(ex, ey, flaring ? 4 + (1 - this.erosionTimer / NEBULA_EROSION_CHARGE) * 3 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Bottom cannon
    ctx.fillStyle = COLORS.NEBULA_ARMOR;
    ctx.fillRect(-4, 18, 8, 14);
    ctx.fillStyle = enraged ? COLORS.NEBULA_GLOW : COLORS.NEBULA_CORE;
    ctx.beginPath();
    ctx.arc(0, 32, 4, 0, Math.PI * 2);
    ctx.fill();

    // Charge telegraph: a white ring closing in on the core
    if (charge > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + charge * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, 40 - charge * 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (enraged) {
      ctx.strokeStyle = COLORS.UI_RED;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4 + Math.sin(this.frame * 0.2) * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, 36 * corePulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

registerBoss('nebulaHeart', NebulaHeart, NEBULA_HEART_NAME);
