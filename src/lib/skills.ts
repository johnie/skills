// A relative import, not the `content-collections` path alias its docs suggest: rshono's server build
// externalizes bare specifiers it doesn't know, so an alias would be loaded at runtime instead of bundled.
import { allReferences, allSkills } from "../../.content-collections/generated";
import type { Skill } from "./skill-schema";

export type {
  Reference,
  Skill as SkillDocument,
} from "../../.content-collections/generated";

/**
 * Every `skills/<name>/SKILL.md` and its `references/*.md`, assembled by `content-collections.ts` at build time.
 * Server-only: the documents carry rendered HTML and the markdown bundle, so client components get the
 * `skills` listing instead.
 */
export const skillDocuments = allSkills.toSorted((a, b) =>
  a.name.localeCompare(b.name)
);

export const skills: Skill[] = skillDocuments.map(({ listing }) => listing);

export const getSkill = (name: string) =>
  skillDocuments.find((skill) => skill.name === name);

export const referencesOf = (skill: string) =>
  allReferences
    .filter((reference) => reference.skill === skill)
    .toSorted((a, b) => a.slug.localeCompare(b.slug));

export const skillPaths = () => skillDocuments.map(({ name }) => ({ name }));

export const referencePaths = () =>
  allReferences.map(({ skill, slug }) => ({ name: skill, reference: slug }));
