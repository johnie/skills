export const site = {
  author: "Johnie Hjelm",
  githubUrl: "https://github.com/johnie/skills",
  homepageLabel: "johnie.se",
  homepageUrl: "https://johnie.se",
  owner: "johnie",
  repo: "johnie/skills",
  skillsShUrl: "https://skills.sh/johnie/skills",
  url: "https://skills.johnie.se",
} as const;

/**
 * Where a skill lives on the site and on GitHub. The route patterns in `routes.ts` and `server.ts` have to be
 * literals, so they repeat the first two shapes.
 */
export const skillHref = (skill: string) => `/${skill}`;

export const referenceHref = (skill: string, slug: string) =>
  `/${skill}/references/${slug}`;

/** `file` is relative to the skill directory: `SKILL.md`, `scripts/fetch.sh`. */
export const skillSourceUrl = (skill: string, file: string) =>
  `${site.githubUrl}/blob/main/skills/${skill}/${file}`;

export const installCommand = `npx skills add ${site.repo}`;

export const skillInstallCommand = (skill: string) =>
  `${installCommand} --skill ${skill}`;

/** Asks a skill's page for markdown instead of HTML: every file of the skill in one document (`src/server.ts`). */
export const skillFetchCommand = (skill: string) =>
  `curl -H "Accept: text/markdown" ${site.url}${skillHref(skill)}`;
