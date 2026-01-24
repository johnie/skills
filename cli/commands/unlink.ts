import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../context";
import { unlinkSkill } from "../shared";

export const unlinkCommand = buildCommand({
  docs: {
    brief: "Remove a symlink for a skill",
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Skill name to unlink",
          parse: String,
          placeholder: "name",
        },
      ],
    },
  },
  func(this: LocalContext, _flags: Record<string, never>, name: string) {
    unlinkSkill(name, this);
  },
});
