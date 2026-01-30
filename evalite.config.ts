import { defineConfig } from "evalite/config";
import { createSqliteStorage } from "evalite/sqlite-storage";

export default defineConfig({
  storage: () => createSqliteStorage("./evalite.db"),
  testTimeout: 120_000,
  maxConcurrency: 5,
  scoreThreshold: 70,
  setupFiles: ["./test/setup-eval.ts"],
  // forceRerunTriggers: ["skills/**/*", "test/fixtures/**/*"],
});
