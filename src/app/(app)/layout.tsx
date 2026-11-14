import type { ReactNode } from "react";
import { requirePage } from "@/lib/guard";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requirePage();
  return (
    <>
      <nav>
        <span className="brand">Vibloid</span>
        <a href="/library">Library</a><a href="/batch">Batch</a><a href="/studio">Studio</a><a href="/queue">Queue</a>
        <a href="/insights">Insights</a><a href="/costs">Costs</a><a href="/settings">Settings</a>
        <span className="spacer" /><LogoutButton />
      </nav>
      <main>{children}</main>
    </>
  );
}
