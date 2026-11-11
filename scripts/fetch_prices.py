"""Hourly AH price fetch for the Professions page (alchemy + tailoring) (runs in GitHub Actions).

Source: AHledger price tables (player scans; WoW Forever has no official auction API),
the same feed the AHledger sync app downloads. Needs repo secret AHLEDGER_KEY (your
AHledger key id, ahl_...). Item names/vendor prices: auctionhouse.fyi's public item list.
Market comes from data/ah-config.json. Prices from AHledger (ahledger.com).
Writes:
  data/prices.json    latest price + amount listed for every potion and mat
  data/history.json   7 days of hourly prices (trends + "might jump")
  data/item_ids.json  item IDs + vendor prices looked up by name (cached)
"""
import gzip, io, json, os, time, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..', 'data')
P = lambda f: os.path.join(ROOT, f)
API = 'https://auctionhouse.fyi/api/v1'
AHL = 'https://api.ahledger.com'
UA = 'wow-forever-guide (github.com/chiggiechonga/wow-forever)'
PROFS = ('alchemy', 'tailoring')                  # data/<prof>.json


def load(f, default):
    try:
        return json.load(open(P(f)))
    except Exception:
        return default


def save(f, data):
    json.dump(data, open(P(f), 'w'), ensure_ascii=False, separators=(',', ':'))


def get(path, base=API, raw_text=False, headers=None):
    h = {'User-Agent': UA, 'Accept-Encoding': 'gzip'}
    h.update(headers or {})
    req = urllib.request.Request(base + path, headers=h)
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read()
        if r.headers.get('Content-Encoding') == 'gzip' or raw[:2] == b'\x1f\x8b':
            raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        return raw.decode('utf-8') if raw_text else json.loads(raw)


def num(x):
    return int(x) if x not in ('', None) else None


def ahledger_table(market):
    """Download one market's AHL1 price table: item -> row dict."""
    key = os.environ.get('AHLEDGER_KEY', '').strip()
    if not key:
        return None, None
    hdr = {'x-ahl-sync-key': key}
    markets = get('/v1/markets', base=AHL, headers=hdr)['markets']
    ids = [m['id'] for m in markets if m.get('game') == 'forever']
    import re
    target = market.split('.')                      # forever.pvp.alliance.us
    want = [m for m in ids if re.split(r'[./]', m) == target]
    if not want:
        print('Markets AHledger lists:', ids)
        return None, None
    mid = want[0]
    text = get(f'/v1/pricetable/{mid}', base=AHL, raw_text=True, headers=hdr)
    head, _, body = text.partition('|')
    parts = text.split('|', 3)
    if parts[0] != 'AHL1' or len(parts) < 4:
        print('Unexpected price table format:', text[:200])
        return None, None
    updated, rows = int(parts[2] or 0), {}
    for line in parts[3].replace(';', '\n').splitlines():
        f = line.strip().split(':')
        if len(f) < 8 or not f[0].isdigit():
            continue
        sold = num(f[8]) if len(f) > 8 else None
        rows[int(f[0])] = {'median': num(f[1]), 'min': num(f[2]), 'qty': num(f[3]) or 0, 'm7': num(f[4]),
                           'm30': num(f[5]), 'lo30': num(f[6]), 'hi30': num(f[7]), 'perDay': sold / 10 if sold else None}
    return (mid, updated), rows


def load_profs():
    """Union of every item (and vendor item) across the profession data files."""
    items, vendor = {}, set()
    for prof in PROFS:
        d = load(f'{prof}.json', None)
        if not d:
            continue
        for n, i in d['items'].items():
            items[n] = items.get(n) or i
        vendor.update(d.get('vendor') or d.get('vials') or [])
    return {'items': items, 'vendor': sorted(vendor)}


def resolve_ids(alch):
    """Fill in item IDs (and vendor prices) for names our recipe data has no ID for."""
    cache = load('item_ids.json', {'ids': {}, 'vendor': {}, 'fetched': 0})
    tried = set(cache.get('tried', []))              # names already looked up once (found or not)
    missing = [n for n, i in alch['items'].items() if not i and n not in cache['ids'] and n not in tried]
    if missing or set(alch['vendor']) - tried or time.time() - cache.get('fetched', 0) > 7 * 86400:
        items = get('/items')['items']
        by_name = {}
        for iid, it in items.items():
            by_name.setdefault((it.get('n') or '').lower(), (int(iid), it))
        for n in alch['items']:
            hit = by_name.get(n.lower())
            if hit and not alch['items'][n]:
                cache['ids'][n] = hit[0]
        for v in alch['vendor']:
            hit = by_name.get(v.lower())
            if hit and hit[1].get('buy'):
                cache['vendor'][v] = hit[1]['buy']
        cache['tried'] = sorted(set(alch['items']) | set(alch['vendor']))
        cache['fetched'] = int(time.time())
        save('item_ids.json', cache)
    ids = {n: (i or cache['ids'].get(n)) for n, i in alch['items'].items()}
    return ids, cache['vendor']


def main():
    cfg = load('ah-config.json', {})
    market = cfg.get('market', 'forever.pvp.alliance.us')
    alch = load_profs()
    ids, vendor = resolve_ids(alch)
    print('No item ID for:', [n for n, i in ids.items() if not i][:80])
    info, rows = ahledger_table(market)
    if not rows:
        print(f'{market}: no AHledger prices (missing AHLEDGER_KEY or no table), nothing saved.')
        return
    (mid, updated) = info
    items = {}
    for name, iid in ids.items():
        r = rows.get(iid) if iid else None
        if not r or (r['median'] is None and r['min'] is None):
            items[name] = {'id': iid, 'qty': 0}
            continue
        items[name] = {'id': iid, 'mkt': r['median'] or r['min'], 'min': r['min'], 'qty': r['qty'], 'm7': r['m7'],
                       'm30': r['m30'], 'lo30': r['lo30'], 'hi30': r['hi30'], 'perDay': r['perDay']}
    now = int(time.time()) // 3600 * 3600
    save('prices.json', {'updated': updated or now, 'fetched': int(time.time()), 'market': mid,
                         'realm': cfg.get('label', 'PvP Alliance US'), 'source': 'AHledger',
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
