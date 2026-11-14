"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <main style={{ maxWidth: 360, marginTop: 80 }}>
      <h1>Vibloid</h1>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
        if (r.ok) window.location.href = "/library"; else setErr("Wrong password");
      }}>
        <label>Owner password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></label>
        <div style={{ marginTop: 12 }}><button type="submit">Sign in</button> <span className="err">{err}</span></div>
      </form>
    </main>
  );
}
