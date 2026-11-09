import { Container } from "@/components/container";
import {
  SideLabel,
  SkillBreadcrumb,
  SkillDescription,
  SkillFile,
  SkillFileNav,
  SkillPrivileges,
} from "@/components/skill/parts";
import { SkillGet } from "@/components/skill/skill-get";
import type { Reference, SkillDocument } from "@/lib/skills";

/**
 * Everything around a rendered skill file: the summary as the headline, the description and the ways to get the
 * skill, then files, arguments and tools beside the file. `fileName` is the file being shown, relative to the
 * skill directory (`SKILL.md`, `references/flags.md`).
 */
export const SkillShell = ({
  skill,
  references,
  fileName,
  html,
}: {
  skill: SkillDocument;
  references: Reference[];
  fileName: string;
  html: string;
}) => (
  <Container className="py-12 sm:py-16">
    <SkillBreadcrumb skill={skill} fileName={fileName} />

    <header className="mt-10">
      <h1 className="font-heading max-w-4xl text-4xl/tight tracking-tight text-balance sm:text-5xl/tight">
        {skill.summary}
      </h1>
      <SkillDescription skill={skill} className="mt-6 max-w-2xl" />
      <SkillGet skill={skill} className="mt-8" />
    </header>

    <div className="mt-14 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="space-y-10">
        <SkillFileNav
          skill={skill}
          references={references}
          fileName={fileName}
        />
        {skill.argumentHint !== undefined && (
          <div>
            <SideLabel>Arguments</SideLabel>
            <p className="mt-3 font-mono text-xs">{skill.argumentHint}</p>
          </div>
        )}
        <SkillPrivileges skill={skill} />
      </aside>
      <SkillFile skill={skill} fileName={fileName} html={html} />
    </div>
  </Container>
);
