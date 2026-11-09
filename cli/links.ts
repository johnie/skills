import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import kleur from "kleur";

import { discoverSkills, SKILLS_DIR, skillPath } from "../catalog/skills";

/** Where Claude Code discovers personal skills. */
export const TARGET_DIR = path.join(homedir(), ".claude", "skills");

const targetPath = (name: string) => path.join(TARGET_DIR, name);

/**
 * What sits at a skill's path in `TARGET_DIR`. `stale` is a symlink that isn't this repo's skill, dangling or
 * pointing elsewhere: safe to replace or remove. `occupied` is a real file or directory, which is never touched.
 */
type LinkState = "absent" | "linked" | "broken" | "stale" | "occupied";

export const linkState = (name: string): LinkState => {
  const target = targetPath(name);
  const stats = lstatSync(target, { throwIfNoEntry: false });

  if (stats === undefined) {
    return "absent";
  }

  if (!stats.isSymbolicLink()) {
    return "occupied";
  }

  // existsSync follows the link, so it is false for a dangling one.
  if (!existsSync(target)) {
    return "broken";
  }

  return readlinkSync(target) === skillPath(name) ? "linked" : "stale";
};

const icons = {
  broken: kleur.yellow("⚠"),
  linked: kleur.green("✓"),
  unlinked: kleur.dim("○"),
};

/** One line of the skill list: a dangling link is called out, because it is the state that needs action. */
export const skillLine = (name: string, state: LinkState): string => {
  if (state === "broken") {
    return `${icons.broken} ${name}${kleur.yellow(" (broken)")}`;
  }

  return `${state === "linked" ? icons.linked : icons.unlinked} ${name}`;
};

/** Both return the line to print, and throw an `Error` whose message says why nothing changed. */
export const linkSkill = (name: string): string => {
  if (!discoverSkills().includes(name)) {
    throw new Error(`Error: Skill '${name}' not found in ${SKILLS_DIR}`);
  }

  const state = linkState(name);

  if (state === "occupied") {
    throw new Error(
      `Error: ${targetPath(name)} exists but is not a symlink. Remove it manually first.`
    );
  }

  if (state === "absent") {
    mkdirSync(TARGET_DIR, { recursive: true });
  } else {
    unlinkSync(targetPath(name));
  }

  symlinkSync(skillPath(name), targetPath(name));

  return `${icons.linked} Linked: ${name}`;
};

export const unlinkSkill = (name: string): string => {
  const state = linkState(name);

  if (state === "absent") {
    return kleur.dim(`Skill '${name}' is not linked`);
  }

  if (state === "occupied") {
    throw new Error(
      `Error: ${targetPath(name)} exists but is not a symlink. Remove it manually.`
    );
  }

  unlinkSync(targetPath(name));

  return `${icons.unlinked} Unlinked: ${name}`;
};
