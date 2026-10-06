// ============================================================
// SECTOR NOVA 2 - Menus & Screens
// ------------------------------------------------------------
// Title menu (UP/DOWN select, LEFT/RIGHT change, ENTER decide) and
// the full-screen overlays: pause, game over, stage clear and
// campaign complete. Result / ending screens join in Phase 4/5.
// ============================================================

const TITLE_MENU_ITEMS = ['newGame', 'continue', 'stageSelect', 'difficulty', 'bossRush', 'sound'];
const TITLE_MENU_Y = 226;    // baseline of the first row
const TITLE_MENU_ROW_H = 17;

class TitleMenu {
  constructor() {
    this.index = 0;
    this.stageCursor = 1;
  }

  reset() {
    this.index = 0;
    this.stageCursor = getUnlockedStage();
  }

  get selected() {
    return TITLE_MENU_ITEMS[this.index];
  }

  update(game) {
    const input = game.input;
    this.stageCursor = clamp(this.stageCursor, 1, getUnlockedStage());

    // Shortcuts kept from SECTOR NOVA 1: C = continue, 1-6 = stage.
    if (input.isJustPressed('KeyC')) {
      this.decide('continue', game);
      return;
    }
    for (let n = 1; n <= MAX_STAGE; n++) {
      if (input.isJustPressed('Digit' + n) && isStagePlayable(n)) {
        game.audio.play('select');
        game.startFromStage(n);
        return;
      }
    }

    if (input.menuUp) this.move(-1, game);
    if (input.menuDown) this.move(1, game);
    if (input.menuLeft) this.change(this.selected, -1, game);
    if (input.menuRight) this.change(this.selected, 1, game);
    if (input.enter) this.decide(this.selected, game);
  }

  move(dir, game) {
    const n = TITLE_MENU_ITEMS.length;
    this.index = (this.index + dir + n) % n;
    game.audio.play('select');
  }

  /** LEFT / RIGHT on a row with a value. */
  change(item, dir, game) {
    if (item === 'difficulty') {
      const n = DIFFICULTY_LEVELS.length;
      const i = DIFFICULTY_LEVELS.indexOf(game.difficulty);
      game.setDifficulty(DIFFICULTY_LEVELS[(i + dir + n) % n]);
      game.audio.play('select');
    } else if (item === 'stageSelect') {
      const next = clamp(this.stageCursor + dir, 1, getUnlockedStage());
      if (next !== this.stageCursor) {
        this.stageCursor = next;
        game.audio.play('select');
      }
    } else if (item === 'sound') {
      game.audio.toggleMute();
      game.audio.play('select'); // audible only when turned back on
    }
  }

  /** ENTER on a row. */
  decide(item, game) {
    switch (item) {
      case 'newGame':
        game.audio.play('select');
        game.startFromStage(1);
        break;
      case 'continue':
        game.audio.play('select');
        game.startFromStage(getUnlockedStage());
        break;
      case 'stageSelect':
        game.audio.play('select');
        game.startFromStage(this.stageCursor);
        break;
      case 'difficulty':
      case 'sound':
        this.change(item, 1, game);
        break;
      case 'bossRush':
        // Locked until NORMAL END; the mode itself arrives in Phase 6.
        break;
    }
  }

  /** Label / value / enabled for each row, for drawing. */
  rows(game) {
    const unlocked = getUnlockedStage();
    const arrows = (item, text) => (this.selected === item ? '< ' + text + ' >' : text);
    const bossRush = isBossRushUnlocked();
    return [
      { item: 'newGame', label: 'NEW GAME', value: '', enabled: true },
      { item: 'continue', label: 'CONTINUE', value: 'STAGE ' + unlocked, enabled: true },
      { item: 'stageSelect', label: 'STAGE SELECT', value: arrows('stageSelect', 'STAGE ' + this.stageCursor), enabled: true },
      { item: 'difficulty', label: 'DIFFICULTY', value: arrows('difficulty', game.difficulty), enabled: true },
      { item: 'bossRush', label: bossRush ? 'BOSS RUSH' : '???', value: '', enabled: bossRush },
      { item: 'sound', label: 'SOUND', value: arrows('sound', game.audio.muted ? 'OFF' : 'ON'), enabled: true },
    ];
  }

