// ============================================================
// SECTOR NOVA 2 - HUD
// ------------------------------------------------------------
// In-play overlay, drawn inside the canvas (no DOM HUD).
// Layout follows DESIGN.md 15-4:
//   top-left    : lives            top-center : score
//   top-right   : stage            top (boss) : boss name + HP bar
//   bottom-left : weapon panel
// Phase 2 adds combo, NOVA gauge, crystals and options; Phase 4
// adds the LYRA comm window and the full WARNING presentation.
// ============================================================

const HUD_BAR_HEIGHT = 16;

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
    this.drawWeaponPanel(ctx, game);
    if (DEBUG_MODE) this.drawDebugInfo(ctx, game);
    ctx.restore();

    if (game.warningTimer > 0) this.drawWarning(ctx, game);
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
    const digits = String(game.score).padStart(8, '0');
    const labelW = ctx.measureText(label).width;
    const startX = CANVAS_WIDTH / 2 - (labelW + ctx.measureText(digits).width) / 2;
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText(label, startX, 12);
    ctx.fillStyle = COLORS.UI_YELLOW;
    ctx.fillText(digits, startX + labelW, 12);

    // Stage (top-right)
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillText('STAGE ' + game.stage.stageNumber, CANVAS_WIDTH - 4, 12);
  }

  drawStageLabel(ctx, game) {
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(game.stage.stageName, CANVAS_WIDTH / 2, 28);
  }

  drawBossBar(ctx, boss) {
    ctx.font = '10px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, CANVAS_WIDTH / 2, 28);

    const barX = 40;
    const barY = 32;
    const barW = CANVAS_WIDTH - 80;
    const barH = 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = boss.isEnraged ? COLORS.UI_RED : COLORS.UI_GREEN;
    ctx.fillRect(barX, barY, barW * boss.hpPercent, barH);
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Multi-form bosses show the current form under the bar.
    if (boss.phases.length > 1) {
      ctx.font = '7px monospace';
      ctx.fillStyle = COLORS.UI_YELLOW;
      ctx.fillText(boss.phaseName, CANVAS_WIDTH / 2, barY + barH + 9);
    }
  }

  /**
   * Bottom-left weapon / shield panel (SECTOR NOVA 1 timed weapons;
   * becomes weapon name + Lv dots and options in Phase 2).
   */
  drawWeaponPanel(ctx, game) {
    const player = game.player;
    const def = player.weaponDef;
    const x = 6;
    const y = CANVAS_HEIGHT - 34;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    let weaponName = def.name;
    if (player.weaponType === WEAPON_TRIPLE) weaponName = 'TRIPLE';
    if (player.weaponType === WEAPON_PIERCE) weaponName = 'LASER';
    if (player.weaponType === WEAPON_FLAME) weaponName = 'FLAME';

    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('WPN:', x, y);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = def.color;
    ctx.fillText(weaponName, x + 25, y);

    if (player.weaponType !== WEAPON_NORMAL && player.weaponTimer > 0) {
      ctx.font = '8px monospace';
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText(player.weaponSecondsLeft + 's', x + 70, y);

      // Remaining-time bar, flashing when almost out.
      const barW = 90;
      const pct = player.weaponTimer / WEAPON_DURATION;
      ctx.fillStyle = '#222';
      ctx.fillRect(x, y + 4, barW, 4);
      const low = player.weaponTimer < 180;
      ctx.fillStyle = (low && Math.floor(game.globalFrame / 6) % 2 === 0)
        ? COLORS.UI_RED : def.color;
      ctx.fillRect(x, y + 4, barW * pct, 4);
    }

    const shieldY = y + 18;
    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_DIM;
    ctx.fillText('SHD:', x, shieldY);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = player.shieldActive ? COLORS.ITEM_SHIELD : COLORS.UI_DIM;
    ctx.fillText(player.shieldActive ? 'ON' : 'OFF', x + 25, shieldY);
    if (player.shieldActive && player.shieldTimer > 0) {
      ctx.font = '8px monospace';
      ctx.fillStyle = COLORS.UI_WHITE;
      ctx.fillText(player.shieldSecondsLeft + 's', x + 48, shieldY);
    }
  }

  /** DEBUG_MODE: timeline clock and object counts (bottom-right). */
  drawDebugInfo(ctx, game) {
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.UI_DIM;
    const t = game.timeline ? game.timeline.seconds.toFixed(1).padStart(5, '0') : '--';
    ctx.fillText('TL ' + t + 's' + (game.timeline && game.timeline.paused ? ' P' : ''),
      CANVAS_WIDTH - 4, CANVAS_HEIGHT - 14);
    ctx.fillText('E' + game.enemies.length + ' B' + game.enemyBullets.length,
      CANVAS_WIDTH - 4, CANVAS_HEIGHT - 5);
  }

  /** Pre-boss WARNING (Phase 1 version; full presentation in Phase 4). */
  drawWarning(ctx, game) {
    ctx.save();
    const flash = Math.floor(game.warningTimer / 10) % 2 === 0;
    if (flash) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = flash ? COLORS.UI_RED : COLORS.UI_YELLOW;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('WARNING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '10px monospace';
    ctx.fillText(game.warningBossName + ' APPROACHING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
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
