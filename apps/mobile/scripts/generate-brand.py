#!/usr/bin/env python3
"""HERE marka varlıklarını tek kaynaktan üretir.

Logo, kalın geometrik harflerden (H, E, R, E) oluşur; harf yüksekliği 100 birim, çizgi kalınlığı
20 birim. Uygulamada ve simgede bu harfler, corner'ın simgesindeki gibi şişirilmiş krom balon
harflere dönüştürülür (TASARIM.md T-23):

  1. Biçim: her harf ayrı çizilir ve hafifçe eğilir; Gauss bulanıklığı + eşikle kalınlaşır, köşeleri
     yuvarlanır (E'nin kolları arasında ince yarıklar kalır). Harfler birbirine hafifçe biner.
  2. Şişirme: harfin içinde Poisson denklemi çözülür (∇²u = −1, kenarda u = 0); kalınlık √(2u).
     Düz bir çizginin kesiti yarım daire olur, birleşim yerleri balon gibi kabarır.
  3. Krom: yüzey normalinden yansıma yönü bulunur, bir stüdyo ortamından okunur (parlak üst, koyu
     ufuk bandı, yanlarda koyu bayraklar, softbox ışıkları, alttan ve yanlardan fuşya yansıması).
  4. Dönen logo: aynı biçim üç boyutlu bir cisim olarak (|z| < kalınlık) ışın yürütmeyle (ray
     marching) 60 açıdan çizilir. Aşağı çekip yenilerken soldan sağa döner.

Üretilenler:
  assets/brand/here-wordmark.svg          düz (tek renk) logo
  assets/here.icon/                       iOS 26+ simgesi (Icon Composer): fuşya zemin + krom "HE / RE"
  assets/images/icon.png                  1024 px simge (Android eski sürüm, web)
  assets/images/android-icon-*.png        Android uyarlanabilir simge katmanları
  assets/images/splash-icon.png           açılış ekranı logosu (tek satır krom HERE)
  assets/images/favicon.png               web favicon
  assets/images/here-spin.webp            dönen logonun kareleri (ızgara)
  src/components/here-mark-sprite.ts      karelerin ölçüleri

Kullanım (apps/mobile içinden; Pillow ve numpy gerekir: python3 -m pip install pillow numpy):
  python3 scripts/generate-brand.py       (yaklaşık bir dakika sürer)
"""

import json
import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent

FUCHSIA = (0xE1, 0x1D, 0x49)          # Wild Fuchsia #E11D49
WHITE = (255, 255, 255)

S = 20                                 # çizgi kalınlığı
GAP = 14                               # harf aralığı (düz logo)
H_W, E_W, R_W = 76, 58, 78             # harf genişlikleri
WIDTH = H_W + E_W + R_W + E_W + 3 * GAP  # 312
HEIGHT = 100


# ------------------------------------------------------------------ harf geometrisi (düz logo)

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


LETTERS = {"H": (letter_h, H_W), "E": (letter_e, E_W), "R": (letter_r, R_W)}


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


def write_svg(path, color_hex):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" fill="none">'
        f'<path fill-rule="evenodd" d="{svg_path_d()}" fill="{color_hex}"/></svg>\n'
    )


# ------------------------------------------------------------------ krom balon harfler: dizilimler
# Her öğe: (harf, merkez x, merkez y, eğim°, yatay ölçek, dikey ölçek); birimler harf birimi.

def one_line():
    """Tek satır HERE (uygulama içi, açılış ekranı, dönen logo). Harfler hafif eğik, birbirine biner."""
    gap = 2
    jitter = [(-4, 2, 1.0), (3, -2, 0.96), (-2, 1, 1.02), (4, -1, 0.97)]  # eğim, dikey kayma, ölçek
    widths = [LETTERS[k][1] for k in "HERE"]
    total = sum(widths) + gap * 3
    x = -total / 2
    layout = []
    for kind, w, (rot, dy, sc) in zip("HERE", widths, jitter):
        layout.append((kind, x + w / 2, 50 + dy, rot, sc, sc))
        x += w + gap
    return layout, (-total / 2 - 14, -14, total / 2 + 14, 114)


