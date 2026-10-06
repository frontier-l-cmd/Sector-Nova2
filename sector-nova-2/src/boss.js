// ============================================================
// SECTOR NOVA 2 - Boss Framework (BossBase)
// ------------------------------------------------------------
// Every boss and mid-boss extends BossBase, one file per boss in
// src/bosses/ (DESIGN.md 15-2). BossBase owns the shared rules so
// a boss file only describes its look, movement and attacks.
//
// Definition passed to super(def):
//   name, maxHp, radius, targetY, score
//   phases: [{
//     name,                // shown in the HUD / transition banner
//     hp,                  // optional: fresh HP pool for this form
//     endAtHpRatio,        // optional: move on at this HP ratio
//     endWhen(boss),       // optional: custom end (e.g. arms broken)
//     startDelay,          // frames before the first attack
//     attacks: [{ run, duration, rest }],
//     onEnter(boss, world),
//   }]
//   attacks run in order and loop: boss[run](world, t, attack) is
//   called every frame for `duration` frames (t = 0..duration-1),
//   then the boss idles `rest` frames. duration / rest may be numbers
//   or functions of the boss.
//
// Parts (this.parts, BossPart) are hit before the core and absorb
// the shot. isVulnerable() / damageMultiplier() model weak points.
//
// States: entering -> active <-> transition -> dying -> afterglow
//         -> finished
//   transition: hostile bullets cleared, form name shown, invulnerable
//   dying:      shaking + small explosions, bullets cleared
//   afterglow:  big explosion done, 2s of calm before the result
//
// `world` is the Game. Bosses read world.player and act through
// world.addEnemyBullets(), world.addHazard(), world.clearHostiles(),
// world.effects, world.audio, world.onBossDefeated(),
// world.onBossPartDestroyed().
// ============================================================

const BOSS_REGISTRY = {}; // type key -> { cls, name }, filled by src/bosses/*.js

function registerBoss(key, cls, name) {
  BOSS_REGISTRY[key] = { cls, name };
}

function createBoss(key) {
  const entry = BOSS_REGISTRY[key];
  if (!entry) return null;
  const boss = new entry.cls();
  boss.typeKey = key;
  return boss;
}

function bossDisplayName(key) {
  return BOSS_REGISTRY[key] ? BOSS_REGISTRY[key].name : 'UNKNOWN';
}

/**
 * Breakable boss part. Position is an offset from the boss center;
 * bosses may move ox / oy every frame (orbiting shards, arms).
 */
class BossPart {
  constructor(opts) {
    this.name = opts.name || 'PART';
    this.ox = opts.ox || 0;
    this.oy = opts.oy || 0;
    this.radius = opts.radius || 10;
    this.maxHp = opts.hp || 10;
    this.hp = this.maxHp;
    this.score = opts.score || 0;              // break bonus
    this.regenFrames = opts.regenFrames || 0;  // 0 = stays broken
    this.onDestroy = opts.onDestroy || null;   // (boss, part, world)
    this.alive = true;
    this.regenTimer = 0;
  }

  x(boss) {
    return boss.x + this.ox;
  }

  y(boss) {
    return boss.y + this.oy;
  }
}

/** Resolve a number-or-function definition value. */
function bossValue(value, boss) {
  return typeof value === 'function' ? value(boss) : (value || 0);
}

class BossBase {
  constructor(def) {
    this.typeKey = null;
    this.name = def.name;
    this.radius = def.radius ?? BOSS_RADIUS;
    this.score = def.score ?? BOSS_DEFEAT_SCORE;
    this.x = def.x ?? CANVAS_WIDTH / 2;
    this.y = def.startY ?? -60;
    this.targetY = def.targetY ?? 60;
    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.phases = def.phases;
    this.phaseIndex = 0;
    this.parts = [];

    this.state = 'entering';
    this.stateTimer = 0;
    this.frame = 0;
    this.banner = null; // { text, timer } shown by the HUD

    // Attack scheduler
    this.attackIndex = 0;
    this.attackFrame = 0;
    this.attackTimer = 0;
    this.currentAttack = null;
  }

