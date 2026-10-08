// ============================================================
// SECTOR NOVA 2 - HUD
// ------------------------------------------------------------
// In-play overlay, drawn inside the canvas (no DOM HUD).
// Layout follows DESIGN.md 15-4:
//   top-left     : lives
//   top-center   : score
//   top-right    : NOVA CRYSTAL count + stage, combo and multiplier
//                  with the remaining-time bar, "x4!" popup
//   top (boss)   : boss name + HP bar (left of the combo column)
//   bottom-left  : weapon name + Lv dots, options, REFLECT timer
//   bottom-right : NOVA gauge, "BURST READY" blinking when full;
//                  on touch devices the test BURST button sits above it
//   bottom       : LYRA's comm window while a message is shown
// Plus the WARNING presentation and boss form-change banners.
// ============================================================

const HUD_BAR_HEIGHT = 16;
const HUD_RIGHT = CANVAS_WIDTH - 4;
const HUD_COMBO_BAR_W = 60;
const HUD_GAUGE_W = 70;

class HUD {
  /** Everything drawn above the playfield during play. */
  draw(ctx, game) {
    ctx.save();
    this.drawTopBar(ctx, game);
    if (game.boss && game.boss.showHpBar) {
      this.drawBossBar(ctx, game.boss);
    } else if (!game.boss) {
      this.drawStageLabel(ctx, game);
    }
    this.drawCombo(ctx, game);
    if (game.stage.test) this.drawEnemyNames(ctx, game);
    this.drawWeaponPanel(ctx, game);
    this.drawGauge(ctx, game);
    if (game.touch.available) this.drawBurstButton(ctx, game);
    if (DEBUG_MODE) this.drawDebugInfo(ctx, game);
    ctx.restore();

    game.comm.draw(ctx, CANVAS_HEIGHT - 84, game.globalFrame);
    if (game.warningTimer > 0) this.drawWarning(ctx, game);
    if (game.passage && game.passage.cautionActive) {
      this.drawCaution(ctx, PASSAGE_CAUTION_FRAMES - game.passage.caution, 'NARROW PASSAGE');
    }
    if (game.maze && game.maze.cautionActive) {
      this.drawCaution(ctx, FLESH_CAUTION_FRAMES - game.maze.caution, 'FLESH WALLS');
    }
    if (game.boss && game.boss.banner) this.drawBanner(ctx, game.boss.banner, game.globalFrame);
  }

