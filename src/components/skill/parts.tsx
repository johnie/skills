import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { site } from "@/lib/site";
import type { Reference, SkillDocument } from "@/lib/skills";
import { cn } from "@/lib/utils";

/** The skill's `description` frontmatter; backticked spans are the only markdown it uses. */
export const SkillDescription = ({
  skill,
  className,
}: {
  skill: SkillDocument;
  className?: string;
}) => (
  <p
    className={cn(
      "text-muted-foreground text-sm/relaxed text-pretty",
      className
    )}
  >
    {skill.description
      .split(/`(?<code>[^`]+)`/u)
      .map((part, index) =>
        index % 2 === 1 ? <code key={part}>{part}</code> : part
      )}
  </p>
);

export const SkillBreadcrumb = ({
  skill,
  fileName,
}: {
  skill: SkillDocument;
  fileName: string;
}) => (
  <nav
    aria-label="Breadcrumb"
    className="text-muted-foreground font-mono text-xs"
  >
    <ol className="flex flex-wrap items-center gap-2">
      <li>
        <a
          href="/#skills"
          className="text-muted-foreground hover:text-foreground no-underline"
        >
          skills
        </a>
      </li>
      <li aria-hidden>/</li>
      <li>
        <a
          href={`/${skill.name}`}
          className="text-muted-foreground hover:text-foreground no-underline"
        >
          {skill.name}
        </a>
      </li>
      {fileName !== "SKILL.md" && (
        <>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {fileName}
          </li>
        </>
      )}
    </ol>
  </nav>
);

/** Small uppercase mono label used above sidebar groups. */
export const SideLabel = ({ children }: { children: string }) => (
  <p className="text-muted-foreground font-mono text-[11px] tracking-widest uppercase">
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
    { fileName: "SKILL.md", href: `/${skill.name}` },
    ...references.map((reference) => ({
      fileName: reference.fileName,
      href: `/${skill.name}/references/${reference.slug}`,
    })),
  ];

  return (
    <nav aria-label="Skill files" className="font-mono text-xs">
      <SideLabel>Files</SideLabel>
      <ul className="mt-3 space-y-0.5">
        {files.map((file) => {
          const current = file.fileName === fileName;

          return (
            <li key={file.fileName}>
              <a
                href={file.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block truncate border-l py-1 pl-3 no-underline transition-colors",
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

/** `Bash(git commit *)` → tool `Bash`, scope `git commit *`; a bare `Read` has no scope. */
const TOOL_RULE = /^(?<tool>[A-Za-z]+)(?:\((?<scope>.+)\))?$/u;

/**
 * The skill's `allowed-tools`, grouped by tool. These are pre-approved for the turn the skill runs in, so the
 * agent uses them without asking; they don't restrict anything else.
 */
export const SkillPrivileges = ({ skill }: { skill: SkillDocument }) => {
  const scopesByTool = new Map<string, string[]>();

  for (const rule of skill.allowedTools) {
    const groups = TOOL_RULE.exec(rule)?.groups;
    const tool = groups?.["tool"] ?? rule;
    const scope = groups?.["scope"];
    const scopes = scopesByTool.get(tool) ?? [];

    if (scope !== undefined) {
      scopes.push(scope);
    }

    scopesByTool.set(tool, scopes);
  }

  if (scopesByTool.size === 0) {
    return null;
  }

  const entries = [...scopesByTool];
  const unscoped = entries.filter(([, scopes]) => scopes.length === 0);
  const scoped = entries.filter(([, scopes]) => scopes.length > 0);

  return (
    <div>
      <SideLabel>Agent privileges</SideLabel>
      <p className="text-muted-foreground mt-2 text-xs">
        Pre-approved, so the agent runs these without asking.
      </p>
      <div className="mt-4 space-y-4 font-mono text-xs">
        {unscoped.length > 0 && (
          <ul
            aria-label="Tools allowed without a scope"
            className="flex flex-wrap gap-1.5"
          >
            {unscoped.map(([tool]) => (
              <li key={tool} className="border px-1.5 py-0.5">
                {tool}
              </li>
            ))}
          </ul>
        )}
        {scoped.length > 0 && (
          <dl className="space-y-4">
            {scoped.map(([tool, scopes]) => (
              <div key={tool}>
                <dt>{tool}</dt>
                <dd className="text-muted-foreground mt-1.5 border-l pl-3">
                  <ul className="space-y-1">
                    {scopes.map((scope) => (
                      <li key={scope} className="break-all">
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
      <span className="truncate">
        skills/{skill.name}/{fileName}
      </span>
      <a
        href={`${site.githubUrl}/blob/main/skills/${skill.name}/${fileName}`}
        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1 no-underline"
      >
        GitHub
        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
      </a>
    </div>
    <article
      // `prose-sm` for the text; code blocks keep the base `prose` spacing at 12px, which reads better. `prose-sm`
      // shrinks every `code` to 0.857em, so code inside a block is reset to the block's size.
      className="prose prose-sm prose-neutral dark:prose-invert prose-headings:font-heading prose-headings:font-normal prose-headings:tracking-tight prose-table:font-mono prose-th:font-mono prose-th:font-medium prose-th:tracking-normal prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:bg-card prose-pre:my-[1.7142857em] prose-pre:rounded-none prose-pre:px-[1.1428571em] prose-pre:py-[0.8571429em] prose-pre:text-xs max-w-none px-5 py-8 sm:px-10 [&_pre_code]:text-[1em]"
      // Rendered at build time from this repo's own markdown, with raw HTML disabled (content-collections.ts).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </section>
);
