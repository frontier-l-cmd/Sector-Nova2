// ============================================================
// SECTOR NOVA 2 - Touch Controls (provisional, for phone testing)
// ------------------------------------------------------------
// Test-only touch controls (DESIGN.md 2: full phone support is out
// of scope). Drives the same logical actions as the keyboard
// through InputHandler.
//
//   Title       : tap a row to select it, tap it again to decide
//                 (DIFFICULTY / SOUND rows change on each tap)
//   Play        : drag anywhere to move (relative), auto-fire while
//                 touching; BURST button bottom-right (usable only
//                 with a full gauge); two-finger tap = pause
//   Pause       : tap to resume
//   Other screens: tap = ENTER
// The BURST button is drawn by the HUD on touch devices.
// ============================================================

class TouchControls {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.dragId = null; // identifier of the finger that moves the ship
    this.last = null;   // its last position in canvas pixels
    this.dx = 0;        // accumulated drag since the last frame
    this.dy = 0;
    this.buttonFlash = 0; // frames of "pressed" feedback on the BURST button
    // Show on-screen buttons only where touch input exists.
    this.available = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;

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

  isOnBurstButton(p) {
    return dist(p.x, p.y, TOUCH_BURST_X, TOUCH_BURST_Y) <= TOUCH_BURST_RADIUS + TOUCH_BURST_HIT_MARGIN;
  }

  onStart(e) {
    e.preventDefault();
    this.available = true;
    this.game.audio.unlock();
    const input = this.game.input;
    const state = this.game.state;

    if (state === STATE.TITLE) {
      this.tapTitle(this.toCanvas(e.changedTouches[0]));
    } else if (state === STATE.PLAYING) {
      for (const t of e.changedTouches) {
        const p = this.toCanvas(t);
        if (this.isOnBurstButton(p)) {
          // Press only does something with a full gauge.
          if (this.game.player.burstReady) {
            input.tapAction('burst');
            this.buttonFlash = 8;
          }
        } else if (this.dragId === null) {
          this.dragId = t.identifier;
          this.last = p;
          input.setVirtual('shoot', true);
        } else {
          // A second finger on the playfield (not the BURST button) = pause.
          input.tapAction('pause');
          this.release();
          return;
        }
      }
    } else if (state === STATE.PAUSED) {
      input.tapAction('pause');
    } else {
      input.tapAction('enter');
    }
  }

  findDragTouch(list) {
    for (const t of list) if (t.identifier === this.dragId) return t;
    return null;
  }

  onMove(e) {
    e.preventDefault();
    if (this.dragId === null) return;
    const t = this.findDragTouch(e.touches);
    if (!t) return;
    const p = this.toCanvas(t);
    this.dx += p.x - this.last.x;
    this.dy += p.y - this.last.y;
    this.last = p;
  }

  onEnd(e) {
    e.preventDefault();
    if (this.dragId !== null && this.findDragTouch(e.changedTouches)) this.release();
  }

  release() {
    this.dragId = null;
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
    if (this.buttonFlash > 0) this.buttonFlash--;
    if (this.dx || this.dy) {
      player.x = clamp(player.x + this.dx * TOUCH_DRAG_SCALE, 12, CANVAS_WIDTH - 12);
      player.y = clamp(player.y + this.dy * TOUCH_DRAG_SCALE, 12, CANVAS_HEIGHT - 12);
    }
    this.dx = 0;
    this.dy = 0;
  }
}
