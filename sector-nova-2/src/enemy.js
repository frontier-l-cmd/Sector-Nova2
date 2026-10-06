// ============================================================
// SECTOR NOVA 2 - Enemies
// ------------------------------------------------------------
// Enemies are spawned by the stage timeline (timeline.js) through
// ENEMY_FACTORIES and fire through patterns.js.
//
// This file holds two sets:
//   - SECTOR NOVA 1 enemies (A / B / C / SHIELD / SPLIT / FORM /
//     RUSH / TURRET): still used by the provisional Stage 1
//     timeline; removed when Stage 1 is rebuilt in Phase 4.
//   - SECTOR NOVA 2 enemies (DESIGN.md 11): SHARD, WISP, SNIPER,
//     MINE LAYER, GUN DECK, CARRIER, MIRROR, PHASE GHOST, SWARM,
//     FLARE SPIRIT, LINK GUARD and the derived DRONE, MINE,
//     HATCHLING, GOLD SHARD / GOLD GHOST (bottom of the file).
//
// Shared hooks the game uses (base class):
//   takeHit(amount, source, dirX, dirY) : damage after the LINK
//                     GUARD barrier; applyDamage() is the override
//                     point for weak spots / armor
//   isHittable      : false while intangible (PHASE GHOST)
//   ground          : ground units never ram the ship
//   spawned[]       : children to add this frame (DRONE, MINE)
//   deathBullets()  : bullets fired when destroyed (FLARE SPIRIT)
//   formation       : shared group for formation bonuses (SWARM)
// ============================================================

/**
 * Base enemy class
 */
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.alive = true;
    this.frame = 0;
    this.spawnX = x; // Remember spawn position for wave movement
    this.spawned = [];
    this.linkedBy = null;  // LINK GUARD protecting this enemy
    this.shieldFlash = 0;  // frames of "blocked" flash
    this.ground = false;
    this.noDrop = false;   // derived enemies (MINE, DRONE) drop no items
    this.formation = null;
    this.largeFlag = undefined;
  }

  /** Large enemies give more NOVA gauge when destroyed. */
  get large() {
    return this.largeFlag ?? (this.radius >= LARGE_ENEMY_RADIUS);
  }

  /** False while the enemy cannot be touched at all (PHASE GHOST). */
  get isHittable() {
    return true;
  }

  get isLinked() {
    return !!(this.linkedBy && this.linkedBy.alive);
  }

  /**
   * Check if off screen (below)
   */
  isOffScreen() {
    return this.y > CANVAS_HEIGHT + ENEMY_SPAWN_LEAVE_MARGIN;
  }

  /**
   * A player attack lands. Linked enemies (LINK GUARD) take no damage.
   * (dirX, dirY) is the direction the attack travels, when known.
   * Returns the damage actually dealt.
   */
  takeHit(amount, source, dirX, dirY) {
    if (this.isLinked) {
      this.shieldFlash = 6;
      return 0;
    }
    return this.applyDamage(amount, source, dirX, dirY);
  }

  /**
   * Apply damage. `source` is 'bullet' | 'rail' | 'chain' | 'burst'.
   * Subclasses reduce it by source / direction (ShieldEnemy, Mirror).
   */
  applyDamage(amount, source) {
    this.hp -= amount;
    return amount;
  }

  /**
   * Called once when the enemy dies. Returns an array of enemies to
   * spawn in its place (used by SplitEnemy). Default: none.
   */
  onDeath() {
    return [];
  }

  /** Hostile bullets released when destroyed by the player. Default: none. */
  deathBullets() {
    return [];
  }

  /** Cyan ring shown while a LINK GUARD shields this enemy. */
  drawLinkShield(ctx) {
    if (!this.isLinked) return;
    ctx.save();
    ctx.strokeStyle = COLORS.LINK_BEAM;
    ctx.globalAlpha = this.shieldFlash > 0 ? 1 : 0.5;
    ctx.lineWidth = this.shieldFlash > 0 ? 2 : 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (this.shieldFlash > 0) this.shieldFlash--;
  }
}

// ============================================================
// Enemy A: Straight mover
// ============================================================
class EnemyA extends Enemy {
  constructor(x, y) {
    super(x, y, 'A');
    this.hp = ENEMY_A_HP;
    this.score = ENEMY_A_SCORE;
    this.speed = ENEMY_A_SPEED;
    this.radius = ENEMY_A_RADIUS;
  }

