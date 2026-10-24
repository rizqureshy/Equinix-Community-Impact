"""Record the Spine card images in media-src/asset-manifest.json from the Higgsfield job JSON."""
import json, pathlib, datetime
root = pathlib.Path(__file__).resolve().parent.parent
mp = root / 'media-src/asset-manifest.json'; m = json.loads(mp.read_text())
def load(p):
    raw = p.read_text(); end = max(raw.rfind(']'), raw.rfind('}')); d = json.loads(raw[:end + 1]); return d[0] if isinstance(d, list) else d
items = []
for j in sorted((root / 'media-src/spine').glob('*.json')):
    k = j.stem
    if not (root / f'media-src/spine/{k}.png').exists(): continue
    d = load(j)
    items.append({
        'key': f'spine-{k}', 'generationId': d.get('id'), 'model': d.get('display_name', 'GPT Image 2.5'), 'jobType': d.get('job_type', 'gpt_image_2_5'), 'createdAt': d.get('created_at'),
        'settings': {'aspect_ratio': '3:2', 'quality': 'high', 'resolution': '1k'}, 'promptFile': f'media-src/spine/{k}.txt',
        'original': f'media-src/spine/{k}.png', 'web': f'impact/public/media/spine/{k}.webp', 'resultUrl': d.get('result_url'),
        'estimatedCredits': 1.5, 'status': 'selected',
        'usage': f'Card image for the "{k}" milestone on the Spine of Impact prototype (prototypes/spine.html); shown on the 3D card and in the story panel',
        'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 24 October 2026. Illustrative only; not the places, people or events named.',
    })
m['spine'] = {'description': 'Spine of Impact prototype: one illustrative still per milestone, composed onto 3D cards with a caption. Raw PNGs stay out of git; WebP copies live in impact/public/media/spine.', 'items': items, 'estimatedCredits': round(sum(i['estimatedCredits'] for i in items), 2)}
mp.write_text(json.dumps(m, indent=2) + '\n')
print(len(items), 'entries,', m['spine']['estimatedCredits'], 'credits')