def two_lines(sx=1.45):
    """Simge: corner'daki "COR / NER" gibi iki satır "HE / RE"; harfler biraz geniş."""
    rows = (("HE", 50, ((-5, 0), (4, 1))), ("RE", 158, ((3, -1), (-4, 0))))
    layout = []
    for word, cy, jit in rows:
        widths = [LETTERS[k][1] * sx for k in word]
        x = -(sum(widths) + 2) / 2
        for kind, w, (rot, dy) in zip(word, widths, jit):
            layout.append((kind, x + w / 2, cy + dy, rot, sx, 1.0))
            x += w + 2
    return layout, (-128, -16, 128, 224)


# ------------------------------------------------------------------ şişirme

def blur(a, sigma):
    """Gauss bulanıklığı (FFT ile, kenarlar sıfır)."""
    pad = int(math.ceil(sigma * 4))
    h, w = a.shape
    p = np.pad(a, pad)
    ky = np.exp(-0.5 * ((np.arange(p.shape[0]) - p.shape[0] // 2) / sigma) ** 2)
    kx = np.exp(-0.5 * ((np.arange(p.shape[1]) - p.shape[1] // 2) / sigma) ** 2)
    k = np.outer(ky / ky.sum(), kx / kx.sum())
    out = np.fft.irfft2(np.fft.rfft2(p) * np.fft.rfft2(np.fft.ifftshift(k)), s=p.shape)
    return out[pad:pad + h, pad:pad + w]


def poisson(mask, h, iters, u=None, omega=1.9):
    """Kırmızı-siyah SOR: maskenin içinde ∇²u = −1, dışında u = 0. h: piksel başına birim."""
    u = np.zeros(mask.shape) if u is None else u * mask
    ii, jj = np.indices(mask.shape)
    colors = (mask & ((ii + jj) % 2 == 0), mask & ((ii + jj) % 2 == 1))
    for _ in range(iters):
        for c in colors:
            nb = np.zeros_like(u)
            nb[1:] += u[:-1]
            nb[:-1] += u[1:]
            nb[:, 1:] += u[:, :-1]
            nb[:, :-1] += u[:, 1:]
            u[c] += omega * ((nb[c] + h * h) / 4 - u[c])
    return u


def halve(mask):
    h, w = mask.shape
    p = np.zeros(((h + 1) // 2 * 2, (w + 1) // 2 * 2), bool)
    p[:h, :w] = mask
    return p.reshape(p.shape[0] // 2, 2, p.shape[1] // 2, 2).mean(axis=(1, 3)) > 0.5


def resize(a, shape):
    """Çift doğrusal büyütme."""
    h, w = shape
    sh, sw = a.shape
    y = np.clip((np.arange(h) + 0.5) * sh / h - 0.5, 0, sh - 1)
    x = np.clip((np.arange(w) + 0.5) * sw / w - 0.5, 0, sw - 1)
    y0 = np.minimum(y.astype(int), sh - 2); x0 = np.minimum(x.astype(int), sw - 2)
    fy = (y - y0)[:, None]; fx = (x - x0)[None, :]
    top = a[y0][:, x0] * (1 - fx) + a[y0][:, x0 + 1] * fx
    bottom = a[y0 + 1][:, x0] * (1 - fx) + a[y0 + 1][:, x0 + 1] * fx
    return top * (1 - fy) + bottom * fy


def solve(mask, h):
    """Kabadan inceye: önce küçük ızgarada yakınsar, sonra her ölçekte düzeltilir."""
    levels = [(mask, h)]
    while min(levels[-1][0].shape) > 128 and len(levels) < 4:
        m, hh = levels[-1]
        levels.append((halve(m), hh * 2))
    u = None
    for i, (m, hh) in enumerate(reversed(levels)):
        u = poisson(m, hh, 900 if i == 0 else 200, None if u is None else resize(u, m.shape))
    return u


def inflate(layout, ppu, bounds, sigma=4.4, threshold=0.22):
    """Harflerin kalınlık haritası (birim). ppu: birim başına piksel."""
    x0, y0, x1, y1 = bounds
    size = (int(round((x1 - x0) * ppu)), int(round((y1 - y0) * ppu)))
    height = np.zeros(size[::-1])
    for kind, cx, cy, rot, sx, sy in layout:
        make, w = LETTERS[kind]
        fills, holes = make(0)
        t = math.radians(rot)
        ct, st = math.cos(t), math.sin(t)

        def to_px(p):
            x, y = (p[0] - w / 2) * sx, (p[1] - 50) * sy
            return ((x * ct - y * st + cx - x0) * ppu, (x * st + y * ct + cy - y0) * ppu)

        img = Image.new("L", size, 0)
        draw = ImageDraw.Draw(img)
        for poly in fills:
            draw.polygon([to_px(p) for p in poly], fill=255)
        for poly in holes:
            draw.polygon([to_px(p) for p in poly], fill=0)
        mask = blur(np.asarray(img, float) / 255, sigma * ppu) > threshold
        height = np.maximum(height, np.sqrt(2 * np.maximum(solve(mask, 1 / ppu), 0)) * mask)
    return height


def surface(height, ppu):
    """Kalınlığın eğimi (normaller için) ve kıvrımlarda gölge (ambient occlusion)."""
    gv, gu = np.gradient(height, 1 / ppu)
    cavity = blur(height, 4 * ppu) - height
    return gu, gv, 1 - 0.55 * np.clip(cavity / 3.0, 0, 1)


# ------------------------------------------------------------------ krom

TINT = np.array([1.0, 0.3, 0.45])     # fuşya zeminin kromdaki yansıması


def environment(r, tint):
    """Stüdyo ortamı. r: birim yansıma yönleri (x sağ, y yukarı, z izleyiciye)."""
    rx, ry, rz = r[..., 0], r[..., 1], r[..., 2]
    # Yükseklik profili: zemin, koyu bant, ufuk parıltısı, ön, ince koyu bant, parlak gökyüzü.
    v = np.interp(ry, [-1.0, -0.55, -0.32, -0.2, -0.08, 0.05, 0.3, 0.46, 0.52, 0.6, 0.8, 1.0],
                  [0.42, 0.30, 0.08, 0.10, 0.62, 0.74, 0.80, 0.86, 0.38, 0.88, 0.97, 1.0])
    v = v * (1 - 0.75 * np.exp(-((np.abs(rx) - 0.72) / 0.09) ** 2) * np.clip(rz + 0.2, 0, 1))

    def softbox(direction, size, power):
        d = np.array(direction) / np.linalg.norm(direction)
        return power * np.clip((r @ d - (1 - size)) / size, 0, 1) ** 1.5

    v = v + softbox((-0.55, 0.55, 0.62), 0.07, 1.4) + softbox((0.6, 0.35, 0.7), 0.035, 1.1) + softbox((-0.15, 0.25, 0.95), 0.02, 0.5)
    side = np.clip(np.clip(-ry - 0.15, 0, 1) * 1.2 + np.clip((np.abs(rx) - 0.45) / 0.4, 0, 1) * np.clip(0.9 - rz, 0, 1) * 0.8, 0, 1)
    col = v[..., None] * (1 - tint * side[..., None]) + TINT * np.maximum(v, 0.35)[..., None] * (tint * side[..., None])
    return col * np.array([0.95, 0.96, 1.0])


def chrome(n, view, tint, ao):
    """n: birim normaller, view: yüzeyden göze birim yönler (görüntü uzayında)."""
    ndv = np.clip(np.sum(n * view, -1), 0, 1)
    refl = 2 * ndv[..., None] * n - view
    light = np.array([-0.45, 0.65, 0.62]) / np.linalg.norm([-0.45, 0.65, 0.62])
    col = environment(refl, tint) + (np.clip(refl @ light, 0, 1) ** 220 * 1.2)[..., None]
    col = col * ao[..., None] * (0.55 + 0.45 * np.clip(ndv / 0.35, 0, 1) ** 0.7)[..., None]
    return np.clip(col, 0, 1)


def to_image(rgb, alpha, ss):
    """Süper örneklenmiş RGB + kaplamadan kenarları yumuşak RGBA görüntü."""
    h, w = alpha.shape
    h, w = h // ss * ss, w // ss * ss
    premul = np.concatenate([rgb[:h, :w] * alpha[:h, :w, None], alpha[:h, :w, None]], -1)
    small = premul.reshape(h // ss, ss, w // ss, ss, 4).mean(axis=(1, 3))
    a = small[..., 3:4]
    color = np.where(a > 0, small[..., :3] / np.maximum(a, 1e-6), 0)
    return Image.fromarray(np.uint8(np.concatenate([color, a], -1) * 255 + 0.5), "RGBA")


def render_front(layout, bounds, ppu, tint, ss=2):
    """Önden görünüş (simge, açılış ekranı). ppu: çıktıda birim başına piksel."""
    height = inflate(layout, ppu * ss, bounds)
    gu, gv, ao = surface(height, ppu * ss)
    n = np.stack([-gu, gv, np.ones_like(height)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    col = chrome(n, np.array([0.0, 0.0, 1.0]), tint, ao)
    return to_image(col, (height > 0).astype(float), ss)


# ------------------------------------------------------------------ dönen logo (ışın yürütme)

def sample(a, rows, cols):
    h, w = a.shape
    r0 = np.floor(rows).astype(np.int64); c0 = np.floor(cols).astype(np.int64)
    inside = (r0 >= 0) & (c0 >= 0) & (r0 < h - 1) & (c0 < w - 1)
    r0 = np.clip(r0, 0, h - 2); c0 = np.clip(c0, 0, w - 2)
    fr = np.clip(rows - r0, 0, 1); fc = np.clip(cols - c0, 0, 1)
    v = ((a[r0, c0] * (1 - fc) + a[r0, c0 + 1] * fc) * (1 - fr)
         + (a[r0 + 1, c0] * (1 - fc) + a[r0 + 1, c0 + 1] * fc) * fr)
    return np.where(inside, v, 0.0)


def rot_y(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def render_turn(fields, ppu, bounds, angle, frame, word_px, tint, ss=2, steps=240):
    """Kelime, dikey eksen etrafında `angle` derece dönmüş (pozitif: ön yüz sağa gider)."""
    height, gu, gv, ao = fields
    x0, y0, x1, y1 = bounds
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    width_u = x1 - x0
    fw, fh = frame[0] * ss, frame[1] * ss
    scale = word_px * ss / width_u
    eye = np.array([0.0, 0.0, 4.0 * width_u])  # hafif perspektif
    jj, ii = np.mgrid[0:fh, 0:fw]
    plane = np.stack([(ii + 0.5 - fw / 2) / scale, (fh / 2 - jj - 0.5) / scale, np.zeros(ii.shape)], -1).reshape(-1, 3)
    d = plane - eye
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    inv = rot_y(-angle)
    o = inv @ eye
    do = d @ inv.T
    top = height.max() + 0.5
    lo = np.array([x0 - cx, cy - y1, -top]); hi = np.array([x1 - cx, cy - y0, top])
    with np.errstate(divide="ignore", invalid="ignore"):
        t1 = (lo - o) / do; t2 = (hi - o) / do
    tmin = np.nanmax(np.minimum(t1, t2), 1); tmax = np.nanmin(np.maximum(t1, t2), 1)
    rays = np.nonzero(tmax > np.maximum(tmin, 0))[0]
    dr = do[rays]; ta = tmin[rays]; dt = (tmax[rays] - ta) / steps
    to_px = lambda p: ((cy - p[:, 1] - y0) * ppu - 0.5, (p[:, 0] + cx - x0) * ppu - 0.5)
    hit = np.full(len(rays), np.nan)
    active = np.arange(len(rays))
    for k in range(steps):
        if len(active) == 0:
            break
        t = ta[active] + (k + 0.5) * dt[active]
        p = o + dr[active] * t[:, None]
        inside = np.abs(p[:, 2]) < sample(height, *to_px(p))
        hit[active[inside]] = t[inside]
        active = active[~inside]
    got = np.nonzero(~np.isnan(hit))[0]
    near, far = hit[got] - dt[got], hit[got]
    for _ in range(10):
        mid = (near + far) / 2
        p = o + dr[got] * mid[:, None]
        inside = np.abs(p[:, 2]) < sample(height, *to_px(p))
        far = np.where(inside, mid, far); near = np.where(inside, near, mid)
    p = o + dr[got] * far[:, None]
    rows, cols = to_px(p)
    side = np.where(p[:, 2] >= 0, 1.0, -1.0)
    n = np.stack([-sample(gu, rows, cols), sample(gv, rows, cols), side], -1)
    n = (n / np.linalg.norm(n, axis=1, keepdims=True)) @ rot_y(angle).T
    col = chrome(n, -d[rays[got]], tint, sample(ao, rows, cols))
    rgb = np.zeros((fh * fw, 3)); alpha = np.zeros(fh * fw)
    rgb[rays[got]] = col; alpha[rays[got]] = 1
    return to_image(rgb.reshape(fh, fw, 3), alpha.reshape(fh, fw), ss)


# ------------------------------------------------------------------ yardımcılar

def place(img, size, box_w, box_h, bg=None, shadow=0.0):
    """Görüntüyü box_w × box_h kutusuna sığdırıp kare tuvalin ortasına koyar (isteğe bağlı gölge)."""
    s = min(box_w / img.width, box_h / img.height)
    art = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (*bg, 255) if bg else (0, 0, 0, 0))
    pos = ((size - art.width) // 2, (size - art.height) // 2)
    if shadow:
        a = art.getchannel("A").point(lambda v: int(v * shadow))
        sh = Image.new("RGBA", art.size, (40, 0, 12, 0))
        sh.putalpha(a)
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        layer.alpha_composite(sh, (pos[0], pos[1] + max(2, size // 90)))
        canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(max(1, size / 60))))
    canvas.alpha_composite(art, pos)
    return canvas


def main():
    img = ROOT / "assets/images"

    # 1) Düz SVG logo (tek renk; belgeler ve basılı işler için)
    write_svg(ROOT / "assets/brand/here-wordmark.svg", "#0B0C10")

    # 2) Simge: iki satır krom "HE / RE" (corner gibi), fuşya zemin
    layout, bounds = two_lines()
    letters = render_front(layout, bounds, 4.0, tint=0.45)
    icon_dir = ROOT / "assets/here.icon"
    shutil.rmtree(icon_dir / "Assets", ignore_errors=True)
    (icon_dir / "Assets").mkdir(parents=True)
    place(letters, 1024, 860, 860).save(icon_dir / "Assets/here-chrome.png")
    r, g, b = (c / 255 for c in FUCHSIA)
    (icon_dir / "icon.json").write_text(json.dumps({
        "fill": {"automatic-gradient": f"extended-srgb:{r:.5f},{g:.5f},{b:.5f},1.00000"},
        "groups": [{
            "layers": [{
                # Krom ışıkları görüntüde hazır; sistemin cam efekti kapalı, gölge sistemden.
                "glass": False,
                "image-name": "here-chrome.png",
                "name": "here-chrome",
                "position": {"scale": 1, "translation-in-points": [0, 0]},
            }],
            "shadow": {"kind": "neutral", "opacity": 0.5},
        }],
        "supported-platforms": {"circles": ["watchOS"], "squares": "shared"},
    }, indent=2) + "\n")
    place(letters, 1024, 860, 860, bg=FUCHSIA, shadow=0.45).save(img / "icon.png")
    place(letters, 512, 300, 300).save(img / "android-icon-foreground.png")        # güvenli alan: ortadaki %66
    Image.new("RGBA", (512, 512), (*FUCHSIA, 255)).save(img / "android-icon-background.png")
    mono = place(letters, 432, 250, 250)
    Image.merge("RGBA", (*Image.new("RGB", mono.size, WHITE).split(), mono.getchannel("A"))).save(img / "android-icon-monochrome.png")
    place(letters, 48, 42, 42, bg=FUCHSIA).save(img / "favicon.png")

    # 3) Açılış ekranı: tek satır krom HERE
    layout, bounds = one_line()
    place(render_front(layout, bounds, 3.2, tint=0.45), 1024, 940, 940).save(img / "splash-icon.png")

    # 4) Dönen logo: 60 kare, @3x (kare 100 × 40 pt). İlk kare duran logodur.
    frames, columns, frame = 60, 10, (300, 120)
    ppu = 4.0
    height = inflate(layout, ppu, bounds)
    fields = (height, *surface(height, ppu))
    rows = math.ceil(frames / columns)
    sheet = Image.new("RGBA", (frame[0] * columns, frame[1] * rows), (0, 0, 0, 0))
    for i in range(frames):
        tile = render_turn(fields, ppu, bounds, 360 * i / frames, frame, word_px=270, tint=0.3)
        sheet.alpha_composite(tile, ((i % columns) * frame[0], (i // columns) * frame[1]))
    sheet.save(img / "here-spin.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    (ROOT / "src/components/here-mark-sprite.ts").write_text(
        "// Bu dosya scripts/generate-brand.py tarafından üretilir; elle düzenlemeyin.\n"
        f"export const HERE_SPRITE = {{ frames: {frames}, columns: {columns}, rows: {rows}, "
        f"frameWidth: {frame[0] // 3}, frameHeight: {frame[1] // 3} }} as const;\n"
    )
    print("HERE marka varlıkları üretildi.")


if __name__ == "__main__":
    main()
