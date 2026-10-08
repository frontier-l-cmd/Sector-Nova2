// ============================================================
// SECTOR NOVA 2 - Bullet Patterns & Hazards
// ------------------------------------------------------------
// Every hostile bullet in the game is made here, so difficulty
// multipliers (bullet speed / fire rate) and the bullet speed cap
// are applied in exactly one place (DESIGN.md 15-3).
//
//   Patterns.aimed / fan / ring / spiral / burstFromDeath
//
// Each returns an array of bullets; the caller hands it to
// game.addEnemyBullets(). Angles are radians: 0 = right,
// PI / 2 = straight down. `kind` picks the bullet:
//   'enemy' (red), 'boss' (orange), 'revenge' (pink), 'reflect' (cyan).
//
// Hazard is the shared telegraph-then-strike object for lasers,
// lightning, flares, falling ice, ...:
//   'warn' (blinking guide, harmless, >= HAZARD_MIN_WARN_FRAMES)
//   -> 'active' (hurts) -> removed.
// ============================================================

// Difficulty the patterns scale for; the Game keeps it in sync with
// the title-screen setting (setPatternDifficulty).
let patternDifficultyLevel = DEFAULT_DIFFICULTY;

function setPatternDifficulty(level) {
  if (DIFFICULTY_SETTINGS[level]) patternDifficultyLevel = level;
}

/** Difficulty multipliers used by the patterns (DESIGN.md 13). */
function patternDifficulty() {
  return DIFFICULTY_SETTINGS[patternDifficultyLevel];
}

/** Base bullet speed -> speed for the current difficulty, capped. */
function scaledBulletSpeed(speed) {
  const mul = patternDifficulty().bulletSpeed;
  return Math.min(speed * mul, ENEMY_BULLET_MAX_SPEED * mul);
}

/** Base fire interval (frames) -> interval for the current difficulty. */
function scaledFireInterval(frames) {
  return Math.max(1, Math.round(frames / patternDifficulty().fireRate));
}

function makeHostileBullet(kind, x, y, angle, speed) {
  const s = scaledBulletSpeed(speed);
  const vx = Math.cos(angle) * s;
  const vy = Math.sin(angle) * s;
  return kind === 'boss'
    ? new BossBullet(x, y, vx, vy)
    : new EnemyBullet(x, y, vx, vy, kind);
}

const Patterns = {
  /** One bullet from (x, y) toward (tx, ty). */
  aimed({ x, y, tx, ty, speed, kind = 'enemy' }) {
    return [makeHostileBullet(kind, x, y, angleTo(x, y, tx, ty), speed)];
  },

  /** `count` bullets spread `step` radians apart, centered on `angle`. */
  fan({ x, y, angle = Math.PI / 2, count = 3, step = 0.3, speed, kind = 'enemy' }) {
    const bullets = [];
    const half = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      bullets.push(makeHostileBullet(kind, x, y, angle + (i - half) * step, speed));
    }
    return bullets;
  },

  /** `count` bullets evenly around a full circle, rotated by `offset`. */
  ring({ x, y, count = 12, speed, offset = 0, kind = 'enemy' }) {
    const bullets = [];
    for (let i = 0; i < count; i++) {
      bullets.push(makeHostileBullet(kind, x, y, offset + (Math.PI * 2 * i) / count, speed));
    }
    return bullets;
  },

  /**
   * One volley of a spiral: `arms` bullets evenly spaced, starting at
   * `angle`. Call it every few frames while advancing `angle`.
   */
  spiral({ x, y, arms = 2, speed, angle = 0, kind = 'enemy' }) {
    return Patterns.ring({ x, y, count: arms, speed, offset: angle, kind });
  },

  /**
   * Slow pink "revenge" ring fired when an enemy dies. The count is
   * scaled by the difficulty (none on EASY, 1.5x on HARD).
   */
  burstFromDeath({ x, y, count = 6, speed = REVENGE_BULLET_SPEED, offset = 0 }) {
    const n = Math.round(count * patternDifficulty().revenge);
    if (n <= 0) return [];
    return Patterns.ring({ x, y, count: n, speed, offset, kind: 'revenge' });
  },
};

/**
 * Telegraphed danger. Shapes:
 *   'vline'  : vertical band at x, `width` wide (lightning)
 *   'hline'  : horizontal band at y, `width` tall (flare)
 *   'beam'   : from (x, y) along `angle`, `length` long, `width` thick
 *              (lasers; `angularSpeed` rotates it while active)
 *   'circle' : disc at (x, y) with `radius` (impact / shadow)
 * `follow(hazard)` runs every frame to move the origin (boss-mounted
 * lasers). `onActivate(hazard)` runs once when the strike begins.
 * `emphasis: true` (vline / hline) makes the warning easier to read on
 * a phone: the strike width is outlined with dashes, the guide line is
 * thicker and "!" markers sit at both screen edges. `tag` names the
 * hazard's kind (e.g. 'lightning') for counting.
 */
