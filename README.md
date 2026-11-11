# WoW Forever leveling helper

- `index.html`: Dwarf Priest 21-60 route (main page)
- `helper.js` / `helper.css`: shared engine (addon sync, "right now" list, potions calculator)
- `professions.html` / `professions.js`: profit page with an Alchemy / Tailoring switch (`?p=alchemy` or `?p=tailoring`): top sellers, profit board, craft or sell raw, shopping list. `alchemy.html` redirects here
- `data/alchemy.json`: every Forever alchemy recipe + mats + item IDs
- `data/tailoring.json`: Forever tailoring recipes (metabot.gg) + mats + item IDs; cloth is the "raw" list, threads/dyes the vendor list
- `data/prices.json`, `data/history.json`: AH prices, refreshed hourly by `.github/workflows/ah-prices.yml` (`scripts/fetch_prices.py`, needs `BLIZZARD_CLIENT_ID` + `BLIZZARD_CLIENT_SECRET` secrets; realm in `data/ah-config.json`)
- `addon/ForeverGuide/`: the in-game addon (`/fg` makes a sync code). `addon/ForeverGuide.zip` is the download

