"use client";
import { useEffect, useRef, useState } from "react";

export async function api<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { window.location.href = "/login"; throw new Error("unauthorized"); }
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

/** Load once (and optionally poll); keeps screen code short. */
export function useApi<T = any>(path: string | null, pollMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useRef(() => {});
  reload.current = () => { if (path) api<T>(path).then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)); };
  useEffect(() => {
    reload.current();
    if (!pollMs) return;
    const t = setInterval(() => reload.current(), pollMs);
    return () => clearInterval(t);
  }, [path, pollMs]);
  return { data, error, reload: () => reload.current() };
}

export const usd = (n: number) => `$${(n ?? 0).toFixed((n ?? 0) < 1 ? 3 : 2)}`;
export const mmss = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
