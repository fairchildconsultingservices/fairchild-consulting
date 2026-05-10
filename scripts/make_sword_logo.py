# -*- coding: utf-8 -*-
"""Generate a clean sword crest logo at multiple sizes.
Run:  python scripts/make_sword_logo.py
Outputs (in assets/):
    sword-logo-512.png     square 512x512 transparent PNG
    sword-logo-1024.png    square 1024x1024 transparent PNG
    sword-logo-square.png  256x256 with dark background (good for bookmarks)
    sword-logo-banner.png  1200x630 social share image
"""
from pathlib import Path
from PIL import Image, ImageDraw

SCRIPT_DIR = Path(__file__).resolve().parent
OUT_DIR = SCRIPT_DIR.parent / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

GOLD     = (240, 193, 74, 255)
GOLD_HI  = (255, 247, 196, 255)
GOLD_DK  = (160, 120, 32, 255)
PURPLE   = (90, 58, 160, 255)
PURPLE_DK = (60, 38, 110, 255)
SPARK    = (255, 247, 196, 255)
DARK     = (14, 8, 32, 255)


def draw_sword(canvas, scale=16, ox=None, oy=None, with_spark=True):
    """Draw a sword crest centered on the canvas. scale = pixels per "unit" (sprite is 32x32 units)."""
    W, H = canvas.size
    draw = ImageDraw.Draw(canvas)
    # Default center the 32-unit sprite on canvas
    if ox is None: ox = (W - 32 * scale) // 2
    if oy is None: oy = (H - 32 * scale) // 2

    def rect(x, y, w, h, fill):
        draw.rectangle(
            [ox + x * scale, oy + y * scale,
             ox + (x + w) * scale - 1, oy + (y + h) * scale - 1],
            fill=fill,
        )

    # Blade — gradient from base (gold) to tip (gold-hi)
    for i in range(20):
        t = i / 19
        r = int(GOLD[0] + (GOLD_HI[0] - GOLD[0]) * (1 - t))
        g = int(GOLD[1] + (GOLD_HI[1] - GOLD[1]) * (1 - t))
        b = int(GOLD[2] + (GOLD_HI[2] - GOLD[2]) * (1 - t))
        rect(15, 2 + i, 2, 1, (r, g, b, 255))

    # Blade highlight stripe (left edge)
    for i in range(18):
        rect(15, 3 + i, 1, 1, GOLD_HI)
    # Blade dark edge (right side)
    for i in range(18):
        rect(16, 3 + i, 1, 1, GOLD_DK)

    # Crossguard
    rect(11, 20, 10, 2, GOLD)
    rect(11, 20, 10, 1, GOLD_HI)
    rect(11, 21, 10, 1, GOLD_DK)
    # Crossguard endcaps
    rect(10, 20, 1, 2, GOLD_DK)
    rect(21, 20, 1, 2, GOLD_DK)

    # Hilt (handle wrap)
    rect(14, 22, 4, 6, PURPLE)
    rect(14, 22, 4, 1, PURPLE_DK)
    rect(14, 27, 4, 1, PURPLE_DK)
    # Hilt wrap stripes
    rect(14, 23, 4, 1, PURPLE_DK)
    rect(14, 25, 4, 1, PURPLE_DK)

    # Pommel
    rect(15, 28, 2, 2, GOLD)
    rect(15, 28, 2, 1, GOLD_HI)
    rect(15, 30, 2, 1, GOLD_DK)
    rect(14, 28, 1, 2, GOLD_DK)
    rect(17, 28, 1, 2, GOLD_DK)

    # Spark above the blade
    if with_spark:
        rect(15, 0, 2, 2, SPARK)
        rect(13, 1, 1, 1, GOLD)
        rect(18, 1, 1, 1, GOLD)


# 1) Transparent square 512
img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw_sword(img, scale=14)
img.save(OUT_DIR / "sword-logo-512.png")
print("sword-logo-512.png        -> 512x512 transparent")

# 2) Transparent square 1024
img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
draw_sword(img, scale=28)
img.save(OUT_DIR / "sword-logo-1024.png")
print("sword-logo-1024.png       -> 1024x1024 transparent")

# 3) Bookmark-ready: dark rounded square with sword centered
img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
# Rounded dark background
draw.rounded_rectangle([0, 0, 255, 255], radius=42, fill=DARK)
# Subtle gold border
draw.rounded_rectangle([4, 4, 251, 251], radius=38, outline=GOLD, width=2)
draw_sword(img, scale=7)
img.save(OUT_DIR / "sword-logo-square.png")
print("sword-logo-square.png     -> 256x256 with dark background")

# 4) Social share banner (1200x630, sword + brand)
img = Image.new("RGBA", (1200, 630), DARK)
draw = ImageDraw.Draw(img)
# Subtle radial vignette
for i in range(0, 200, 4):
    alpha = int(40 * (1 - i / 200))
    draw.ellipse([-i, -i, 1200 + i, 630 + i],
                 outline=(155, 108, 255, max(0, alpha)))
# Border
draw.rectangle([20, 20, 1180, 610], outline=GOLD, width=4)
draw.rectangle([34, 34, 1166, 596], outline=GOLD, width=1)
# Center the sword
draw_sword(img, scale=12, ox=584, oy=119)
img.save(OUT_DIR / "sword-logo-banner.png")
print("sword-logo-banner.png     -> 1200x630 social share")

print()
print("All saved to assets/.")
