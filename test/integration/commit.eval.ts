import { evalite } from "evalite";
import { loadSkillContent, testSkill } from "../helpers/ai.ts";
import type { CommitScenario } from "../helpers/fixtures.ts";
import { listScenarios, loadScenario } from "../helpers/fixtures.ts";
import {
  CommitGrouping,
  CommitQuality,
  ConventionalCommit,
  FileMentions,
} from "../helpers/scorers.ts";
import { extractCommitMessages } from "../helpers/validators.ts";

const SKILL_PATH = "skills/commit";
const scenarios = listScenarios("commit");

evalite("Commit Skill", {
  data: async () =>
    scenarios.map((name) => ({
      input: name,
      expected: undefined, // Dynamic validation based on scenario
    })),
  task: async (scenarioName) => {
    const scenario = await loadScenario<CommitScenario>("commit", scenarioName);
    const skillContent = await loadSkillContent(SKILL_PATH);

    return testSkill(skillContent, scenario.prompt, {
      gitStatus: scenario.context.gitStatus,
      gitDiff: scenario.context.gitDiff,
      branch: scenario.context.branch,
    });
  },
  scorers: [ConventionalCommit, CommitQuality, CommitGrouping],
  // threshold: 0.7, // Pass if score >= 70%
});

// Scenario-specific validation for files mentioned
for (const scenarioName of scenarios) {
  const scenario = await loadScenario<CommitScenario>("commit", scenarioName);

  if (scenario.expected?.filesMentioned) {
    evalite(`Commit Skill - ${scenarioName} - File Mentions`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {
          gitStatus: scenario.context.gitStatus,
          gitDiff: scenario.context.gitDiff,
          branch: scenario.context.branch,
        });
      },
      scorers: [FileMentions(scenario.expected.filesMentioned)],
      // threshold: 0.8,
    });
  }

  if (scenario.expected?.commitTypes) {
    evalite(`Commit Skill - ${scenarioName} - Commit Types`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {
          gitStatus: scenario.context.gitStatus,
          gitDiff: scenario.context.gitDiff,
          branch: scenario.context.branch,
        });
      },
      scorers: [
        {
          name: "Expected Commit Types",
          scorer: ({ output }: { output: string }) => {
            const commits = extractCommitMessages(output);
            const commitTypes = commits.map((c) => c.type);
            const expectedTypes = scenario.expected?.commitTypes || [];

            const hasMatchingType = expectedTypes.some((expectedType) =>
              commitTypes.includes(expectedType)
            );

            return {
              score: hasMatchingType ? 1 : 0,
              metadata: {
                commitTypes,
                expectedTypes,
                hasMatchingType,
              },
            };
          },
        },
      ],
      // threshold: 0.8,
    });
  }

  // Mixed-changes scenario: ensure multiple commits with different types
  if (scenarioName === "mixed-changes") {
    evalite(`Commit Skill - ${scenarioName} - Mixed Changes`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {
          gitStatus: scenario.context.gitStatus,
          gitDiff: scenario.context.gitDiff,
          branch: scenario.context.branch,
        });
      },
      scorers: [
        {
          name: "Mixed Changes",
          scorer: ({ output }: { output: string }) => {
            const commits = extractCommitMessages(output);
            const uniqueTypes = new Set(commits.map((c) => c.type));
            const hasMultipleCommits = commits.length >= 2;
            const hasMultipleTypes = uniqueTypes.size > 1;

            return {
              score: hasMultipleCommits && hasMultipleTypes ? 1 : 0,
              metadata: {
                commitCount: commits.length,
                typeCount: uniqueTypes.size,
                hasMultipleCommits,
                hasMultipleTypes,
              },
            };
          },
        },
      ],
      // threshold: 0.8,
    });
  }
}
