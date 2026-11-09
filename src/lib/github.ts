import { z } from "zod";

import { site } from "@/lib/site";

const Repository = z.object({ stargazers_count: z.number().int() });

/** Unauthenticated GitHub API calls are limited to 60 an hour per IP, so an isolate asks at most once an hour. */
const TTL_MS = 60 * 60 * 1000;

const fetchStars = async () => {
  try {
    const response = await fetch(`https://api.github.com/repos/${site.repo}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": site.repo,
      },
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      return;
    }

    return Repository.parse(await response.json()).stargazers_count;
  } catch {
    // Timed out, offline or rate-limited: the header renders without a count.
  }
};

let cached: { at: number; stars: Promise<number | undefined> } | undefined;

/**
 * The repo's stargazer count, or `undefined` when GitHub is slow or refuses, so the header renders without it
 * rather than failing. Prerendered pages carry the count from build time; dynamic ones refresh it hourly.
 */
export const repoStars = () => {
  if (cached === undefined || Date.now() - cached.at > TTL_MS) {
    cached = { at: Date.now(), stars: fetchStars() };
  }

  return cached.stars;
};
