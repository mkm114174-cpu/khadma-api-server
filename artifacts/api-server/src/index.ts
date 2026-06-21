import { prepareAdminStatic } from "./lib/prepareAdminStatic";

await prepareAdminStatic();

await import("./startServer.js");
