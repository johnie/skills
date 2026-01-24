import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import {
  getAvailableSkills,
  getIcon,
  getSymlinkStatus,
  linkSkill,
  type Skill,
  unlinkSkill,
} from "../shared";

const TOGGLE_DELAY_MS = 500;

async function readLine(ctx: LocalContext, message: string): Promise<string> {
  ctx.process.stdout.write(message);

  for await (const line of console) {
    return line.trim();
  }

  return "";
}

function displaySkills(ctx: LocalContext, statusList: Skill[]): void {
  ctx.process.stdout.write("\x1Bc");
  ctx.process.stdout.write("Skill Manager - Claude\n");
  ctx.process.stdout.write(ctx.colors.dim(`Target: ${ctx.targetDir}\n\n`));

  for (const [index, skill] of statusList.entries()) {
    const icon = getIcon(skill, ctx);
    const suffix = skill.isBroken ? ctx.colors.warn(" (broken)") : "";
    ctx.process.stdout.write(`[${index + 1}] ${icon} ${skill.name}${suffix}\n`);
  }
}

function toggleSkill(skill: Skill, ctx: LocalContext): void {
  if (skill.isLinked) {
    unlinkSkill(skill.name, ctx);
  } else {
    linkSkill(skill.name, ctx);
  }
}

export const interactiveCommand = buildCommand({
  docs: {
    brief: "Interactive TUI mode for managing skills",
  },
  parameters: {},
  async func(this: LocalContext) {
    while (true) {
      const skills = getAvailableSkills(this);
      const statusList = skills.map((name) => getSymlinkStatus(name, this));

      displaySkills(this, statusList);

      const input = await readLine(
        this,
        "\nEnter number to toggle, 'q' to quit: "
      );

      if (input.toLowerCase() === "q") {
        break;
      }

      const choice = Number.parseInt(input, 10);
      if (Number.isNaN(choice) || choice < 1 || choice > statusList.length) {
        continue;
      }

      toggleSkill(statusList[choice - 1], this);
      await new Promise((resolve) => setTimeout(resolve, TOGGLE_DELAY_MS));
    }
  },
});
