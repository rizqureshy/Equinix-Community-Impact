#!/usr/bin/env python3
"""Web copies of the drawn promises (media-src/promises/drawn -> impact/public/media/promises/drawn).

Vector drawings are copied as they are, minus their fixed width and height so they scale, and
with the white background rectangle removed so the sheet shows through. Traced drawings (PNG)
become WebP at 1200 wide. Raw PNGs stay out of git; the SVGs are small and are committed.
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'media-src' / 'promises' / 'drawn'
OUT = ROOT / 'impact' / 'public' / 'media' / 'promises' / 'drawn'
OUT.mkdir(parents=True, exist_ok=True)

only = set(sys.argv[1:])
for f in sorted(SRC.iterdir()):
    if only and f.stem not in only:
        continue
    if f.suffix == '.svg':
        s = f.read_text()
        s = re.sub(r'\s(width|height)="[^"]*"', '', s, count=2) if re.search(r'<svg[^>]*\swidth=', s) else s
        # a full-sheet white rect behind the lines would hide the sheet's own grid
        s = re.sub(r'<rect[^>]*fill="#?(fff|ffffff|white)"[^>]*/>\s*', '', s, count=1, flags=re.I)
        (OUT / f.name).write_text(s)
        print('svg ', f.name, len(s), 'bytes')
    elif f.suffix == '.png' and not f.stem.endswith('.render'):
        im = Image.open(f).convert('RGB')
        w = 1200
        copy = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        copy.save(OUT / f'{f.stem}.webp', 'WEBP', quality=86, method=6)
        print('webp', f.stem, copy.size)
        if '-tint-' in f.stem:
            # The wash alone, for the layer beneath the strokes: the red ink and the white paper go transparent
            a = np.asarray(im).astype(np.int16)
            r, g, b = a[..., 0], a[..., 1], a[..., 2]
            ink = (r - np.maximum(g, b)) > 25
            paper = np.minimum(np.minimum(r, g), b) > 236
            alpha = np.where(ink | paper, 0, 255).astype(np.uint8)
            rgba = np.dstack([a.clip(0, 255).astype(np.uint8), alpha])
            wash = Image.fromarray(rgba, 'RGBA').resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            wash.save(OUT / f'{f.stem}.wash.webp', 'WEBP', quality=80, method=6)
            print('wash', f.stem)
