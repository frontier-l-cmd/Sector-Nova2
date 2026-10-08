// ============================================================
// SECTOR NOVA 2 - SENTINEL (mid-boss of S1-S5, DESIGN.md 14)
// ------------------------------------------------------------
// One hexagonal frame (radius 24) shared by every stage, painted in
// the stage's colors. Alternates an aimed 5-way fan and a 12-way
// ring, faster below 50% HP. Before every shot the core swells and
// whitens for SENTINEL_CHARGE_FRAMES (telegraph). Flees after 25 seconds of fighting
// (no score). HP: S1 = 60, +15 per later stage.
// The stage timeline pauses while it is on screen.
// ============================================================

// Name and colors per stage. Later stages add their entries
// (CORONA) in Phase 5-2.
const SENTINEL_STAGES = {
  1: {
    name: 'FROST SENTINEL',
    body: COLORS.SENTINEL_FROST,
    dark: COLORS.SENTINEL_FROST_DARK,
    core: COLORS.SENTINEL_FROST_CORE,
  },
  2: {
    name: 'HARBOR SENTINEL',
    body: COLORS.SENTINEL_HARBOR,
    dark: COLORS.SENTINEL_HARBOR_DARK,
    core: COLORS.SENTINEL_HARBOR_CORE,
  },
  3: {
    name: 'STORM SENTINEL',
    body: COLORS.SENTINEL_STORM,
    dark: COLORS.SENTINEL_STORM_DARK,
    core: COLORS.SENTINEL_STORM_CORE,
  },
  4: {
    name: 'HIVE SENTINEL',
    body: COLORS.SENTINEL_HIVE,
    dark: COLORS.SENTINEL_HIVE_DARK,
    core: COLORS.SENTINEL_HIVE_CORE,
  },
};

class Sentinel extends BossBase {
  constructor(options) {
    const stage = options.stage || 1;
    const look = SENTINEL_STAGES[stage] || SENTINEL_STAGES[1];
    const hp = SENTINEL_HP_BASE + SENTINEL_HP_PER_STAGE * (stage - 1);
    super({
      name: look.name,
      maxHp: hp,
      radius: SENTINEL_RADIUS,
      targetY: SENTINEL_TARGET_Y,
      score: SENTINEL_SCORE,
      damageCap: SENTINEL_DAMAGE_CAP,
      midboss: true,
      escapeAfter: SENTINEL_ESCAPE_FRAMES,
      deathFrames: SENTINEL_DEATH_FRAMES,
      afterglowFrames: SENTINEL_AFTERGLOW_FRAMES,
      phases: [{
        name: look.name,
        startDelay: 50,
        attacks: [
          { run: 'fireFan', duration: SENTINEL_CHARGE_FRAMES, rest: (b) => b.fireRest },
          { run: 'fireRing', duration: SENTINEL_CHARGE_FRAMES, rest: (b) => b.fireRest },
        ],
      }],
    });
    this.look = look;
    this.ringTurn = 0;
    this.charge = 0; // 0..1 while charging a shot
  }

  /** Idle time after a shot; the charge is part of the interval. */
  get fireRest() {
    const interval = scaledFireInterval(this.isEnraged ? SENTINEL_FIRE_INTERVAL_ENRAGED : SENTINEL_FIRE_INTERVAL);
    return Math.max(1, interval - SENTINEL_CHARGE_FRAMES);
  }

  /** Charge for `duration` frames, fire on the last one. */
  charging(t) {
    this.charge = (t + 1) / SENTINEL_CHARGE_FRAMES;
    if (t < SENTINEL_CHARGE_FRAMES - 1) return false;
    this.charge = 0;
    return true;
  }

  /** Remaining seconds before it flees (shown by the HUD). */
  get escapeSecondsLeft() {
    return Math.max(0, Math.ceil((this.escapeAfter - this.activeFrames) / 60));
  }

  updateMovement() {
    this.x = CANVAS_WIDTH / 2 + Math.sin(this.activeFrames * 0.012) * 70;
  }

  fireFan(world, t) {
    if (!this.charging(t)) return;
    world.addEnemyBullets(Patterns.fan({
      x: this.x, y: this.y + 16,
      angle: angleTo(this.x, this.y, world.player.x, world.player.y),
      count: SENTINEL_FAN_COUNT, step: SENTINEL_FAN_STEP, speed: SENTINEL_FAN_SPEED, kind: 'boss',
    }));
  }

  fireRing(world, t) {
    if (!this.charging(t)) return;
    this.ringTurn += Math.PI / SENTINEL_RING_COUNT; // alternate the gaps
    world.addEnemyBullets(Patterns.ring({
      x: this.x, y: this.y,
      count: SENTINEL_RING_COUNT, speed: SENTINEL_RING_SPEED, offset: this.ringTurn, kind: 'boss',
    }));
  }

  drawBody(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.1) * 0.12;
    const hex = (r, rot) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + (Math.PI / 3) * i;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
    };

    // Rotating outer frame
    ctx.strokeStyle = this.look.body;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    hex(this.radius + 6, this.frame * 0.02);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Body / dark inner / core
    ctx.fillStyle = this.look.body;
    hex(this.radius, Math.PI / 6);
    ctx.fill();
    ctx.fillStyle = this.look.dark;
    hex(this.radius - 7, Math.PI / 6);
    ctx.fill();

    // Six vents around the core
    ctx.fillStyle = this.look.body;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - this.frame * 0.03;
      ctx.fillRect(Math.cos(a) * 11 - 1.5, Math.sin(a) * 11 - 1.5, 3, 3);
    }

    // Charging: the core swells and a white ring closes in.
    const charge = this.state === 'active' ? this.charge : 0;
    ctx.fillStyle = this.isEnraged ? COLORS.UI_RED : this.look.core;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * pulse + charge * 4, 0, Math.PI * 2);
    ctx.fill();
    if (charge > 0) {
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4 + charge * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, 22 - charge * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

registerBoss('sentinel', Sentinel, 'SENTINEL');
