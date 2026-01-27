import { evalite } from "evalite";
import { loadSkillContent, testSkill } from "../helpers/ai.ts";
import type { PRScenario } from "../helpers/fixtures.ts";
import { listScenarios, loadScenario } from "../helpers/fixtures.ts";
import { Keywords, PRTemplate } from "../helpers/scorers.ts";

const SKILL_PATH = "skills/pr";
const FEATURE_PREFIX_REGEX = /^feature\//;
const scenarios = listScenarios("pr");

evalite("PR Skill", {
  data: async () =>
    scenarios.map((name) => ({
      input: name,
      expected: undefined, // Dynamic validation based on scenario
    })),
  task: async (scenarioName) => {
    const scenario = await loadScenario<PRScenario>("pr", scenarioName);
    const skillContent = await loadSkillContent(SKILL_PATH);

    return testSkill(skillContent, scenario.prompt, {
      gitStatus: scenario.context.gitStatus,
      gitDiff: scenario.context.gitDiff,
      branch: scenario.context.branch,
    });
  },
  scorers: [],
  // threshold: 0.7,
});

// Scenario-specific validation for PR template sections
for (const scenarioName of scenarios) {
  const scenario = await loadScenario<PRScenario>("pr", scenarioName);

  if (scenario.expected?.requiredSections) {
    evalite(`PR Skill - ${scenarioName} - Template`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {
          gitStatus: scenario.context.gitStatus,
          gitDiff: scenario.context.gitDiff,
          branch: scenario.context.branch,
        });
      },
      scorers: [PRTemplate(scenario.expected.requiredSections)],
      // threshold: 0.8,
    });
  }

  if (scenario.expected?.keywords) {
    evalite(`PR Skill - ${scenarioName} - Keywords`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {
          gitStatus: scenario.context.gitStatus,
          gitDiff: scenario.context.gitDiff,
          branch: scenario.context.branch,
        });
      },
      scorers: [Keywords(scenario.expected.keywords)],
      // threshold: 0.8,
    });
  }

  // Branch name mention validation
  if (scenario.context.branch) {
    evalite(`PR Skill - ${scenarioName} - Branch Reference`, {
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
          name: "Branch Reference",
          scorer: ({ output }: { output: string }) => {
            const branchName = scenario.context.branch || "";
            const hasReference =
              output.includes(branchName) ||
              output.includes(branchName.replace(FEATURE_PREFIX_REGEX, ""));

            return {
              score: hasReference ? 1 : 0,
              metadata: {
                branchName,
                hasReference,
              },
            };
          },
        },
      ],
      // threshold: 0.8,
    });
  }
}

// Special validation for bugfix scenario
if (scenarios.includes("create-bugfix")) {
  evalite("PR Skill - create-bugfix - Bugfix Indicator", {
    data: [{ input: "create-bugfix", expected: null }],
    task: async () => {
      const scenario = await loadScenario<PRScenario>("pr", "create-bugfix");
      const skillContent = await loadSkillContent(SKILL_PATH);

      return testSkill(skillContent, scenario.prompt, {
        gitStatus: scenario.context.gitStatus,
        gitDiff: scenario.context.gitDiff,
        branch: scenario.context.branch,
      });
    },
    scorers: [
      {
        name: "Bugfix Indicator",
        scorer: ({ output }: { output: string }) => {
          const outputLower = output.toLowerCase();
          const hasBugfixIndicator =
            outputLower.includes("fix") || outputLower.includes("bug");

          return {
            score: hasBugfixIndicator ? 1 : 0,
            metadata: {
              hasBugfixIndicator,
              hasFix: outputLower.includes("fix"),
              hasBug: outputLower.includes("bug"),
            },
          };
        },
      },
    ],
    // threshold: 0.8,
  });
}
