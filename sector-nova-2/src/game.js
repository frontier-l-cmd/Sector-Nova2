// ============================================================
// SECTOR NOVA 2 - Game Logic & State Machine
// ------------------------------------------------------------
// Owns the state machine, stage flow, collisions and the entity
// lists. Stage content comes from timeline.js, bosses from boss.js
// and src/bosses/, the HUD from hud.js, menus and full-screen
// overlays from menu.js, the backdrop from background.js and sound
// from audio.js. Combo lives in scoring.js; graze, NOVA BURST and
// item effects are resolved here.
//
// The Game is also the "world" bosses act on: addEnemyBullets(),
// addHazard(), clearHostiles(), onBossDefeated(),
// onBossPartDestroyed(), plus player / effects / audio.
// ============================================================

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new InputHandler();
    this.audio = new AudioManager();
    this.effects = new EffectsManager();
    this.background = new Background();
    this.stageManager = new StageManager();
    this.titleMenu = new TitleMenu();
    this.hud = new HUD();
    this.combo = new ComboCounter();
    this.difficulty = loadDifficulty();
    this.touch = new TouchControls(this, canvas);

    this.player = new Player();
    this.clearStageObjects();

    // Game state
    this.state = STATE.TITLE;
    this.score = 0;
    this.playTime = 0; // frames since the current stage started
    this.stageClearTimer = 0;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;
    this.globalFrame = 0; // drives blinking UI in every state
    this.crystalStages = new Set(); // stages whose NOVA CRYSTAL was taken
    this.runFromNewGame = false;    // TRUE END counts only NEW GAME runs
    this.debugInvincible = false;   // debug key 0

    this.titleMenu.reset();
    if (DEBUG_MODE) validateTimelines();
  }

  get stage() {
    return this.stageManager.config;
  }

  get bestScore() {
    return loadBestScore();
  }

  get bestClearScore() {
    return loadBestClearScore();
  }

  setDifficulty(level) {
    this.difficulty = level;
    saveDifficulty(level);
  }

  /** Empty every per-stage list. */
  clearStageObjects() {
    this.playerBullets = [];
    this.enemies = [];
    this.pendingEnemies = []; // spawned mid-collision (e.g. Split minions)
    this.enemyBullets = [];   // all hostile bullets: enemy and boss
    this.hazards = [];
    this.powerups = [];
    this.boss = null;
    this.timeline = null;
    this.warningTimer = 0;
    this.warningBossName = '';
    this.spawnsLocked = false;
    this.effects.clear();
  }

  /**
   * Start a run from an implemented, unlocked stage. Every start
   * from the title begins with score 0, NORMAL, no options and an
   * empty gauge (DESIGN.md 15-7). `fromNewGame` marks NEW GAME runs.
   */
  startFromStage(stageNumber, fromNewGame) {
    if (!isStagePlayable(stageNumber)) return false;
    this.stageManager.setStage(stageNumber);

    this.player = new Player();
    this.score = 0;
    this.crystalStages = new Set();
    this.runFromNewGame = !!fromNewGame && stageNumber === 1;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;
    this.beginStage();
    this.state = STATE.PLAYING;
    return true;
  }

  /**
   * Return to the title screen without touching stage-unlock save data.
   */
  returnToTitle() {
    this.player = new Player();
    this.clearStageObjects();
    this.score = 0;
    this.playTime = 0;
    this.stageClearTimer = 0;
    this.scoreSaved = false;
    this.newBestScore = false;
    this.newBestClearScore = false;
    this.combo.reset();
    this.background.setTheme('title');
    this.titleMenu.reset();
    this.state = STATE.TITLE;
  }

  recordGameOverScore() {
    if (this.scoreSaved) return;
    this.newBestScore = saveBestScore(this.score);
    this.newBestClearScore = false;
    this.scoreSaved = true;
  }

  recordCampaignCompleteScore() {
    if (this.scoreSaved) return;
    this.newBestScore = saveBestScore(this.score);
    this.newBestClearScore = saveBestClearScore(this.score);
    this.scoreSaved = true;
  }

  /**
   * Prepare the current stage (DESIGN.md 15-7). Score, weapon + Lv,
   * options, NOVA gauge and crystals carry over; lives, the HULL UP
   * cap, REFLECT SHIELD, position and a short invincibility reset.
   */
  beginStage() {
    this.clearStageObjects();
    this.timeline = new TimelineRunner(STAGE_TIMELINES[this.stage.stageNumber]);
    this.background.setTheme(this.stage.stageNumber);
    this.playTime = 0;
    this.stageClearTimer = 0;
    this.combo.reset();

    const p = this.player;
    p.x = CANVAS_WIDTH / 2;
    p.y = CANVAS_HEIGHT - 60;
    p.maxLives = PLAYER_MAX_LIVES;
    p.lives = p.maxLives;
    p.alive = true;
    p.reflectTimer = 0;
    p.fireTimer = 0;
    p.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
    for (const o of p.options) {
      o.x = p.x;
      o.y = p.y + OPTION_OFFSET_Y;
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update() {
    this.input.update();
    this.globalFrame++;

    // M toggles sound everywhere (title, play, pause, ...).
    if (this.input.mute) this.audio.toggleMute();

    switch (this.state) {
      case STATE.TITLE:
        this.background.update();
        this.titleMenu.update(this);
        break;
      case STATE.PLAYING:
        this.updatePlaying();
        break;
      case STATE.PAUSED:
        if (this.input.pause) this.state = STATE.PLAYING;
        break;
      case STATE.GAME_OVER:
        this.updateGameOver();
        break;
      case STATE.STAGE_CLEAR:
        this.updateStageClear();
        break;
      case STATE.CAMPAIGN_COMPLETE:
        this.updateCampaignComplete();
        break;
    }
  }

  updateGameOver() {
    this.background.update();
    this.effects.update();
    if (this.input.enter) {
      this.returnToTitle();
    }
  }

  updateStageClear() {
    this.background.update();
    this.effects.update();
    this.stageClearTimer++;
    if (this.input.enter && this.stageClearTimer > 120) {
      // STAGE_CLEAR is only reached when a next stage exists.
      if (this.stageManager.advance()) {
        this.beginStage();
        this.state = STATE.PLAYING;
      } else {
        this.state = STATE.CAMPAIGN_COMPLETE;
      }
    }
  }

  updateCampaignComplete() {
    this.background.update();
    this.effects.update();
    this.stageClearTimer++;
    if (this.input.enter && this.stageClearTimer > 90) {
      this.returnToTitle();
    }
  }

  updatePlaying() {
    if (this.input.pause) {
      this.state = STATE.PAUSED;
      return;
    }

    this.playTime++;
    this.background.update();
    this.handleDebugKeys();
    this.combo.update();

    // --- Stage script ---
    this.timeline.update(ev => this.handleTimelineEvent(ev));

    // --- Player ---
    this.player.update(this.input);
    this.touch.applyDrag(this.player);
    if (this.input.burst) this.useBurst();
    if (this.input.shoot) {
      const shots = this.player.shoot();
      if (shots.length) {
        this.playerBullets.push(...shots);
        this.audio.play('shot');
      }
    }
    for (const b of this.playerBullets) b.update(this);
    this.playerBullets = this.playerBullets.filter(b => b.alive);

    // --- Enemies ---
    for (const e of this.enemies) {
      e.update(this.player);
      if (e.canFire && e.alive) {
        this.addEnemyBullets(e.tryFire(this.player.x, this.player.y));
      }
    }
    this.enemies = this.enemies.filter(e => e.alive);

    // --- Boss ---
    if (this.boss) {
      this.boss.update(this);
      if (this.boss.isFinished) {
        this.boss = null;
        this.onStageCleared();
        return;
      }
    }

    // --- Hostile bullets & hazards ---
    for (const b of this.enemyBullets) b.update();
    this.enemyBullets = this.enemyBullets.filter(b => b.alive);
    for (const h of this.hazards) h.update();
    this.hazards = this.hazards.filter(h => h.alive);

    if (this.warningTimer > 0) this.warningTimer--;

    // --- Powerups ---
    for (const p of this.powerups) p.update();
    this.powerups = this.powerups.filter(p => p.alive);

    // --- Collisions ---
    this.checkCollisions();
    if (this.pendingEnemies.length) {
      this.enemies.push(...this.pendingEnemies);
      this.pendingEnemies = [];
    }
    this.enemies = this.enemies.filter(e => e.alive);

    // --- Effects ---
    this.effects.update();

    // --- Game Over check ---
    if (!this.player.alive) {
      this.recordGameOverScore();
      this.state = STATE.GAME_OVER;
    }
  }

  /** Boss sequence finished: next stage, or campaign complete. */
  onStageCleared() {
    this.stageClearTimer = 0;
    if (this.stageManager.hasNextImplemented()) {
      saveUnlockedStage(this.stageManager.current + 1);
      this.state = STATE.STAGE_CLEAR;
    } else {
      this.recordCampaignCompleteScore();
      this.state = STATE.CAMPAIGN_COMPLETE;
    }
  }

  // ============================================================
  // TIMELINE EVENTS
  // ============================================================
  handleTimelineEvent(ev) {
    switch (ev.kind) {
      case 'spawn': {
        if (this.spawnsLocked) return;
        const enemy = spawnTimelineEnemy(ev, this.player);
        if (enemy) this.enemies.push(enemy);
        return;
      }
      case 'warning':
        this.startWarning();
        return;
      case 'boss':
        this.spawnBoss(ev.entry.type);
        return;
      default:
        // midboss / comm / gimmicks / hazard / asteroid / goldEnemy /
        // wall arrive with the stages that use them (Phase 3-5).
        if (DEBUG_MODE) console.warn('timeline: "' + ev.kind + '" is not implemented yet');
    }
  }

  /**
   * Pre-boss WARNING: stops small-fry spawns and clears hostile fire.
   * (Phase 4 adds the red bands, alarm and boss BGM.)
   */
  startWarning() {
    const bossEvent = this.timeline.findNext('boss');
    this.warningBossName = bossEvent ? bossDisplayName(bossEvent.entry.type) : 'BOSS';
    this.warningTimer = WARNING_FRAMES;
    this.spawnsLocked = true;
    this.enemyBullets = [];
    this.hazards = [];
  }

  spawnBoss(type) {
    const boss = createBoss(type);
    if (!boss) {
      if (DEBUG_MODE) console.warn('timeline: unknown boss', type);
      return;
    }
    this.spawnsLocked = true;
    this.boss = boss;
  }

  // ============================================================
  // WORLD INTERFACE (used by bosses, enemies and patterns)
  // ============================================================
  addEnemyBullets(bullets) {
    if (bullets && bullets.length) this.enemyBullets.push(...bullets);
  }

  addHazard(hazard) {
    this.hazards.push(hazard);
  }

  /** Remove every hostile bullet and hazard (form change, boss defeat). */
  clearHostiles() {
    this.enemyBullets = [];
    this.hazards = [];
  }

  onBossDefeated(boss) {
    this.score += boss.score;
  }

  onBossPartDestroyed(boss, part) {
    this.score += part.score * this.combo.multiplier;
    this.player.addGauge(GAUGE_PART_BREAK);
    this.effects.explode(part.x(boss), part.y(boss), 14);
    this.audio.play('explode');
  }

  // ============================================================
  // COLLISIONS
  // ============================================================
  checkCollisions() {
    this.checkPlayerShots();
    this.checkItems();

    // Everything below can hurt the player.
    if (!this.player.alive || this.player.isInvincible) return;
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.hitRadius;

    // --- Enemies vs player ---
    for (const enemy of this.enemies) {
      if (!enemy.alive || this.debugInvincible) continue;
      if (circleCollision(px, py, pr, enemy.x, enemy.y, enemy.radius)) {
        enemy.alive = false;
        this.effects.explode(enemy.x, enemy.y);
        this.hitPlayer();
      }
    }

    // --- Hostile bullets vs player (hit, else graze) ---
    for (const bullet of this.enemyBullets) {
      if (!bullet.alive) continue;
      if (circleCollision(px, py, pr, bullet.x, bullet.y, bullet.radius)) {
        if (this.player.isInvincible || this.debugInvincible) continue;
        bullet.alive = false;
        this.effects.hitSpark(bullet.x, bullet.y);
        this.hitPlayer();
      } else if (!bullet.grazed && !this.player.isInvincible &&
                 circleCollision(px, py, GRAZE_RADIUS, bullet.x, bullet.y, bullet.radius)) {
        this.graze(bullet);
      }
    }

    // --- Hazards vs player ---
    for (const hazard of this.hazards) {
      if (hazard.hitsCircle(px, py, pr)) this.hitPlayer();
    }
  }

  /** Player projectiles (incl. options and reflected bullets) vs enemies and boss. */
  checkPlayerShots() {
    for (const bullet of this.playerBullets) {
      if (!bullet.alive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (!circleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) continue;

        if (bullet.kind === 'rail') {
          // RAIL LANCER: damage each enemy once, keep travelling.
          if (bullet.hitSet.indexOf(enemy) !== -1) continue;
          bullet.hitSet.push(enemy);
          this.damageEnemy(enemy, bullet.damage, 'rail');
          this.effects.hitSpark(bullet.x, bullet.y);
          continue; // pierces
        }
        bullet.alive = false;
        this.effects.hitSpark(bullet.x, bullet.y);
        this.damageEnemy(enemy, bullet.damage, bullet.kind === 'chain' ? 'chain' : 'bullet');
        if (bullet.kind === 'chain') this.chainLightning(enemy, bullet);
        break; // other shots hit only one enemy
      }
    }

    // --- Player shots vs boss (parts first, then the core) ---
    if (!this.boss || !this.boss.isTargetable) return;
    for (const bullet of this.playerBullets) {
      if (!bullet.alive) continue;
      const target = this.boss.findHitTarget(bullet.x, bullet.y, bullet.radius);
      if (!target) continue;

      if (bullet.kind === 'rail') {
        if (bullet.hitSet.indexOf(target) !== -1) continue;
        bullet.hitSet.push(target);
      } else {
        bullet.alive = false;
      }
      this.boss.applyHit(target, bullet.damage, bullet.kind === 'rail' ? 'rail' : 'bullet', this);
      this.effects.hitSpark(bullet.x, bullet.y);
      this.score += BOSS_HIT_SCORE;
    }
  }

  damageEnemy(enemy, amount, source) {
    enemy.applyDamage(amount, source);
    if (enemy.hp <= 0) this.destroyEnemy(enemy);
  }

  /**
   * CHAIN BOLT: from the enemy just hit, jump to the nearest other
   * enemy within CHAIN_RANGE, `bolt.chains` times.
   */
  chainLightning(first, bolt) {
    const hit = [first];
    let from = first;
    for (let i = 0; i < bolt.chains; i++) {
      let next = null;
      let best = CHAIN_RANGE;
      for (const e of this.enemies) {
        if (!e.alive || hit.includes(e)) continue;
        const d = dist(from.x, from.y, e.x, e.y);
        if (d <= best) {
          best = d;
          next = e;
        }
      }
      if (!next) return;
      this.effects.lightning(from.x, from.y, next.x, next.y);
      hit.push(next);
      this.damageEnemy(next, bolt.jumpDamage, 'chain');
      from = next;
    }
  }

  /** Items vs player. Invincibility only blocks damage; items are always collectable. */
  checkItems() {
    if (!this.player.alive) return;
    const pr = this.player.hitRadius + PLAYER_ITEM_PICKUP_RADIUS;
    for (const p of this.powerups) {
      if (!p.alive) continue;
      if (circleCollision(this.player.x, this.player.y, pr, p.x, p.y, p.radius)) {
        p.alive = false;
        this.collectItem(p.type);
        this.effects.powerupPickup(p.x, p.y);
      }
    }
  }

  /** Apply one item's effect (DESIGN.md 10). */
  collectItem(type) {
    const player = this.player;
    this.audio.play('item');
    switch (type) {
      case ITEM_OPTION:
        if (!player.addOption()) this.score += OPTION_CAP_BONUS;
        return;
      case ITEM_REFLECT:
        player.setReflect();
        return;
      case ITEM_REPAIR:
        if (!player.heal(1)) this.score += REPAIR_FULL_BONUS;
        return;
      case ITEM_HULL_UP:
        if (!player.increaseMaxLives(1)) this.score += HULL_UP_FULL_BONUS;
        return;
      case ITEM_STAR_CHIP:
        this.score += STAR_CHIP_SCORE;
        player.addGauge(STAR_CHIP_GAUGE);
        return;
      case ITEM_NOVA_CRYSTAL:
        this.crystalStages.add(this.stage.stageNumber);
        return;
      default:
        // Weapon items
        if (player.collectWeapon(type) === 'max') {
          this.score += WEAPON_MAX_LEVEL_BONUS;
          player.addGauge(WEAPON_MAX_LEVEL_GAUGE);
        }
    }
  }

  // ============================================================
  // GRAZE / BURST / DAMAGE
  // ============================================================

  /** A hostile bullet passed close by (once per bullet). */
  graze(bullet) {
    bullet.grazed = true;
    this.player.addGauge(GAUGE_GRAZE);
    this.score += GRAZE_SCORE * this.combo.multiplier;
    this.effects.grazeSpark(
      (this.player.x + bullet.x) / 2,
      (this.player.y + bullet.y) / 2
    );
    this.audio.play('graze');
  }

  /**
   * NOVA BURST (X, gauge full): clears hostile bullets (10 pts each),
   * 30 damage to small enemies on screen, capped damage to the boss,
   * 120 frames of invincibility.
   */
  useBurst() {
    const player = this.player;
    if (!player.alive || !player.burstReady) return false;
    player.gauge = 0;
    player.invincibleTimer = Math.max(player.invincibleTimer, BURST_INVINCIBLE_FRAMES);

    this.score += this.enemyBullets.length * BURST_BULLET_SCORE;
    for (const b of this.enemyBullets) this.effects.hitSpark(b.x, b.y);
    this.clearHostiles();

    for (const e of this.enemies) {
      if (e.alive && isOnScreen(e.x, e.y)) this.damageEnemy(e, BURST_ENEMY_DAMAGE, 'burst');
    }
    if (this.boss && this.boss.isTargetable && this.boss.isVulnerable()) {
      const dmg = Math.min(BURST_ENEMY_DAMAGE, this.boss.maxHp * BURST_BOSS_DAMAGE_RATIO);
      this.boss.applyHit(this.boss, dmg, 'burst', this);
    }

    this.effects.burst(player.x, player.y);
    this.audio.play('burst');
    return true;
  }

  /**
   * Apply one hit to the player. REFLECT SHIELD blocks it first and
   * turns nearby enemy bullets around; otherwise the ship loses a
   * life, a weapon level and an option, and the combo breaks.
   */
  hitPlayer() {
    const player = this.player;
    if (player.isInvincible || !player.alive || this.debugInvincible) return;
    const x = player.x;
    const y = player.y;

    if (player.reflectActive) {
      player.reflectTimer = 0;
      player.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
      this.reflectBullets(x, y);
      this.effects.explode(x, y, 10, 2.5);
      this.audio.play('item');
      return;
    }

    this.combo.break();
    this.audio.play('hit');
    if (player.takeDamage()) {
      this.effects.explode(x, y, 20, 5);
    } else {
      this.effects.hitSpark(x, y);
    }
  }

  /** REFLECT SHIELD: hostile bullets within REFLECT_RADIUS fly back at enemies. */
  reflectBullets(x, y) {
    const kept = [];
    for (const b of this.enemyBullets) {
      if (b.alive && dist(x, y, b.x, b.y) <= REFLECT_RADIUS) {
        this.playerBullets.push(new ReflectedBullet(b.x, b.y, -b.vx, -b.vy));
      } else {
        kept.push(b);
      }
    }
    this.enemyBullets = kept;
  }

  /**
   * DEBUG hotkeys (in play only, DESIGN.md 3):
   *   1-4 = SPREAD / RAIL / CHAIN / HOMING   5 = current weapon Lv +1
   *   6 = option +1   7 = REFLECT SHIELD   8 = NOVA gauge full
   *   9 = skip to just before the WARNING   0 = invincibility on/off
   */
  handleDebugKeys() {
    if (!DEBUG_MODE) return;
    const input = this.input;
    const player = this.player;
    WEAPON_ORDER.forEach((type, i) => {
      if (input.isJustPressed('Digit' + (i + 1))) {
        player.setWeapon(type, player.hasLevel ? player.weaponLevel : 1);
      }
    });
    if (input.isJustPressed('Digit5')) player.levelUp();
    if (input.isJustPressed('Digit6')) player.addOption();
    if (input.isJustPressed('Digit7')) player.setReflect();
    if (input.isJustPressed('Digit8')) player.addGauge(GAUGE_MAX);
    if (input.isJustPressed('Digit9')) this.debugSkipToWarning();
    if (input.isJustPressed('Digit0')) this.debugInvincible = !this.debugInvincible;
  }

  debugSkipToWarning() {
    if (!this.timeline.skipTo('warning')) return;
    this.enemies = [];
    this.enemyBullets = [];
    this.hazards = [];
  }

  /**
   * Handle an enemy that has been reduced to 0 HP: combo, score,
   * gauge, explosion, item drop, and any split offspring. Queued
   * minions are flushed after the collision pass.
   */
  destroyEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    const mult = this.combo.addKill();
    this.score += enemy.score * mult;
    this.player.addGauge(enemy.large ? GAUGE_KILL_LARGE : GAUGE_KILL);
    this.effects.explode(enemy.x, enemy.y);
    this.audio.play('explode');

    const spawned = enemy.onDeath();
    if (spawned && spawned.length) {
      this.pendingEnemies.push(...spawned);
    }

    // Item drop, rate driven by the current stage.
    const dropRate = this.stage.itemDropRate || POWERUP_DROP_CHANCE;
    if (Math.random() < dropRate) {
      this.powerups.push(new Powerup(enemy.x, enemy.y, null, this.stage.powerupWeights));
    }
  }

  // ============================================================
  // DRAW
  // ============================================================
  draw() {
    const ctx = this.ctx;

    this.background.draw(ctx);

    switch (this.state) {
      case STATE.TITLE:
        this.titleMenu.draw(ctx, this);
        break;
      case STATE.PLAYING:
      case STATE.PAUSED:
        this.drawGameplay(ctx);
        if (this.state === STATE.PAUSED) drawPauseScreen(ctx);
        break;
      case STATE.GAME_OVER:
        this.drawGameplay(ctx);
        drawGameOverScreen(ctx, this);
        break;
      case STATE.STAGE_CLEAR:
        this.drawGameplay(ctx);
        drawStageClearScreen(ctx, this);
        break;
      case STATE.CAMPAIGN_COMPLETE:
        drawCampaignCompleteScreen(ctx, this);
        break;
    }
  }

  drawGameplay(ctx) {
    for (const p of this.powerups) p.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);

    // Hazard guides / strikes sit under ships and bullets.
    for (const h of this.hazards) h.draw(ctx);

    this.player.drawOptions(ctx);
    if (this.player.reflectActive && this.player.alive) {
      drawReflectShield(ctx, this.player.x, this.player.y, this.playTime, this.player.reflectSecondsLeft);
    }
    this.player.draw(ctx);

    // Bullets above everything in the playfield, hostile fire on top.
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);

    this.effects.draw(ctx);
    this.hud.draw(ctx, this);
  }
}
