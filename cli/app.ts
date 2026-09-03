import { buildApplication, buildRouteMap } from "@stricli/core";

import packageJson from "../package.json" with { type: "json" };
import { interactiveCommand } from "./commands/interactive";
import { linkCommand } from "./commands/link";
import { listCommand } from "./commands/list";
import { unlinkCommand } from "./commands/unlink";

export const routes = buildRouteMap({
  docs: {
    brief: "Manage Claude skills",
  },
  routes: {
    i: interactiveCommand,
    interactive: interactiveCommand,
    link: linkCommand,
    list: listCommand,
    ls: listCommand,
    unlink: unlinkCommand,
  },
});

export const app = buildApplication(routes, {
  name: "skills",
  versionInfo: {
    currentVersion: packageJson.version,
  },
});
