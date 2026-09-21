# MERIDIAN

Schwarz-gelbes POB-Dashboard für **Anchorage** (Omicron Delta) und **Vemork** (Pennsylvania), veröffentlicht über GitHub Pages wie DTR.

Geplante Adresse nach der einmaligen Pages-Aktivierung: **https://phytehq.github.io/MERIDIAN/**

## GitHub Pages

Die fertige Webseite liegt direkt im Repository: `index.html`, `assets/`, `favicon.svg` und `.nojekyll`. GitHub braucht dafür keinen Server, keine Zugangsdaten und keinen zusätzlichen Build.

Einmalig unter **Settings → Pages** einstellen:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**
- **Save**

Danach veröffentlicht GitHub Änderungen an den fertigen Dateien automatisch.

## Funktionen

- Gesamtübersicht und einzelne POB-Ansichten.
- Food, Basic Alloy und Consumer Goods; Food entspricht dem Feed-Eintrag Food Rations (Alias: Food).
- Direkter Abruf des öffentlichen Darkstat-POB-Feeds per POST, wie bei DTR. Kein eigener API-Server erforderlich.
- Automatische Aktualisierung alle fünf Minuten bei sichtbarer Seite, beim Zurückkehren und per Schaltfläche.
- Fehlende Werte bleiben unbekannt. Eine Gesamtsumme wird nur angezeigt, wenn beide Basen einen Bestand melden. Null ist ein gültiger Bestand.
- Bei Abruffehlern bleibt der letzte bekannte Stand sichtbar und wird als veraltet markiert.
- Bestandslimits sowie An- und Verkaufspreise aus dem Feed.
- Desktop- und Mobilansicht; die gewählte POB bleibt im URL-Hash erhalten.

## Basen

Der Feed meldet **Citadel Anchorage** (`citadel_anchorage`) in Omicron Delta und **Vemork Station** (`vemork_station`) in Pennsylvania. Die Zuordnung bevorzugt diese Kennungen und prüft das System. Der frühere Hash `#vermok` bleibt kompatibel. Mehrdeutige oder systemfremde Treffer werden nicht übernommen.

## Entwicklung

Node.js ab 22.13 und die in `package.json` festgelegte pnpm-Version verwenden.

```sh
pnpm install --frozen-lockfile
pnpm dev:pages
pnpm build:pages
node --experimental-strip-types --test tests/stock-parser.test.mjs
```

Nach Änderungen `pnpm build:pages` ausführen und die aktualisierten Dateien im Repository-Hauptverzeichnis mit committen. `pages/` enthält den statischen Einstieg, `app/page.tsx` und `app/globals.css` die gemeinsame Oberfläche, `lib/meridian.ts` die Datenzuordnung. Der Build verwendet relative Asset-Pfade und funktioniert unter `/MERIDIAN/`.

Der ursprüngliche Sites/Vinext-Build (`pnpm dev`, `pnpm build`, `.openai/hosting.json`) bleibt für die bereits bestehende Veröffentlichung erhalten. Der GitHub-Pages-Build bindet weder diesen Server noch `/api/stocks` ein.

Keine erfundenen Bestände, Zugangsdaten, Vereinslogos oder offizielle Vereinszugehörigkeit.