  draw(ctx, game) {
    ctx.save();

    // Darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2;
    const titleY = 104 + Math.sin(game.globalFrame * 0.03) * 5;
    ctx.textAlign = 'center';

    // Logo glow
    ctx.fillStyle = COLORS.PLAYER_BULLET;
    ctx.globalAlpha = 0.3;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('SECTOR', cx, titleY);
    ctx.fillText('NOVA 2', cx, titleY + 36);
    ctx.globalAlpha = 1;

    // Logo
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 30px monospace';
    ctx.fillText('SECTOR', cx, titleY);
    ctx.fillText('NOVA 2', cx, titleY + 36);

    // Subtitle
    ctx.fillStyle = COLORS.TITLE_SUBTITLE;
    ctx.font = 'bold 11px monospace';
    ctx.fillText('- ECLIPSE -', cx, titleY + 60);

    // Decorative line
    ctx.strokeStyle = COLORS.TITLE_SUBTITLE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(60, titleY + 70);
    ctx.lineTo(CANVAS_WIDTH - 60, titleY + 70);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Menu
    const rows = this.rows(game);
    const menuY = TITLE_MENU_Y;
    const rowH = TITLE_MENU_ROW_H;
    ctx.font = 'bold 10px monospace';
    rows.forEach((row, i) => {
      const y = menuY + i * rowH;
      const isSelected = i === this.index;
      if (isSelected) {
        ctx.fillStyle = 'rgba(136, 187, 255, 0.12)';
        ctx.fillRect(50, y - 11, CANVAS_WIDTH - 100, 15);
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.UI_YELLOW;
        ctx.globalAlpha = 0.6 + Math.sin(game.globalFrame * 0.15) * 0.4;
        ctx.fillText('>', 56, y);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = !row.enabled ? COLORS.MENU_DISABLED
        : isSelected ? COLORS.UI_YELLOW : COLORS.UI_BLUE;
      ctx.fillText(row.label, 68, y);
      if (row.value) {
        ctx.textAlign = 'right';
        ctx.fillStyle = isSelected ? COLORS.UI_WHITE : COLORS.UI_DIM;
        ctx.fillText(row.value, CANVAS_WIDTH - 56, y);
      }
    });

    // Saved scores
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('BEST SCORE: ' + String(game.bestScore).padStart(8, '0'), cx, 346);
    ctx.fillText('BEST CLEAR: ' + String(game.bestClearScore).padStart(8, '0'), cx, 358);

    // Controls help
    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.font = '7px monospace';
    ctx.fillText('UP/DOWN: SELECT   LEFT/RIGHT: CHANGE', cx, 384);
    ctx.fillText('ENTER: OK   C: CONTINUE   1-6: STAGE', cx, 396);
    ctx.fillText('IN GAME  MOVE: ARROWS/WASD  SHOT: SPACE', cx, 408);
    ctx.fillText('P: PAUSE   M: SOUND ON/OFF', cx, 420);
    if ('ontouchstart' in window) {
      ctx.fillStyle = COLORS.UI_GREEN;
      ctx.fillText('TOUCH: TAP ROW TWICE / DRAG TO MOVE / 2 FINGERS: PAUSE', cx, 452);
    }
    if (DEBUG_MODE) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText('DEBUG: IN GAME 1-5 WEAPON  9 SKIP TO BOSS', cx, 438);
    }

    // Credit
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '7px monospace';
    ctx.fillText('AI GAME DEV EXPERIMENT', cx, 466);

    ctx.restore();
  }
}

// ============================================================
// PAUSE OVERLAY
// ============================================================
function drawPauseScreen(ctx) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  ctx.fillStyle = COLORS.UI_BLUE;
  ctx.font = '10px monospace';
  ctx.fillText('PRESS P TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.restore();
}

