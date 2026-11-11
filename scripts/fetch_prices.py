"""Hourly AH price fetch for the Alchemy page (runs in GitHub Actions).

Source: auctionhouse.fyi's public hourly snapshot (player scans; WoW Forever has no
official auction API). No key needed. Market comes from data/ah-config.json.
Writes:
  data/prices.json    latest price + amount listed for every potion and mat
  data/history.json   7 days of hourly prices (trends + "might jump")
  data/item_ids.json  item IDs + vendor prices looked up by name (cached)
"""
import gzip, io, json, os, time, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..', 'data')
P = lambda f: os.path.join(ROOT, f)
API = 'https://auctionhouse.fyi/api/v1'
UA = 'wow-forever-guide (github.com/chiggiechonga/wow-forever)'
VIALS = ('Empty Vial', 'Leaded Vial', 'Crystal Vial', 'Imbued Vial')


def load(f, default):
    try:
        return json.load(open(P(f)))
    except Exception:
        return default


def save(f, data):
    json.dump(data, open(P(f), 'w'), ensure_ascii=False, separators=(',', ':'))


def get(path):
    req = urllib.request.Request(API + path, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read()
        if r.headers.get('Content-Encoding') == 'gzip' or raw[:2] == b'\x1f\x8b':
            raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        return json.loads(raw)


def resolve_ids(alch):
    """Fill in item IDs (and vendor prices) for names our recipe data has no ID for."""
    cache = load('item_ids.json', {'ids': {}, 'vendor': {}, 'fetched': 0})
    missing = [n for n, i in alch['items'].items() if not i and n not in cache['ids']]
    if missing or not cache['vendor'] or time.time() - cache.get('fetched', 0) > 7 * 86400:
        items = get('/items')['items']
        by_name = {}
        for iid, it in items.items():
            by_name.setdefault((it.get('n') or '').lower(), (int(iid), it))
        for n in alch['items']:
            hit = by_name.get(n.lower())
            if hit and not alch['items'][n]:
                cache['ids'][n] = hit[0]
        for v in VIALS:
            hit = by_name.get(v.lower())
            if hit and hit[1].get('buy'):
                cache['vendor'][v] = hit[1]['buy']
        cache['fetched'] = int(time.time())
        save('item_ids.json', cache)
    ids = {n: (i or cache['ids'].get(n)) for n, i in alch['items'].items()}
    return ids, cache['vendor']


def main():
    cfg = load('ah-config.json', {})
    market = cfg.get('market', 'forever.pvp.alliance.us')
    alch = json.load(open(P('alchemy.json')))
    ids, vendor = resolve_ids(alch)
    snap = get(f'/ah/{market}/snapshot')
    if not snap.get('rows'):
        print(f'{market}: no scans in this source yet, nothing saved.')
        return
    rows = {r[0]: r for r in snap.get('rows', [])}          # [item, lowest price, quantity, scan ms]
    days = {d[0]: d[1] for d in snap.get('days', [])}       # item -> [[day, close, qty], ...]
    items = {}
    for name, iid in ids.items():
        r = rows.get(iid) if iid else None
        if not r or r[1] is None:
            items[name] = {'id': iid, 'qty': 0}
            continue
        d = [[x[0], x[1], x[2]] for x in days.get(iid, []) if x[1] is not None]
        items[name] = {'id': iid, 'min': r[1], 'mkt': r[1], 'qty': r[2], 'seen': r[3] // 1000, 'd': d[-8:]}
    now = int(snap.get('at', time.time() * 1000) // 1000)
    save('prices.json', {'updated': now, 'scan': (snap.get('scan') or {}).get('at') if isinstance(snap.get('scan'), dict) else snap.get('scan'),
                         'market': market, 'realm': cfg.get('label', 'PvP Alliance US'), 'source': 'auctionhouse.fyi',
                         'vendor': vendor, 'items': items})
    hist = load('history.json', {'t': [], 'p': {}, 'q': {}})
    if hist['t'] and hist['t'][-1] == now:            # same hour already saved
        print('Snapshot for this hour already saved.')
        return
    hist['t'].append(now)
    pad = [None] * (len(hist['t']) - 1)
    for name, v in items.items():
        hist['p'].setdefault(name, list(pad)).append(v.get('mkt'))
        hist['q'].setdefault(name, list(pad)).append(v.get('qty', 0))
    keep = 24 * 7
    hist['t'] = hist['t'][-keep:]
    for k in ('p', 'q'):
        for name in list(hist[k]):
            hist[k][name] = hist[k][name][-keep:]
    save('history.json', hist)
    print(f'{market}: saved prices for {sum(1 for v in items.values() if v.get("min"))} of {len(items)} items.')


if __name__ == '__main__':
    main()
