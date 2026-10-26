// ============================================================
// SECTOR NOVA 2 - CORONA SERPENT (S5 boss, DESIGN.md 14)
// ------------------------------------------------------------
// A fire snake: a head and 10 segments. The head crawls an S-shaped
// path over the upper screen (a 1:2 Lissajous curve) and the
// segments follow the trail it leaves. Touching the body hurts.
//   - Weak point: the head only. Segments catch the ship's shots
//     (they take the damage themselves; CORONA_SEGMENT_SCORE each).
//     A destroyed segment is gone and the snake closes up, shorter.
//   - Segments light up one after another, head to tail; each one
//     glows CORONA_SEG_CHARGE frames (telegraph), then fires one
//     aimed shot. Fewer segments, fewer shots.
//   - Every segment destroyed: CORONA_ALL_SEGMENTS_BONUS, and if the
//     head is then defeated the NOVA CRYSTAL appears where it blew up.
//   - Only CORONA_FAN_SEGMENTS_LEFT segments or fewer left: the same
//     flame fan from the head (sooner the fewer remain).
//   - Below 50% HP: crawls faster, and the jaws glow, then breathe a
//     5-way flame fan.
// The damage cap is shared by the head and the segments (BossBase).
// ============================================================

const CORONA_SERPENT_NAME = 'CORONA SERPENT';

/** Point on the head's S path for path angle s. */
function coronaPathPoint(s) {
  return {
    x: CORONA_PATH_CX + Math.sin(s) * CORONA_PATH_AX,
    y: CORONA_PATH_CY + Math.sin(s * 2) * CORONA_PATH_AY,
  };
}

class CoronaSerpent extends BossBase {
  constructor() {
    super({
      name: CORONA_SERPENT_NAME,
      maxHp: CORONA_SERPENT_HP,
      radius: CORONA_SERPENT_RADIUS,
      score: CORONA_SERPENT_SCORE,
      damageCap: CORONA_SERPENT_DAMAGE_CAP,
      startY: -30,
      phases: [{
        name: CORONA_SERPENT_NAME,
        attacks: [{ run: 'tick', duration: 1, rest: 0 }],
      }],
    });
    this.x = CORONA_PATH_CX;
    this.pathAngle = 0;
    this.heading = Math.PI / 2;

    // Segments: parts that follow the trail, `d` px behind the head.
    this.segments = [];
    for (let i = 0; i < CORONA_SEGMENTS; i++) {
      const seg = new BossPart({
        name: 'SEGMENT',
        radius: CORONA_SEGMENT_RADIUS,
        hp: CORONA_SEGMENT_HP,
        score: CORONA_SEGMENT_SCORE,
        onDestroy: (boss, part, world) => boss.onSegmentDestroyed(world),
      });
      seg.d = (i + 1) * CORONA_SEGMENT_SPACING;
      seg.lit = 0;      // > 0: glowing, fires when it reaches 0
      seg.flash = 0;    // hit flash
      this.segments.push(seg);
    }
    this.parts = this.segments;

    // Trail of head positions, newest first; starts as a line going
    // straight up off the screen so the body enters behind the head.
    this.trail = [];
    for (let y = this.y; y > this.y - (CORONA_SEGMENTS + 2) * CORONA_SEGMENT_SPACING; y -= 2) {
      this.trail.push({ x: this.x, y });
    }
    this.placeSegments();

    // Attacks
    this.volleyTimer = 70;   // rest before the next volley
    this.volleyFrame = -1;   // frame within the current volley (-1 = resting)
    this.volleyOrder = [];
    this.fanState = 'off';
    this.fanTimer = 0;

    // NOVA CRYSTAL
    this.allSegmentsDestroyed = false;
    this.crystalEarned = false;
    this.crystal = null;
    this.crystalWait = CORONA_CRYSTAL_WAIT;
  }

  get aliveSegments() {
    return this.segments.filter(s => s.alive);
  }

  /** HUD: segments left, under the HP bar (hitting them is progress too). */
  get subLabel() {
    return 'SEGMENTS ' + this.aliveSegments.length + ' / ' + CORONA_SEGMENTS;
  }

  get fanCharge() {
    return this.state === 'active' && this.fanState === 'charge'
      ? 1 - this.fanTimer / CORONA_FAN_CHARGE : 0;
  }

  // --- Movement ----------------------------------------------------

  /** Crawl in from the top to the start of the S path. */
  updateEntry() {
    const start = coronaPathPoint(0);
    this.moveHeadTo(this.x, Math.min(start.y, this.y + CORONA_ENTRY_SPEED));
    return this.y >= start.y;
  }

  updateMovement() {
    this.pathAngle += this.isEnraged ? CORONA_PATH_SPEED_ENRAGED : CORONA_PATH_SPEED;
    const p = coronaPathPoint(this.pathAngle);
    this.moveHeadTo(p.x, p.y);
  }

