import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Heading, Link, Nodes, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { describe, expect, test } from "vitest";

import { discoverSkills, fileExists, getSkillPath } from "../helpers/skills";

/**
 * Parse markdown content into an AST.
 */
const parseMarkdown = (content: string): Root => {
  const processor = remark().use(remarkFrontmatter, ["yaml"]);
  return processor.parse(content);
};

const visit = (node: Nodes, onNode: (node: Nodes) => void): void => {
  onNode(node);
  if ("children" in node) {
    for (const child of node.children) {
      visit(child, onNode);
    }
  }
};

/**
 * Extract all links from the AST.
 */
const extractLinks = (ast: Root): Link[] => {
  const links: Link[] = [];
  visit(ast, (node) => {
    if (node.type === "link") {
      links.push(node);
    }
  });
  return links;
};

const REFERENCES_PATH_RE = /^references\/\S+/u;

/**
 * Extract file paths from inline code nodes (e.g. `references/foo.md`).
 */
const extractInlineCodeReferences = (ast: Root): string[] => {
  const references: string[] = [];
  visit(ast, (node) => {
    if (node.type === "inlineCode" && REFERENCES_PATH_RE.test(node.value)) {
      references.push(node.value);
    }
  });
  return references;
};

/**
 * Plain text of a heading as the model reads it in source. `<T>` in a heading
 * parses as inline HTML, but it is type-parameter text to a reader, so keep it.
 */
const headingText = (heading: Heading): string => {
  let text = "";
  visit(heading, (node) => {
    if (
      node.type === "text" ||
      node.type === "inlineCode" ||
      node.type === "html"
    ) {
      text += node.value;
    }
  });
  return text;
};

const NON_SLUG_CHARS_RE = /[^\p{L}\p{N}\s-]/gu;
const WHITESPACE_RE = /\s/gu;

/**
 * GitHub's heading slug: lowercase, drop punctuation, spaces become hyphens.
 * Duplicate headings get `-1`, `-2`, … suffixes.
 */
const headingSlugs = (ast: Root): Set<string> => {
  const seen = new Map<string, number>();
  const slugs = new Set<string>();
  visit(ast, (node) => {
    if (node.type !== "heading") {
      return;
    }
    const base = headingText(node)
      .toLowerCase()
      .replace(NON_SLUG_CHARS_RE, "")
      .replace(WHITESPACE_RE, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  });
  return slugs;
};

const EXTERNAL_URL_RE = /^https?:\/\//u;

interface SkillMarkdownFile {
  /** Path relative to the skill root, e.g. `references/foo.md`. */
  file: string;
  ast: Root;
}

const MARKDOWN_EXT = ".md";

/**
 * SKILL.md plus every markdown file under references/. Anchors inside
 * references matter as much as in SKILL.md: a table of contents with a bad
 * anchor sends the model to the wrong section.
 */
const loadSkillMarkdown = (skillName: string): SkillMarkdownFile[] => {
  const skillPath = getSkillPath(skillName);
  const files = ["SKILL.md"];
  const referencesDir = path.join(skillPath, "references");
  if (fileExists(referencesDir)) {
    for (const entry of readdirSync(referencesDir)) {
      if (path.extname(entry) === MARKDOWN_EXT) {
        files.push(`references/${entry}`);
      }
    }
  }
  return files.map((file) => ({
    ast: parseMarkdown(readFileSync(path.join(skillPath, file), "utf-8")),
    file,
  }));
};

describe("Reference Validation", () => {
  const skills = discoverSkills();

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test.each(skills)("%s has no broken local references", (skillName) => {
    const skillPath = getSkillPath(skillName);
    const documents = loadSkillMarkdown(skillName);
    const slugsByFile = new Map(
      documents.map(({ file, ast }) => [file, headingSlugs(ast)])
    );

    const broken: string[] = [];
    for (const { file, ast } of documents) {
      const sourceDir = path.dirname(path.join(skillPath, file));
      const targets = [
        ...extractLinks(ast).map((link) => link.url),
        ...extractInlineCodeReferences(ast),
      ].filter((url) => !EXTERNAL_URL_RE.test(url));

      for (const target of new Set(targets)) {
        const [filePart, fragment] = target.split("#");
        const resolved =
          filePart === ""
            ? path.join(skillPath, file)
            : path.resolve(sourceDir, filePart);
        if (!fileExists(resolved)) {
          broken.push(`${file} -> ${target} (missing file)`);
          continue;
        }
        if (fragment === undefined || path.extname(resolved) !== MARKDOWN_EXT) {
          continue;
        }
        const targetFile = path.relative(skillPath, resolved);
        const slugs =
          slugsByFile.get(targetFile) ??
          headingSlugs(parseMarkdown(readFileSync(resolved, "utf-8")));
        if (!slugs.has(fragment)) {
          broken.push(`${file} -> ${target} (no heading with that anchor)`);
        }
      }
    }

    expect(
      broken,
      `Broken references:\n  ${broken.join("\n  ")}`
    ).toStrictEqual([]);
  });
});
