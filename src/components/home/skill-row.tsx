import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { skillInstallCommand } from "@/lib/site";
import type { Skill } from "@/lib/skill-metadata";
import { cn } from "@/lib/utils";

export const SkillRow = ({
  skill,
  position,
}: {
  skill: Skill;
  position: number;
}) => {
  const contract = [
    { term: "reads", value: skill.reads },
    { term: "writes", value: skill.writes },
    { muted: true, term: "never", value: skill.never },
  ];

  return (
    // The name's link stretches over the whole row (`after:inset-0`), so anywhere on it opens the skill; the copy
    // button sits above that layer.
    <li className="group relative grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-4 gap-y-4 border-b py-6 md:grid-cols-[3rem_minmax(0,1fr)_16rem_auto] md:gap-x-6">
      <span className="text-muted-foreground group-hover:text-foreground pt-1 font-mono text-xs tabular-nums transition-colors md:pl-2.5">
        {String(position).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-mono text-base font-medium">
            <a
              href={`/skills/${skill.name}`}
              className="flex items-center gap-1.5 no-underline decoration-1 underline-offset-4 group-hover:underline after:absolute after:inset-0"
            >
              {skill.name}
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                className="text-muted-foreground group-hover:text-foreground size-4 transition-[color,translate] group-hover:translate-x-0.5"
              />
            </a>
          </h3>
          <Badge
            variant="outline"
            className="text-muted-foreground h-4.5 px-2 font-mono text-[10px] font-normal"
          >
            {skill.category}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{skill.summary}</p>
      </div>

      <dl className="col-start-2 row-start-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-mono text-xs md:col-start-3 md:row-start-1">
        {contract.map(({ term, value, muted }) => (
          <div key={term} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className={cn(muted && "text-muted-foreground")}>{value}</dd>
          </div>
        ))}
      </dl>

      <CopyButton
        value={skillInstallCommand(skill.name)}
        label={`install command for ${skill.name}`}
        className="relative col-start-3 row-start-1 md:col-start-4"
      />
    </li>
  );
};
