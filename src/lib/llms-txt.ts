import {
  installCommand,
  site,
  skillFetchCommand,
  skillHref,
  skillInstallCommand,
} from "./site";
import { categoryIds, categoryLabels } from "./skill-metadata";
import { skillDocuments } from "./skills";
import type { SkillDocument } from "./skills";

/**
 * `/llms.txt` (https://llmstxt.org): how an agent fetches one skill as markdown with curl (`src/server.ts`),
 * then every skill on the site by category, described by its frontmatter `description`, the text written for
 * a model deciding whether the skill fits. Built once per isolate: the skills are fixed at build time.
 */
const skillEntry = ({ description, name }: SkillDocument) =>
  [
    `- [${name}](${site.url}${skillHref(name)}): ${description}`,
    `  \`${skillFetchCommand(name)}\``,
  ].join("\n");

const categorySections = categoryIds.flatMap((category) => {
  const inCategory = skillDocuments.filter(
    ({ listing }) => listing.category === category
  );

  return inCategory.length === 0
    ? []
    : [`## ${categoryLabels[category]}`, inCategory.map(skillEntry).join("\n")];
});

export const llmsTxt = `${[
  `# ${site.repo}`,
  `> Agent skills for Claude Code. A skill is a \`SKILL.md\` with instructions plus the reference files it points at. Pick a skill from the lists below, fetch it with curl as one markdown document, then follow it or install it.`,
  "## Fetch a skill",
  `Request the skill's URL with \`Accept: text/markdown\`, replacing \`<name>\` with a skill name from the lists below:`,
  ["```sh", skillFetchCommand("<name>"), "```"].join("\n"),
  [
    '- The response is every file of the skill, `SKILL.md` first, each verbatim inside `<file path="…">…</file>`. Paths are relative to the skill directory, so the relative links inside the files name those paths.',
    "- Without the `Accept` header the same URL answers the HTML page for people.",
    "- Responses carry an `ETag`. Send it back in `If-None-Match` to get `304 Not Modified` while the skill is unchanged.",
  ].join("\n"),
  "## Use or install a skill",
  [
    "- To use a skill for the task at hand, fetch it and follow `SKILL.md`; read the other files when it points at them.",
    '- To install it for Claude Code, write each `<file path="P">` body to `~/.claude/skills/<name>/P` (all projects) or `.claude/skills/<name>/P` (this project), and make files under `scripts/` executable.',
    `- Or install with the skills CLI: \`${skillInstallCommand("<name>")}\`. \`${installCommand}\` installs every skill.`,
  ].join("\n"),
  ...categorySections,
  "## Optional",
  `- [Source on GitHub](${site.githubUrl}): every skill directory under \`skills/\``,
].join("\n\n")}\n`;
