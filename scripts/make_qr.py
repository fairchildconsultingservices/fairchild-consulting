# -*- coding: utf-8 -*-
"""Generate a QR code + branded pitch card for Fairchild Consulting Services.

Run:        python3 make_qr.py
Outputs:    assets/qr.png             - bare QR (high contrast)
            assets/qr-card.png        - 7x10 pitch card, dark theme
            assets/qr-card-light.png  - 7x10 pitch card, light theme (printer-friendly)

After deploying to GitHub Pages, edit URL_TO_ENCODE below and re-run.
"""
from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

# ===== EDIT ME after deploying =====
URL_TO_ENCODE = "https://YOUR-USERNAME.github.io/fairchild-consulting/intro.html"
# ====================================

OUT_DIR = Path("/sessions/elegant-determined-bell/mnt/Portfolio Webpage - Fairchild Consulting Services/assets")
OUT_DIR.mkdir(parents=True, exist_ok=True)

GOLD     = (240, 193, 74, 255)
GOLD_HI  = (255, 247, 196, 255)
DARK     = (14, 8, 32, 255)
DARKER   = (8, 4, 15, 255)
PURPLE   = (155, 108, 255, 255)
TEXT     = (246, 241, 227, 255)
TEXT_DIM = (200, 191, 168, 255)


def make_qr(url, fg=DARK, bg=(255, 255, 255), box=20, border=2):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=fg[:3] if isinstance(fg, tuple) else fg,
                         back_color=bg).convert("RGBA")


# 1) Bare QR
qr_img = make_qr(URL_TO_ENCODE)
qr_img.save(OUT_DIR / "qr.png")
print("qr.png        ->", qr_img.size)


def load_font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


def centered(draw, s, y, font, fill, w):
    bbox = draw.textbbox((0, 0), s, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, y), s, font=font, fill=fill)


def make_card(theme="dark"):
    W, H = 1400, 2000
    if theme == "dark":
        bg, gold, gold_hi, text, text_dim, purple = DARKER, GOLD, GOLD_HI, TEXT, TEXT_DIM, PURPLE
    else:
        bg       = (252, 248, 238, 255)
        gold     = (160, 120, 32,  255)
        gold_hi  = (160, 120, 32,  255)
        text     = (40,  28,  60,  255)
        text_dim = (90,  80,  100, 255)
        purple   = (90,  58,  160, 255)

    card = Image.new("RGBA", (W, H), bg)
    draw = ImageDraw.Draw(card)

    if theme == "dark":
        for i in range(0, 280, 6):
            a = int(28 * (1 - i / 280))
            draw.ellipse([-i, -i, W + i, H + i],
                         outline=(155, 108, 255, max(0, a)))

    B = 60
    draw.rectangle([B, B, W - B, H - B], outline=gold, width=4)
    draw.rectangle([B + 14, B + 14, W - B - 14, H - B - 14], outline=gold, width=1)

    def corner(cx, cy):
        L = 24
        draw.line([cx - L, cy, cx + L, cy], fill=gold_hi, width=4)
        draw.line([cx, cy - L, cx, cy + L], fill=gold_hi, width=4)
    for cx, cy in [(B + 14, B + 14), (W - B - 14, B + 14),
                   (B + 14, H - B - 14), (W - B - 14, H - B - 14)]:
        corner(cx, cy)

    title_font  = load_font(120, bold=True)
    sub_font    = load_font(48,  bold=False)
    sub_font_b  = load_font(54,  bold=True)
    small_font  = load_font(36,  bold=False)
    mono_font   = load_font(30,  bold=False)

    # Crest
    cx, cy_crest = W // 2, 180
    crest = 120
    draw.rectangle([cx - 7, cy_crest, cx + 7, cy_crest + crest], fill=gold)
    draw.rectangle([cx - 32, cy_crest + crest - 22, cx + 32, cy_crest + crest - 10], fill=gold)
    draw.rectangle([cx - 14, cy_crest + crest - 10, cx + 14, cy_crest + crest + 22], fill=purple)
    draw.rectangle([cx - 6,  cy_crest + crest + 22, cx + 6,  cy_crest + crest + 30], fill=gold)
    draw.rectangle([cx - 5, cy_crest - 22, cx + 5, cy_crest - 12], fill=gold_hi)
    draw.rectangle([cx - 1, cy_crest - 30, cx + 1, cy_crest - 22], fill=gold_hi)

    # Title block
    centered(draw, "FAIRCHILD",            380, title_font, gold,    W)
    centered(draw, "Consulting Services",  530, sub_font,    text,    W)
    centered(draw, "Custom AI - Workflows - Web", 620, small_font, text_dim, W)

    # QR with white frame
    qr_size = 760
    q = make_qr(URL_TO_ENCODE).resize((qr_size, qr_size), Image.NEAREST)
    pad = 28
    qx = (W - qr_size) // 2
    qy = 740
    box = (qx - pad, qy - pad, qx + qr_size + pad, qy + qr_size + pad)
    draw.rectangle(box, fill=(255, 255, 255, 255))
    draw.rectangle([box[0] - 4, box[1] - 4, box[2] + 4, box[3] + 4],
                   outline=gold, width=4)
    card.paste(q, (qx, qy))
    draw = ImageDraw.Draw(card)

    # Footer
    centered(draw, "* SCAN TO BEGIN *",            1640, sub_font_b, gold_hi, W)
    centered(draw, "A legend awaits.",             1720, sub_font,   text,    W)
    centered(draw, "fairchildconsultings@gmail.com", 1830, mono_font, text_dim, W)

    return card


dark = make_card("dark")
dark.save(OUT_DIR / "qr-card.png")
print("qr-card.png        ->", dark.size, "(dark)")

light = make_card("light")
light.save(OUT_DIR / "qr-card-light.png")
print("qr-card-light.png  ->", light.size, "(light)")

print()
print("Edit URL_TO_ENCODE in scripts/make_qr.py and re-run after deploying.")
