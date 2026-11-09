import { CommandSnippet } from "@/components/command-snippet";
import { Container } from "@/components/container";
import { AgentLogos } from "@/components/home/agent-logos";
import { InstallPreview } from "@/components/home/install-preview";
import { Button } from "@/components/ui/button";
import { installCommand } from "@/lib/site";

export const Hero = () => (
  <section aria-labelledby="hero-title">
    <Container className="grid items-start gap-14 py-20 sm:py-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <h1
          id="hero-title"
          className="font-heading mt-5 text-6xl/none tracking-tight text-balance sm:text-7xl/none"
        >
          My agent skills.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-md text-base/relaxed text-pretty sm:text-lg/relaxed">
          The skills I use every day.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <CommandSnippet command={installCommand} label="install command" />
          <Button
            size="lg"
            nativeButton={false}
            render={<a href="#skills" />}
            className="h-11 px-4 text-sm no-underline"
          >
            Browse skills
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-muted-foreground font-mono text-[11px]">
            Works with
          </span>
          <AgentLogos />
        </div>
      </div>

      <InstallPreview />
    </Container>
  </section>
);
