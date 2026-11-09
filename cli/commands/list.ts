import { buildCommand } from "@stricli/core";
import type { CommandContext } from "@stricli/core";
import kleur from "kleur";

import { discoverSkills } from "../../catalog/skills";
import { linkState, skillLine, TARGET_DIR } from "../links";

export const listCommand = buildCommand({
  docs: {
    brief: "List all skills with their link status",
  },
  func(this: CommandContext) {
    const lines = discoverSkills().map((name) =>
      skillLine(name, linkState(name))
    );

    this.process.stdout.write(
      `\nSkill Manager - Claude\n${kleur.dim(`Target: ${TARGET_DIR}`)}\n\n${lines.join("\n")}\n\n`
    );
  },
  parameters: {},
});
