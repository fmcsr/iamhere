#!/usr/bin/env python3
"""HERE medya kiti: İngilizce ekran görüntülerinden tanıtım panosu (README'de görünür) ve GitHub sosyal önizlemesi.

docs/media-kit/screens/ altındaki ekran görüntülerini (simülatörden, İngilizce arayüz) bölümler hâlinde
dizer: başlık, bölüm başlıkları, yuvarlatılmış köşeli telefon ekranları ve altlarında kısa açıklamalar.
Düzen docs/ekranlar/ozet.jpg ile aynı; yazı tipi uygulamanın yazısı DM Sans.

Ekran görüntüleri şu adlarla beklenir (docs/media-kit/README.md'deki listeye bakın). Eksik olan atlanmaz,
hata verir: pano her zaman tam olmalı. Ayrıca 1280×640 sosyal önizleme (social-preview.jpg) üretilir; GitHub'da
Settings › General › Social preview'a elle yüklenir.

Kullanım (apps/mobile içinden; Pillow gerekir: python3 -m pip install pillow):
  python3 scripts/build-media-kit.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SCREENS = REPO / 'docs' / 'media-kit' / 'screens'
OUT = REPO / 'docs' / 'media-kit' / 'here-media-kit.jpg'
PREVIEW = REPO / 'docs' / 'media-kit' / 'social-preview.jpg'
ICON = ROOT / 'assets' / 'images' / 'icon.png'
FONTS = ROOT / 'node_modules' / '@expo-google-fonts' / 'dm-sans'

TITLE = 'HERE · Check in where you are, chat with who’s there'
SECTIONS = [
    ('iPhone 18 Pro · iOS 27 · light mode', 'phone', [
        ('01-home.jpg', 'Home · live venues'),
        ('02-tonight.jpg', 'Tonight · events and posts'),
        ('03-here.jpg', 'Here · venues around you'),
        ('04-check-in.jpg', 'Check in · slide the pin'),
        ('05-venue-chat.jpg', 'Venue chat · plan card'),
        ('06-messages.jpg', 'Messages · group chats'),
        ('07-explore.jpg', 'Explore · live map'),
        ('08-venue.jpg', 'Venue page'),
        ('09-profile.jpg', 'Profile'),
        ('10-to-here.jpg', 'Profile · To-HERE list'),
        ('11-memories.jpg', 'Memories'),
        ('12-edit-profile.jpg', 'Edit profile'),
    ]),
    ('Dark mode', 'phone', [
        ('13-dark-home.jpg', 'Home'),
        ('14-dark-check-in.jpg', 'Check in'),
        ('15-dark-venue-chat.jpg', 'Venue chat'),
        ('16-dark-messages.jpg', 'Messages'),
        ('17-dark-profile.jpg', 'Profile'),
        ('18-settings.jpg', 'Settings · language'),
    ]),
    ('iPhone Duo · iOS 27.1 · cover screen', 'cover', [
        ('19-duo-home.jpg', 'Home · side tab bar'),
        ('20-duo-messages.jpg', 'Messages'),
    ]),
]

WIDTH = 2992
MARGIN = 80
GAP = 40
PER_ROW = 6
PHONE_W = (WIDTH - 2 * MARGIN - (PER_ROW - 1) * GAP) // PER_ROW
COVER_W = 680
BACKGROUND = (245, 245, 247)
INK = (29, 29, 31)
MUTED = (110, 110, 115)


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / weight / f'DMSans_{weight}.ttf'), size)


def rounded(image: Image.Image, width: int, radius_ratio: float) -> Image.Image:
    """Ekranı genişliğe ölçekler ve köşelerini yuvarlatır (iPhone ekran köşesi oranında)."""
    height = round(image.height * width / image.width)
    scaled = image.convert('RGB').resize((width, height), Image.LANCZOS)
    # Kenarlar pürüzsüz olsun diye maske 4 kat büyük çizilip küçültülür.
    big = Image.new('L', (width * 4, height * 4), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, width * 4 - 1, height * 4 - 1), radius=round(width * radius_ratio * 4), fill=255)
    tile = Image.new('RGBA', (width, height))
    tile.paste(scaled, (0, 0), big.resize((width, height), Image.LANCZOS))
    return tile


def main() -> None:
    title_font, section_font, caption_font = font('500Medium', 66), font('400Regular', 42), font('400Regular', 34)
    blocks = []  # (y, kind, payload)
    y = 70
    blocks.append((y, 'title', TITLE))
    y += 110
    for heading, kind, screens in SECTIONS:
        blocks.append((y, 'section', heading))
        y += 72
        missing = [name for name, _ in screens if not (SCREENS / name).exists()]
        if missing:
            raise SystemExit(f'Eksik ekran görüntüleri: {", ".join(missing)} ({SCREENS})')
        width = PHONE_W if kind == 'phone' else COVER_W
        per_row = PER_ROW if kind == 'phone' else len(screens)
        for start in range(0, len(screens), per_row):
            row = [(rounded(Image.open(SCREENS / name), width, 0.13 if kind == 'phone' else 0.07), caption) for name, caption in screens[start:start + per_row]]
            row_w = sum(tile.width for tile, _ in row) + GAP * (len(row) - 1)
            x = (WIDTH - row_w) // 2 if kind == 'cover' else MARGIN
            tallest = max(tile.height for tile, _ in row)
            for tile, caption in row:
                blocks.append((y, 'screen', (x, tile, caption)))
                x += tile.width + GAP
            y += tallest + 96
        y += 24
    height = y + 20

    board = Image.new('RGB', (WIDTH, height), BACKGROUND)
    draw = ImageDraw.Draw(board)
    for top, kind, payload in blocks:
        if kind == 'title':
            draw.text((MARGIN, top), payload, font=title_font, fill=INK)
        elif kind == 'section':
            draw.text((MARGIN, top), payload, font=section_font, fill=MUTED)
        else:
            x, tile, caption = payload
            board.paste(tile, (x, top), tile)
            text_w = draw.textlength(caption, font=caption_font)
            draw.text((x + (tile.width - text_w) / 2, top + tile.height + 26), caption, font=caption_font, fill=INK)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    board.save(OUT, quality=88, optimize=True, progressive=True)
    print(f'{OUT.relative_to(REPO)}  {board.width}x{board.height}')


def glow(size: tuple[int, int], center: tuple[float, float], radius: float, color: tuple[int, int, int]) -> Image.Image:
    """Ortası renkli, kenara doğru saydamlaşan yumuşak ışık."""
    w, h = size
    layer = Image.new('RGBA', size, color + (0,))
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    steps = 60
    for i in range(steps, 0, -1):
        r = radius * i / steps
        alpha = round(150 * (1 - i / steps) ** 1.6)
        draw.ellipse((center[0] * w - r, center[1] * h - r, center[0] * w + r, center[1] * h + r), fill=alpha)
    layer.putalpha(mask)
    return layer


def social_preview() -> None:
    """GitHub sosyal önizlemesi (1280×640): koyu zemin, marka ışıkları, simge, ad ve üç ekran."""
    size = (1280, 640)
    canvas = Image.new('RGBA', size, (14, 11, 20, 255))
    canvas.alpha_composite(glow(size, (0.08, 0.05), 620, (225, 29, 73)))
    canvas.alpha_composite(glow(size, (0.95, 1.0), 640, (88, 52, 196)))
    draw = ImageDraw.Draw(canvas)

    icon = Image.open(ICON).convert('RGBA').resize((116, 116), Image.LANCZOS)
    mask = Image.new('L', (116 * 4, 116 * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 116 * 4 - 1, 116 * 4 - 1), radius=27 * 4, fill=255)
    icon.putalpha(mask.resize((116, 116), Image.LANCZOS))
    canvas.alpha_composite(icon, (72, 96))
    draw.text((68, 236), 'HERE', font=font('800ExtraBold', 112), fill=(255, 255, 255))
    draw.text((72, 380), 'Check in where you are,', font=font('500Medium', 34), fill=(236, 232, 243))
    draw.text((72, 424), 'chat with who’s there.', font=font('500Medium', 34), fill=(236, 232, 243))
    draw.text((72, 500), 'iOS 27 prototype · Expo · React Native', font=font('400Regular', 22), fill=(168, 160, 184))

    # Üç ekran, hafifçe üst üste: açık ana sayfa, koyu sohbet ve en önde iğneli yer bildirme sayfası.
    phones = [('01-home.jpg', 640, 92), ('15-dark-venue-chat.jpg', 830, 52), ('04-check-in.jpg', 1020, 112)]
    for name, x, y in phones:
        tile = rounded(Image.open(SCREENS / name), 230, 0.13)
        shadow = Image.new('RGBA', (tile.width + 40, tile.height + 40), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((20, 26, tile.width + 20, tile.height + 26), radius=34, fill=(0, 0, 0, 110))
        canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)), (x - 20, y - 20))
        canvas.alpha_composite(tile, (x, y))
    canvas.convert('RGB').save(PREVIEW, quality=90, optimize=True, progressive=True)
    print(f'{PREVIEW.relative_to(REPO)}  {size[0]}x{size[1]}')


if __name__ == '__main__':
    main()
    social_preview()
