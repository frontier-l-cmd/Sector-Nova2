// ============================================================
// SECTOR NOVA 2 - TRUE ECLIPSE (TRUE END only, DESIGN.md 14)
// ------------------------------------------------------------
// ECLIPSE's true form: a black sun with a corona that runs through
// the six crystal colors. It appears after ECLIPSE CROWN when the run
// meets the TRUE END condition (Game.startTrueEclipse): the six
// crystals circle the ship ("LIGHT RESONANCE") and the ship's weapon
// stays at Lv3 for the whole fight (Game). No time limit.
// It uses the past bosses' signature moves in turn, then its own:
//   icicles (GLACIER MAW) -> homing missiles (DOCK TITAN) ->
//   lightning (THUNDER RAY) -> eggs (HIVE MOTHER) -> segment shots
//   (CORONA SERPENT) -> ECLIPSE BURST (three turning rings over the
//   whole screen).
// Each move keeps its own telegraph (icicle shadows, lightning lines,
// egg cracks...), and the core glows TRUE_ECLIPSE_CHARGE frames
// before every move.
// ============================================================

const TRUE_ECLIPSE_NAME = 'TRUE ECLIPSE';

class TrueEclipse extends BossBase {
  constructor() {
    const move = (run, duration, rest) => ({ run, duration, rest: rest ?? TRUE_ECLIPSE_REST });
    super({
      name: TRUE_ECLIPSE_NAME,
      maxHp: TRUE_ECLIPSE_HP,
      radius: TRUE_ECLIPSE_RADIUS,
      targetY: TRUE_ECLIPSE_TARGET_Y,
      score: TRUE_ECLIPSE_SCORE,
      damageCap: TRUE_ECLIPSE_DAMAGE_CAP,
      phases: [{
        name: TRUE_ECLIPSE_NAME,
        startDelay: RESONANCE_BANNER_FRAMES,
        attacks: [
          move('icicles', TRUE_ECLIPSE_CHARGE),
          move('missiles', TRUE_ECLIPSE_CHARGE),
          move('lightning', TRUE_ECLIPSE_CHARGE),
          move('eggs', TRUE_ECLIPSE_CHARGE),
          move('segments', TRUE_ECLIPSE_CHARGE + TRUE_ECLIPSE_ORBS * TRUE_ECLIPSE_ORB_STEP + TRUE_ECLIPSE_CHARGE),
          move('burst', TRUE_ECLIPSE_BURST_CHARGE + TRUE_ECLIPSE_BURST_GAP * TRUE_ECLIPSE_BURST_RINGS, 90),
        ],
      }],
    });
    this.charge = 0;      // 0..1 while the core glows
    this.swayPhase = 0;
    this.orbs = [];       // segment-shot orbs: { a, lit }
    this.burstTurn = 0;
  }

