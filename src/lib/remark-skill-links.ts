import path from "node:path";

import type { Nodes, Root } from "mdast";

import { isExternalLink } from "../../catalog/links.ts";
import { referenceHref, skillHref, skillSourceUrl } from "./site.ts";

const REFERENCE_FILE = /^references\/(?<slug>[^/]+)\.md$/u;

/**
 * Where a relative link written inside `skills/<skill>/<fromDir>/` points on the website. The markdown links
 * are written for GitHub and for agents reading the files, so `references/foo.md` has to become the
 * reference page, and anything the site doesn't render (scripts, evals) the file on GitHub.
 */
const skillLinkHref = (url: string, skill: string, fromDir: string) => {
  // A bare `#fragment` already points into the page the file is rendered on.
  if (isExternalLink(url) || url.startsWith("#")) {
    return url;
  }

  const hashAt = url.indexOf("#");
  const target = hashAt === -1 ? url : url.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : url.slice(hashAt);
  const resolved = path.posix.normalize(path.posix.join(fromDir, target));

  if (resolved === "SKILL.md") {
    return `${skillHref(skill)}${hash}`;
  }

  const slug = REFERENCE_FILE.exec(resolved)?.groups?.["slug"];

  if (slug !== undefined) {
    return `${referenceHref(skill, slug)}${hash}`;
  }

  return `${skillSourceUrl(skill, resolved)}${hash}`;
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
