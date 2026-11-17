import { getPool } from "../src/lib/db";
import { createChannel } from "../src/lib/channels";

/** Idempotent: creates The Gold Journal (own YouTube channel, own voice and history). Connect its YouTube account in the app afterwards. */
(async () => {
  const db = getPool();
  const ex = (await db.query("select id from channels where slug='the-gold-journal'")).rows[0];
  if (ex) console.log("The Gold Journal already exists:", ex.id);
  else {
    const c = await createChannel({ name: "The Gold Journal", slug: "the-gold-journal", kind: "attention", niche: "gold" });
    console.log("created The Gold Journal:", c.id);
  }
  await db.end();
})();