  updateMovement() {
    this.swayPhase += 0.007;
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.swayPhase) * 70;
    for (const o of this.orbs) o.a += 0.02;
  }

  /** Glow for the first TRUE_ECLIPSE_CHARGE frames; true on the frame the move goes off. */
  charging(t, frames) {
    const n = frames || TRUE_ECLIPSE_CHARGE;
    this.charge = t < n ? (t + 1) / n : 0;
    return t === n - 1;
  }

  /** GLACIER MAW: icicles across the screen, one near the ship. */
  icicles(world, t) {
    if (!this.charging(t)) return;
    const gap = CANVAS_WIDTH / TRUE_ECLIPSE_ICICLES;
    const shift = randFloat(0, gap);
    for (let i = 0; i < TRUE_ECLIPSE_ICICLES; i++) {
      world.addEnemy(new Icicle(clamp((i * gap + shift) % CANVAS_WIDTH, 16, CANVAS_WIDTH - 16)));
    }
    world.addEnemy(new Icicle(clamp(world.player.x, 16, CANVAS_WIDTH - 16)));
  }

  /** DOCK TITAN: slow homing missiles that can be shot down. */
  missiles(world, t) {
    if (!this.charging(t)) return;
    for (let i = 0; i < TRUE_ECLIPSE_MISSILES; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const angle = Math.PI / 2 + side * (0.5 + Math.floor(i / 2) * 0.4);
      world.addEnemy(markFromBoss(new TitanMissile(this.x + side * 24, this.y + 8, angle)));
    }
  }

  /** THUNDER RAY: three bolts, at the ship and on both sides. */
  lightning(world, t) {
    if (!this.charging(t)) return;
    const thunder = () => world.audio.play('thunder');
    for (const dx of [-TRUE_ECLIPSE_BOLT_GAP, 0, TRUE_ECLIPSE_BOLT_GAP]) {
      world.addHazard(createLightning(world.player.x + dx, { onActivate: thunder }));
    }
  }

  /** HIVE MOTHER: eggs that sink and hatch unless shot. */
  eggs(world, t) {
    if (!this.charging(t)) return;
    for (let i = 0; i < TRUE_ECLIPSE_EGGS; i++) {
      const dx = i === 0 ? -40 : 40;
      world.addEnemy(new Egg(clamp(this.x + dx, 20, CANVAS_WIDTH - 20), this.y + 30, EGG_HATCH_FRAMES, i === 1 ? 'wisp' : 'swarm'));
    }
  }

  /** CORONA SERPENT: orbs light up one after another and fire. */
  segments(world, t) {
    if (t === 0) {
      this.orbs = [];
      for (let i = 0; i < TRUE_ECLIPSE_ORBS; i++) this.orbs.push({ a: (Math.PI * 2 / TRUE_ECLIPSE_ORBS) * i, lit: 0 });
    }
    for (let i = 0; i < this.orbs.length; i++) {
      const o = this.orbs[i];
      if (t === i * TRUE_ECLIPSE_ORB_STEP) o.lit = TRUE_ECLIPSE_CHARGE;
      if (o.lit > 0 && --o.lit === 0) {
        const p = this.orbPoint(o);
        world.addEnemyBullets(Patterns.aimed({ x: p.x, y: p.y, tx: world.player.x, ty: world.player.y, speed: TRUE_ECLIPSE_ORB_SPEED, kind: 'boss' }));
        o.fired = true;
      }
    }
    if (this.orbs.every(o => o.fired)) this.orbs = [];
  }

  orbPoint(o) {
    return { x: this.x + Math.cos(o.a) * 44, y: this.y + Math.sin(o.a) * 30 };
  }

  /** Its own: three rings over the whole screen, each turned a little. */
  burst(world, t) {
    if (t < TRUE_ECLIPSE_BURST_CHARGE) {
      this.charging(t, TRUE_ECLIPSE_BURST_CHARGE);
      return;
    }
    this.charge = 0;
    const k = t - TRUE_ECLIPSE_BURST_CHARGE;
    if (k % TRUE_ECLIPSE_BURST_GAP !== 0) return;
    this.burstTurn += Math.PI / TRUE_ECLIPSE_BURST_COUNT * 0.66;
    world.addEnemyBullets(Patterns.ring({
      x: this.x, y: this.y, count: TRUE_ECLIPSE_BURST_COUNT,
      speed: TRUE_ECLIPSE_BURST_SPEED, offset: this.burstTurn, kind: 'boss',
    }));
  }

  drawBody(ctx) {
    const r = this.radius;
    const hues = COLORS.CRYSTAL_HUES;
    // Corona running through the crystal colors
    for (let i = 0; i < 6; i++) {
      const a = this.frame * 0.02 + (Math.PI * 2 / 6) * i;
      ctx.fillStyle = hues[(i + Math.floor(this.frame / 10)) % hues.length];
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10), 9, 4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLORS.CROWN_RIM;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6 + Math.sin(this.frame * 0.1) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // The black sun
    ctx.fillStyle = COLORS.CROWN_CORE;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.CROWN_RIM;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 1, 0, Math.PI * 2);
    ctx.stroke();
    // Telegraph: the rim brightens and a ring closes in
    const charge = this.state === 'active' ? this.charge : 0;
    if (charge > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + charge * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, r + 30 - charge * 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Segment orbs
    for (const o of this.orbs) {
      if (o.fired) continue;
      const p = { x: Math.cos(o.a) * 44, y: Math.sin(o.a) * 30 };
      ctx.fillStyle = o.lit > 0 ? COLORS.SERPENT_LIT : COLORS.SERPENT_SCALE;
      ctx.strokeStyle = COLORS.SERPENT_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (o.lit > 0) {
        const k = 1 - o.lit / TRUE_ECLIPSE_CHARGE;
        ctx.strokeStyle = COLORS.UI_WHITE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + k * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 - k * 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

registerBoss('trueEclipse', TrueEclipse, TRUE_ECLIPSE_NAME);
