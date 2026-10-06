// ============================================================
// SECTOR NOVA 2 - Weapon System (DESIGN.md 6)
// ------------------------------------------------------------
// NORMAL is always available. Weapon items switch to SPREAD FAN /
// RAIL LANCER / CHAIN BOLT / HOMING NEEDLE with a level of 1-3
// (rules live in Player.collectWeapon / Player.takeDamage).
//
// Each WEAPONS entry defines:
//   - name / short  : HUD labels
//   - color         : HUD and item accent
//   - fireInterval  : frames between shots
//   - fire(x, y, level, power) : array of player projectiles
// Options call fire() with level 1 and power OPTION_POWER.
//
// Projectiles share the playerBullets list and are told apart by
// `kind`: 'normal' | 'rail' | 'chain' | 'homing' | 'reflect'.
// Everything uses the glow-halo + bright-core look.
// ============================================================

/**
 * RAIL LANCER beam segment: fast, pierces enemies, damages each
 * target once (tracked in hitSet).
 */
class RailBullet {
  constructor(x, y, halfWidth, damage) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = -RAIL_BULLET_SPEED;
    this.radius = halfWidth;   // collision half-width
    this.halfLen = 16;         // visual half-length
    this.alive = true;
    this.kind = 'rail';
    this.damage = damage;
    this.hitSet = [];
    this.frame = 0;
  }

  update() {
    this.y += this.vy;
    this.frame++;
    if (this.y < -this.halfLen - 4) this.alive = false;
  }

  draw(ctx) {
    const flick = 0.7 + Math.sin(this.frame * 0.6) * 0.3;
    const w = this.radius;

    ctx.globalAlpha = 0.35 * flick;
    ctx.fillStyle = COLORS.RAIL_GLOW;
    ctx.fillRect(this.x - w - 2, this.y - this.halfLen, (w + 2) * 2, this.halfLen * 2);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.RAIL_BODY;
    ctx.fillRect(this.x - w * 0.5, this.y - this.halfLen, w, this.halfLen * 2);

    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillRect(this.x - 1, this.y - this.halfLen, 2, this.halfLen * 2);
  }
}

/**
 * CHAIN BOLT: a crackling orb. On hit, the game jumps lightning to
 * `chains` more enemies (Game.chainLightning).
 */
class ChainBolt {
  constructor(x, y, chains, damage, jumpDamage) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = -CHAIN_BULLET_SPEED;
    this.radius = 4;
    this.alive = true;
    this.kind = 'chain';
    this.chains = chains;
    this.damage = damage;
    this.jumpDamage = jumpDamage;
    this.frame = 0;
  }

  update() {
    this.y += this.vy;
    this.frame++;
    if (this.y < -10) this.alive = false;
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.frame * 0.9) * 0.25;
    ctx.fillStyle = COLORS.CHAIN_GLOW;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + 3) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.CHAIN_BODY;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Little sparks around the orb
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = this.frame * 0.7 + (Math.PI * 2 * i) / 3;
      ctx.moveTo(this.x + Math.cos(a) * 3, this.y + Math.sin(a) * 3);
      ctx.lineTo(this.x + Math.cos(a) * 7, this.y + Math.sin(a) * 7);
    }
    ctx.stroke();

    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * HOMING NEEDLE: steers toward the nearest enemy (or the boss) on
 * screen, turning at most HOMING_TURN_RATE per frame.
 */
class HomingNeedle {
  constructor(x, y, angle, damage) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.radius = 3;
    this.alive = true;
    this.kind = 'homing';
    this.damage = damage;
    this.frame = 0;
    this.target = null;
  }

  update(world) {
    this.frame++;
    if (world) {
      if (!this.target || !isHomingTargetValid(this.target, world)) {
        this.target = findHomingTarget(this.x, this.y, world);
      }
      if (this.target) {
        const want = angleTo(this.x, this.y, this.target.x, this.target.y);
        let diff = want - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += clamp(diff, -HOMING_TURN_RATE, HOMING_TURN_RATE);
      }
    }
    this.x += Math.cos(this.angle) * HOMING_BULLET_SPEED;
    this.y += Math.sin(this.angle) * HOMING_BULLET_SPEED;
    if (this.frame > HOMING_LIFE || this.y < -12 || this.y > CANVAS_HEIGHT + 12 ||
        this.x < -12 || this.x > CANVAS_WIDTH + 12) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    // Glow trail
    ctx.strokeStyle = COLORS.HOMING_GLOW;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.x - dx * 9, this.y - dy * 9);
    ctx.lineTo(this.x + dx * 3, this.y + dy * 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Needle
    ctx.strokeStyle = COLORS.HOMING_BODY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - dx * 7, this.y - dy * 7);
    ctx.lineTo(this.x + dx * 4, this.y + dy * 4);
    ctx.stroke();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillRect(this.x + dx * 3 - 1, this.y + dy * 3 - 1, 2, 2);
  }
}

function isOnScreen(x, y) {
  return x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT;
}

