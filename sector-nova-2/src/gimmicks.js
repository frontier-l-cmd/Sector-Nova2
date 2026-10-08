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
//   a wall hurts and pushes the ship back. A GUN DECK sits on a wall
//   edge, and one odd-colored wall panel hides the NOVA CRYSTAL.
//   S3 storm ('gimmickStart' / 'gimmickEnd' with type 'storm' or
//   'clouds', and 'hazard' for single strikes): lightning bolts warn
//   with a blinking line for 60 frames, then strike for 20 (at most 2
//   at once). Cloud bands (opacity 0.7) drift down: enemies under a
//   cloud are hidden, but hostile bullets and warnings are always
//   drawn above the clouds.
//   S4 flesh wall maze ('wall' event, type 'flesh'): "CAUTION / FLESH
//   WALLS", then rows of flesh blocks (HP 3) drift down, each row with
//   a 2-block gap in a new place. Touching a block hurts (it stays);
//   every block can be shot open, so there is always a way through.
//   One odd-patterned block hides the NOVA CRYSTAL.
// Later stages add theirs here (S5 flares, ...).
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

// Things built into the walls: a GUN DECK on the edge and the one
// odd panel (NOVA CRYSTAL). d along the passage, side of the wall.
// (One gun only, to stay within the S2 enemy-fire guideline.)
const PASSAGE_EMBEDS_S2 = [
  { d: 360, side: 'right', type: 'GUN_DECK' },
  { d: 375, side: 'left', type: 'PANEL' },
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

// ------------------------------------------------------------
// S3 storm: lightning and cloud bands
// ------------------------------------------------------------

/** One lightning bolt as a telegraphed Hazard (phone-readable warning). */
function createLightning(x, opts) {
  return new Hazard({
    shape: 'vline',
    x: clamp(x, LIGHTNING_WIDTH, CANVAS_WIDTH - LIGHTNING_WIDTH),
    width: (opts && opts.width) || LIGHTNING_WIDTH,
    warnFrames: (opts && opts.warnFrames) || LIGHTNING_WARN_FRAMES,
    activeFrames: LIGHTNING_ACTIVE_FRAMES,
    color: COLORS.STORM_BOLT,
    emphasis: true,
    tag: 'lightning',
    onActivate: (opts && opts.onActivate) || null,
  });
}

/**
 * A drifting cloud band. Its lumpy shape is painted once to an
 * offscreen canvas and drawn at CLOUD_ALPHA.
 */
class CloudBand {
  constructor(y, x0, x1, height) {
    this.y = y;
    this.x0 = x0;
    this.x1 = x1;
    this.height = height;
    const w = Math.ceil(x1 - x0) + 40;
    const h = height + 30;
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    const g = this.canvas.getContext('2d');
    const puffs = Math.max(4, Math.round(w / 26));
    for (let i = 0; i < puffs; i++) {
      const px = 20 + (w - 40) * (i / (puffs - 1));
      const r = height * randFloat(0.42, 0.6);
      g.fillStyle = COLORS.CLOUD_BODY;
      g.beginPath();
      g.arc(px, h / 2 + randFloat(-height * 0.12, height * 0.12), r, 0, Math.PI * 2);
      g.fill();
    }
    // Light rim on top
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = COLORS.CLOUD_LIGHT;
    g.fillRect(0, 0, w, h * 0.3);
  }

  update() {
    this.y += CLOUD_SPEED;
  }

  get offScreen() {
    return this.y - this.height > CANVAS_HEIGHT + 20;
  }

  /** True if (x, y) is inside the band (for tests / hiding checks). */
  covers(x, y) {
    return x >= this.x0 && x <= this.x1 && Math.abs(y - this.y) <= this.height / 2;
  }

  draw(ctx) {
    ctx.drawImage(this.canvas, this.x0 - 20, this.y - this.canvas.height / 2);
  }
}

class StormWeather {
  constructor() {
    this.clouds = [];
    this.cloudsOn = false;
    this.stormOn = false;
    this.cloudTimer = 0;
    this.strikeTimer = STORM_STRIKE_INTERVAL / 2;
    this.strikeCount = 0;
    this.side = 0;
  }

  start(type) {
    if (type === 'clouds') {
      this.cloudsOn = true;
      this.cloudTimer = 0;
    } else if (type === 'storm') {
      this.stormOn = true;
      this.strikeTimer = STORM_STRIKE_INTERVAL / 2;
    }
  }

  stop(type) {
    if (type === 'clouds') this.cloudsOn = false;
    else if (type === 'storm') this.stormOn = false;
  }

  /** A band covering roughly two thirds of the width, alternating sides. */
  addBand(y, x) {
    const height = randInt(CLOUD_MIN_HEIGHT, CLOUD_MAX_HEIGHT);
    let x0;
    let x1;
    if (x !== undefined) {
      x0 = clamp(x - 90, 0, CANVAS_WIDTH);
      x1 = clamp(x + 90, 0, CANVAS_WIDTH);
    } else {
      const w = CANVAS_WIDTH * randFloat(0.55, 0.7);
      this.side = 1 - this.side;
      x0 = this.side === 0 ? -10 : CANVAS_WIDTH - w + 10;
      x1 = x0 + w;
    }
    const band = new CloudBand(y ?? -height, x0, x1, height);
    this.clouds.push(band);
    return band;
  }

  update(world) {
    if (this.cloudsOn && --this.cloudTimer <= 0) {
      this.cloudTimer = CLOUD_INTERVAL;
      this.addBand();
    }
    for (const c of this.clouds) c.update();
    this.clouds = this.clouds.filter(c => !c.offScreen);

    if (this.stormOn && !world.spawnsLocked && --this.strikeTimer <= 0) {
      this.strikeTimer = STORM_STRIKE_INTERVAL;
      // Every other bolt falls near the ship; the rest anywhere.
      const x = this.strikeCount++ % 2 === 0
        ? world.player.x + randInt(-20, 20)
        : randInt(30, CANVAS_WIDTH - 30);
      world.addLightning(x);
    }
  }

  get active() {
    return this.cloudsOn || this.stormOn || this.clouds.length > 0;
  }

  draw(ctx) {
    if (!this.clouds.length) return;
    ctx.save();
    ctx.globalAlpha = CLOUD_ALPHA;
    for (const c of this.clouds) c.draw(ctx);
    ctx.restore();
  }
}

// ------------------------------------------------------------
// S4 flesh wall maze
// ------------------------------------------------------------

// Gap column (left block of the 2-block gap) for each row, top row
// first. Every row's gap is in a new place, and each block can be shot.
const FLESH_MAZE_S4 = {
  gaps: [4, 1, 6, 3, 7, 2, 5, 0, 4, 7, 1, 5],
  odd: { row: 6, col: 2 },   // the odd-patterned block (NOVA CRYSTAL)
};

/** One flesh block: terrain that hurts on touch and opens when shot. */
class FleshBlock extends Enemy {
  constructor(x, y, odd) {
    super(x, y, odd ? 'FLESH_ODD' : 'FLESH_BLOCK');
    this.hp = FLESH_BLOCK_HP;
    this.score = FLESH_BLOCK_SCORE;
    this.radius = 14;            // touch / hit circle inside the 32x24 block
    this.survivesRam = true;     // touching it hurts the ship, the block stays
    this.noDrop = true;          // terrain, not an enemy that drops items
    this.odd = !!odd;
    this.crystalDrop = this.odd; // S4 NOVA CRYSTAL
    this.pulse = Math.random() * Math.PI * 2;
    this.flash = 0;
  }

  applyDamage(amount) {
    this.hp -= amount;
    this.flash = 4;
    return amount;
  }

  update() {
    this.frame++;
    this.y += FLESH_FALL_SPEED;
    if (this.flash > 0) this.flash--;
    if (this.isOffScreen()) this.alive = false;
  }

  draw(ctx) {
    const w = FLESH_BLOCK_W - 2;
    const h = FLESH_BLOCK_H - 2;
    const breathe = Math.sin(this.frame * 0.06 + this.pulse) * 1;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Membrane outline: a pale rim no enemy or bullet has
    ctx.fillStyle = COLORS.FLESH_MEMBRANE;
    roundRectPath(ctx, -w / 2 - 1, -h / 2 - 1 - breathe / 2, w + 2, h + 2 + breathe, 7);
    ctx.fill();
    ctx.fillStyle = this.flash > 0 ? COLORS.FLESH_LIGHT : (this.odd ? COLORS.FLESH_ODD : COLORS.FLESH_BODY);
    roundRectPath(ctx, -w / 2, -h / 2 - breathe / 2, w, h + breathe, 6);
    ctx.fill();
    if (this.odd) {
      // A different pattern: pale spots in a ring
      ctx.fillStyle = COLORS.FLESH_ODD_LIGHT;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + this.frame * 0.01;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 8, Math.sin(a) * 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dark folds (striped flesh)
      ctx.strokeStyle = COLORS.FLESH_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, -3); ctx.quadraticCurveTo(-2, -7, w / 2 - 4, -2);
      ctx.moveTo(-w / 2 + 4, 4); ctx.quadraticCurveTo(2, 0, w / 2 - 4, 5);
      ctx.stroke();
    }
    // Damage shows as darker cracks
    if (this.hp < FLESH_BLOCK_HP) {
      ctx.strokeStyle = COLORS.FLESH_DARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, -h / 2 + 2); ctx.lineTo(-2, 0); ctx.lineTo(-7, h / 2 - 2);
      if (this.hp < FLESH_BLOCK_HP - 1) { ctx.moveTo(6, -h / 2 + 2); ctx.lineTo(3, 2); ctx.lineTo(8, h / 2 - 2); }
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Rounded rectangle path helper. */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

class FleshMaze {
  constructor(layout) {
    this.layout = layout || FLESH_MAZE_S4;
    this.caution = FLESH_CAUTION_FRAMES;
    this.row = 0;
    this.rowTimer = 0;
    this.alive = true;
  }

  get cautionActive() {
    return this.caution > 0;
  }

  /** Blocks of one row (every column except the gap). */
  buildRow(index) {
    const gap = this.layout.gaps[index];
    const blocks = [];
    for (let c = 0; c < FLESH_COLUMNS; c++) {
      if (c >= gap && c < gap + FLESH_GAP_COLUMNS) continue;
      const odd = this.layout.odd && this.layout.odd.row === index && this.layout.odd.col === c;
      blocks.push(new FleshBlock((c + 0.5) * FLESH_BLOCK_W, -FLESH_BLOCK_H / 2, odd));
    }
    return blocks;
  }

  update(world) {
    if (this.caution > 0) {
      this.caution--;
      return;
    }
    if (this.row >= this.layout.gaps.length) {
      this.alive = false;
      return;
    }
    if (--this.rowTimer <= 0) {
      this.rowTimer = Math.round(FLESH_ROW_SPACING / FLESH_FALL_SPEED);
      for (const b of this.buildRow(this.row)) world.addEnemy(b);
      this.row++;
    }
  }
}
