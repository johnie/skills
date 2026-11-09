// Importing a stylesheet is a build-time concern the compiler knows nothing about on its own.
declare module "*.css";

// Declared so `process.env.PUBLIC_APP_NAME` passes `noPropertyAccessFromIndexSignature` in this repo's tsconfig.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly PUBLIC_APP_NAME?: string;
  }
}
