import { GithubIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { repoStars } from "@/lib/github";
import { site } from "@/lib/site";

const linkClass =
  "text-muted-foreground hover:text-foreground flex items-center gap-1.5 no-underline transition-colors";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export const SiteHeader = async () => {
  const stars = await repoStars();

  return (
    <header className="border-b">
      <Container className="flex h-14 items-center justify-between gap-6">
        <a
          href="/"
          className="flex items-center gap-2.5 font-mono text-sm whitespace-nowrap no-underline"
        >
          <Logo className="h-5 w-auto" />
          <span className="sr-only">{site.owner}</span>
          <span className="text-muted-foreground" aria-hidden="true">
            /
          </span>
          <span>skills</span>
        </a>
        <nav aria-label="Main">
          <ul className="flex items-center gap-4 text-sm sm:gap-6">
            <li>
              <a href={site.skillsShUrl} className={linkClass}>
                skills.sh
              </a>
            </li>
            <li>
              <a
                href={site.homepageUrl}
                title={site.homepageLabel}
                className={linkClass}
              >
                <HugeiconsIcon icon={Globe02Icon} className="size-4" />
                <span className="sr-only">{site.homepageLabel}</span>
              </a>
            </li>
            <li>
              <a
                href={site.githubUrl}
                title="GitHub"
                aria-label={
                  stars === undefined ? "GitHub" : `GitHub, ${stars} stars`
                }
                className={linkClass}
              >
                <HugeiconsIcon icon={GithubIcon} className="size-4" />
                {stars === undefined ? null : (
                  <span className="font-mono text-xs tabular-nums">
                    {compact.format(stars)}
                  </span>
                )}
              </a>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
};
