import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import { linkSkill } from "../shared";

export const linkCommand = buildCommand({
  docs: {
    brief: "Create a symlink for a skill",
  },
  parameters: {
    flags: {},
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Skill name to link",
          parse: String,
          placeholder: "name",
        },
      ],
    },
  },
  func(this: LocalContext, _flags: Record<string, never>, name: string) {
    linkSkill(name, this);
  },
});
