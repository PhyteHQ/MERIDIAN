export const BASES = [
  { id: 'anchorage', name: 'Anchorage', system: 'Omicron Delta', code: 'ANC', index: '01', nickname: 'citadel_anchorage', aliases: ['citadel anchorage', 'anchorage'], systems: ['omicron delta', 'delta'] },
  { id: 'vermok', name: 'Vemork', system: 'Pennsylvania', code: 'VMK', index: '02', nickname: 'vemork_station', aliases: ['vemork station', 'vemork', 'vermok'], systems: ['pennsylvania'] },
] as const;
export const COMMODITIES = [
  { id: 'food', name: 'Food', code: 'FOOD', aliases: ['food rations', 'food'] },
  { id: 'alloy', name: 'Basic Alloy', code: 'ALLOY', aliases: ['basic alloy'] },
  { id: 'goods', name: 'Consumer Goods', code: 'GOODS', aliases: ['consumer goods'] },
] as const;
export type BaseId = typeof BASES[number]['id'];
export type View = 'overview' | BaseId;
export type CommodityId = typeof COMMODITIES[number]['id'];
export type Stock = { id: CommodityId; sourceName: string | null; quantity: number | null; maximum: number | null; buysFor: number | null; sellsFor: number | null };
export type BaseSnapshot = { id: BaseId; found: boolean; sourceName: string | null; sourceSystem?: string; sourceNickname?: string; commodities: Stock[] };
export type Snapshot = { fetchedAt: string; source: string; bases: BaseSnapshot[] };
export const EMPTY_STOCK = (id: CommodityId): Stock => ({ id, sourceName: null, quantity: null, maximum: null, buysFor: null, sellsFor: null });
export function getStock(base: BaseSnapshot | undefined, id: CommodityId): Stock { return base?.commodities.find(item => item.id === id) ?? EMPTY_STOCK(id); }
export const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function numeric(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
type Raw = Record<string, unknown>;
function record(value: unknown): value is Raw { return !!value && typeof value === 'object' && !Array.isArray(value); }
function systemName(base: Raw): string {
  const value = base.system_name ?? base.system;
  return record(value) ? String(value.name ?? value.nickname ?? '') : String(value ?? '');
}
function resolveBase(records: Raw[], definition: typeof BASES[number]): Raw | undefined {
  const inSystem = records.filter(base => {
    const reported = normalize(systemName(base));
    return !reported || definition.systems.some(system => normalize(system) === reported);
  });
  const exact = inSystem.filter(base => normalize(base.nickname ?? base.base_nickname) === normalize(definition.nickname));
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  const named = inSystem.filter(base => [base.name, base.base_name, base.display_name].some(value => {
    const name = normalize(value);
    return definition.aliases.some(alias => (` ${name} `).includes(` ${normalize(alias)} `));
  }));
  return named.length === 1 ? named[0] : undefined;
}
export function parseSnapshot(raw: unknown, fetchedAt = new Date().toISOString()): Snapshot {
  if (!Array.isArray(raw) || !raw.length) throw new Error('Invalid POB feed');
  const records = raw.filter(record);
  if (!records.some(base => typeof base.name === 'string' || typeof base.base_name === 'string')) throw new Error('Invalid POB records');
  return {
    fetchedAt, source: 'https://darkstat.dd84ai.com/api/pobs',
    bases: BASES.map(definition => {
      const base = resolveBase(records, definition);
      const list = base?.shop_items ?? base?.shopItems ?? base?.goods;
      const items = Array.isArray(list) ? list.filter(record) : [];
      return { id: definition.id, found: !!base, sourceName: base ? String(base.name ?? base.base_name ?? definition.name) : null,
        ...(base ? { sourceSystem: systemName(base), sourceNickname: String(base.nickname ?? base.base_nickname ?? '') } : {}),
        commodities: COMMODITIES.map(definition => {
          const item = definition.aliases.map(alias => items.find(item => normalize(item.name ?? item.good_name ?? item.commodity_name ?? item.nickname ?? item.good) === alias)).find(Boolean);
          if (!item) return EMPTY_STOCK(definition.id);
          return { id: definition.id, sourceName: String(item.name ?? item.good_name ?? item.commodity_name ?? item.nickname ?? item.good),
            quantity: numeric(item.quantity ?? item.amount ?? item.stock),
            maximum: numeric(item.max_stock ?? item.max ?? item.maxStock ?? item.max_quantity ?? item.maxQuantity),
            buysFor: numeric(item.sell_price ?? item.price_to_sell_to_base ?? item.price_sell),
            sellsFor: numeric(item.price ?? item.price_to_buy_from_base ?? item.buy_price ?? item.price_buy),
          };
        }) };
    }),
  };
}
export function totalStock(snapshot: Snapshot | null, id: CommodityId): number | null {
  if (!snapshot) return null;
  const values = BASES.map(base => getStock(snapshot.bases.find(item => item.id === base.id), id).quantity);
  return values.every(value => value !== null) ? (values as number[]).reduce((sum, value) => sum + value, 0) : null;
}