class Hazard {
  constructor(opts) {
    this.shape = opts.shape || 'vline';
    this.x = opts.x ?? CANVAS_WIDTH / 2;
    this.y = opts.y ?? 0;
    this.width = opts.width ?? HAZARD_DEFAULT_WIDTH;
    this.angle = opts.angle ?? Math.PI / 2;
    this.angularSpeed = opts.angularSpeed ?? 0;
    this.length = opts.length ?? CANVAS_HEIGHT * 1.5;
    this.radius = opts.radius ?? 20;
    // DESIGN.md 17: every danger gets at least 40 frames of warning.
    this.warnFrames = Math.max(HAZARD_MIN_WARN_FRAMES, opts.warnFrames ?? HAZARD_DEFAULT_WARN_FRAMES);
    this.activeFrames = opts.activeFrames ?? HAZARD_DEFAULT_ACTIVE_FRAMES;
    this.color = opts.color || COLORS.HAZARD_GLOW;
    this.warnColor = opts.warnColor || COLORS.HAZARD_WARN;
    this.follow = opts.follow || null;
    this.onActivate = opts.onActivate || null;
    this.emphasis = !!opts.emphasis;
    this.tag = opts.tag || null;
    this.timer = 0;
    this.alive = true;
  }

  get isWarning() {
    return this.alive && this.timer < this.warnFrames;
  }

  get isActive() {
    return this.alive && this.timer >= this.warnFrames;
  }

  update() {
    if (!this.alive) return;
    if (this.follow) this.follow(this);
    if (this.isActive) this.angle += this.angularSpeed;
    this.timer++;
    if (this.timer === this.warnFrames && this.onActivate) this.onActivate(this);
    if (this.timer >= this.warnFrames + this.activeFrames) this.alive = false;
  }

  /** True if an active hazard overlaps the circle (px, py, r). */
  hitsCircle(px, py, r) {
    if (!this.isActive) return false;
    const half = this.width / 2;
    switch (this.shape) {
      case 'vline':
        return Math.abs(px - this.x) < half + r;
      case 'hline':
        return Math.abs(py - this.y) < half + r;
      case 'circle':
        return circleCollision(px, py, r, this.x, this.y, this.radius);
      case 'beam': {
        // Distance from the point to the beam segment.
        const dx = Math.cos(this.angle);
        const dy = Math.sin(this.angle);
        const along = clamp((px - this.x) * dx + (py - this.y) * dy, 0, this.length);
        return dist(px, py, this.x + dx * along, this.y + dy * along) < half + r;
      }
      default:
        return false;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    if (this.isWarning) {
      // Thin blinking guide; never filled, so it reads as "not yet".
      ctx.globalAlpha = Math.floor(this.timer / 4) % 2 === 0 ? 0.85 : 0.35;
      ctx.strokeStyle = this.warnColor;
      ctx.fillStyle = this.warnColor;
      ctx.lineWidth = 1;
      if (this.emphasis) this.drawEmphasis(ctx);
      else this.drawShape(ctx, 2, true);
    } else {
      const fade = 0.75 + Math.sin(this.timer * 0.8) * 0.25;
      ctx.globalAlpha = 0.35 * fade;
      ctx.fillStyle = this.color;
      this.drawShape(ctx, this.width + 6, false);
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color;
      this.drawShape(ctx, this.width, false);
      ctx.fillStyle = COLORS.HAZARD_CORE;
      this.drawShape(ctx, Math.max(2, this.width * 0.35), false);
    }
    ctx.restore();
  }

  /**
   * Phone-readable warning (vline / hline only): dashed outline of the
   * strike width, a 3 px guide line and "!" markers at both edges.
   * Still never filled, so it reads as "not yet".
   */
  drawEmphasis(ctx) {
    const half = this.width / 2;
    const vertical = this.shape === 'vline';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -this.timer;
    if (vertical) ctx.strokeRect(this.x - half + 0.5, -2, this.width - 1, CANVAS_HEIGHT + 4);
    else ctx.strokeRect(-2, this.y - half + 0.5, CANVAS_WIDTH + 4, this.width - 1);
    ctx.setLineDash([]);
    this.drawShape(ctx, 3, true);
    // "!" markers in a small triangle at both ends of the line
    const ends = vertical ? [[this.x, 44], [this.x, CANVAS_HEIGHT - 14]] : [[14, this.y], [CANVAS_WIDTH - 14, this.y]];
    for (const [mx, my] of ends) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORS.LIGHTNING_MARK;
      ctx.beginPath();
      ctx.moveTo(mx, my - 9);
      ctx.lineTo(mx + 9, my + 7);
      ctx.lineTo(mx - 9, my + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.BG_DARK;
      ctx.fillRect(mx - 1, my - 4, 2, 6);
      ctx.fillRect(mx - 1, my + 3, 2, 2);
    }
  }

  /** Fill (or outline, for warnings) the shape at the given thickness. */
  drawShape(ctx, thickness, outline) {
    const half = thickness / 2;
    switch (this.shape) {
      case 'vline':
        ctx.fillRect(this.x - half, 0, thickness, CANVAS_HEIGHT);
        break;
      case 'hline':
        ctx.fillRect(0, this.y - half, CANVAS_WIDTH, thickness);
        break;
      case 'circle': {
        const r = outline ? this.radius : this.radius + (thickness - this.width) / 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(1, r), 0, Math.PI * 2);
        if (outline) ctx.stroke();
        else ctx.fill();
        break;
      }
      case 'beam':
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(0, -half, this.length, thickness);
        ctx.restore();
        break;
    }
  }
}