  moveHeadTo(x, y) {
    if (x !== this.x || y !== this.y) this.heading = Math.atan2(y - this.y, x - this.x);
    this.x = x;
    this.y = y;
    this.trail.unshift({ x, y });
    this.placeSegments();
  }

  /**
   * Put every live segment on the trail. The k-th live segment wants
   * to be k * spacing behind the head; when one in front is destroyed
   * the rest slide up to close the gap.
   */
  placeSegments() {
    let rank = 0;
    for (const seg of this.segments) {
      if (!seg.alive) continue;
      rank++;
      const want = rank * CORONA_SEGMENT_SPACING;
      seg.d = seg.d > want ? Math.max(want, seg.d - 1.5) : want;
    }
    // Walk the trail once, segments in order of distance.
    const order = this.segments.filter(s => s.alive).sort((a, b) => a.d - b.d);
    let walked = 0;
    let i = 0;
    for (const seg of order) {
      while (i < this.trail.length - 1) {
        const a = this.trail[i];
        const b = this.trail[i + 1];
        const len = dist(a.x, a.y, b.x, b.y);
        if (walked + len >= seg.d) {
          const k = len > 0 ? (seg.d - walked) / len : 0;
          seg.ox = a.x + (b.x - a.x) * k - this.x;
          seg.oy = a.y + (b.y - a.y) * k - this.y;
          break;
        }
        walked += len;
        i++;
      }
      if (i >= this.trail.length - 1) {
        const last = this.trail[this.trail.length - 1];
        seg.ox = last.x - this.x;
        seg.oy = last.y - this.y;
      }
    }
    // Forget the trail beyond the tail.
    if (i + 2 < this.trail.length) this.trail.length = i + 2;
  }

  /** Head and live segments hurt the ship on contact while fighting. */
  touchesCircle(px, py, r) {
    if (this.state !== 'active') return false;
    if (circleCollision(px, py, r, this.x, this.y, this.radius)) return true;
    return this.segments.some(s => s.alive && circleCollision(px, py, r, s.x(this), s.y(this), s.radius));
  }

  // --- Attacks -------------------------------------------------------

  /** Runs every frame: the segment volley and (enraged) the fan. */
  tick(world) {
    this.updateVolley(world);
    this.updateFan(world);
  }

  /** Segments light up head to tail; each fires when its glow ends. */
  updateVolley(world) {
    for (const seg of this.segments) {
      if (seg.flash > 0) seg.flash--;
      if (seg.lit > 0 && --seg.lit === 0 && seg.alive) {
        world.addEnemyBullets(Patterns.aimed({
          x: seg.x(this), y: seg.y(this), tx: world.player.x, ty: world.player.y,
          speed: CORONA_SEG_BULLET_SPEED, kind: 'boss',
        }));
      }
    }
    if (this.volleyFrame < 0) {
      if (--this.volleyTimer > 0) return;
      this.volleyOrder = this.aliveSegments;
      this.volleyFrame = 0;
    }
    const k = this.volleyFrame / CORONA_SEG_STEP;
    if (Number.isInteger(k) && k < this.volleyOrder.length && this.volleyOrder[k].alive) {
      this.volleyOrder[k].lit = CORONA_SEG_CHARGE;
    }
    this.volleyFrame++;
    if (this.volleyFrame > (this.volleyOrder.length - 1) * CORONA_SEG_STEP + CORONA_SEG_CHARGE) {
      this.volleyFrame = -1;
      this.volleyTimer = scaledFireInterval(CORONA_SEG_REST);
    }
  }

  /**
   * The jaws glow, then a 5-way flame fan at the ship. Enraged, or
   * once only CORONA_FAN_SEGMENTS_LEFT segments are left (so a snake
   * stripped of its segments still fights back); before the rage the
   * rest is longer the more segments remain.
   */
  get fanRest() {
    if (this.isEnraged) return CORONA_FAN_REST;
    return CORONA_FAN_REST + CORONA_FAN_REST_PER_SEGMENT * this.aliveSegments.length;
  }

  updateFan(world) {
    if (!this.isEnraged && this.aliveSegments.length > CORONA_FAN_SEGMENTS_LEFT) return;
    if (this.fanState === 'off') {
      this.fanState = 'rest';
      this.fanTimer = 60;
    }
    if (--this.fanTimer > 0) return;
    if (this.fanState === 'rest') {
      this.fanState = 'charge';
      this.fanTimer = CORONA_FAN_CHARGE;
      return;
    }
    const mouth = this.mouthPoint();
    world.addEnemyBullets(Patterns.fan({
      x: mouth.x, y: mouth.y,
      angle: angleTo(mouth.x, mouth.y, world.player.x, world.player.y),
      count: CORONA_FAN_COUNT, step: CORONA_FAN_STEP, speed: CORONA_FAN_SPEED, kind: 'boss',
    }));
    this.fanState = 'rest';
    this.fanTimer = scaledFireInterval(this.fanRest);
  }

  mouthPoint() {
    return { x: this.x + Math.cos(this.heading) * 12, y: this.y + Math.sin(this.heading) * 12 };
  }

