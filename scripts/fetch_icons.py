"""Look up icon + quality for the gear on the Armory and Leveling BiS pages (runs in GitHub Actions).

Reads  data/icons_wanted.json   {item name: wowhead item id or null}
Writes data/item_icons.json     {item name: {"id": 123, "icon": "inv_xxx", "q": 3}}
Items we already have stay cached, so only new names are looked up.
"""
import gzip, io, json, os, re, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..', 'data')
P = lambda f: os.path.join(ROOT, f)
UA = 'Mozilla/5.0 (wow-forever-guide; github.com/chiggiechonga/wow-forever)'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        if r.headers.get('Content-Encoding') == 'gzip' or raw[:2] == b'\x1f\x8b':
            raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        return raw.decode('utf-8', 'replace')


def try_json(url):
    try:
        return json.loads(get(url))
    except Exception as e:
        print('  x', url, type(e).__name__, str(e)[:80])
        return None


def by_id(iid):
    for url in (f'https://nether.wowhead.com/forever/tooltip/item/{iid}?locale=0',
                f'https://nether.wowhead.com/classic/tooltip/item/{iid}?locale=0'):
        j = try_json(url)
        if j and j.get('icon'):
            return {'id': iid, 'icon': j['icon'].lower(), 'q': j.get('quality'), 'via': url.split('/')[3]}
    try:  # item page embeds the icon name
        html = get(f'https://www.wowhead.com/forever/item={iid}')
        m = re.search(r'"icon":"([a-z0-9_\-]+)"', html, re.I)
        q = re.search(r'"quality":(\d)', html)
        if m:
            return {'id': iid, 'icon': m.group(1).lower(), 'q': int(q.group(1)) if q else None, 'via': 'page'}
    except Exception as e:
        print('  x item page', iid, type(e).__name__)
    return None


def by_name(name):
    q = urllib.parse.quote(name)
    for env in ('forever', 'classic'):
        j = try_json(f'https://www.wowhead.com/{env}/search/suggestions-template?q={q}')
        for r in (j or {}).get('results', []):
            if r.get('typeName') == 'Item' and r.get('name', '').lower() == name.lower():
                return {'id': r['id'], 'icon': (r.get('icon') or '').lower(), 'q': r.get('quality'), 'via': env + '-search'}
    return None


def main():
    want = json.load(open(P('icons_wanted.json')))
    try:
        have = json.load(open(P('item_icons.json')))
    except Exception:
        have = {}
    for name, iid in want.items():
        if have.get(name, {}).get('icon'):
            continue
        print(name, iid)
        hit = (by_id(iid) if iid else None) or by_name(name)
        if hit and hit.get('icon'):
            have[name] = hit
            print('  ->', hit)
    json.dump(have, open(P('item_icons.json'), 'w'), ensure_ascii=False, indent=0, sort_keys=True)
    print('found', sum(1 for n in want if have.get(n, {}).get('icon')), 'of', len(want))


if __name__ == '__main__':
    main()
