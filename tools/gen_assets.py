"""Generate PNG artwork for SalatWatch (GTR4, 466x466).

Outputs (in assets/default/):
  needle_north.png   40x360  red north needle w/ grey tail, pivot at (20,180)
  needle_qibla.png   40x360  gold qibla needle, pivot at (20,180)
  mosque_skyline.png 466x110 dark-emerald mosque silhouette, transparent bg

All drawn at 4x and downsampled with LANCZOS for antialiasing.
"""
from PIL import Image, ImageDraw

SS = 4  # supersample factor
OUT = "assets/default"

GOLD = (212, 168, 75, 255)
GOLD_LIGHT = (240, 208, 120, 255)
RED = (232, 80, 80, 255)
GREY = (110, 130, 150, 255)
EMERALD_SIL = (16, 42, 30, 255)


def canvas(w, h):
    img = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def save(img, w, h, name):
    img = img.resize((w, h), Image.LANCZOS)
    img.save(f"{OUT}/{name}")
    print("wrote", name)


def s(*pts):
    return [(x * SS, y * SS) for x, y in pts]


# ── North needle (points up, pivot at 20,180) ──────────────────────────
W, H = 40, 360
img, d = canvas(W, H)
# red kite: tip at top, widest near pivot
d.polygon(s((20, 10), (29, 168), (20, 178), (11, 168)), fill=RED)
# lighter inner highlight
d.polygon(s((20, 10), (24, 100), (20, 130), (16, 100)), fill=(255, 130, 130, 255))
# grey south tail
d.polygon(s((20, 350), (27, 192), (20, 182), (13, 192)), fill=GREY)
save(img, W, H, "needle_north.png")

# ── Qibla needle (gold, points up, pivot at 20,180) ────────────────────
img, d = canvas(W, H)
d.polygon(s((20, 8), (30, 150), (20, 190), (10, 150)), fill=GOLD)
d.polygon(s((20, 8), (25, 70), (20, 95), (15, 70)), fill=GOLD_LIGHT)
# small diamond tip accent
d.polygon(s((20, 2), (26, 14), (20, 26), (14, 14)), fill=GOLD_LIGHT)
save(img, W, H, "needle_qibla.png")

# ── Mosque skyline 466x110 ──────────────────────────────────────────────
W, H = 466, 110
img, d = canvas(W, H)
c = EMERALD_SIL
# ground band
d.rectangle(s((0, 84), (466, 110)), fill=c)
# side wings
d.rectangle(s((120, 72), (346, 110)), fill=c)
# central hall
d.rectangle(s((173, 58), (293, 110)), fill=c)
# dome (upper half sits above the hall)
d.ellipse(s((195, 24), (271, 100)), fill=c)
# dome finial
d.rectangle(s((231, 12), (235, 30)), fill=c)
d.ellipse(s((228, 4), (238, 14)), fill=c)
# left minaret
d.rectangle(s((88, 32), (100, 110)), fill=c)
d.rectangle(s((84, 56), (104, 63)), fill=c)   # balcony
d.polygon(s((94, 6), (103, 34), (85, 34)), fill=c)  # pointed cap
# right minaret
d.rectangle(s((366, 32), (378, 110)), fill=c)
d.rectangle(s((362, 56), (382, 63)), fill=c)
d.polygon(s((372, 6), (381, 34), (363, 34)), fill=c)
# small side domes
d.ellipse(s((132, 56), (168, 92)), fill=c)
d.ellipse(s((298, 56), (334, 92)), fill=c)
save(img, W, H, "mosque_skyline.png")
