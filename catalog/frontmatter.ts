import { z } from "zod";

/** `Bash(git commit *)` is tool `Bash` scoped to `git commit *`; a bare `Read` has no scope. */
const TOOL_RULE = /^(?<tool>[A-Z][A-Za-z]*)(?:\((?<scope>.+)\))?$/u;
const UNSCOPED_BASH = /^Bash(?:\(\s*\*\s*\))?$/u;
const HTML_TAG = /<\/\w+>|<\w+\s+\w+\s*=|<\w+\s*\/>/iu;

/** Claude Code truncates `description` + `when_to_use` at this length in the skill listing. */
const MAX_LISTING_LENGTH = 1536;

export const parseToolRule = (rule: string) => {
  const groups = TOOL_RULE.exec(rule)?.groups;

  if (groups?.["tool"] === undefined) {
    throw new Error(`Not a tool rule: ${rule}`);
  }

  return { scope: groups["scope"], tool: groups["tool"] };
};

const toolRules = z.array(z.string().regex(TOOL_RULE));
const stringOrStrings = z.union([z.string(), z.array(z.string())]);

/**
 * Fields defined by the Agent Skills spec (https://agentskills.io): the only ones claude.ai uploads, the
 * Skills API and `package_skill.py` accept.
 */
const specFields = {
  "allowed-tools": toolRules
    .refine((rules) => !rules.some((rule) => UNSCOPED_BASH.test(rule)), {
      // Claude Code matches each subcommand of a chained command on its own, hence a scope per subcommand.
      error:
        "`Bash` and `Bash(*)` pre-approve every shell command; scope it per subcommand, e.g. Bash(git commit *)",
    })
    .optional(),
  compatibility: z.string().max(500).optional(),
  description: z
    .string()
    .trim()
    .min(50)
    .max(1024)
    .refine((value) => !HTML_TAG.test(value), {
      error: "must not contain HTML tags",
    }),
  license: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  name: z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, { error: "must be kebab-case" }),
};

/**
 * Claude Code extensions. Legal because this repo ships as a plugin (.claude-plugin/marketplace.json),
 * where every field is accepted. Using any of these forfeits portability to claude.ai and the Skills API.
 */
const claudeCodeFields = {
  agent: z.string().optional(),
  "argument-hint": z.string().optional(),
  arguments: stringOrStrings.optional(),
  background: z.boolean().optional(),
  context: z.literal("fork").optional(),
  "disable-model-invocation": z.boolean().optional(),
  "disallowed-tools": toolRules.optional(),
  effort: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
  hooks: z.unknown().optional(),
  model: z.string().optional(),
  paths: stringOrStrings.optional(),
  shell: z.enum(["bash", "powershell"]).optional(),
  "user-invocable": z.boolean().optional(),
  when_to_use: z.string().optional(),
};

/**
 * The SKILL.md frontmatter contract, applied by the website build and by `test/unit/frontmatter.test.ts`.
 * Unknown fields are rejected.
 */
export const SkillFrontmatter = z
  .strictObject({ ...specFields, ...claudeCodeFields })
  .refine(
    ({ description, when_to_use: whenToUse = "" }) =>
      description.length + whenToUse.length <= MAX_LISTING_LENGTH,
    {
      error: `description + when_to_use must fit ${MAX_LISTING_LENGTH} characters`,
    }
  )
  .refine(
    ({ agent, background, context }) =>
      (agent === undefined && background === undefined) || context === "fork",
    { error: "agent and background require context: fork" }
  );
