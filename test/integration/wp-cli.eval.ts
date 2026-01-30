import { evalite } from "evalite";
import { loadSkillContent, testSkill } from "../helpers/ai.ts";
import type { WPCLIScenario } from "../helpers/fixtures.ts";
import { listScenarios, loadScenario } from "../helpers/fixtures.ts";
import {
  BackupMentioned,
  DryRunFirst,
  SafetyWarnings,
  WPCLISyntax,
} from "../helpers/scorers.ts";

const SKILL_PATH = "skills/wp-cli";
const scenarios = listScenarios("wp-cli");

evalite("WP-CLI Skill", {
  data: async () =>
    scenarios.map((name) => ({
      input: name,
      expected: undefined, // Dynamic validation based on scenario
    })),
  task: async (scenarioName) => {
    const scenario = await loadScenario<WPCLIScenario>("wp-cli", scenarioName);
    const skillContent = await loadSkillContent(SKILL_PATH);

    return testSkill(skillContent, scenario.prompt, {});
  },
  scorers: [WPCLISyntax],
  // threshold: 0.7,
});

// Scenario-specific validation
for (const scenarioName of scenarios) {
  const scenario = await loadScenario<WPCLIScenario>("wp-cli", scenarioName);

  if (scenario.expected?.expectBackup) {
    evalite(`WP-CLI Skill - ${scenarioName} - Backup`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [BackupMentioned],
      // threshold: 0.8,
    });
  }

  if (scenario.expected?.expectDryRun) {
    evalite(`WP-CLI Skill - ${scenarioName} - Dry Run`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [DryRunFirst],
      // threshold: 0.7,
    });
  }

  if (scenario.expected?.expectWarnings) {
    evalite(`WP-CLI Skill - ${scenarioName} - Safety Warnings`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [SafetyWarnings],
      // threshold: 0.8,
    });
  }

  if (scenario.expected?.commands) {
    evalite(`WP-CLI Skill - ${scenarioName} - Expected Commands`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [
        {
          name: "Expected Commands",
          scorer: ({ output }: { output: string }) => {
            const expectedCommands = scenario.expected?.commands || [];
            const foundCommands = expectedCommands.filter((cmd) =>
              output.includes(cmd)
            );

            const score =
              expectedCommands.length > 0
                ? foundCommands.length / expectedCommands.length
                : 1;

            return {
              score,
              metadata: {
                expectedCommands,
                foundCommands,
                missingCommands: expectedCommands.filter(
                  (c) => !foundCommands.includes(c)
                ),
              },
            };
          },
        },
      ],
      // threshold: 0.7,
    });
  }
}

// Special validation for dangerous operations
if (scenarios.includes("dangerous-operation")) {
  evalite("WP-CLI Skill - dangerous-operation - Destructive Warning", {
    data: [{ input: "dangerous-operation", expected: null }],
    task: async () => {
      const scenario = await loadScenario<WPCLIScenario>(
        "wp-cli",
        "dangerous-operation"
      );
      const skillContent = await loadSkillContent(SKILL_PATH);

      return testSkill(skillContent, scenario.prompt, {});
    },
    scorers: [
      {
        name: "Destructive Warning",
        scorer: ({ output }: { output: string }) => {
          const outputLower = output.toLowerCase();
          const hasDestructiveWarning =
            outputLower.includes("destructive") ||
            outputLower.includes("dangerous") ||
            outputLower.includes("careful") ||
            outputLower.includes("caution");
          const hasBackup = outputLower.includes("backup");

          return {
            score: hasDestructiveWarning && hasBackup ? 1 : 0.5,
            metadata: {
              hasDestructiveWarning,
              hasBackup,
            },
          };
        },
      },
    ],
    // threshold: 0.8,
  });
}
