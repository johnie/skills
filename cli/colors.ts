import kleur from "kleur";

export interface Colors {
  dim: (text: string) => string;
  error: (text: string) => string;
  icons: {
    linked: string;
    unlinked: string;
    broken: string;
  };
  info: (text: string) => string;
  success: (text: string) => string;
  warn: (text: string) => string;
}

export function createColors(): Colors {
  return {
    success: (text: string) => kleur.green(text),
    error: (text: string) => kleur.red(text),
    warn: (text: string) => kleur.yellow(text),
    info: (text: string) => kleur.cyan(text),
    dim: (text: string) => kleur.dim(text),
    icons: {
      linked: kleur.green("✓"),
      unlinked: kleur.dim("○"),
      broken: kleur.yellow("⚠"),
    },
  };
}