  // --- Segments, defeat and the NOVA CRYSTAL --------------------------

  applyHit(target, amount, source, world) {
    if (target !== this && target.alive) target.flash = 4;
    return super.applyHit(target, amount, source, world);
  }

  onSegmentDestroyed(world) {
    if (this.allSegmentsDestroyed || this.aliveSegments.length > 0) return;
    this.allSegmentsDestroyed = true;
    // The stage-wide part bonus (counted on the result screen).
    world.addScore(CORONA_ALL_SEGMENTS_BONUS);
    world.stats.partBonus += CORONA_ALL_SEGMENTS_BONUS;
    world.effects.powerupPickup(this.x, this.y);
    world.audio.play('item');
    this.banner = { text: 'ALL SEGMENTS +' + CORONA_ALL_SEGMENTS_BONUS, timer: 120 };
  }

  beginDefeat(world) {
    this.crystalEarned = this.allSegmentsDestroyed && !world.bossRush && !world.crystalStages.has(world.stage.stageNumber);
    super.beginDefeat(world);
  }

  update(world) {
    // The calm after the explosion lasts until the crystal is taken
    // or has fallen off the screen (at most CORONA_CRYSTAL_WAIT).
    if (this.state === 'afterglow' && this.crystal && this.crystal.alive &&
        world.powerups.includes(this.crystal) && this.crystalWait-- > 0) {
      this.stateTimer = Math.max(this.stateTimer, 2);
    }
    super.update(world);
    if (this.state === 'afterglow' && this.crystalEarned && !this.crystal) {
      this.crystal = new Powerup(clamp(this.x, 24, CANVAS_WIDTH - 24), this.y, ITEM_NOVA_CRYSTAL);
      world.addPowerup(this.crystal);
    }
  }

  // --- Draw ------------------------------------------------------------

  drawBody(ctx) {
    // Tail first, so each segment overlaps the one behind it.
    const alive = this.aliveSegments;
    for (let i = alive.length - 1; i >= 0; i--) this.drawSegment(ctx, alive[i], i);
    this.drawHead(ctx);
  }

  drawSegment(ctx, seg, index) {
    const r = seg.radius;
    const flick = Math.sin(this.frame * 0.3 + index) * 1.5;
    ctx.save();
    ctx.translate(seg.ox, seg.oy);
    // Flame crest
    ctx.fillStyle = COLORS.SERPENT_FLAME;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(-5, -r + 3);
    ctx.quadraticCurveTo(0, -r - 8 - flick, 5, -r + 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Scale with a dark rim (stands out on the bright backdrop)
    ctx.fillStyle = seg.flash > 0 ? COLORS.UI_WHITE : COLORS.SERPENT_SCALE;
    ctx.strokeStyle = COLORS.SERPENT_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Inner plate darkens as the segment is damaged
    const hurt = 1 - seg.hp / seg.maxHp;
    ctx.fillStyle = COLORS.SERPENT_DARK;
    ctx.globalAlpha = 0.35 + hurt * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Lit: a bright core and a ring closing in until it fires
    if (seg.lit > 0) {
      const k = 1 - seg.lit / CORONA_SEG_CHARGE;
      ctx.fillStyle = COLORS.SERPENT_LIT;
      ctx.beginPath();
      ctx.arc(0, 0, 3 + k * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + k * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, r + 8 - k * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawHead(ctx) {
    const r = this.radius;
    const enraged = this.isEnraged;
    const charge = this.fanCharge;
    ctx.save();
    ctx.rotate(this.heading);
    // Flame mane
    ctx.fillStyle = COLORS.SERPENT_FLAME;
    ctx.globalAlpha = 0.55;
    for (const s of [-1, 1]) {
      const flick = Math.sin(this.frame * 0.25 + s) * 3;
      ctx.beginPath();
      ctx.moveTo(-r, s * 4);
      ctx.quadraticCurveTo(-r - 14 - flick, s * (r + 4), -4, s * r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Skull with jaws (opens while charging the fan)
    const open = charge * 0.35;
    ctx.fillStyle = COLORS.SERPENT_HEAD;
    ctx.strokeStyle = COLORS.SERPENT_DARK;
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.rotate(s * open);
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r * 0.6, s * r);
      ctx.lineTo(r * 0.7, s * r * 0.75);
      ctx.lineTo(r * 1.35, s * 2);
      ctx.lineTo(r * 1.35, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Mouth glow before the fan
    if (charge > 0) {
      ctx.fillStyle = COLORS.SERPENT_LIT;
      ctx.globalAlpha = 0.5 + charge * 0.5;
      ctx.beginPath();
      ctx.arc(r, 0, 3 + charge * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Eyes (red when enraged)
    ctx.fillStyle = enraged ? COLORS.UI_RED : COLORS.SERPENT_EYE;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(r * 0.25, s * r * 0.45, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

registerBoss('coronaSerpent', CoronaSerpent, CORONA_SERPENT_NAME);
