// ============================================================
// SECTOR NOVA 2 - THUNDER RAY (S3 boss, DESIGN.md 14)
// ------------------------------------------------------------
// A giant ray whose wing edges crackle with electricity.
//   A  Bolts: 2 vertical lightning bolts (3 below 50% HP), each warned
//      by a blinking line for THUNDER_RAY_BOLT_WARN frames. Below 50%
//      a horizontal bolt joins them (horizontal warning line).
//   C  Tail spread: the tail tip charges, then an aimed 7-way fan.
//   B  Cloud dive: sinks into the clouds and becomes a shadow (no
//      damage taken), a ripple and a lane warning mark the ship's x
//      at the bottom, then it rises through the whole screen (ramming)
//      and glides back to the top.
// Order A -> C -> B, repeated.
// ============================================================

const THUNDER_RAY_NAME = 'THUNDER RAY';

// Dive timeline (frames from the start of attack B)
const THUNDER_RAY_RUSH_FRAMES = Math.ceil((CANVAS_HEIGHT + 140) / THUNDER_RAY_RUSH_SPEED);
const THUNDER_RAY_DIVE_FRAMES = THUNDER_RAY_SINK_FRAMES + THUNDER_RAY_RIPPLE_FRAMES +
  THUNDER_RAY_RUSH_FRAMES + THUNDER_RAY_RETURN_FRAMES;

class ThunderRay extends BossBase {
  constructor() {
    super({
      name: THUNDER_RAY_NAME,
      maxHp: THUNDER_RAY_HP,
      radius: THUNDER_RAY_RADIUS,
      targetY: THUNDER_RAY_TARGET_Y,
      score: THUNDER_RAY_SCORE,
      damageCap: THUNDER_RAY_DAMAGE_CAP,
      phases: [{
        name: THUNDER_RAY_NAME,
        startDelay: 40,
        attacks: [
          { run: 'bolts', duration: THUNDER_RAY_BOLT_WARN + THUNDER_RAY_BOLT_ACTIVE, rest: THUNDER_RAY_BOLT_REST },
          { run: 'tailFan', duration: THUNDER_RAY_TAIL_CHARGE, rest: THUNDER_RAY_FAN_REST },
          { run: 'dive', duration: THUNDER_RAY_DIVE_FRAMES, rest: THUNDER_RAY_DIVE_REST },
        ],
      }],
    });
    this.swayPhase = 0;
    this.diveState = null; // { t, x, fromY } during attack B
    this.tailCharge = 0;   // 0..1 while the tail charges
    this.boltGlow = 0;     // wing edges flare while bolts are called
  }

  /** Submerged (sinking or a shadow under the ripple): shots pass through. */
  get submerged() {
    return !!this.diveState && this.diveState.t < THUNDER_RAY_SINK_FRAMES + THUNDER_RAY_RIPPLE_FRAMES;
  }

  /** Rising through the screen: touching it hurts. */
  get rushing() {
    if (!this.diveState) return false;
    const t = this.diveState.t - THUNDER_RAY_SINK_FRAMES - THUNDER_RAY_RIPPLE_FRAMES;
    return t >= 0 && t < THUNDER_RAY_RUSH_FRAMES;
  }

  get contactRadius() {
    return this.state === 'active' && this.rushing ? THUNDER_RAY_RADIUS : 0;
  }

  isVulnerable() {
    return !this.submerged;
  }

  get swayX() {
    return CANVAS_WIDTH / 2 + Math.sin(this.swayPhase) * THUNDER_RAY_SWAY;
  }

  updateMovement() {
    if (this.boltGlow > 0) this.boltGlow--;
    if (this.diveState) return; // attack B moves the ray itself
    this.swayPhase += THUNDER_RAY_SWAY_SPEED;
    this.x = this.swayX;
  }

  /** A: 2 bolts (3 when enraged) around the ship, plus a horizontal one when enraged. */
  bolts(world, t) {
    if (t !== 0) return;
    this.boltGlow = THUNDER_RAY_BOLT_WARN;
    const px = world.player.x;
    const side = px < CANVAS_WIDTH / 2 ? 1 : -1; // second bolt toward the open side
    const xs = [px, px + side * THUNDER_RAY_BOLT_SPACING];
    if (this.isEnraged) xs.push(px - side * THUNDER_RAY_BOLT_SPACING);
    const thunder = () => world.audio.play('thunder');
    for (const x of xs) {
      world.addHazard(createLightning(x, { width: THUNDER_RAY_BOLT_WIDTH, warnFrames: THUNDER_RAY_BOLT_WARN, onActivate: thunder }));
    }
    if (this.isEnraged) {
      world.addHazard(new Hazard({
        shape: 'hline', y: clamp(world.player.y, 60, CANVAS_HEIGHT - 30),
        width: THUNDER_RAY_BOLT_WIDTH, warnFrames: THUNDER_RAY_BOLT_WARN,
        activeFrames: THUNDER_RAY_BOLT_ACTIVE, color: COLORS.STORM_BOLT,
        emphasis: true, tag: 'lightning', onActivate: thunder,
      }));
    }
  }

