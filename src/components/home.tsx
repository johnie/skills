import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { SkillDirectory } from "@/components/home/skill-directory";
import { skills } from "@/lib/skills";

import { Layout } from "./layout";

export default function Home() {
  return (
    <Layout description="The agent skills I use every day. Each one lists what it reads, what it writes and what it never does.">
      <Hero />
      <SkillDirectory skills={skills} />
      <HowItWorks />
    </Layout>
  );
}
