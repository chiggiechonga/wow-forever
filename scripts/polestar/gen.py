#!/usr/bin/env python3
"""Turn the Hearthbound Journey route (index.html STOPS + plan.js PLAN) into a Polestar community pack.

Every quest row becomes accept / complete / turnin goals with the quest id, giver/ender name and map
coordinates filled in (we build with `forge --no-data`, so the guide carries everything itself).
Sources: Polestar's forever-db (quests, objectives, spawns, map frames) and the QuestieDB Forever
quest pins (giver / turn-in positions per map) for the newer Forever quests.
"""
import json, re, collections, os, sys

SITE = '/home/claude/wow-forever'
DB = '/tmp/ps/polestar/forever-db/data/'
PINS = '/tmp/ofa/QuestPins.lua'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/build/ps/pack'

rd = lambda f: [json.loads(l) for l in open(DB + f + '.jsonl')]
norm = lambda s: re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', ' ', re.sub(r"[’'`]", '', str(s).lower()))).strip()

# ---------------- reference data ----------------
Q = {q['id']: q for q in rd('quest') if 'title' in q}
NPC = {n['id']: n.get('name', '') for n in rd('npc')}
OBJ = {o['id']: o.get('name', '') for o in rd('object')}
ITEM = {}
for l in open(DB + 'item.jsonl'):
    i = json.loads(l); ITEM[i['id']] = i.get('name', '')
ST = collections.defaultdict(list); EN = collections.defaultdict(list)
for r in rd('quest_start'): ST[r['quest']].append(r)
for r in rd('quest_end'): EN[r['quest']].append(r)
OBJS = collections.defaultdict(list)
for r in rd('quest_objective'): OBJS[r['quest']].append(r)
SRC = collections.defaultdict(list)
for r in rd('item_source'): SRC[r.get('item')].append(r)
SPAWN = collections.defaultdict(list)
for r in rd('spawn'): SPAWN[(r['kind'], r['id'])].append((r['map'], r['x'], r['y']))
FRAMES = [f for f in rd('ui_map') if f['ui_map'] not in (1414, 1415, 946, 947)]

ZONES = {  # uiMapID by the names our rows use
    'Alterac Mountains': 1416, 'Arathi': 1417, 'Arathi Highlands': 1417, 'Thoradin\'s Wall': 1417, "top of Thoradin's Wall": 1417,
    'Badlands': 1418, 'Uldaman': 1418, 'Blasted Lands': 1419, 'Tirisfal Glades': 1420, 'Scarlet Monastery': 1420,
    'Silverpine Forest': 1421, 'Western Plaguelands': 1422, 'WPL': 1422, 'Eastern Plaguelands': 1423, 'EPL': 1423,
    'Hillsbrad': 1424, 'Hillsbrad Foothills': 1424, 'The Hinterlands': 1425, 'Hinterlands': 1425, 'Dun Morogh': 1426,
    'Searing Gorge': 1427, 'Blackrock Mountain': 1427, 'Burning Steppes': 1428, 'Elwynn Forest': 1429, 'Duskwood': 1431,
    'Loch Modan': 1432, 'Redridge': 1433, 'Redridge Mountains': 1433, 'Stranglethorn': 1434, 'STV': 1434, 'Booty Bay': 1434,
    'Swamp of Sorrows': 1435, 'Westfall': 1436, 'Wetlands': 1437, 'Menethil': 1437, 'Darkshore': 1439, 'Ashenvale': 1440,
    'Ashenvale (east)': 1440, 'Thousand Needles': 1441, 'Stonetalon Mountains': 1442, 'Stonetalon': 1442, 'Stonetalon (NW)': 1442,
    'Desolace': 1443, 'Feralas': 1444, 'Dire Maul West': 1444, 'Dustwallow Marsh': 1445, 'Dustwallow': 1445, 'Tanaris': 1446,
    'Tanaris (north-west)': 1446, 'Azshara': 1447, 'Felwood': 1448, 'Un Goro Crater': 1449, "Un'Goro Crater": 1449, "Un'Goro": 1449,
    'Silithus': 1451, 'Winterspring': 1452, 'Stormwind': 1453, 'Ironforge': 1455, 'Darnassus': 1457, 'Alterac Valley': 1459,
    'The Barrens': 1413, 'Southern Barrens': 1413, 'Ratchet dock': 1413, 'Riverglades': 2548, 'The Riverglades': 2548,
    "Shen'dralas": 2652, 'Mount Hyjal': 2482,
}
ZNAME = {1416: 'Alterac Mountains', 1417: 'Arathi Highlands', 1418: 'Badlands', 1419: 'Blasted Lands', 1420: 'Tirisfal Glades',
         1421: 'Silverpine Forest', 1422: 'Western Plaguelands', 1423: 'Eastern Plaguelands', 1424: 'Hillsbrad Foothills',
         1425: 'The Hinterlands', 1426: 'Dun Morogh', 1427: 'Searing Gorge', 1428: 'Burning Steppes', 1429: 'Elwynn Forest',
         1431: 'Duskwood', 1432: 'Loch Modan', 1433: 'Redridge Mountains', 1434: 'Stranglethorn Vale', 1435: 'Swamp of Sorrows',
         1436: 'Westfall', 1437: 'Wetlands', 1439: 'Darkshore', 1440: 'Ashenvale', 1441: 'Thousand Needles', 1442: 'Stonetalon Mountains',
         1443: 'Desolace', 1444: 'Feralas', 1445: 'Dustwallow Marsh', 1446: 'Tanaris', 1447: 'Azshara', 1448: 'Felwood',
         1449: "Un'Goro Crater", 1451: 'Silithus', 1452: 'Winterspring', 1453: 'Stormwind', 1455: 'Ironforge', 1457: 'Darnassus',
         1459: 'Alterac Valley', 1413: 'The Barrens', 2548: 'Riverglades', 2652: "Shen'dralas", 2482: 'Mount Hyjal'}

def zone_of(where):
    w = where.split(' · ')[0].strip()
    if w in ZONES: return ZONES[w]
    for k, v in ZONES.items():
        if w.startswith(k): return v
    return None

# QuestieDB pins: per uiMap, giver lines (!x,y,name) followed by the quests they start; ?x,y,ids,name turn-ins
PSTART = collections.defaultdict(list); PEND = collections.defaultdict(list); PQ = {}
cur_map = None; giver = None
for l in open(PINS):
    m = re.match(r'\s*\[(\d+)\] = \[\[', l)
    if m: cur_map = int(m.group(1)); continue
    l = l.strip()
    if l.startswith('!'):
        x, y, n = l[1:].split(',', 2); giver = (cur_map, float(x), float(y), n); continue
    if l.startswith('?'):
        x, y, ids, n = l[1:].split(',', 3)
        for i in ids.split('/'):
            if i.isdigit(): PEND[int(i)].append((cur_map, float(x), float(y), n))
        continue
    m = re.match(r'^(\d+)\|(\d+)\|(\d+)\|(\d+)\|([AH]?)\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|(.*)$', l)
    if m and giver:
        qid = int(m.group(1)); PSTART[qid].append(giver)
        PQ[qid] = {'id': qid, 'level': int(m.group(2)), 'title': m.group(6), 'side': {'A': 1, 'H': 2}.get(m.group(5), 3)}

def world_to_ui(mp, wx, wy, prefer=None):
    hits = []
    for f in FRAMES:
        if f['map'] != mp: continue
        if not (min(f['left'], f['right']) <= wy <= max(f['left'], f['right']) and min(f['top'], f['bottom']) <= wx <= max(f['top'], f['bottom'])): continue
        x = (f['left'] - wy) / (f['left'] - f['right']) * 100; y = (f['top'] - wx) / (f['top'] - f['bottom']) * 100
        area = abs((f['left'] - f['right']) * (f['top'] - f['bottom']))
        hits.append((0 if f['ui_map'] == prefer else 1, area, f['ui_map'], round(x, 1), round(y, 1)))
    if not hits: return None
    h = min(hits); return (h[2], h[3], h[4])

def spawn_place(kind, eid, prefer):
    best = None
    for mp, wx, wy in SPAWN.get((kind, eid), [])[:40]:
        p = world_to_ui(mp, wx, wy, prefer)
        if p and (best is None or (p[0] == prefer and best[0] != prefer)): best = p
        if best and best[0] == prefer: break
    return best

def ent_name(r):
    k = r['kind']; return NPC.get(r['id'], '') if k == 'npc' else OBJ.get(r['id'], '') if k == 'object' else ITEM.get(r['id'], '')

# ---------------- quest lookup ----------------
BYT = collections.defaultdict(set)
for q in list(Q.values()) + list(PQ.values()):
    BYT[norm(q['title'])].add(q['id'])
def qinfo(i): return Q.get(i) or PQ.get(i)

def resolve(name, where, tip, kind='do'):
    n = re.sub(r'^Hand in: ', '', name)
    n = re.sub(r'\s*\((?:turn in|if you took it|optional|hold|\d/\d|later|next)[^)]*\)', '', n, flags=re.I)
    n = re.sub(r' · step \d+.*', '', n)
    n = re.sub(r'^(Priest|Mage): (hand in )?', '', n); n = re.sub(r'\s*\((?:elite|hold|the book|part (\d+))\)', lambda m: (', part '+m.group(1)) if m.group(1) else '', n)
    n = re.sub(r'\s*\[[^\]]*\]$', '', n); n = re.sub(r': \d+ .*$', '', n); n = re.sub(r' \(only if.*$', '', n)
    part = re.search(r',? part (\d+)$', n, re.I); base = re.sub(r',? part \d+$', '', n, flags=re.I)
    c = sorted(BYT.get(norm(base), []), key=lambda i: (qinfo(i).get('level', 0), i))
    if not c: return None
    c = [i for i in c if qinfo(i).get('side') != 2 and not (qinfo(i).get('races') and not qinfo(i)['races'] & 77)]
    if not c: return None
    if len(c) == 1: return c[0]
    W = norm(where); T = norm(tip); hi = re.search(r'Hand in: ([^\n·(,]+)', tip); H = norm(hi.group(1)) if hi else ''
    def sc(i):
        s = 0
        for r in ST[i]:
            g = norm(ent_name(r))
            if g and g in W: s += 2
        for p in PSTART.get(i, []):
            if norm(p[3]) in W and kind != 'turn': s += 2
        if kind == 'turn':
            for p in PEND.get(i, []):
                if norm(p[3]) in W: s += 4
        for r in EN[i]:
            g = norm(ent_name(r))
            if kind == 'turn' and g and g in W: s += 4
            if g and H and (g in H or H in g): s += 3
            elif g and g in T: s += 1
        sd = (qinfo(i) or {}).get('side'); s += .5 if sd == 1 else -5 if sd == 2 else 0
        return s
    if part:
        k = int(part.group(1)); best = max(sc(i) for i in c)
        top = [i for i in c if sc(i) >= best - 1]
        return top[min(k - 1, len(top) - 1)]
    return max(c, key=lambda i: (sc(i), -qinfo(i).get('level', 0)))

def giver_of(qid, z):
    for p in PSTART.get(qid, []):
        if p[0] == z: return ('npc', None, p[3], p[0], p[1], p[2])
    for r in ST[qid]:
        pl = spawn_place(r['kind'], r['id'], z) if r['kind'] != 'item' else None
        nm = ent_name(r)
        if r['kind'] == 'item': return ('item', r['id'], nm, None, None, None)
        if pl: return (r['kind'], r['id'], nm, *pl)
    for p in PSTART.get(qid, []): return ('npc', None, p[3], p[0], p[1], p[2])
    return None

def ender_of(qid, z):
    for p in PEND.get(qid, []):
        if p[0] == z: return ('npc', None, p[3], p[0], p[1], p[2])
    for r in EN[qid]:
        pl = spawn_place(r['kind'], r['id'], z)
        if pl: return (r['kind'], r['id'], ent_name(r), *pl)
    for p in PEND.get(qid, []): return ('npc', None, p[3], p[0], p[1], p[2])
    return None

def obj_place(qid, z):
    for o in OBJS.get(qid, []):
        if o['kind'] == 'kill':
            p = spawn_place('npc', o['target'], z)
            if p: return p
        if o['kind'] in ('object', 'interact'):
            p = spawn_place('object', o['target'], z)
            if p: return p
        if o['kind'] == 'item':
            for s in SRC.get(o['target'], [])[:6]:
                k = s.get('kind'); sid = s.get('source') or s.get('id')
                if k in ('npc', 'drop'): p = spawn_place('npc', sid, z)
                elif k in ('object', 'gather'): p = spawn_place('object', sid, z)
                else: p = None
                if p: return p
    return None

# ---------------- text helpers ----------------
q_ = lambda s: '"' + re.sub(r'\s+', ' ', str(s).replace('"', "'")).strip() + '"'
def clean(s): return re.sub(r'\s+', ' ', str(s).replace('"', "'")).strip()
def tip_lines(t):
    t = re.sub(r'🛡️|❄|✅', '', t)
    return [clean(x) for x in re.split(r'\n|(?<=\.)\s+(?=[A-Z])', t) if clean(x)][:6]
COORD = re.compile(r'\((\d{1,2}(?:\.\d)?),\s*(\d{1,2}(?:\.\d)?)\)')

def at(z, x, y, stepz):
    s = f'@{x},{y}'
    return (f'map {z} ' if z and z != stepz else '') + s

# ---------------- route ----------------
STOPS = [json.loads(l.rstrip().rstrip(',')) for l in open(SITE + '/index.html') if l.startswith('{"id": "')]
PLANJS = open(SITE + '/plan.js').read()
import subprocess
PLAN = json.loads(subprocess.check_output(['node', '-e', "eval(require('fs').readFileSync(process.argv[1],'utf8').replace(/^const PLAN/m,'var PLAN'));process.stdout.write(JSON.stringify(PLAN))", SITE + '/plan.js']))
PRE = json.load(open(SITE + '/data/qprereq.json'))
pbase = lambda n: norm(re.sub(r',? part \d+', '', re.sub(r'^Hand in: ', '', n), flags=re.I))

# where is each quest handed in later (turn rows)?
TURN_AT = collections.defaultdict(list)
for si, s in enumerate(STOPS):
    for i, r in enumerate(s['q']):
        if r[0] == 'turn':
            TURN_AT[norm(re.sub(r'^Hand in: ', '', r[1]))].append((si, i))

stats = collections.Counter(); unmapped = []
ACC = set()
os.makedirs(OUT + '/guides', exist_ok=True)

def build_stop(si, s, nxt):
    groups = PLAN.get(s['id']) or [{'k': 'do', 'h': s['nm'], 'i': list(range(len(s['q'])))}]
    used = set(); G = []
    for g in groups:
        idx = []
        for it in g['i']:
            if isinstance(it, int): cand = [it]
            else:
                pats = [p[1:] if p.startswith('@') else p for p in it.split('|')]
                cand = [j for j, r in enumerate(s['q']) if any(r[1].startswith(p) for p in pats)]
            for j in cand:
                if j not in used: used.add(j); idx.append(j)
        if idx: G.append((g.get('h', ''), idx))
    rest = [j for j in range(len(s['q'])) if j not in used]
    if rest: G.append(('Also on this stop', rest))
    lv = re.findall(r'\d+', s['lv']); lo = lv[0]; hi = lv[-1] if len(lv) > 1 else lv[0]
    z0 = next((zone_of(r[2]) for r in s['q'] if zone_of(r[2])), 1453)
    L = [f"guide hearthbound/{s['id']}", f"title {clean(s['nm'])}", 'faction Alliance', f'levels {lo}-{max(int(hi), int(lo))}',
         f'zone map {z0}', 'author Brownie', f'keywords Hearthbound, {clean(s["zone"])[:120]}', '']
    accepted_here = set()
    for h, idx in G:
        rows = [(j, s['q'][j]) for j in idx]
        info = {}
        for j, r in rows:
            k = r[0]
            qid = resolve(r[1], r[2], r[3], k) if k in ('do', 'hold', 'turn', 'dng', 'mage') else None
            info[j] = qid
            if k in ('do', 'hold', 'turn', 'dng', 'mage'):
                stats['mapped' if qid else 'unmapped'] += 1
                if not qid and not re.match(r'(Legacy|Boat|Ride|Fly|Get there|Bind|Re-import)', r[1]) and k != 'dng': unmapped.append((s['id'], r[1]))
        # rounds: a row waits for its prerequisites in the same group
        rnd = {}
        names = {j: pbase(r[1]) for j, r in rows}
        for j, r in rows:
            pre = set(PRE.get(names[j], []))
            pm = re.search(r'part (\d+)', r[1])
            deps = [jj for jj, rr in rows if jj != j and (names[jj] in pre or (pm and names[jj] == names[j] and re.search(r'part (\d+)', rr[1]) and int(re.search(r'part (\d+)', rr[1]).group(1)) < int(pm.group(1))))]
            rnd[j] = deps
        order = {}
        def R(j, seen=()):
            if j in order: return order[j]
            if j in seen: return 1
            order[j] = 1 + max([R(d, seen + (j,)) for d in rnd[j]] or [0]); return order[j]
        for j, _ in rows: R(j)
        for rn in sorted(set(order.values())):
            part = [(j, r) for j, r in rows if order[j] == rn]
            title = clean(h) + (f' · round {rn}' if rn > 1 else '')
            zst = None
            for j, r in part:
                zst = zone_of(r[2]) or zst
            zst = zst or z0
            head = [f'step {title}', f'  zone map {zst}']
            body = []; tips = []
            # 1) hand-ins you carried + pick-ups
            for j, r in part:
                k = r[0]; qid = info[j]; z = zone_of(r[2]) or zst
                if k == 'turn':
                    if qid:
                        e = ender_of(qid, z); tt = clean(qinfo(qid)['title'])
                        g = f'  turnin {qid} {q_(tt)}'
                        if e and e[1] and e[0] == 'npc': g += f' npc {e[1]} {q_(e[2])}'
                        elif e and e[1] and e[0] == 'object': g += f' object {e[1]} {q_(e[2])}'
                        if e and e[3]: g += ' ' + at(e[3], e[4], e[5], zst)
                        body.append(g + f' -- {clean(r[2])[:90]}')
                    else:
                        body.append(f'  task {q_(r[1])} optional -- {clean(r[2])[:90]}')
            for j, r in part:
                k = r[0]; qid = info[j]; z = zone_of(r[2]) or zst
                if k in ('do', 'hold', 'dng', 'mage') and qid:
                    gv = giver_of(qid, z); tt = clean(qinfo(qid)['title'])
                    g = f'  accept {qid} {q_(tt)}'
                    if gv:
                        if gv[0] == 'item' and gv[1]: g += f' item {gv[1]} {q_(gv[2])}'
                        elif gv[0] == 'npc' and gv[1]: g += f' npc {gv[1]} {q_(gv[2])}'
                        elif gv[0] == 'object' and gv[1]: g += f' object {gv[1]} {q_(gv[2])}'
                        if gv[3]: g += ' ' + at(gv[3], gv[4], gv[5], zst)
                    elif COORD.search(r[2]):
                        x, y = COORD.search(r[2]).groups(); g += ' ' + at(z, x, y, zst)
                    if k == 'hold': g += ' -- hold it'
                    elif k == 'dng': g += ' -- dungeon quest, hold it for the run'
                    body.append(g); accepted_here.add(qid)
                elif k in ('dng',) and not qid:
                    body.append(f'  task {q_(r[1])} optional')
                    tips += tip_lines(r[3])[:2]
                elif k in ('book', 'bag', 'train', 'hearth', 'skip') or (k in ('do', 'mage') and not qid):
                    body.append(f'  task {q_(r[1])} optional')
                    tips += tip_lines(r[3])[:2]
            if body:
                L += head + ([f'  tip {clean(" · ".join(tips))[:900]}'] if tips else []) + body + ['']
            # 2) the work, one step per quest
            for j, r in part:
                k = r[0]; qid = info[j]
                if k not in ('do', 'mage') or not qid: continue
                z = zone_of(r[2]) or zst
                tl = tip_lines(r[3])
                lines = [f'step {clean(qinfo(qid)["title"])}', f'  zone map {z}']
                if tl: lines.append(f'  tip {clean(" · ".join(tl))[:1200]}')
                if OBJS.get(qid) or qid not in Q:
                    pl = None
                    cm = COORD.search(re.sub(r'Hand in:.*', '', r[3]))
                    if cm: pl = (z, cm.group(1), cm.group(2))
                    else: pl = obj_place(qid, z)
                    g = f'  complete {qid} {q_(qinfo(qid)["title"])}'
                    if pl: g += ' ' + at(pl[0], pl[1], pl[2], z)
                    lines.append(g)
                    # turn in right away unless the route hands it in at a later TURN step
                    later = [t for t in TURN_AT.get(pbase(r[1]), []) + TURN_AT.get(norm(r[1]), []) if t > (si, j)]
                    if re.search(r'\bhold\b', r[3], re.I): later = later or ['hold']
                    if not later:
                        e = ender_of(qid, z); g = f'  turnin {qid} {q_(qinfo(qid)["title"])}'
                        if e and e[1] and e[0] == 'npc': g += f' npc {e[1]} {q_(e[2])}'
                        elif e and e[1] and e[0] == 'object': g += f' object {e[1]} {q_(e[2])}'
                        if e and e[3]: g += ' ' + at(e[3], e[4], e[5], z)
                        lines.append(g)
                    else:
                        lines.append('  note Keep it: you hand this in later on the route.')
                else:
                    later = [t for t in TURN_AT.get(pbase(r[1]), []) if t > (si, j)]
                    if later or re.search(r'\bhold\b', r[3], re.I): continue
                    e = ender_of(qid, z); g = f'  turnin {qid} {q_(qinfo(qid)["title"])}'
                    if e and e[1] and e[0] == 'npc': g += f' npc {e[1]} {q_(e[2])}'
                    if e and e[3]: g += ' ' + at(e[3], e[4], e[5], z)
                    lines.append(g)
                L += lines + ['']
    out = []
    for ln in L:
        m = re.match(r'\s+(accept|turnin|complete) (\d+) ', ln)
        if m:
            qid = int(m.group(2))
            if m.group(1) == 'accept': ACC.add(qid)
            elif qid not in ACC:
                gv = giver_of(qid, None); tt = clean(qinfo(qid)['title'])
                g = f'  accept {qid} {q_(tt)}'
                if gv and gv[1] and gv[0] in ('npc', 'object', 'item'): g += f' {gv[0]} {gv[1]} {q_(gv[2])}'
                if gv and gv[3]: g += f' map {gv[3]} @{gv[4]},{gv[5]}'
                out.append(g + ' -- you should already have this one'); ACC.add(qid)
        out.append(ln)
    L = out
    if nxt: L.insert(7, f'next hearthbound/{nxt}')
    open(f"{OUT}/guides/{si:02d}-{s['id']}.guide", 'w').write('\n'.join(L) + '\n')

for si, s in enumerate(STOPS):
    build_stop(si, s, STOPS[si + 1]['id'] if si + 1 < len(STOPS) else None)
json.dump({"id": "hearthbound", "title": "Hearthbound", "author": "Brownie", "version": "0.1.0", "license": "CC-BY-4.0",
           "website": "https://chiggiechonga.github.io/wow-forever/"}, open(OUT + '/pack.json', 'w'), indent=1)
print(stats); print(len(unmapped)); print('\n'.join(f'{a} {b}' for a, b in unmapped))
