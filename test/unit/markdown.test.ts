import { describe, expect, it } from "vitest";

import { discoverSkills } from "../../catalog/skills";
import { nodesOf, parseMarkdown } from "../helpers/markdown";
import { readSkillFile } from "../helpers/skills";

const HARD_MAX_LINES = 800;

/** The first heading is an h1, and no heading skips a level on the way down. */
const headingProblems = (depths: number[]): string[] =>
  depths.flatMap((depth, index) => {
    const previous = depths[index - 1] ?? 0;

    return depth > previous + 1
      ? [`heading ${index + 1} jumps from level ${previous} to ${depth}`]
      : [];
  });

describe("Markdown structure", () => {
  it.each(discoverSkills())("%s has a well-formed SKILL.md", (skillName) => {
    const content = readSkillFile(skillName);
    const ast = parseMarkdown(content);
    const nodes = nodesOf(ast);

    expect(ast.children[0]?.type, "frontmatter comes first").toBe("yaml");

    expect(
      headingProblems(
        nodes.flatMap((node) => (node.type === "heading" ? [node.depth] : []))
      )
    ).toStrictEqual([]);

    expect(
      nodes.filter((node) => node.type === "code" && !node.lang?.trim()),
      "code blocks without a language"
    ).toStrictEqual([]);

    expect(content.split("\n").length).toBeLessThanOrEqual(HARD_MAX_LINES);
  });
});
