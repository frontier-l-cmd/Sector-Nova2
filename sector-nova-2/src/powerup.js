// ============================================================
// SECTOR NOVA 2 - Items (DESIGN.md 10)
// ------------------------------------------------------------
// Enemies drop items at the stage's rate; the type is a weighted
// pick from the stage's powerupWeights. Items drift slowly down and
// can be collected even while invincible. Color AND shape tell
// them apart:
//   orange orb "S" SPREAD FAN      blue orb "R"   RAIL LANCER
//   purple orb "C" CHAIN BOLT      green orb "H"  HOMING NEEDLE
//   white ring     OPTION          cyan hexagon   REFLECT SHIELD
//   yellow cross   REPAIR          pink heart     HULL UP
//   gold star      STAR CHIP       rainbow gem    NOVA CRYSTAL (hidden)
// Effects are applied in Game.collectItem().
// ============================================================

const POWERUP_TYPES = [
  { type: WEAPON_SPREAD, color: COLORS.ITEM_SPREAD, shape: 'orb', letter: 'S' },
  { type: WEAPON_RAIL, color: COLORS.ITEM_RAIL, shape: 'orb', letter: 'R' },
  { type: WEAPON_CHAIN, color: COLORS.ITEM_CHAIN, shape: 'orb', letter: 'C' },
  { type: WEAPON_HOMING, color: COLORS.ITEM_HOMING, shape: 'orb', letter: 'H' },
  { type: ITEM_OPTION, color: COLORS.ITEM_OPTION, shape: 'ring' },
  { type: ITEM_REFLECT, color: COLORS.ITEM_REFLECT, shape: 'hexagon' },
  { type: ITEM_REPAIR, color: COLORS.ITEM_REPAIR, shape: 'cross' },
  { type: ITEM_HULL_UP, color: COLORS.ITEM_HULL, shape: 'heart' },
  { type: ITEM_STAR_CHIP, color: COLORS.ITEM_STAR, shape: 'star' },
  { type: ITEM_NOVA_CRYSTAL, color: COLORS.CRYSTAL_HUES[0], shape: 'crystal' },
];

function powerupDefFor(type) {
  return POWERUP_TYPES.find(p => p.type === type) || POWERUP_TYPES[0];
}

/**
 * Weighted random item type. NOVA CRYSTAL is never random.
 */
function randomPowerupType(weights) {
  let total = 0;
  for (const def of POWERUP_TYPES) total += weights[def.type] || 0;
  let roll = Math.random() * total;
  for (const def of POWERUP_TYPES) {
    roll -= weights[def.type] || 0;
    if (roll <= 0 && weights[def.type]) return def.type;
  }
  return ITEM_STAR_CHIP;
}

class Powerup {
  constructor(x, y, type, weights) {
    this.x = x;
    this.y = y;
    this.type = type || randomPowerupType(weights || {});
    this.def = powerupDefFor(this.type);
    this.speed = POWERUP_SPEED;
    this.radius = this.def.shape === 'crystal' ? POWERUP_RADIUS + 3 : POWERUP_RADIUS;
    this.alive = true;
    this.frame = 0;
  }

  update() {
    this.y += this.speed;
    // Gentle horizontal sway
    this.x += Math.sin(this.frame * 0.05) * 0.4;
    this.frame++;
    if (this.y > CANVAS_HEIGHT + 20) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 1 + Math.sin(this.frame * 0.1) * 0.15;
    const color = this.def.shape === 'crystal'
      ? COLORS.CRYSTAL_HUES[Math.floor(this.frame / 6) % COLORS.CRYSTAL_HUES.length]
      : this.def.color;

    // Glow
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, (this.radius + 5) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    switch (this.def.shape) {
      case 'orb': this.drawOrb(ctx, color, pulse); break;
      case 'ring': this.drawRing(ctx, color, pulse); break;
      case 'hexagon': this.drawHexagon(ctx, color); break;
      case 'cross': this.drawCross(ctx, color); break;
      case 'heart': this.drawHeart(ctx, color); break;
      case 'star': this.drawStar(ctx, color, 6, 2.5); break;
      case 'crystal': this.drawCrystal(ctx, color); break;
    }
    ctx.restore();
  }

  drawOrb(ctx, color, pulse) {
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def.letter, 0, 1);
  }

  drawRing(ctx, color, pulse) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.OPTION_GLOW;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 9 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawHexagon(ctx, color) {
    ctx.rotate(this.frame * 0.04);
    ctx.fillStyle = color;
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * 8;
      const py = Math.sin(a) * 8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCross(ctx, color) {
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.fillRect(-3.5, -8.5, 7, 17);
    ctx.fillRect(-8.5, -3.5, 17, 7);
    ctx.fillStyle = color;
    ctx.fillRect(-2.5, -7.5, 5, 15);
    ctx.fillRect(-7.5, -2.5, 15, 5);
  }

  drawHeart(ctx, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-11, 0, -7, -9, 0, -4);
    ctx.bezierCurveTo(7, -9, 11, 0, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-5, -4, 2, 2);
  }

  drawStar(ctx, color, outer, inner) {
    ctx.rotate(this.frame * 0.05);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + (Math.PI / 5) * i;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCrystal(ctx, color) {
    // Tall diamond with a bright inner facet
    ctx.fillStyle = color;
    ctx.strokeStyle = COLORS.UI_WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(-8, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.UI_WHITE;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
  }
}