  get tailTip() {
    return { x: this.x, y: this.y + 46 };
  }

  /** C: the tail tip charges, then an aimed 7-way fan. */
  tailFan(world, t) {
    this.tailCharge = (t + 1) / THUNDER_RAY_TAIL_CHARGE;
    if (t < THUNDER_RAY_TAIL_CHARGE - 1) return;
    this.tailCharge = 0;
    const tip = this.tailTip;
    world.addEnemyBullets(Patterns.fan({
      x: tip.x, y: tip.y, angle: angleTo(tip.x, tip.y, world.player.x, world.player.y),
      count: THUNDER_RAY_FAN_COUNT, step: THUNDER_RAY_FAN_STEP, speed: THUNDER_RAY_FAN_SPEED, kind: 'boss',
    }));
  }

  /** B: sink -> ripple at the ship's x -> rise through the screen -> glide back. */
  dive(world, t) {
    const sink = THUNDER_RAY_SINK_FRAMES;
    const ripple = sink + THUNDER_RAY_RIPPLE_FRAMES;
    const rush = ripple + THUNDER_RAY_RUSH_FRAMES;
    if (t === 0) this.diveState = { t: 0, x: this.x, fromY: this.y };
    const d = this.diveState;
    d.t = t;
    if (t === sink) {
      d.x = clamp(world.player.x, 40, CANVAS_WIDTH - 40); // the lane is fixed here
    }
    if (t < sink) {
      this.y = d.fromY + t * 0.6; // sinking a little
    } else if (t < ripple) {
      this.x = d.x;
      this.y = CANVAS_HEIGHT + 70; // a shadow below the screen
    } else if (t < rush) {
      this.x = d.x;
      this.y = CANVAS_HEIGHT + 70 - (t - ripple + 1) * THUNDER_RAY_RUSH_SPEED;
    } else {
      // Glide back down from above into the sway position.
      const k = (t - rush + 1) / THUNDER_RAY_RETURN_FRAMES;
      if (t === rush) this.y = -80;
      this.x = lerp(d.x, this.swayX, k);
      this.y = lerp(-80, this.targetY, k);
    }
    if (t >= THUNDER_RAY_DIVE_FRAMES - 1) {
      this.x = this.swayX;
      this.y = this.targetY;
      this.diveState = null;
    }
  }

  draw(ctx) {
    // The ripple lane is drawn in screen space, under the ray.
    if (this.diveState && this.state === 'active') this.drawDiveWarning(ctx);
    super.draw(ctx);
  }

