export const site = {
  author: "Johnie Hjelm",
  githubUrl: "https://github.com/johnie/skills",
  homepageLabel: "johnie.se",
  homepageUrl: "https://johnie.se",
  owner: "johnie",
  repo: "johnie/skills",
  skillsShUrl: "https://skills.sh/johnie/skills",
} as const;

export const installCommand = `npx skills add ${site.repo}`;

export const skillInstallCommand = (skill: string) =>
  `${installCommand} --skill ${skill}`;
