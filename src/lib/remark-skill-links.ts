import path from "node:path";

import type { Nodes, Root } from "mdast";

import { site } from "./site.ts";

const EXTERNAL_OR_ANCHOR = /^(?:[a-z][a-z\d+.-]*:|\/|#)/iu;
const REFERENCE_FILE = /^references\/(?<slug>[^/]+)\.md$/u;

/**
 * Where a relative link written inside `skills/<skill>/<fromDir>/` points on the website. The markdown links
 * are written for GitHub and for agents reading the files, so `references/foo.md` has to become the
 * reference page, and anything the site doesn't render (scripts, evals) the file on GitHub.
 */
export const skillLinkHref = (url: string, skill: string, fromDir: string) => {
  if (EXTERNAL_OR_ANCHOR.test(url)) {
    return url;
  }

  const hashAt = url.indexOf("#");
  const target = hashAt === -1 ? url : url.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : url.slice(hashAt);
  const resolved = path.posix.normalize(path.posix.join(fromDir, target));

  if (resolved === "SKILL.md") {
    return `/skills/${skill}${hash}`;
  }

  const slug = REFERENCE_FILE.exec(resolved)?.groups?.["slug"];

  if (slug !== undefined) {
    return `/skills/${skill}/references/${slug}${hash}`;
  }

  return `${site.githubUrl}/blob/main/${path.posix.join("skills", skill, resolved)}${hash}`;
};

const rewrite = (node: Nodes, href: (url: string) => string) => {
  if (node.type === "link" || node.type === "definition") {
    node.url = href(node.url);
  }

  if ("children" in node) {
    for (const child of node.children) {
      rewrite(child, href);
    }
  }
};

/** Remark plugin applying `skillLinkHref` to every link and link definition; use as `[remarkSkillLinks, options]`. */
export const remarkSkillLinks =
  ({ skill, fromDir }: { skill: string; fromDir: string }) =>
  (tree: Root) => {
    rewrite(tree, (url) => skillLinkHref(url, skill, fromDir));
  };
