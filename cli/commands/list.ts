import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import type { Skill } from "../shared";
import { getAvailableSkills, getSymlinkStatus } from "../shared";

function getIcon(status: Skill, ctx: LocalContext): string {
  if (status.isLinked) {
    return ctx.colors.icons.linked;
  }
  if (status.isBroken) {
    return ctx.colors.icons.broken;
  }
  return ctx.colors.icons.unlinked;
}

export const listCommand = buildCommand({
  docs: {
    brief: "List all skills with their link status",
  },
  parameters: {},
  func(this: LocalContext) {
    const skills = getAvailableSkills(this);

    this.process.stdout.write("\nSkill Manager - Claude\n");
    this.process.stdout.write(this.colors.dim(`Target: ${this.targetDir}\n\n`));

    for (const skillName of skills) {
      const status = getSymlinkStatus(skillName, this);
      const icon = getIcon(status, this);
      const suffix = status.isBroken ? this.colors.warn(" (broken)") : "";
      this.process.stdout.write(`${icon} ${skillName}${suffix}\n`);
    }

    this.process.stdout.write("\n");
  },
});
