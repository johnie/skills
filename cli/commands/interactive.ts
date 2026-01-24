import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import {
  getAvailableSkills,
  getSymlinkStatus,
  linkSkill,
  type Skill,
  unlinkSkill,
} from "../shared";

async function readLine(ctx: LocalContext, message: string): Promise<string> {
  ctx.process.stdout.write(message);

  const reader = ctx.process.stdin.stream().getReader();
  const decoder = new TextDecoder();
  let input = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    input += decoder.decode(value);
    if (input.includes("\n")) {
      break;
    }
  }

  reader.releaseLock();
  return input.trim();
}

function getIcon(skill: Skill, ctx: LocalContext): string {
  if (skill.isLinked) {
    return ctx.colors.icons.linked;
  }
  if (skill.isBroken) {
    return ctx.colors.icons.broken;
  }
  return ctx.colors.icons.unlinked;
}

function displaySkills(ctx: LocalContext, statusList: Skill[]): void {
  console.clear();
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
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  },
});
