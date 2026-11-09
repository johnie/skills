import type { PageProps } from "@rshono/core";
import { notFound } from "@rshono/core/server";

import { SkillShell } from "@/components/skill/skill-shell";
import { ogImageHref } from "@/lib/site";
import { getSkill, referencesOf } from "@/lib/skills";

import { Layout } from "./layout";

export default function SkillPage({ params }: PageProps<"/:name">) {
  const skill = getSkill(params.name);

  if (skill === undefined) {
    notFound();
  }

  return (
    <Layout
      title={skill.name}
      description={skill.listing.summary}
      image={ogImageHref(skill.name)}
    >
      <SkillShell
        skill={skill}
        references={referencesOf(skill.name)}
        fileName="SKILL.md"
        html={skill.html}
      />
    </Layout>
  );
}
