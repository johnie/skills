import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { discoverSkills, getSkillPath, readSkillFile } from "../helpers/skills";

const TRIGGER_SET = "evals/trigger-set.json";
const BEHAVIORAL_SET = "evals/evals.json";
const MIN_ITEMS = 16;
/**
 * Both classes need real coverage; an all-positive set can't detect
 * over-triggering, and fewer than 8 per class gives the description optimizer
 * too little signal once it splits train/test.
 */
const MIN_PER_CLASS = 8;
const MIN_EVALS = 2;
const MIN_EXPECTATIONS = 3;

interface TriggerCase {
  query: string;
  should_trigger: boolean;
}

interface BehavioralEval {
  id: number;
  prompt: string;
  expected_output: string;
  files?: string[];
  expectations: string[];
}

interface BehavioralSet {
  skill_name: string;
  evals: BehavioralEval[];
}

const SKILL_NAME_RE = /^name:\s*(?<name>\S+)/mu;

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
    "$skillName has a balanced trigger eval set",
    ({ path: triggerSetPath }) => {
      // SAFETY: this test validates each fixture's runtime shape before use.
      const cases = JSON.parse(
        readFileSync(triggerSetPath, "utf-8")
      ) as TriggerCase[];
      expect(cases).toBeInstanceOf(Array);
      expect(cases.length).toBeGreaterThanOrEqual(MIN_ITEMS);

      for (const item of cases) {
        expect(item.query.trim().length).toBeGreaterThan(0);
        expect(item.should_trigger).toBeTypeOf("boolean");
      }

      const positive = cases.filter((item) => item.should_trigger).length;
      expect(positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);
      expect(cases.length - positive).toBeGreaterThanOrEqual(MIN_PER_CLASS);
    }
  );

  test.each(withTriggerSets)(
    "$skillName trigger queries are unique natural-language prompts",
    ({ path: triggerSetPath }) => {
      // SAFETY: shape is validated by the sibling test above.
      const cases = JSON.parse(
        readFileSync(triggerSetPath, "utf-8")
      ) as TriggerCase[];
      const queries = cases.map((item) => item.query.trim().toLowerCase());
      expect(new Set(queries).size).toBe(queries.length);

      // An explicit `/skill-name` invocation loads the skill regardless of its
      // description, so such a query can never fail and teaches the optimizer
      // nothing about triggering.
      const slashInvocations = queries.filter((query) => query.startsWith("/"));
      expect(
        slashInvocations,
        `Slash-command queries bypass description matching: ${slashInvocations.join(", ")}`
      ).toStrictEqual([]);
    }
  );
});

/**
 * Behavioral eval sets feed skill-creator's run/grade loop. Each eval needs a
 * prompt and enough concrete expectations for a grader to score a run.
 */
describe("Behavioral eval sets", () => {
  const withEvals = discoverSkills()
    .map((skillName) => ({
      path: path.join(getSkillPath(skillName), BEHAVIORAL_SET),
      skillName,
    }))
    .filter(({ path: evalsPath }) => existsSync(evalsPath));

  test.each(withEvals)(
    "$skillName has a valid behavioral eval set",
    async ({ path: evalsPath, skillName }) => {
      // SAFETY: this test validates each fixture's runtime shape before use.
      const set = JSON.parse(readFileSync(evalsPath, "utf-8")) as BehavioralSet;
      const skillFile = await readSkillFile(skillName);
      const frontmatterName = skillFile.match(SKILL_NAME_RE)?.groups?.name;
      expect(set.skill_name).toBe(frontmatterName);
      expect(set.evals).toBeInstanceOf(Array);
      expect(set.evals.length).toBeGreaterThanOrEqual(MIN_EVALS);

      const ids = set.evals.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);

      const skillPath = getSkillPath(skillName);
      for (const item of set.evals) {
        expect(item.id).toBeTypeOf("number");
        expect(item.prompt.trim().length).toBeGreaterThan(0);
        expect(item.expected_output.trim().length).toBeGreaterThan(0);
        expect(item.expectations.length).toBeGreaterThanOrEqual(
          MIN_EXPECTATIONS
        );
        for (const expectation of item.expectations) {
          expect(expectation.trim().length).toBeGreaterThan(0);
        }
        for (const file of item.files ?? []) {
          expect(
            existsSync(path.join(skillPath, file)),
            `eval ${item.id} references missing file ${file}`
          ).toBeTruthy();
        }
      }
    }
  );
});
