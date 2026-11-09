import { onServerError, publicUrl } from "@rshono/core/server";
import { Hono } from "hono";
import { accepts } from "hono/accepts";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { trimTrailingSlash } from "hono/trailing-slash";

import { skillMarkdown } from "./lib/skills";

/**
 * Mounted at `/` ahead of the page routes, so middleware registered here wraps page requests too — auth,
 * logging, headers. The flip side: a terminal handler at a page's path shadows the page.
 */
const server = new Hono();

/** Every error the framework catches lands here: a thrown action, a failed render, SSR falling over. */
onServerError((failure, { source, request }) => {
  const message = failure instanceof Error ? failure.message : String(failure);
  console.error(
    `[error] ${source} ${new URL(request.url).pathname}: ${message}`
  );
});

/** Caps every request body before anything downstream buffers it. Raise it where you accept uploads. */
server.use(bodyLimit({ maxSize: 1024 * 1024 }));

/** Cross-origin hosts allowed to post server actions, alongside this app's own. */
const ALLOWED_ORIGINS = new Set<string>();

/** Rejects a cross-origin POST before it reaches a server action. `publicUrl(c)`, not `c.req.url`: behind a proxy those differ. */
server.use(
  csrf({
    origin: (origin, c) =>
      origin === publicUrl(c).origin || ALLOWED_ORIGINS.has(origin),
  })
);

/** `/about/` and `/about` should not be two pages. */
server.use(trimTrailingSlash({ alwaysRedirect: true }));

/** Old paths that should keep working. One place to add to, rather than a handler each. */
const REDIRECTS = { "/home": "/" } as const satisfies Record<string, string>;

for (const [from, to] of Object.entries(REDIRECTS)) {
  server.get(from, (c) => c.redirect(to, 301));
}

/** Skill pages lived under `/skills/` before they moved to the root: `/skills/commit` is now `/commit`. */
server.get("/skills/:path{.+}", (c) =>
  c.redirect(`/${c.req.param("path")}`, 301)
);

/** A JSON API route, with no page involved. The layout links to it. */
server.get("/api/health", (c) => c.json({ status: "ok" }));

/**
 * `/:name` with `Accept: text/markdown` answers the whole skill as one markdown document (`skillMarkdown`):
 * what an agent fetches to read or install it. Anything else, browsers included, falls through to the page.
 * `Vary: Accept` on both, so a cache never hands one to the other.
 */
server.get("/:name", async (c, downstream) => {
  const wanted = accepts(c, {
    default: "text/html",
    header: "Accept",
    supports: ["text/html", "text/markdown"],
  });

  const markdown =
    wanted === "text/markdown"
      ? await skillMarkdown(c.req.param("name"))
      : undefined;

  if (markdown === undefined) {
    await downstream();
    c.header("Vary", "Accept", { append: true });

    return;
  }

  c.header("Vary", "Accept");
  c.header("ETag", markdown.etag);

  const fresh = c.req
    .header("If-None-Match")
    ?.split(",")
    .some((tag) => tag.trim() === markdown.etag);

  if (fresh === true) {
    return c.body(null, 304);
  }

  return c.body(markdown.body, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
});

export default server;

/** `hc<AppType>('/')` from `hono/client` gives paths, params and responses typed against the handlers above. */
export type AppType = typeof server;
