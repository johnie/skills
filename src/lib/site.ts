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

export const installCommand = `npx skills add ${site.repo}`;

export const skillInstallCommand = (skill: string) =>
  `${installCommand} --skill ${skill}`;

/** Asks a skill's page for markdown instead of HTML: every file of the skill in one document (`src/server.ts`). */
export const skillFetchCommand = (skill: string) =>
  `curl -H "Accept: text/markdown" ${site.url}/${skill}`;
