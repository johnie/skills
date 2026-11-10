import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import { referenceHref, skillHref, skillSourceUrl } from "@/lib/site";
import type { Reference, SkillDocument } from "@/lib/skills";
import { cn } from "@/lib/utils";

/** The skill's `description` frontmatter, rendered with typographic punctuation; backticked spans are the only markdown it uses. */
export const SkillDescription = ({
  skill,
  className,
}: {
  skill: SkillDocument;
  className?: string;
}) => (
  <div
    className={cn(
      "text-muted-foreground text-sm/relaxed text-pretty",
      className
    )}
    // Rendered at build time from this repo's own frontmatter, with raw HTML disabled (content-collections.ts).
    dangerouslySetInnerHTML={{ __html: skill.descriptionHtml }}
  />
);

export const SmallLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
    {children}
  </p>
);

export const SkillFileNav = ({
  skill,
  references,
  fileName,
}: {
  skill: SkillDocument;
  references: Reference[];
  fileName: string;
}) => {
  const files = [
    { fileName: "SKILL.md", href: skillHref(skill.name) },
    ...references.map((reference) => ({
      fileName: reference.fileName,
      href: referenceHref(skill.name, reference.slug),
    })),
  ];

  return (
    <nav aria-label="Skill files" className="font-mono text-xs">
      <SmallLabel>Files</SmallLabel>
      <ul className="mt-3 space-y-0.5">
        {files.map((file) => {
          const current = file.fileName === fileName;

          return (
            <li key={file.fileName}>
              <a
                href={file.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block border-s py-1 ps-3 wrap-break-word no-underline transition-colors",
                  current
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {file.fileName}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

/**
 * The skill's `allowed-tools`, grouped by tool. These are pre-approved for the turn the skill runs in, so the
 * agent uses them without asking; they don't restrict anything else.
 */
export const SkillPrivileges = ({ skill }: { skill: SkillDocument }) => {
  if (skill.privileges.length === 0) {
    return null;
  }

  const unscoped = skill.privileges.filter(({ scopes }) => scopes.length === 0);
  const scoped = skill.privileges.filter(({ scopes }) => scopes.length > 0);

  return (
    <div>
      <SmallLabel>Agent privileges</SmallLabel>
      <p className="text-muted-foreground mt-2 text-xs">
        Pre-approved, so the agent runs these without asking.
      </p>
      <div className="mt-4 space-y-4 font-mono text-xs">
        {unscoped.length > 0 && (
          <ul
            aria-label="Tools allowed without a scope"
            className="flex flex-wrap gap-1.5"
          >
            {unscoped.map(({ tool }) => (
              <li key={tool} className="border px-1.5 py-0.5">
                {tool}
              </li>
            ))}
          </ul>
        )}
        {scoped.length > 0 && (
          <dl className="space-y-4">
            {scoped.map(({ tool, scopes }) => (
              <div key={tool}>
                <dt>{tool}</dt>
                <dd className="text-muted-foreground mt-1.5 border-s ps-3">
                  <ul className="space-y-1">
                    {scopes.map((scope) => (
                      <li key={scope} className="wrap-break-word">
                        {scope}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

export const SkillFile = ({
  skill,
  fileName,
  html,
}: {
  skill: SkillDocument;
  fileName: string;
  html: string;
}) => (
  <section aria-label={fileName} className="min-w-0 border">
    <div className="bg-card text-muted-foreground flex items-center justify-between gap-4 border-b px-5 py-3 font-mono text-xs">
      <span className="min-w-0 wrap-break-word">
        skills/{skill.name}/{fileName}
      </span>
      <a
        href={skillSourceUrl(skill.name, fileName)}
        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 no-underline"
      >
        GitHub
        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
      </a>
    </div>
    <article
      // Long-form text at the 16px body size, each text block capped at 32rem: 65–72 characters of Geist per line, where
      // `ch` (Geist's wide `0`) would let lines run past 80. Tables and code blocks keep the full column, at 12px.
      className="prose prose-neutral dark:prose-invert prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-tight prose-h1:text-3xl prose-table:font-mono prose-th:font-mono prose-th:font-medium prose-th:tracking-normal prose-code:font-normal prose-code:wrap-break-word prose-code:before:content-none prose-code:after:content-none prose-pre:bg-card prose-pre:rounded-none prose-pre:text-xs max-w-none px-5 py-8 sm:px-10 [&>:is(p,ul,ol,blockquote)]:max-w-lg"
      // Rendered at build time from this repo's own markdown, with raw HTML disabled (content-collections.ts).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </section>
);
