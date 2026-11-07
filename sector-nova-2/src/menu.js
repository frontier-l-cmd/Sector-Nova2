// ============================================================
// SECTOR NOVA 2 - Menus & Screens
// ------------------------------------------------------------
// Title menu (UP/DOWN select, LEFT/RIGHT change, ENTER decide) and
// the full-screen screens: opening, stage intro, pause, game over and
// the stage result with its rank, the endings (NORMAL / TRUE / BAD)
// and the BOSS RUSH result.
// ============================================================

// TEST RANGE (Stage 0) is listed only in DEBUG_MODE.
const TITLE_MENU_ITEMS = ['newGame', 'continue', 'stageSelect', 'difficulty', 'bossRush', 'manual', 'sound']
  .concat(DEBUG_MODE ? ['testRange'] : []);
const TITLE_MENU_Y = 226;    // baseline of the first row
const TITLE_MENU_ROW_H = 17;

// MANUAL (title menu): the manual, in Japanese. Pages 1-2 explain
// the items, pages 3-5 the play screen. Numbers come from the game's
// own constants, and the screen pages draw each HUD part with the real
// HUD code (on sample values), so the manual never drifts from the game.
const MANUAL_FONT = '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';
const MANUAL_PAGES = [
  {
    heading: 'アイテム説明',
    title: '武器',
    entryStep: 46,
    entries: [
      { type: WEAPON_SPREAD, name: 'SPREAD FAN', sub: '拡散弾', lines: [
        '扇のように広がる弾。Lv1 3方向/Lv2 4方向/Lv3 5方向。',
        '近くの敵や、敵の群れに強い。'] },
      { type: WEAPON_RAIL, name: 'RAIL LANCER', sub: '貫通ビーム', lines: [
        '敵を貫くビーム。威力2。Lv3はビーム2本。',
        '縦に並んだ敵に強い。装備中は移動が' + RAIL_MOVE_SCALE + '倍。'] },
      { type: WEAPON_CHAIN, name: 'CHAIN BOLT', sub: '連鎖電撃', lines: [
        '当てた敵から近くの敵(' + CHAIN_RANGE + 'px以内)へ電撃が飛ぶ。',
        'Lv1/2/3で1/2/3回つながる。群れに強い。'] },
      { type: WEAPON_HOMING, name: 'HOMING NEEDLE', sub: '追尾針', lines: [
        'いちばん近い敵を追いかける針。',
        'Lv1/2/3で1/2/3発。横からも当てられる。'] },
    ],
    notesTitle: '武器のルール',
    notes: [
      '・別の色を取る: 武器が変わる(Lvはそのまま)',
      '・同じ色を取る: Lvアップ(最大Lv' + WEAPON_MAX_LEVEL + ')',
      '・Lv' + WEAPON_MAX_LEVEL + 'で同じ色: ' + WEAPON_MAX_LEVEL_BONUS + '点 + NOVAゲージ' + WEAPON_MAX_LEVEL_GAUGE + '%',
      '・被弾でLvダウン。Lv1で被弾するとNORMALに戻る',
      '・時間切れはなし。NORMAL弾はいつでも撃てる',
      '・ボスはHPが75/50/25%を切ると武器を落とす',
    ],
  },
  {
    heading: 'アイテム説明',
    title: 'サポート',
    entryStep: 56,
    entries: [
      { type: ITEM_OPTION, name: 'OPTION', sub: 'オプション機', lines: [
        'いっしょに弾を撃つオプション機が1機増える。',
        '最大' + OPTION_MAX + '機。被弾すると1機減る。',
        '最大の時に取ると' + OPTION_CAP_BONUS + '点。'] },
      { type: ITEM_REFLECT, name: 'REFLECT SHIELD', sub: '反射シールド', lines: [
        '被弾を1回だけ防ぐ。防いだ時、まわり' + REFLECT_RADIUS + 'pxの',
        '敵弾をはね返し、敵に当たる弾にする。',
        'Lvは下がらない。' + Math.round(REFLECT_DURATION / 60) + '秒で消える。'] },
      { type: ITEM_REPAIR, name: 'REPAIR', sub: '修理', lines: [
        'ライフ+1。',
        'ライフ満タンの時は' + REPAIR_FULL_BONUS + '点。'] },
      { type: ITEM_HULL_UP, name: 'HULL UP', sub: '装甲強化', lines: [
        'このステージの間だけ最大ライフ+1(最大' + PLAYER_STAGE_MAX_LIVES + ')',
        'して、ライフ全回復。',
        '最大かつ満タンの時は' + HULL_UP_FULL_BONUS + '点。'] },
      { type: ITEM_STAR_CHIP, name: 'STAR CHIP', sub: 'スターチップ', lines: [
        STAR_CHIP_SCORE + '点 + NOVAゲージ' + STAR_CHIP_GAUGE + '%。',
        'よく落ちる。'] },
      { type: ITEM_NOVA_CRYSTAL, name: 'NOVA CRYSTAL', sub: '隠しアイテム', lines: [
        '各ステージに1つ、それぞれ決まった条件で出る。',
        'NEW GAMEからCONTINUEなしで' + MAX_STAGE + '個',
        '集めると TRUE END へ。'] },
    ],
  },
  // --- The play screen. sample = the part of the real HUD to show:
  // `part` is drawn with sample values, clipped to (sx, sy, sw, sh)
  // in screen coordinates.
  {
    heading: '画面の見方',
    title: '上の帯',
    screen: true,
    entries: [
      { name: 'ライフ', sample: { part: 'topBar', sx: 2, sy: 1, sw: 44, sh: 14 }, lines: [
        '黄色の四角が残りのライフ。暗い四角は減った分。',
        '0になるとゲームオーバー。HULL UPで枠が増える。'] },
      { name: 'スコア', sample: { part: 'topBar', sx: 112, sy: 1, sw: 96, sh: 14 }, lines: [
        'いまの得点。コンボ中は倍率がかかる。'] },
      { name: '結晶とステージ', sample: { part: 'topBar', sx: 270, sy: 1, sw: 50, sh: 14 }, lines: [
        '◆の数字: 集めたNOVA CRYSTALの数。灰色の時は',
        'TRUE ENDに数えない(CONTINUE・ステージセレクト)。',
        'STの数字: いまのステージ。BOSS RUSHではタイム。'] },
      { name: 'コンボ', sample: { part: 'combo', sx: 250, sy: 17, sw: 70, sh: 16 }, lines: [
        '敵を続けて倒すと増える。下の線は残り時間で、',
        '切れる前に次を倒すと続く。被弾すると途切れる。',
        COMBO_TIERS.filter(t => t[1] > 1).reverse().map(t => t[0] + 'で×' + t[1]).join('、') + '(得点の倍率)。'] },
      { name: 'ポーズボタン(スマホ)', sample: { part: 'pause', sx: 66, sy: 1, sw: 24, sh: 14 }, lines: [
        'タップでポーズ。2本指タップでもポーズできる。'] },
    ],
  },
  {
    heading: '画面の見方',
    title: 'ボス・武器・ゲージ',
    screen: true,
    entries: [
      { name: 'ボスのHP', sample: { part: 'bossBar', sx: 4, sy: 18, sw: 240, sh: 30 }, lines: [
        'ボスの名前と残りHP。緑から赤に変わると怒り状態で、',
        '攻撃が激しくなる。下の黄色い文字は今の形態。',
        '中ボスの「ESCAPE」は逃げるまでの秒数。'] },
      { name: '武器とLv', sample: { part: 'weapon', sx: 2, sy: CANVAS_HEIGHT - 38, sw: 90, sh: 13 }, lines: [
        '今の武器の名前。右の点の数がLv(最大' + WEAPON_MAX_LEVEL + ')。',
        'NORMALにはLvがない。'] },
      { name: 'オプション・シールド', sample: { part: 'weapon', sx: 2, sy: CANVAS_HEIGHT - 25, sw: 120, sh: 12 }, lines: [
        'OPTの丸: オプション機の数(最大' + OPTION_MAX + ')。',
        'REFLECT: 反射シールドの残り秒数。'] },
      { name: 'NOVAゲージ', sample: { part: 'gauge', sx: 214, sy: CANVAS_HEIGHT - 24, sw: 106, sh: 22 }, lines: [
        '敵を倒す・敵弾にかする(すれすれで避ける)と',
        '溜まる。100%で「BURST READY」が点滅し、',
        'Xキー(スマホはBURSTボタン)でNOVA BURST。'] },
    ],
  },
  {
    heading: '画面の見方',
    title: 'その他',
    screen: true,
    entries: [
      { name: 'NOVA BURST', sample: { part: 'burst', sx: TOUCH_BURST_X - 24, sy: TOUCH_BURST_Y - 24, sw: 48, sh: 48 }, lines: [
        '画面の敵弾をすべて消し、敵にダメージ。',
        '少しの間無敵。スマホは右下のボタンで使う。',
        '暗い時はゲージ不足(縁の光が溜まり具合)。'] },
      { name: '当たり判定', sample: { part: 'ship', sx: 0, sy: 0, sw: 32, sh: 32, zoom: 2 }, lines: [
        '自機の中心の白い点だけに当たり判定がある。',
        'まわり' + GRAZE_RADIUS + 'pxを敵弾が通ると「かすり」になり、',
        '得点とNOVAゲージが入る。'] },
      { name: 'WARNING / CAUTION', lines: [
        'WARNING: ボスが来る合図。',
        'CAUTION: 狭い通路や重力など、地形の危険の合図。'] },
      { name: 'LV DOWN / OPTION LOST', lines: [
        '被弾した時に自機のそばに出る。失ったものの表示。'] },
    ],
  },
];
const MANUAL_TOP = 74;      // top of the first entry
const MANUAL_NAV_Y = 452;   // baseline of the "< PREV  BACK  NEXT >" bar
const MANUAL_NAV_TOP = 432; // touch: taps below this hit the bar

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
    this.manualPage = -1;   // MANUAL screen page (-1 = closed)
  }

  reset() {
    this.index = 0;
    this.stageCursor = getUnlockedStage();
    this.manualPage = -1;   // MANUAL screen page (-1 = closed)
  }

  get manualOpen() {
    return this.manualPage >= 0;
  }

  openManual(game) {
    this.manualPage = 0;
    game.audio.play('select');
  }

  closeManual(game) {
    this.manualPage = -1;
    game.audio.play('select');
  }

  turnManualPage(dir, game) {
    const n = MANUAL_PAGES.length;
    this.manualPage = (this.manualPage + dir + n) % n;
    game.audio.play('select');
  }

  /** MANUAL screen: arrows turn the page, ENTER / P / ESC go back. */
  updateManual(game) {
    const input = game.input;
    if (input.enter || input.pause || input.isJustPressed('Escape')) {
      this.closeManual(game);
      return;
    }
    if (input.menuLeft || input.menuUp) this.turnManualPage(-1, game);
    if (input.menuRight || input.menuDown) this.turnManualPage(1, game);
  }

  get selected() {
    return TITLE_MENU_ITEMS[this.index];
  }

  update(game) {
    if (this.manualOpen) {
      this.updateManual(game);
      return;
    }
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
        // Locked ("???") until NORMAL END.
        if (!isBossRushUnlocked()) break;
        game.audio.play('select');
        game.startBossRush();
        break;
      case 'manual':
        this.openManual(game);
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
      { item: 'bossRush', label: bossRush ? 'BOSS RUSH' : '???', value: bossRush ? 'BEST ' + formatRushTime(loadBossRushBestTime()) : '', enabled: bossRush },
      { item: 'manual', label: 'MANUAL', value: '', enabled: true },
      { item: 'sound', label: 'SOUND', value: arrows('sound', game.audio.muted ? 'OFF' : 'ON'), enabled: true },
      { item: 'testRange', label: 'TEST RANGE', value: 'DEBUG', enabled: true },
    ].filter(row => TITLE_MENU_ITEMS.includes(row.item));
  }

  draw(ctx, game) {
    if (this.manualOpen) {
      this.drawManual(ctx, game);
      return;
    }
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
    ctx.fillText('BEST SCORE: ' + String(game.bestScore).padStart(8, '0'), cx, 362);
    ctx.fillText('BEST CLEAR: ' + String(game.bestClearScore).padStart(8, '0'), cx, 372);

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

  /** MANUAL screen: header, the page, and the navigation bar. */
  drawManual(ctx, game) {
    const page = MANUAL_PAGES[this.manualPage];
    const cx = CANVAS_WIDTH / 2;
    if (!this.manualIcons) {
      this.manualIcons = new Map();
      for (const p of MANUAL_PAGES.filter(pg => !pg.screen)) {
        for (const e of p.entries) this.manualIcons.set(e.type, new Powerup(0, 0, e.type));
      }
    }

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px ' + MANUAL_FONT;
    drawShadowedText(ctx, page.heading, cx, 36, COLORS.UI_WHITE, COLORS.PLAYER_BULLET_GLOW);
    ctx.font = 'bold 10px ' + MANUAL_FONT;
    ctx.fillStyle = COLORS.TITLE_SUBTITLE;
    ctx.fillText(page.title + '   ' + (this.manualPage + 1) + '/' + MANUAL_PAGES.length, cx, 52);
    ctx.strokeStyle = COLORS.TITLE_SUBTITLE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(24, 59);
    ctx.lineTo(CANVAS_WIDTH - 24, 59);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (page.screen) {
      this.drawScreenEntries(ctx, game, page);
    } else {
      this.drawItemEntries(ctx, game, page);
    }
    this.drawManualNav(ctx);
    ctx.restore();
  }

  /** Items pages: icon, name, effect lines, then the rules box. */
  drawItemEntries(ctx, game, page) {
    let top = MANUAL_TOP;
    for (const e of page.entries) {
      const icon = this.manualIcons.get(e.type);
      icon.x = 32;
      icon.y = top + 10;
      icon.frame = game.globalFrame;
      icon.draw(ctx);
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = e.type === ITEM_NOVA_CRYSTAL
        ? COLORS.CRYSTAL_HUES[Math.floor(game.globalFrame / 6) % COLORS.CRYSTAL_HUES.length]
        : icon.def.color;
      ctx.fillText(e.name, 56, top + 6);
      const nameW = ctx.measureText(e.name).width;
      ctx.font = 'bold 9px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.fillText(e.sub, 62 + nameW, top + 6);
      ctx.font = '9px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_WHITE;
      e.lines.forEach((line, i) => ctx.fillText(line, 56, top + 19 + i * 12));
      top += page.entryStep;
    }

    // Rules box (weapons page)
    if (page.notes) {
      top += 6;
      ctx.fillStyle = 'rgba(136, 187, 255, 0.08)';
      ctx.fillRect(20, top - 12, CANVAS_WIDTH - 40, 22 + page.notes.length * 12);
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText(page.notesTitle, 28, top + 2);
      ctx.font = '9px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_WHITE;
      page.notes.forEach((line, i) => ctx.fillText(line, 28, top + 16 + i * 12));
    }

  }

  /** Navigation bar (also the touch targets). */
  drawManualNav(ctx) {
    const cx = CANVAS_WIDTH / 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px ' + MANUAL_FONT;
    ctx.fillStyle = 'rgba(136, 187, 255, 0.12)';
    ctx.fillRect(20, MANUAL_NAV_Y - 13, CANVAS_WIDTH - 40, 19);
    ctx.fillStyle = COLORS.UI_BLUE;
    ctx.fillText('< まえ', CANVAS_WIDTH / 6, MANUAL_NAV_Y);
    ctx.fillText('つぎ >', CANVAS_WIDTH * 5 / 6, MANUAL_NAV_Y);
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText('もどる', cx, MANUAL_NAV_Y);
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px ' + MANUAL_FONT;
    ctx.fillText('←→: ページ   ENTER / P / Esc: もどる', cx, 472);
  }

  /**
   * Screen pages: each entry shows its HUD part as in play, then the
   * explanation. A narrow sample sits left of the name, a wide one
   * under it.
   */
  drawScreenEntries(ctx, game, page) {
    const left = 24;
    let top = MANUAL_TOP - 4;
    for (const e of page.entries) {
      const s = e.sample;
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_YELLOW;
      const w = s ? s.sw * (s.zoom || 1) : 0;
      const h = s ? s.sh * (s.zoom || 1) : 0;
      let textTop;
      if (!s) {
        ctx.fillText(e.name, left, top + 9);
        textTop = top + 14;
      } else if (w <= 130) {
        this.drawHudSample(ctx, game, s, left, top);
        ctx.fillText(e.name, left + w + 10, top + h / 2 + 4);
        textTop = top + h + 4;
      } else {
        ctx.fillText(e.name, left, top + 9);
        this.drawHudSample(ctx, game, s, left, top + 14);
        textTop = top + 14 + h + 4;
      }
      ctx.textAlign = 'left';
      ctx.font = '9px ' + MANUAL_FONT;
      ctx.fillStyle = COLORS.UI_WHITE;
      e.lines.forEach((line, i) => ctx.fillText(line, left, textTop + 10 + i * 12));
      top = textTop + e.lines.length * 12 + 10;
    }
  }

  /** One HUD part, drawn by the real HUD code on sample values, in a framed box (zoom: optional scale). */
  drawHudSample(ctx, game, s, dx, dy) {
    const k = s.zoom || 1;
    const w = s.sw * k;
    const h = s.sh * k;
    ctx.save();
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(dx, dy, w, h);
    ctx.beginPath();
    ctx.rect(dx, dy, w, h);
    ctx.clip();
    ctx.translate(dx, dy);
    ctx.scale(k, k);
    ctx.translate(-s.sx, -s.sy);
    const hud = game.hud;
    const frame = game.globalFrame;
    switch (s.part) {
      case 'topBar':
        hud.drawTopBar(ctx, {
          player: { maxLives: 4, lives: 3 }, score: 12345, bossRush: null,
          stage: { stageNumber: 3 }, runFromNewGame: true, crystalStages: { size: 2 },
        });
        break;
      case 'combo':
        hud.drawCombo(ctx, { combo: { count: 27, multiplier: comboMultiplierFor(27), timeRatio: 1 - (frame % 120) / 120, popupTimer: 0 } });
        break;
      case 'bossBar':
        hud.drawBossBar(ctx, {
          name: 'ボスの名前', hpPercent: 0.55, isEnraged: Math.floor(frame / 90) % 2 === 1,
          midboss: true, escapeAfter: 1, state: 'active', escapeSecondsLeft: 12,
          phases: [0, 0], phaseName: 'FORM 2', subLabel: null, countdownSeconds: null, frame,
        });
        break;
      case 'weapon':
        hud.drawWeaponPanel(ctx, {
          player: { weaponDef: WEAPONS[WEAPON_SPREAD], hasLevel: true, weaponLevel: 2, options: [0], reflectActive: true, reflectSecondsLeft: 12 },
        });
        break;
      case 'gauge':
        hud.drawGauge(ctx, { player: { gauge: 64, burstReady: false }, globalFrame: frame });
        break;
      case 'pause':
        hud.drawPauseButton(ctx);
        break;
      case 'burst':
        hud.drawBurstButton(ctx, { player: { burstReady: true, gauge: GAUGE_MAX }, touch: { buttonFlash: 0 }, globalFrame: frame });
        break;
      case 'ship': {
        if (!this.manualShip) this.manualShip = new Player();
        const p = this.manualShip;
        p.x = s.sw / 2;
        p.y = s.sh / 2 + 2;
        p.draw(ctx);
        Game.prototype.drawHitboxDot.call({ player: p }, ctx);
        break;
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(136, 187, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx - 0.5, dy - 0.5, w + 1, h + 1);
  }
}

// ============================================================
// PAUSE OVERLAY
// ============================================================
const PAUSE_MENU_LABELS = { resume: 'RESUME', retry: 'RETRY STAGE', title: 'TITLE' };

/** PAUSED with RESUME / RETRY STAGE / TITLE (keys: UP/DOWN + ENTER, P resumes; taps: touch.js). */
function drawPauseScreen(ctx, game) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  ctx.font = 'bold 11px monospace';
  PAUSE_MENU_ITEMS.forEach((item, i) => {
    const y = PAUSE_MENU_Y + i * PAUSE_MENU_ROW_H;
    const selected = i === game.pauseIndex;
    if (selected) {
      ctx.fillStyle = 'rgba(80, 140, 220, 0.25)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 70, y - 12, 140, 17);
    }
    ctx.fillStyle = selected ? COLORS.UI_YELLOW : COLORS.UI_BLUE;
    ctx.fillText((selected ? '> ' : '') + PAUSE_MENU_LABELS[item] + (selected ? ' <' : ''), CANVAS_WIDTH / 2, y);
  });

  ctx.fillStyle = COLORS.UI_DIM;
  ctx.font = '8px monospace';
  ctx.fillText('UP/DOWN + ENTER   P: RESUME   TAP: SELECT / OK', CANVAS_WIDTH / 2, PAUSE_MENU_Y + PAUSE_MENU_ITEMS.length * PAUSE_MENU_ROW_H + 10);

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
    ['CRYSTAL', r.crystals + '/' + MAX_STAGE, ''],
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
    let next = 'PRESS ENTER TO TITLE';
    if (game.stageManager.hasNextImplemented()) next = 'PRESS ENTER - NEXT STAGE';
    else if (r.stageNumber === MAX_STAGE) next = 'PRESS ENTER';     // -> NORMAL END
    ctx.fillText(next, cx, 390);
  }
  ctx.restore();
}