  /** Ripple rings at the bottom and a blinking lane up the whole screen. */
  drawDiveWarning(ctx) {
    const t = this.diveState.t - THUNDER_RAY_SINK_FRAMES;
    if (t < 0 || t >= THUNDER_RAY_RIPPLE_FRAMES) return;
    const x = this.diveState.x;
    const half = THUNDER_RAY_RADIUS + 6;
    ctx.save();
    const on = Math.floor(t / 4) % 2 === 0;
    ctx.globalAlpha = on ? 1 : 0.6; // stays readable on a phone even in the dim phase
    ctx.strokeStyle = COLORS.HAZARD_WARN;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = t;
    ctx.strokeRect(x - half + 0.5, -2, half * 2 - 1, CANVAS_HEIGHT + 4);
    ctx.setLineDash([]);
    // Upward arrows inside the lane
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = COLORS.HAZARD_WARN;
    for (let y = CANVAS_HEIGHT - 40 - (t * 3) % 60; y > 40; y -= 60) {
      fillPolygon(ctx, [[x, y - 8], [x + 8, y + 4], [x + 3, y + 4], [x + 3, y + 10], [x - 3, y + 10], [x - 3, y + 4], [x - 8, y + 4]]);
    }
    // Ripples spreading from the bottom
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.RAY_EDGE;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = ((t * 1.2 + i * 14) % 42) + 6;
      ctx.globalAlpha = 1 - r / 48;
      ctx.beginPath();
      ctx.ellipse(x, CANVAS_HEIGHT - 16, r * 1.6, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // "!" marker
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.LIGHTNING_MARK;
    fillPolygon(ctx, [[x, CANVAS_HEIGHT - 56], [x + 10, CANVAS_HEIGHT - 38], [x - 10, CANVAS_HEIGHT - 38]]);
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(x - 1, CANVAS_HEIGHT - 51, 2, 7);
    ctx.fillRect(x - 1, CANVAS_HEIGHT - 42, 2, 2);
    ctx.restore();
  }

  drawBody(ctx) {
    const dive = this.diveState;
    const sinkK = dive && dive.t < THUNDER_RAY_SINK_FRAMES ? dive.t / THUNDER_RAY_SINK_FRAMES : 0;
    if (dive && dive.t >= THUNDER_RAY_SINK_FRAMES &&
        dive.t < THUNDER_RAY_SINK_FRAMES + THUNDER_RAY_RIPPLE_FRAMES) {
      return; // under the clouds: only the lane warning shows
    }
    ctx.globalAlpha = 1 - sinkK * 0.85;
    const enraged = this.isEnraged;
    const flap = Math.sin(this.frame * 0.06) * 4;

    // Tail (points down toward the ship)
    ctx.strokeStyle = COLORS.RAY_BODY;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(Math.sin(this.frame * 0.05) * 6, 32, 0, 46);
    ctx.stroke();
    ctx.strokeStyle = COLORS.RAY_EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
    const tc = this.tailCharge;
    ctx.fillStyle = tc > 0 && Math.floor(this.frame / 3) % 2 === 0 ? COLORS.RAY_SPARK : COLORS.RAY_EDGE;
    ctx.beginPath();
    ctx.arc(0, 46, 3.5 + tc * 3, 0, Math.PI * 2);
    ctx.fill();
    if (tc > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = (0.4 + tc * 0.6) * (1 - sinkK * 0.85);
      ctx.beginPath();
      ctx.arc(0, 46, 20 - tc * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1 - sinkK * 0.85;
    }

    // Wings: a broad rounded diamond
    const f = flap;
    const wing = [[0, -32], [26, -24], [52, -8 + f], [72, 4 + f], [54, 12 + f], [28, 18], [10, 24], [0, 22],
      [-10, 24], [-28, 18], [-54, 12 + f], [-72, 4 + f], [-52, -8 + f], [-26, -24]];
    ctx.fillStyle = COLORS.RAY_BODY;
    fillPolygon(ctx, wing);
    // Darker back with a lighter spine
    ctx.fillStyle = COLORS.RAY_DARK;
    fillPolygon(ctx, [[0, -22], [22, -14], [44, 2 + f / 2], [22, 12], [0, 16], [-22, 12], [-44, 2 + f / 2], [-22, -14]]);
    ctx.fillStyle = COLORS.RAY_BODY;
    fillPolygon(ctx, [[0, -24], [5, -10], [3, 14], [-3, 14], [-5, -10]]);
    // Gill slits
    ctx.strokeStyle = COLORS.RAY_EDGE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5 * (1 - sinkK * 0.85);
    for (let i = 0; i < 3; i++) {
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * (10 + i * 5), 4 + i * 2);
        ctx.lineTo(sx * (14 + i * 5), 8 + i * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1 - sinkK * 0.85;

    // Electrified wing edges (flare while bolts are called)
    const glow = this.boltGlow > 0 || enraged;
    ctx.strokeStyle = glow && Math.floor(this.frame / 3) % 2 === 0 ? COLORS.RAY_SPARK : COLORS.RAY_EDGE;
    ctx.lineWidth = glow ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    for (const [x, y] of [[26, -24], [52, -8 + f], [72, 4 + f], [54, 12 + f]]) ctx.lineTo(x, y);
    ctx.moveTo(0, -32);
    for (const [x, y] of [[-26, -24], [-52, -8 + f], [-72, 4 + f], [-54, 12 + f]]) ctx.lineTo(x, y);
    ctx.stroke();
    // Little sparks running out along the edges
    ctx.fillStyle = COLORS.RAY_SPARK;
    for (let i = 0; i < 4; i++) {
      const k = ((this.frame * 0.02 + i * 0.25) % 1);
      for (const sx of [-1, 1]) ctx.fillRect(sx * 72 * k - 1, -32 + 36 * k + f * k - 1, 2, 2);
    }

    // Eyes
    ctx.fillStyle = enraged ? COLORS.UI_RED : COLORS.RAY_EYE;
    ctx.fillRect(-12, -18, 5, 3);
    ctx.fillRect(7, -18, 5, 3);
    ctx.globalAlpha = 1;
  }
}

registerBoss('thunderRay', ThunderRay, THUNDER_RAY_NAME);
