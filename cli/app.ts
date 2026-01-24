import { buildApplication, buildRouteMap } from "@stricli/core";
import { interactiveCommand } from "./commands/interactive";
import { linkCommand } from "./commands/link";
import { listCommand } from "./commands/list";
import { unlinkCommand } from "./commands/unlink";

export const routes = buildRouteMap({
  routes: {
    list: listCommand,
    ls: listCommand,
    link: linkCommand,
    unlink: unlinkCommand,
    interactive: interactiveCommand,
    i: interactiveCommand,
  },
  docs: {
    brief: "Manage Claude skills",
  },
});

export const app = buildApplication(routes, {
  name: "skills",
  versionInfo: {
    currentVersion: "1.0.0",
  },
});
