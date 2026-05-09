# Deploy to GitHub Pages

You'll have a live URL in about 10 minutes. Total cost: $0 (or ~$10/yr if you buy a custom domain).

## Step 1 — Create the GitHub repo (3 min)

1. Sign up / log in at https://github.com
2. Click **+ → New repository** in the top right
3. Name it `fairchild-consulting` (or whatever you want — this becomes part of the URL)
4. Set it to **Public** (required for free GitHub Pages)
5. Do **not** initialize with a README — we already have files
6. Click **Create repository**

## Step 2 — Push these files (5 min)

GitHub will show you commands. Use the "...or push an existing repository from the command line" block. From a terminal in this folder:

```bash
git init
git add .
git commit -m "Initial portfolio + dragon intro"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fairchild-consulting.git
git push -u origin main
```

If you don't have git installed, install it from https://git-scm.com/downloads — or use GitHub Desktop (https://desktop.github.com) and skip the command line entirely.

## Step 3 — Turn on GitHub Pages (2 min)

1. In your new repo, click **Settings** (top-right tab)
2. In the left sidebar, click **Pages**
3. Under **Source**, choose **Deploy from a branch**
4. Branch: `main`, folder: `/ (root)`. Click **Save**.
5. Wait ~60 seconds. The page will refresh with your URL, something like:
   `https://YOUR-USERNAME.github.io/fairchild-consulting/`

That URL points to `index.html`. The QR-code intro lives at:

```
https://YOUR-USERNAME.github.io/fairchild-consulting/intro.html
```

## Step 4 — Regenerate the QR code with your real URL

1. Open `scripts/make_qr.py`
2. Change `URL_TO_ENCODE` to the intro URL above
3. From a terminal in this folder, run:
   ```bash
   pip install qrcode pillow
   python3 scripts/make_qr.py
   ```
   (Or `pip3 install …` / `python make_qr.py` depending on your system.)
4. Three files refresh in `assets/`:
   - `qr.png` — bare QR (use anywhere)
   - `qr-card.png` — dark theme pitch card (digital, screen)
   - `qr-card-light.png` — light theme pitch card (printer-friendly)
5. Commit + push the new images:
   ```bash
   git add assets/
   git commit -m "QR code with live URL"
   git push
   ```

## Step 5 — Pitch day

- Print `assets/qr-card-light.png` on cardstock at 7x10 in. Looks great as a handout.
- For on-screen display (e.g. projecting at a meetup), use `qr-card.png` (dark theme).
- **Test the QR yourself first:** scan it with your phone, watch the dragon fall, land on the portfolio. If it doesn't scan, regenerate after re-checking the URL.

## Optional — Custom domain ($10/yr-ish)

If you'd rather pitch `fairchildconsulting.com` than `YOUR-USERNAME.github.io/fairchild-consulting`:

1. Buy a domain (Namecheap, Porkbun, Cloudflare Registrar, etc.)
2. In your domain registrar's DNS settings, add these records:
   ```
   A     @     185.199.108.153
   A     @     185.199.109.153
   A     @     185.199.110.153
   A     @     185.199.111.153
   CNAME www   YOUR-USERNAME.github.io
   ```
3. In your repo: **Settings → Pages → Custom domain** → enter your domain → Save.
4. Wait for DNS to propagate (5 min – 24 hr).
5. Re-run `make_qr.py` with the new URL.

## Updating the site

Any edit you make in this folder, just commit and push:

```bash
git add .
git commit -m "Updated services copy"
git push
```

GitHub Pages rebuilds in ~60 seconds.

## Troubleshooting

- **Page is blank** — wait 90 seconds after enabling Pages, then hard-refresh (Ctrl/Cmd + Shift + R)
- **Animation doesn't autoplay on iPhone** — iOS sometimes blocks `requestAnimationFrame` until first user interaction; the "Tap anywhere to skip" prompt also acts as a tap-to-start fallback. Tapping is enough.
- **QR code won't scan** — make sure the printed size is at least 1.5 inches square; very glossy paper can confuse some phone cameras
- **404 on `intro.html`** — confirm the URL ends in `/intro.html` (case-sensitive on GitHub Pages)
