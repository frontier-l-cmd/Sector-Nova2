// ============================================================
// SECTOR NOVA 2 - Stage Gimmicks (DESIGN.md 12)
// ------------------------------------------------------------
// One gimmick per stage, started by timeline events.
//   S1 giant asteroid ('asteroid' event): a slow rock (radius 28,
//   HP 12) that hurts the ship on contact. Destroyed, it bursts into
//   5 fragments that fly outward and damage ENEMIES only (3 each);
//   they never hit the ship. Teaches "break the rock into enemies".
//   S2 narrow passage ('wall' event): "CAUTION: NARROW PASSAGE" for
//   3 seconds, then metal walls scroll in from the top on both sides
//   with the floor. The gap is never under PASSAGE_MIN_GAP. Touching
//   a wall hurts and pushes the ship back. GUN DECKs sit on the wall
//   edges, and one odd-colored wall panel hides the NOVA CRYSTAL.
// Later stages add theirs here (S3 lightning / clouds, ...).
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

// ------------------------------------------------------------
// S2 narrow passage
// ------------------------------------------------------------

// Wall profile along the passage: d = px from its leading (lower)
// end, [left wall width, right wall width]. Linear in between.
// The gap (CANVAS_WIDTH - left - right) never drops under
// PASSAGE_MIN_GAP; slopes stay gentle so the ship can follow.
const PASSAGE_PROFILE_S2 = [
  [0, 0, 0],
  [70, 55, 55],
  [150, 90, 90],
  [230, 90, 90],
  [320, 40, 140],
  [400, 40, 140],
  [500, 135, 45],
  [580, 135, 45],
  [650, 85, 85],
  [720, 0, 0],
];

// Things built into the walls: GUN DECKs on the edges and the one
// odd panel (NOVA CRYSTAL). d along the passage, side of the wall.
const PASSAGE_EMBEDS_S2 = [
  { d: 120, side: 'left', type: 'GUN_DECK' },
  { d: 200, side: 'right', type: 'GUN_DECK' },
  { d: 360, side: 'right', type: 'GUN_DECK' },
  { d: 375, side: 'left', type: 'PANEL' },
  { d: 470, side: 'left', type: 'GUN_DECK' },
  { d: 545, side: 'right', type: 'GUN_DECK' },
  { d: 620, side: 'left', type: 'GUN_DECK' },
];

/** Interpolate a profile at distance d. Returns [left, right]. */
function passageWidthsAt(profile, d) {
  if (d <= profile[0][0] || d >= profile[profile.length - 1][0]) return [0, 0];
  for (let i = 1; i < profile.length; i++) {
    const [d1, l1, r1] = profile[i];
    if (d <= d1) {
      const [d0, l0, r0] = profile[i - 1];
      const k = (d - d0) / (d1 - d0);
      return [l0 + (l1 - l0) * k, r0 + (r1 - r0) * k];
    }
  }
  return [0, 0];
}

/** Narrowest gap of a profile (checked in DEBUG_MODE). */
function passageMinGap(profile) {
  let min = CANVAS_WIDTH;
  for (const [, l, r] of profile) min = Math.min(min, CANVAS_WIDTH - l - r);
  return min;
}

class NarrowPassage {
  constructor(profile, embeds) {
    this.profile = profile || PASSAGE_PROFILE_S2;
    this.embeds = (embeds || PASSAGE_EMBEDS_S2).map(e => ({ ...e, placed: false }));
    this.length = this.profile[this.profile.length - 1][0];
    this.caution = PASSAGE_CAUTION_FRAMES;
    // The leading end reaches the top of the screen when CAUTION ends.
    this.frontY = -PASSAGE_SCROLL * PASSAGE_CAUTION_FRAMES;
    this.frame = 0;
    this.alive = true;
    if (DEBUG_MODE && passageMinGap(this.profile) < PASSAGE_MIN_GAP) {
      console.warn('passage: gap under ' + PASSAGE_MIN_GAP + 'px');
    }
  }

  /** Wall widths [left, right] at screen y. */
  widthsAt(y) {
    return passageWidthsAt(this.profile, this.frontY - y);
  }

  get cautionActive() {
    return this.caution > 0;
  }

