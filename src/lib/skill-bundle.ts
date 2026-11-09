import { createHash } from "node:crypto";

/**
 * Every file of a skill in one markdown document: `SKILL.md`, then the rest by path, each verbatim inside
 * `<file path="…">`. Paths are relative to the skill directory, so the relative links the files already use
 * (`references/flags.md`) name the file they point at, no rewriting needed.
 *
 * Build-time only: `content-collections.ts` stores the result on the skill document, so the server answers
 * with a ready body and ETag, and the skill page draws the outline.
 */
export const bundleSkill = (unordered: { path: string; source: string }[]) => {
  const files = unordered.toSorted(
    (a, b) =>
      Number(a.path !== "SKILL.md") - Number(b.path !== "SKILL.md") ||
      a.path.localeCompare(b.path)
  );

  const body = files
    .map(
      ({ path, source }) =>
        `<file path="${path}">\n${source.endsWith("\n") ? source : `${source}\n`}</file>\n`
    )
    .join("\n");

  return {
    body,
    bytes: Buffer.byteLength(body),
    etag: `"${createHash("sha256").update(body).digest("hex").slice(0, 32)}"`,
    files: files.map(({ path, source }) => ({
      lines: source.split("\n").length - Number(source.endsWith("\n")),
      path,
    })),
  };
};
