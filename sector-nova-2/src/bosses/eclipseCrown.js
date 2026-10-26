// ============================================================
// SECTOR NOVA 2 - ECLIPSE CROWN (S6 final boss, DESIGN.md 14)
// ------------------------------------------------------------
// A black sphere ringed by six golden crown shards; its rim glows
// white like an eclipse. Three forms, each with its own HP (the boss
// items count 75 / 50 / 25% again in every form). A form change
// clears the hostile fire and shows the form name for 2 seconds
// (BossBase transition).
//   1 CROWN: six shards (HP 15) circle the core and shield it; a
//     broken shard grows back after 8 seconds. Attacks: a full ring
//     from the core, and aimed shots from the shards in turn.
//   2 ECLIPSE: the screen goes dark except ECLIPSE_LIGHT_RADIUS around
//     the ship (Game draws the dark; `darkness` asks for it). Only the
//     core's rim light shows. Slow double spiral and telegraphed
//     straight lasers. Hostile bullets get a light ring and are drawn
//     above the dark.
//   3 SUPERNOVA: the backdrop pulses red and a 60-second countdown
//     runs (HUD). Telegraphed rotating laser (its sweep is shown as a
//     faint wedge), aimed fan and ring. At 0: BAD END
//     (world.onSupernova()).
// Every attack is telegraphed: the core (or the shard) glows
// CROWN_CHARGE frames first; lasers warn for 60 frames.
// ============================================================

const ECLIPSE_CROWN_NAME = 'ECLIPSE CROWN';
const ECLIPSE_FORM_NAMES = ['CROWN', 'ECLIPSE', 'SUPERNOVA'];

/**
 * SUPERNOVA's rotating laser: a beam Hazard whose warning also shows
 * the whole wedge it will sweep while active.
 */
class SweepLaser extends Hazard {
  draw(ctx) {
    if (this.alive && this.isWarning) {
      const sweep = this.angularSpeed * this.activeFrames;
      ctx.save();
      ctx.globalAlpha = 0.16 + (Math.floor(this.timer / 6) % 2) * 0.08;
      ctx.fillStyle = this.warnColor;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.arc(this.x, this.y, this.length, Math.min(this.angle, this.angle + sweep), Math.max(this.angle, this.angle + sweep));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    super.draw(ctx);
  }
}

class EclipseCrown extends BossBase {
  constructor() {
    const form = (i, run, onEnter) => ({
      name: ECLIPSE_FORM_NAMES[i],
      hp: ECLIPSE_CROWN_HP[i],
      startDelay: 40,
      attacks: [{ run, duration: 1, rest: 0 }],
      onEnter,
    });
    super({
      name: ECLIPSE_CROWN_NAME,
      maxHp: ECLIPSE_CROWN_HP[0],
      radius: ECLIPSE_CROWN_RADIUS,
      targetY: ECLIPSE_CROWN_TARGET_Y,
      score: ECLIPSE_CROWN_SCORE,
      damageCap: ECLIPSE_CROWN_DAMAGE_CAP,
      phases: [
        form(0, 'crownTick', (b) => b.enterCrown()),
        form(1, 'eclipseTick', (b) => b.enterEclipse()),
        form(2, 'novaTick', (b) => b.enterNova()),
      ],
    });
    this.swayPhase = 0;
    this.spin = 0;
    this.charge = 0;          // 0..1 while the core charges
    this.shards = [];
    for (let i = 0; i < CROWN_SHARDS; i++) {
      const shard = new BossPart({
        name: 'SHARD', radius: CROWN_SHARD_RADIUS, hp: CROWN_SHARD_HP,
        score: CROWN_SHARD_SCORE, regenFrames: CROWN_SHARD_REGEN,
      });
      shard.index = i;
      shard.lit = 0;          // > 0: glowing, fires when it reaches 0
      this.shards.push(shard);
    }
    this.placeShards();
    this.novaTimer = SUPERNOVA_FRAMES;
    this.timeUp = false;
  }

  // --- State --------------------------------------------------------

  get form() {
    return this.phaseIndex;
  }

  /** ECLIPSE form: Game darkens the screen around the ship. */
  get darkness() {
    return this.form === 1 && this.state === 'active';
  }

  /** SUPERNOVA form: the backdrop pulses red. */
  get supernova() {
    return this.form === 2 && (this.state === 'active' || this.state === 'dying');
  }

  /** Seconds left in SUPERNOVA (HUD), or null. */
  get countdownSeconds() {
    return this.form === 2 && this.state === 'active' ? Math.ceil(this.novaTimer / FPS) : null;
  }

  // --- Forms ---------------------------------------------------------

  enterCrown() {
    this.parts = this.shards;
    this.ringTimer = 60;
    this.ringState = 'rest';
    this.shardTimer = CROWN_SHARD_SHOT_INTERVAL;
    this.shardNext = 0;
  }

  enterEclipse() {
    this.parts = [];          // the crown shatters into the dark
    this.charge = 0;
    this.spiralState = 'rest';
    this.spiralTimer = 50;
    this.spiralAngle = 0;
    this.laserTimer = 120;
  }

