import { checkLMStudioHealth } from "./helpers/providers.ts";

// Check if LM Studio is reachable before running tests
await checkLMStudioHealth();
