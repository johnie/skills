// A relative import, not the `content-collections` path alias its docs suggest: rshono's server build
// externalizes bare specifiers it doesn't know, so an alias would be loaded at runtime instead of bundled.
import {
  allFiles,
  allReferences,
  allSkills,
} from "../../.content-collections/generated";
import type { Skill } from "./skill-metadata";

export type {
  Reference,
  Skill as SkillDocument,
} from "../../.content-collections/generated";

/**
 * Every `skills/<name>/SKILL.md` and its `references/*.md`, rendered by `content-collections.ts` at build time.
 * Server-only: the documents carry rendered HTML, so client components get the trimmed `skills` listing.
 */
const documents = allSkills.toSorted((a, b) => a.name.localeCompare(b.name));

export const skills: Skill[] = documents.map(
  ({ name, category, summary, reads, writes, never }) => ({
    category,
    name,
    never,
    reads,
    summary,
    writes,
  })
);

export const getSkill = (name: string) =>
  documents.find((skill) => skill.name === name);

export const referencesOf = (skill: string) =>
  allReferences
    .filter((reference) => reference.skill === skill)
    .toSorted((a, b) => a.slug.localeCompare(b.slug));

export const skillPaths = () => documents.map(({ name }) => ({ name }));

export const referencePaths = () =>
  allReferences.map(({ skill, slug }) => ({ name: skill, reference: slug }));

export interface SkillMarkdown {
  body: string;
  etag: string;
}

const buildMarkdown = async (name: string): Promise<SkillMarkdown> => {
  const body = allFiles
    .filter((file) => file.skill === name)
    .toSorted(
      (a, b) =>
        Number(a.path !== "SKILL.md") - Number(b.path !== "SKILL.md") ||
        a.path.localeCompare(b.path)
    )
    .map(
      ({ path, source }) =>
        `<file path="${path}">\n${source.endsWith("\n") ? source : `${source}\n`}</file>\n`
    )
    .join("\n");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body)
  );

  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  return { body, etag: `"${hex.slice(0, 32)}"` };
};

const markdownBySkill = new Map<string, Promise<SkillMarkdown>>();

/**
 * Every file of a skill in one markdown document: `SKILL.md`, then `references/` and `scripts/` by path, each
 * verbatim inside `<file path="…">`. Paths are relative to the skill directory, so the relative links the files
 * already use (`references/flags.md`) name the file they point at, no rewriting needed. Built and hashed once per
 * isolate; `undefined` for an unknown skill.
 */
export const skillMarkdown = (name: string) => {
  if (getSkill(name) === undefined) {
    return;
  }

  const cached = markdownBySkill.get(name);

  if (cached !== undefined) {
    return cached;
  }

  const built = buildMarkdown(name);
  markdownBySkill.set(name, built);

  return built;
};