  // --- State queries -------------------------------------------

  get phase() {
    return this.phases[this.phaseIndex];
  }

  get phaseName() {
    return this.phase.name;
  }

  get hpPercent() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  get isEnraged() {
    return this.hpPercent <= BOSS_ENRAGE_HP_THRESHOLD;
  }

  /** Shots and parts can be hit only while fighting. */
  get isTargetable() {
    return this.state === 'active';
  }

  get isDefeated() {
    return this.state === 'dying' || this.state === 'afterglow' || this.state === 'finished';
  }

  get isFinished() {
    return this.state === 'finished';
  }

  get showHpBar() {
    return this.state === 'active' || this.state === 'transition';
  }

  // --- Overridable hooks ---------------------------------------

  /** Core accepts hits (false = shots pass through, e.g. submerged). */
  isVulnerable() {
    return true;
  }

  /** Core damage multiplier, e.g. 0.2 while a weak point is closed. */
  damageMultiplier(source) {
    return 1;
  }

  /** Default entry: glide down from above. Return true when in place. */
  updateEntry(world) {
    this.y = lerp(this.y, this.targetY, BOSS_ENTRY_LERP);
    if (Math.abs(this.y - this.targetY) < 1) {
      this.y = this.targetY;
      return true;
    }
    return false;
  }

  /** Per-frame movement while active. */
  updateMovement(world) {}

  /** Draw the boss around (0, 0); the canvas is already translated. */
  drawBody(ctx) {}

  // --- Update ----------------------------------------------------

  update(world) {
    this.frame++;
    if (this.banner && --this.banner.timer <= 0) this.banner = null;

    switch (this.state) {
      case 'entering':
        if (this.updateEntry(world)) {
          this.state = 'active';
          this.enterPhase(0, world);
        }
        break;
      case 'active':
        // Damage lands in the game's collision pass, so react to it
        // before moving or attacking again.
        if (this.checkPhaseEnd(world)) break;
        this.updateParts();
        this.updateMovement(world);
        this.updateAttacks(world);
        break;
      case 'transition':
        this.updateParts();
        if (--this.stateTimer <= 0) {
          this.state = 'active';
          this.enterPhase(this.phaseIndex + 1, world);
        }
        break;
      case 'dying':
        if (this.stateTimer % BOSS_DEATH_EXPLODE_INTERVAL === 0) {
          world.effects.explode(this.x + randFloat(-40, 40), this.y + randFloat(-30, 30), 8);
        }
        if (--this.stateTimer <= 0) {
          world.effects.bigExplode(this.x, this.y);
          world.audio.play('explode');
          world.clearHostiles();
          this.state = 'afterglow';
          this.stateTimer = BOSS_AFTERGLOW_FRAMES;
        }
        break;
      case 'afterglow':
        if (--this.stateTimer <= 0) this.state = 'finished';
        break;
    }
  }

  enterPhase(index, world) {
    this.phaseIndex = index;
    const phase = this.phase;
    if (phase.hp) {
      this.maxHp = phase.hp;
      this.hp = phase.hp;
    }
    this.attackIndex = 0;
    this.attackFrame = 0;
    this.currentAttack = null;
    this.attackTimer = phase.startDelay || 0;
    if (phase.onEnter) phase.onEnter(this, world);
  }

  updateParts() {
    for (const part of this.parts) {
      if (!part.alive && part.regenFrames > 0 && --part.regenTimer <= 0) {
        part.alive = true;
        part.hp = part.maxHp;
      }
    }
  }

