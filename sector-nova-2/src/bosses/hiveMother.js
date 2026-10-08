// ============================================================
// SECTOR NOVA 2 - HIVE MOTHER (S4 boss, DESIGN.md 14)
// ------------------------------------------------------------
// A queen with a swollen, pulsing abdomen.
//   - Every 4 seconds she drops an egg (HP 6). The sac glows for
//     HIVE_MOTHER_EGG_WARN frames first. Eggs sink slowly and hatch
//     after 5 seconds (the shell cracks and shakes for the last
//     second) into HATCHLINGs: three SWARM-type, or one strong WISP.
//   - Spiral: the core glows, then a slowly turning 2-arm spiral.
//   - Below 50% HP: two eggs at a time, hatching after 4 seconds, and
//     a double spiral (two spirals turning opposite ways).
// The point: crush the eggs, or rush the queen?
// ============================================================

const HIVE_MOTHER_NAME = 'HIVE MOTHER';

class Egg extends Enemy {
  constructor(x, y, hatchFrames, kind) {
    super(x, y, 'EGG');
    this.hp = EGG_HP;
    this.score = EGG_SCORE;
    this.radius = EGG_RADIUS;
    this.hatchFrames = hatchFrames;
    this.timer = hatchFrames;
    this.kind = kind;           // 'swarm' (3 HATCHLINGs) or 'wisp' (1 HATCHLING WISP)
    this.fromBoss = true;
    this.noDrop = true;
  }

  get cracking() {
    return this.timer <= EGG_CRACK_FRAMES;
  }

