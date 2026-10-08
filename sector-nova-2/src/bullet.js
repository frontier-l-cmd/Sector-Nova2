// ============================================================
// SECTOR NOVA 2 - Bullets
// ------------------------------------------------------------
// Hostile bullets are created through patterns.js, which applies
// difficulty multipliers and the speed cap. EnemyBullet covers the
// red / pink / cyan styles; BossBullet is the orange boss shot.
// ============================================================

/**
 * Player bullet - straight shot. `style` picks the colors (NORMAL,
 * SPREAD, options); `damage` is already scaled for options.
 */
class PlayerBullet {
  constructor(x, y, vx, vy, opts) {
    opts = opts || {};
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy ?? -PLAYER_BULLET_SPEED;
    this.radius = opts.radius ?? 3;
    this.alive = true;
    this.damage = opts.damage ?? NORMAL_DAMAGE;
    this.kind = opts.kind || 'normal';
    this.core = opts.core || COLORS.PLAYER_BULLET;
    this.glow = opts.glow || COLORS.PLAYER_BULLET_GLOW;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove if off screen
    if (this.y < -10 || this.y > CANVAS_HEIGHT + 10 || this.x < -10 || this.x > CANVAS_WIDTH + 10) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Glow effect
    ctx.fillStyle = this.glow;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = this.core;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Light outline around every hostile bullet, switched on per stage
// (background theme `bulletOutline`) where the backdrop shares the
// bullets' hue (S4's dark red-violet) so they never sink into it.
let hostileBulletOutline = false;

function setHostileBulletOutline(on) {
  hostileBulletOutline = !!on;
}

function drawHostileBulletOutline(ctx, x, y, r) {
  if (!hostileBulletOutline) return;
  ctx.strokeStyle = COLORS.BULLET_OUTLINE;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Visual styles for EnemyBullet (DESIGN.md 15-3).
const HOSTILE_BULLET_STYLES = {
  enemy: { core: COLORS.ENEMY_BULLET, glow: COLORS.ENEMY_BULLET_GLOW },      // normal red
  revenge: { core: COLORS.REVENGE_BULLET, glow: COLORS.REVENGE_BULLET_GLOW }, // pink, slow
  reflect: { core: COLORS.REFLECT_BULLET, glow: COLORS.REFLECT_BULLET_GLOW }, // cyan-white
};

/**
 * Enemy bullet - moves in a specified direction
 */
class EnemyBullet {
  constructor(x, y, vx, vy, style) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.alive = true;
    this.style = HOSTILE_BULLET_STYLES[style] || HOSTILE_BULLET_STYLES.enemy;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove if off screen (generous margin)
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 ||
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }

  draw(ctx) {
    // Glow
    ctx.fillStyle = this.style.glow;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawHostileBulletOutline(ctx, this.x, this.y, this.radius);

    // Core
    ctx.fillStyle = this.style.core;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Boss bullet - distinct appearance
 */
class BossBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.alive = true;
    this.frame = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.frame++;
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 ||
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.2) * 0.2;

    // Glow
    ctx.fillStyle = COLORS.BOSS_BULLET_GLOW;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 4) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawHostileBulletOutline(ctx, this.x, this.y, this.radius * pulse);

    // Core
    ctx.fillStyle = COLORS.BOSS_BULLET;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Center
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
