// ============================================================
// SECTOR NOVA 2 - Backgrounds
// ------------------------------------------------------------
// The SECTOR NOVA 1 parallax star field is the base layer. Each
// stage picks a theme from BACKGROUND_THEMES (gradient + nebula
// tints) and may stack extra layers on top.
//
// Phase 1 skeleton: themes are wired per stage; the stage-specific
// layers (ice, panels, clouds, veins, flares, core) arrive in
// Phase 4/5 through `layers`. A layer is an object created by a
// factory with update(frame) and draw(ctx). Layers that need the
// heat shimmer can render to an offscreen canvas and draw it in
// horizontal strips; only the background ever shimmers.
// ============================================================

/**
 * Scrolling star background with parallax layers
 */
class StarField {
  constructor() {
    this.layers = [];
    // 3 layers: far (slow, dim), mid, near (fast, bright)
    const configs = [
      { count: 40, speed: 0.3, minSize: 0.5, maxSize: 1, color: COLORS.STAR_DIM },
      { count: 25, speed: 0.8, minSize: 0.8, maxSize: 1.5, color: COLORS.STAR_BRIGHT },
      { count: 15, speed: 1.5, minSize: 1, maxSize: 2, color: COLORS.STAR_WHITE },
    ];
    for (const cfg of configs) {
      const stars = [];
      for (let i = 0; i < cfg.count; i++) {
        stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: randFloat(cfg.minSize, cfg.maxSize),
          speed: cfg.speed + randFloat(-0.1, 0.1),
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      this.layers.push({ stars, color: cfg.color });
    }

    // Nebula clouds (subtle colored patches)
    this.nebulae = [];
    for (let i = 0; i < 3; i++) {
      this.nebulae.push({
        x: randFloat(0, CANVAS_WIDTH),
        y: randFloat(0, CANVAS_HEIGHT),
        radius: randFloat(60, 120),
        color: BACKGROUND_THEMES.title.nebulae[i],
        speed: 0.15,
      });
    }
  }

  setNebulaColors(colors) {
    this.nebulae.forEach((n, i) => {
      n.color = colors[i % colors.length];
    });
  }

  update() {
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        star.y += star.speed;
        star.twinkle += 0.03;
        if (star.y > CANVAS_HEIGHT + 5) {
          star.y = -5;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      }
    }
    for (const n of this.nebulae) {
      n.y += n.speed;
      if (n.y > CANVAS_HEIGHT + n.radius) {
        n.y = -n.radius;
        n.x = randFloat(0, CANVAS_WIDTH);
      }
    }
  }

  draw(ctx) {
    // Nebula clouds
    for (const n of this.nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
    }

    // Stars
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        const alpha = 0.5 + Math.sin(star.twinkle) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = layer.color;
        ctx.fillRect(
          Math.floor(star.x),
          Math.floor(star.y),
          Math.ceil(star.size),
          Math.ceil(star.size)
        );
      }
    }
    ctx.globalAlpha = 1;
  }
}

// Theme per screen / stage: gradient top->bottom, nebula tints, and
// stage-specific layer factories (empty until Phase 4/5).
const BACKGROUND_THEMES = {
  title: {
    top: COLORS.BG_NEBULA,
    bottom: COLORS.BG_DARK,
    nebulae: ['#1a0a30', '#0a1a30', '#0a0a20'],
    layers: [],
  },
  1: { // FROST RING - icy blue
    top: COLORS.FROST_BG_TOP,
    bottom: COLORS.FROST_BG_BOTTOM,
    nebulae: ['#0a2240', '#102a44', '#0a1428'],
    layers: [],
  },
  2: { // DEAD HARBOR - iron gray / blue
    top: COLORS.HARBOR_BG_TOP,
    bottom: COLORS.HARBOR_BG_BOTTOM,
    nebulae: ['#1a2028', '#141a24', '#10141c'],
    layers: [],
  },
  3: { // STORM VEIL - violet gray
    top: COLORS.STORM_BG_TOP,
    bottom: COLORS.STORM_BG_BOTTOM,
    nebulae: ['#241c34', '#1c1a2c', '#16121f'],
    layers: [],
  },
  4: { // ECLIPSE HIVE - dark red-violet
    top: COLORS.HIVE_BG_TOP,
    bottom: COLORS.HIVE_BG_BOTTOM,
    nebulae: ['#340c24', '#2a0a1c', '#1c0612'],
    layers: [],
  },
  5: { // CORONA ZONE - red / orange
    top: COLORS.CORONA_BG_TOP,
    bottom: COLORS.CORONA_BG_BOTTOM,
    nebulae: ['#4a160a', '#3a1006', '#240a04'],
    layers: [],
  },
  6: { // HELIOS CORE - white / gold
    top: COLORS.HELIOS_BG_TOP,
    bottom: COLORS.HELIOS_BG_BOTTOM,
    nebulae: ['#4a3e18', '#3a3012', '#241e0c'],
    layers: [],
  },
};

class Background {
  constructor() {
    this.starField = new StarField();
    this.frame = 0;
    this.setTheme('title');
  }

  /**
   * Switch theme: 'title' or a stage number. Unknown keys fall back
   * to the title theme.
   */
  setTheme(key) {
    this.themeKey = BACKGROUND_THEMES[key] ? key : 'title';
    this.theme = BACKGROUND_THEMES[this.themeKey];
    this.starField.setNebulaColors(this.theme.nebulae);
    this.layers = this.theme.layers.map(createLayer => createLayer());
    this.gradient = null; // rebuilt lazily on the next draw
  }

  update() {
    this.frame++;
    this.starField.update();
    for (const layer of this.layers) layer.update(this.frame);
  }

  draw(ctx) {
    if (!this.gradient) {
      this.gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      this.gradient.addColorStop(0, this.theme.top);
      this.gradient.addColorStop(1, this.theme.bottom);
    }
    ctx.fillStyle = this.gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.starField.draw(ctx);
    for (const layer of this.layers) layer.draw(ctx);
  }
}
