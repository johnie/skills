import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { discoverSkills } from "../helpers/skills";

const REPO_ROOT = path.join(import.meta.dirname, "../..");
const MARKETPLACE_PATH = path.join(
  REPO_ROOT,
  ".claude-plugin/marketplace.json"
);

interface MarketplacePlugin {
  description?: string;
  name: string;
  skills?: string[];
  source?: string;
}

interface Marketplace {
  name: string;
  plugins: MarketplacePlugin[];
}

const readMarketplace = (): Marketplace =>
  // SAFETY: marketplace.json is validated by the tests below.
  JSON.parse(readFileSync(MARKETPLACE_PATH, "utf-8")) as Marketplace;

/**
 * The marketplace manifest is hand-maintained, and nothing at runtime cross-checks
 * it against the skills on disk. Without this guard a new skill is silently
 * invisible to `/plugin install`, and a deleted one leaves a dangling entry.
 */
describe("Plugin marketplace manifest", () => {
  const marketplace = readMarketplace();
  const skills = discoverSkills();

  test("declares exactly one plugin", () => {
    expect(marketplace.plugins).toHaveLength(1);
  });

  test("lists every skill on disk, and only those", () => {
    const declared = [...(marketplace.plugins[0]?.skills ?? [])].toSorted();
    const expected = skills.map((name) => `./skills/${name}`).toSorted();

    const missing = expected.filter(
      (skillPath) => !declared.includes(skillPath)
    );
    const dangling = declared.filter(
      (skillPath) => !expected.includes(skillPath)
    );

    expect(
      missing,
      `Skills on disk missing from marketplace.json: ${missing.join(", ")}`
    ).toStrictEqual([]);
    expect(
      dangling,
      `marketplace.json entries with no skill on disk: ${dangling.join(", ")}`
    ).toStrictEqual([]);
  });

  test("skill paths are unique", () => {
    const declared = marketplace.plugins[0]?.skills ?? [];
    expect(new Set(declared).size).toBe(declared.length);
  });
});
