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
  isBroken: boolean;
  isLinked: boolean;
  name: string;
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
  return (
    entries
      .filter((entry) => entry.isDirectory())
      // Only directories that actually hold a SKILL.md are linkable. This keeps
      // skill-creator's `<skill>-workspace/` siblings out of the picker. The test
      // helper deliberately uses a looser rule so a missing SKILL.md still fails.
      .filter((entry) =>
        existsSync(join(context.skillsDir, entry.name, "SKILL.md"))
      )
      .map((entry) => entry.name)
      .sort()
  );
}

export function getSymlinkStatus(
  skillName: string,
  context: LocalContext
): Skill {
  const targetPath = join(context.targetDir, skillName);
  const sourcePath = join(context.skillsDir, skillName);

  let stats: ReturnType<typeof lstatSync>;
  try {
    // lstat does not follow the link, so a dangling symlink still resolves here.
    stats = lstatSync(targetPath);
  } catch {
    return { name: skillName, isLinked: false, isBroken: false };
  }

  if (!stats.isSymbolicLink()) {
    return { name: skillName, isLinked: false, isBroken: false };
  }

  // existsSync *does* follow the link, so it is false for a dangling one.
  const isBroken = !existsSync(targetPath);
  const isLinked = readlinkSync(targetPath) === sourcePath && !isBroken;

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
  // Broken takes precedence: a dangling symlink is actionable, "linked" is not.
  if (skill.isBroken) {
    return context.colors.icons.broken;
  }
  if (skill.isLinked) {
    return context.colors.icons.linked;
  }
  return context.colors.icons.unlinked;
}
