import { sql } from "../src/db/client";
import { drainJobs } from "../src/lib/queue";

async function loop() {
  console.log("ASKINVEST worker started");
  for (;;) {
    try {
      const ran = await drainJobs(1);
      if (!ran) {
        await new Promise((r) => setTimeout(r, 700));
      }
    } catch (e) {
      console.error("worker loop error", e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

loop().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
