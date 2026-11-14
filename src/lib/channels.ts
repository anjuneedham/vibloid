import { getPool } from "./db";

export type Channel = {
  id: string; name: string; slug: string | null; kind: "attention" | "brand"; niche: string;
  disclosure: any; voice: any; brand: any; youtube_channel_id: string | null;
};

/** Default disclosure text. For a brand channel promoting your OWN app, state the ownership plainly. */
export function defaultDisclosure(kind: "attention" | "brand", appName = "Trade Notes") {
  return kind === "brand"
    ? { description_footer: `Disclosure: ${appName} is my own app. This video promotes a product I own and earn money from.`, spoken: `I built ${appName}, so I'm biased.` }
    : { description_footer: "" };
}

export async function createChannel(i: { name: string; slug?: string; kind?: "attention" | "brand"; niche?: string; appName?: string; appBlurb?: string; brand?: any }) {
  const kind = i.kind ?? "attention";
  const r = await getPool().query(
    `insert into channels (name, slug, kind, niche, disclosure, voice, brand) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [i.name, i.slug ?? i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), kind, i.niche ?? "trading", JSON.stringify(defaultDisclosure(kind, i.appName)),
      JSON.stringify(kind === "brand" ? { app: { name: i.appName ?? "Trade Notes", blurb: i.appBlurb ?? "" } } : {}), JSON.stringify(i.brand ?? {})],
  );
  return r.rows[0] as Channel;
}
export async function listChannels() {
  return (await getPool().query("select id,name,slug,kind,niche,disclosure,voice,brand,youtube_channel_id,(youtube_refresh_token is not null) as youtube_connected from channels order by created_at")).rows;
}
export async function getChannel(id: string | null | undefined): Promise<Channel | null> {
  if (!id) return null;
  return (await getPool().query("select * from channels where id=$1", [id])).rows[0] ?? null;
}
export async function channelForProject(projectId: string): Promise<Channel | null> {
  const r = await getPool().query("select c.* from projects p join channels c on c.id=p.channel_id where p.id=$1", [projectId]);
  return r.rows[0] ?? null;
}
