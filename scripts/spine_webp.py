"""Web copies of the Spine card images: 960x640 WebP from the raw PNGs in media-src/spine."""
from pathlib import Path
from PIL import Image
SRC = Path('media-src/spine'); OUT = Path('impact/public/media/spine'); OUT.mkdir(parents=True, exist_ok=True)
n = 0
for png in sorted(SRC.glob('*.png')):
    out = OUT / (png.stem + '.webp')
    if out.exists() and out.stat().st_mtime >= png.stat().st_mtime: continue
    im = Image.open(png).convert('RGB'); w, h = im.size; s = max(960 / w, 640 / h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS); w, h = im.size
    im = im.crop(((w - 960) // 2, (h - 640) // 2, (w - 960) // 2 + 960, (h - 640) // 2 + 640))
    im.save(out, 'WEBP', quality=80, method=6); n += 1
print(n, 'written;', len(list(OUT.glob('*.webp'))), 'total')
