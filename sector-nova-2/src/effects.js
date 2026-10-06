// ============================================================
// SECTOR NOVA 2 - Visual Effects
// ============================================================

/**
 * A single particle used in explosions and hit effects
 */
class Particle {
  constructor(x, y, vx, vy, radius, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97; // friction
    this.vy *= 0.97;
    this.life--;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * Screen flash effect (e.g. boss death)
 */
class ScreenFlash {
  constructor(color, duration) {
    this.color = color;
    this.duration = duration;
    this.maxDuration = duration;
    this.alive = true;
  }

  update() {
    this.duration--;
    if (this.duration <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = (this.duration / this.maxDuration) * 0.6;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }
}

/**
 * Manages all visual effects
 */
/**
 * CHAIN BOLT lightning: a jagged purple-to-white line between two
 * points, re-jittered every frame while it fades.
 */
class LightningArc {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.life = CHAIN_ARC_FRAMES;
    this.alive = true;
  }

  update() {
    if (--this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const steps = 6;
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const nx = -dy / len;
    const ny = dx / len;
    const pts = [[this.x1, this.y1]];
    for (let i = 1; i < steps; i++) {
      const j = randFloat(-6, 6);
      pts.push([this.x1 + dx * i / steps + nx * j, this.y1 + dy * i / steps + ny * j]);
    }
    pts.push([this.x2, this.y2]);

    const alpha = this.life / CHAIN_ARC_FRAMES;
    const strokes = [[COLORS.CHAIN_GLOW, 4, 0.5], [COLORS.CHAIN_BODY, 2, 1], [COLORS.UI_WHITE, 1, 1]];
    for (const [color, width, a] of strokes) {
      ctx.globalAlpha = alpha * a;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/**
 * NOVA BURST shockwave: white-gold ring expanding from the ship.
 */
class BurstRing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = BURST_RING_FRAMES;
    this.alive = true;
  }

  update() {
    if (--this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const t = 1 - this.life / BURST_RING_FRAMES; // 0 -> 1
    const r = 10 + t * CANVAS_HEIGHT;
    ctx.globalAlpha = (1 - t) * 0.5;
    ctx.strokeStyle = COLORS.BURST_GLOW;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = COLORS.BURST_RING;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

class EffectsManager {
  constructor() {
    this.particles = [];
    this.flashes = [];
    this.shapes = []; // lightning arcs, burst rings
  }

  /**
   * Create a small explosion (enemy death)
   */
  explode(x, y, count, size) {
    count = count || 12;
    size = size || 3;
    const colors = [COLORS.EXPLOSION_INNER, COLORS.EXPLOSION_MID, COLORS.EXPLOSION_OUTER];
    for (let i = 0; i < count; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(1, 4);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[randInt(0, colors.length - 1)];
      const life = randInt(15, 35);
      const radius = randFloat(1.5, size);
      this.particles.push(new Particle(x, y, vx, vy, radius, color, life));
    }
  }

  /**
   * Create a big explosion (boss death)
   */
  bigExplode(x, y) {
    // Multiple waves of particles
    for (let wave = 0; wave < 3; wave++) {
      const count = 20 + wave * 10;
      const colors = [COLORS.EXPLOSION_INNER, COLORS.EXPLOSION_MID, COLORS.EXPLOSION_OUTER, COLORS.BOSS_GLOW];
      for (let i = 0; i < count; i++) {
        const angle = randFloat(0, Math.PI * 2);
        const speed = randFloat(1, 6 + wave * 2);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const color = colors[randInt(0, colors.length - 1)];
        const life = randInt(25, 55 + wave * 10);
        const radius = randFloat(2, 5 + wave);
        this.particles.push(new Particle(x, y, vx, vy, radius, color, life));
      }
    }
    // Screen flash
    this.flashes.push(new ScreenFlash(COLORS.EXPLOSION_INNER, 20));
  }

  /**
   * Create a small hit spark
   */
  hitSpark(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(1, 3);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = randInt(5, 12);
      this.particles.push(new Particle(x, y, vx, vy, 2, COLORS.HIT_FLASH, life));
    }
  }

  /**
   * Create a powerup pickup effect
   */
  powerupPickup(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(2, 5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = randInt(15, 30);
      this.particles.push(new Particle(x, y, vx, vy, 2.5, COLORS.POWERUP_GLOW, life));
    }
  }

  /** CHAIN BOLT jump between two points. */
  lightning(x1, y1, x2, y2) {
    this.shapes.push(new LightningArc(x1, y1, x2, y2));
  }

  /** Small pale sparks around the ship when a bullet grazes it. */
  grazeSpark(x, y) {
    for (let i = 0; i < 3; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(1, 2.5);
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        1.5, COLORS.GRAZE_SPARK, randInt(6, 12)));
    }
  }

  /** NOVA BURST: expanding ring + white-gold flash. */
  burst(x, y) {
    this.shapes.push(new BurstRing(x, y));
    this.flashes.push(new ScreenFlash(COLORS.BURST_RING, 24));
  }

  update() {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      this.shapes[i].update();
      if (!this.shapes[i].alive) this.shapes.splice(i, 1);
    }
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].alive) {
        this.particles.splice(i, 1);
      }
    }
    // Update screen flashes
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].update();
      if (!this.flashes[i].alive) {
        this.flashes.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const s of this.shapes) {
      s.draw(ctx);
    }
    for (const p of this.particles) {
      p.draw(ctx);
    }
    for (const f of this.flashes) {
      f.draw(ctx);
    }
  }

  clear() {
    this.particles = [];
    this.flashes = [];
    this.shapes = [];
  }
}
