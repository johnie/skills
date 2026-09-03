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

export const createColors = (): Colors => ({
  dim: (text: string) => kleur.dim(text),
  error: (text: string) => kleur.red(text),
  icons: {
    broken: kleur.yellow("⚠"),
    linked: kleur.green("✓"),
    unlinked: kleur.dim("○"),
  },
  info: (text: string) => kleur.cyan(text),
  success: (text: string) => kleur.green(text),
  warn: (text: string) => kleur.yellow(text),
});
