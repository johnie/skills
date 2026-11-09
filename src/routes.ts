import { defineRoutes } from "@rshono/core";

import { referencePaths, skillPaths } from "./lib/skills";

export const routes = defineRoutes({
  error: { component: () => import("./components/500") },
  notFound: { component: () => import("./components/404") },
  routes: [
    { component: () => import("./components/home"), path: "/" },
    {
      component: () => import("./components/skill"),
      path: "/:name",
      render: "static",
      staticPaths: skillPaths,
    },
    {
      component: () => import("./components/reference"),
      path: "/:name/references/:reference",
      render: "static",
      staticPaths: referencePaths,
    },
  ],
});
