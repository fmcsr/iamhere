#!/usr/bin/env python3
"""HERE medya kiti: İngilizce ekran görüntülerinden tek bir tanıtım panosu (README'de görünür).

docs/media-kit/screens/ altındaki ekran görüntülerini (simülatörden, İngilizce arayüz) bölümler hâlinde
dizer: başlık, bölüm başlıkları, yuvarlatılmış köşeli telefon ekranları ve altlarında kısa açıklamalar.
Düzen docs/ekranlar/ozet.jpg ile aynı; yazı tipi uygulamanın yazısı DM Sans.

Ekran görüntüleri şu adlarla beklenir (docs/media-kit/README.md'deki listeye bakın). Eksik olan atlanmaz,
hata verir: pano her zaman tam olmalı.

Kullanım (apps/mobile içinden; Pillow gerekir: python3 -m pip install pillow):
  python3 scripts/build-media-kit.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SCREENS = REPO / 'docs' / 'media-kit' / 'screens'
OUT = REPO / 'docs' / 'media-kit' / 'here-media-kit.jpg'
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


if __name__ == '__main__':
    main()