  enterNova() {
    this.charge = 0;
    this.novaTimer = SUPERNOVA_FRAMES;
    this.laserState = 'rest';
    this.laserTimer = 60;
    this.laserDir = 1;
    this.shotState = 'rest';
    this.shotTimer = 90;
    this.shotKind = 0;
  }

  // --- Movement --------------------------------------------------------

  updateMovement(world) {
    // SUPERNOVA's countdown runs every fighting frame (not only while attacking).
    if (this.form === 2 && --this.novaTimer <= 0 && !this.timeUp) {
      this.timeUp = true;
      world.onSupernova(this);
      return;
    }
    this.swayPhase += ECLIPSE_CROWN_SWAY_SPEED * (this.form === 2 ? 1.4 : 1);
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.swayPhase) * ECLIPSE_CROWN_SWAY;
    this.spin += CROWN_SHARD_SPIN;
    this.placeShards();
  }

  placeShards() {
    for (const s of this.shards) {
      const a = this.spin + (Math.PI * 2 / CROWN_SHARDS) * s.index;
      s.ox = Math.cos(a) * CROWN_SHARD_ORBIT;
      s.oy = Math.sin(a) * CROWN_SHARD_ORBIT;
    }
  }

  /** Core charge helper: counts down `timer`, glowing for the last CROWN_CHARGE frames. */
  coreCharge(timer) {
    this.charge = timer <= CROWN_CHARGE ? 1 - timer / CROWN_CHARGE : 0;
  }

  // --- Form 1: CROWN ----------------------------------------------------

  crownTick(world) {
    // Full ring from the core
    this.coreCharge(--this.ringTimer);
    if (this.ringTimer <= 0) {
      world.addEnemyBullets(Patterns.ring({
        x: this.x, y: this.y, count: CROWN_RING_COUNT, speed: CROWN_RING_SPEED,
        offset: this.spin, kind: 'boss',
      }));
      this.ringTimer = scaledFireInterval(CROWN_RING_REST) + CROWN_CHARGE;
    }
    // Aimed shots from the shards in turn: glow, then fire
    for (const s of this.shards) {
      if (s.lit > 0 && --s.lit === 0 && s.alive) {
        world.addEnemyBullets(Patterns.aimed({
          x: s.x(this), y: s.y(this), tx: world.player.x, ty: world.player.y,
          speed: CROWN_SHARD_SHOT_SPEED, kind: 'boss',
        }));
      }
    }
    if (--this.shardTimer <= 0) {
      this.shardTimer = scaledFireInterval(CROWN_SHARD_SHOT_INTERVAL);
      for (let k = 0; k < CROWN_SHARDS; k++) {
        const s = this.shards[(this.shardNext + k) % CROWN_SHARDS];
        if (s.alive) {
          s.lit = CROWN_CHARGE;
          this.shardNext = (s.index + 1) % CROWN_SHARDS;
          break;
        }
      }
    }
  }

  // --- Form 2: ECLIPSE ---------------------------------------------------

  eclipseTick(world) {
    // Slow double spiral (two arms turning opposite ways)
    this.spiralTimer--;
    switch (this.spiralState) {
      case 'rest':
        if (this.spiralTimer <= CROWN_CHARGE) this.coreCharge(this.spiralTimer);
        if (this.spiralTimer <= 0) {
          this.spiralState = 'fire';
          this.spiralTimer = ECLIPSE_SPIRAL_FRAMES;
          this.spiralAngle = angleTo(this.x, this.y, world.player.x, world.player.y);
          this.charge = 0;
        }
        break;
      case 'fire':
        if (this.spiralTimer % ECLIPSE_SPIRAL_EVERY === 0) {
          this.spiralAngle += ECLIPSE_SPIRAL_TURN;
          for (const a of [this.spiralAngle, Math.PI - this.spiralAngle]) {
            world.addEnemyBullets(Patterns.spiral({ x: this.x, y: this.y, arms: 1, speed: ECLIPSE_SPIRAL_SPEED, angle: a, kind: 'boss' }));
          }
        }
        if (this.spiralTimer <= 0) {
          this.spiralState = 'rest';
          this.spiralTimer = scaledFireInterval(ECLIPSE_SPIRAL_REST) + CROWN_CHARGE;
        }
        break;
    }
    // A straight laser at the ship (60-frame warning line)
    if (--this.laserTimer <= 0) {
      this.laserTimer = scaledFireInterval(170);
      world.addHazard(new Hazard({
        shape: 'beam', x: this.x, y: this.y,
        angle: angleTo(this.x, this.y, world.player.x, world.player.y),
        length: CANVAS_HEIGHT * 1.4, width: ECLIPSE_LASER_WIDTH,
        warnFrames: ECLIPSE_LASER_WARN, activeFrames: ECLIPSE_LASER_ACTIVE,
        color: COLORS.CROWN_LASER, tag: 'laser',
      }));
    }
  }

  // --- Form 3: SUPERNOVA ---------------------------------------------------

