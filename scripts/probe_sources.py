"""One-off: check which price sources have data for WoW Forever."""
import json, urllib.request, gzip, io
UA = 'wow-forever-guide (github.com/chiggiechonga/wow-forever)'
def fetch(url, accept='application/json'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept, 'Accept-Encoding': 'gzip'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            if raw[:2] == b'\x1f\x8b': raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
            return r.status, r.headers.get('Content-Type'), raw
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get('Content-Type'), e.read()[:300]
    except Exception as e:
        return 'ERR', '', str(e).encode()
for m in ['normal', 'pvp', 'rp']:
    for f in ['alliance', 'horde']:
        s, ct, raw = fetch(f'https://auctionhouse.fyi/api/v1/ah/forever.{m}.{f}.us/snapshot')
        try:
            d = json.loads(raw); print('ahf', m, f, s, 'rows', len(d.get('rows', [])), 'scan', d.get('scan'))
        except Exception:
            print('ahf', m, f, s, raw[:120])
for url in ['https://ahledger.com/markets/forever/pvp/alliance/us', 'https://api.ahledger.com/', 'https://ahledger.com/api/catalog']:
    s, ct, raw = fetch(url)
    print('ahl', url, s, ct, raw[:200])