  update() {
    this.frame++;
    this.y += EGG_SPEED;
    if (--this.timer <= 0) {
      // Hatch: the children come out where the egg was.
      if (this.kind === 'wisp') {
        this.spawned.push(markFromBoss(ENEMY_FACTORIES.HATCHLING_WISP(this.x, this.y)));
      } else {
        for (const dx of [-14, 0, 14]) this.spawned.push(markFromBoss(ENEMY_FACTORIES.HATCHLING(this.x + dx, this.y)));
      }
      this.alive = false;
      return;
    }
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    const shake = this.cracking ? Math.sin(this.frame * 1.3) * 1.5 : 0;
    ctx.translate(this.x + shake, this.y);
    // Glow grows as it nears hatching
    const k = 1 - this.timer / this.hatchFrames;
    ctx.globalAlpha = 0.2 + k * 0.4;
    ctx.fillStyle = COLORS.EGG_GLOW;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 + k * 3, 13 + k * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.EGG_SHELL;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Something moves inside
    ctx.fillStyle = COLORS.EGG_DARK;
    ctx.beginPath();
    ctx.ellipse(Math.sin(this.frame * 0.1) * 1.5, 1, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.cracking) {
      ctx.strokeStyle = COLORS.EGG_DARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, -2); ctx.lineTo(-3, -5); ctx.lineTo(0, -1); ctx.lineTo(4, -6); ctx.lineTo(7, -2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Hatchlings belong to the boss: they go when she is defeated. */
function markFromBoss(enemy) {
  enemy.fromBoss = true;
  return enemy;
}

class HiveMother extends BossBase {
  constructor() {
    super({
      name: HIVE_MOTHER_NAME,
      maxHp: HIVE_MOTHER_HP,
      radius: HIVE_MOTHER_RADIUS,
      targetY: HIVE_MOTHER_TARGET_Y,
      score: HIVE_MOTHER_SCORE,
      damageCap: HIVE_MOTHER_DAMAGE_CAP,
      phases: [{
        name: HIVE_MOTHER_NAME,
        attacks: [{ run: 'tick', duration: 1, rest: 0 }],
      }],
    });
    this.swayPhase = 0;
    this.eggTimer = HIVE_MOTHER_EGG_INTERVAL / 2;
    this.eggCount = 0;
    this.spiralState = 'rest';
    this.spiralTimer = 60;
    this.spiralAngle = 0;
  }

  get sacGlow() {
    return this.state === 'active' && this.eggTimer <= HIVE_MOTHER_EGG_WARN;
  }

  get spiralCharge() {
    return this.state === 'active' && this.spiralState === 'charge'
      ? 1 - this.spiralTimer / HIVE_MOTHER_SPIRAL_CHARGE : 0;
  }

  updateMovement() {
    this.swayPhase += HIVE_MOTHER_SWAY_SPEED;
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.swayPhase) * HIVE_MOTHER_SWAY;
  }

  /** Runs every frame: eggs and the spiral. */
  tick(world) {
    if (--this.eggTimer <= 0) {
      this.eggTimer = HIVE_MOTHER_EGG_INTERVAL;
      this.layEggs(world);
    }

    this.spiralTimer--;
    switch (this.spiralState) {
      case 'rest':
        if (this.spiralTimer <= 0) {
          this.spiralState = 'charge';
          this.spiralTimer = HIVE_MOTHER_SPIRAL_CHARGE;
        }
        break;
      case 'charge':
        if (this.spiralTimer <= 0) {
          this.spiralState = 'fire';
          this.spiralTimer = HIVE_MOTHER_SPIRAL_FRAMES;
          this.spiralAngle = angleTo(this.x, this.y, world.player.x, world.player.y);
        }
        break;
      case 'fire': {
        const every = this.isEnraged ? HIVE_MOTHER_SPIRAL_EVERY_ENRAGED : HIVE_MOTHER_SPIRAL_EVERY;
        if (this.spiralTimer % every === 0) this.fireSpiral(world);
        if (this.spiralTimer <= 0) {
          this.spiralState = 'rest';
          this.spiralTimer = HIVE_MOTHER_SPIRAL_REST;
        }
        break;
      }
    }
  }

  fireSpiral(world) {
    this.spiralAngle += HIVE_MOTHER_SPIRAL_TURN;
    const y = this.y + 10;
    world.addEnemyBullets(Patterns.spiral({
      x: this.x, y, arms: HIVE_MOTHER_SPIRAL_ARMS, speed: HIVE_MOTHER_SPIRAL_SPEED, angle: this.spiralAngle, kind: 'boss',
    }));
    if (this.isEnraged) {
      // Double spiral: a second one turning the other way.
      world.addEnemyBullets(Patterns.spiral({
        x: this.x, y, arms: HIVE_MOTHER_SPIRAL_ARMS, speed: HIVE_MOTHER_SPIRAL_SPEED, angle: -this.spiralAngle, kind: 'boss',
      }));
    }
  }

  layEggs(world) {
    const enraged = this.isEnraged;
    const hatch = enraged ? EGG_HATCH_FRAMES_ENRAGED : EGG_HATCH_FRAMES;
    const offsets = enraged ? [-22, 22] : [randInt(-30, 30)];
    for (const dx of offsets) {
      const kind = this.eggCount++ % 3 === 2 ? 'wisp' : 'swarm';
      world.addEnemy(new Egg(clamp(this.x + dx, 20, CANVAS_WIDTH - 20), this.y + 32, hatch, kind));
    }
  }

  drawBody(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.08) * 0.05;
    const enraged = this.isEnraged;

    // Legs
    ctx.strokeStyle = COLORS.HIVE_MOTHER_DARK;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      for (const s of [-1, 1]) {
        const swing = Math.sin(this.frame * 0.1 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(s * 10, -16 + i * 6);
        ctx.lineTo(s * (30 + i * 4), -26 + i * 10 + swing);
        ctx.lineTo(s * (38 + i * 4), -10 + i * 12 + swing);
        ctx.stroke();
      }
    }

    // Abdomen: the swollen egg sac
    ctx.save();
    ctx.translate(0, 10);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.HIVE_MOTHER_BODY;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    // Segments
    ctx.strokeStyle = COLORS.HIVE_MOTHER_DARK;
    ctx.lineWidth = 2;
    for (const y of [-10, 2, 14]) {
      ctx.beginPath();
      ctx.ellipse(0, y, 30 - Math.abs(y) * 0.6, 4, 0, 0, Math.PI);
      ctx.stroke();
    }
    // Sac glows before an egg drops
    const glow = this.sacGlow;
    ctx.fillStyle = glow && Math.floor(this.frame / 4) % 2 === 0 ? COLORS.HIVE_MOTHER_GLOW : COLORS.HIVE_MOTHER_SAC;
    ctx.beginPath();
    ctx.ellipse(0, 16, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Thorax and head
    ctx.fillStyle = COLORS.HIVE_MOTHER_DARK;
    ctx.beginPath();
    ctx.ellipse(0, -18, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.HIVE_MOTHER_BODY;
    ctx.beginPath();
    ctx.arc(0, -33, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enraged ? COLORS.UI_RED : COLORS.HIVE_MOTHER_EYE;
    ctx.fillRect(-6, -36, 4, 3);
    ctx.fillRect(2, -36, 4, 3);
    // Crown of spines
    ctx.fillStyle = COLORS.HIVE_MOTHER_SAC;
    for (let i = -2; i <= 2; i++) fillPolygon(ctx, [[i * 4 - 2, -40], [i * 4 + 2, -40], [i * 5, -48 - (2 - Math.abs(i)) * 2]]);

    // Core in the abdomen; it glows and a ring closes in before a spiral
    const charge = this.spiralCharge;
    ctx.fillStyle = charge > 0 ? COLORS.HIVE_MOTHER_GLOW : COLORS.HIVE_MOTHER_SAC;
    ctx.beginPath();
    ctx.arc(0, 6, 6 + charge * 3, 0, Math.PI * 2);
    ctx.fill();
    if (charge > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + charge * 0.6;
      ctx.beginPath();
      ctx.arc(0, 6, 30 - charge * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

registerBoss('hiveMother', HiveMother, HIVE_MOTHER_NAME);
