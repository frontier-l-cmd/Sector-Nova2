// ============================================================
// SECTOR NOVA 2 - Story: LYRA comm lines and the comm window
// ------------------------------------------------------------
// LYRA (the mothership's navigator AI) speaks in short messages
// (DESIGN.md 4). A message is 1-2 lines; the window types it out one
// character at a time, holds it, then shows the next queued message.
// ENTER shows the whole message at once / skips to the next one.
// Play never stops for a message.
// Lines for S2-S6 are added with their stages (Phase 4-2 onward).
// ============================================================

const STORY = {
  opening: [
    ['HELIOS IS BEING DEVOURED.', 'NOVA-II, YOU ARE OUR LAST LIGHT.'],
  ],
  stage1: [
    ['ENTERING FROST RING.', 'THE ICE HIDES THEIR SCOUTS.'],
  ],
  boss: [
    ['MASSIVE SIGNAL DETECTED!'],
  ],
};

class CommWindow {
  constructor() {
    this.clear();
  }

  clear() {
    this.queue = [];
    this.message = null; // array of lines
    this.chars = 0;      // characters typed so far (fractional)
    this.hold = 0;
  }

  get active() {
    return !!this.message;
  }

  get totalChars() {
    return this.message ? this.message.reduce((n, line) => n + line.length, 0) : 0;
  }

  get fullyTyped() {
    return this.chars >= this.totalChars;
  }

  /** Queue a STORY entry by id (or a raw list of messages). */
  show(idOrMessages) {
    const messages = typeof idOrMessages === 'string' ? STORY[idOrMessages] : idOrMessages;
    if (!messages) return;
    this.queue.push(...messages);
    if (!this.message) this.next();
  }

  next() {
    this.message = this.queue.shift() || null;
    this.chars = 0;
    this.hold = 0;
  }

  /** ENTER: finish typing, or move on to the next message. */
  skip() {
    if (!this.message) return;
    if (!this.fullyTyped) this.chars = this.totalChars;
    else this.next();
  }

  update() {
    if (!this.message) return;
    if (!this.fullyTyped) {
      this.chars += COMM_CHARS_PER_FRAME;
    } else if (++this.hold > COMM_HOLD_FRAMES) {
      this.next();
    }
  }

  /** Draw the window with its top edge at y (canvas only). */
  draw(ctx, y, frame) {
    if (!this.message) return;
    const x = 8;
    const w = CANVAS_WIDTH - 16;
    const h = 36;
    ctx.save();
    ctx.fillStyle = COLORS.COMM_BG;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.COMM_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.textAlign = 'left';
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = COLORS.COMM_NAME;
    ctx.fillText('LYRA', x + 6, y + 10);

    ctx.font = '8px monospace';
    ctx.fillStyle = COLORS.UI_WHITE;
    let left = Math.floor(this.chars);
    this.message.forEach((line, i) => {
      const shown = line.slice(0, Math.max(0, left));
      left -= line.length;
      ctx.fillText(shown, x + 6, y + 21 + i * 10);
    });

    // "more" marker once a message is complete
    if (this.fullyTyped && Math.floor(frame / 20) % 2 === 0) {
      ctx.fillStyle = COLORS.COMM_NAME;
      ctx.fillText('▼', x + w - 12, y + h - 4);
    }
    ctx.restore();
  }
}
