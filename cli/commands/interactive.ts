import { buildCommand } from "@stricli/core";
import prompts from "prompts";

import type { LocalContext } from "../context";
import {
  getAvailableSkills,
  getIcon,
  getSymlinkStatus,
  linkSkill,
  unlinkSkill,
} from "../shared";

export const interactiveCommand = buildCommand({
  docs: {
    brief: "Interactive TUI mode for managing skills",
  },
  func(this: LocalContext) {
    const promptLoop = async (): Promise<void> => {
      const skills = getAvailableSkills(this);
      const statusList = skills.map((name) => getSymlinkStatus(name, this));
      const choices = statusList.map((skill) => {
        const icon = getIcon(skill, this);
        const suffix = skill.isBroken ? this.colors.warn(" (broken)") : "";
        return {
          selected: skill.isLinked,
          title: `${icon} ${skill.name}${suffix}`,
          value: skill.name,
        };
      });
      const response = await prompts({
        choices,
        hint: "Space to toggle, Enter to apply, Ctrl+C to quit",
        instructions: false,
        message: `Skill Manager (${this.colors.dim(this.targetDir)})`,
        name: "skills",
        type: "multiselect",
      });

      if (response.skills === undefined) {
        return;
      }

      const selectedSkills = new Set<string>(response.skills);
      const currentlyLinked = new Set<string>(
        statusList.filter((skill) => skill.isLinked).map((skill) => skill.name)
      );
      for (const skillName of selectedSkills) {
        if (!currentlyLinked.has(skillName)) {
          linkSkill(skillName, this);
        }
      }
      for (const skillName of currentlyLinked) {
        if (!selectedSkills.has(skillName)) {
          unlinkSkill(skillName, this);
        }
      }
      return promptLoop();
    };

    return promptLoop();
  },
  parameters: {},
});
