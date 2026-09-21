'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Boxes, Check, CircleAlert, Globe2, Layers3, LayoutGrid, MapPin, Package, RefreshCw, Wheat, WifiOff } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BASES, COMMODITIES, getStock, totalStock, parseSnapshot, type Snapshot, type View, type Stock, type BaseSnapshot, type CommodityId } from '@/lib/meridian';

const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const quantity = (value: number | null | undefined) => value == null ? '—' : number.format(value);
const price = (value: number | null) => value === null ? '—' : value === 0 ? 'Kein Handel' : `${number.format(value)} Cr`;
const icon = { food: Wheat, alloy: Layers3, goods: Package };
const validView = (value: string): value is View => ['overview', 'anchorage', 'vermok'].includes(value);
function percentage(stock: Stock) { return stock.quantity !== null && stock.maximum !== null && stock.maximum > 0 ? Math.min(100, stock.quantity / stock.maximum * 100) : null; }
function Capacity({ stock, label = false }: { stock: Stock; label?: boolean }) {
  const amount = percentage(stock);
  if (amount === null) return label ? <div className="capacity-line"><span>{stock.quantity === null ? 'Bestand nicht gemeldet' : 'Kein Bestandslimit gemeldet'}</span></div> : null;
  return <><Progress className="stock-bar" value={amount} aria-label={`Bestand: ${quantity(stock.quantity)} von ${quantity(stock.maximum)}`} />{label && <div className="capacity-line"><span>{quantity(stock.quantity)} / {quantity(stock.maximum)}</span><span>{Math.round(amount)} %</span></div>}</>;
}
function SupplyCard({ id, snapshot, view, loading }: { id: CommodityId; snapshot: Snapshot | null; view: View; loading: boolean }) {
  const commodity = COMMODITIES.find(item => item.id === id)!;
  const Icon = icon[id];
  const base = snapshot?.bases.find(base => base.id === view);
  const stock = getStock(base, id);
  const total = view === 'overview' ? totalStock(snapshot, id) : stock.quantity;
  return <article className="commodity-card">
    <div className="commodity-title"><span className="commodity-icon"><Icon aria-hidden="true" /></span><div><h2 className="commodity-name">{commodity.name}</h2><div className="commodity-code">{commodity.code}</div></div></div>
    <div className="stock-block">{loading && !snapshot ? <Skeleton className="value-skeleton" /> : <div className="stock-value">{quantity(total)}</div>}<div className="stock-unit">{total === null ? (loading ? 'Wird abgerufen' : 'Bestand nicht vollständig') : 'Einheiten im Bestand'}</div></div>
    {view === 'overview' ? <div className="breakdown">{BASES.map(definition => <div className="breakdown-row" key={definition.id}><span>{definition.name}</span><strong>{quantity(getStock(snapshot?.bases.find(base => base.id === definition.id), id).quantity)}</strong></div>)}</div> : <div className="detail-capacity"><Capacity stock={stock} label /></div>}
  </article>;
}
function BaseCard({ definition, snapshot, onOpen, loading }: { definition: typeof BASES[number]; snapshot: Snapshot | null; onOpen: (view: View) => void; loading: boolean }) {
  const base = snapshot?.bases.find(base => base.id === definition.id);
  const count = COMMODITIES.filter(item => getStock(base, item.id).quantity !== null).length;
  return <article className="base-card">
    <div className="base-card-header"><div className="base-identity"><span className="base-index">{definition.index}</span><div><h3 className="base-name">{definition.name}</h3><div className="base-system">{definition.system}</div></div></div><button className="base-open" onClick={() => onOpen(definition.id)} aria-label={`${definition.name} öffnen`}><span>Öffnen</span><ArrowUpRight aria-hidden="true" /></button></div>
    <div className="base-supplies">{COMMODITIES.map(commodity => { const stock = getStock(base, commodity.id); return <div className="base-supply" key={commodity.id}><span>{commodity.name}</span><strong>{quantity(stock.quantity)}</strong><Capacity stock={stock} /></div>; })}</div>
    <div className="base-feed-status">{loading && !snapshot ? 'Bestände werden abgerufen …' : !snapshot ? 'Noch keine Bestandsdaten' : !base?.found ? 'Basis im aktuellen Feed nicht gefunden' : `${count} von 3 Waren mit Bestandsdaten`}</div>
  </article>;
}
function Details({ base }: { base: BaseSnapshot | undefined }) {
  const rows = COMMODITIES.map(commodity => ({ commodity, stock: getStock(base, commodity.id) }));
  return <>
    <div className="section-title"><h2>Waren im Detail</h2><span>Preise je Einheit</span></div>
    <div className="inventory-panel"><Table className="inventory-table"><TableHeader><TableRow><TableHead>Ware</TableHead><TableHead className="num">Bestand</TableHead><TableHead className="num">Bestandslimit</TableHead><TableHead className="num">Basis kauft für</TableHead><TableHead className="num">Basis verkauft für</TableHead></TableRow></TableHeader><TableBody>{rows.map(({ commodity, stock }) => <TableRow key={commodity.id}><TableCell><span className="inventory-name">{commodity.name}</span>{stock.sourceName && stock.sourceName !== commodity.name && <span className="inventory-alias">{stock.sourceName}</span>}</TableCell><TableCell className="num">{quantity(stock.quantity)}</TableCell><TableCell className="num">{quantity(stock.maximum)}</TableCell><TableCell className="num">{price(stock.buysFor)}</TableCell><TableCell className="num">{price(stock.sellsFor)}</TableCell></TableRow>)}</TableBody></Table></div>
    <div className="mobile-detail">{rows.map(({ commodity, stock }) => <article className="mobile-detail-card" key={commodity.id}><h3>{commodity.name}</h3><dl><dt>Bestand</dt><dd>{quantity(stock.quantity)}</dd><dt>Bestandslimit</dt><dd>{quantity(stock.maximum)}</dd><dt>Basis kauft für</dt><dd>{price(stock.buysFor)}</dd><dt>Basis verkauft für</dt><dd>{price(stock.sellsFor)}</dd></dl>{stock.sourceName && stock.sourceName !== commodity.name && <span className="inventory-alias">{stock.sourceName}</span>}</article>)}</div>
    <p className="price-note">Bestandslimits und Preise werden aus dem POB-Feed übernommen. „—“ bedeutet: nicht gemeldet.</p>
  </>;
}

