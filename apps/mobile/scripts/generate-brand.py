#!/usr/bin/env python3
"""HERE marka varlıklarını tek kaynaktan üretir.

Logo, kalın geometrik harflerden (H, E, R, E) oluşan bir vektör çizimdir; harf yüksekliği
100 birim, çizgi kalınlığı 20 birimdir. Bu betik şunları üretir:

  src/components/wordmark-path.ts         uygulama içi logo (react-native-svg)
  assets/brand/here-wordmark.svg          düz SVG logo
  assets/here.icon/                       iOS 26+ Liquid Glass simgesi (Icon Composer biçimi)
  assets/images/icon.png                  1024 px simge (Android eski sürüm, web)
  assets/images/android-icon-*.png        Android uyarlanabilir simge katmanları
  assets/images/splash-icon.png           açılış ekranı logosu
  assets/images/favicon.png               web favicon

Kullanım (apps/mobile içinden; Pillow gerekir: python3 -m pip install pillow):
  python3 scripts/generate-brand.py
"""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

FUCHSIA = (0xE1, 0x1D, 0x49)          # Wild Fuchsia #E11D49
WHITE = (255, 255, 255)

S = 20                                 # çizgi kalınlığı
GAP = 14                               # harf aralığı
H_W, E_W, R_W = 76, 58, 78             # harf genişlikleri
WIDTH = H_W + E_W + R_W + E_W + 3 * GAP  # 312
HEIGHT = 100


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def arc(cx, cy, r, start_deg, end_deg, steps=48):
    """Ekran koordinatlarında (y aşağı) saat yönünde yay noktaları."""
    pts = []
    for i in range(steps + 1):
        t = math.radians(start_deg + (end_deg - start_deg) * i / steps)
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def letter_h(x):
    return [rect(x, 0, x + S, 100), rect(x + H_W - S, 0, x + H_W, 100), rect(x + S, 40, x + H_W - S, 60)], []


def letter_e(x):
    return [rect(x, 0, x + S, 100), rect(x + S, 0, x + E_W, 20), rect(x + S, 40, x + E_W - 6, 60),
            rect(x + S, 80, x + E_W, 100)], []


# R: gövde + kase (dış yarıçap 28, merkez (40,28)) + çapraz bacak; kasenin içi delik.
LEG_TOP = (40 + 28 * math.cos(math.radians(60)), 28 + 28 * math.sin(math.radians(60)))  # (54, 52.25)
LEG_DX = (R_W - LEG_TOP[0]) * (100 - 56) / (100 - LEG_TOP[1])                            # sol kenar eğimi


def letter_r(x):
    outer = ([(x, 0), (x + 40, 0)] + [(x + px, py) for px, py in arc(40, 28, 28, -90, 60)[1:]]
             + [(x + R_W, 100), (x + R_W - 22, 100), (x + R_W - 22 - LEG_DX, 56),
                (x + S, 56), (x + S, 100), (x, 100)])
    counter = ([(x + S, 20), (x + 40, 20)] + [(x + px, py) for px, py in arc(40, 28, 8, -90, 90)[1:]]
               + [(x + S, 36)])
    return [outer], [counter]


def glyphs():
    """(dolu çokgenler, delikler) — tüm logo için."""
    fills, holes = [], []
    x = 0
    for make, w in ((letter_h, H_W), (letter_e, E_W), (letter_r, R_W), (letter_e, E_W)):
        f, h = make(x)
        fills += f
        holes += h
        x += w + GAP
    return fills, holes


def svg_path_d():
    """SVG yol verisi: dikdörtgenler düz, R'nin yayları gerçek yay komutuyla (keskin kenar)."""
    ex, ey = LEG_TOP
    parts = []
    x = 0
    for kind, w in (("H", H_W), ("E", E_W), ("R", R_W), ("E", E_W)):
        if kind == "R":
            parts.append(
                f"M{x} 0H{x + 40}A28 28 0 0 1 {x + ex:.3f} {ey:.3f}L{x + R_W} 100H{x + R_W - 22}"
                f"L{x + R_W - 22 - LEG_DX:.3f} 56H{x + S}V100H{x}Z"
                f"M{x + S} 20H{x + 40}A8 8 0 0 1 {x + 40} 36H{x + S}Z"
            )
        else:
            for poly in (letter_h if kind == "H" else letter_e)(x)[0]:
                (x0, y0), _, (x1, y1), _ = poly
                parts.append(f"M{x0} {y0}H{x1}V{y1}H{x0}Z")
        x += w + GAP
    return "".join(parts)


