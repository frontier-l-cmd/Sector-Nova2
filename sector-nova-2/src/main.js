// ============================================================
// SECTOR NOVA 2 - Main Entry Point
// ============================================================

(function () {
  'use strict';

  // --- Canvas Setup ---
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('SECTOR NOVA 2: Canvas element not found!');
    return;
  }

  // Ensure canvas size matches our constants
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Disable image smoothing for pixel-perfect rendering
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Create Game Instance ---
  const game = new Game(canvas);
  // Handle for inspecting / driving the game from the console.
  if (DEBUG_MODE) window.game = game;

  // --- Game Loop ---
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    game.update();
    game.draw();
  }

  // --- Start ---
  console.log('SECTOR NOVA 2 initialized');
  requestAnimationFrame(gameLoop);
})();
