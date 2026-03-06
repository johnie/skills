import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CommandContext } from "@stricli/core";
import type { Colors } from "./colors";
import { createColors } from "./colors";

export interface LocalContext extends CommandContext {
  readonly colors: Colors;
  readonly process: typeof process;
  readonly skillsDir: string;
  readonly targetDir: string;
}

export function buildContext(proc: typeof process): LocalContext {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return {
    process: proc,
    colors: createColors(),
    skillsDir: join(currentDir, "..", "skills"),
    targetDir: join(homedir(), ".claude", "skills"),
  };
}
