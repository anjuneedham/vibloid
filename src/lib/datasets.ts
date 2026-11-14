import { getPool } from "./db";

export type OhlcPoint = { t: string; o: number; h: number; l: number; c: number };
export type SeriesPoint = { t: string; v: number };
export type Dataset = { id: string; name: string; kind: "ohlc" | "series"; source: string; source_url: string | null; as_of: string | null; points: (OhlcPoint | SeriesPoint)[]; notes: string | null };

const MAX_POINTS = 5000;

/** Split one CSV line, honoring double-quoted fields (finance exports often quote numbers like "1,050.50"). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Parse CSV text. Accepts date + open/high/low/close (candles) or date + value/close/price (line). */
export function parseCsv(text: string): { kind: "ohlc" | "series"; points: (OhlcPoint | SeriesPoint)[] } {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) throw new Error("CSV needs a header and at least 2 rows");
  const head = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const ti = idx("date", "time", "timestamp", "t", "datetime");
  if (ti < 0) throw new Error("CSV needs a date column (date/time/timestamp)");
  const [oi, hi, li, ci] = [idx("open", "o"), idx("high", "h"), idx("low", "l"), idx("close", "c", "adj close", "price", "value")];
  const num = (s: string, row: number) => { const n = Number(s.replace(/[$,"]/g, "")); if (!Number.isFinite(n)) throw new Error(`row ${row}: "${s}" is not a number`); return n; };
  const rows = lines.slice(1).map(splitCsvLine);
  if (rows.length > MAX_POINTS) throw new Error(`too many rows (max ${MAX_POINTS})`);
  if (oi >= 0 && hi >= 0 && li >= 0 && ci >= 0) {
    const pts = rows.map((r, i) => ({ t: r[ti], o: num(r[oi], i + 2), h: num(r[hi], i + 2), l: num(r[li], i + 2), c: num(r[ci], i + 2) }));
    pts.forEach((p, i) => { if (p.h < Math.max(p.o, p.c) || p.l > Math.min(p.o, p.c)) throw new Error(`row ${i + 2}: high/low inconsistent with open/close`); });
    return { kind: "ohlc", points: pts };
  }
  const vi = ci >= 0 ? ci : idx("value", "price");
  if (vi < 0) throw new Error("CSV needs open/high/low/close columns, or a value/close/price column");
  return { kind: "series", points: rows.map((r, i) => ({ t: r[ti], v: num(r[vi], i + 2) })) };
}

export async function createDataset(i: { name: string; source: string; source_url?: string; as_of?: string; csv?: string; kind?: "ohlc" | "series"; points?: any[]; notes?: string }) {
  if (!i.name?.trim()) throw new Error("name is required");
  if (!i.source?.trim()) throw new Error("source is required: every chart shows where its data came from");
  const parsed = i.csv ? parseCsv(i.csv) : { kind: i.kind ?? "series", points: i.points ?? [] };
  if (parsed.points.length < 2) throw new Error("need at least 2 data points");
  const r = await getPool().query(
    `insert into datasets (name, kind, source, source_url, as_of, points, notes) values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (name) do update set kind=excluded.kind, source=excluded.source, source_url=excluded.source_url, as_of=excluded.as_of, points=excluded.points, notes=excluded.notes returning id,name,kind,source,as_of`,
    [i.name.trim(), parsed.kind, i.source.trim(), i.source_url ?? null, i.as_of ?? null, JSON.stringify(parsed.points), i.notes ?? null],
  );
  return r.rows[0];
}

export async function listDatasets() {
  return (await getPool().query("select id,name,kind,source,source_url,as_of,jsonb_array_length(points) as n, notes from datasets order by created_at desc")).rows;
}
export async function getDatasetByName(name: string): Promise<Dataset | null> {
  return (await getPool().query("select * from datasets where lower(name)=lower($1) or id::text=$1", [name])).rows[0] ?? null;
}
