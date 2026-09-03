import { homedir } from "node:os";
import path from "node:path";

import type { CommandContext } from "@stricli/core";

import type { Colors } from "./colors";
import { createColors } from "./colors";

export interface LocalContext extends CommandContext {
  readonly colors: Colors;
  readonly process: typeof process;
  readonly skillsDir: string;
  readonly targetDir: string;
}

export const buildContext = (proc: typeof process): LocalContext => ({
  colors: createColors(),
  process: proc,
  skillsDir: path.join(import.meta.dirname, "..", "skills"),
  targetDir: path.join(homedir(), ".claude", "skills"),
});
