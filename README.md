# MERIDIAN

POB command dashboard for Anchorage (Omicron Delta) and Vemork (Pennsylvania).

## Product

- Combined overview and independent POB tabs.
- Tracks Food, Basic Alloy and Consumer Goods. Food maps to the feed's Food Rations entry, with Food as an alias.
- Reads the same public Darkstat POB feed as DTR. Refreshes every five minutes while visible, on returning to the page, or on request.
- Uses a direct browser request with a same-origin Worker fallback. There are no credentials or write operations against Darkstat.
- Missing values remain unknown. A total requires both bases to report the commodity; zero is a valid stock value.
- Last successfully received data stays visible during a failed refresh and is marked stale.
- Feed-provided maximum stock and base buy/sell prices appear in the POB detail view.
- Desktop and compact mobile layouts use the same data. URL hashes retain the selected POB.

## Base identity

The upstream feed reports **Citadel Anchorage** in Omicron Delta (`citadel_anchorage`) and **Vemork Station** in Pennsylvania (`vemork_station`). Matching prefers those verified identifiers and checks the system. The existing `#vermok` URL is retained for compatibility. Ambiguous or wrong-system matches remain unknown.

## Source

`lib/meridian.ts` defines the bases, commodities and parser. `app/api/stocks/route.ts` is the fixed-source HTTP fallback. `app/page.tsx` and `app/globals.css` implement the interface. No inventory data is fabricated or bundled with the site.

Use the existing pnpm lockfile and the Sites build/publish workflow. The site's persistent identity is in `.openai/hosting.json`.

## Development

Requires Node.js 22.13 or newer and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
node --experimental-strip-types --test tests/stock-parser.test.mjs
```

The design uses black and yellow. No club logos or official club affiliation are included.