  updateAttacks(world) {
    const attacks = this.phase.attacks;
    if (!attacks || attacks.length === 0) return;

    if (!this.currentAttack) {
      if (this.attackTimer > 0 && --this.attackTimer > 0) return; // resting
      this.currentAttack = attacks[this.attackIndex];
      this.attackFrame = 0;
    }

    const attack = this.currentAttack;
    if (typeof this[attack.run] === 'function') {
      this[attack.run](world, this.attackFrame, attack);
    } else if (DEBUG_MODE) {
      console.warn(this.name + ': missing attack method', attack.run);
    }

    this.attackFrame++;
    if (this.attackFrame >= Math.max(1, bossValue(attack.duration, this))) {
      this.currentAttack = null;
      this.attackTimer = bossValue(attack.rest, this);
      this.attackIndex = (this.attackIndex + 1) % attacks.length;
    }
  }

  /** Start a transition or the defeat if the current form is over. */
  checkPhaseEnd(world) {
    const phase = this.phase;
    const hasNext = this.phaseIndex < this.phases.length - 1;
    if (this.hp <= 0) {
      if (hasNext) this.beginTransition(world);
      else this.beginDefeat(world);
      return true;
    }
    if (!hasNext) return false;
    const byHp = phase.endAtHpRatio !== undefined && this.hpPercent <= phase.endAtHpRatio;
    const byCondition = !!(phase.endWhen && phase.endWhen(this));
    if (byHp || byCondition) {
      this.beginTransition(world);
      return true;
    }
    return false;
  }

  /** Shared form change: clear bullets, announce the next form. */
  beginTransition(world) {
    this.state = 'transition';
    this.stateTimer = BOSS_PHASE_TRANSITION_FRAMES;
    world.clearHostiles();
    this.banner = { text: this.phases[this.phaseIndex + 1].name, timer: BOSS_PHASE_TRANSITION_FRAMES };
  }

  /** Shared defeat: score, bullet clear, then the death sequence. */
  beginDefeat(world) {
    this.hp = 0;
    this.state = 'dying';
    this.stateTimer = BOSS_DEATH_FRAMES;
    world.clearHostiles();
    world.onBossDefeated(this);
  }

  // --- Damage ----------------------------------------------------

  /**
   * Which target a player shot at (x, y, r) touches: a live part
   * first, then the core. Returns a BossPart, this boss, or null.
   */
  findHitTarget(x, y, r) {
    if (!this.isTargetable) return null;
    for (const part of this.parts) {
      if (part.alive && circleCollision(x, y, r, part.x(this), part.y(this), part.radius)) {
        return part;
      }
    }
    if (this.isVulnerable() && circleCollision(x, y, r, this.x, this.y, this.radius)) {
      return this;
    }
    return null;
  }

  /**
   * Apply `amount` damage to a target from findHitTarget().
   * Returns the damage actually dealt.
   */
  applyHit(target, amount, source, world) {
    if (!this.isTargetable) return 0;
    if (target === this) {
      const dealt = amount * this.damageMultiplier(source);
      this.hp = Math.max(0, this.hp - dealt);
      return dealt;
    }
    const part = target;
    if (!part.alive) return 0;
    part.hp -= amount;
    if (part.hp <= 0) {
      part.hp = 0;
      part.alive = false;
      part.regenTimer = part.regenFrames;
      world.onBossPartDestroyed(this, part);
      if (part.onDestroy) part.onDestroy(this, part, world);
    }
    return amount;
  }

  // --- Draw --------------------------------------------------------

  draw(ctx) {
    if (this.state === 'afterglow' || this.state === 'finished') return;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.state === 'dying') {
      // Shake harder as the explosion nears, and flicker.
      const shake = (BOSS_DEATH_FRAMES - this.stateTimer) * 0.3;
      ctx.translate(randFloat(-shake, shake), randFloat(-shake, shake));
      if (Math.random() < 0.3) {
        ctx.restore();
        return;
      }
    }
    this.drawBody(ctx);
    ctx.restore();
  }
}
