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
        'settings': ({'aspect_ratio': '16:9', 'resolution': '2k'} if k.endswith('-wide') else {'aspect_ratio': '3:2', 'quality': 'high', 'resolution': '1k'}), 'promptFile': f'media-src/spine/{k.replace("-wide", "")}.txt',
        'original': f'media-src/spine/{k}.png', 'web': f'impact/public/media/spine/{k}.webp', 'resultUrl': d.get('result_url'),
        'estimatedCredits': 3 if k.endswith('-wide') else 1.5, 'status': 'selected',
        'usage': ('Full-screen finale image for the five promises on the Spine of Impact prototype' if k.endswith('-wide') else f'Card image for the "{k}" milestone on the Spine of Impact prototype (prototypes/spine.html); shown on the 3D card and in the story panel'),
        'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 24 October 2026. Illustrative only; not the places, people or events named.',
    })
film = root / 'media-src/spine/film/dive.json'
if film.exists() and film.stat().st_size and (root / 'media-src/spine/film/dive.mp4').exists():
    d = load(film)
    items.append({
        'key': 'spine-dive-film', 'generationId': d.get('id'), 'model': d.get('display_name', 'Kling O3 FLF'), 'jobType': d.get('job_type', 'kling_o3_flf'), 'createdAt': d.get('created_at'),
        'settings': {'duration': 8, 'mode': 'pro', 'sound': 'off', 'aspect_ratio': '16:9'}, 'promptFile': 'media-src/spine/film/dive.txt',
        'inputs': ['media-src/spine/film/far.png (render of the Spine in preview mode)', 'media-src/spine/film/near.png (render of the first frame of the ride)'],
        'original': 'media-src/spine/film/dive.mp4', 'web': 'impact/public/media/spine/dive.{mp4,webm}', 'resultUrl': d.get('result_url'),
        'estimatedCredits': 10, 'status': 'selected',
        'usage': 'Dive film on the promises section: plays over the canvas when the visitor presses Begin, then the Spine takes over',
        'provenance': 'AI generated with Higgsfield via the Higgsfield CLI on 24 October 2026 from two renders of the site\'s own scene. Illustrative only.',
    })
m['spine'] = {'description': 'Spine of Impact prototype: one illustrative still per milestone, composed onto 3D cards with a caption. Raw PNGs stay out of git; WebP copies live in impact/public/media/spine.', 'items': items, 'estimatedCredits': round(sum(i['estimatedCredits'] for i in items), 2)}
mp.write_text(json.dumps(m, indent=2) + '\n')
print(len(items), 'entries,', m['spine']['estimatedCredits'], 'credits')