function isHomingTargetValid(target, world) {
  if (target === world.boss) return !!world.boss && world.boss.isTargetable && world.boss.isVulnerable();
  return target.alive && isOnScreen(target.x, target.y);
}

/** Nearest on-screen enemy, or the boss core, to (x, y). */
function findHomingTarget(x, y, world) {
  let best = null;
  let bestD = Infinity;
  for (const e of world.enemies) {
    if (!e.alive || !isOnScreen(e.x, e.y)) continue;
    const d = dist(x, y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  const boss = world.boss;
  if (boss && boss.isTargetable && boss.isVulnerable() && dist(x, y, boss.x, boss.y) < bestD) {
    best = boss;
  }
  return best;
}

/**
 * Enemy bullet turned around by REFLECT SHIELD: now it hurts enemies.
 */
class ReflectedBullet extends PlayerBullet {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy, {
      kind: 'reflect',
      damage: REFLECT_BULLET_DAMAGE,
      core: COLORS.REFLECT_BULLET,
      glow: COLORS.REFLECT_BULLET_GLOW,
    });
  }
}

// ============================================================
// Weapon registry
// ============================================================
const WEAPON_ORDER = [WEAPON_SPREAD, WEAPON_RAIL, WEAPON_CHAIN, WEAPON_HOMING];

const WEAPONS = {
  [WEAPON_NORMAL]: {
    name: 'NORMAL',
    color: COLORS.PLAYER_BULLET,
    fireInterval: NORMAL_FIRE_INTERVAL,
    fire(x, y, level, power) {
      return [new PlayerBullet(x, y - 12, 0, -PLAYER_BULLET_SPEED, { damage: NORMAL_DAMAGE * power })];
    },
  },

  [WEAPON_SPREAD]: {
    name: 'SPREAD FAN',
    color: COLORS.ITEM_SPREAD,
    fireInterval: SPREAD_FIRE_INTERVAL,
    fire(x, y, level, power) {
      const count = level + 2; // 3 / 4 / 5 ways
      const bullets = [];
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (i - (count - 1) / 2) * SPREAD_STEP;
        bullets.push(new PlayerBullet(
          x, y - 10,
          Math.cos(a) * SPREAD_BULLET_SPEED, Math.sin(a) * SPREAD_BULLET_SPEED,
          { damage: SPREAD_DAMAGE * power, core: COLORS.SPREAD_BULLET, glow: COLORS.SPREAD_BULLET_GLOW }
        ));
      }
      return bullets;
    },
  },

  [WEAPON_RAIL]: {
    name: 'RAIL LANCER',
    color: COLORS.ITEM_RAIL,
    fireInterval: RAIL_FIRE_INTERVAL,
    fire(x, y, level, power) {
      const damage = RAIL_DAMAGE * power;
      if (level >= 3) {
        return [
          new RailBullet(x - RAIL_TWIN_OFFSET, y - 14, RAIL_WIDTH_THICK, damage),
          new RailBullet(x + RAIL_TWIN_OFFSET, y - 14, RAIL_WIDTH_THICK, damage),
        ];
      }
      return [new RailBullet(x, y - 14, level >= 2 ? RAIL_WIDTH_THICK : RAIL_WIDTH_THIN, damage)];
    },
  },

  [WEAPON_CHAIN]: {
    name: 'CHAIN BOLT',
    color: COLORS.ITEM_CHAIN,
    fireInterval: CHAIN_FIRE_INTERVAL,
    fire(x, y, level, power) {
      return [new ChainBolt(x, y - 12, level, CHAIN_DAMAGE * power, CHAIN_JUMP_DAMAGE * power)];
    },
  },

  [WEAPON_HOMING]: {
    name: 'HOMING NEEDLE',
    color: COLORS.ITEM_HOMING,
    fireInterval: HOMING_FIRE_INTERVAL,
    fire(x, y, level, power) {
      // 1 / 2 / 3 needles fanned upward; they curve onto targets.
      const bullets = [];
      for (let i = 0; i < level; i++) {
        const a = -Math.PI / 2 + (i - (level - 1) / 2) * 0.5;
        bullets.push(new HomingNeedle(x, y - 8, a, HOMING_DAMAGE * power));
      }
      return bullets;
    },
  },
};

/**
 * Draw the REFLECT SHIELD around the player: a rotating cyan hexagon.
 * It has no attack hitbox of its own.
 */
function drawReflectShield(ctx, x, y, frame, secondsLeft) {
  // Blink during the last 3 seconds so its end is readable.
  if (secondsLeft <= 3 && Math.floor(frame / 6) % 2 === 0) return;
  ctx.save();
  ctx.translate(x, y);

  const r = REFLECT_DRAW_RADIUS + Math.sin(frame * 0.15) * 1.5;
  ctx.fillStyle = COLORS.ITEM_REFLECT;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(frame * 0.03);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = COLORS.ITEM_REFLECT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = COLORS.UI_WHITE;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    ctx.fillRect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 2, 2);
  }
  ctx.restore();
}
