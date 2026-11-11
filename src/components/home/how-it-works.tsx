import { Container } from "@/components/container";
import { Card } from "@/components/ui/card";
import { skillInstallCommand } from "@/lib/site";

export const HowItWorks = () => (
  <section
    id="how-it-works"
    aria-labelledby="how-it-works-title"
    className="border-b"
  >
    <Container className="pb-8">
      <Card className="flex-row flex-wrap items-center justify-between gap-4 bg-transparent px-6 py-5">
        <h2 id="how-it-works-title" className="text-sm">
          Only need one? Install it by name.
        </h2>
        <p className="font-mono text-sm">
          <span className="text-muted-foreground">$</span>{" "}
          {skillInstallCommand("commit")}
        </p>
      </Card>
    </Container>
  </section>
);
