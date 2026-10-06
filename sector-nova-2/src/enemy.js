// ============================================================
// SECTOR NOVA 2 - Enemies
// ------------------------------------------------------------
// Phase 1: the SECTOR NOVA 1 enemy set, spawned by the stage
// timeline (timeline.js) instead of a random spawner. Shooters
// fire through patterns.js. The SECTOR NOVA 2 enemies replace
// this set in Phase 3.
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
  }

  /**
   * Check if off screen (below)
   */
  isOffScreen() {
    return this.y > CANVAS_HEIGHT + 30;
  }

  /**
   * Apply damage from a player attack.
   * `source` is one of: 'bullet' | 'laser' | 'explosion'.
   * Subclasses (e.g. ShieldEnemy) may reduce damage by source/direction.
   * Returns the actual damage dealt.
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
    // Frontal weapons (bullets / laser hitting the plate) are reduced.
    // Splash-style damage bypasses the shield.
    let dmg = amount;
    if (source === 'bullet' || source === 'laser') {
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
// Straight, fast mover — a vertical column is shredded by PIERCE LASER.
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
};
