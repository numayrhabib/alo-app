"""Draws the Alo app icons (white lightning bolt on amber) so no image files need to be stored."""
from pathlib import Path
from PIL import Image, ImageDraw

AMBER = (232, 154, 12, 255)
BOLT = [(13, 2), (4, 14), (11, 14), (10, 22), (19, 10), (12, 10)]  # 24x24 grid


def bolt(draw, size, scale, offset):
    pts = [(offset + x * scale, offset + y * scale) for x, y in BOLT]
    draw.polygon(pts, fill=(255, 255, 255, 255))


def main():
    out = Path(__file__).parent / "assets"
    out.mkdir(exist_ok=True)
    s = 1024
    # launcher icon: rounded amber square with the bolt
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s, s], radius=220, fill=AMBER)
    bolt(d, s, 30, s / 2 - 12 * 30)
    img.save(out / "icon.png")
    # adaptive icon foreground: bolt only, inside the 66% safe zone
    fg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bolt(ImageDraw.Draw(fg), s, 22, s / 2 - 12 * 22)
    fg.save(out / "adaptive-icon.png")
    # splash
    sp = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bolt(ImageDraw.Draw(sp), s, 26, s / 2 - 12 * 26)
    sp.save(out / "splash-icon.png")
    # favicon (unused on Android, kept so template references resolve)
    img.resize((48, 48)).save(out / "favicon.png")


if __name__ == "__main__":
    main()
