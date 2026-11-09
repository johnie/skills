import type { PageProps } from "@rshono/core";
import { notFound } from "@rshono/core/server";

import { SkillShell } from "@/components/skill/skill-shell";
import { getSkill, referencesOf } from "@/lib/skills";

import { Layout } from "./layout";

export default function SkillPage({ params }: PageProps<"/:name">) {
  const skill = getSkill(params.name);

  if (skill === undefined) {
    notFound();
  }

  return (
    <Layout title={skill.name} description={skill.summary}>
      <SkillShell
        skill={skill}
        references={referencesOf(skill.name)}
        fileName="SKILL.md"
        html={skill.html}
      />
    </Layout>
  );
}
