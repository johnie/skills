// Importing a stylesheet is a build-time concern the compiler knows nothing about on its own.
declare module "*.css";

// The Worker secret `src/lib/github.ts` sends to GitHub; unset in local dev and at build unless exported.
declare namespace NodeJS {
  interface ProcessEnv {
    GITHUB_TOKEN?: string;
  }
}
