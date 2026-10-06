// ============================================================
// SECTOR NOVA - Input Handler
// ============================================================

class InputHandler {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._previousKeys = {};

    window.addEventListener('keydown', (e) => {
      // Prevent default for game keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyP'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  /**
   * Call at the start of each frame to update justPressed state
   */
  update() {
    for (const key in this.keys) {
      this.justPressed[key] = this.keys[key] && !this._previousKeys[key];
    }
    // Copy current state
    this._previousKeys = { ...this.keys };
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Movement helpers
  get left() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get up() {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get down() {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get shoot() {
    return this.isDown('Space');
  }

  get enter() {
    return this.isJustPressed('Enter');
  }

  get pause() {
    return this.isJustPressed('KeyP');
  }
}
