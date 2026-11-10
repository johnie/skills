import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { installCommand, site } from "@/lib/site";
import { skills } from "@/lib/skills";

/** What `npx skills add` prints, rendered from the same catalogue as the list below it. */
export const InstallPreview = () => (
  <figure aria-label="Example output of the install command">
    <Card className="gap-0 py-0 font-mono text-xs/relaxed">
      <CardHeader className="text-muted-foreground flex items-center justify-between border-b py-3 text-xs">
        <span>~/dev/crip</span>
        <span>zsh</span>
      </CardHeader>
      <CardContent className="space-y-5 py-5">
        <p>
          <span className="text-muted-foreground">$</span> {installCommand}
        </p>
        <div className="text-muted-foreground space-y-5 ps-2.5">
          <p>
            Found {skills.length} skills in {site.repo}
          </p>
          <ul className="grid grid-cols-[auto_1fr] gap-x-4">
            {skills.map((skill) => (
              <li
                key={skill.name}
                className="col-span-2 grid grid-cols-subgrid"
              >
                <span>✓ {skill.name}</span>
                <span>{skill.category}</span>
              </li>
            ))}
          </ul>
          <p>
            Installed to{" "}
            <span className="text-foreground">.agents/skills/</span>
          </p>
        </div>
      </CardContent>
    </Card>
  </figure>
);
