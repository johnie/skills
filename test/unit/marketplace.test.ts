import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { discoverSkills } from "../helpers/skills";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const MARKETPLACE_PATH = join(REPO_ROOT, ".claude-plugin/marketplace.json");
const SKILL_PATH_REGEX = /^\.\/skills\/[a-z0-9]+(-[a-z0-9]+)*$/;

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

function readMarketplace(): Marketplace {
  return JSON.parse(readFileSync(MARKETPLACE_PATH, "utf-8")) as Marketplace;
}

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
    const declared = (marketplace.plugins[0]?.skills ?? []).slice().sort();
    const expected = skills.map((name) => `./skills/${name}`).sort();

    const missing = expected.filter((path) => !declared.includes(path));
    const dangling = declared.filter((path) => !expected.includes(path));

    expect(
      missing,
      `Skills on disk missing from marketplace.json: ${missing.join(", ")}`
    ).toEqual([]);
    expect(
      dangling,
      `marketplace.json entries with no skill on disk: ${dangling.join(", ")}`
    ).toEqual([]);
  });

  test("skill paths are unique", () => {
    const declared = marketplace.plugins[0]?.skills ?? [];
    expect(new Set(declared).size).toBe(declared.length);
  });

  test("skill paths use the ./skills/<name> form", () => {
    for (const path of marketplace.plugins[0]?.skills ?? []) {
      expect(path).toMatch(SKILL_PATH_REGEX);
    }
  });
});
