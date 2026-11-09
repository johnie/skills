import { describe, expect, it } from "vitest";
import { z } from "zod";

import skillsConfig from "../../skills.config";
import { SkillsConfigSchema } from "../../src/lib/skill-schema";
import { discoverSkills } from "../helpers/skills";

/**
 * The website reads each skill's listing from `skills.config.ts`. The build fails on a skill with no entry;
 * these name the problem first, and catch the drift the build can't: entries for skills that no longer exist.
 */
describe("Website skills config", () => {
  const skills = discoverSkills();
  const { exclude, skills: listings } = skillsConfig;
  const excluded: readonly string[] = exclude;

  it("matches the schema", () => {
    const result = SkillsConfigSchema.safeParse(skillsConfig);
    expect(result.success ? "" : z.prettifyError(result.error)).toBe("");
  });

  it("lists or excludes every skill on disk", () => {
    const missing = skills.filter(
      (name) => !(name in listings || excluded.includes(name))
    );

    expect(
      missing,
      `Skills with no entry in skills.config.ts (add a listing, or the name under exclude): ${missing.join(", ")}`
    ).toStrictEqual([]);
  });

  it("names only skills on disk", () => {
    const dangling = [...Object.keys(listings), ...excluded].filter(
      (name) => !skills.includes(name)
    );

    expect(
      dangling,
      `skills.config.ts names with no skill on disk: ${dangling.join(", ")}`
    ).toStrictEqual([]);
  });
});
