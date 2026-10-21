"""Build web-ready media from Higgsfield originals in media-src/higgsfield.

Run: python3 scripts/build_media.py
Outputs to impact/public/media/. Originals stay in media-src/ for provenance.
"""
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'media-src' / 'higgsfield'
OUT = ROOT / 'impact' / 'public' / 'media'
OUT.mkdir(parents=True, exist_ok=True)

# name: (source file, crop box as fractions (l, t, r, b) or None)
STILLS = {
    'care': ('care.png', (0.5, 0.0, 1.0, 1.0)),  # source has an empty left half
    'discovery': ('discovery.png', None),
    'opportunity': ('opportunity-v2.png', None),
    'community': ('community.png', None),
    'resources': ('resources.png', None),
    'people': ('people.png', None),
    'neighbourhood': ('neighbourhood.png', None),
    'community-model': ('A-sd5.png', None),
    'study-model-alt': ('A-nb2.png', None),
}
WIDTHS = (1200, 640)


def still(name, src, crop):
    im = Image.open(SRC / src).convert('RGB')
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    widths = (2000, 1200, 640) if name.startswith(('community-model', 'study')) else WIDTHS
    for width in widths:
        copy = im.copy()
        if copy.width > width:
            copy = copy.resize((width, round(copy.height * width / copy.width)), Image.LANCZOS)
        copy.save(OUT / f'{name}-{width}.webp', 'WEBP', quality=78, method=6)
    print(name, im.size)


CLIPS = ('community', 'pool', 'people', 'care', 'discovery', 'opportunity', 'neighbourhood')


# Seconds to trim from the start of a clip (care begins on an empty frame).
TRIM = {'care': 2.2}


def clip(name):
    src = SRC / f'clip-{name}.mp4'
    start = ['-ss', str(TRIM.get(name, 0))]
    base = ['ffmpeg', '-v', 'error', '-y', *start, '-i', str(src), '-an', '-vf', 'scale=1280:-2']
    subprocess.run(base + ['-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                           '-movflags', '+faststart', str(OUT / f'clip-{name}.mp4')], check=True)
    subprocess.run(base + ['-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1',
                           str(OUT / f'clip-{name}.webm')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *start, '-i', str(src), '-vf', 'scale=1280:-2', '-frames:v', '1',
                    '-q:v', '4', str(OUT / f'clip-{name}-poster.jpg')], check=True)
    print('clip', name)


if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:])
    for key, (src, crop) in STILLS.items():
        if not only or key in only:
            still(key, src, crop)
    for c in CLIPS:
        if not only or c in only:
            clip(c)
