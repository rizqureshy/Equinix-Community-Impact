#!/usr/bin/env python3
"""Record the community model pipeline in media-src/asset-manifest.json.

Reads media-src/city/<name>.json (concept image jobs) and <name>.3d.json
(image-to-3D jobs) and writes them under the "city" key, with the credit
estimates used for the budget. Re-run after each generation.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CITY = ROOT / 'media-src' / 'city'
MANIFEST = ROOT / 'media-src' / 'asset-manifest.json'
CREDITS = {'gpt_image_2_5': 2.75, 'tripo_h3_1_image_to_3d': 9}
PROVENANCE = 'AI generated with Higgsfield via the Higgsfield CLI on {date}. Illustrative only; not a real place.'
# The data center was remade on 27 October 2026 as a faithful scale model of a real Equinix building, from four reference photographs
REAL = {'b8-datacenter': 'AI generated with Higgsfield via the Higgsfield CLI on {date}, from four reference photographs of Equinix TR2 (45 Parliament Street, Toronto) supplied by the project owner; the photographs stay out of git (media-src/city/ref). A scale-model likeness, not a survey.'}
SUPERSEDED = {'b7-datacenter': 'superseded by b8-datacenter on 27 October 2026 (a faithful model of a real Equinix building)'}
import datetime
def nice_date(iso):
    try: return datetime.datetime.fromisoformat(iso.replace('Z', '+00:00')).strftime('%-d %B %Y')
    except Exception: return 'an unrecorded date'


def load(path):
    raw = path.read_text()
    # The CLI prints trailing text after the JSON; keep the JSON part.
    end = max(raw.rfind(']'), raw.rfind('}'))
    data = json.loads(raw[: end + 1]) if end >= 0 else None
    if isinstance(data, list):
        data = data[0] if data else None
    return data if isinstance(data, dict) else None


def entry(name, job, kind):
    model_id = job.get('job_type', '')
    e = {
        'key': f'{name}{"-3d" if kind == "3d" else ""}',
        'generationId': job.get('id'),
        'model': job.get('display_name'),
        'jobType': model_id,
        'createdAt': job.get('created_at'),
        'status': SUPERSEDED.get(name, job.get('status')),
        'estimatedCredits': CREDITS.get(model_id),
        'provenance': REAL.get(name, PROVENANCE).format(date=nice_date(job.get('created_at', ''))),
    }
    if name in REAL and kind == 'image':
        e['referenceImages'] = 'media-src/city/ref/3.jpg, 4.jpg, 5.jpg, 6.jpg (photographs of Equinix TR2, Toronto; not committed)'
    params = job.get('params', {})
    if kind == 'image':
        e['settings'] = {k: params.get(k) for k in ('aspect_ratio', 'quality', 'resolution', 'width', 'height')}
        e['promptFile'] = f'media-src/city/{name}.txt'
        e['styleFile'] = 'media-src/city/style.txt'
        e['original'] = f'media-src/city/{name}.png'
        e['usage'] = 'Concept image for the community model building; the input to image-to-3D'
    else:
        e['settings'] = {k: params.get(k) for k in ('texture', 'pbr', 'texture_quality', 'geometry_quality', 'orientation')}
        e['input'] = f'media-src/city/{name}.png'
        e['original'] = f'media-src/city/{name}.glb'
        e['web'] = f'impact/public/media/city/{name}.glb'
        e['resultUrl'] = job.get('result_url')
        e['usage'] = 'Building in the live community model (Three.js)'
    return e


def main():
    manifest = json.loads(MANIFEST.read_text())
    items = []
    for path in sorted(CITY.glob('b*.json')):
        m = re.match(r'(b\d+-[a-z]+)(\.3d)?\.json$', path.name)
        if not m:
            continue
        job = load(path)
        if not job:
            continue
        items.append(entry(m.group(1), job, '3d' if m.group(2) else 'image'))
    spent = sum(e['estimatedCredits'] or 0 for e in items if e['status'] != 'failed')
    manifest['city'] = {
        'notes': 'Seven buildings share media-src/city/style.txt (a clean white architectural scale model); the data center (b8) is a scale-model likeness of Equinix TR2 in Toronto made from reference photographs, replacing the earlier generic b7. Each concept image is converted with Tripo H3.1 image-to-3D, then compressed for the web by scripts/build_city.sh. Raw GLB downloads are not committed; each resultUrl re-downloads the original.',
        'estimatedCredits': spent,
        'items': items,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{len(items)} city entries, about {spent} credits')


if __name__ == '__main__':
    main()
