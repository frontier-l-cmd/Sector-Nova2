// ============================================================
// SECTOR NOVA 2 - Menus & Screens
// ------------------------------------------------------------
// Title menu (UP/DOWN select, LEFT/RIGHT change, ENTER decide) and
// the full-screen screens: opening, stage intro, pause, game over and
// the stage result with its rank. Endings join in Phase 5.
// ============================================================

// TEST RANGE (Stage 0) is listed only in DEBUG_MODE.
const TITLE_MENU_ITEMS = ['newGame', 'continue', 'stageSelect', 'difficulty', 'bossRush', 'sound']
  .concat(DEBUG_MODE ? ['testRange'] : []);
const TITLE_MENU_Y = 226;    // baseline of the first row
const TITLE_MENU_ROW_H = 17;

/**
 * Large text with a drop shadow: same font, fixed offset, no motion.
 * (Uses the current ctx.font / textAlign.)
 */
function drawShadowedText(ctx, text, x, y, color, shadowColor) {
  ctx.fillStyle = shadowColor;
  ctx.fillText(text, x + TEXT_SHADOW_OFFSET, y + TEXT_SHADOW_OFFSET);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

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
    this.stageCursor = clamp(this.stageCursor, 1, highestSelectableStage());

    // Shortcuts kept from SECTOR NOVA 1: C = continue, 1-6 = stage
    // (0 = TEST RANGE in DEBUG_MODE).
    if (input.isJustPressed('KeyC')) {
      this.decide('continue', game);
      return;
    }
    for (let n = DEBUG_MODE ? 0 : 1; n <= MAX_STAGE; n++) {
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
      const next = clamp(this.stageCursor + dir, 1, highestSelectableStage());
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
        game.startFromStage(1, true);
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
      case 'testRange':
        game.audio.play('select');
        game.startFromStage(0);
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
      { item: 'testRange', label: 'TEST RANGE', value: 'DEBUG', enabled: true },
    ].filter(row => TITLE_MENU_ITEMS.includes(row.item));
  }

  draw(ctx, game) {
    ctx.save();

    // Darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2;
    const titleY = 104;
    ctx.textAlign = 'center';

    // Logo (fixed position, fixed shadow)
    ctx.font = 'bold 30px monospace';
    drawShadowedText(ctx, 'SECTOR', cx, titleY, COLORS.UI_WHITE, COLORS.PLAYER_BULLET_GLOW);
    drawShadowedText(ctx, 'NOVA 2', cx, titleY + 36, COLORS.UI_WHITE, COLORS.PLAYER_BULLET_GLOW);

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
    ctx.fillText('MOVE: ARROWS/WASD  SHOT: SPACE  BURST: X', cx, 408);
    ctx.fillText('P: PAUSE   M: SOUND ON/OFF', cx, 420);
    if ('ontouchstart' in window) {
      ctx.fillStyle = COLORS.UI_GREEN;
      ctx.fillText('TOUCH: TAP ROW TWICE / DRAG TO MOVE / 2 FINGERS: PAUSE', cx, 452);
    }
    if (DEBUG_MODE) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText('DEBUG 1-4 WPN 5 LV 6 OPT 7 RFL 8 NOVA 9 SKIP 0 INV', cx, 438);
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
// OPENING (NEW GAME): LYRA's prologue over the star field
// ============================================================
function drawOpeningScreen(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = COLORS.TITLE_SUBTITLE;
  ctx.fillText('INCOMING TRANSMISSION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.restore();
  game.comm.draw(ctx, CANVAS_HEIGHT / 2 - 20, game.globalFrame);
  if (Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('ENTER / TAP: NEXT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.restore();
  }
}

// ============================================================
// STAGE INTRO: stage number + name (fixed position, no motion)
// ============================================================
function drawStageIntro(ctx, game) {
  const t = game.stateTimer;
  const alpha = Math.min(1, t / 20, (STAGE_INTRO_FRAMES - t) / 20);
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 50, CANVAS_WIDTH, 64);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px monospace';
  drawShadowedText(ctx, 'STAGE ' + game.stage.stageNumber, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 26,
    COLORS.UI_BLUE, COLORS.BG_DARK);
  ctx.font = 'bold 22px monospace';
  drawShadowedText(ctx, game.stage.stageName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 2,
    COLORS.UI_WHITE, COLORS.PLAYER_BULLET_GLOW);
  ctx.restore();
}

// ============================================================
// STAGE RESULT (DESIGN.md 15-6): time, hits, max combo, part-break
// bonus, rank and total. Rows appear one after another.
// ============================================================
function drawResultScreen(ctx, game) {
  const r = game.result;
  if (!r) return;
  const t = game.stateTimer;
  const cx = CANVAS_WIDTH / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 20, ' + Math.min(t / 30, 1) * 0.75 + ')';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  drawShadowedText(ctx, 'STAGE ' + r.stageNumber + ' CLEAR', cx, 96, COLORS.UI_GREEN, COLORS.BG_DARK);
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_BLUE;
  ctx.fillText(r.stageName, cx, 114);

  const fmt = (sec) => sec === null ? '--' : sec.toFixed(1) + 's';
  const rows = [
    ['CLEAR TIME', fmt(r.clearSeconds), ''],
    ['BOSS TIME', fmt(r.bossSeconds), '+' + r.timePoints],
    ['DAMAGE TAKEN', String(r.hits), '+' + r.hitPoints],
    ['MAX COMBO', String(r.maxCombo), '+' + r.comboPoints],
    ['PART BONUS', String(r.partBonus), ''],
  ];
  ctx.font = '9px monospace';
  rows.forEach(([label, value, pts], i) => {
    if (t < 20 + i * 10) return;
    const y = 150 + i * 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText(label, 48, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText(value, 230, y);
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText(pts, 274, y);
  });

  if (t >= RESULT_RANK_FRAME) {
    ctx.textAlign = 'center';
    ctx.font = '9px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('RANK  (' + r.points + ' / 100)', cx, 256);
    ctx.font = 'bold 36px monospace';
    const rankColor = { S: COLORS.UI_YELLOW, A: COLORS.UI_GREEN, B: COLORS.UI_BLUE, C: COLORS.UI_WHITE }[r.rank];
    drawShadowedText(ctx, r.rank, cx, 296, rankColor, COLORS.BG_DARK);
    if (r.newBestRank) {
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText('NEW BEST RANK', cx, 310);
    }
    ctx.font = '9px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText('RANK BONUS  +' + r.bonus, cx, 330);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText('TOTAL  ' + String(Math.floor(r.total)).padStart(8, '0'), cx, 352);
  }

  if (t > RESULT_INPUT_DELAY && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.textAlign = 'center';
    ctx.font = '10px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    const next = game.stageManager.hasNextImplemented() ? 'PRESS ENTER - NEXT STAGE' : 'PRESS ENTER TO TITLE';
    ctx.fillText(next, cx, 390);
  }
  ctx.restore();
}
