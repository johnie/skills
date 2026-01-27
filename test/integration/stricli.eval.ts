import { evalite } from "evalite";
import { loadSkillContent, testSkill } from "../helpers/ai.ts";
import type { StricliScenario } from "../helpers/fixtures.ts";
import { listScenarios, loadScenario } from "../helpers/fixtures.ts";
import {
  CommandPattern,
  Keywords,
  RouteMapPattern,
  StricliImports,
  TypeScriptSyntax,
} from "../helpers/scorers.ts";

const SKILL_PATH = "skills/stricli";
const BUILD_ROUTE_MAP_REGEX = /buildRouteMap/;
const scenarios = listScenarios("stricli");

evalite("Stricli Skill", {
  data: async () =>
    scenarios.map((name) => ({
      input: name,
      expected: undefined, // Dynamic validation based on scenario
    })),
  task: async (scenarioName) => {
    const scenario = await loadScenario<StricliScenario>(
      "stricli",
      scenarioName
    );
    const skillContent = await loadSkillContent(SKILL_PATH);

    return testSkill(skillContent, scenario.prompt, {});
  },
  scorers: [StricliImports, TypeScriptSyntax, CommandPattern],
  // threshold: 0.7,
});

// Scenario-specific validation for route maps
for (const scenarioName of scenarios) {
  const scenario = await loadScenario<StricliScenario>("stricli", scenarioName);

  if (scenario.expected?.expectRouteMap) {
    evalite(`Stricli Skill - ${scenarioName} - Route Map`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [RouteMapPattern],
      // threshold: 0.8,
    });
  }

  if (scenario.expected?.keywords) {
    evalite(`Stricli Skill - ${scenarioName} - Keywords`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [Keywords(scenario.expected.keywords)],
      // threshold: 0.7,
    });
  }

  // Special validation for multi-command scenario
  if (scenarioName === "multi-command") {
    evalite(`Stricli Skill - ${scenarioName} - Multiple Commands`, {
      data: [{ input: scenarioName, expected: undefined }],
      task: async () => {
        const skillContent = await loadSkillContent(SKILL_PATH);
        return testSkill(skillContent, scenario.prompt, {});
      },
      scorers: [
        {
          name: "Multiple Commands",
          scorer: ({ output }: { output: string }) => {
            const commandCount = (output.match(/buildCommand\s*\(/g) || [])
              .length;
            const hasMultipleCommands = commandCount >= 3;
            const hasRouteMap = BUILD_ROUTE_MAP_REGEX.test(output);

            return {
              score: hasMultipleCommands && hasRouteMap ? 1 : 0.6,
              metadata: {
                commandCount,
                hasMultipleCommands,
                hasRouteMap,
              },
            };
          },
        },
      ],
      // threshold: 0.8,
    });
  }
}
