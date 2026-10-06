// ============================================================
// SECTOR NOVA 2 - ORB CORE (BossBase reference boss)
// ------------------------------------------------------------
// SECTOR NOVA 1's Stage 1 boss rebuilt on BossBase to prove the
// framework in Phase 1: same HP, firing cadence, aimed 3-way
// spread, enrage below 50% HP, patrol movement and look as the
// original. Stage 1's boss becomes GLACIER MAW in Phase 4.
// ============================================================

const ORB_CORE_NAME = 'ORB CORE';

class OrbCore extends BossBase {
  constructor() {
    super({
      name: ORB_CORE_NAME,
      maxHp: ORB_CORE_HP,
      radius: BOSS_RADIUS,
      phases: [{
        name: ORB_CORE_NAME,
        startDelay: ORB_CORE_FIRE_INTERVAL,
        attacks: [{
          run: 'fireSpread',
          duration: 1,
          rest: (boss) => boss.isEnraged ? ORB_CORE_FIRE_INTERVAL_ENRAGED : ORB_CORE_FIRE_INTERVAL,
        }],
      }],
    });
    this.moveDir = 1; // 1 = right, -1 = left
    this.colors = {
      core: COLORS.BOSS_CORE,
      armor: COLORS.BOSS_ARMOR,
      armorDark: COLORS.BOSS_ARMOR_DARK,
      glow: COLORS.BOSS_GLOW,
    };
  }

  updateMovement() {
    // Horizontal patrol, faster while enraged.
    const speed = BOSS_SPEED * (this.isEnraged ? ORB_CORE_ENRAGED_MOVE_SCALE : 1);
    this.x += speed * this.moveDir;
    if (this.x > CANVAS_WIDTH - 50) this.moveDir = -1;
    if (this.x < 50) this.moveDir = 1;
  }

  /** Aimed 3-way spread from the bottom cannon. */
  fireSpread(world) {
    const enraged = this.isEnraged;
    const speed = (BOSS_BULLET_SPEED + (enraged ? ORB_CORE_ENRAGED_SPEED_BONUS : 0)) *
      ORB_CORE_BULLET_SPEED_SCALE;
    world.addEnemyBullets(Patterns.fan({
      x: this.x,
      y: this.y + 30,
      angle: angleTo(this.x, this.y, world.player.x, world.player.y),
      count: 3,
      step: enraged ? ORB_CORE_SPREAD_ENRAGED : ORB_CORE_SPREAD,
      speed,
      kind: 'boss',
    }));
  }

  drawBody(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.05) * 0.05;
    const corePulse = 1 + Math.sin(this.frame * 0.1) * 0.15;
    const armorAngle = this.frame * ORB_CORE_ARMOR_SPIN;
    const enraged = this.isEnraged;

    const cCore = this.colors.core;
    const cArmor = this.colors.armor;
    const cArmorDark = this.colors.armorDark;
    const cGlow = this.colors.glow;

    // --- Outer shield ring ---
    if (this.state !== 'dying') {
      ctx.strokeStyle = enraged ? cGlow : cArmor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 + Math.sin(this.frame * 0.03) * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, 48 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // --- Rotating armor plates ---
    for (let i = 0; i < 4; i++) {
      const angle = armorAngle + (Math.PI / 2) * i;
      const ax = Math.cos(angle) * 28 * pulse;
      const ay = Math.sin(angle) * 28 * pulse;

      ctx.fillStyle = cArmor;
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cArmorDark;
      ctx.beginPath();
      ctx.arc(ax, ay, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Side armor (mirrored left / right) ---
    for (const side of [-1, 1]) {
      ctx.fillStyle = cArmor;
      ctx.beginPath();
      ctx.moveTo(35 * side, -10);
      ctx.lineTo(20 * side, -20);
      ctx.lineTo(15 * side, 0);
      ctx.lineTo(20 * side, 15);
      ctx.lineTo(35 * side, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = cArmorDark;
      ctx.beginPath();
      ctx.moveTo(32 * side, -6);
      ctx.lineTo(22 * side, -14);
      ctx.lineTo(18 * side, 0);
      ctx.lineTo(22 * side, 10);
      ctx.lineTo(32 * side, 6);
      ctx.closePath();
      ctx.fill();
    }

    // --- Main core body ---
    ctx.fillStyle = cCore;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner core gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * pulse);
    gradient.addColorStop(0, COLORS.UI_WHITE);
    gradient.addColorStop(0.3, cGlow);
    gradient.addColorStop(1, cCore);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 16 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Core center bright point
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.8 + Math.sin(this.frame * 0.15) * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // --- Bottom cannon ---
    ctx.fillStyle = cArmor;
    ctx.fillRect(-4, 18, 8, 14);
    ctx.fillStyle = enraged ? cGlow : cCore;
    ctx.beginPath();
    ctx.arc(0, 32, 4, 0, Math.PI * 2);
    ctx.fill();

    // --- Enrage indicator: pulsing red ring ---
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

registerBoss('orbCore', OrbCore, ORB_CORE_NAME);
