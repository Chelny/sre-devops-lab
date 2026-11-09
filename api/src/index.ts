import dotenv from "dotenv";
import { createApp } from "./app.js";
import { initDb } from "./db/pool.js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  await initDb();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});