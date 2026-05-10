/**
 * Fairchild Consulting Services - Pixel Art Cinematic
 * Hand-authored canvas animation: A knight battles and slays a dragon,
 * then "Fairchild Consulting Services" emerges from the ashes.
 *
 * Single-file, dependency-free. Renders at internal resolution (W x H)
 * and is scaled up via CSS with image-rendering: pixelated for crispness.
 */

// DEBUG: this log proves animation.js parsed and started executing
console.log('[Fairchild] animation.js script started parsing');

(function () {
  'use strict';

  console.log('[Fairchild] IIFE entered');

  // Try to surface any errors visibly on the page
  function _showError(msg) {
    try {
      var el = document.getElementById('err');
      if (el) {
        el.style.display = 'block';
        el.textContent = 'animation.js error: ' + msg;
      }
    } catch (e) {}
    console.error('[Fairchild]', msg);
  }

  // ---------- Configuration ----------
  const W = 240;          // Internal pixel width (portrait)
  const H = 426;          // Internal pixel height (~9:16)
  const TOTAL_DURATION = 13500; // milliseconds

  // Color palette (loosely MTG-inspired: deep purples, gold, dark blue, fire)
  const C = {
    skyTop: '#0a0420',
    skyMid: '#1a0c3a',
    skyHorizon: '#3d1a4a',
    skyDawn: '#7a2552',
    skyDawnHi: '#c4527a',
    star: '#fff7d9',
    moon: '#f6e3a1',
    mountainBack: '#1c1238',
    mountainFront: '#0d0820',
    snow: '#9aa0c4',
    ground: '#0d0a18',
    groundHi: '#231b3a',
    grass: '#3a2b50',
    knightArmor: '#a8aac4',
    knightArmorDk: '#5a5d80',
    knightArmorHi: '#dde0f2',
    knightCape: '#5a1a78',
    knightCapeDk: '#2c0a44',
    knightTrim: '#f0c14a',
    knightTrimDk: '#a07820',
    knightVisor: '#070710',
    knightEye: '#ffe44a',
    swordBlade: '#dde6f0',
    swordEdge: '#ffffff',
    swordHilt: '#3a1a08',
    swordHiltGold: '#f0c14a',
    dragonBody: '#7a1a1a',
    dragonBodyDk: '#3a0a0a',
    dragonBodyHi: '#c43a3a',
    dragonBelly: '#f0a040',
    dragonClaw: '#1a1a1a',
    dragonEye: '#ffd80a',
    dragonEyeRed: '#ff2a2a',
    fire1: '#ffe44a',
    fire2: '#ff7a1a',
    fire3: '#c4181a',
    fire4: '#5a0a0a',
    smoke: '#3a2a4a',
    blood: '#8a0a0a',
    title: '#f0c14a',
    titleHi: '#fff7c4',
    titleDk: '#7a5a18',
    text: '#e8e2d4',
    textDim: '#a59c8a',
    accent: '#9b6cff',
  };

  // ---------- Boot ----------
  console.log('[Fairchild] looking up #intro-canvas');
  const canvas = document.getElementById('intro-canvas');
  if (!canvas) { _showError('canvas #intro-canvas not found in DOM'); return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) { _showError('failed to get 2d context'); return; }
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  console.log('[Fairchild] canvas + ctx initialized');

  // ---------- Utilities ----------
  // Deterministic PRNG for stable star/particle layouts
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // ---------- Cinematic effects: camera shake & screen flash ----------
  let shakeT = 0, shakeAmp = 0;
  function triggerShake(amp, durFrames) { shakeAmp = amp; shakeT = Math.max(shakeT, durFrames); }
  let flashT = 0, flashMax = 1, flashColor = '255,255,255';
  function triggerFlash(rgb, durFrames) { flashColor = rgb || '255,255,255'; flashT = durFrames; flashMax = durFrames; }
  function drawFlash() {
    if (flashT <= 0) return;
    const a = (flashT / flashMax) * 0.85;
    ctx.fillStyle = 'rgba(' + flashColor + ',' + a.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    flashT -= 1;
  }

  // ---------- Background layers ----------
  const STAR_RNG = mulberry32(7);
  const stars = Array.from({ length: 60 }, () => ({
    x: Math.floor(STAR_RNG() * W),
    y: Math.floor(STAR_RNG() * H * 0.55),
    s: STAR_RNG() < 0.85 ? 1 : 2,
    twinkle: STAR_RNG(),
  }));

  function drawSky(t) {
    // t in [0,1] across the whole animation; sky transitions from deep night to fiery dusk
    const dawn = clamp((t - 0.15) * 1.8, 0, 1);
    // Vertical bands of color (cheap gradient)
    const bands = [
      [0, 60, lerp01(C.skyTop, C.skyDawn, dawn * 0.6)],
      [60, 130, lerp01(C.skyMid, C.skyDawn, dawn * 0.7)],
      [130, 190, lerp01(C.skyHorizon, C.skyDawnHi, dawn)],
      [190, 230, lerp01(C.skyDawn, C.skyDawnHi, dawn)],
    ];
    for (const [y0, y1, color] of bands) {
      px(0, y0, W, y1 - y0, color);
    }
  }

  // ---- color helpers ----
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    const c = (n) => n.toString(16).padStart(2, '0');
    return '#' + c(r | 0) + c(g | 0) + c(b | 0);
  }
  function lerp01(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
  }

  function drawStars(time) {
    for (const star of stars) {
      const tw = (Math.sin(time * 0.003 + star.twinkle * 6.28) + 1) / 2;
      const a = 0.4 + tw * 0.6;
      ctx.fillStyle = `rgba(255,247,217,${a.toFixed(2)})`;
      ctx.fillRect(star.x, star.y, star.s, star.s);
    }
  }

  function drawMoon() {
    // Moon top-right — pixel-art circle, ~18x18
    // Soft glow halo first (drawn under)
    ctx.fillStyle = 'rgba(246,227,161,0.10)';
    ctx.fillRect(184, 24, 32, 32);
    ctx.fillStyle = 'rgba(246,227,161,0.06)';
    ctx.fillRect(180, 20, 40, 40);

    // Octagonal moon body (cheap pixel circle)
    const cx = 200, cy = 40;
    px(cx - 5, cy - 8, 10, 1, C.moon);
    px(cx - 7, cy - 7, 14, 1, C.moon);
    px(cx - 8, cy - 6, 16, 4, C.moon);
    px(cx - 9, cy - 2, 18, 5, C.moon);
    px(cx - 8, cy + 3, 16, 4, C.moon);
    px(cx - 7, cy + 7, 14, 1, C.moon);
    px(cx - 5, cy + 8, 10, 1, C.moon);

    // Subtle crescent shading on the right side
    px(cx + 1, cy - 6, 7, 4, '#d4c485');
    px(cx + 1, cy - 2, 8, 5, '#d4c485');
    px(cx + 1, cy + 3, 7, 4, '#d4c485');

    // A couple of crater specks
    px(cx - 4, cy - 2, 1, 1, '#d4c485');
    px(cx - 2, cy + 3, 1, 1, '#d4c485');
  }

  // Drifting clouds for atmospheric depth — 3 cloud strips at different y/depth
  const CLOUD_RNG = mulberry32(23);
  const clouds = Array.from({ length: 8 }, () => ({
    x: CLOUD_RNG() * W * 1.5 - 30,
    y: 30 + CLOUD_RNG() * 90,
    w: 18 + CLOUD_RNG() * 36,
    speed: 0.04 + CLOUD_RNG() * 0.06,
    layer: Math.floor(CLOUD_RNG() * 3), // 0 far/dim, 1 mid, 2 near/bright
  }));

  function drawClouds(time) {
    const colors = ['rgba(180,150,200,0.20)', 'rgba(210,180,225,0.30)', 'rgba(235,210,240,0.42)'];
    for (const c of clouds) {
      const x = ((c.x + time * c.speed * 0.05) % (W + 80)) - 40;
      ctx.fillStyle = colors[c.layer];
      // Cheap cloud silhouette: 3 stacked rounded rects
      ctx.fillRect(x, c.y, c.w, 3);
      ctx.fillRect(x + 2, c.y - 2, c.w - 4, 2);
      ctx.fillRect(x + 6, c.y - 3, c.w - 12, 2);
      ctx.fillRect(x + 4, c.y + 3, c.w - 8, 2);
    }
  }

  // Horizon haze — soft band where sky meets distant mountains
  function drawHaze(t) {
    const dawn = clamp((t - 0.15) * 1.8, 0, 1);
    const haze = 'rgba(' + Math.floor(lerp(80, 196, dawn)) + ',' + Math.floor(lerp(50, 82, dawn)) + ',' + Math.floor(lerp(110, 122, dawn)) + ',0.35)';
    for (let y = 132; y < 165; y++) {
      const a = (y - 132) / 33;
      ctx.fillStyle = 'rgba(' + Math.floor(lerp(60, 196, dawn)) + ',' + Math.floor(lerp(40, 82, dawn)) + ',' + Math.floor(lerp(95, 122, dawn)) + ',' + (0.5 - a * 0.45).toFixed(2) + ')';
      ctx.fillRect(0, y, W, 1);
    }
  }

  function drawMountains() {
    // DEEPEST range — silhouettes far in the distance, almost sky-toned
    drawMountainRange(132, 50, '#241848', [22, 36, 28, 40, 30, 38, 32, 26, 34], 13);
    // Back mountains
    drawMountainRange(150, 80, C.mountainBack, [40, 70, 55, 65, 50, 75, 60], 11);
    // Snow caps on back range
    snowCaps(150, C.snow, [40, 70, 55, 65, 50, 75, 60], 11);
    // Front mountains
    drawMountainRange(190, 100, C.mountainFront, [55, 90, 70, 85, 95, 65], 8);
  }

  function drawMountainRange(baseY, peakSpread, color, peaks, segs) {
    const segWidth = W / segs;
    ctx.fillStyle = color;
    for (let i = 0; i < segs; i++) {
      const peakH = peaks[i % peaks.length];
      const x0 = i * segWidth;
      // Triangle-ish jagged peak rendered as a stack of pixel rows
      for (let y = 0; y < peakH; y++) {
        const w = ((peakH - y) / peakH) * segWidth + 4;
        ctx.fillRect(x0 + (segWidth - w) / 2, baseY - y, w, 1);
      }
    }
    // Mountain base block
    ctx.fillRect(0, baseY, W, peakSpread - 30);
  }

  function snowCaps(baseY, color, peaks, segs) {
    const segWidth = W / segs;
    ctx.fillStyle = color;
    for (let i = 0; i < segs; i++) {
      const peakH = peaks[i % peaks.length];
      const x0 = i * segWidth;
      const capH = Math.floor(peakH * 0.25);
      for (let y = peakH - capH; y < peakH; y++) {
        const w = ((peakH - y) / peakH) * segWidth + 4;
        ctx.fillRect(x0 + (segWidth - w) / 2, baseY - y, w, 1);
      }
    }
  }

  function drawGround(t) {
    // Hill / ground
    px(0, 230, W, H - 230, C.ground);
    // Ridge highlight
    for (let x = 0; x < W; x++) {
      const wob = Math.sin(x * 0.08) * 2;
      px(x, 230 + wob, 1, 1, C.groundHi);
    }
    // Grass tufts (random pixel dots) - parchment glints
    const rng = mulberry32(13);
    for (let i = 0; i < 24; i++) {
      const x = Math.floor(rng() * W);
      const y = 232 + Math.floor(rng() * 30);
      px(x, y, 1, 1, C.grass);
      px(x + 1, y, 1, 1, C.grass);
    }
  }

  // ---------- Knight sprite ----------
  // Drawn at 24x36 logical pixels. Anchor: bottom-center (feet).
  // States: idle, walk(0|1), readyAttack, slash, victory
  function drawKnight(ax, ay, state, frame, opts = {}) {
    const x = (ax | 0) - 12;     // top-left from anchor
    const y = (ay | 0) - 36;
    const flip = opts.flip || false;
    // Cape sway — continuous time-based wobble (always alive, faster during walk)
    const t = performance.now();
    const swayBase = Math.sin(t * (state === 'walk' ? 0.014 : 0.005));
    const sway = swayBase > 0 ? 1 : 0;
    const breathe = (state === 'idle') ? (Math.sin(t * 0.004) > 0 ? 0 : 1) : 0;
    // Subtle weight-shift bob during walk
    const walkBob = state === 'walk' ? ([0, -1, 0, 0][frame % 4] || 0) : 0;

    // Helper that respects flip
    const dx = (a) => flip ? (24 - a) : a;
    const p = (a, b, w, h, color) => {
      const ax2 = flip ? (24 - a - w) : a;
      px(x + ax2, y + b + walkBob, w, h, color);
    };

    // Rim light removed (was creating a visible stripe artifact). If we want
    // it back later we'll bake it INTO sprite pixels instead of overlay.

    // Cape (behind body)
    p(2, 8 + sway, 5, 18, C.knightCape);
    p(2, 8 + sway, 5, 4, C.knightCapeDk); // shadow
    p(3, 24 + sway, 1, 2, C.knightCapeDk);
    p(5, 25 + sway, 1, 2, C.knightCapeDk);

    // Legs (animation offset)
    let leftLegY = 0, rightLegY = 0;
    if (state === 'walk') {
      leftLegY = frame % 2 ? -1 : 0;
      rightLegY = frame % 2 ? 0 : -1;
    } else if (state === 'slash') {
      leftLegY = -1; rightLegY = 1;
    } else if (state === 'victory') {
      leftLegY = 0; rightLegY = 0;
    }
    // Left leg
    p(8, 26 + leftLegY, 3, 8, C.knightArmorDk);
    p(8, 32 + leftLegY, 4, 2, '#0d0d18'); // boot
    // Right leg
    p(13, 26 + rightLegY, 3, 8, C.knightArmorDk);
    p(13, 32 + rightLegY, 4, 2, '#0d0d18'); // boot

    // Torso plate
    p(6, 12 + breathe, 12, 14, C.knightArmor);
    // Highlights
    p(7, 13 + breathe, 2, 12, C.knightArmorHi);
    // Center trim (gold)
    p(11, 13 + breathe, 2, 12, C.knightTrim);
    p(11, 13 + breathe, 1, 12, C.knightTrimDk);
    // Belt
    p(6, 22 + breathe, 12, 2, C.knightTrim);
    p(6, 22 + breathe, 12, 1, C.knightTrimDk);

    // Shoulder pauldrons
    p(4, 12 + breathe, 3, 4, C.knightArmorDk);
    p(17, 12 + breathe, 3, 4, C.knightArmorDk);

    // Helmet
    p(7, 0, 10, 2, C.knightArmorDk);   // crest base
    p(8, -2, 8, 3, C.knightTrim);      // gold crest plume
    p(9, -3, 6, 1, C.knightTrim);
    p(6, 2, 12, 9, C.knightArmor);     // dome
    p(6, 2, 12, 1, C.knightArmorHi);   // top highlight
    // Visor slit
    p(7, 6, 10, 2, C.knightVisor);
    // Eye glow
    p(9, 7, 1, 1, C.knightEye);
    p(14, 7, 1, 1, C.knightEye);
    // Helmet trim
    p(6, 10, 12, 1, C.knightTrim);

    // Arm (shield side - left in image / opposite when flipped)
    p(3, 14 + breathe, 3, 9, C.knightArmorDk);
    p(3, 16 + breathe, 3, 1, C.knightArmorHi);

    // Sword (right hand). Position varies by state.
    drawSword(p, state, frame, breathe);
  }

  function drawSword(p, state, frame, breathe) {
    // Arm holding sword + sword itself. Designed for non-flipped knight (sword on right side)
    if (state === 'idle' || state === 'walk') {
      // Arm down at side, sword pointed down
      p(18, 14 + breathe, 3, 10, C.knightArmorDk);
      p(18, 16 + breathe, 3, 1, C.knightArmorHi);
      // Sword pointed down
      p(20, 22, 1, 8, C.swordBlade);
      p(21, 24, 1, 6, C.swordEdge);
      p(19, 21, 4, 1, C.swordHiltGold); // crossguard
      p(20, 18, 1, 4, C.swordHilt);     // grip
    } else if (state === 'readyAttack') {
      // Arm raised, sword overhead
      p(17, 6, 4, 6, C.knightArmorDk);
      p(17, 8, 4, 1, C.knightArmorHi);
      // Sword going up and slightly back
      p(20, -8, 2, 14, C.swordBlade);
      p(22, -6, 1, 12, C.swordEdge);
      p(19, 6, 5, 1, C.swordHiltGold);
      p(20, 7, 2, 3, C.swordHilt);
    } else if (state === 'slash') {
      // Sword arcing forward
      const arcFrame = frame % 4;
      if (arcFrame === 0) {
        // Top
        p(18, 4, 4, 6, C.knightArmorDk);
        p(20, -10, 2, 14, C.swordBlade);
        p(22, -8, 1, 12, C.swordEdge);
        p(19, 4, 5, 1, C.swordHiltGold);
      } else if (arcFrame === 1) {
        // Mid swing - sword going right
        p(18, 8, 4, 4, C.knightArmorDk);
        p(22, 4, 12, 2, C.swordBlade);
        p(22, 6, 12, 1, C.swordEdge);
        p(20, 8, 4, 1, C.swordHiltGold);
      } else if (arcFrame === 2) {
        // Slash diagonal
        for (let i = 0; i < 14; i++) {
          p(22 + i, 6 + (i >> 1), 1, 1, C.swordBlade);
          p(22 + i, 7 + (i >> 1), 1, 1, C.swordEdge);
        }
        p(20, 10, 4, 4, C.knightArmorDk);
      } else {
        // Follow through - sword pointed right
        p(18, 10, 4, 4, C.knightArmorDk);
        p(22, 12, 14, 2, C.swordBlade);
        p(22, 14, 14, 1, C.swordEdge);
      }
    } else if (state === 'victory') {
      // Sword raised straight up triumphantly
      p(17, 4, 4, 8, C.knightArmorDk);
      p(17, 6, 4, 1, C.knightArmorHi);
      // Long sword up
      p(19, -22, 2, 26, C.swordBlade);
      p(21, -20, 1, 24, C.swordEdge);
      p(18, 4, 5, 1, C.swordHiltGold);
      p(19, 5, 2, 4, C.swordHilt);
      p(18, 8, 5, 1, C.swordHiltGold);
    }
  }

  // ---------- Dragon sprite ----------
  // Drawn at 64x40 logical pixels. Anchor: center.
  // States: fly(0|1), roar, attack, hit, dying, dead
  function drawDragon(ax, ay, state, frame, opts = {}) {
    const scale = opts.scale || 2;
    const x = (ax | 0) - 32 * scale;
    const y = (ay | 0) - 20 * scale;
    // Sprite has head at sprite-x=0–16 (low x). flip=false → head appears on LEFT
    // of canvas, facing the knight. flip=true mirrors and faces right.
    const flip = opts.flip !== undefined ? opts.flip : false;
    const wingFrame = frame % 4;

    const p = (a, b, w, h, color) => {
      const ax2 = flip ? (64 - a - w) : a;
      px(x + ax2 * scale, y + b * scale, w * scale, h * scale, color);
    };

    // ------- Wings (drawn first so body covers center) -------
    drawDragonWings(p, wingFrame, state);

    // ------- Whip tail with arrowhead spade tip (wyvern-style) -------
    // Tail curls in an S-shape, tapering to a wide spade tip
    const tw = performance.now() * 0.005;
    const wag1 = Math.sin(tw) * 2;
    const wag2 = Math.sin(tw + 0.6) * 3;
    const wag3 = Math.sin(tw + 1.2) * 4;
    // Base of tail (thick, attached to body)
    p(54, 17, 6, 5, C.dragonBody);
    p(54, 17, 6, 1, C.dragonBodyHi);
    p(54, 21, 6, 1, C.dragonBodyDk);
    // Mid tail segment (S-curve up + back)
    p(60, 16 + wag1, 5, 3, C.dragonBody);
    p(60, 16 + wag1, 5, 1, C.dragonBodyHi);
    // Thinner whip section
    p(65, 14 + wag2, 4, 2, C.dragonBody);
    p(65, 14 + wag2, 4, 1, C.dragonBodyHi);
    // Whip taper
    p(69, 13 + wag2, 3, 2, C.dragonBodyDk);
    p(72, 12 + wag3, 3, 1, C.dragonBodyDk);
    // ARROWHEAD spade tip — diamond shape pointing back
    p(75, 10 + wag3, 1, 1, C.dragonBodyDk);
    p(74, 11 + wag3, 4, 1, C.dragonBody);
    p(73, 12 + wag3, 6, 2, C.dragonBody);
    p(73, 12 + wag3, 6, 1, C.dragonBodyHi);
    p(74, 14 + wag3, 4, 1, C.dragonBodyDk);
    p(75, 15 + wag3, 1, 1, C.dragonBodyDk);
    // Tip glint highlight (catches the moonlight)
    p(78, 12 + wag3, 1, 1, C.dragonBodyHi);

    // ------- Body — stepped organic silhouette instead of flat rectangle -------
    // Top arch: narrower at shoulders + hips, widest in mid-back
    p(28, 12, 18, 1, C.dragonBodyDk);          // arched top ridge (narrow)
    p(25, 13, 24, 1, C.dragonBodyDk);          // shoulder taper
    p(23, 14, 28, 1, C.dragonBody);            // upper body widening
    p(22, 15, 30, 1, C.dragonBody);            // shoulder line full
    // Mid-body (widest cross-section, fully drawn)
    p(22, 16, 32, 5, C.dragonBody);            // main mid torso (rib cage)
    // Body lower half tapers toward belly
    p(23, 21, 30, 1, C.dragonBody);
    p(24, 22, 28, 1, C.dragonBody);
    // Belly curve — softer underside than the back
    p(25, 23, 26, 2, C.dragonBelly);
    p(27, 25, 22, 2, C.dragonBelly);
    p(29, 27, 18, 1, C.dragonBelly);
    // Bright belly stripe
    p(28, 24, 20, 1, '#ffce6a');
    // Subtle shoulder/hip rounded shadow corners
    p(22, 14, 1, 1, C.dragonBodyDk);
    p(53, 14, 1, 1, C.dragonBodyDk);
    p(23, 22, 1, 1, C.dragonBodyDk);
    p(52, 22, 1, 1, C.dragonBodyDk);
    // Scale pattern — staggered crescents across the back/sides for hand-drawn feel
    const scalesA = [[24, 17], [29, 17], [34, 17], [39, 17], [44, 17], [49, 17]];
    const scalesB = [[26, 19], [31, 19], [36, 19], [41, 19], [46, 19]];
    for (const [sx, sy] of scalesA) {
      p(sx, sy, 3, 1, C.dragonBodyHi);
      p(sx + 1, sy + 1, 1, 1, C.dragonBodyDk);
    }
    for (const [sx, sy] of scalesB) {
      p(sx, sy, 3, 1, C.dragonBodyHi);
      p(sx + 1, sy + 1, 1, 1, C.dragonBodyDk);
    }
    // Belly scale lines (lighter)
    p(28, 24, 1, 1, '#ffd870');
    p(34, 24, 1, 1, '#ffd870');
    p(40, 24, 1, 1, '#ffd870');
    p(46, 24, 1, 1, '#ffd870');
    // Back spikes (now with highlight tip)
    p(30, 12, 2, 3, C.dragonBodyDk);
    p(30, 12, 2, 1, C.dragonBodyHi);
    p(36, 10, 2, 4, C.dragonBodyDk);
    p(36, 10, 2, 1, C.dragonBodyHi);
    p(42, 11, 2, 4, C.dragonBodyDk);
    p(42, 11, 2, 1, C.dragonBodyHi);
    p(48, 13, 2, 3, C.dragonBodyDk);
    p(48, 13, 2, 1, C.dragonBodyHi);

    // ------- Wyvern hind legs only (no front legs — wyvern silhouette) -------
    const legBob = (wingFrame === 1 || wingFrame === 3) ? 1 : 0;
    // Two BIG hind legs, hanging down + slightly forward, with thigh + claw
    // Right hind (closer to viewer) — meatier, more detailed
    p(34, 26 + legBob, 6, 5, C.dragonBody);          // thigh
    p(34, 26 + legBob, 6, 1, C.dragonBodyHi);        // top highlight
    p(35, 31 + legBob, 4, 4, C.dragonBody);          // shin
    p(35, 31 + legBob, 4, 1, C.dragonBodyDk);        // shin shading
    p(34, 35 + legBob, 6, 1, C.dragonBodyDk);        // foot pad
    // Talons (3 splayed forward)
    p(34, 36 + legBob, 1, 2, C.dragonClaw);
    p(36, 37 + legBob, 1, 2, C.dragonClaw);
    p(38, 37 + legBob, 1, 2, C.dragonClaw);
    p(40, 36 + legBob, 1, 2, C.dragonClaw);
    // Rear talon (back of foot)
    p(33, 36 + legBob, 1, 2, C.dragonClaw);
    // Far hind (background, smaller, slightly offset for depth)
    p(28, 27 + legBob, 4, 4, C.dragonBodyDk);        // thigh in shadow
    p(28, 31 + legBob, 3, 3, C.dragonBodyDk);        // shin
    p(28, 34 + legBob, 4, 1, C.dragonBodyDk);        // foot
    p(28, 35 + legBob, 1, 1, C.dragonClaw);
    p(30, 35 + legBob, 1, 1, C.dragonClaw);
    p(32, 35 + legBob, 1, 1, C.dragonClaw);

    // ------- Wyvern head + long S-curve neck -------
    // Long neck arching down then forward (S-curve)
    p(20, 12, 6, 4, C.dragonBody);             // neck base (rises from body)
    p(20, 12, 6, 1, C.dragonBodyHi);
    p(16, 11, 6, 4, C.dragonBody);             // neck mid-curve
    p(16, 11, 6, 1, C.dragonBodyHi);
    p(12, 12, 6, 4, C.dragonBody);             // neck dipping forward
    p(12, 12, 6, 1, C.dragonBodyDk);
    // Neck spines along top (4 small spikes)
    p(14, 9, 1, 2, C.dragonBodyDk);
    p(17, 8, 1, 2, C.dragonBodyDk);
    p(20, 8, 1, 2, C.dragonBodyDk);
    p(23, 9, 1, 2, C.dragonBodyDk);
    // Predatory head — narrower, more pointed, jaw-forward
    p(4, 11, 10, 9, C.dragonBody);             // skull
    p(4, 11, 10, 1, C.dragonBodyDk);           // top edge shadow
    p(4, 19, 10, 1, C.dragonBodyDk);           // jaw line shadow
    p(5, 12, 8, 1, C.dragonBodyHi);            // forehead highlight
    // Lower jaw extending forward (wyvern profile)
    p(2, 16, 6, 4, C.dragonBody);              // protruding jaw
    p(2, 16, 6, 1, C.dragonBodyDk);
    // Pointed snout / beak tip
    p(0, 16, 2, 3, C.dragonBody);
    p(0, 16, 2, 1, C.dragonBodyDk);
    // Brow ridge over eye
    p(7, 11, 5, 1, C.dragonBodyDk);
    // Nostril
    p(1, 15, 1, 1, C.dragonBodyDk);
    p(2, 16, 1, 1, C.dragonBodyDk);
    // Smoking nostrils — wisps drift up when alive
    if (state !== 'dying' && state !== 'dead' && Math.random() < 0.22) {
      const snoutCanvasX = flip ? (ax + 32 * scale - 2) : (ax - 32 * scale + 2);
      const snoutCanvasY = ay - 20 * scale + 16 * scale;
      particles.push({
        type: 'ember',
        x: snoutCanvasX, y: snoutCanvasY,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.35 - Math.random() * 0.25,
        life: 35 + Math.random() * 20,
        max: 55,
        // mark as nostril smoke for grayer color
        smoke: true,
      });
    }
    // Horns
    p(6, 6, 2, 5, C.dragonBodyDk);
    p(11, 6, 2, 5, C.dragonBodyDk);
    p(7, 4, 1, 2, C.dragonBodyDk);
    p(12, 4, 1, 2, C.dragonBodyDk);

    // Eye
    const eyeColor = (state === 'roar' || state === 'attack') ? C.dragonEyeRed : C.dragonEye;
    if (state !== 'dying' && state !== 'dead') {
      p(7, 13, 3, 3, eyeColor);
      p(8, 14, 1, 1, '#000');
    } else {
      // X eye
      p(7, 13, 3, 1, '#000');
      p(8, 14, 1, 1, '#000');
      p(7, 15, 3, 1, '#000');
    }

    // Mouth open (when roaring or attacking)
    if (state === 'roar' || state === 'attack') {
      p(0, 18, 8, 4, '#1a0505');
      // Teeth
      p(1, 18, 1, 2, C.swordEdge);
      p(3, 18, 1, 2, C.swordEdge);
      p(5, 18, 1, 2, C.swordEdge);
      p(2, 20, 1, 1, C.swordEdge);
      p(4, 20, 1, 1, C.swordEdge);
    } else if (state === 'hit') {
      // Pained mouth
      p(2, 19, 4, 1, '#1a0505');
    }

    // ------- Wing strut over body (top) -------
    // (Wings at top-back already drawn behind by drawDragonWings)

    // Hit flash overlay
    if (state === 'hit') {
      ctx.globalAlpha = 0.5;
      p(2, 10, 60, 18, '#ffffff');
      ctx.globalAlpha = 1;
    }
  }

  function drawDragonWings(p, wingFrame, state) {
    // Wing extending up-back from shoulder area (around x=28, y=14)
    // Use 4-frame flap cycle
    const phases = [
      // Frame 0: down
      [{ a: 22, b: 8, w: 24, h: 2 }, { a: 26, b: 10, w: 16, h: 2 }],
      // Frame 1: midflap
      [{ a: 22, b: 4, w: 24, h: 2 }, { a: 26, b: 6, w: 16, h: 3 }],
      // Frame 2: up
      [{ a: 22, b: 0, w: 24, h: 3 }, { a: 26, b: 3, w: 16, h: 3 }],
      // Frame 3: midflap return
      [{ a: 22, b: 4, w: 24, h: 2 }, { a: 26, b: 6, w: 16, h: 3 }],
    ];
    const layers = phases[wingFrame];
    const baseB = layers[0].b;

    // BIG wing arching UP and outward, then curving back down to a swept tip.
    // Leading edge is an upward arc — like a bat wing raised in flight.
    // Span goes from x=20 (shoulder) to x=60 (tip), 12-14 px tall.
    p(20, baseB + 2, 4, 2, C.dragonBodyDk);    // shoulder mount (low/wide)
    p(24, baseB,     6, 2, C.dragonBodyDk);    // arm rising
    p(30, baseB - 2, 6, 2, C.dragonBodyDk);    // arching up
    p(36, baseB - 4, 6, 2, C.dragonBodyDk);    // PEAK of wing arc
    p(42, baseB - 4, 6, 2, C.dragonBodyDk);    // shoulder of forearm
    p(48, baseB - 3, 6, 2, C.dragonBodyDk);    // forearm starts curving back+down
    p(54, baseB - 1, 5, 2, C.dragonBodyDk);    // approaching tip
    p(58, baseB + 1, 4, 2, C.dragonBodyDk);    // wing TIP curving downward+back

    // Wing fingers (membrane bones) — fan DOWN from leading edge to body
    p(22, baseB + 2, 1, 8, C.dragonBodyDk);    // finger 1 (shoulder, vertical down)
    p(31, baseB,     1, 11, C.dragonBodyDk);   // finger 2 (long, mid-arc)
    p(39, baseB - 2, 1, 13, C.dragonBodyDk);   // finger 3 (longest, from peak)
    p(48, baseB - 1, 1, 12, C.dragonBodyDk);   // finger 4
    p(56, baseB,     1, 10, C.dragonBodyDk);   // finger 5 (tip, shortest)

    // Membrane panels between fingers — fill BELOW the fingers (between fingers
    // and dragon's back). Each panel scallops with a droop in the middle.
    p(23, baseB + 3, 7, 7, C.dragonBody);      // panel 1
    p(25, baseB + 9, 5, 1, C.dragonBodyDk);    // droop
    p(32, baseB + 1, 6, 9, C.dragonBody);      // panel 2 (taller, peak area)
    p(34, baseB + 9, 4, 1, C.dragonBodyDk);
    p(40, baseB - 1, 7, 11, C.dragonBody);     // panel 3 (tallest, peak)
    p(42, baseB + 9, 5, 1, C.dragonBodyDk);
    p(49, baseB,     6, 9, C.dragonBody);      // panel 4
    p(51, baseB + 8, 4, 1, C.dragonBodyDk);
    p(57, baseB + 1, 4, 7, C.dragonBody);      // panel 5 (tip)

    // Highlight along leading edge to suggest curvature
    p(25, baseB + 1, 5, 1, C.dragonBodyHi);
    p(31, baseB - 1, 5, 1, C.dragonBodyHi);
    p(37, baseB - 3, 5, 1, C.dragonBodyHi);
    p(43, baseB - 3, 5, 1, C.dragonBodyHi);
    p(49, baseB - 2, 5, 1, C.dragonBodyHi);

    // Wing claw at the wing's elbow (small hook on the leading edge)
    p(36, baseB - 5, 1, 1, C.dragonClaw);
    p(35, baseB - 5, 1, 1, C.dragonClaw);

    if (state === 'dying' || state === 'dead') {
      // Tattered membrane — holes torn through panels
      p(26, baseB + 5, 3, 2, C.skyTop);
      p(34, baseB + 4, 3, 2, C.skyTop);
      p(43, baseB + 3, 3, 2, C.skyTop);
    }
  }

  // ---------- Particles (fire breath, sparks, embers) ----------
  const particles = [];
  function spawnFire(x, y, dir, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'fire',
        x, y,
        vx: dir * (0.5 + Math.random() * 1.5),
        vy: -0.6 + Math.random() * 1.2,
        life: 30 + Math.random() * 20,
        max: 50,
      });
    }
  }
  function spawnSpark(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'spark',
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20 + Math.random() * 15,
        max: 35,
      });
    }
  }
  function spawnEmber(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'ember',
        x, y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.4 - Math.random() * 0.8,
        life: 60 + Math.random() * 30,
        max: 90,
      });
    }
  }
  function spawnBlood(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'blood',
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 2,
        life: 30 + Math.random() * 20,
        max: 50,
      });
    }
  }
  function spawnPixelDebris(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'debris',
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 3,
        life: 60 + Math.random() * 30,
        max: 90,
        color: [C.dragonBody, C.dragonBodyDk, C.dragonBelly, C.fire2][Math.floor(Math.random() * 4)],
      });
    }
  }
  function spawnShimmer(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      particles.push({
        type: 'shimmer',
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: -0.2,
        life: 30 + Math.random() * 20,
        max: 50,
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'fire') p.vy += 0.02;
      else if (p.type === 'ember') p.vy -= 0.005;
      else if (p.type === 'spark') { p.vx *= 0.94; p.vy *= 0.94; }
      else if (p.type === 'blood') p.vy += 0.18;
      else if (p.type === 'debris') p.vy += 0.12;
      else if (p.type === 'shimmer') { /* drift */ }
      p.life -= 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const t = p.life / p.max;
      if (p.type === 'fire') {
        const color = t > 0.7 ? C.fire1 : t > 0.4 ? C.fire2 : t > 0.2 ? C.fire3 : C.fire4;
        const s = t > 0.5 ? 2 : 1;
        px(p.x, p.y, s, s, color);
      } else if (p.type === 'spark') {
        px(p.x, p.y, 1, 1, t > 0.5 ? '#fff' : C.fire1);
      } else if (p.type === 'ember' && p.smoke) {
        // Nostril smoke — grayish, fades as it rises
        const c = t > 0.6 ? '#7a6a78' : t > 0.3 ? '#5a4a58' : '#3a2e3a';
        px(p.x, p.y, 1, 1, c);
      } else if (p.type === 'ember') {
        px(p.x, p.y, 1, 1, t > 0.5 ? C.fire1 : C.fire2);
      } else if (p.type === 'blood') {
        px(p.x, p.y, 2, 2, C.blood);
      } else if (p.type === 'debris') {
        px(p.x, p.y, 2, 2, p.color);
      } else if (p.type === 'shimmer') {
        px(p.x, p.y, 1, 1, t > 0.5 ? C.titleHi : C.title);
      }
    }
  }

  // ---------- Title text rendering ----------
  // 5x7 pixel font for tight pixel-art look
  const FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01111','10000','10000','10000','10000','10000','01111'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'G':['01111','10000','10000','10011','10001','10001','01111'],
    'H':['10001','10001','10001','11111','10001','10001','10001'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'J':['11111','00010','00010','00010','00010','10010','01100'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10001','10001','10001','10001'],
    'N':['10001','11001','10101','10011','10001','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'Q':['01110','10001','10001','10001','10101','10010','01101'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'V':['10001','10001','10001','10001','10001','01010','00100'],
    'W':['10001','10001','10001','10001','10101','11011','10001'],
    'X':['10001','10001','01010','00100','01010','10001','10001'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    'Z':['11111','00001','00010','00100','01000','10000','11111'],
    ' ':['00000','00000','00000','00000','00000','00000','00000'],
    '·':['00000','00000','00000','00100','00000','00000','00000'],
    '.':['00000','00000','00000','00000','00000','00000','00100'],
    "'":['00100','00100','00000','00000','00000','00000','00000'],
  };
  function drawText(text, x, y, color, scale = 1) {
    const t = text.toUpperCase();
    let cx = x;
    for (const ch of t) {
      const glyph = FONT[ch] || FONT[' '];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            ctx.fillStyle = color;
            ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
          }
        }
      }
      cx += (5 + 1) * scale;
    }
  }
  function textWidth(text, scale = 1) {
    return text.length * 6 * scale - scale;
  }

  // ---------- Scene state ----------
  // Timeline (cumulative ms):
  // 0-1500   : Sky reveal, stars, distant moon, faint title fade
  // 1500-3500: Knight walks in from left, stops, idle
  // 3500-5000: Dragon flies in from right, roars
  // 5000-7000: Dragon attacks (fire breath), knight readies sword
  // 7000-9000: Knight slashes, dragon takes hits
  // 9000-10000: Final blow, dragon dies, debris explosion
  // 10000-11500: Knight victory pose, sword raised
  // 11500-13500: Logo reveal "FAIRCHILD CONSULTING SERVICES" with shimmer + tagline
  const T = {
    INTRO_END: 1500,
    KNIGHT_IN_END: 3500,
    DRAGON_IN_END: 5000,
    BATTLE_START_END: 7000,
    SLASH_END: 9000,
    DEATH_END: 10000,
    VICTORY_END: 11500,
    LOGO_END: 13500,
  };

  let started = 0;
  let done = false;
  let onComplete = null;

  function frame() {
    if (!started) started = performance.now();
    const elapsed = performance.now() - started;
    const tNorm = clamp(elapsed / TOTAL_DURATION, 0, 1);

    // Apply camera shake by translating the whole frame
    ctx.save();
    if (shakeT > 0) {
      const sx = ((Math.random() - 0.5) * shakeAmp * 2) | 0;
      const sy = ((Math.random() - 0.5) * shakeAmp * 2) | 0;
      ctx.translate(sx, sy);
      shakeT -= 1;
      if (shakeT <= 0) shakeAmp = 0;
    }

    // ---- Background (back-to-front depth) ----
    drawSky(tNorm);
    drawStars(elapsed);
    if (elapsed < T.DRAGON_IN_END) drawMoon();
    drawClouds(elapsed);          // drift behind mountains, in sky layer
    drawMountains();              // 3 ranges: deepest, back, front
    drawHaze(tNorm);              // soft haze blending horizon into mid
    drawGround(tNorm);

    // ---- Scene routing ----
    if (elapsed < T.INTRO_END) {
      drawIntroScene(elapsed);
    } else if (elapsed < T.KNIGHT_IN_END) {
      drawKnightApproach(elapsed - T.INTRO_END, T.KNIGHT_IN_END - T.INTRO_END);
    } else if (elapsed < T.DRAGON_IN_END) {
      drawDragonArrival(elapsed - T.KNIGHT_IN_END, T.DRAGON_IN_END - T.KNIGHT_IN_END);
    } else if (elapsed < T.BATTLE_START_END) {
      drawDragonAttack(elapsed - T.DRAGON_IN_END, T.BATTLE_START_END - T.DRAGON_IN_END);
    } else if (elapsed < T.SLASH_END) {
      drawSlash(elapsed - T.BATTLE_START_END, T.SLASH_END - T.BATTLE_START_END);
    } else if (elapsed < T.DEATH_END) {
      drawDragonDeath(elapsed - T.SLASH_END, T.DEATH_END - T.SLASH_END);
    } else if (elapsed < T.VICTORY_END) {
      drawVictory(elapsed - T.DEATH_END, T.VICTORY_END - T.DEATH_END);
    } else if (elapsed < T.LOGO_END) {
      drawLogoReveal(elapsed - T.VICTORY_END, T.LOGO_END - T.VICTORY_END);
    } else {
      drawFinal();
      if (!done) {
        done = true;
        if (onComplete) onComplete();
      }
    }

    updateParticles();
    drawParticles();

    // Restore from camera shake transform, then draw flash overlay (full-screen)
    ctx.restore();
    drawFlash();

    if (!done) requestAnimationFrame(frame);
    else {
      // Keep drawing the final frame so shimmer continues
      requestAnimationFrame(frame);
    }
  }

  // ---------- Scenes ----------
  function drawIntroScene(t) {
    // Faint subtitle fade-in
    const a = clamp(t / 1200, 0, 1);
    if (a > 0) {
      ctx.globalAlpha = a;
      const text = 'A LEGEND BEGINS';
      const w = textWidth(text, 1);
      drawText(text, (W - w) / 2, 80, C.textDim, 1);
      ctx.globalAlpha = 1;
    }
    // Knight not visible yet
  }

  let knightX = -30;
  function drawKnightApproach(t, dur) {
    const p = clamp(t / dur, 0, 1);
    knightX = lerp(-30, 70, easeOut(p));
    const walkFrame = Math.floor(t / 180);
    drawKnight(knightX, 240, p < 0.85 ? 'walk' : 'idle', walkFrame);

    // Lingering subtitle fading out
    const a = clamp(1 - p * 1.5, 0, 1);
    if (a > 0) {
      ctx.globalAlpha = a;
      const text = 'A LEGEND BEGINS';
      drawText(text, (W - textWidth(text, 1)) / 2, 80, C.textDim, 1);
      ctx.globalAlpha = 1;
    }
  }

  let dragonX = W + 80;
  let dragonY = 70;
  function drawDragonArrival(t, dur) {
    const p = clamp(t / dur, 0, 1);
    // Fly in from right and up
    dragonX = lerp(W + 80, 170, easeOut(p));
    dragonY = lerp(40, 100, easeInOut(p));
    const wingFrame = Math.floor(t / 120);
    const state = p > 0.7 ? 'roar' : 'fly';
    drawDragon(dragonX, dragonY, state, wingFrame);

    // Knight standing ready
    drawKnight(knightX, 240, p > 0.5 ? 'readyAttack' : 'idle', 0);

    // Roar text
    if (state === 'roar' && Math.floor(t / 100) % 4 < 3) {
      drawText('ROAR!', dragonX - 20, dragonY - 32, C.fire1, 1);
    }

    // Wing-flap embers
    if (Math.random() < 0.3) {
      spawnEmber(dragonX + 10, dragonY + 10, 1);
    }
  }

  function drawDragonAttack(t, dur) {
    const p = clamp(t / dur, 0, 1);
    const wingFrame = Math.floor(t / 130);

    // Dragon hovers and breathes fire
    const hover = Math.sin(t * 0.005) * 3;
    drawDragon(170, 100 + hover, 'attack', wingFrame);

    // Fire breath pouring left toward knight
    // (dragon is 2x scaled, head at sprite-x=0-16 = canvas-x ~ ax-64..ax-32)
    const fireOriginX = 170 - 60; // dragon snout
    const fireOriginY = 100 + hover + 12;
    if (p > 0.2 && p < 0.95) {
      spawnFire(fireOriginX, fireOriginY, -1, 3);
    }

    // Knight defending - readyAttack stance, with slight back-step
    const dodge = Math.sin(t * 0.012) * 1;
    drawKnight(knightX + dodge, 240, 'readyAttack', 0);

    // Embers from wings
    if (Math.random() < 0.4) spawnEmber(170 + (Math.random() - 0.5) * 30, 80, 1);
  }

  let dragonHits = 0;
  let dragonDying = false;
  let dragonDeathTimer = 0;
  function drawSlash(t, dur) {
    const p = clamp(t / dur, 0, 1);

    // Knight charges and slashes
    const knightCharge = lerp(knightX, knightX + 50, easeIn(p));
    const wingFrame = Math.floor(t / 130);

    // Dragon swoops down to engage
    const dragonY2 = lerp(100, 160, easeOut(p));
    const dragonX2 = lerp(170, 150, easeInOut(p));

    // Multiple slash beats — each one shakes the camera + sparks + blood
    const beats = [0.15, 0.4, 0.65, 0.88]; // p values for slash impacts
    let isHit = false;
    for (const beat of beats) {
      if (Math.abs(p - beat) < 0.04) {
        isHit = true;
        if (Math.abs(p - beat) < 0.005) {
          spawnSpark(dragonX2 - 15, dragonY2, 18);
          spawnBlood(dragonX2 - 15, dragonY2, 10);
          // Each progressively stronger camera shake — escalating combat
          triggerShake(2 + dragonHits, 8 + dragonHits * 2);
          // Subtle red-tinted flash on impact
          triggerFlash('255,80,40', 4);
          dragonHits++;
        }
      }
    }

    drawDragon(dragonX2, dragonY2, isHit ? 'hit' : 'attack', wingFrame);

    // Knight slashing
    const slashFrame = Math.floor(t / 120);
    drawKnight(knightCharge, 240, 'slash', slashFrame);

    // Lingering fire from prior scene
    if (Math.random() < 0.2) spawnFire(dragonX2 - 30, dragonY2 + 15, -1, 1);
  }

  function drawDragonDeath(t, dur) {
    const p = clamp(t / dur, 0, 1);
    // Dragon falling, body fading
    const dragonFallY = lerp(160, 230, easeIn(p));
    const dragonFallX = lerp(150, 130, p);
    const wingFrame = Math.floor(t / 200);
    const state = p < 0.5 ? 'dying' : 'dead';

    if (p < 0.95) {
      ctx.globalAlpha = lerp(1, 0.4, p);
      drawDragon(dragonFallX, dragonFallY, state, wingFrame);
      ctx.globalAlpha = 1;
    }

    // Death blow — heavy shake + debris, no screen flash (cleaner moment)
    if (p < 0.05) {
      spawnPixelDebris(dragonFallX, dragonFallY, 40);
      spawnSpark(dragonFallX, dragonFallY, 30);
      spawnEmber(dragonFallX, dragonFallY, 15);
      triggerShake(5, 22);
    }

    // Knight finishing pose
    drawKnight(knightX + 50, 240, 'slash', 3);

    // Smoke particles rising
    if (Math.random() < 0.5) {
      particles.push({
        type: 'ember',
        x: dragonFallX + (Math.random() - 0.5) * 30,
        y: dragonFallY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.5,
        life: 60,
        max: 60,
      });
    }
  }

  function drawVictory(t, dur) {
    const p = clamp(t / dur, 0, 1);
    // Knight raises sword
    drawKnight(knightX + 50, 240, 'victory', 0);

    // Embers floating
    if (Math.random() < 0.3) {
      spawnEmber(W * Math.random(), 280 + Math.random() * 40, 1);
    }

    // Sword shimmer at peak
    if (p > 0.3) {
      const sx = knightX + 50 + 9; // sword tip approx
      const sy = 240 - 36 - 22;
      if (Math.random() < 0.5) {
        spawnShimmer(sx, sy, 1);
      }
      // Star burst at sword tip
      if (Math.floor(t / 100) % 6 === 0) {
        const r = 4;
        for (let i = 0; i < 4; i++) {
          const ang = i * Math.PI / 2 + (t * 0.001);
          px(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r, 1, 1, C.titleHi);
        }
      }
    }
  }

  function drawLogoReveal(t, dur) {
    const p = clamp(t / dur, 0, 1);

    // Darken sky for emphasis (deeper than before)
    ctx.globalAlpha = clamp(p * 0.75, 0, 0.75);
    px(0, 0, W, H, '#000');
    ctx.globalAlpha = 1;

    // Sword-plant moment: at p~0.05, knight slams sword into ground.
    // Trigger ground shake + dust ring + screen flash + light rays.
    if (p > 0.04 && p < 0.06 && t % 16 < 1) {
      triggerShake(4, 14);
      triggerFlash('255,247,196', 12);
    }

    // Expanding gold dust ring radiating from sword tip (~0.05-0.45 of reveal)
    const swordTipX = knightX + 50 + 9;   // sword stuck in ground at knight position
    const swordTipY = 240 - 14;
    if (p > 0.03 && p < 0.5) {
      const ringP = clamp((p - 0.03) / 0.32, 0, 1);
      const r = ringP * 110;
      const ringFade = (1 - ringP) * 0.85;
      // Pixel-art expanding ring (4 quadrant arcs sampled)
      ctx.fillStyle = 'rgba(240,193,74,' + ringFade.toFixed(2) + ')';
      const segments = 32;
      for (let i = 0; i < segments; i++) {
        const ang = (i / segments) * Math.PI * 2;
        const rx = swordTipX + Math.cos(ang) * r;
        const ry = swordTipY + Math.sin(ang) * r * 0.45; // squashed (perspective)
        ctx.fillRect(rx | 0, ry | 0, 1, 1);
      }
      // Spawn drifting dust motes from ring on each frame
      if (Math.random() < 0.6) {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          type: 'shimmer',
          x: swordTipX + Math.cos(ang) * r,
          y: swordTipY + Math.sin(ang) * r * 0.45,
          vx: Math.cos(ang) * 0.3,
          vy: -0.15 - Math.random() * 0.3,
          life: 40 + Math.random() * 30,
          max: 70,
        });
      }
    }

    // Four light rays bursting from sword tip — appear during letter reveal
    if (p > 0.08 && p < 0.85) {
      const rayP = clamp((p - 0.08) / 0.4, 0, 1);
      const rayLen = 60 + rayP * 90;
      const rayAlpha = 0.08 + Math.sin(rayP * Math.PI) * 0.18;
      const angles = [-Math.PI / 4, -Math.PI / 8, Math.PI / 8, Math.PI / 4];
      for (const ang of angles) {
        ctx.fillStyle = 'rgba(255,247,196,' + rayAlpha.toFixed(3) + ')';
        for (let r = 0; r < rayLen; r += 2) {
          const rx = swordTipX + Math.cos(ang - Math.PI / 2) * r;
          const ry = swordTipY + Math.sin(ang - Math.PI / 2) * r;
          const w = 1 + (1 - r / rayLen) * 1.5;
          ctx.fillRect((rx - w / 2) | 0, (ry - w / 2) | 0, (w | 0) || 1, (w | 0) || 1);
        }
      }
    }

    if (p < 0.85) {
      ctx.globalAlpha = lerp(1, 0.4, p);
      drawKnight(knightX + 50, 240, 'victory', 0);
      ctx.globalAlpha = 1;
    }

    drawLogo(p);

    if (Math.random() < 0.7) spawnShimmer(W / 2, 180, 1);
  }

  function drawLogo(p) {
    const line1 = 'FAIRCHILD';
    const line2 = 'CONSULTING SERVICES';
    const tagline = 'CUSTOM AI · WORKFLOWS · WEB';
    const scale1 = 2;
    const w1 = textWidth(line1, scale1);
    const x1 = (W - w1) / 2;
    const y1 = 150;
    const w2 = textWidth(line2, 1);
    const x2 = (W - w2) / 2;
    const y2 = y1 + 7 * scale1 + 8;
    const wT = textWidth(tagline, 1);
    const xT = (W - wT) / 2;
    const yT = y2 + 12;
    const reveal1 = clamp((p - 0.05) * 2.5, 0, 1) * line1.length;
    const reveal2 = clamp((p - 0.45) * 2.5, 0, 1) * line2.length;
    const taglineFade = clamp((p - 0.75) * 4, 0, 1);
    const ulW = w1 + 8;
    for (let i = 0; i < Math.floor(reveal1); i++) {
      const ch = line1[i];
      drawText(ch, x1 + i * 6 * scale1, y1, C.title, scale1);
      drawText(ch, x1 + i * 6 * scale1, y1 - 1, C.titleHi, scale1);
    }
    for (let i = 0; i < Math.floor(reveal2); i++) {
      const ch = line2[i];
      drawText(ch, x2 + i * 6, y2, C.title, 1);
    }
    if (taglineFade > 0) {
      ctx.globalAlpha = taglineFade;
      drawText(tagline, xT, yT, C.text, 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawFinal() {
    ctx.globalAlpha = 0.6;
    px(0, 0, W, H, '#000');
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5;
    drawKnight(knightX + 50, 240, 'victory', 0);
    ctx.globalAlpha = 1;
    drawLogo(1);
    if (Math.random() < 0.5) spawnShimmer(W / 2, 180, 1);
  }

  // ---------- Public API ----------
  window.FairchildIntro = {
    start(callback) {
      onComplete = callback || null;
      started = 0;
      done = false;
      requestAnimationFrame(frame);
    },
    skip() {
      done = true;
      if (onComplete) onComplete();
    },
  };
})();
