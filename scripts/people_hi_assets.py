"""Cut-outs for the People line from the 2k portraits in media-src/people/hi: background removed, trimmed to the
figure with a little air, set on a 2:3 transparent canvas anchored at the bottom, saved as 1400px-tall WebP.
Also refreshes the matching entries under "people" in the asset manifest."""
import json, pathlib, sys
from PIL import Image
from rembg import remove, new_session
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'media-src/people/hi'; out = root / 'impact/public/media/people'; out.mkdir(parents=True, exist_ok=True)
session = new_session('u2net_human_seg')
H = 1400; RATIO = 2 / 3; PAD = 0.03
def load(p):
    raw = p.read_text(); end = max(raw.rfind(']'), raw.rfind('}')); d = json.loads(raw[:end + 1]); return d[0] if isinstance(d, list) else d
items = []
for png in sorted(src.glob('p*.png')):
    k = png.stem
    im = Image.open(png).convert('RGBA')
    cut = remove(im, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=8)
    a = cut.getchannel('A'); bbox = a.point(lambda v: 255 if v > 12 else 0).getbbox()
    l, t, r, b = bbox; w, h = cut.size
    # keep the bottom edge (the frame's waist line) and give the figure a little air on the other sides
    pad = round(PAD * h); l = max(0, l - pad); r = min(w, r + pad); t = max(0, t - pad); b = h
    fig = cut.crop((l, t, r, b)); fw, fh = fig.size
    cw = max(fw, round(fh * RATIO)); ch = max(fh, round(cw / RATIO))
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); canvas.paste(fig, ((cw - fw) // 2, ch - fh))
    s = H / ch; canvas = canvas.resize((round(cw * s), H), Image.LANCZOS)
    canvas.save(out / f'{k}.webp', 'WEBP', quality=86, method=6)
    print(k, 'figure', (fw, fh), 'canvas', canvas.size)
    j = src / f'{k}.json'
    if j.exists() and j.stat().st_size:
        d = load(j)
        items.append({'key': f'people-{k}', 'generationId': d.get('id'), 'model': d.get('display_name', 'GPT Image 2.5'), 'jobType': d.get('job_type', 'gpt_image_2_5'), 'createdAt': d.get('created_at'),
                      'settings': {'aspect_ratio': '2:3', 'quality': 'high', 'resolution': '2k'}, 'promptFile': f'media-src/people/hi/{k}.txt', 'original': f'media-src/people/hi/{k}.png',
                      'web': f'impact/public/media/people/{k}.webp', 'resultUrl': d.get('result_url'), 'estimatedCredits': 2.75, 'status': 'selected',
                      'processing': 'rembg u2net_human_seg with alpha matting, trimmed to the figure, 2:3 canvas, 1400px WebP',
                      'usage': 'Portrait in the people line on the People section of the site and prototypes/people.html, a stand-in for a real colleague from a shoot',
                      'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 25 October 2026. Not a real colleague.'})
mp = root / 'media-src/asset-manifest.json'; m = json.loads(mp.read_text())
old = m.get('people', {}).get('items', [])
byid = {i['generationId'] for i in items}
kept = []
for o in old:
    if o.get('generationId') in byid: continue  # re-run: the same generation is re-recorded below
    if o.get('settings', {}).get('resolution') == '1k' and any(i['key'] == o['key'] for i in items): o['status'] = 'superseded by the 2k portrait of the same key'
    kept.append(o)
m['people'] = {'description': 'People line: waist-up portraits of an inclusive cast on studio white, each a stand-in for a real colleague. The portraits in use are 2k with full arms in frame. Raw PNGs stay out of git.',
               'items': kept + items, 'estimatedCredits': round(sum(i['estimatedCredits'] for i in kept + items), 2)}
mp.write_text(json.dumps(m, indent=2) + '\n')
print(len(items), 'new entries; people total', m['people']['estimatedCredits'], 'credits')