  novaTick(world) {
    if (this.timeUp) return; // BAD END has begun
    // Rotating laser: aimed at the ship, then sweeps one way (alternating)
    if (--this.laserTimer <= 0) {
      this.laserDir = -this.laserDir;
      world.addHazard(new SweepLaser({
        shape: 'beam', x: this.x, y: this.y,
        angle: angleTo(this.x, this.y, world.player.x, world.player.y),
        angularSpeed: SUPERNOVA_LASER_SPIN * this.laserDir,
        length: CANVAS_HEIGHT * 1.4, width: SUPERNOVA_LASER_WIDTH,
        warnFrames: SUPERNOVA_LASER_WARN, activeFrames: SUPERNOVA_LASER_ACTIVE,
        color: COLORS.CROWN_LASER, tag: 'laser',
        follow: (h) => { h.x = this.x; h.y = this.y; },
      }));
      this.laserTimer = SUPERNOVA_LASER_WARN + SUPERNOVA_LASER_ACTIVE + scaledFireInterval(SUPERNOVA_LASER_REST);
    }
    // Aimed fan and ring, in turn, after the core glows
    this.coreCharge(--this.shotTimer);
    if (this.shotTimer <= 0) {
      if (this.shotKind++ % 2 === 0) {
        world.addEnemyBullets(Patterns.fan({
          x: this.x, y: this.y + 12, angle: angleTo(this.x, this.y, world.player.x, world.player.y),
          count: SUPERNOVA_FAN_COUNT, step: SUPERNOVA_FAN_STEP, speed: SUPERNOVA_FAN_SPEED, kind: 'boss',
        }));
      } else {
        world.addEnemyBullets(Patterns.ring({
          x: this.x, y: this.y, count: SUPERNOVA_RING_COUNT, speed: SUPERNOVA_RING_SPEED,
          offset: this.frame * 0.05, kind: 'boss',
        }));
      }
      this.shotTimer = scaledFireInterval(SUPERNOVA_SHOT_REST) + CROWN_CHARGE;
    }
  }

  // --- Draw --------------------------------------------------------------

  drawBody(ctx) {
    const form = this.form;
    const r = this.radius;
    const nova = form === 2;

    // Rim light (eclipse corona), redder in SUPERNOVA
    this.drawRim(ctx, 1);

    // The black core
    ctx.fillStyle = COLORS.CROWN_CORE;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    if (nova) {
      // Cracks of light breaking through
      ctx.strokeStyle = COLORS.SUPERNOVA_RED;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7 + Math.sin(this.frame * 0.3) * 0.3;
      ctx.beginPath();
      ctx.moveTo(-14, -12); ctx.lineTo(-4, -2); ctx.lineTo(-10, 10);
      ctx.moveTo(12, -14); ctx.lineTo(4, 0); ctx.lineTo(14, 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Crown shards (form 1)
    if (form === 0 || (this.state === 'entering')) {
      for (const s of this.shards) {
        if (!s.alive) {
          // Regrowing: a faint outline that fills in
          const k = 1 - s.regenTimer / CROWN_SHARD_REGEN;
          ctx.globalAlpha = 0.15 + k * 0.25;
          this.drawShard(ctx, s, false);
          ctx.globalAlpha = 1;
          continue;
        }
        this.drawShard(ctx, s, s.lit > 0);
      }
    }
  }

  /** White rim around the core, plus the charge telegraph. */
  drawRim(ctx, alpha) {
    const r = this.radius;
    const nova = this.form === 2;
    const pulse = 1 + Math.sin(this.frame * 0.08) * 0.06;
    ctx.save();
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = nova ? COLORS.SUPERNOVA_RED : COLORS.CROWN_RIM;
    ctx.beginPath();
    ctx.arc(0, 0, (r + 9) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS.CROWN_RIM;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1, 0, Math.PI * 2);
    ctx.stroke();
    // Charging: the rim brightens and a ring closes in
    const charge = this.state === 'active' ? this.charge : 0;
    if (charge > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha * (0.4 + charge * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, r + 26 - charge * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Drawn above the dark in ECLIPSE (Game): only the rim light (and
   * its charge ring) shows where the core is.
   */
  drawGlow(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    this.drawRim(ctx, 1);
    ctx.restore();
  }

  drawShard(ctx, s, lit) {
    ctx.save();
    ctx.translate(s.ox, s.oy);
    ctx.rotate(Math.atan2(s.oy, s.ox) + Math.PI / 2);
    ctx.fillStyle = lit ? COLORS.UI_WHITE : COLORS.CROWN_GOLD;
    fillPolygon(ctx, [[0, -14], [7, 2], [4, 9], [-4, 9], [-7, 2]]);
    ctx.fillStyle = COLORS.CROWN_GOLD_DARK;
    fillPolygon(ctx, [[0, -6], [3, 3], [-3, 3]]);
    if (lit) {
      const k = 1 - s.lit / CROWN_CHARGE;
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + k * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, 16 - k * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

registerBoss('eclipseCrown', EclipseCrown, ECLIPSE_CROWN_NAME);
