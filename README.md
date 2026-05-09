# Fairchild Consulting Services — Portfolio Site

A pitch-ready portfolio site with a hand-coded pixel-art cinematic that plays when audience members scan a QR code. Built for an in-person pitch to MTG artists.

## What's in here

```
.
├── index.html              # Main portfolio page
├── intro.html              # Animation page (where the QR points)
├── DEPLOY.md               # GitHub Pages deployment walkthrough (10 min)
├── README.md               # This file
├── css/
│   └── styles.css          # Dark+modern hybrid theme with fantasy accents
├── js/
│   └── animation.js        # ~700 lines of original pixel-art canvas animation
├── assets/
│   ├── favicon.svg         # Sword + spark crest
│   ├── qr.png              # Bare QR code (regenerate after deploy)
│   ├── qr-card.png         # Dark-theme pitch card (1400x2000, on-screen)
│   └── qr-card-light.png   # Light-theme pitch card (printable)
└── scripts/
    └── make_qr.py          # Regenerates QR + card after URL changes
```

## How it works

1. You hand someone the printed pitch card OR show it on a screen.
2. They scan the QR with their phone — opens `intro.html` on their browser.
3. A 13-second pixel-art cinematic plays: knight enters, dragon arrives, battle, slay, "FAIRCHILD CONSULTING SERVICES" logo reveal.
4. After the animation, an "Enter the Portfolio" button appears and auto-redirects to `index.html`.
5. They can tap anywhere on the canvas to skip.

## Things to do before pitch day

| | |
|---|---|
| 1 | Open `intro.html` locally and watch the animation end-to-end. Tap to skip. Confirm logo reveal looks crisp. |
| 2 | Open `index.html`. Replace placeholder project cards (search `data-edit="project-1"` etc.) with real projects. |
| 3 | Update hero stats in `index.html` (search `data-edit="hero-stat-`). |
| 4 | (Optional) Add a real photo: drop `portrait.jpg` in `assets/` and replace the SVG block in the About section. |
| 5 | Follow `DEPLOY.md` to publish to GitHub Pages. |
| 6 | Edit `URL_TO_ENCODE` in `scripts/make_qr.py` to your live `/intro.html` URL. |
| 7 | Run `python3 scripts/make_qr.py` to regenerate the QR. |
| 8 | Commit and push. |
| 9 | Print `assets/qr-card-light.png` on cardstock at 7x10 inches. |
| 10 | Scan it yourself end-to-end on your own phone. |

## Local preview (no server needed)

Just open `index.html` and `intro.html` in your browser by double-clicking them. The site is a static HTML/CSS/JS bundle with no build step.

If you want a local server (more reliable for some browsers):

```bash
# From this folder:
python3 -m http.server 8000
# Then visit http://localhost:8000/intro.html
```

## Editing copy

All copy lives in `index.html`. The most-edited sections are tagged with `data-edit="..."` attributes so you can grep for them. Project cards are tagged `data-edit="project-1"` through `project-6`.

## Editing the animation

`js/animation.js` is a single file with named scenes (`drawIntroScene`, `drawKnightApproach`, `drawDragonArrival`, `drawDragonAttack`, `drawSlash`, `drawDragonDeath`, `drawVictory`, `drawLogoReveal`). The timeline lives in the `T` object near the bottom.

Each sprite is procedurally drawn with `fillRect` calls — no external images. To change the knight's color scheme, edit the `C` palette object near the top.

## Tools used

- **HTML5 Canvas** — for the pixel-art animation
- **Google Fonts** (Cinzel + Inter + JetBrains Mono) — typography
- **Python 3 + `qrcode` + `Pillow`** — QR card generation
- **GitHub Pages** — free static hosting

No frameworks, no build tooling, no JavaScript dependencies. The whole site loads in under 100 KB on first paint (excluding fonts).

## License

Yours. Do whatever you want with the code.
