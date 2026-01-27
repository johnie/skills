import { generateText } from "ai";
import { getJudgeModelInstance, getModel } from "./providers.ts";

// Regex for extracting JSON from markdown code blocks
const JSON_CODE_BLOCK_REGEX = /```(?:json)?\s*(\{[\s\S]*\})\s*```/;

export interface TestSkillOptions {
  /** Git status output to inject as context */
  gitStatus?: string;
  /** Git diff output to inject as context */
  gitDiff?: string;
  /** Current branch name */
  branch?: string;
  /** Additional context to inject */
  context?: Record<string, string>;
}

export interface EvaluationCriteria {
  /** Description of what should be evaluated */
  description: string;
  /** Specific criteria to check (array of strings) */
  criteria: string[];
}

export interface EvaluationResult {
  /** Whether the evaluation passed */
  passed: boolean;
  /** Explanation from the judge */
  reasoning: string;
  /** Score from 0-100 (if applicable) */
  score?: number;
}

/**
 * Test a skill by generating a response from it
 *
 * @param skillContent The content of the SKILL.md file
 * @param userPrompt The prompt to send to the skill
 * @param options Additional context to inject
 * @returns The generated response from the skill
 */
export async function testSkill(
  skillContent: string,
  userPrompt: string,
  options: TestSkillOptions = {}
): Promise<string> {
  const model = getModel();

  // Build system prompt with skill instructions
  let systemPrompt = `You are Claude Code executing a skill. Follow these skill instructions:\n\n${skillContent}`;

  // Inject context if provided
  if (options.gitStatus || options.gitDiff || options.branch) {
    systemPrompt += "\n\n# Current Git Context\n";

    if (options.branch) {
      systemPrompt += `\nCurrent branch: ${options.branch}\n`;
    }

    if (options.gitStatus) {
      systemPrompt += `\n## Git Status\n\`\`\`\n${options.gitStatus}\n\`\`\`\n`;
    }

    if (options.gitDiff) {
      systemPrompt += `\n## Git Diff\n\`\`\`\n${options.gitDiff}\n\`\`\`\n`;
    }
  }

  // Inject additional context
  if (options.context) {
    systemPrompt += "\n\n# Additional Context\n";
    for (const [key, value] of Object.entries(options.context)) {
      systemPrompt += `\n## ${key}\n${value}\n`;
    }
  }

  // Generate response
  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 2000,
  });

  return text;
}

/**
 * Evaluate output using an AI judge
 *
 * @param output The output to evaluate
 * @param criteria Criteria for evaluation
 * @returns Evaluation result with pass/fail and reasoning
 */
export async function evaluateWithJudge(
  output: string,
  criteria: EvaluationCriteria
): Promise<EvaluationResult> {
  const model = getJudgeModelInstance();

  const judgePrompt = `You are evaluating the following output:

${output}

# Evaluation Task
${criteria.description}

# Criteria
${criteria.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

# Instructions
- Evaluate whether the output meets all criteria
- Provide a clear pass/fail decision
- Explain your reasoning
- If applicable, provide a score from 0-100

Respond in JSON format:
{
  "passed": true/false,
  "reasoning": "explanation",
  "score": 0-100 (optional)
}`;

  const { text } = await generateText({
    model,
    prompt: judgePrompt,
    maxOutputTokens: 1000,
  });

  // Parse JSON response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(JSON_CODE_BLOCK_REGEX);
    const jsonText = jsonMatch?.[1] ?? text;

    const result = JSON.parse(jsonText) as EvaluationResult;
    return result;
  } catch (_error) {
    // If parsing fails, return a failure with the raw response
    return {
      passed: false,
      reasoning: `Failed to parse judge response: ${text}`,
    };
  }
}

/**
 * Load a skill's markdown content
 *
 * @param skillPath Path to the skill directory
 * @returns The content of SKILL.md
 */
export async function loadSkillContent(skillPath: string): Promise<string> {
  // Use Bun.file if available (Bun runtime), otherwise use fs.readFileSync (Node/Vitest)
  if (typeof Bun !== "undefined") {
    const skillFile = Bun.file(`${skillPath}/SKILL.md`);
    return await skillFile.text();
  }

  const { readFileSync } = await import("node:fs");
  return readFileSync(`${skillPath}/SKILL.md`, "utf-8");
}
