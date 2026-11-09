import { describe, expect, it } from "vitest";
import { parse as parseYAML } from "yaml";
import { z } from "zod";

import { SkillFrontmatter } from "../../catalog/frontmatter";
import { discoverSkills } from "../../catalog/skills";
import { readSkillFile } from "../helpers/skills";

const FRONTMATTER = /^---\n(?<yaml>[\s\S]*?)\n---/u;

describe("Frontmatter", () => {
  it.each(discoverSkills())("%s satisfies the contract", (skillName) => {
    const yaml = FRONTMATTER.exec(readSkillFile(skillName))?.groups?.["yaml"];

    expect(yaml, "SKILL.md has no YAML frontmatter").toBeDefined();

    const result = SkillFrontmatter.safeParse(parseYAML(yaml ?? ""));

    expect(result.error && z.prettifyError(result.error)).toBeUndefined();
    // Claude Code loads a skill by directory, and the website routes by `name`: they have to agree.
    expect(result.data?.name).toBe(skillName);
  });
});