// ============================================================
// ENDINGS (DESIGN.md 13)
//   NORMAL END: the screen warms to white-gold; LYRA's last lines,
//     then the total score and BEST CLEAR. ENTER -> title.
//   BAD END: SUPERNOVA whites the screen out, then BAD END over a
//     dark red; a game over (score saved, CONTINUE from the title).
// Text never moves; it only fades.
// ============================================================
function drawEndingScreen(ctx, game) {
  const e = game.ending;
  if (!e) return;
  if (e.kind === 'bad') drawBadEnd(ctx, game, e.timer);
  else drawNormalEnd(ctx, game, e.timer, e.kind === 'true');
}

/** NORMAL END, and TRUE END (the same screen, brighter, its own title). */
function drawNormalEnd(ctx, game, t, isTrue) {
  const cx = CANVAS_WIDTH / 2;
  ctx.save();
  ctx.fillStyle = COLORS.ENDING_WHITE;
  ctx.globalAlpha = Math.min(t / 90, 1) * (isTrue ? 0.55 : 0.35);
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = Math.min(t / 60, 1) * 0.7;
  ctx.fillStyle = 'rgb(10, 8, 4)';
  ctx.fillRect(0, 70, CANVAS_WIDTH, CANVAS_HEIGHT - 140);
  ctx.globalAlpha = Math.min(t / 60, 1);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  drawShadowedText(ctx, isTrue ? 'HELIOS REBORN' : 'HELIOS RESTORED', cx, 118, COLORS.ENDING_GOLD, COLORS.TEXT_SHADOW_GOLD);
  ctx.font = '9px monospace';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.fillText(isTrue ? 'TRUE END' : 'NORMAL END', cx, 136);
  if (isTrue) {
    // The six crystals, in a row, shining
    for (let i = 0; i < MAX_STAGE; i++) {
      drawDiamond(ctx, cx + (i - 2.5) * 16, 152, 4, 6, COLORS.CRYSTAL_HUES[(i + Math.floor(t / 8)) % COLORS.CRYSTAL_HUES.length]);
    }
  }
  ctx.restore();

  if (game.comm.active) {
    game.comm.draw(ctx, CANVAS_HEIGHT / 2 - 40, game.globalFrame);
    return;
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_DIM;
  ctx.fillText('TOTAL SCORE', cx, 200);
  ctx.font = 'bold 20px monospace';
  drawShadowedText(ctx, String(Math.floor(game.score)).padStart(8, '0'), cx, 224, COLORS.UI_YELLOW, COLORS.BG_DARK);
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.fillText('BEST CLEAR: ' + String(game.bestClearScore).padStart(8, '0'), cx, 250);
  if (game.newBestClear) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText('NEW BEST CLEAR!', cx, 268);
  }
  ctx.font = '9px monospace';
  ctx.fillStyle = COLORS.UI_DIM;
  ctx.fillText('NOVA CRYSTAL  ' + game.crystalStages.size + ' / ' + MAX_STAGE, cx, 292);
  if (t > ENDING_INPUT_DELAY && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.font = '10px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText('PRESS ENTER TO TITLE', cx, 340);
  }
  ctx.restore();
}

