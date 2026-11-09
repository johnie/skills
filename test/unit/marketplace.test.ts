import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { discoverSkills } from "../../catalog/skills";

const MARKETPLACE_PATH = path.join(
  import.meta.dirname,
  "../../.claude-plugin/marketplace.json"
);

const Marketplace = z.object({
  plugins: z.tuple([z.object({ skills: z.array(z.string()) })]),
});

/**
 * The marketplace manifest is hand-maintained, and nothing at runtime cross-checks
 * it against the skills on disk. Without this guard a new skill is silently
 * invisible to `/plugin install`, and a deleted one leaves a dangling entry.
 */
describe("Plugin marketplace manifest", () => {
  it("lists every skill on disk exactly once, and nothing else", () => {
    const {
      plugins: [plugin],
    } = Marketplace.parse(JSON.parse(readFileSync(MARKETPLACE_PATH, "utf-8")));

    expect(plugin.skills.toSorted()).toStrictEqual(
      discoverSkills().map((name) => `./skills/${name}`)
    );
  });
});
