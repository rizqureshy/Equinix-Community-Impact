"""Web copies of the People sketch images (figures 2:3 at 900px tall, kit 3:2 at 720px wide) into the sketch folder,
and manifest entries under "people-sketch"."""
import json, sys, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
def load(p):
    raw = p.read_text(); end = max(raw.rfind(']'), raw.rfind('}')); d = json.loads(raw[:end + 1]); return d[0] if isinstance(d, list) else d
items = []
for png in sorted((root / 'media-src/people').glob('*.png')):
    k = png.stem; im = Image.open(png).convert('RGB'); w, h = im.size
    if k.startswith('f'): s = 900 / h
    else: s = 720 / w
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS); im.save(out / f'{k}.webp', 'WEBP', quality=82, method=6)
    j = root / f'media-src/people/{k}.json'
    if j.exists() and j.stat().st_size:
        d = load(j)
        items.append({'key': f'people-{k}', 'generationId': d.get('id'), 'model': d.get('display_name', 'GPT Image 2.5'), 'jobType': d.get('job_type', 'gpt_image_2_5'), 'createdAt': d.get('created_at'),
                      'settings': {'aspect_ratio': '2:3' if k.startswith('f') else '3:2', 'quality': 'high', 'resolution': '1k'}, 'promptFile': f'media-src/people/{k}.txt',
                      'original': f'media-src/people/{k}.png', 'web': None, 'resultUrl': d.get('result_url'), 'estimatedCredits': 1.5, 'status': 'sketch',
                      'usage': 'People section sketches (Claude artifact "Our People Sketches"): ' + ('a full-length figure for the Standing together line-up' if k.startswith('f') else 'an object on the kit wall') + '; not on the site',
                      'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 25 October 2026. Illustrative only; not real colleagues.'})
mp = root / 'media-src/asset-manifest.json'; m = json.loads(mp.read_text())
m['people-sketch'] = {'description': 'Sketch round for redesigning the People section: 12 placeholder figures and 6 kit objects, shown only in a Claude artifact until a direction is chosen. Raw PNGs stay out of git.', 'items': items, 'estimatedCredits': round(sum(i['estimatedCredits'] for i in items), 2)}
mp.write_text(json.dumps(m, indent=2) + '\n')
print(len(items), 'entries,', m['people-sketch']['estimatedCredits'], 'credits')
