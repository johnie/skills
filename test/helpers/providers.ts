import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export type TestProvider = "lmstudio" | "openrouter";

/**
 * Get the test provider from environment variable
 * Defaults to lmstudio for local testing
 */
export function getTestProvider(): TestProvider {
  const provider = process.env.TEST_PROVIDER?.toLowerCase();
  if (provider === "openrouter" || provider === "lmstudio") {
    return provider;
  }
  return "lmstudio";
}

/**
 * Get the base URL for LM Studio
 * Defaults to localhost:1234
 */
export function getLMStudioBaseURL(): string {
  return process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1";
}

/**
 * Check if LM Studio is reachable (call during test setup)
 * Only checks if provider is lmstudio
 */
export async function checkLMStudioHealth(): Promise<void> {
  if (getTestProvider() !== "lmstudio") {
    return;
  }

  const url = getLMStudioBaseURL().replace("/v1", "/v1/models");
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`LM Studio returned ${res.status}`);
    }
  } catch (_error) {
    throw new Error(
      `LM Studio not reachable at ${url}. Make sure LM Studio is running with a model loaded.`
    );
  }
}

// Rate limiter for OpenRouter to avoid hitting rate limits
const RATE_DELAY = Number.parseInt(
  process.env.OPENROUTER_RATE_DELAY || "100",
  10
);
let lastCallTimestamp = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTimestamp;
  const waitTime = Math.max(0, RATE_DELAY - timeSinceLastCall);

  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastCallTimestamp = Date.now();
}

/**
 * Get the default model to use for testing
 * For OpenRouter, uses a fast, affordable model
 * For LM Studio, uses whatever model is loaded
 */
export function getDefaultModel(): string {
  const provider = getTestProvider();

  if (provider === "openrouter") {
    return process.env.OPENROUTER_MODEL || "qwen/qwen-2.5-7b-instruct";
  }

  // LM Studio doesn't need a specific model name - uses whatever is loaded
  return "local-model";
}

/**
 * Get a stronger model for AI evaluation/judging
 * Uses a more capable model than the default test model
 */
export function getJudgeModel(): string {
  const provider = getTestProvider();

  if (provider === "openrouter") {
    return process.env.OPENROUTER_JUDGE_MODEL || "anthropic/claude-3.5-sonnet";
  }

  // For local testing, use the same model
  return "local-model";
}

/**
 * Create an AI SDK model instance based on the test provider
 * Wraps the model with Evalite's tracing and caching
 */
export function getModel(modelName?: string): LanguageModel {
  const provider = getTestProvider();
  const model = modelName || getDefaultModel();

  let rawModel: LanguageModel;

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY environment variable is required when TEST_PROVIDER=openrouter"
      );
    }

    const openrouter = createOpenRouter({
      apiKey,
    });

    rawModel = openrouter(model);

    // Add rate limiting for OpenRouter
    const originalGenerate = rawModel.doGenerate.bind(rawModel);
    rawModel.doGenerate = async (...args) => {
      await rateLimit();
      return originalGenerate(...args);
    };
  } else {
    // LM Studio provider
    const lmstudio = createOpenAICompatible({
      name: "lmstudio",
      baseURL: getLMStudioBaseURL(),
    });

    rawModel = lmstudio(model);
  }

  // TODO: Enable tracing once SQLite binding issue is resolved
  // Tracing disabled due to "SQLite3 can only bind numbers, strings, bigints, buffers, and null" error
  // return traceAISDKModel(rawModel);
  return rawModel;
}

/**
 * Create an AI SDK model instance for judging/evaluation
 */
export function getJudgeModelInstance(): LanguageModel {
  return getModel(getJudgeModel());
}
