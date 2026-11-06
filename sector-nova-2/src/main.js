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
  // The game always steps FPS (60) times a second, whatever the screen's
  // refresh rate (30 / 60 / 120 / 144 Hz): each screen frame runs as many
  // fixed steps as the elapsed time calls for, then draws once. A long gap
  // (tab hidden, a stall) is not caught up all at once.
  let last = null;
  let pending = 0;
  // DEBUG_MODE: the screen's refresh rate, measured over each half second.
  let fpsFrames = 0;
  let fpsSince = 0;
  let fpsShown = 0;

  function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    const t = typeof now === 'number' ? now : performance.now();
    if (last === null) last = t - SIM_STEP_MS;
    let gap = t - last;
    last = t;
    if (gap > SIM_MAX_GAP_MS) gap = SIM_STEP_MS;
    pending += gap;
    let steps = 0;
    while (pending >= SIM_STEP_MS - 0.001 && steps < SIM_MAX_STEPS) { // (tolerance: float rounding)
      game.update();
      pending -= SIM_STEP_MS;
      steps++;
    }
    if (steps === SIM_MAX_STEPS) pending = Math.min(pending, SIM_STEP_MS);
    game.draw();

    if (DEBUG_MODE) {
      fpsFrames++;
      if (t - fpsSince >= 500) {
        fpsShown = Math.round(fpsFrames * 1000 / (t - fpsSince));
        fpsFrames = 0;
        fpsSince = t;
        window.__fpsShown = fpsShown;
      }
      drawFpsCounter(ctx, fpsShown);
    }
  }

  /** DEBUG_MODE: screen refresh rate (top-left corner, under the HUD bar). */
  function drawFpsCounter(c, fps) {
    c.save();
    c.font = '7px monospace';
    c.textAlign = 'left';
    c.fillStyle = 'rgba(0, 0, 0, 0.6)';
    c.fillRect(2, 20, 40, 9);
    c.fillStyle = COLORS.UI_GREEN;
    c.fillText(fps + ' FPS', 4, 27);
    c.restore();
  }

  // --- Auto-pause ---
  // Switching tabs, leaving the window or another app on the phone pauses
  // play; coming back keeps the pause until the player resumes.
  const autoPause = () => game.autoPause();
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  window.addEventListener('pagehide', autoPause);

  // --- Start ---
  console.log('SECTOR NOVA 2 initialized');
  requestAnimationFrame(gameLoop);
})();
