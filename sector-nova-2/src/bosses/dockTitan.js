// ============================================================
// SECTOR NOVA 2 - DOCK TITAN (S2 boss, DESIGN.md 14)
// ------------------------------------------------------------
// A wide harbor work robot (about 120 px): a core in the middle and
// an arm turret on each side.
//   Form 1 (arms): the arms take turns firing an aimed 3-way spread.
//     While an arm is left, the core takes only 30% damage.
//     A broken arm (part-break bonus) comes loose: it hangs for
//     TITAN_ARM_WARN_FRAMES over a shadow lane, then sinks slowly as
//     an obstacle (hurts on contact, can be shot for points).
//   Form 2 (core, both arms gone): the core takes full damage. Slow
//     homing missiles (HP 1, can be shot down) and a 12-way ring.
//   Below 50% core HP: faster side-to-side movement, 6 missiles.
// Every attack is announced DOCK_TITAN_CHARGE frames ahead: the arm
// muzzle, the missile bays or the core glows first.
// ============================================================

const DOCK_TITAN_NAME = 'DOCK TITAN';

/**
 * A broken arm. Hangs where it broke off (shadow lane below, cannot
 * be touched), then sinks as an obstacle.
 */
class TitanArm extends Enemy {
  constructor(x, y, side) {
    super(x, y, 'TITAN_ARM');
    this.hp = TITAN_ARM_HP;
    this.score = TITAN_ARM_SCORE;
    this.radius = DOCK_TITAN_ARM_RADIUS;
    this.side = side;
    this.warn = TITAN_ARM_WARN_FRAMES;
    this.fromBoss = true;
    this.survivesRam = true; // an obstacle: touching it hurts, it stays
    this.largeFlag = true;
    this.spin = 0;
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
    this.y += TITAN_ARM_FALL_SPEED;
    this.spin += 0.01 * this.side;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    if (this.warn > 0) {
      ctx.save();
      ctx.globalAlpha = Math.floor(this.warn / 5) % 2 === 0 ? 0.3 : 0.15;
      ctx.fillStyle = COLORS.DOCK_STRIPE;
      ctx.fillRect(this.x - this.radius, this.y, this.radius * 2, CANVAS_HEIGHT);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    drawTitanArm(ctx, this.side, this.warn > 0 && Math.floor(this.frame / 4) % 2 === 0);
    ctx.restore();
  }
}

/** Slow homing missile; one hit destroys it. */
class TitanMissile extends Enemy {
  constructor(x, y, angle) {
    super(x, y, 'TITAN_MISSILE');
    this.hp = TITAN_MISSILE_HP;
    this.score = TITAN_MISSILE_SCORE;
    this.radius = TITAN_MISSILE_RADIUS;
    this.angle = angle;
    this.life = TITAN_MISSILE_LIFE;
    this.fromBoss = true;
    this.noDrop = true;
  }

