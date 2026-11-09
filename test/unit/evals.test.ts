import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { discoverSkills, skillPath } from "../../catalog/skills";

const text = z.string().trim().min(1);

/**
 * Both classes need real coverage; an all-positive set can't detect
 * over-triggering, and fewer than 8 per class gives the description optimizer
 * too little signal once it splits train/test.
 */
const MIN_PER_CLASS = 8;

const unique = (values: unknown[]) => new Set(values).size === values.length;

const TriggerSet = z
  .array(z.object({ query: text, should_trigger: z.boolean() }))
  .refine(
    (cases) =>
      [true, false].every(
        (expected) =>
          cases.filter((item) => item.should_trigger === expected).length >=
          MIN_PER_CLASS
      ),
    { error: `needs at least ${MIN_PER_CLASS} cases per class` }
  )
  .refine((cases) => unique(cases.map((item) => item.query.toLowerCase())), {
    error: "queries must be unique",
  })
  .refine((cases) => !cases.some((item) => item.query.startsWith("/")), {
    // An explicit `/skill-name` invocation loads the skill regardless of its description, so such a query can
    // never fail and teaches the optimizer nothing about triggering.
    error: "slash-command queries bypass description matching",
  });

const BehavioralSet = z.object({
  evals: z
    .array(
      z.object({
        expectations: z.array(text).min(3),
        expected_output: text,
        files: z.array(z.string()).optional(),
        id: z.number(),
        prompt: text,
      })
    )
    .min(2)
    .refine((evals) => unique(evals.map((item) => item.id)), {
      error: "ids must be unique",
    }),
  skill_name: z.string(),
});

/** The skills shipping `evals/<file>`: both sets are optional per skill. */
const skillsWith = (file: string) =>
  discoverSkills()
    .map((skillName) => ({
      path: path.join(skillPath(skillName), "evals", file),
      skillName,
    }))
    .filter((entry) => existsSync(entry.path));

const parse = <T>(schema: z.ZodType<T>, file: string) => {
  const result = schema.safeParse(JSON.parse(readFileSync(file, "utf-8")));

  expect(result.error && z.prettifyError(result.error)).toBeUndefined();

  return result.data;
};

/**
 * Trigger sets drive description tuning: each query is run against the skill
 * listing to measure whether the description activates the skill when it should.
 * They are only useful if they stay well-formed and keep both classes populated,
 * so they are validated here rather than left to drift.
 */
describe("Trigger eval sets", () => {
  const withTriggerSets = skillsWith("trigger-set.json");

  it("at least one skill ships a trigger set", () => {
    expect(withTriggerSets).not.toHaveLength(0);
  });

  it.each(withTriggerSets)(
    "$skillName has a balanced set of unique natural-language queries",
    (entry) => {
      expect(parse(TriggerSet, entry.path)).toBeDefined();
    }
  );
});

/**
 * Behavioral eval sets feed skill-creator's run/grade loop. Each eval needs a
 * prompt and enough concrete expectations for a grader to score a run.
 */
describe("Behavioral eval sets", () => {
  it.each(skillsWith("evals.json"))(
    "$skillName has a valid behavioral eval set",
    ({ path: evalsPath, skillName }) => {
      const set = parse(BehavioralSet, evalsPath);

      expect(set?.skill_name).toBe(skillName);

      const missing = (set?.evals ?? []).flatMap((item) =>
        (item.files ?? [])
          .filter((file) => !existsSync(path.join(skillPath(skillName), file)))
          .map((file) => `eval ${item.id} references missing file ${file}`)
      );

      expect(missing).toStrictEqual([]);
    }
  );
});
