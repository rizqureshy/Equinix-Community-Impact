#!/usr/bin/env python3
"""Record the room films in media-src/asset-manifest.json.

Reads media-src/rooms/<place>.dive.json and <place>.exit.json (the Kling O3
Frames jobs now in use) and media-src/rooms/old/<place>.{dive,exit}.json (the
films they replaced, kept as alternates), and rewrites the dive and exit items
under the "rooms" key. Panorama items are left as they are. Re-run after each
film round.
"""
import datetime
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
ROOMS = ROOT / 'media-src' / 'rooms'
MANIFEST = ROOT / 'media-src' / 'asset-manifest.json'
PLACES = ['hospital', 'research', 'learning', 'homes', 'aquatic', 'datacenter']
CREDITS = 10
REMADE = '27 October 2026'
WHY = ('remade on ' + REMADE + ' after the data center became a likeness of Equinix TR2: the door renders that open and close '
       'each film now show the new building (and no longer the old white block in the background)')


def nice_date(iso):
    try:
        return datetime.datetime.fromisoformat(iso.replace('Z', '+00:00')).strftime('%-d %B %Y')
    except Exception:
        return 'an unrecorded date'


def load(path):
    if not path.exists():
        return None
    raw = path.read_text()
    end = max(raw.rfind(']'), raw.rfind('}'))
    data = json.loads(raw[: end + 1]) if end >= 0 else None
    if isinstance(data, list):
        data = data[0] if data else None
    return data if isinstance(data, dict) else None


def item(place, kind, job, old):
    door = f'media-src/rooms/{place}.door.png (render of the live model at the door)'
    room = f'media-src/rooms/{place}.room.png (perspective crop of the panorama)'
    prompt = ROOMS / f'{kind}-{place}.txt'
    if not prompt.exists():
        prompt = ROOMS / f'{kind}.txt'
    e = {
        'key': f'room-{place}-{kind}' + ('-previous' if old else ''),
        'generationId': job.get('id'),
        'model': job.get('display_name'),
        'jobType': job.get('job_type'),
        'createdAt': job.get('created_at'),
        'settings': {'duration': job.get('params', {}).get('duration'), 'mode': job.get('params', {}).get('mode'),
                     'sound': job.get('params', {}).get('sound'), 'aspect_ratio': job.get('params', {}).get('aspect_ratio')},
        'promptFile': str(prompt.relative_to(ROOT)) if not old else f'media-src/rooms/{kind}.txt',
        'inputs': [door, room] if kind == 'dive' else [room, door],
        'original': f'media-src/rooms/{"old/" if old else ""}{place}.{kind}.mp4',
        'web': (f'media-src/rooms/old/web/{place}-dive{"" if kind == "dive" else "-out"}.{{mp4,webm}} (kept as an alternate; not deployed)' if old
                else f'impact/public/media/rooms/{place}-dive{"" if kind == "dive" else "-out"}.{{mp4,webm}}'),
        'resultUrl': job.get('result_url'),
        'estimatedCredits': CREDITS,
        'status': f'superseded by room-{place}-{kind} ({WHY}); the old door render is media-src/rooms/old/{place}.door.png' if old else job.get('status', 'completed').replace('completed', 'selected'),
        'usage': (f'Dive film into the {place} room' + ('; played backwards to leave' if place == 'homes' else '')) if kind == 'dive'
                 else f'Forward exit film out of the {place} room, so nobody walks backwards',
        'provenance': f'AI generated with Higgsfield via the Higgsfield CLI on {nice_date(job.get("created_at", ""))}. Illustrative only; not the places or people named.',
    }
    if old:
        e['inputs'] = [s.replace(f'media-src/rooms/{place}.door.png', f'media-src/rooms/old/{place}.door.png') for s in e['inputs']]
    return e


def main():
    manifest = json.loads(MANIFEST.read_text())
    rooms = manifest['rooms']
    keep = [i for i in rooms['items'] if not (i['key'].startswith('room-') and (i['key'].endswith('-dive') or i['key'].endswith('-exit') or i['key'].endswith('-previous')))]
    films = []
    for place in PLACES:
        for kind in ('dive', 'exit'):
            job = load(ROOMS / f'{place}.{kind}.json')
            if job:
                films.append(item(place, kind, job, False))
    previous = []
    for place in PLACES:
        for kind in ('dive', 'exit'):
            job = load(ROOMS / 'old' / f'{place}.{kind}.json')
            if job:
                previous.append(item(place, kind, job, True))
    rooms['items'] = keep + films + previous
    rooms['estimatedCredits'] = sum(i.get('estimatedCredits') or 0 for i in rooms['items'] if i.get('status') != 'failed')
    rooms['notes'] = ('Stepping inside: one 360 panorama per stop (FLUX 3 Image, 2:1) and one dive film per stop (Kling O3 Frames, first frame a render of the '
                      'live model at the door, last frame the panorama centre), plus a forward exit film for every room but the homes path. All eleven films were '
                      f'remade on {REMADE} with door renders of the model as it stands (data center as Equinix TR2); the first set is kept as alternates '
                      '(keys ending -previous, raw films in media-src/rooms/old, web encodes in media-src/rooms/old/web, each re-downloadable from its resultUrl). '
                      'Web encodes by scripts/pano_tools.py and scripts/build_rooms.sh.')
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{len(films)} films in use, {len(previous)} previous, {len(keep)} other items, about {rooms["estimatedCredits"]} credits')


if __name__ == '__main__':
    main()