function drawBadEnd(ctx, game, t) {
  const cx = CANVAS_WIDTH / 2;
  ctx.save();
  ctx.textAlign = 'center';
  if (t < BAD_END_FLASH_FRAMES) {
    // The star blows: everything whites out, SUPERNOVA fades in
    const k = t / BAD_END_FLASH_FRAMES;
    ctx.fillStyle = COLORS.ENDING_WHITE;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = Math.min(1, Math.max(0, k * 2 - 0.4));
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = COLORS.SUPERNOVA_RED;
    ctx.fillText('SUPERNOVA', cx, CANVAS_HEIGHT / 2);
    ctx.restore();
    return;
  }
  const k = Math.min(1, (t - BAD_END_FLASH_FRAMES) / 60);
  ctx.fillStyle = COLORS.ENDING_WHITE;
  ctx.globalAlpha = 1 - k;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = 'rgb(30, 4, 2)';
  ctx.globalAlpha = k;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = 1;
  ctx.font = 'bold 28px monospace';
  drawShadowedText(ctx, 'BAD END', cx, CANVAS_HEIGHT / 2 - 50, COLORS.UI_RED, COLORS.BG_DARK);
  ctx.font = '9px monospace';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.fillText('HELIOS WENT SUPERNOVA.', cx, CANVAS_HEIGHT / 2 - 26);
  ctx.font = '12px monospace';
  ctx.fillStyle = COLORS.UI_YELLOW;
  ctx.fillText('SCORE: ' + String(Math.floor(game.score)).padStart(8, '0'), cx, CANVAS_HEIGHT / 2 + 4);
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.fillText('BEST : ' + String(game.bestScore).padStart(8, '0'), cx, CANVAS_HEIGHT / 2 + 22);
  if (game.newBestScore) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText('NEW BEST!', cx, CANVAS_HEIGHT / 2 + 40);
  }
  if (t > BAD_END_FLASH_FRAMES + ENDING_INPUT_DELAY / 2 && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.font = '10px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText('PRESS ENTER TO TITLE', cx, CANVAS_HEIGHT / 2 + 66);
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.font = '8px monospace';
    ctx.fillText('CONTINUE FROM TITLE', cx, CANVAS_HEIGHT / 2 + 82);
  }
  ctx.restore();
}