  update(world) {
    this.frame++;
    if (this.caution > 0) this.caution--;
    this.frontY += PASSAGE_SCROLL;
    // Build each embed into the wall just before it scrolls into view.
    for (const e of this.embeds) {
      const y = this.frontY - e.d;
      if (e.placed || y < -24) continue;
      e.placed = true;
      const [l, r] = passageWidthsAt(this.profile, e.d);
      // Sitting on the wall's edge, so a ship hugging the wall can hit it.
      const x = e.side === 'left' ? l + 2 : CANVAS_WIDTH - r - 2;
      const enemy = e.type === 'PANEL' ? new WallPanel(x, y) : ENEMY_FACTORIES[e.type](x, y);
      world.addEnemy(enemy);
    }
    if (this.frontY - this.length > CANVAS_HEIGHT) this.alive = false;
  }

  /**
   * Keep the ship out of the walls. Touching one costs a life (unless
   * invincible) and pushes the ship back into the passage.
   */
  collidePlayer(player, onHit) {
    if (!player.alive) return;
    const r = player.hitRadius;
    let left = 0;
    let right = 0;
    for (const y of [player.y - r, player.y, player.y + r]) {
      const [l, w] = this.widthsAt(y);
      left = Math.max(left, l);
      right = Math.max(right, w);
    }
    if (left > 0 && player.x - r < left) {
      onHit();
      player.x = Math.min(left + r + PASSAGE_PUSHBACK, CANVAS_WIDTH - right - r);
    } else if (right > 0 && player.x + r > CANVAS_WIDTH - right) {
      onHit();
      player.x = Math.max(CANVAS_WIDTH - right - r - PASSAGE_PUSHBACK, left + r);
    }
  }

  draw(ctx) {
    const top = Math.max(0, this.frontY - this.length);
    const bottom = Math.min(CANVAS_HEIGHT, this.frontY);
    if (bottom <= top) return;
    const step = 4;
    ctx.save();
    for (const side of ['left', 'right']) {
      // Wall body as one polygon following the profile.
      const pts = [];
      for (let y = top; y <= bottom; y += step) {
        const [l, r] = this.widthsAt(y);
        pts.push([y, side === 'left' ? l : CANVAS_WIDTH - r]);
      }
      const edgeX = side === 'left' ? 0 : CANVAS_WIDTH;
      ctx.fillStyle = COLORS.WALL_BODY;
      ctx.beginPath();
      ctx.moveTo(edgeX, top);
      for (const [y, x] of pts) ctx.lineTo(x, y);
      ctx.lineTo(edgeX, bottom);
      ctx.closePath();
      ctx.fill();

      // Plate seams scrolling with the wall
      ctx.strokeStyle = COLORS.WALL_DARK;
      ctx.lineWidth = 1;
      const seamStart = this.frontY - Math.floor(this.frontY / 24) * 24;
      for (let y = seamStart; y <= bottom; y += 24) {
        if (y < top) continue;
        const [l, r] = this.widthsAt(y);
        const w = side === 'left' ? l : r;
        if (w <= 2) continue;
        ctx.beginPath();
        ctx.moveTo(side === 'left' ? 0 : CANVAS_WIDTH - w, y);
        ctx.lineTo(side === 'left' ? w : CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Bright lip with yellow hazard dashes along the inner edge
      ctx.strokeStyle = COLORS.WALL_EDGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach(([y, x], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.strokeStyle = COLORS.WALL_STRIPE;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.frontY;
      ctx.beginPath();
      const inset = side === 'left' ? -4 : 4;
      pts.forEach(([y, x], i) => {
        const px = x === edgeX ? x : x + inset;
        if (i === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

/**
 * The odd-colored wall panel (S2 NOVA CRYSTAL). Built into the wall,
 * scrolls with it, never rams; destroying it drops the crystal.
 */
class WallPanel extends Enemy {
  constructor(x, y) {
    super(x, y, 'WALL_PANEL');
    this.hp = WALL_PANEL_HP;
    this.score = WALL_PANEL_SCORE;
    this.radius = WALL_PANEL_RADIUS;
    this.ground = true;
    this.noDrop = true;
    this.crystalDrop = true;
  }

  update() {
    this.frame++;
    this.y += PASSAGE_SCROLL;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = COLORS.WALL_DARK;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = COLORS.WALL_PANEL_ODD;
    ctx.fillRect(-9, -9, 18, 18);
    // A faint shimmer runs across it now and then
    const k = (this.frame % 120) / 120;
    ctx.fillStyle = COLORS.WALL_PANEL_ODD_LIGHT;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-9 + k * 16, -9, 2, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.WALL_DARK;
    for (const [bx, by] of [[-8, -8], [6, -8], [-8, 6], [6, 6]]) ctx.fillRect(bx, by, 2, 2);
    ctx.restore();
  }
}
