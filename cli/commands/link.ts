import { buildCommand } from "@stricli/core";
import type { CommandContext } from "@stricli/core";

import { linkSkill, unlinkSkill } from "../links";

/** A command taking one skill name. A thrown `Error` is returned, so stricli prints its message and exits 1. */
const skillCommand = (
  brief: string,
  verb: string,
  change: (name: string) => string
) =>
  buildCommand({
    docs: { brief },
    func(this: CommandContext, _flags: Record<string, never>, name: string) {
      try {
        this.process.stdout.write(`${change(name)}\n`);
      } catch (error) {
        return Error.isError(error) ? error : new Error(String(error));
      }
    },
    parameters: {
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: `Skill name to ${verb}`,
            parse: String,
            placeholder: "name",
          },
        ],
      },
    },
  });

export const linkCommand = skillCommand(
  "Create a symlink for a skill",
  "link",
  linkSkill
);

export const unlinkCommand = skillCommand(
  "Remove a symlink for a skill",
  "unlink",
  unlinkSkill
);
