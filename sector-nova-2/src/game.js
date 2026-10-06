// ============================================================
// SECTOR NOVA 2 - Game Logic & State Machine
// ------------------------------------------------------------
// Owns the state machine, stage flow, collisions and the entity
// lists. Stage content comes from timeline.js, bosses from boss.js
// and src/bosses/, the HUD from hud.js, menus and full-screen
// overlays from menu.js, the backdrop from background.js and sound
// from audio.js.
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
    this.difficulty = loadDifficulty();

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
   * Start a clean run from an implemented, unlocked stage
   * (NEW GAME / CONTINUE / STAGE SELECT all start with score 0).
   */
  startFromStage(stageNumber) {
    if (!isStagePlayable(stageNumber)) return false;
    this.stageManager.setStage(stageNumber);

    this.player = new Player();
    this.score = 0;
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
   * Prepare the current stage: fresh timeline and backdrop. Keeps the
   * score for normal progression but resets the player's condition
   * (SECTOR NOVA 1 rules; Phase 2 adds weapon / gauge carry-over).
   */
  beginStage() {
    this.clearStageObjects();
    this.timeline = new TimelineRunner(STAGE_TIMELINES[this.stage.stageNumber]);
    this.background.setTheme(this.stage.stageNumber);
    this.playTime = 0;
    this.stageClearTimer = 0;

    this.player.x = CANVAS_WIDTH / 2;
    this.player.y = CANVAS_HEIGHT - 60;
    this.player.maxLives = PLAYER_MAX_LIVES;
    this.player.lives = this.player.maxLives;
    this.player.alive = true;
    this.player.weaponType = WEAPON_NORMAL;
    this.player.weaponTimer = 0;
    this.player.shieldActive = false;
    this.player.shieldTimer = 0;
    this.player.fireTimer = 0;
    this.player.invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
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

    // --- Stage script ---
    this.timeline.update(ev => this.handleTimelineEvent(ev));

    // --- Player ---
    this.player.update(this.input);
    if (this.input.shoot) {
      const shots = this.player.shoot();
      if (shots.length) {
        this.playerBullets.push(...shots);
        this.audio.play('shot');
      }
    }
    for (const b of this.playerBullets) b.update();
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
    this.score += part.score;
    this.effects.explode(part.x(boss), part.y(boss), 14);
    this.audio.play('explode');
  }

  // ============================================================
  // COLLISIONS
  // ============================================================
  checkCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    const pr = this.player.hitRadius;

    // --- Player bullets vs enemies ---
    for (const bullet of this.playerBullets) {
      if (!bullet.alive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;

        if (circleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
          if (bullet.kind === 'laser') {
            // PIERCE LASER: damage each enemy once, keep travelling.
            if (bullet.hitSet.indexOf(enemy) !== -1) continue;
            bullet.hitSet.push(enemy);
            enemy.applyDamage(bullet.damage, 'laser');
            this.effects.hitSpark(bullet.x, bullet.y);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            // No break: the beam pierces through.
          } else if (bullet.kind === 'flame') {
            bullet.alive = false;
            enemy.applyDamage(bullet.damage, 'bullet');
            this.effects.explode(bullet.x, bullet.y, 6, 2.2);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            break;
          } else {
            // NORMAL bullet.
            bullet.alive = false;
            enemy.applyDamage(bullet.damage, 'bullet');
            this.effects.hitSpark(bullet.x, bullet.y);
            if (enemy.hp <= 0) this.destroyEnemy(enemy);
            break; // Each bullet hits only one enemy
          }
        }
      }
    }

    // --- Player bullets vs boss (parts first, then the core) ---
    if (this.boss && this.boss.isTargetable) {
      for (const bullet of this.playerBullets) {
        if (!bullet.alive) continue;
        const target = this.boss.findHitTarget(bullet.x, bullet.y, bullet.radius);
        if (!target) continue;

        if (bullet.kind === 'laser') {
          if (bullet.hitSet.indexOf(target) !== -1) continue;
          bullet.hitSet.push(target);
          this.boss.applyHit(target, LASER_BOSS_DAMAGE, 'laser', this);
          this.effects.hitSpark(bullet.x, bullet.y);
        } else {
          bullet.alive = false;
          this.boss.applyHit(target, bullet.damage, 'bullet', this);
          if (bullet.kind === 'flame') this.effects.explode(bullet.x, bullet.y, 6, 2.2);
          else this.effects.hitSpark(bullet.x, bullet.y);
        }
        this.score += BOSS_HIT_SCORE;
      }
    }

    // --- Powerups vs player ---
    // Invincibility only blocks damage; living players can still collect items.
    if (this.player.alive) {
      for (const p of this.powerups) {
        if (!p.alive) continue;

        if (circleCollision(px, py, pr + 8, p.x, p.y, p.radius)) {
          p.alive = false;
          if (p.type === ITEM_SHIELD) {
            this.player.setShield();
            this.score += 500;
          } else if (p.type === ITEM_LIFE) {
            if (!this.player.heal(1)) {
              this.score += 1000;
            }
          } else if (p.type === ITEM_MAX_LIFE) {
            if (!this.player.increaseMaxLives(1)) {
              this.score += 1500;
            }
          } else {
            this.player.setWeapon(p.type); // equip / overwrite special weapon
            this.score += 500;
          }
          this.effects.powerupPickup(p.x, p.y);
        }
      }
    }

    // Skip damage collision checks if invincible or dead
    if (!this.player.alive || this.player.isInvincible) return;

    // --- Enemies vs player ---
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      if (circleCollision(px, py, pr, enemy.x, enemy.y, enemy.radius)) {
        enemy.alive = false;
        this.effects.explode(enemy.x, enemy.y);
        this.hitPlayer();
      }
    }

    // --- Hostile bullets vs player ---
    for (const bullet of this.enemyBullets) {
      if (!bullet.alive) continue;

      if (circleCollision(px, py, pr, bullet.x, bullet.y, bullet.radius)) {
        bullet.alive = false;
        this.effects.hitSpark(bullet.x, bullet.y);
        this.hitPlayer();
      }
    }

    // --- Hazards vs player ---
    for (const hazard of this.hazards) {
      if (hazard.hitsCircle(px, py, pr)) this.hitPlayer();
    }
  }

  // ============================================================
  // KILL / WEAPON HELPERS
  // ============================================================

  /**
   * Apply one hit to the player, letting SHIELD BARRIER block it first.
   * Invincibility frames from the first hit absorb the rest this frame.
   */
  hitPlayer() {
    const x = this.player.x;
    const y = this.player.y;
    if (this.player.isInvincible || !this.player.alive) return;
    if (this.player.blockHitWithShield()) {
      this.effects.hitSpark(x, y);
      this.effects.explode(x, y, 8, 2.5);
      return;
    }
    if (this.player.takeDamage()) {
      this.effects.explode(x, y, 20, 5);
    }
  }

  /**
   * DEBUG hotkeys (in play only):
   *   1 = NORMAL  2 = TRIPLE  3 = LASER  4 = FLAME  5 = SHIELD
   *   9 = skip to just before the WARNING
   * Phase 2 replaces 1-8 / 0 with the SECTOR NOVA 2 set.
   */
  handleDebugKeys() {
    if (!DEBUG_MODE) return;
    if (this.input.isJustPressed('Digit1')) this.player.setWeapon(WEAPON_NORMAL);
    if (this.input.isJustPressed('Digit2')) this.player.setWeapon(WEAPON_TRIPLE);
    if (this.input.isJustPressed('Digit3')) this.player.setWeapon(WEAPON_PIERCE);
    if (this.input.isJustPressed('Digit4')) this.player.setWeapon(WEAPON_FLAME);
    if (this.input.isJustPressed('Digit5')) this.player.setShield();
    if (this.input.isJustPressed('Digit9')) this.debugSkipToWarning();
  }

  debugSkipToWarning() {
    if (!this.timeline.skipTo('warning')) return;
    this.enemies = [];
    this.enemyBullets = [];
    this.hazards = [];
  }

  /**
   * Handle an enemy that has been reduced to 0 HP: score, explosion,
   * item drop, and any split offspring. Queued minions are flushed
   * after the collision pass to avoid mutating the list mid-loop.
   */
  destroyEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    this.score += enemy.score;
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

    // Shield barrier (drawn under the ship)
    if (this.player.shieldActive && this.player.alive) {
      drawShieldBarrier(ctx, this.player.x, this.player.y, this.playTime);
    }
    this.player.draw(ctx);

    // Bullets above everything in the playfield, hostile fire on top.
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);

    this.effects.draw(ctx);
    this.hud.draw(ctx, this);
  }
}
