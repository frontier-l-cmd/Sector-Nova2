// ============================================================
// SECTOR NOVA 2 - Stage Gimmicks (DESIGN.md 12)
// ------------------------------------------------------------
// One gimmick per stage, started by timeline events.
//   S1 giant asteroid ('asteroid' event): a slow rock (radius 28,
//   HP 12) that hurts the ship on contact. Destroyed, it bursts into
//   5 fragments that fly outward and damage ENEMIES only (3 each);
//   they never hit the ship. Teaches "break the rock into enemies".
// Later stages add theirs here (S2 walls, S3 lightning / clouds, ...).
// ============================================================

class Asteroid extends Enemy {
  constructor(x, y) {
    super(x, y > 0 ? y : -ASTEROID_RADIUS, 'ASTEROID');
    this.hp = ASTEROID_HP;
    this.score = ASTEROID_SCORE;
    this.radius = ASTEROID_RADIUS;
    this.largeFlag = true;
    this.survivesRam = true; // touching it hurts the ship, the rock stays
    this.spin = 0;
    // Lumpy outline, fixed per rock
    this.outline = [];
    for (let i = 0; i < 11; i++) {
      this.outline.push(ASTEROID_RADIUS * randFloat(0.82, 1.05));
    }
  }

  update() {
    this.frame++;
    this.spin += 0.006;
    this.y += ASTEROID_SPEED;
    if (this.isOffScreen()) this.alive = false;
  }

  /** Fragments become player-side projectiles that hit enemies only. */
  deathPlayerShots() {
    const shots = [];
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < ASTEROID_FRAGMENTS; i++) {
      const a = offset + (Math.PI * 2 * i) / ASTEROID_FRAGMENTS;
      shots.push(new AsteroidFragment(this.x, this.y, a));
    }
    return shots;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    const shape = (scale) => {
      ctx.beginPath();
      this.outline.forEach((r, i) => {
        const a = (Math.PI * 2 * i) / this.outline.length;
        const px = Math.cos(a) * r * scale;
        const py = Math.sin(a) * r * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    };
    ctx.fillStyle = COLORS.ASTEROID_BODY;
    shape(1);
    ctx.fillStyle = COLORS.ASTEROID_DARK;
    shape(0.7);
    // Craters
    ctx.fillStyle = COLORS.ASTEROID_BODY;
    for (const [cx, cy, cr] of [[-8, -6, 5], [9, 4, 4], [-2, 11, 3]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lit edge
    ctx.fillStyle = COLORS.ASTEROID_LIGHT;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-6, -14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Rock shard from a destroyed asteroid. Lives in playerBullets (so it
 * can only hit enemies), one hit each.
 */
class AsteroidFragment extends PlayerBullet {
  constructor(x, y, angle) {
    super(x, y, Math.cos(angle) * ASTEROID_FRAGMENT_SPEED, Math.sin(angle) * ASTEROID_FRAGMENT_SPEED, {
      kind: 'fragment',
      damage: ASTEROID_FRAGMENT_DAMAGE,
      radius: 5,
    });
    this.life = ASTEROID_FRAGMENT_LIFE;
    this.spin = angle;
  }

  update() {
    super.update();
    this.spin += 0.2;
    if (--this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin);
    ctx.globalAlpha = Math.min(1, this.life / 15);
    ctx.fillStyle = COLORS.ASTEROID_BODY;
    fillPolygon(ctx, [[-5, -3], [1, -6], [6, -1], [3, 5], [-4, 4]]);
    ctx.fillStyle = COLORS.ASTEROID_LIGHT;
    ctx.fillRect(-2, -3, 2, 2);
    ctx.restore();
  }
}

ENEMY_FACTORIES.ASTEROID = (x, y) => new Asteroid(x, y);
