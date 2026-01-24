import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import type { LocalContext } from "./context";

export interface Skill {
  name: string;
  isLinked: boolean;
  isBroken: boolean;
}

export function getAvailableSkills(context: LocalContext): string[] {
  if (!existsSync(context.skillsDir)) {
    context.process.stderr.write(
      context.colors.error(
        `Error: Skills directory '${context.skillsDir}' not found\n`
      )
    );
    context.process.exit(1);
  }

  const entries = readdirSync(context.skillsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function getSymlinkStatus(
  skillName: string,
  context: LocalContext
): Skill {
  const targetPath = join(context.targetDir, skillName);
  const sourcePath = join(context.skillsDir, skillName);

  let isLinked = false;
  let isBroken = false;

  if (existsSync(targetPath)) {
    try {
      const stats = lstatSync(targetPath);
      if (stats.isSymbolicLink()) {
        const linkTarget = readlinkSync(targetPath);
        isLinked = linkTarget === sourcePath;
        isBroken = !existsSync(targetPath);
      }
    } catch {
      isBroken = true;
    }
  }

  return { name: skillName, isLinked, isBroken };
}

export function ensureTargetDir(context: LocalContext): void {
  if (!existsSync(context.targetDir)) {
    context.process.stdout.write(
      context.colors.info(`Creating target directory: ${context.targetDir}\n`)
    );
    mkdirSync(context.targetDir, { recursive: true });
  }
}

export function linkSkill(skillName: string, context: LocalContext): void {
  ensureTargetDir(context);

  const sourcePath = join(context.skillsDir, skillName);
  const targetPath = join(context.targetDir, skillName);

  if (!existsSync(sourcePath)) {
    context.process.stderr.write(
      context.colors.error(
        `Error: Skill '${skillName}' not found in ${context.skillsDir}\n`
      )
    );
    return;
  }

  if (existsSync(targetPath)) {
    const stats = lstatSync(targetPath);
    if (!stats.isSymbolicLink()) {
      context.process.stderr.write(
        context.colors.error(
          `Error: ${targetPath} exists but is not a symlink. Remove it manually first.\n`
        )
      );
      return;
    }
    unlinkSync(targetPath);
  }

  symlinkSync(sourcePath, targetPath);
  context.process.stdout.write(
    `${context.colors.icons.linked} Linked: ${skillName}\n`
  );
}

export function unlinkSkill(skillName: string, context: LocalContext): void {
  const targetPath = join(context.targetDir, skillName);

  if (!existsSync(targetPath)) {
    context.process.stdout.write(
      context.colors.dim(`Skill '${skillName}' is not linked\n`)
    );
    return;
  }

  const stats = lstatSync(targetPath);
  if (!stats.isSymbolicLink()) {
    context.process.stderr.write(
      context.colors.error(
        `Error: ${targetPath} exists but is not a symlink. Remove it manually.\n`
      )
    );
    return;
  }

  unlinkSync(targetPath);
  context.process.stdout.write(
    `${context.colors.icons.unlinked} Unlinked: ${skillName}\n`
  );
}

export function getIcon(skill: Skill, context: LocalContext): string {
  if (skill.isLinked) {
    return context.colors.icons.linked;
  }
  if (skill.isBroken) {
    return context.colors.icons.broken;
  }
  return context.colors.icons.unlinked;
}
