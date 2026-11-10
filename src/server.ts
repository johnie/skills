import { onServerError, publicUrl } from "@rshono/core/server";
import { Hono } from "hono";
import { accepts } from "hono/accepts";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { trimTrailingSlash } from "hono/trailing-slash";

import { llmsTxt } from "./lib/llms-txt";
import { getSkill } from "./lib/skills";

/**
 * Mounted at `/` ahead of the page routes, so middleware registered here wraps page requests too. The flip
 * side: a terminal handler at a page's path shadows the page.
 */
const server = new Hono();

/** Every error the framework catches lands here: a thrown action, a failed render, SSR falling over. */
onServerError((failure, { source, request }) => {
  const message = failure instanceof Error ? failure.message : String(failure);
  console.error(
    `[error] ${source} ${new URL(request.url).pathname}: ${message}`
  );
});

server.use(bodyLimit({ maxSize: 1024 * 1024 }));

/** Rejects a cross-origin POST before it reaches a server action. `publicUrl(c)`, not `c.req.url`: behind a proxy those differ. */
server.use(csrf({ origin: (origin, c) => origin === publicUrl(c).origin }));

/** `/commit/` and `/commit` should not be two pages. */
server.use(trimTrailingSlash({ alwaysRedirect: true }));

/** Skill pages lived under `/skills/` before they moved to the root: `/skills/commit` is now `/commit`. */
server.get("/skills/:path{.+}", (c) =>
  c.redirect(`/${c.req.param("path")}`, 301)
);

server.get("/api/health", (c) => c.json({ status: "ok" }));

/** Ahead of `/:name`, which would match it. Plain text, not markdown, so a browser shows it instead of downloading it. */
server.get("/llms.txt", (c) => c.text(llmsTxt));

/**
 * `/:name` with `Accept: text/markdown` answers the whole skill as one markdown document (`bundleSkill`):
 * what an agent fetches to read or install it. Anything else, browsers included, falls through to the page.
 * `Vary: Accept` on both, so a cache never hands one to the other.
 */
server.get("/:name", async (c, downstream) => {
  const wanted = accepts(c, {
    default: "text/html",
    header: "Accept",
    supports: ["text/html", "text/markdown"],
  });

  const bundle =
    wanted === "text/markdown"
      ? getSkill(c.req.param("name"))?.bundle
      : undefined;

  if (bundle === undefined) {
    await downstream();
    c.header("Vary", "Accept", { append: true });

    return;
  }

  c.header("Vary", "Accept");
  c.header("ETag", bundle.etag);

  const fresh = c.req
    .header("If-None-Match")
    ?.split(",")
    .some((tag) => tag.trim() === bundle.etag);

  if (fresh === true) {
    return c.body(null, 304);
  }

  return c.body(bundle.body, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
});

export default server;
