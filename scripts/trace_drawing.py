#!/usr/bin/env python3
"""Turn a red hairline drawing (PNG on white) into SVG strokes that can draw themselves.

The ink is thresholded, thinned to one-pixel centre lines (Zhang-Suen), and the skeleton is walked
into polylines from its endpoints and junctions, simplified (Douglas-Peucker) and written as paths,
ordered so the pen travels the sheet in a natural way: the long structural lines first, top to
bottom, then the detail. Pure numpy and PIL; nothing else is installed here.

Usage: scripts/trace_drawing.py in.png out.svg [--stroke 1.4] [--min 6] [--tol 0.75] [--wash]
With --wash the pale flat tint (if any) is kept as a soft filled region behind the lines.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RED = '#e91c24'


RED_MIN = 25


def ink_mask(im):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # Red ink: red above green and blue (anti-aliased edges of a hairline are faint, so the bar is low)
    return ((r - np.maximum(g, b)) > RED_MIN) & (np.maximum(g, b) < 238)


def wash_mask(im):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pale = (np.minimum(np.minimum(r, g), b) > 170) & ((r + g + b) < 3 * 250)
    return pale & ~ink_mask(im)


def thin(mask):
    """Zhang-Suen thinning, vectorised per sub-iteration."""
    img = mask.astype(np.uint8).copy()
    img[0, :] = img[-1, :] = img[:, 0] = img[:, -1] = 0
    while True:
        changed = False
        for step in (0, 1):
            p2 = np.roll(img, 1, 0)
            p3 = np.roll(np.roll(img, 1, 0), -1, 1)
            p4 = np.roll(img, -1, 1)
            p5 = np.roll(np.roll(img, -1, 0), -1, 1)
            p6 = np.roll(img, -1, 0)
            p7 = np.roll(np.roll(img, -1, 0), 1, 1)
            p8 = np.roll(img, 1, 1)
            p9 = np.roll(np.roll(img, 1, 0), 1, 1)
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            B = sum(n.astype(np.int16) for n in nb)
            seq = nb + [p2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(np.int16) for i in range(8))
            if step == 0:
                c1 = (p2 * p4 * p6) == 0
                c2 = (p4 * p6 * p8) == 0
            else:
                c1 = (p2 * p4 * p8) == 0
                c2 = (p2 * p6 * p8) == 0
            rm = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c1 & c2
            if rm.any():
                img[rm] = 0
                changed = True
        if not changed:
            return img.astype(bool)


def neighbours(y, x, sk):
    out = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if (dy or dx) and sk[y + dy, x + dx]:
                out.append((y + dy, x + dx))
    return out


def walk(sk):
    """Walk the skeleton into polylines: from endpoints and junctions first, then any loops left."""
    sk = sk.copy()
    H, W = sk.shape
    ys, xs = np.nonzero(sk)
    deg = np.zeros_like(sk, dtype=np.uint8)
    for y, x in zip(ys, xs):
        deg[y, x] = len(neighbours(y, x, sk))
    used = np.zeros_like(sk, dtype=bool)
    lines = []

    def trace(y, x):
        line = [(y, x)]
        used[y, x] = True
        while True:
            nxt = [(ny, nx) for ny, nx in neighbours(y, x, sk) if not used[ny, nx]]
            if not nxt:
                break
            # Prefer continuing straight-ish: the neighbour closest to the current heading
            if len(line) >= 2 and len(nxt) > 1:
                hy, hx = line[-1][0] - line[-2][0], line[-1][1] - line[-2][1]
                nxt.sort(key=lambda p: -((p[0] - y) * hy + (p[1] - x) * hx))
            ny, nx = nxt[0]
            line.append((ny, nx))
            used[ny, nx] = True
            y, x = ny, nx
        return line

    # The pen runs through junctions along the straightest continuation; the other branches start
    # from their own first free pixel afterwards (a one-pixel gap that round caps close)
    for y, x in zip(ys, xs):
        if deg[y, x] == 1 and not used[y, x]:
            line = trace(y, x)
            if len(line) > 1:
                lines.append(line)
    for y, x in zip(ys, xs):
        if not used[y, x]:
            line = trace(y, x)
            if len(line) > 1:
                lines.append(line)
    return lines


def rdp(points, tol):
    if len(points) < 3:
        return points
    pts = np.asarray(points, dtype=float)
    keep = np.zeros(len(pts), dtype=bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        seg = pts[b] - pts[a]
        L = np.hypot(*seg) or 1e-9
        rel = pts[a + 1:b] - pts[a]
        d = np.abs(seg[0] * rel[:, 1] - seg[1] * rel[:, 0]) / L
        i = int(np.argmax(d))
        if d[i] > tol:
            k = a + 1 + i
            keep[k] = True
            stack.append((a, k))
            stack.append((k, b))
    return [tuple(p) for p in pts[keep]]


def length(line):
    p = np.asarray(line, dtype=float)
    return float(np.hypot(*(p[1:] - p[:-1]).T).sum()) if len(p) > 1 else 0.0


def order(lines, H):
    """Structural strokes first (long), each group top to bottom with a gentle left-to-right bias."""
    long_ = [l for l in lines if length(l) >= H * 0.12]
    short = [l for l in lines if length(l) < H * 0.12]
    key = lambda l: (np.mean([p[0] for p in l]) + 0.25 * np.mean([p[1] for p in l]))
    return sorted(long_, key=key) + sorted(short, key=key)


def main():
    args = sys.argv[1:]
    opts = {'--stroke': '1.4', '--min': '3', '--tol': '0.75', '--up': '2', '--red': '25'}
    wash = '--wash' in args
    files = []
    i = 0
    while i < len(args):
        if args[i] in opts:
            opts[args[i]] = args[i + 1]
            i += 2
        elif args[i] == '--wash':
            i += 1
        else:
            files.append(args[i])
            i += 1
    src, dst = Path(files[0]), Path(files[1])
    global RED_MIN
    RED_MIN = int(opts['--red'])
    im = Image.open(src).convert('RGB')
    W, H = im.size
    up = int(opts['--up'])
    if up > 1:
        im = im.resize((W * up, H * up), Image.LANCZOS)
    mask = ink_mask(im)
    # Close one-pixel gaps in the ink before thinning
    mask = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    sk = thin(mask)
    lines = [rdp(l, float(opts['--tol']) * up) for l in walk(sk)]
    lines = [[(y / up, x / up) for y, x in l] for l in lines]
    lines = [l for l in lines if length(l) >= float(opts['--min'])]
    lines = order(lines, H)
    total = sum(length(l) for l in lines)
    parts = []
    if wash:
        wm = wash_mask(Image.open(src).convert('RGB'))
        wm = np.asarray(Image.fromarray(wm.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(6))) > 128
        # The wash as a coarse bitmap rendered through a data URI would be heavy; keep it as a soft rect per row band
        ys, xs = np.nonzero(wm)
        if len(ys):
            parts.append(f'<rect x="{xs.min()}" y="{ys.min()}" width="{xs.max() - xs.min()}" height="{ys.max() - ys.min()}" fill="#e9d9bd" fill-opacity="0.35" rx="18" data-wash="1" />')
    paths = []
    for l in lines:
        d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for y, x in l)
        paths.append(f'<path d="{d}" />')
    svg = (f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">\n'
           + ''.join(parts)
           + f'<g fill="none" stroke="{RED}" stroke-width="{opts["--stroke"]}" stroke-linecap="round" stroke-linejoin="round">\n'
           + '\n'.join(paths) + '\n</g>\n</svg>\n')
    dst.write_text(svg)
    print(f'{src.name}: {int(mask.sum())} ink px, {int(sk.sum())} skeleton px, {len(lines)} strokes, {total:.0f} px of line, {len(svg) // 1024} KB')


if __name__ == '__main__':
    main()
