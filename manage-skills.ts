#!/usr/bin/env bun
import { existsSync, lstatSync, readdirSync, readlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const SKILLS_DIR = "./skills";
const TARGET_DIR = join(homedir(), ".claude", "skills");

interface Skill {
  name: string;
  isLinked: boolean;
  isBroken: boolean;
}

function getAvailableSkills(): string[] {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Error: Skills directory '${SKILLS_DIR}' not found`);
    process.exit(1);
  }

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getSymlinkStatus(skillName: string): Skill {
  const targetPath = join(TARGET_DIR, skillName);
  const sourcePath = join(process.cwd(), SKILLS_DIR, skillName);

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

async function ensureTargetDir(): Promise<void> {
  if (!existsSync(TARGET_DIR)) {
    console.log(`Creating target directory: ${TARGET_DIR}`);
    await $`mkdir -p ${TARGET_DIR}`;
  }
}

async function linkSkill(skillName: string): Promise<void> {
  await ensureTargetDir();

  const sourcePath = join(process.cwd(), SKILLS_DIR, skillName);
  const targetPath = join(TARGET_DIR, skillName);

  if (!existsSync(sourcePath)) {
    console.error(`Error: Skill '${skillName}' not found in ${SKILLS_DIR}`);
    return;
  }

  if (existsSync(targetPath)) {
    const stats = lstatSync(targetPath);
    if (!stats.isSymbolicLink()) {
      console.error(
        `Error: ${targetPath} exists but is not a symlink. Remove it manually first.`
      );
      return;
    }
    await $`rm ${targetPath}`;
  }

  await $`ln -sf ${sourcePath} ${targetPath}`;
  console.log(`✓ Linked: ${skillName}`);
}

async function unlinkSkill(skillName: string): Promise<void> {
  const targetPath = join(TARGET_DIR, skillName);

  if (!existsSync(targetPath)) {
    console.log(`Skill '${skillName}' is not linked`);
    return;
  }

  const stats = lstatSync(targetPath);
  if (!stats.isSymbolicLink()) {
    console.error(
      `Error: ${targetPath} exists but is not a symlink. Remove it manually.`
    );
    return;
  }

  await $`rm ${targetPath}`;
  console.log(`✗ Unlinked: ${skillName}`);
}

function listSkills(): void {
  const skills = getAvailableSkills();
  console.log("\nSkill Manager - Claude");
  console.log(`Target: ${TARGET_DIR}\n`);

  for (const skillName of skills) {
    const status = getSymlinkStatus(skillName);
    const icon = status.isLinked ? "✓" : "○";
    const suffix = status.isBroken ? " (broken)" : "";
    console.log(`${icon} ${skillName}${suffix}`);
  }
  console.log();
}

async function prompt(message: string): Promise<string> {
  process.stdout.write(message);

  const reader = process.stdin.stream().getReader();
  const decoder = new TextDecoder();
  let input = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value);
    input += chunk;

    if (input.includes("\n")) {
      break;
    }
  }

  reader.releaseLock();
  return input.trim();
}

async function interactiveMode(): Promise<void> {
  while (true) {
    const skills = getAvailableSkills();
    console.clear();
    console.log("Skill Manager - Claude");
    console.log(`Target: ${TARGET_DIR}\n`);

    const statusList: Skill[] = [];
    for (const skillName of skills) {
      statusList.push(getSymlinkStatus(skillName));
    }

    for (const [index, skill] of statusList.entries()) {
      const icon = skill.isLinked ? "✓" : "○";
      const suffix = skill.isBroken ? " (broken)" : "";
      console.log(`[${index + 1}] ${icon} ${skill.name}${suffix}`);
    }

    const input = await prompt("\nEnter number to toggle, 'q' to quit: ");

    if (input.toLowerCase() === "q") {
      break;
    }

    const choice = Number.parseInt(input, 10);
    if (Number.isNaN(choice) || choice < 1 || choice > statusList.length) {
      continue;
    }

    const selectedSkill = statusList[choice - 1];
    if (selectedSkill.isLinked) {
      await unlinkSkill(selectedSkill.name);
    } else {
      await linkSkill(selectedSkill.name);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveMode();
    return;
  }

  const command = args[0];

  switch (command) {
    case "list": {
      listSkills();
      break;
    }
    case "link": {
      const skillName = args[1];
      if (!skillName) {
        console.error("Error: Skill name required");
        console.log("Usage: bun manage-skills.ts link <skill-name>");
        process.exit(1);
      }
      await linkSkill(skillName);
      break;
    }
    case "unlink": {
      const skillName = args[1];
      if (!skillName) {
        console.error("Error: Skill name required");
        console.log("Usage: bun manage-skills.ts unlink <skill-name>");
        process.exit(1);
      }
      await unlinkSkill(skillName);
      break;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      console.log("Usage:");
      console.log("  bun manage-skills.ts              # Interactive mode");
      console.log("  bun manage-skills.ts list         # List all skills");
      console.log("  bun manage-skills.ts link <name>  # Link a skill");
      console.log("  bun manage-skills.ts unlink <name># Unlink a skill");
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
