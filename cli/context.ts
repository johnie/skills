import { homedir } from "node:os";
import { join } from "node:path";
import type { CommandContext } from "@stricli/core";
import type { Colors } from "./colors";
import { createColors } from "./colors";

export interface LocalContext extends CommandContext {
  readonly process: typeof process;
  readonly colors: Colors;
  readonly skillsDir: string;
  readonly targetDir: string;
}

export function buildContext(proc: typeof process): LocalContext {
  return {
    process: proc,
    colors: createColors(),
    skillsDir: join(import.meta.dir, "..", "skills"),
    targetDir: join(homedir(), ".claude", "skills"),
  };
}
