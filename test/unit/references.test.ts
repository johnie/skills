import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Root } from "mdast";
import { describe, expect, it } from "vitest";

import { isExternalLink } from "../../catalog/links";
import { discoverSkills, skillPath } from "../../catalog/skills";
import { nodesOf, parseMarkdown } from "../helpers/markdown";

const REFERENCES_PATH_RE = /^references\/\S+/u;
const NON_SLUG_CHARS_RE = /[^\p{L}\p{N}\s-]/gu;
const WHITESPACE_RE = /\s/gu;
const MARKDOWN_EXT = ".md";

/**
 * Targets of links and link definitions, plus inline code that names a reference file (`references/foo.md`):
 * the model follows all three.
 */
const localTargets = (ast: Root): string[] =>
  nodesOf(ast)
    .flatMap((node) => {
      if (node.type === "link" || node.type === "definition") {
        return [node.url];
      }

      return node.type === "inlineCode" && REFERENCES_PATH_RE.test(node.value)
        ? [node.value]
        : [];
    })
    .filter((target) => !isExternalLink(target));

/**
 * GitHub's heading slugs: lowercase, drop punctuation, spaces become hyphens; duplicate headings get `-1`,
 * `-2`, … suffixes. The text is the heading as the model reads it in source: `<T>` parses as inline HTML, but
 * it is type-parameter text to a reader, so it stays.
 */
const headingSlugs = (ast: Root): Set<string> => {
  const seen = new Map<string, number>();
  const slugs = new Set<string>();

  for (const heading of nodesOf(ast).filter(
    (node) => node.type === "heading"
  )) {
    const base = nodesOf(heading)
      .map((node) =>
        node.type === "text" ||
        node.type === "inlineCode" ||
        node.type === "html"
          ? node.value
          : ""
      )
      .join("")
      .toLowerCase()
      .replaceAll(NON_SLUG_CHARS_RE, "")
      .replaceAll(WHITESPACE_RE, "-");

    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }

  return slugs;
};

const slugsIn = (file: string) =>
  headingSlugs(parseMarkdown(readFileSync(file, "utf-8")));

/**
 * SKILL.md plus every markdown file under references/. Anchors inside references matter as much as in
 * SKILL.md: a table of contents with a bad anchor sends the model to the wrong section.
 */
const skillMarkdownFiles = (root: string): string[] => {
  const references = path.join(root, "references");

  return [
    path.join(root, "SKILL.md"),
    ...(existsSync(references) ? readdirSync(references) : [])
      .filter((entry) => path.extname(entry) === MARKDOWN_EXT)
      .map((entry) => path.join(references, entry)),
  ];
};

describe("Reference validation", () => {
  it.each(discoverSkills())(
    "%s has no broken local references",
    (skillName) => {
      const root = skillPath(skillName);

      const broken = skillMarkdownFiles(root).flatMap((source) => {
        const ast = parseMarkdown(readFileSync(source, "utf-8"));

        return [...new Set(localTargets(ast))].flatMap((target) => {
          const [filePart = "", fragment] = target.split("#");
          const label = `${path.relative(root, source)} -> ${target}`;

          const resolved =
            filePart === ""
              ? source
              : path.resolve(path.dirname(source), filePart);

          if (!existsSync(resolved)) {
            return [`${label} (missing file)`];
          }

          const checksAnchor =
            fragment !== undefined && path.extname(resolved) === MARKDOWN_EXT;

          return checksAnchor && !slugsIn(resolved).has(fragment)
            ? [`${label} (no heading with that anchor)`]
            : [];
        });
      });

      expect(broken).toStrictEqual([]);
    }
  );
});
