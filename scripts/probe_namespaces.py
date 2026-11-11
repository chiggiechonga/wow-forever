"""One-off: see which Blizzard API namespaces answer, to find WoW Forever's."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import fetch_prices as fp
fp.TOKEN = fp.token()
cands = ['classicforever', 'forever', 'forever1x', 'classic2x', 'classic1x', 'wowforever', 'classicf', 'cf', 'classicplus', 'classic-forever', 'fv']
for c in cands:
    for kind in ('dynamic', 'static'):
        ns = f'{kind}-{c}-us'
        path = '/data/wow/connected-realm/index' if kind == 'dynamic' else '/data/wow/item/5634'
        r = fp.get(path, ns)
        print(ns, '->', r.get('_error') or ('OK ' + (str(len(r.get('connected_realms', []))) + ' realms' if kind == 'dynamic' else r.get('name', {}).get('en_US', str(r.get('name'))))))
# realm search across everything for 'forever'
r = fp.get('/data/wow/search/realm', 'dynamic-us', **{'name.en_US': 'Forever'})
print('realm search dynamic-us forever:', json.dumps(r)[:400])
