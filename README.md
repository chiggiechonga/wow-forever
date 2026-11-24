# WoW Forever leveling helper

- `index.html`: Journey, the leveling route (main page)
- `helper.js` / `helper.css`: shared engine (addon sync, "right now" list, potions calculator)
- `professions.html` / `professions.js`: profit page with an Alchemy / Tailoring switch (`?p=alchemy` or `?p=tailoring`): top sellers, profit board, craft or sell raw, shopping list. `alchemy.html` redirects here
- `data/alchemy.json`: every Forever alchemy recipe + mats + item IDs
- `data/tailoring.json`: Forever tailoring recipes (metabot.gg) + mats + item IDs; cloth is the "raw" list, threads/dyes the vendor list
- `data/prices.json`, `data/history.json`: AH prices, refreshed hourly by `.github/workflows/ah-prices.yml` (`scripts/fetch_prices.py`, needs `BLIZZARD_CLIENT_ID` + `BLIZZARD_CLIENT_SECRET` secrets; realm in `data/ah-config.json`)
- `alts.html`: alt leveling guides hub, linking `paladin.html`, `frost-mage.html` and `rogue.html` (levels 1 to 35)
- `addon/PolestarPack_Hearthbound.zip`: the Journey route as a Polestar community guide pack (arrow + auto check-offs). Rebuild with `scripts/polestar/gen.py` (needs a Polestar clone with forge built and the QuestieDB Forever pins), then `forge guide compile --pack <pack> --no-data`
- `addon/ForeverGuide/`: the in-game addon (`/fg` makes a sync code). `addon/ForeverGuide.zip` is the download

