import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });

import { createApp } from "./app";
import { connectDB } from "./config/db";

const port = Number(process.env.PORT || 5006);

async function start() {
  await connectDB();

  const secretSet = !!process.env.JWT_ACCESS_SECRET;
  // eslint-disable-next-line no-console
  console.log(`JWT_ACCESS_SECRET loaded: ${secretSet ? "yes" : "no (using fallback)"}`);

  createApp().listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`vendor-service running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
