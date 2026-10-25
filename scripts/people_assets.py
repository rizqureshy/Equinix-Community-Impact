"""Web copies of the People prototype portraits (900px tall WebP) and their manifest entries under "people"."""
import json, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'impact/public/media/people'; out.mkdir(parents=True, exist_ok=True)
def load(p):
    raw = p.read_text(); end = max(raw.rfind(']'), raw.rfind('}')); d = json.loads(raw[:end + 1]); return d[0] if isinstance(d, list) else d
items = []
for png in sorted((root / 'media-src/people').glob('p*.png')):
    k = png.stem; im = Image.open(png).convert('RGB'); w, h = im.size; s = 900 / h
    im.resize((round(w * s), 900), Image.LANCZOS).save(out / f'{k}.webp', 'WEBP', quality=84, method=6)
    j = root / f'media-src/people/{k}.json'
    if j.exists() and j.stat().st_size:
        d = load(j)
        items.append({'key': f'people-{k}', 'generationId': d.get('id'), 'model': d.get('display_name', 'GPT Image 2.5'), 'jobType': d.get('job_type', 'gpt_image_2_5'), 'createdAt': d.get('created_at'),
                      'settings': {'aspect_ratio': '2:3', 'quality': 'high', 'resolution': '1k'}, 'promptFile': f'media-src/people/{k}.txt', 'original': f'media-src/people/{k}.png',
                      'web': f'impact/public/media/people/{k}.webp', 'resultUrl': d.get('result_url'), 'estimatedCredits': 1.5, 'status': 'selected',
                      'usage': 'Waist-up portrait on the People prototype (prototypes/people.html), a stand-in for a real colleague from a shoot',
                      'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 25 October 2026. Not a real colleague.'})
mp = root / 'media-src/asset-manifest.json'; m = json.loads(mp.read_text())
m['people'] = {'description': 'People prototype: ten waist-up portraits of an inclusive cast on studio white, each a stand-in for a real colleague. Raw PNGs stay out of git.', 'items': items, 'estimatedCredits': round(sum(i['estimatedCredits'] for i in items), 2)}
mp.write_text(json.dumps(m, indent=2) + '\n')
print(len(items), 'entries,', m['people']['estimatedCredits'], 'credits')
