import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Link, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import { describe, expect, test } from "vitest";
import {
  discoverSkills,
  fileExists,
  getSkillPath,
  readSkillFile,
} from "../helpers/skills";

/**
 * Parse markdown content into an AST
 */
function parseMarkdown(content: string): Root {
  const processor = remark().use(remarkFrontmatter, ["yaml"]);
  return processor.parse(content);
}

/**
 * Extract all links from the AST
 */
function extractLinks(ast: Root): Link[] {
  const links: Link[] = [];
  function visit(node: any) {
    if (node.type === "link") {
      links.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }
  visit(ast);
  return links;
}

/**
 * Check if a URL is external (http/https)
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Get all local file references from links
 */
function getLocalFileReferences(links: Link[]): string[] {
  return links
    .map((link) => link.url)
    .filter((url) => !isExternalUrl(url))
    .filter((url) => !url.startsWith("#")); // Skip anchor links
}

/**
 * Get all files in the references directory
 */
function getReferencesFiles(skillPath: string): string[] {
  const referencesPath = join(skillPath, "references");
  try {
    if (!fileExists(referencesPath)) {
      return [];
    }
    const entries = readdirSync(referencesPath);
    return entries.filter((entry) => {
      const fullPath = join(referencesPath, entry);
      return statSync(fullPath).isFile();
    });
  } catch {
    return [];
  }
}

describe("Reference Validation", () => {
  const skills = discoverSkills();

  if (skills.length === 0) {
    test("at least one skill exists", () => {
      expect(skills.length).toBeGreaterThan(0);
    });
  }

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      let ast: Root;
      let localRefs: string[];
      const skillPath = getSkillPath(skillName);

      test("can extract links from markdown", async () => {
        const content = await readSkillFile(skillName);
        ast = parseMarkdown(content);
        const links = extractLinks(ast);
        expect(Array.isArray(links)).toBe(true);
      });

      test("all local file references exist", async () => {
        if (!ast) {
          const content = await readSkillFile(skillName);
          ast = parseMarkdown(content);
        }
        const links = extractLinks(ast);
        localRefs = getLocalFileReferences(links);

        const missingFiles: string[] = [];
        for (const ref of localRefs) {
          const fullPath = resolve(skillPath, ref);
          if (!fileExists(fullPath)) {
            missingFiles.push(ref);
          }
        }

        expect(missingFiles).toEqual([]);
        if (missingFiles.length > 0) {
          throw new Error(
            `Missing files referenced in SKILL.md: ${missingFiles.join(", ")}`
          );
        }
      });

      test("warn on orphaned files in references/", async () => {
        if (!localRefs) {
          if (!ast) {
            const content = await readSkillFile(skillName);
            ast = parseMarkdown(content);
          }
          const links = extractLinks(ast);
          localRefs = getLocalFileReferences(links);
        }

        const referencesFiles = getReferencesFiles(skillPath);
        if (referencesFiles.length === 0) {
          // No references directory or files, skip this test
          return;
        }

        // Get referenced files in the references directory
        const referencedFiles = localRefs
          .filter((ref) => ref.startsWith("references/"))
          .map((ref) => ref.replace("references/", ""));

        // Find orphaned files
        const orphanedFiles = referencesFiles.filter(
          (file) => !referencedFiles.includes(file)
        );

        // This is a warning test - we expect it to pass but log warnings
        if (orphanedFiles.length > 0) {
          console.warn(
            `[${skillName}] Orphaned files in references/ (not referenced in SKILL.md): ${orphanedFiles.join(", ")}`
          );
        }

        // Test always passes, this is just a warning
        expect(true).toBe(true);
      });
    });
  }
});
