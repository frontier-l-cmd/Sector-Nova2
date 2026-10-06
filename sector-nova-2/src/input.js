// ============================================================
// SECTOR NOVA 2 - Input Handler
// ------------------------------------------------------------
// Game code reads logical actions (left, shoot, enter, ...), not
// physical keys. Keyboard keys are mapped through INPUT_BINDINGS;
// future touch controls can drive the same actions with
// setVirtual(action, down) without changing any game code.
// Raw key queries (isDown / isJustPressed) remain for number keys
// and debug hotkeys.
// ============================================================

const INPUT_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  shoot: ['Space'],
  burst: ['KeyX'],
  enter: ['Enter'],
  pause: ['KeyP'],
  mute: ['KeyM'],
};

// Keys whose browser default (page scrolling) must be suppressed.
const INPUT_PREVENT_DEFAULT = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyP'];

class InputHandler {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._previousKeys = {};
    this._tapped = {};            // pressed since the last update()
    this.virtual = {};            // action -> bool (future touch controls)
    this.actionDown = {};
    this.actionJustPressed = {};

    window.addEventListener('keydown', (e) => {
      if (INPUT_PREVENT_DEFAULT.includes(e.code)) {
        e.preventDefault();
      }
      // Remember the press even if the key is released before the next
      // frame, so quick taps are never lost. Auto-repeat is ignored.
      if (!e.repeat) this._tapped[e.code] = true;
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Releasing keys while the window is unfocused never fires keyup;
    // drop everything so the ship does not keep drifting or firing.
    window.addEventListener('blur', () => {
      for (const code in this.keys) this.keys[code] = false;
      this.virtual = {};
    });
  }

  /**
   * Call at the start of each frame to update justPressed state
   */
  update() {
    for (const key in this.keys) {
      this.justPressed[key] = !!this._tapped[key] || (this.keys[key] && !this._previousKeys[key]);
    }
    this._tapped = {};
    this._previousKeys = { ...this.keys };

    for (const action in INPUT_BINDINGS) {
      const codes = INPUT_BINDINGS[action];
      const down = !!this.virtual[action] || codes.some(code => this.keys[code]);
      const tapped = codes.some(code => this.justPressed[code]);
      this.actionJustPressed[action] = tapped || (down && !this.actionDown[action]);
      this.actionDown[action] = down;
    }
  }

  /** Hook for on-screen controls: press / release a logical action. */
  setVirtual(action, down) {
    this.virtual[action] = !!down;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  isActionDown(action) {
    return !!this.actionDown[action];
  }

  isActionJustPressed(action) {
    return !!this.actionJustPressed[action];
  }

  // Held actions (gameplay)
  get left() {
    return this.isActionDown('left');
  }

  get right() {
    return this.isActionDown('right');
  }

  get up() {
    return this.isActionDown('up');
  }

  get down() {
    return this.isActionDown('down');
  }

  get shoot() {
    return this.isActionDown('shoot');
  }

  // One-shot actions
  get enter() {
    return this.isActionJustPressed('enter');
  }

  get pause() {
    return this.isActionJustPressed('pause');
  }

  get mute() {
    return this.isActionJustPressed('mute');
  }

  get burst() {
    return this.isActionJustPressed('burst');
  }

  // Menu navigation (one step per press)
  get menuUp() {
    return this.isActionJustPressed('up');
  }

  get menuDown() {
    return this.isActionJustPressed('down');
  }

  get menuLeft() {
    return this.isActionJustPressed('left');
  }

  get menuRight() {
    return this.isActionJustPressed('right');
  }
}
