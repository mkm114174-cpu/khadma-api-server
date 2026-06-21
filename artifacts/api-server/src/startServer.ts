import app from "./app";
import { ensureDatabaseSchema, verifyCoreTables } from "./lib/ensureDatabase";
import { prepareAdminStatic } from "./lib/prepareAdminStatic";
import { mountAdminApp } from "./lib/adminStatic";
import { logger } from "./lib/logger";
import { startReassignSweep } from "./lib/reassign";

const port = Number(process.env.PORT ?? 8080);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

app.listen(port, "0.0.0.0", async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening on 0.0.0.0");

  try {
    await prepareAdminStatic();
    mountAdminApp(app);
  } catch (adminErr) {
    logger.error({ err: adminErr }, "Admin panel setup failed");
  }

  try {
    await ensureDatabaseSchema();
    await verifyCoreTables();
  } catch (err) {
    logger.error({ err }, "Database schema setup failed");
  }

  try {
    const { seedSkills } = await import("@workspace/db/seed/skills");
    await seedSkills();
    logger.info("Skills seeded (if not already present)");
  } catch (err) {
    logger.error({ err }, "Failed to seed skills (server will continue)");
  }

  startReassignSweep();
});
