#!/usr/bin/env python3
"""Room panorama tools.

  pano_tools.py web <name>        media-src/rooms/<name>.pano.png -> impact/public/media/rooms/<name>-pano-{4096,2048}.webp
                                  (the seam at the edges is blended over a narrow band)
  pano_tools.py still <name>      a 1280x720 perspective view (yaw 0, pitch 0, 70 degree fov) of the panorama,
                                  used as the dive film's last frame: media-src/rooms/<name>.room.png
  pano_tools.py poster <name>     the same view as impact/public/media/rooms/<name>-room-1280.webp (phone and no-WebGL fallback)
"""
import sys
import pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'media-src' / 'rooms'
OUT = ROOT / 'impact' / 'public' / 'media' / 'rooms'
OUT.mkdir(parents=True, exist_ok=True)


def blend_seam(im, band=48):
    """Cross-fade a narrow band at the right edge toward the left edge so the
    sphere closes without a visible seam."""
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    left = a[:, :band]
    right = a[:, w - band:]
    t = np.linspace(0, 1, band, dtype=np.float32)[None, :, None]
    a[:, w - band:] = right * (1 - t) + left[:, ::-1] * t
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def web(name):
    im = Image.open(SRC / f'{name}.pano.png').convert('RGB')
    im = blend_seam(im)
    for w in (4096, 2048):
        c = im.resize((w, w // 2), Image.LANCZOS)
        c.save(OUT / f'{name}-pano-{w}.webp', 'WEBP', quality=82, method=6)
    print(name, 'pano', im.size)


def perspective(im, width=1280, height=720, fov=70.0, yaw=0.0, pitch=0.0):
    a = np.asarray(im)
    H, W, _ = a.shape
    f = (width / 2) / np.tan(np.radians(fov) / 2)
    xs = (np.arange(width) - width / 2 + 0.5) / f
    ys = (np.arange(height) - height / 2 + 0.5) / f
    x, y = np.meshgrid(xs, -ys)
    z = np.ones_like(x)
    # rotate by pitch then yaw
    cp, sp = np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
    y2 = y * cp - z * sp
    z2 = y * sp + z * cp
    cy, sy = np.cos(np.radians(yaw)), np.sin(np.radians(yaw))
    x3 = x * cy + z2 * sy
    z3 = -x * sy + z2 * cy
    n = np.sqrt(x3 * x3 + y2 * y2 + z3 * z3)
    lon = np.arctan2(x3, z3)
    lat = np.arcsin(y2 / n)
    u = (lon / (2 * np.pi) + 0.5) * (W - 1)
    v = (0.5 - lat / np.pi) * (H - 1)
    ui = np.clip(np.round(u).astype(int), 0, W - 1)
    vi = np.clip(np.round(v).astype(int), 0, H - 1)
    return Image.fromarray(a[vi, ui])


def still(name):
    im = Image.open(SRC / f'{name}.pano.png').convert('RGB')
    view = perspective(im)
    view.save(SRC / f'{name}.room.png')
    print(name, 'still', view.size)


def poster(name):
    im = Image.open(SRC / f'{name}.pano.png').convert('RGB')
    view = perspective(im)
    view.save(OUT / f'{name}-room-1280.webp', 'WEBP', quality=80, method=6)
    print(name, 'poster')


if __name__ == '__main__':
    cmd, name = sys.argv[1], sys.argv[2]
    {'web': web, 'still': still, 'poster': poster}[cmd](name)
