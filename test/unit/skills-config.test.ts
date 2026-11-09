import { describe, expect, it } from "vitest";
import { z } from "zod";

import { discoverSkills } from "../../catalog/skills";
import skillsConfig from "../../skills.config";
import { SkillsConfigSchema } from "../../src/lib/skill-schema";

/**
 * The website reads each skill's listing from `skills.config.ts`. The build fails on a skill with no entry;
 * these name the problem first, and catch the drift the build can't: entries for skills that no longer exist.
 */
describe("Website skills config", () => {
  it("matches the schema", () => {
    const result = SkillsConfigSchema.safeParse(skillsConfig);

    expect(result.error && z.prettifyError(result.error)).toBeUndefined();
  });

  it("lists or excludes every skill on disk, and names no others", () => {
    const named = new Set([
      ...Object.keys(skillsConfig.skills),
      ...skillsConfig.exclude,
    ]);

    expect(
      [...named].toSorted(),
      "Every skill needs a listing under skills, or its name under exclude"
    ).toStrictEqual(discoverSkills());
  });
});
