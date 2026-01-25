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
  parameters: {},
  async func(this: LocalContext) {
    while (true) {
      const skills = getAvailableSkills(this);
      const statusList = skills.map((name) => getSymlinkStatus(name, this));

      const choices = statusList.map((skill) => {
        const icon = getIcon(skill, this);
        const suffix = skill.isBroken ? this.colors.warn(" (broken)") : "";
        return {
          title: `${icon} ${skill.name}${suffix}`,
          value: skill.name,
          selected: skill.isLinked,
        };
      });

      const response = await prompts({
        type: "multiselect",
        name: "skills",
        message: `Skill Manager (${this.colors.dim(this.targetDir)})`,
        choices,
        hint: "Space to toggle, Enter to apply, Ctrl+C to quit",
        instructions: false,
      });

      if (response.skills === undefined) {
        break;
      }

      const selectedSkills = new Set<string>(response.skills);
      const currentlyLinked = new Set<string>(
        statusList.filter((s) => s.isLinked).map((s) => s.name)
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
    }
  },
});