// ============================================================
// GAME OVER
// ============================================================
function drawGameOverScreen(ctx, game) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.UI_RED;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 42);

  ctx.fillStyle = COLORS.UI_YELLOW;
  ctx.font = '12px monospace';
  ctx.fillText('SCORE: ' + String(game.score).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 2);
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = '10px monospace';
  ctx.fillText('BEST : ' + String(game.bestScore).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  if (game.newBestScore) {
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.font = 'bold 10px monospace';
    ctx.fillText('NEW BEST!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 38);
  }

  if (Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = '10px monospace';
    ctx.fillText('PRESS ENTER TO TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 64);
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('CONTINUE FROM TITLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }

  ctx.restore();
}

// ============================================================
// STAGE CLEAR (replaced by the result / rank screen in Phase 4)
// ============================================================
function drawStageClearScreen(ctx, game) {
  ctx.save();

  const alpha = Math.min(game.stageClearTimer / 60, 1);
  ctx.fillStyle = `rgba(0, 0, 20, ${alpha * 0.6})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  if (game.stageClearTimer > 30) {
    ctx.fillStyle = COLORS.UI_GREEN;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.font = '14px monospace';
    ctx.fillText('SCORE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = 'bold 18px monospace';
    ctx.fillText(String(game.score).padStart(8, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  }

  // Next-stage banner
  if (game.stageClearTimer > 60) {
    const next = STAGES[game.stageManager.current + 1];
    if (next && next.implemented) {
      ctx.fillStyle = COLORS.UI_BLUE;
      ctx.font = '10px monospace';
      ctx.fillText('NEXT: STAGE ' + next.stageNumber, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 48);
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(next.stageName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 64);
    }
  }

  if (game.stageClearTimer > 120 && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = '10px monospace';
    ctx.fillText('PRESS ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 84);
  }

  ctx.restore();
}

// ============================================================
// CAMPAIGN COMPLETE (last implemented stage cleared; replaced by
// the NORMAL / TRUE / BAD endings in Phase 5/6)
// ============================================================
function drawCampaignCompleteScreen(ctx, game) {
  ctx.save();

  const alpha = Math.min(game.stageClearTimer / 60, 1);
  ctx.fillStyle = `rgba(4, 2, 24, ${alpha * 0.8})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  const cx = CANVAS_WIDTH / 2;
  const topY = 120;

  ctx.fillStyle = COLORS.UI_YELLOW;
  ctx.globalAlpha = 0.35;
  ctx.font = 'bold 26px monospace';
  ctx.fillText('CAMPAIGN', cx, topY);
  ctx.fillText('COMPLETE', cx, topY + 30);
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('CAMPAIGN', cx, topY);
  ctx.fillText('COMPLETE', cx, topY + 30);

  ctx.strokeStyle = COLORS.UI_YELLOW;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(50, topY + 48);
  ctx.lineTo(CANVAS_WIDTH - 50, topY + 48);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.UI_BLUE;
  ctx.font = '10px monospace';
  ctx.fillText('THANK YOU FOR PLAYING', cx, topY + 70);
  ctx.fillStyle = COLORS.UI_DIM;
  ctx.font = '8px monospace';
  ctx.fillText('SECTOR NOVA 2: ECLIPSE', cx, topY + 86);

  ctx.fillStyle = COLORS.UI_YELLOW;
  ctx.font = '14px monospace';
  ctx.fillText('TOTAL SCORE', cx, topY + 132);
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = 'bold 22px monospace';
  ctx.fillText(String(game.score).padStart(8, '0'), cx, topY + 158);

  ctx.fillStyle = COLORS.UI_BLUE;
  ctx.font = '12px monospace';
  ctx.fillText('BEST CLEAR', cx, topY + 188);
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(String(game.bestClearScore).padStart(8, '0'), cx, topY + 212);
  if (game.newBestClearScore) {
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.font = 'bold 10px monospace';
    ctx.fillText('NEW CLEAR BEST!', cx, topY + 232);
  }

  if (game.stageClearTimer > 90 && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = '10px monospace';
    ctx.fillText('PRESS ENTER TO TITLE', cx, topY + 258);
  }

  ctx.restore();
}