  update(player) {
    this.frame++;
    if (player && player.alive) {
      const want = angleTo(this.x, this.y, player.x, player.y);
      let diff = want - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += clamp(diff, -TITAN_MISSILE_TURN, TITAN_MISSILE_TURN);
    }
    this.x += Math.cos(this.angle) * TITAN_MISSILE_SPEED;
    this.y += Math.sin(this.angle) * TITAN_MISSILE_SPEED;
    if (--this.life <= 0 || isOutsideScreen(this.x, this.y)) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Exhaust flicker
    ctx.fillStyle = COLORS.DOCK_CORE;
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fillRect(-10, -1.5, 4, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.DOCK_MISSILE;
    fillPolygon(ctx, [[-6, -3], [4, -3], [8, 0], [4, 3], [-6, 3]]);
    ctx.fillStyle = COLORS.UI_RED;
    ctx.fillRect(2, -1, 3, 2);
    ctx.restore();
  }
}

/** Arm turret shape around (0, 0); side -1 = left, 1 = right. */
function drawTitanArm(ctx, side, hot) {
  ctx.fillStyle = COLORS.DOCK_BODY;
  fillPolygon(ctx, [[-14, -12], [14, -12], [16, 6], [8, 16], [-8, 16], [-16, 6]]);
  ctx.fillStyle = COLORS.DOCK_DARK;
  fillPolygon(ctx, [[-9, -7], [9, -7], [10, 5], [-10, 5]]);
  // Hazard stripes on the shoulder
  ctx.fillStyle = COLORS.DOCK_STRIPE;
  for (let i = -2; i <= 1; i++) fillPolygon(ctx, [[i * 7, -12], [i * 7 + 4, -12], [i * 7 + 1, -8], [i * 7 - 3, -8]]);
  // Twin barrels
  ctx.fillStyle = COLORS.DOCK_PLATE;
  ctx.fillRect(-6, 12, 4, 9);
  ctx.fillRect(2, 12, 4, 9);
  ctx.fillStyle = hot ? COLORS.DOCK_CORE_HOT : COLORS.DOCK_CORE;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
}

class DockTitan extends BossBase {
  constructor() {
    super({
      name: DOCK_TITAN_NAME,
      maxHp: DOCK_TITAN_HP,
      radius: DOCK_TITAN_RADIUS,
      targetY: DOCK_TITAN_TARGET_Y,
      score: DOCK_TITAN_SCORE,
      damageCap: DOCK_TITAN_DAMAGE_CAP,
      phases: [
        {
          name: 'ARMS',
          startDelay: 40,
          endWhen: (b) => b.armsLeft === 0,
          attacks: [{ run: 'armVolley', duration: DOCK_TITAN_CHARGE, rest: DOCK_TITAN_ARM_REST }],
        },
        {
          name: 'CORE EXPOSED',
          startDelay: 40,
          onEnter: (b) => { b.charge = null; },
          attacks: [
            { run: 'missiles', duration: DOCK_TITAN_CHARGE, rest: DOCK_TITAN_MISSILE_REST },
            { run: 'ring', duration: DOCK_TITAN_CHARGE, rest: DOCK_TITAN_RING_REST },
          ],
        },
      ],
    });
    const arm = (side) => new BossPart({
      name: side < 0 ? 'LEFT ARM' : 'RIGHT ARM',
      ox: side * DOCK_TITAN_ARM_X,
      oy: 6,
      radius: DOCK_TITAN_ARM_RADIUS,
      hp: DOCK_TITAN_ARM_HP,
      score: DOCK_TITAN_ARM_BONUS,
      onDestroy: (boss, part, world) => {
        world.addEnemy(new TitanArm(part.x(boss), part.y(boss), side));
      },
    });
    this.parts = [arm(-1), arm(1)];
    this.parts[0].side = -1;
    this.parts[1].side = 1;
    this.nextArm = 0;      // which arm fires next
    this.volleyArm = null; // arm charging the current volley
    this.charge = null;    // { what, k } while an attack is being announced
    this.swayPhase = 0;
  }

  get armsLeft() {
    return this.parts.filter(p => p.alive).length;
  }

  /** Core destroyed while an arm is left: straight to the defeat. */
  checkPhaseEnd(world) {
    if (this.hp <= 0 && this.phaseIndex === 0) {
      this.beginDefeat(world);
      return true;
    }
    return super.checkPhaseEnd(world);
  }

  damageMultiplier(source) {
    return this.armsLeft > 0 ? DOCK_TITAN_ARMED_DAMAGE : 1;
  }

  updateMovement() {
    const speed = this.phaseIndex === 0 ? DOCK_TITAN_SWAY_SPEED
      : this.isEnraged ? DOCK_TITAN_SWAY_SPEED_ENRAGED : DOCK_TITAN_SWAY_SPEED_CORE;
    this.swayPhase += speed;
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.swayPhase) * DOCK_TITAN_SWAY;
  }

  /** Charge for DOCK_TITAN_CHARGE frames; true on the frame to fire. */
  charging(what, t) {
    this.charge = { what, k: (t + 1) / DOCK_TITAN_CHARGE };
    if (t < DOCK_TITAN_CHARGE - 1) return false;
    this.charge = null;
    return true;
  }

  /**
   * The arms take turns; with one arm left it fires every time. If the
   * charging arm breaks, the volley is called off.
   */
  armVolley(world, t) {
    if (t === 0) {
      const alive = this.parts.filter(p => p.alive);
      this.volleyArm = alive.length ? alive[this.nextArm++ % alive.length] : null;
    }
    const arm = this.volleyArm;
    if (!arm || !arm.alive) {
      this.charge = null;
      return;
    }
    if (!this.charging(arm, t)) return;
    const x = arm.x(this);
    const y = arm.y(this) + 18;
    world.addEnemyBullets(Patterns.fan({
      x, y, angle: angleTo(x, y, world.player.x, world.player.y),
      count: DOCK_TITAN_FAN_COUNT, step: DOCK_TITAN_FAN_STEP, speed: DOCK_TITAN_FAN_SPEED, kind: 'boss',
    }));
  }