def write_svg(path, color_hex, width=None, height=None):
    size = f' width="{width:.2f}" height="{height:.2f}"' if width else ""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg"{size} viewBox="0 0 {WIDTH} {HEIGHT}" fill="none">'
        f'<path fill-rule="evenodd" d="{svg_path_d()}" fill="{color_hex}"/></svg>\n'
    )


def render_png(path, size, logo_width, fg, bg=None, supersample=4):
    """Logoyu verilen genişlikte, kare tuvalin ortasına çizer (bg None → saydam)."""
    big = size * supersample
    img = Image.new("RGBA", (big, big), (*bg, 255) if bg else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = logo_width * supersample / WIDTH
    ox = (big - WIDTH * scale) / 2
    oy = (big - HEIGHT * scale) / 2
    fills, holes = glyphs()
    to_px = lambda poly: [(ox + px * scale, oy + py * scale) for px, py in poly]
    for poly in fills:
        draw.polygon(to_px(poly), fill=(*fg, 255))
    for poly in holes:
        draw.polygon(to_px(poly), fill=(*bg, 255) if bg else (0, 0, 0, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)


def main():
    d = svg_path_d()

    # 1) Uygulama içi logo
    (ROOT / "src/components/wordmark-path.ts").write_text(
        "// Bu dosya scripts/generate-brand.py tarafından üretilir; elle düzenlemeyin.\n"
        f"export const WORDMARK_VIEWBOX = {{ width: {WIDTH}, height: {HEIGHT} }} as const;\n"
        f"export const WORDMARK_PATH =\n  '{d}';\n"
    )

    # 2) Düz SVG logo
    write_svg(ROOT / "assets/brand/here-wordmark.svg", "#0B0C10")

    # 3) iOS Liquid Glass simgesi (Icon Composer): fuşya zemin + beyaz logo katmanı.
    #    Cam ışığı, koyu/renkli/şeffaf simge görünümleri sistem tarafından üretilir.
    icon_dir = ROOT / "assets/here.icon"
    layer_w = 700
    write_svg(icon_dir / "Assets/here-wordmark.svg", "#FFFFFF", layer_w, layer_w * HEIGHT / WIDTH)
    r, g, b = (c / 255 for c in FUCHSIA)
    (icon_dir / "icon.json").write_text(json.dumps({
        "fill": {"automatic-gradient": f"extended-srgb:{r:.5f},{g:.5f},{b:.5f},1.00000"},
        "groups": [{
            "layers": [{
                "image-name": "here-wordmark.svg",
                "name": "here-wordmark",
                "position": {"scale": 1, "translation-in-points": [0, 0]},
            }],
            "shadow": {"kind": "neutral", "opacity": 0.5},
            "translucency": {"enabled": True, "value": 0.5},
        }],
        "supported-platforms": {"circles": ["watchOS"], "squares": "shared"},
    }, indent=2) + "\n")

    # 4) PNG'ler
    img = ROOT / "assets/images"
    render_png(img / "icon.png", 1024, 700, WHITE, FUCHSIA)
    render_png(img / "android-icon-foreground.png", 512, 300, WHITE)       # güvenli alan: ortadaki %66
    Image.new("RGBA", (512, 512), (*FUCHSIA, 255)).save(img / "android-icon-background.png")
    render_png(img / "android-icon-monochrome.png", 432, 250, WHITE)
    render_png(img / "splash-icon.png", 512, 420, WHITE)
    render_png(img / "favicon.png", 48, 40, WHITE, FUCHSIA)
    print("HERE marka varlıkları üretildi.")


if __name__ == "__main__":
    main()
