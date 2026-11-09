import type { PageProps } from "@rshono/core";
import { notFound } from "@rshono/core/server";

import { SkillShell } from "@/components/skill/skill-shell";
import { getSkill, referencesOf } from "@/lib/skills";

import { Layout } from "./layout";

export default function ReferencePage({
  params,
}: PageProps<"/:name/references/:reference">) {
  const skill = getSkill(params.name);
  const references = referencesOf(params.name);
  const reference = references.find(({ slug }) => slug === params.reference);

  if (skill === undefined || reference === undefined) {
    notFound();
  }

  return (
    <Layout
      title={`${reference.title} · ${skill.name}`}
      description={skill.summary}
    >
      <SkillShell
        skill={skill}
        references={references}
        fileName={reference.fileName}
        html={reference.html}
      />
    </Layout>
  );
}