  update() {
    this.y += this.speed;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Body (diamond shape)
    ctx.fillStyle = COLORS.ENEMY_A;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = COLORS.ENEMY_A_DARK;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Eye/core
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================
// Enemy B: Weaving (sine wave) mover
// ============================================================
class EnemyB extends Enemy {
  constructor(x, y) {
    super(x, y, 'B');
    this.hp = ENEMY_B_HP;
    this.score = ENEMY_B_SCORE;
    this.speed = ENEMY_B_SPEED;
    this.radius = ENEMY_B_RADIUS;
    this.waveOffset = Math.random() * Math.PI * 2; // Randomize wave phase
  }

  update() {
    this.y += this.speed;
    this.x = this.spawnX + Math.sin(this.frame * ENEMY_B_WAVE_FREQ + this.waveOffset) * ENEMY_B_WAVE_AMP;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Wings (rotating slightly based on movement)
    const tilt = Math.sin(this.frame * ENEMY_B_WAVE_FREQ + this.waveOffset) * 0.2;
    ctx.rotate(tilt);

    // Left wing
    ctx.fillStyle = COLORS.ENEMY_B;
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(-12, 2);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-2, 4);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(3, -4);
    ctx.lineTo(12, 2);
    ctx.lineTo(8, 8);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();

    // Body (oval)
    ctx.fillStyle = COLORS.ENEMY_B;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark inner body
    ctx.fillStyle = COLORS.ENEMY_B_DARK;
    ctx.beginPath();
    ctx.ellipse(0, 1, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================
// Enemy C: Slow mover that shoots at player
// ============================================================
class EnemyC extends Enemy {
  constructor(x, y) {
    super(x, y, 'C');
    this.hp = ENEMY_C_HP;
    this.score = ENEMY_C_SCORE;
    this.speed = ENEMY_C_SPEED;
    this.radius = ENEMY_C_RADIUS;
    this.fireTimer = ENEMY_C_FIRE_INTERVAL;
    this.pulseFrame = 0;
    this.canFire = true;
  }

  update() {
    this.y += this.speed;
    this.frame++;
    this.pulseFrame++;

    // Fire timer countdown
    if (this.fireTimer > 0) this.fireTimer--;

    if (this.isOffScreen()) this.alive = false;
  }

  /**
   * Try to fire at the player. Returns an array of bullets (empty if not firing).
   */
  tryFire(playerX, playerY) {
    if (this.fireTimer > 0) return [];

    this.fireTimer = scaledFireInterval(ENEMY_C_FIRE_INTERVAL);

    return Patterns.aimed({
      x: this.x, y: this.y + 8, tx: playerX, ty: playerY,
      speed: ENEMY_C_BULLET_SPEED,
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 1 + Math.sin(this.pulseFrame * 0.08) * 0.1;

    // Outer ring
    ctx.strokeStyle = COLORS.ENEMY_C;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.fillStyle = COLORS.ENEMY_C;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Inner body
    ctx.fillStyle = COLORS.ENEMY_C_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Cannon barrel (points down)
    ctx.fillStyle = COLORS.ENEMY_C;
    ctx.fillRect(-2, 6, 4, 6);

    // Core (pulses when about to fire)
    const coreBrightness = this.fireTimer < 30 ? 1 : 0.5;
    ctx.fillStyle = this.fireTimer < 30 ? COLORS.UI_YELLOW : COLORS.ENEMY_C;
    ctx.globalAlpha = coreBrightness;
    ctx.beginPath();
    ctx.arc(0, 0, 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Side cannons
    ctx.fillStyle = COLORS.ENEMY_C;
    ctx.fillRect(-10, -2, 4, 4);
    ctx.fillRect(6, -2, 4, 4);

    ctx.restore();
  }
}

// ============================================================
// Shield Enemy: heavy frontal plate that reduces head-on damage.
// Wide or explosive attacks can work around the plate.
// ============================================================
class ShieldEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'SHIELD');
    this.hp = ENEMY_SHIELD_HP;
    this.score = ENEMY_SHIELD_SCORE;
    this.speed = ENEMY_SHIELD_SPEED;
    this.radius = ENEMY_SHIELD_RADIUS;
  }

  update() {
    this.y += this.speed;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  applyDamage(amount, source) {
    // Frontal weapons (bullets / rail hitting the plate) are reduced.
    // Chain lightning and NOVA BURST bypass the shield.
    let dmg = amount;
    if (source === 'bullet' || source === 'rail') {
      dmg = Math.max(1, amount * ENEMY_SHIELD_FRONT_REDUCTION);
    }
    this.hp -= dmg;
    return dmg;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Body
    ctx.fillStyle = COLORS.ENEMY_SHIELD_DARK;
    ctx.beginPath();
    ctx.arc(0, 2, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ENEMY_SHIELD;
    ctx.beginPath();
    ctx.arc(0, 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = COLORS.UI_RED;
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Front shield plate (faces downward, toward the player)
    ctx.fillStyle = COLORS.ENEMY_SHIELD_PLATE;
    ctx.beginPath();
    ctx.moveTo(-13, 8);
    ctx.lineTo(13, 8);
    ctx.lineTo(10, 13);
    ctx.lineTo(-10, 13);
    ctx.closePath();
    ctx.fill();

    // Plate highlight
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(-10, 9, 20, 1.5);
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

// ============================================================
// Split Enemy: splits into small fast minions when destroyed.
// Wide weapons help control the cluster.
// ============================================================
class Splitling extends Enemy {
  constructor(x, y, vx) {
    super(x, y, 'SPLITLING');
    this.hp = ENEMY_SPLITLING_HP;
    this.score = ENEMY_SPLITLING_SCORE;
    this.radius = ENEMY_SPLITLING_RADIUS;
    this.vx = vx;
    this.vy = ENEMY_SPLITLING_SPEED;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.ENEMY_SPLIT;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ENEMY_SPLIT_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class SplitEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'SPLIT');
    this.hp = ENEMY_SPLIT_HP;
    this.score = ENEMY_SPLIT_SCORE;
    this.speed = ENEMY_SPLIT_SPEED;
    this.radius = ENEMY_SPLIT_RADIUS;
  }

  update() {
    this.y += this.speed;
    this.x = this.spawnX + Math.sin(this.frame * 0.02) * 20;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  onDeath() {
    // Only split if destroyed on screen.
    if (this.y > CANVAS_HEIGHT) return [];
    return [
      new Splitling(this.x, this.y, -1.4),
      new Splitling(this.x, this.y, 0),
      new Splitling(this.x, this.y, 1.4),
    ];
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Lumpy body suggesting it will break apart
    ctx.fillStyle = COLORS.ENEMY_SPLIT;
    for (const o of [[-5, -3], [5, -3], [0, 4]]) {
      ctx.beginPath();
      ctx.arc(o[0], o[1], 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.ENEMY_SPLIT_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(-2, -1, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================
// Formation Enemy: spawns in lines (handled by the spawner).
// Straight, fast mover — a vertical column is shredded by RAIL LANCER.
// ============================================================
class FormationEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'FORM');
    this.hp = ENEMY_FORM_HP;
    this.score = ENEMY_FORM_SCORE;
    this.speed = ENEMY_FORM_SPEED;
    this.radius = ENEMY_FORM_RADIUS;
  }

  update() {
    this.y += this.speed;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Arrowhead pointing down
    ctx.fillStyle = COLORS.ENEMY_FORM;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(-8, -6);
    ctx.lineTo(0, -2);
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.ENEMY_FORM_DARK;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-4, -4);
    ctx.lineTo(0, -1);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// Rush Enemy: hovers, then dashes toward the player's position.
// It is dangerous if allowed to close distance.
// ============================================================
class RushEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'RUSH');
    this.hp = ENEMY_RUSH_HP;
    this.score = ENEMY_RUSH_SCORE;
    this.speed = ENEMY_RUSH_SPEED;
    this.radius = ENEMY_RUSH_RADIUS;
    this.phase = 'approach'; // 'approach' -> 'charge' -> 'dash'
    this.chargeTimer = ENEMY_RUSH_CHARGE_TIME;
    this.dashVx = 0;
    this.dashVy = ENEMY_RUSH_DASH_SPEED;
  }

  update(player) {
    this.frame++;

    if (this.phase === 'approach') {
      this.y += this.speed;
      // Once it has drifted onto the screen, wind up a dash.
      if (this.y > 80) {
        this.phase = 'charge';
        this.chargeTimer = ENEMY_RUSH_CHARGE_TIME;
      }
    } else if (this.phase === 'charge') {
      this.y += this.speed * 0.3;
      this.chargeTimer--;
      if (this.chargeTimer <= 0) {
        // Lock onto the player's current position and dash.
        const tx = player ? player.x : this.x;
        const ty = player ? player.y : CANVAS_HEIGHT;
        const a = angleTo(this.x, this.y, tx, ty);
        this.dashVx = Math.cos(a) * ENEMY_RUSH_DASH_SPEED;
        this.dashVy = Math.sin(a) * ENEMY_RUSH_DASH_SPEED;
        this.phase = 'dash';
      }
    } else {
      this.x += this.dashVx;
      this.y += this.dashVy;
    }

    if (this.isOffScreen() || this.x < -30 || this.x > CANVAS_WIDTH + 30) {
      this.alive = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Warning flash while charging
    if (this.phase === 'charge' && Math.floor(this.frame / 5) % 2 === 0) {
      ctx.strokeStyle = COLORS.UI_RED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Spiky body
    ctx.fillStyle = COLORS.ENEMY_RUSH;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const r = i % 2 === 0 ? this.radius : this.radius - 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.ENEMY_RUSH_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================
// Turret Enemy: settles near the top of the screen and fires
// aimed shots at a steady interval. Tough but stationary.
// ============================================================
class TurretEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, 'TURRET');
    this.hp = ENEMY_TURRET_HP;
    this.score = ENEMY_TURRET_SCORE;
    this.speed = ENEMY_TURRET_SPEED;
    this.radius = ENEMY_TURRET_RADIUS;
    this.stopY = ENEMY_TURRET_STOP_Y + randInt(-10, 20);
    this.fireTimer = ENEMY_TURRET_FIRE_INTERVAL;
    this.canFire = true;
    this.life = 0;
  }

  update() {
    if (this.y < this.stopY) {
      this.y += this.speed;
    } else {
      this.life++;
      // Despawn after a while so the screen doesn't fill with turrets.
      if (this.life > 60 * 12) this.alive = false;
    }
    this.frame++;
    if (this.fireTimer > 0) this.fireTimer--;
  }

  tryFire(playerX, playerY) {
    if (this.y < this.stopY || this.fireTimer > 0) return [];
    this.fireTimer = scaledFireInterval(ENEMY_TURRET_FIRE_INTERVAL);
    return Patterns.aimed({
      x: this.x, y: this.y + 8, tx: playerX, ty: playerY,
      speed: ENEMY_TURRET_BULLET_SPEED,
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Base
    ctx.fillStyle = COLORS.ENEMY_TURRET_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ENEMY_TURRET;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Barrel
    ctx.fillStyle = COLORS.ENEMY_TURRET_DARK;
    ctx.fillRect(-3, 4, 6, 10);

    // Core (glows before firing)
    const hot = this.fireTimer < 25 && this.y >= this.stopY;
    ctx.fillStyle = hot ? COLORS.UI_YELLOW : COLORS.UI_WHITE;
    ctx.globalAlpha = hot ? 1 : 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

// ============================================================
// SECTOR NOVA 2 enemies (DESIGN.md 11)
// ------------------------------------------------------------
// Size band 7-14 px, each with its own silhouette, drawn as
// body color -> dark inner -> bright core.
// ============================================================

/** Body / dark / core colors, swapped for gold for GOLD variants. */
function enemyPalette(gold, body, dark, core) {
  return gold
    ? { body: COLORS.GOLD_BODY, dark: COLORS.GOLD_DARK, core: COLORS.GOLD_CORE }
    : { body, dark, core };
}

function isOutsideScreen(x, y) {
  const m = ENEMY_SPAWN_LEAVE_MARGIN;
  return x < -m || x > CANVAS_WIDTH + m || y < -m * 2 || y > CANVAS_HEIGHT + m;
}

/** Glow halo + solid shape helper for the 3-layer look. */
function fillPolygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fill();
}

// ------------------------------------------------------------
// SHARD: basic diver. Spawned near an edge it enters diagonally.
// GOLD SHARD: same enemy in gold (NOVA CRYSTAL condition, Phase 4).
// ------------------------------------------------------------
class Shard extends Enemy {
  constructor(x, y, gold) {
    super(x, y, gold ? 'GOLD_SHARD' : 'SHARD');
    this.gold = !!gold;
    this.hp = SHARD_HP;
    this.score = SHARD_SCORE;
    this.radius = SHARD_RADIUS;
    // Diagonal entry from the outer lanes, straight down in the middle.
    this.vx = x < CANVAS_WIDTH * 0.25 ? 0.9 : x > CANVAS_WIDTH * 0.75 ? -0.9 : 0;
    this.vy = SHARD_SPEED;
    this.pal = enemyPalette(this.gold, COLORS.SHARD_BODY, COLORS.SHARD_DARK, COLORS.SHARD_CORE);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.frame++;
    if (isOutsideScreen(this.x, this.y)) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-Math.atan2(this.vx, this.vy));
    if (this.gold) {
      ctx.fillStyle = this.pal.body;
      ctx.globalAlpha = 0.3 + Math.sin(this.frame * 0.2) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Thin ice splinter pointing the way it flies
    ctx.fillStyle = this.pal.body;
    fillPolygon(ctx, [[0, 11], [5, -1], [0, -10], [-5, -1]]);
    ctx.fillStyle = this.pal.dark;
    fillPolygon(ctx, [[0, 6], [2.5, -1], [0, -6], [-2.5, -1]]);
    ctx.fillStyle = this.pal.core;
    ctx.fillRect(-1, 1, 2, 3);
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// WISP: light orb with a tail, weaving down. Members of a 'wave'
// group share one phase and trace the same curve.
// ------------------------------------------------------------
class Wisp extends Enemy {
  constructor(x, y, type, hp, score, pal) {
    super(x, y, type || 'WISP');
    this.hp = hp || WISP_HP;
    this.score = score || WISP_SCORE;
    this.radius = WISP_RADIUS;
    this.waveOffset = Math.random() * Math.PI * 2;
    this.pal = pal || { body: COLORS.WISP_BODY, dark: COLORS.WISP_DARK, core: COLORS.WISP_CORE };
    this.trail = [];
  }

  update() {
    this.trail.unshift([this.x, this.y]);
    if (this.trail.length > 6) this.trail.pop();
    this.y += WISP_SPEED;
    this.x = this.spawnX + Math.sin(this.frame * WISP_WAVE_FREQ + this.waveOffset) * WISP_WAVE_AMP;
    this.frame++;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    // Fading tail
    this.trail.forEach(([tx, ty], i) => {
      ctx.globalAlpha = 0.35 * (1 - i / this.trail.length);
      ctx.fillStyle = this.pal.body;
      ctx.beginPath();
      ctx.arc(tx, ty, 6 - i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.pal.body;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.pal.dark;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.pal.core;
    ctx.beginPath();
    ctx.arc(this.x, this.y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// SNIPER: parks near the top and fires single aimed shots. Its
// core glows for SNIPER_CHARGE_FRAMES before each shot. Leaves
// upward after a while.
// ------------------------------------------------------------
class Sniper extends Enemy {
  constructor(x, y) {
    super(x, y, 'SNIPER');
    this.hp = SNIPER_HP;
    this.score = SNIPER_SCORE;
    this.radius = SNIPER_RADIUS;
    this.state = 'enter';
    this.stopY = SNIPER_STOP_Y + randInt(-10, 20);
    this.stayTimer = SNIPER_STAY_FRAMES;
    this.fireTimer = SNIPER_FIRE_INTERVAL;
    this.aim = Math.PI / 2;
    this.canFire = true;
  }

  get charging() {
    return this.state === 'aim' && this.fireTimer <= SNIPER_CHARGE_FRAMES;
  }

  update(player) {
    this.frame++;
    if (player) this.aim = angleTo(this.x, this.y, player.x, player.y);
    if (this.state === 'enter') {
      this.y += SNIPER_ENTRY_SPEED;
      if (this.y >= this.stopY) this.state = 'aim';
    } else if (this.state === 'aim') {
      if (this.fireTimer > 0) this.fireTimer--;
      if (--this.stayTimer <= 0) this.state = 'leave';
    } else {
      this.y -= SNIPER_LEAVE_SPEED;
      if (this.y < -ENEMY_SPAWN_LEAVE_MARGIN) this.alive = false;
    }
  }

  tryFire(playerX, playerY) {
    if (this.state !== 'aim' || this.fireTimer > 0) return [];
    this.fireTimer = scaledFireInterval(SNIPER_FIRE_INTERVAL);
    return Patterns.aimed({
      x: this.x + Math.cos(this.aim) * 14, y: this.y + Math.sin(this.aim) * 14,
      tx: playerX, ty: playerY, speed: SNIPER_BULLET_SPEED,
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Long barrel toward the ship
    ctx.save();
    ctx.rotate(this.aim - Math.PI / 2);
    ctx.fillStyle = COLORS.SNIPER_DARK;
    ctx.fillRect(-1.5, 0, 3, 16);
    ctx.restore();
    // Body: short wings + hull
    ctx.fillStyle = COLORS.SNIPER_BODY;
    fillPolygon(ctx, [[-10, -2], [-3, -7], [3, -7], [10, -2], [4, 5], [-4, 5]]);
    ctx.fillStyle = COLORS.SNIPER_DARK;
    fillPolygon(ctx, [[-5, -2], [0, -5], [5, -2], [0, 3]]);
    // Core: brightens while charging (the telegraph)
    const charge = this.charging ? 1 - this.fireTimer / SNIPER_CHARGE_FRAMES : 0;
    ctx.fillStyle = COLORS.SNIPER_CORE;
    ctx.globalAlpha = 0.5 + charge * 0.5;
    ctx.beginPath();
    ctx.arc(0, -1, 2 + charge * 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (this.charging) {
      ctx.globalAlpha = 0.25 + charge * 0.4;
      ctx.beginPath();
      ctx.arc(0, -1, 5 + charge * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// MINE LAYER: enters from the side named by x (left half -> from
// the left), crosses the screen and drops MINEs.
// MINE: shootable; bursts into an 8-way ring after MINE_FUSE frames.
// ------------------------------------------------------------
class MineLayer extends Enemy {
  constructor(x, y) {
    super(x, y, 'MINE_LAYER');
    this.hp = MINE_LAYER_HP;
    this.score = MINE_LAYER_SCORE;
    this.radius = MINE_LAYER_RADIUS;
    this.dir = x < CANVAS_WIDTH / 2 ? 1 : -1;
    this.x = this.dir > 0 ? -14 : CANVAS_WIDTH + 14;
    this.y = y > 0 ? y : MINE_LAYER_Y;
    this.dropTimer = MINE_LAYER_DROP_INTERVAL / 2;
  }

  update() {
    this.frame++;
    this.x += this.dir * MINE_LAYER_SPEED;
    const onScreen = this.x > 20 && this.x < CANVAS_WIDTH - 20;
    if (onScreen && --this.dropTimer <= 0) {
      this.dropTimer = MINE_LAYER_DROP_INTERVAL;
      this.spawned.push(new Mine(this.x, this.y + 8));
    }
    if (isOutsideScreen(this.x, this.y)) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.MINE_LAYER_BODY;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.MINE_LAYER_DARK;
    ctx.beginPath();
    ctx.ellipse(0, 1, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dome + blinking light
    ctx.fillStyle = COLORS.MINE_LAYER_BODY;
    ctx.beginPath();
    ctx.arc(0, -3, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = Math.floor(this.frame / 10) % 2 ? COLORS.MINE_LAYER_CORE : COLORS.MINE_LAYER_DARK;
    ctx.fillRect(-1.5, -6, 3, 2);
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

class Mine extends Enemy {
  constructor(x, y) {
    super(x, y, 'MINE');
    this.hp = MINE_HP;
    this.score = MINE_SCORE;
    this.radius = MINE_RADIUS;
    this.fuse = MINE_FUSE;
    this.canFire = true;
    this.noDrop = true;
  }

  update() {
    this.frame++;
    this.y += MINE_DRIFT;
    this.fuse--;
    if (this.isOffScreen()) this.alive = false;
  }

  /** Bursts once when the fuse runs out, then disappears. */
  tryFire() {
    if (this.fuse > 0) return [];
    this.alive = false;
    return Patterns.ring({ x: this.x, y: this.y, count: MINE_RING_COUNT, speed: MINE_RING_SPEED, offset: Math.PI / MINE_RING_COUNT });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Blink faster as the fuse runs out; a ring closes in for the last 40f.
    const period = this.fuse > 60 ? 20 : this.fuse > 30 ? 8 : 4;
    const lit = Math.floor(this.frame / period) % 2 === 0;
    if (this.fuse <= HAZARD_MIN_WARN_FRAMES) {
      ctx.strokeStyle = COLORS.MINE_LIGHT;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 2 + this.fuse * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = COLORS.MINE_BODY;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + Math.PI / 4;
      ctx.fillRect(Math.cos(a) * 6 - 1.5, Math.sin(a) * 6 - 1.5, 3, 3);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lit ? COLORS.MINE_LIGHT : COLORS.MINE_LAYER_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// GUN DECK: ground turret that scrolls with the floor. The barrel
// tracks the ship; fires an aimed 3-way spread. Ground units never
// collide with the ship.
// ------------------------------------------------------------
class GunDeck extends Enemy {
  constructor(x, y) {
    super(x, y, 'GUN_DECK');
    this.hp = GUN_DECK_HP;
    this.score = GUN_DECK_SCORE;
    this.radius = GUN_DECK_RADIUS;
    this.ground = true;
    this.fireTimer = GUN_DECK_FIRE_INTERVAL;
    this.aim = Math.PI / 2;
    this.canFire = true;
  }

  update(player) {
    this.frame++;
    this.y += GUN_DECK_SCROLL;
    if (player) this.aim = angleTo(this.x, this.y, player.x, player.y);
    if (this.fireTimer > 0) this.fireTimer--;
    if (this.isOffScreen()) this.alive = false;
  }

  tryFire() {
    if (this.fireTimer > 0 || this.y < 10) return [];
    this.fireTimer = scaledFireInterval(GUN_DECK_FIRE_INTERVAL);
    return Patterns.fan({
      x: this.x + Math.cos(this.aim) * 12, y: this.y + Math.sin(this.aim) * 12,
      angle: this.aim, count: 3, step: GUN_DECK_SPREAD, speed: GUN_DECK_BULLET_SPEED,
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Square base with corner bolts
    ctx.fillStyle = COLORS.GUN_DECK_BODY;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = COLORS.GUN_DECK_DARK;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = COLORS.GUN_DECK_CORE;
    for (const [bx, by] of [[-10, -10], [8, -10], [-10, 8], [8, 8]]) ctx.fillRect(bx, by, 2, 2);
    // Rotating barrel
    ctx.rotate(this.aim - Math.PI / 2);
    ctx.fillStyle = COLORS.GUN_DECK_BODY;
    ctx.fillRect(-2.5, 0, 5, 13);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    const hot = this.fireTimer < 25;
    ctx.fillStyle = hot ? COLORS.GUN_DECK_CORE : COLORS.GUN_DECK_DARK;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// CARRIER: big slow box that releases 2 DRONEs every 90 frames.
// DRONE: small craft that steers toward the ship (ramming only).
// ------------------------------------------------------------
class Carrier extends Enemy {
  constructor(x, y) {
    super(x, y, 'CARRIER');
    this.hp = CARRIER_HP;
    this.score = CARRIER_SCORE;
    this.radius = CARRIER_RADIUS;
    this.largeFlag = true;
    this.spawnTimer = CARRIER_SPAWN_INTERVAL / 2;
  }

  update() {
    this.frame++;
    this.y += CARRIER_SPEED;
    if (this.y > 10 && this.y < CANVAS_HEIGHT - 80 && --this.spawnTimer <= 0) {
      this.spawnTimer = CARRIER_SPAWN_INTERVAL;
      for (let i = 0; i < CARRIER_SPAWN_COUNT; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        this.spawned.push(new Drone(this.x + side * 12, this.y + 10));
      }
    }
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.CARRIER_BODY;
    ctx.fillRect(-14, -11, 28, 22);
    ctx.fillRect(-17, -5, 3, 10);
    ctx.fillRect(14, -5, 3, 10);
    ctx.fillStyle = COLORS.CARRIER_DARK;
    ctx.fillRect(-10, -1, 20, 9);       // hangar bay
    // Bay lights blink just before a launch
    const soon = this.spawnTimer < 20;
    ctx.fillStyle = soon && Math.floor(this.frame / 4) % 2 ? COLORS.UI_WHITE : COLORS.CARRIER_CORE;
    ctx.fillRect(-8, 3, 3, 2);
    ctx.fillRect(5, 3, 3, 2);
    ctx.fillStyle = COLORS.CARRIER_CORE;
    ctx.fillRect(-3, -8, 6, 4);          // bridge
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

class Drone extends Enemy {
  constructor(x, y) {
    super(x, y, 'DRONE');
    this.hp = DRONE_HP;
    this.score = DRONE_SCORE;
    this.radius = DRONE_RADIUS;
    this.noDrop = true;
    this.angle = Math.PI / 2;
  }

  update(player) {
    this.frame++;
    if (player && this.frame < DRONE_HOMING_FRAMES) {
      let diff = angleTo(this.x, this.y, player.x, player.y) - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += clamp(diff, -DRONE_TURN, DRONE_TURN);
    }
    this.x += Math.cos(this.angle) * DRONE_SPEED;
    this.y += Math.sin(this.angle) * DRONE_SPEED;
    if (isOutsideScreen(this.x, this.y)) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle - Math.PI / 2);
    ctx.fillStyle = COLORS.DRONE_BODY;
    fillPolygon(ctx, [[0, 8], [-6, -4], [0, -2], [6, -4]]);
    ctx.fillStyle = COLORS.DRONE_DARK;
    fillPolygon(ctx, [[0, 4], [-3, -2], [3, -2]]);
    ctx.fillStyle = COLORS.DRONE_CORE;
    ctx.fillRect(-1, 0, 2, 2);
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// MIRROR: carries a mirror plate facing down. Shots hitting it from
// the front (moving up within +/-45 deg) bounce: NORMAL / SPREAD /
// HOMING come back as slow enemy bullets, RAIL / CHAIN deal 25%.
// Hits from the side or back do full damage.
// ------------------------------------------------------------
function isFrontalShot(dirX, dirY) {
  return dirY < 0 && Math.abs(dirX) <= -dirY;
}

class Mirror extends Enemy {
  constructor(x, y) {
    super(x, y, 'MIRROR');
    this.hp = MIRROR_HP;
    this.score = MIRROR_SCORE;
    this.radius = MIRROR_RADIUS;
    this.flash = 0;
  }

  update() {
    this.frame++;
    this.y += MIRROR_SPEED;
    this.x = this.spawnX + Math.sin(this.frame * 0.02) * 16;
    if (this.flash > 0) this.flash--;
    if (this.isOffScreen()) this.alive = false;
  }

  /** True if this shot is bounced back instead of doing damage. */
  reflectsShot(source, dirX, dirY) {
    if (source !== 'bullet' || !isFrontalShot(dirX, dirY)) return false;
    this.flash = 6;
    return true;
  }

  applyDamage(amount, source, dirX, dirY) {
    let dmg = amount;
    if ((source === 'rail' || source === 'chain') && isFrontalShot(dirX ?? 0, dirY ?? 0)) {
      dmg = amount * MIRROR_FRONT_RAIL_CHAIN_SCALE;
      this.flash = 6;
    }
    this.hp -= dmg;
    return dmg;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.MIRROR_BODY;
    fillPolygon(ctx, [[0, -12], [9, -2], [0, 6], [-9, -2]]);
    ctx.fillStyle = COLORS.MIRROR_DARK;
    fillPolygon(ctx, [[0, -7], [5, -2], [0, 2], [-5, -2]]);
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(0, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Mirror plate on the underside (the side facing the ship)
    ctx.fillStyle = COLORS.MIRROR_SHIELD;
    ctx.globalAlpha = this.flash > 0 ? 1 : 0.85;
    fillPolygon(ctx, [[-12, 4], [12, 4], [8, 9], [-8, 9]]);
    ctx.fillStyle = COLORS.REFLECT_BULLET_GLOW;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-9, 5, 18, 1);
    if (this.flash > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.beginPath();
      ctx.arc(0, 7, 12, 0, Math.PI);
      ctx.fill();
    }
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// PHASE GHOST: visible 90f, gone 60f. While gone it cannot be hit
// and does not hurt. The air ripples for 40f before it appears.
// GOLD GHOST: gold variant (NOVA CRYSTAL condition, Phase 4).
// ------------------------------------------------------------
class PhaseGhost extends Enemy {
  constructor(x, y, gold) {
    super(x, y, gold ? 'GOLD_GHOST' : 'PHASE_GHOST');
    this.gold = !!gold;
    this.hp = PHASE_GHOST_HP;
    this.score = PHASE_GHOST_SCORE;
    this.radius = PHASE_GHOST_RADIUS;
    // Start in the ripple at the end of a hidden span.
    this.cycle = PHASE_GHOST_VISIBLE + PHASE_GHOST_HIDDEN - PHASE_GHOST_RIPPLE;
    this.pal = enemyPalette(this.gold, COLORS.GHOST_BODY, COLORS.GHOST_DARK, COLORS.GHOST_CORE);
  }

  get cycleLength() {
    return PHASE_GHOST_VISIBLE + PHASE_GHOST_HIDDEN;
  }

  get visible() {
    return this.cycle % this.cycleLength < PHASE_GHOST_VISIBLE;
  }

  get rippling() {
    return !this.visible && this.cycleLength - (this.cycle % this.cycleLength) <= PHASE_GHOST_RIPPLE;
  }

  get isHittable() {
    return this.visible;
  }

  update() {
    this.frame++;
    this.cycle++;
    this.y += PHASE_GHOST_SPEED;
    this.x = this.spawnX + Math.sin(this.frame * 0.025) * 24;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.rippling) {
      // Warning shimmer: rings shrinking onto the spot it will appear.
      const left = this.cycleLength - (this.cycle % this.cycleLength);
      ctx.strokeStyle = this.pal.body;
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const r = 4 + ((left + i * 12) % PHASE_GHOST_RIPPLE) * 0.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let a = 0; a <= 16; a++) {
          const t = (Math.PI * 2 * a) / 16;
          const rr = r + Math.sin(t * 3 + this.frame * 0.4) * 1.5;
          if (a === 0) ctx.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
          else ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr);
        }
        ctx.stroke();
      }
    } else if (this.visible) {
      const t = this.cycle % this.cycleLength;
      const fade = Math.min(1, t / 8, (PHASE_GHOST_VISIBLE - t) / 8);
      ctx.globalAlpha = 0.8 * fade;
      ctx.fillStyle = this.pal.body;
      // Hooded head with a wavy hem
      ctx.beginPath();
      ctx.arc(0, -3, 8, Math.PI, 0);
      ctx.lineTo(8, 7);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(8 - (i * 2 + 1) * 2, 4 + (i % 2 ? 0 : 4) + Math.sin(this.frame * 0.3 + i) * 1);
      }
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this.pal.dark;
      ctx.beginPath();
      ctx.ellipse(0, -1, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.pal.core;
      ctx.fillRect(-3, -3, 2, 2);
      ctx.fillRect(1, -3, 2, 2);
    }
    ctx.restore();
    if (this.visible) this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// SWARM: small beetle diving fast in a V. Destroying every member of
// one timeline group pays SWARM_FORMATION_BONUS.
// HATCHLING: SWARM-type hatchling from HIVE MOTHER's eggs.
// ------------------------------------------------------------
class Swarm extends Enemy {
  constructor(x, y, type, pal) {
    super(x, y, type || 'SWARM');
    this.hp = SWARM_HP;
    this.score = SWARM_SCORE;
    this.radius = SWARM_RADIUS;
    this.formationBonus = true;
    this.speed = SWARM_SPEED;
    this.pal = pal || { body: COLORS.SWARM_BODY, dark: COLORS.SWARM_DARK, core: COLORS.SWARM_CORE };
  }

  update() {
    this.frame++;
    this.y += this.speed;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const flap = Math.sin(this.frame * 0.8) * 2;
    ctx.strokeStyle = this.pal.body;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -1); ctx.lineTo(-7, -4 - flap);
    ctx.moveTo(2, -1); ctx.lineTo(7, -4 - flap);
    ctx.stroke();
    ctx.fillStyle = this.pal.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.pal.dark;
    ctx.fillRect(-0.5, -4, 1, 9);
    ctx.fillStyle = this.pal.core;
    ctx.fillRect(-2, 3, 1.5, 1.5);
    ctx.fillRect(0.5, 3, 1.5, 1.5);
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

class Hatchling extends Swarm {
  constructor(x, y) {
    super(x, y, 'HATCHLING', { body: COLORS.HATCHLING_BODY, dark: COLORS.HATCHLING_DARK, core: COLORS.HATCHLING_CORE });
    this.hp = HATCHLING_HP;
    this.score = HATCHLING_SCORE;
    this.radius = HATCHLING_RADIUS;
    this.speed = HATCHLING_SPEED;
    this.formationBonus = false;
    this.noDrop = true;
  }
}

// ------------------------------------------------------------
// FLARE SPIRIT: wandering flame. When destroyed it scatters a slow
// pink 6-way burst (none on EASY, 1.5x on HARD - see patterns.js).
// ------------------------------------------------------------
class FlareSpirit extends Enemy {
  constructor(x, y) {
    super(x, y, 'FLARE_SPIRIT');
    this.hp = FLARE_SPIRIT_HP;
    this.score = FLARE_SPIRIT_SCORE;
    this.radius = FLARE_SPIRIT_RADIUS;
    this.drift = Math.random() * Math.PI * 2;
  }

  update() {
    this.frame++;
    this.y += FLARE_SPIRIT_SPEED;
    this.x = this.spawnX + Math.sin(this.frame * 0.03 + this.drift) * 30 + Math.sin(this.frame * 0.11) * 4;
    if (this.isOffScreen()) this.alive = false;
  }

  deathBullets() {
    return Patterns.burstFromDeath({ x: this.x, y: this.y, count: FLARE_SPIRIT_BURST, offset: this.frame * 0.05 });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const f = Math.sin(this.frame * 0.4) * 1.5;
    ctx.fillStyle = COLORS.FLARE_BODY;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Teardrop flame licking upward
    ctx.beginPath();
    ctx.moveTo(0, -12 - f);
    ctx.quadraticCurveTo(8, -2, 6, 4);
    ctx.quadraticCurveTo(0, 10, -6, 4);
    ctx.quadraticCurveTo(-8, -2, 0, -12 - f);
    ctx.fill();
    ctx.fillStyle = COLORS.FLARE_DARK;
    ctx.beginPath();
    ctx.moveTo(0, -5 - f * 0.5);
    ctx.quadraticCurveTo(4, 0, 3, 4);
    ctx.quadraticCurveTo(0, 7, -3, 4);
    ctx.quadraticCurveTo(-4, 0, 0, -5 - f * 0.5);
    ctx.fill();
    ctx.fillStyle = COLORS.FLARE_CORE;
    ctx.beginPath();
    ctx.arc(0, 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.drawLinkShield(ctx);
  }
}

// ------------------------------------------------------------
// LINK GUARD: links (light beams) to the 2 nearest other enemies in
// LINK_RANGE; linked enemies take no damage. Links drop when the
// guard is destroyed. Links are assigned by Game.updateLinks().
// ------------------------------------------------------------
class LinkGuard extends Enemy {
  constructor(x, y) {
    super(x, y, 'LINK_GUARD');
    this.hp = LINK_GUARD_HP;
    this.score = LINK_GUARD_SCORE;
    this.radius = LINK_GUARD_RADIUS;
    this.links = [];
  }

  update() {
    this.frame++;
    this.y += LINK_GUARD_SPEED;
    if (this.isOffScreen()) this.alive = false;
  }

  /** Beams to the linked enemies (drawn under the enemies). */
  drawLinks(ctx) {
    if (!this.links.length) return;
    ctx.save();
    ctx.strokeStyle = COLORS.LINK_BEAM;
    for (const e of this.links) {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 8);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Two-pronged antenna
    ctx.strokeStyle = COLORS.LINK_GUARD_BODY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(-5, -12);
    ctx.moveTo(0, -4); ctx.lineTo(5, -12);
    ctx.stroke();
    ctx.fillStyle = COLORS.LINK_GUARD_CORE;
    ctx.fillRect(-6, -13, 2, 2);
    ctx.fillRect(4, -13, 2, 2);
    // Hexagonal body
    ctx.fillStyle = COLORS.LINK_GUARD_BODY;
    fillPolygon(ctx, [[-10, 0], [-5, -6], [5, -6], [10, 0], [5, 8], [-5, 8]]);
    ctx.fillStyle = COLORS.LINK_GUARD_DARK;
    fillPolygon(ctx, [[-6, 1], [-3, -3], [3, -3], [6, 1], [3, 5], [-3, 5]]);
    ctx.fillStyle = COLORS.LINK_GUARD_CORE;
    ctx.globalAlpha = 0.7 + Math.sin(this.frame * 0.2) * 0.3;
    ctx.beginPath();
    ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// HATCHLING (WISP type): a sturdier WISP in hive colors.
function createHatchlingWisp(x, y) {
  const w = new Wisp(x, y, 'HATCHLING_WISP', HATCHLING_WISP_HP, HATCHLING_WISP_SCORE,
    { body: COLORS.HATCHLING_BODY, dark: COLORS.HATCHLING_DARK, core: COLORS.HATCHLING_CORE });
  w.noDrop = true;
  return w;
}

// Factory lookup so stage timelines can reference enemy types by name.
const ENEMY_FACTORIES = {
  A: (x, y) => new EnemyA(x, y),
  B: (x, y) => new EnemyB(x, y),
  C: (x, y) => new EnemyC(x, y),
  SHIELD: (x, y) => new ShieldEnemy(x, y),
  SPLIT: (x, y) => new SplitEnemy(x, y),
  FORM: (x, y) => new FormationEnemy(x, y),
  RUSH: (x, y) => new RushEnemy(x, y),
  TURRET: (x, y) => new TurretEnemy(x, y),
  // SECTOR NOVA 2 (DESIGN.md 11)
  SHARD: (x, y) => new Shard(x, y, false),
  WISP: (x, y) => new Wisp(x, y),
  SNIPER: (x, y) => new Sniper(x, y),
  MINE_LAYER: (x, y) => new MineLayer(x, y),
  GUN_DECK: (x, y) => new GunDeck(x, y),
  CARRIER: (x, y) => new Carrier(x, y),
  MIRROR: (x, y) => new Mirror(x, y),
  PHASE_GHOST: (x, y) => new PhaseGhost(x, y, false),
  SWARM: (x, y) => new Swarm(x, y),
  FLARE_SPIRIT: (x, y) => new FlareSpirit(x, y),
  LINK_GUARD: (x, y) => new LinkGuard(x, y),
  // Derived
  DRONE: (x, y) => new Drone(x, y),
  MINE: (x, y) => new Mine(x, y),
  HATCHLING: (x, y) => new Hatchling(x, y),
  HATCHLING_WISP: (x, y) => createHatchlingWisp(x, y),
  GOLD_SHARD: (x, y) => new Shard(x, y, true),
  GOLD_GHOST: (x, y) => new PhaseGhost(x, y, true),
};