// ============================================================
// BOSS RUSH RESULT: the clear time (shorter is better) and the best.
// ============================================================
function drawBossRushResult(ctx, game) {
  const r = game.rushResult;
  if (!r) return;
  const t = game.stateTimer;
  const cx = CANVAS_WIDTH / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 20, ' + Math.min(t / 30, 1) * 0.75 + ')';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  drawShadowedText(ctx, 'BOSS RUSH CLEAR', cx, 140, COLORS.UI_GREEN, COLORS.BG_DARK);
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_DIM;
  ctx.fillText('CLEAR TIME', cx, 190);
  ctx.font = 'bold 22px monospace';
  drawShadowedText(ctx, formatRushTime(r.seconds), cx, 216, COLORS.UI_YELLOW, COLORS.BG_DARK);
  ctx.font = '10px monospace';
  ctx.fillStyle = COLORS.UI_WHITE;
  ctx.fillText('BEST  ' + formatRushTime(r.best), cx, 242);
  if (r.newRecord) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText('NEW RECORD!', cx, 260);
  }
  ctx.font = '9px monospace';
  ctx.fillStyle = COLORS.UI_DIM;
  ctx.fillText('SCORE  ' + String(Math.floor(r.score)).padStart(8, '0'), cx, 284);
  if (t > RESULT_INPUT_DELAY && Math.floor(game.globalFrame / 30) % 2 === 0) {
    ctx.font = '10px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText('PRESS ENTER TO TITLE', cx, 330);
  }
  ctx.restore();
}
