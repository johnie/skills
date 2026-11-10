import type { ReactNode } from "react";

import { GetTabs } from "@/components/skill/get-tabs";
import { SmallLabel } from "@/components/skill/parts";
import { site, skillFetchCommand, skillInstallCommand } from "@/lib/site";
import type { SkillDocument } from "@/lib/skills";

const kilobytes = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  style: "unit",
  unit: "kilobyte",
});

/** A shell command; `children` follow it on the line, e.g. an optional flag. Copying is the tab bar's job. */
const CommandLine = ({
  command,
  children,
}: {
  command: string;
  children?: ReactNode;
}) => (
  <p className="font-mono text-xs/7 break-words sm:text-sm/7">
    <span className="text-muted-foreground select-none">$ </span>
    {command}
    {children}
  </p>
);

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="text-muted-foreground border-t px-4 py-3 text-xs/relaxed text-pretty">
    {children}
  </p>
);

/** The install command, with `-g` drawn as an optional flag: shown, but not part of what gets copied. */
const CliPanel = ({ skill }: { skill: SkillDocument }) => (
  <>
    <div className="space-y-3 px-4 py-5">
      <CommandLine command={skillInstallCommand(skill.name)}>
        {" "}
        <span className="text-muted-foreground border border-dashed px-1.5">
          -g
        </span>
      </CommandLine>
      <p className="text-muted-foreground text-xs">
        Installs in this repo. Add <code className="text-foreground">-g</code>{" "}
        to install it for your user, in every project.
      </p>
    </div>
    <Caption>
      Installs with the skills CLI, for the agents you pick. Listed on{" "}
      <a href={site.skillsShUrl}>skills.sh</a>.
    </Caption>
  </>
);

/** The one markdown document `curl` gets back, outlined file by file. */
const CurlPanel = ({ skill }: { skill: SkillDocument }) => {
  const { bytes, files } = skill.bundle;
  const longest = Math.max(...files.map(({ lines }) => lines));

  return (
    <>
      <div className="space-y-6 px-4 py-5">
        <CommandLine command={skillFetchCommand(skill.name)} />
        <section aria-label="Response body">
          <SmallLabel>
            text/markdown · {files.length}{" "}
            {files.length === 1 ? "file" : "files"} ·{" "}
            {kilobytes.format(bytes / 1000)}
          </SmallLabel>
          <ol className="mt-3 space-y-2.5 font-mono text-xs">
            {files.map(({ path, lines }) => (
              <li
                key={path}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[15rem_minmax(0,1fr)_5rem]"
              >
                <span className="wrap-break-word">{path}</span>
                <span
                  aria-hidden
                  className="bg-muted order-last col-span-2 h-1.5 sm:order-none sm:col-span-1"
                >
                  <span
                    className="bg-foreground/60 block h-full"
                    style={{ width: `${(lines / longest) * 100}%` }}
                  />
                </span>
                <span className="text-muted-foreground text-end tabular-nums">
                  {lines} lines
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <Caption>
        Same URL as this page. Each file arrives verbatim inside{" "}
        <code>{'<file path="…">'}</code>, <code>SKILL.md</code> first: what an
        agent reads to load or install the skill.
      </Caption>
    </>
  );
};

export const SkillGet = ({
  skill,
  className,
}: {
  skill: SkillDocument;
  className?: string;
}) => (
  <GetTabs
    skill={skill.name}
    className={className}
    tabs={[
      {
        command: skillInstallCommand(skill.name),
        label: "CLI",
        panel: <CliPanel skill={skill} />,
        value: "cli",
      },
      {
        command: skillFetchCommand(skill.name),
        label: "curl",
        panel: <CurlPanel skill={skill} />,
        value: "curl",
      },
    ]}
  />
);