  drawTopBar(ctx, game) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_BAR_HEIGHT);

    // Lives (top-left): filled = remaining, outlined = lost
    const player = game.player;
    for (let i = 0; i < player.maxLives; i++) {
      const x = 6 + i * 10;
      if (i < player.lives) {
        ctx.fillStyle = COLORS.UI_RED;
        ctx.fillRect(x, 4, 7, 7);
        ctx.fillStyle = COLORS.UI_YELLOW;
        ctx.fillRect(x + 1, 5, 5, 5);
      } else {
        ctx.fillStyle = '#332233';
        ctx.fillRect(x, 4, 7, 7);
        ctx.strokeStyle = COLORS.UI_DIM;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 4, 7, 7);
      }
    }

    // Score (top-center)
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const label = 'SCORE ';
    const digits = String(Math.floor(game.score)).padStart(8, '0');
    const labelW = ctx.measureText(label).width;
    const startX = CANVAS_WIDTH / 2 - (labelW + ctx.measureText(digits).width) / 2;
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText(label, startX, 12);
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText(digits, startX + labelW, 12);

    // Stage (top-right) and NOVA CRYSTAL count to its left.
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.UI_WHITE;
    const stageText = 'ST' + game.stage.stageNumber;
    ctx.fillText(stageText, HUD_RIGHT, 12);
    const crystalX = HUD_RIGHT - ctx.measureText(stageText).width - 8;
    // Crystals from CONTINUE / STAGE SELECT runs are shown in gray
    // (they do not count toward the TRUE END).
    const crystalColor = game.runFromNewGame ? COLORS.CRYSTAL_HUES[4] : COLORS.UI_DIM;
    ctx.fillStyle = crystalColor;
    ctx.fillText(String(game.crystalStages.size), crystalX, 12);
    drawDiamond(ctx, crystalX - ctx.measureText('0').width - 6, 8, 3, 5, crystalColor);
  }

  drawStageLabel(ctx, game) {
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(game.stage.stageName, CANVAS_WIDTH / 2, 28);
  }

  drawBossBar(ctx, boss) {
    const barX = 8;
    const barY = 30;
    const barW = CANVAS_WIDTH - HUD_COMBO_BAR_W - 28;
    const barH = 5;

    ctx.font = '9px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.textAlign = 'left';
    ctx.fillText(boss.name, barX, 27);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = boss.isEnraged ? COLORS.UI_RED : COLORS.UI_GREEN;
    ctx.fillRect(barX, barY, barW * boss.hpPercent, barH);
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Mid-bosses flee when time runs out: show the seconds left.
    if (boss.midboss && boss.state === 'active') {
      ctx.textAlign = 'right';
      ctx.font = '7px monospace';
      ctx.fillStyle = boss.escapeSecondsLeft <= 5 ? COLORS.UI_RED : COLORS.UI_DIM;
      ctx.fillText('ESCAPE ' + boss.escapeSecondsLeft, barX + barW, 27);
      ctx.textAlign = 'left';
    }

    // Multi-form bosses show the current form under the bar.
    if (boss.phases.length > 1) {
      ctx.font = '7px monospace';
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText(boss.phaseName, barX, barY + barH + 9);
    }
  }

  /** TEST RANGE: each enemy's type name under it. */
  drawEnemyNames(ctx, game) {
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.UI_YELLOW;
    for (const e of game.enemies) {
      if (e.y > -10) ctx.fillText(e.type.replace(/_/g, ' '), e.x, e.y + e.radius + 9);
    }
  }

  /** Top-right: "COMBO 23 x2", remaining-time bar, multiplier popup. */
  drawCombo(ctx, game) {
    const combo = game.combo;
    if (combo.count > 0) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 8px monospace';
      const mul = combo.multiplier;
      ctx.fillStyle = mul >= 8 ? COLORS.UI_RED : mul >= 4 ? COLORS.ITEM_SPREAD
        : mul >= 2 ? COLORS.UI_YELLOW : COLORS.UI_WHITE;
      ctx.fillText('COMBO ' + combo.count + ' ×' + mul, HUD_RIGHT, 26);

      const x = HUD_RIGHT - HUD_COMBO_BAR_W;
      ctx.fillStyle = '#222';
      ctx.fillRect(x, 29, HUD_COMBO_BAR_W, 2);
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillRect(x, 29, HUD_COMBO_BAR_W * combo.timeRatio, 2);
    }

    if (combo.popupTimer > 0) {
      const t = 1 - combo.popupTimer / COMBO_POPUP_FRAMES;
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px monospace';
      ctx.globalAlpha = 1 - t * 0.8;
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText(combo.popupText, HUD_RIGHT, 44 - t * 6);
      ctx.globalAlpha = 1;
    }
  }

  /** Bottom-left: weapon + Lv dots, options, REFLECT SHIELD timer. */
  drawWeaponPanel(ctx, game) {
    const player = game.player;
    const def = player.weaponDef;
    const x = 6;
    let y = CANVAS_HEIGHT - 28;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = def.color;
    ctx.fillText(def.name, x, y);

    // Lv dots (filled = current level); NORMAL has no level.
    if (player.hasLevel) {
      const dotsX = x + ctx.measureText(def.name).width + 6;
      for (let i = 0; i < WEAPON_MAX_LEVEL; i++) {
        ctx.beginPath();
        ctx.arc(dotsX + i * 8, y - 3, 2.5, 0, Math.PI * 2);
        if (i < player.weaponLevel) {
          ctx.fillStyle = def.color;
          ctx.fill();
        } else {
          ctx.strokeStyle = COLORS.UI_DIM;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Options
    y += 11;
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('OPT', x, y);
    for (let i = 0; i < OPTION_MAX; i++) {
      ctx.beginPath();
      ctx.arc(x + 24 + i * 9, y - 3, 3, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = i < player.options.length ? COLORS.ITEM_OPTION : COLORS.MENU_DISABLED;
      ctx.stroke();
    }

    // REFLECT SHIELD time left
    if (player.reflectActive) {
      ctx.fillStyle = COLORS.ITEM_REFLECT;
      ctx.fillText('REFLECT ' + player.reflectSecondsLeft + 's', x + 48, y);
    }
  }

  /** Bottom-right: NOVA gauge; "BURST READY" blinks when full. */
  drawGauge(ctx, game) {
    const player = game.player;
    const x = HUD_RIGHT - HUD_GAUGE_W;
    const y = CANVAS_HEIGHT - 12;
    const ratio = player.gauge / GAUGE_MAX;

    ctx.textAlign = 'right';
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('NOVA', x - 4, y + 5);

    ctx.fillStyle = COLORS.GAUGE_BG;
    ctx.fillRect(x, y, HUD_GAUGE_W, 6);
    const full = player.burstReady;
    const blink = Math.floor(game.globalFrame / 10) % 2 === 0;
    ctx.fillStyle = full && blink ? COLORS.GAUGE_FULL : COLORS.GAUGE_FILL;
    ctx.fillRect(x, y, HUD_GAUGE_W * ratio, 6);
    ctx.strokeStyle = COLORS.UI_DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, HUD_GAUGE_W, 6);

    if (full) {
      if (blink) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = COLORS.GAUGE_FULL;
        ctx.fillText('BURST READY [X]', HUD_RIGHT, y - 4);
      }
    } else {
      ctx.font = '7px monospace';
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.fillText(Math.floor(player.gauge) + '%', HUD_RIGHT, y - 3);
    }
  }

  /**
   * Touch BURST button (test touch controls). Gold and pulsing only
   * when the gauge is full; otherwise a dim ring that fills with the
   * gauge, so it reads as "not usable yet".
   */
  drawBurstButton(ctx, game) {
    const player = game.player;
    const x = TOUCH_BURST_X;
    const y = TOUCH_BURST_Y;
    const r = TOUCH_BURST_RADIUS;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8px monospace';
    if (player.burstReady) {
      const pressed = game.touch.buttonFlash > 0;
      const pulse = 1 + Math.sin(game.globalFrame * 0.2) * 0.08;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = COLORS.BURST_GLOW;
      ctx.beginPath();
      ctx.arc(x, y, (r + 5) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = pressed ? 1 : 0.85;
      ctx.fillStyle = pressed ? COLORS.BURST_RING : COLORS.GAUGE_FILL;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.UI_WHITE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = COLORS.BG_DARK;
      ctx.fillText('BURST', x, y + 1);
    } else {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = COLORS.GAUGE_BG;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.UI_DIM;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Gauge progress around the rim
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = COLORS.GAUGE_FILL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (player.gauge / GAUGE_MAX));
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = COLORS.UI_DIM;
      ctx.fillText('BURST', x, y + 1);
    }
    ctx.restore();
  }

  /** DEBUG_MODE: timeline clock, object counts, invincibility flag. */
  drawDebugInfo(ctx, game) {
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.UI_DIM;
    // Sit above the touch BURST button when it is shown.
    const base = game.touch.available ? TOUCH_BURST_Y - TOUCH_BURST_RADIUS - 8 : CANVAS_HEIGHT - 30;
    const t = game.timeline ? game.timeline.seconds.toFixed(1).padStart(5, '0') : '--';
    ctx.fillText('TL ' + t + 's' + (game.timeline && game.timeline.paused ? ' P' : ''),
      HUD_RIGHT, base - 8);
    ctx.fillText('E' + game.enemies.length + ' B' + game.enemyBullets.length,
      HUD_RIGHT, base);
    if (game.debugInvincible) {
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText('INVINCIBLE', HUD_RIGHT, base - 16);
    }
  }

  /**
   * Pre-boss WARNING (DESIGN.md 14): red hazard bands with scrolling
   * stripes above and below a blinking "WARNING", then the boss name.
   * Text never moves; only the stripes inside the bands scroll.
   */
  drawWarning(ctx, game) {
    const t = WARNING_FRAMES - game.warningTimer;
    const cy = CANVAS_HEIGHT / 2;
    ctx.save();
    // Faint red tint pulse
    if (Math.floor(t / 15) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.07)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    const band = (y, dir) => {
      ctx.fillStyle = COLORS.WARNING_BAND;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(0, y, CANVAS_WIDTH, 16);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y + 3, CANVAS_WIDTH, 10);
      ctx.clip();
      ctx.fillStyle = COLORS.WARNING_STRIPE;
      ctx.globalAlpha = 0.9;
      const shift = (t * 1.5 * dir) % 24;
      for (let x = -24; x < CANVAS_WIDTH + 24; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + shift, y + 13);
        ctx.lineTo(x + shift + 8, y + 3);
        ctx.lineTo(x + shift + 16, y + 3);
        ctx.lineTo(x + shift + 8, y + 13);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    band(cy - 62, 1);
    band(cy + 34, -1);

    ctx.textAlign = 'center';
    ctx.font = 'bold 26px monospace';
    const on = Math.floor(t / 10) % 2 === 0;
    drawShadowedText(ctx, 'WARNING', CANVAS_WIDTH / 2, cy - 8,
      on ? COLORS.UI_RED : COLORS.UI_YELLOW, COLORS.BG_DARK);
    if (t >= 60) {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText(game.warningBossName, CANVAS_WIDTH / 2, cy + 16);
    }
    ctx.restore();
  }

  /**
   * "CAUTION" before a stage gimmick arrives (S2 NARROW PASSAGE, S4
   * FLESH WALLS): a yellow and black band across the upper screen,
   * blinking text that never moves. `t` = frames since it began.
   */
  drawCaution(ctx, t, subtitle) {
    const y = 118;
    ctx.save();
    ctx.fillStyle = COLORS.CAUTION_BAND;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, y, CANVAS_WIDTH, 34);
    ctx.globalAlpha = 1;
    // Hazard stripes along both edges of the band
    ctx.fillStyle = COLORS.CAUTION_STRIPE;
    for (const sy of [y, y + 30]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sy, CANVAS_WIDTH, 4);
      ctx.clip();
      for (let x = -8 + (t % 16); x < CANVAS_WIDTH + 8; x += 16) {
        fillPolygon(ctx, [[x, sy + 4], [x + 6, sy], [x + 12, sy], [x + 6, sy + 4]]);
      }
      ctx.restore();
    }
    ctx.textAlign = 'center';
    if (Math.floor(t / 12) % 2 === 0) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = COLORS.CAUTION_STRIPE;
      ctx.fillText('CAUTION', CANVAS_WIDTH / 2, y + 16);
    }
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText(subtitle, CANVAS_WIDTH / 2, y + 26);
    ctx.restore();
  }

  /** Boss form-change banner (form name during a transition). */
  drawBanner(ctx, banner, frame) {
    ctx.save();
    const y = CANVAS_HEIGHT / 2 - 40;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, y - 16, CANVAS_WIDTH, 26);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = Math.floor(frame / 8) % 2 === 0 ? COLORS.UI_YELLOW : COLORS.UI_WHITE;
    ctx.fillText(banner.text, CANVAS_WIDTH / 2, y + 2);
    ctx.restore();
  }
}

/** Small diamond icon (NOVA CRYSTAL). */
function drawDiamond(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x - w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
}
