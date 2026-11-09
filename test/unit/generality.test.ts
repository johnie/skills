import { describe, expect, it } from "vitest";

import { discoverSkills } from "../../catalog/skills";
import { scanSkill } from "../helpers/skills";
import type { LinePattern } from "../helpers/skills";

/**
 * A skill is installed into strangers' projects and stays in context for a
 * whole session, so anything specific to this repository or its author is
 * noise at best and wrong advice at worst. These patterns catch the leaks
 * that slipped through review before.
 */
const LEAK_PATTERNS: LinePattern[] = [
  {
    name: "personal home directory path",
    pattern: /\/(?:Users|home)\/[A-Za-z][\w.@-]*\//u,
  },
  {
    name: "this repository's toolchain",
    pattern: /\bultracite\b/iu,
  },
  {
    name: "author or employer name",
    pattern: /\b(?:johnie|schibsted)\b/iu,
  },
  {
    // Skills are installed independently; a sibling's SKILL.md may not exist.
    name: "cross-skill file link",
    pattern: /\.\.\/[a-z0-9-]+\/SKILL\.md/u,
  },
];

describe("Generality", () => {
  it.each(discoverSkills())(
    "%s carries no repo-specific leaks",
    (skillName) => {
      expect(scanSkill(skillName, LEAK_PATTERNS)).toStrictEqual([]);
    }
  );
});
