import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { discoverSkills, getSkillPath } from "../helpers/skills";

const TRIGGER_SET = "evals/trigger-set.json";
const MIN_ITEMS = 10;
/** Both classes need real coverage; an all-positive set can't detect over-triggering. */
const MIN_PER_CLASS = 4;

interface TriggerCase {
  query: string;
  should_trigger: boolean;
}

/**
 * Trigger sets drive description tuning: each query is run against the skill
 * listing to measure whether the description activates the skill when it should.
 * They are only useful if they stay well-formed and keep both classes populated,
 * so they are validated here rather than left to drift.
 */
describe("Trigger eval sets", () => {
  // A trigger set is optional per skill, so only skills that ship one are validated.
  const withTriggerSets = discoverSkills()
    .map((skillName) => ({
      skillName,
      path: join(getSkillPath(skillName), TRIGGER_SET),
    }))
    .filter(({ path }) => existsSync(path));

  test("at least one skill ships a trigger set", () => {
    expect(withTriggerSets.length).toBeGreaterThan(0);
  });

  for (const { skillName, path } of withTriggerSets) {
    describe(`skill: ${skillName}`, () => {
      const cases = JSON.parse(readFileSync(path, "utf-8")) as TriggerCase[];

      test("is a non-trivial array of cases", () => {
        expect(Array.isArray(cases)).toBe(true);
        expect(cases.length).toBeGreaterThanOrEqual(MIN_ITEMS);
      });

      test("every case has a query and a should_trigger boolean", () => {
        for (const item of cases) {
          expect(typeof item.query).toBe("string");
          expect(item.query.trim().length).toBeGreaterThan(0);
          expect(typeof item.should_trigger).toBe("boolean");
        }
      });

      test("covers both should-trigger and should-not-trigger", () => {
        const positive = cases.filter((c) => c.should_trigger).length;
        expect(positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);
        expect(cases.length - positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);
      });

      test("has no duplicate queries", () => {
        const queries = cases.map((c) => c.query.trim().toLowerCase());
        expect(new Set(queries).size).toBe(queries.length);
      });
    });
  }
});
