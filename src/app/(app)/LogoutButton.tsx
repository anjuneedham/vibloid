"use client";
export function LogoutButton() {
  return <button className="sec" onClick={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}>Log out</button>;
}
