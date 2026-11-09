import { buildApplication, buildRouteMap } from "@stricli/core";

import packageJson from "../package.json" with { type: "json" };
import { interactiveCommand } from "./commands/interactive";
import { linkCommand, unlinkCommand } from "./commands/link";
import { listCommand } from "./commands/list";

const routes = buildRouteMap({
  aliases: { i: "interactive", ls: "list" },
  defaultCommand: "interactive",
  docs: {
    brief: "Manage Claude skills",
  },
  routes: {
    interactive: interactiveCommand,
    link: linkCommand,
    list: listCommand,
    unlink: unlinkCommand,
  },
});

export const app = buildApplication(routes, {
  name: "skills",
  versionInfo: {
    currentVersion: packageJson.version,
  },
});
