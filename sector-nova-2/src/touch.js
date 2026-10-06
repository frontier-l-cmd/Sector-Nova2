// ============================================================
// SECTOR NOVA 2 - Touch Controls (provisional, for phone testing)
// ------------------------------------------------------------
// Not part of DESIGN.md (touch is out of scope for this version);
// added so builds can be tried on a phone. Drives the same logical
// actions as the keyboard through InputHandler.
//
//   Title       : tap a row to select it, tap it again to decide
//                 (DIFFICULTY / SOUND rows change on each tap)
//   Play        : drag anywhere to move (relative), auto-fire while
//                 touching; two-finger tap = pause
//   Pause       : tap to resume
//   Other screens: tap = ENTER
// ============================================================

class TouchControls {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.last = null;   // last touch position in canvas pixels
    this.dx = 0;        // accumulated drag since the last frame
    this.dy = 0;
    this.active = false;

    const opts = { passive: false };
    canvas.addEventListener('touchstart', e => this.onStart(e), opts);
    canvas.addEventListener('touchmove', e => this.onMove(e), opts);
    canvas.addEventListener('touchend', e => this.onEnd(e), opts);
    canvas.addEventListener('touchcancel', e => this.onEnd(e), opts);
  }

  toCanvas(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
      y: (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
    };
  }

  onStart(e) {
    e.preventDefault();
    this.game.audio.unlock();
    const input = this.game.input;
    const state = this.game.state;
    const p = this.toCanvas(e.changedTouches[0]);

    if (state === STATE.TITLE) {
      this.tapTitle(p);
    } else if (state === STATE.PLAYING) {
      if (e.touches.length >= 2) {
        input.tapAction('pause');
        this.release();
        return;
      }
      this.last = p;
      this.active = true;
      input.setVirtual('shoot', true);
    } else if (state === STATE.PAUSED) {
      input.tapAction('pause');
    } else {
      input.tapAction('enter');
    }
  }

  onMove(e) {
    e.preventDefault();
    if (!this.active || !this.last) return;
    const p = this.toCanvas(e.touches[0]);
    this.dx += p.x - this.last.x;
    this.dy += p.y - this.last.y;
    this.last = p;
  }

  onEnd(e) {
    e.preventDefault();
    if (e.touches.length === 0) this.release();
    else this.last = this.toCanvas(e.touches[0]);
  }

  release() {
    this.active = false;
    this.last = null;
    this.game.input.setVirtual('shoot', false);
  }

  tapTitle(p) {
    const menu = this.game.titleMenu;
    const i = Math.floor((p.y - (TITLE_MENU_Y - 11)) / TITLE_MENU_ROW_H);
    if (i < 0 || i >= TITLE_MENU_ITEMS.length) return;
    if (i === menu.index) {
      this.game.input.tapAction('enter');
    } else {
      menu.index = i;
      this.game.audio.play('select');
    }
  }

  /** Move the ship by the drag since the last frame (called in play). */
  applyDrag(player) {
    if (this.dx || this.dy) {
      player.x = clamp(player.x + this.dx * TOUCH_DRAG_SCALE, 12, CANVAS_WIDTH - 12);
      player.y = clamp(player.y + this.dy * TOUCH_DRAG_SCALE, 12, CANVAS_HEIGHT - 12);
    }
    this.dx = 0;
    this.dy = 0;
  }
}
