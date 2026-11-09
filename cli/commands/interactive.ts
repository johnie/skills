import { buildCommand } from "@stricli/core";
import type { CommandContext } from "@stricli/core";
import kleur from "kleur";
import prompts from "prompts";

import { discoverSkills } from "../../catalog/skills";
import {
  linkSkill,
  linkState,
  skillLine,
  TARGET_DIR,
  unlinkSkill,
} from "../links";

/** Shows every skill with its link state, applies the changed selection, and asks again until cancelled. */
const promptLoop = async (context: CommandContext): Promise<void> => {
  const states = discoverSkills().map((name) => ({
    name,
    state: linkState(name),
  }));

  const response = await prompts({
    choices: states.map(({ name, state }) => ({
      selected: state === "linked",
      title: skillLine(name, state),
      value: name,
    })),
    hint: "Space to toggle, Enter to apply, Ctrl+C to quit",
    instructions: false,
    message: `Skill Manager (${kleur.dim(TARGET_DIR)})`,
    name: "skills",
    type: "multiselect",
  });

  if (response.skills === undefined) {
    return;
  }

  const selected = new Set<string>(response.skills);

  for (const { name, state } of states) {
    const linked = state === "linked";

    if (selected.has(name) === linked) {
      continue;
    }

    // One skill that can't change shouldn't end the session: report it and prompt again.
    try {
      const line = linked ? unlinkSkill(name) : linkSkill(name);
      context.process.stdout.write(`${line}\n`);
    } catch (error) {
      context.process.stderr.write(
        `${kleur.red(Error.isError(error) ? error.message : String(error))}\n`
      );
    }
  }

  return promptLoop(context);
};

export const interactiveCommand = buildCommand({
  docs: {
    brief: "Interactive TUI mode for managing skills",
  },
  func(this: CommandContext) {
    return promptLoop(this);
  },
  parameters: {},
});
