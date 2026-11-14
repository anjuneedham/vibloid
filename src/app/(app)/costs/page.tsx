"use client";
import { useApi, usd } from "@/lib/client";

export default function Costs() {
  const { data } = useApi<any>("/api/costs", 10000);
  if (!data) return <p className="mute">Loading…</p>;
  const pct = Math.min(100, Math.round(data.pct * 100));
  return (
    <>
      <h1>Costs</h1>
      {data.alert && <div className="card" style={{ borderColor: data.alert === "over" ? "var(--bad)" : "var(--accent)" }}>
        {data.alert === "over" ? "Over budget" : "Approaching budget"}: {usd(data.month)} of {usd(data.budget)} this month.
      </div>}
      <div className="card">
        <h2>This month</h2>
        <div style={{ background: "var(--line)", borderRadius: 99, height: 12, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: data.alert === "over" ? "var(--bad)" : data.alert ? "var(--accent)" : "var(--ok)" }} /></div>
        <p>{usd(data.month)} / {usd(data.budget)} budget ({pct}%)</p>
        <p className="mute" style={{ fontSize: 12 }}>LLM costs are estimates from token counts at configurable rates (LLM_INPUT_USD_PER_MTOK / LLM_OUTPUT_USD_PER_MTOK). Check your provider invoices for exact figures.</p>
      </div>
      <div className="grid">
        <div className="card"><h2>By provider</h2><table><tbody>{data.byProvider.map((p: any) => <tr key={p.provider + p.unit}><td>{p.provider}</td><td className="mute">{Math.round(p.quantity)} {p.unit}</td><td>{usd(p.cost_usd)}</td></tr>)}</tbody></table></div>
        <div className="card"><h2>Per video</h2><table><tbody>{data.perVideo.map((v: any) => <tr key={v.id}><td><a href={`/studio/${v.id}`}>{v.title}</a></td><td>{v.format}</td><td>{usd(v.cost_usd)}</td></tr>)}</tbody></table></div>
      </div>
    </>
  );
}
