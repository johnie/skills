import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
      path: path.join(getSkillPath(skillName), TRIGGER_SET),
      skillName,
    }))
    .filter(({ path: triggerSetPath }) => existsSync(triggerSetPath));

  test("at least one skill ships a trigger set", () => {
    expect(withTriggerSets.length).toBeGreaterThan(0);
  });

  test.each(withTriggerSets)(
    "$skillName has a valid trigger eval set",
    ({ path: triggerSetPath }) => {
      // SAFETY: this test validates each fixture's runtime shape before use.
      const cases = JSON.parse(
        readFileSync(triggerSetPath, "utf-8")
      ) as TriggerCase[];
      expect(cases).toBeInstanceOf(Array);
      expect(cases.length).toBeGreaterThanOrEqual(MIN_ITEMS);

      for (const item of cases) {
        expect(item.query).toBeTypeOf("string");
        expect(item.query.trim().length).toBeGreaterThan(0);
        expect(item.should_trigger).toBeTypeOf("boolean");
      }

      const positive = cases.filter((item) => item.should_trigger).length;
      expect(positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);
      expect(cases.length - positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);

      const queries = cases.map((item) => item.query.trim().toLowerCase());
      expect(new Set(queries).size).toBe(queries.length);
    }
  );
});