  missiles(world, t) {
    if (!this.charging('bays', t)) return;
    const n = this.isEnraged ? DOCK_TITAN_MISSILES_ENRAGED : DOCK_TITAN_MISSILES;
    for (let i = 0; i < n; i++) {
      // Fan out sideways and down, then turn toward the ship.
      const side = i % 2 === 0 ? -1 : 1;
      const rank = Math.floor(i / 2);
      const angle = Math.PI / 2 + side * (0.6 + rank * 0.35);
      world.addEnemy(new TitanMissile(this.x + side * 30, this.y + 6, angle));
    }
  }

  ring(world, t) {
    if (!this.charging('core', t)) return;
    world.addEnemyBullets(Patterns.ring({
      x: this.x, y: this.y, count: DOCK_TITAN_RING_COUNT, speed: DOCK_TITAN_RING_SPEED,
      offset: (this.frame * 0.05) % (Math.PI * 2), kind: 'boss',
    }));
  }

  drawBody(ctx) {
    const charge = this.state === 'active' ? this.charge : null;
    const enraged = this.isEnraged;

    // Crane beam joining the arms
    ctx.fillStyle = COLORS.DOCK_DARK;
    ctx.fillRect(-DOCK_TITAN_ARM_X, -4, DOCK_TITAN_ARM_X * 2, 10);
    ctx.fillStyle = COLORS.DOCK_STRIPE;
    for (let x = -DOCK_TITAN_ARM_X + 4; x < DOCK_TITAN_ARM_X - 4; x += 10) {
      fillPolygon(ctx, [[x, -4], [x + 5, -4], [x + 2, 6], [x - 3, 6]]);
    }

    // Hull
    ctx.fillStyle = COLORS.DOCK_BODY;
    fillPolygon(ctx, [[-30, -22], [30, -22], [36, -6], [30, 18], [-30, 18], [-36, -6]]);
    ctx.fillStyle = COLORS.DOCK_PLATE;
    fillPolygon(ctx, [[-24, -22], [24, -22], [20, -14], [-20, -14]]);
    ctx.fillStyle = COLORS.DOCK_DARK;
    fillPolygon(ctx, [[-24, -10], [24, -10], [26, 12], [-26, 12]]);

    // Missile bays (glow before a salvo)
    const baysHot = charge && charge.what === 'bays';
    for (const side of [-1, 1]) {
      ctx.fillStyle = baysHot ? (Math.floor(this.frame / 3) % 2 ? COLORS.DOCK_CORE_HOT : COLORS.DOCK_CORE) : COLORS.DOCK_DARK;
      ctx.fillRect(side * 30 - 4, 8, 8, 6);
    }

    // Core: armored shutter while an arm is left
    const pulse = 1 + Math.sin(this.frame * 0.15) * 0.12;
    const armed = this.armsLeft > 0;
    ctx.fillStyle = enraged ? COLORS.UI_RED : COLORS.DOCK_CORE;
    ctx.globalAlpha = armed ? 0.55 : 1;
    ctx.beginPath();
    ctx.arc(0, 0, 11 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.DOCK_CORE_HOT;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    if (armed) {
      ctx.strokeStyle = COLORS.DOCK_PLATE;
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-12, i * 6);
        ctx.lineTo(12, i * 6);
        ctx.stroke();
      }
    }
    if (charge && charge.what === 'core') {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + charge.k * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, 30 - charge.k * 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Arms (with a small HP bar each)
    for (const part of this.parts) {
      if (!part.alive) continue;
      ctx.save();
      ctx.translate(part.ox, part.oy);
      const hot = charge && charge.what === part;
      drawTitanArm(ctx, part.side, hot && Math.floor(this.frame / 3) % 2 === 0);
      if (hot) {
        ctx.strokeStyle = COLORS.UI_WHITE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + charge.k * 0.6;
        ctx.beginPath();
        ctx.arc(0, 20, 18 - charge.k * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#333';
      ctx.fillRect(-12, -18, 24, 3);
      ctx.fillStyle = COLORS.UI_GREEN;
      ctx.fillRect(-12, -18, 24 * (part.hp / part.maxHp), 3);
      ctx.restore();
    }
  }
}

registerBoss('dockTitan', DockTitan, DOCK_TITAN_NAME);