export default function Home() {
  const [view, setView] = useState<View>('overview');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(0);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setLoading(true);
    const timer = setTimeout(() => controller.abort(), 35_000);
    try {
      let next: Snapshot;
      try {
        const response = await fetch('https://darkstat.dd84ai.com/api/pobs', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]), cache: 'no-store' });
        if (!response.ok) throw new Error('Unavailable');
        next = parseSnapshot(await response.json());
      } catch {
        if (controller.signal.aborted) throw new Error('Cancelled');
        const response = await fetch('/api/stocks', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Unavailable');
        next = await response.json();
      }
      if (!Array.isArray(next.bases) || !Number.isFinite(Date.parse(next.fetchedAt))) throw new Error('Invalid response');
      if (mounted.current && request.current === controller) { setSnapshot(next); setError(false); setNow(Date.now()); }
    } catch {
      if (mounted.current && request.current === controller) setError(true);
    } finally {
      clearTimeout(timer);
      if (request.current === controller) { request.current = null; if (mounted.current) setLoading(false); }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const initial = window.location.hash.replace('#', '');
    if (validView(initial)) setView(initial);
    void refresh();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 5 * 60_000);
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onHash = () => { const next = window.location.hash.replace('#', '') || 'overview'; if (validView(next)) setView(next); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('hashchange', onHash);
    return () => { mounted.current = false; request.current?.abort(); request.current = null; clearInterval(interval); clearInterval(clock); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('hashchange', onHash); };
  }, [refresh]);
  const choose = (next: string) => { if (!validView(next)) return; setView(next); window.history.replaceState(null, '', next === 'overview' ? window.location.pathname + window.location.search : '#' + next); };
  const current = BASES.find(base => base.id === view);
  const stale = !!snapshot && (error || now - Date.parse(snapshot.fetchedAt) > 15 * 60_000);
  const complete = snapshot?.bases.filter(base => base.found).length ?? 0;
  const reported = snapshot?.bases.reduce((count, base) => count + base.commodities.filter(stock => stock.quantity !== null).length, 0) ?? 0;
  const state = loading ? 'loading' : stale ? 'stale' : error ? 'error' : 'ready';
  const status = loading ? 'Wird aktualisiert' : stale ? 'Letzter bekannter Stand' : error ? 'Daten nicht erreichbar' : complete < 2 || reported < 6 ? 'Daten unvollständig' : 'Synchronisiert';
  const StatusIcon = loading ? RefreshCw : stale || error ? WifiOff : Check;
  const timestamp = snapshot ? new Date(snapshot.fetchedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  return <div className="meridian">
    <header className="app-header"><div className="header-inner"><div className="brand"><Globe2 className="brand-icon" strokeWidth={1.3} aria-hidden="true" /><div><span className="brand-name">MERIDIAN</span><div className="brand-subtitle">POB COMMAND</div></div></div><div className="header-meta"><div className="network-label">BASEN<span className="network-count">Anchorage / Vemork</span></div><span className="divider" /><div className="network-label">VERSORGUNG<span className="network-count">2 POBs · 3 Waren</span></div></div></div></header>
    <main className="workspace"><Tabs value={view} onValueChange={choose}>
      <div className="nav-row"><TabsList className="pob-tabs" aria-label="POB auswählen"><TabsTrigger value="overview" className="pob-trigger"><LayoutGrid aria-hidden="true" />Übersicht</TabsTrigger>{BASES.map(base => <TabsTrigger key={base.id} value={base.id} className="pob-trigger">{base.name}</TabsTrigger>)}</TabsList><button className="refresh-button" onClick={() => void refresh()} disabled={loading} aria-label="Bestände aktualisieren"><RefreshCw className={loading ? 'spin' : ''} aria-hidden="true" /><span>Aktualisieren</span></button></div>
      <div className="view-heading"><div><div className="eyebrow">{view === 'overview' ? <Boxes aria-hidden="true" /> : <MapPin aria-hidden="true" />}{view === 'overview' ? 'Netzwerk / Versorgung' : `POB ${current?.code} / ${current?.system}`}</div><h1>{view === 'overview' ? 'Gesamtübersicht' : current?.name}</h1><div className="context">{view === 'overview' ? BASES.map(base => `${base.name} · ${base.system}`).join(' / ') : `${current?.system} · Food, Basic Alloy & Consumer Goods`}</div></div><div className="status-block" aria-live="polite"><span className="status" data-state={state}><StatusIcon className={loading ? 'spin' : ''} aria-hidden="true" />{status}</span><span className="last-update">{timestamp ? `Abgerufen ${timestamp}` : 'Darkstat · alle 5 Minuten'}</span></div></div>
      {error && !loading && <div className="feed-message" role="status"><CircleAlert aria-hidden="true" /><span>{snapshot ? 'Darkstat ist gerade nicht erreichbar. Die zuletzt abgerufenen Bestände bleiben sichtbar; der nächste Abruf erfolgt automatisch.' : 'Darkstat ist gerade nicht erreichbar. Sobald die Verbindung steht, erscheinen die Bestände automatisch. Du kannst den Abruf auch erneut starten.'}</span></div>}
      {snapshot && complete < 2 && !error && <div className="feed-message" role="status"><CircleAlert aria-hidden="true" /><span>{snapshot.bases.filter(base => !base.found).map(base => BASES.find(definition => definition.id === base.id)?.name).join(' und ')} im aktuellen Feed nicht eindeutig gefunden. Unbekannte Bestände werden nicht als null gezählt.</span></div>}
      {(['overview', 'anchorage', 'vermok'] as View[]).map(tab => <TabsContent key={tab} value={tab}>
        <div className="commodity-grid">{COMMODITIES.map(commodity => <SupplyCard key={commodity.id} id={commodity.id} snapshot={snapshot} view={tab} loading={loading} />)}</div>
        {tab === 'overview' ? <><div className="section-title"><h2>Basen im Überblick</h2><span>Bestände je Standort</span></div><div className="bases-grid">{BASES.map(definition => <BaseCard key={definition.id} definition={definition} snapshot={snapshot} onOpen={choose} loading={loading} />)}</div></> : <Details base={snapshot?.bases.find(base => base.id === tab)} />}
      </TabsContent>)}
    </Tabs></main>
    <footer><div className="footer-inner"><span className="footer-brand">MERIDIAN / {view === 'overview' ? 'NETWORK' : current?.code}</span><span>Quelle: <a href="https://darkstat.dd84ai.com" target="_blank" rel="noreferrer">Darkstat</a> · Automatischer Abruf alle 5 Minuten</span></div></footer>
  </div>;
}
