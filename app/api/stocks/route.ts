import { parseSnapshot, type Snapshot } from '@/lib/meridian';

const SOURCE = 'https://darkstat.dd84ai.com/api/pobs';
let cached: Snapshot | null = null;
let pending: Promise<Snapshot> | null = null;

async function load(): Promise<Snapshot> {
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 60_000) return cached;
  if (pending) return pending;
  pending = (async () => {
    const response = await fetch(SOURCE, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(18_000), cache: 'no-store' });
    if (!response.ok) throw new Error('Feed unavailable');
    const next = parseSnapshot(await response.json());
    cached = next;
    return next;
  })();
  try { return await pending; } finally { pending = null; }
}
export async function GET() {
  try {
    return Response.json(await load(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return Response.json({ error: 'Die Bestände konnten nicht von Darkstat abgerufen werden.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
