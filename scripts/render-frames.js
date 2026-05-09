// Render representative frames of the cinematic in node, using @napi-rs/canvas.
// We shim window/document/performance to drive the animation loop deterministically.

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const W = 240, H = 426;
const canvas = createCanvas(W, H);

// Mock browser-ish globals
const fakeCanvasEl = canvas;  // close enough for getContext
fakeCanvasEl.getContext = canvas.getContext.bind(canvas);
fakeCanvasEl.width = W;
fakeCanvasEl.height = H;

let mockNow = 0;
const rafQueue = [];

const sandbox = {
  // Browser-ish
  document: {
    getElementById: (id) => {
      if (id === 'intro-canvas') return fakeCanvasEl;
      return null;
    },
  },
  window: {},
  performance: { now: () => mockNow },
  requestAnimationFrame: (cb) => { rafQueue.push(cb); return 0; },
  Math: Math,
  console: console,
};
sandbox.window = sandbox; // FairchildIntro is attached to window

// Load animation.js
const src = fs.readFileSync(
  '/sessions/elegant-determined-bell/mnt/Portfolio Webpage - Fairchild Consulting Services/js/animation.js',
  'utf8'
);

// Run it in our sandbox
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

// FairchildIntro should now be on the sandbox (window)
const intro = sandbox.FairchildIntro;
if (!intro) {
  console.error('FairchildIntro not found on window');
  process.exit(1);
}

// Drive the animation
const checkpoints = [
  { name: '01-intro',         ms: 800 },
  { name: '02-knight-walk',   ms: 2500 },
  { name: '03-dragon-arrive', ms: 4500 },
  { name: '04-fire-breath',   ms: 6000 },
  { name: '05-slash',         ms: 8000 },
  { name: '06-death',         ms: 9500 },
  { name: '07-victory',       ms: 10800 },
  { name: '08-logo',          ms: 12500 },
  { name: '09-final',         ms: 13800 },
];

function step(toMs) {
  // Advance time in ~16ms increments, popping rAF callbacks each tick
  while (mockNow < toMs) {
    mockNow += 16;
    const queue = rafQueue.splice(0, rafQueue.length);
    for (const cb of queue) {
      try { cb(); } catch (e) { console.error('frame error:', e); }
    }
  }
}

intro.start(() => { /* on complete */ });

for (const cp of checkpoints) {
  step(cp.ms);
  // Render one more frame at exactly cp.ms (in case rAF queue empty)
  const queue = rafQueue.splice(0, rafQueue.length);
  for (const cb of queue) { try { cb(); } catch (e) {} }

  const out = path.join('/sessions/elegant-determined-bell/mnt/outputs', `frame-${cp.name}.png`);
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('wrote', out);
}

console.log('done');
