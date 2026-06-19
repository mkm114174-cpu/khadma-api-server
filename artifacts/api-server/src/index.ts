import app from "./app";
import { logger } from "./lib/logger";
import { startReassignSweep } from "./lib/reassign";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed built-in skills on startup
  try {
    const { seedSkills } = await import("@workspace/db/seed/skills");
    await seedSkills();
    logger.info("Skills seeded (if not already present)");
  } catch (err) {
    logger.error({ err }, "Failed to seed skills");
  }

  startReassignSweep();
});
