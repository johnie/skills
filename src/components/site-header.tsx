import { GithubIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment } from "react";

import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { repoStars } from "@/lib/github";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** A page below the site root, shown after `/ skills` in the header. The last one is the current page. */
export interface Crumb {
  label: string;
  href: string;
}

const linkClass =
  "text-muted-foreground hover:text-foreground flex items-center gap-1.5 no-underline transition-colors";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export const SiteHeader = async ({ crumbs = [] }: { crumbs?: Crumb[] }) => {
  const stars = await repoStars();

  return (
    <header className="border-b">
      <Container className="flex h-14 items-center justify-between gap-6">
        <nav aria-label="Breadcrumb" className="min-w-0 font-mono text-sm">
          <ol className="flex items-center gap-2.5 whitespace-nowrap">
            <li className="shrink-0">
              <a
                href="/"
                className="group flex items-center gap-2.5 no-underline"
              >
                <Logo className="h-5 w-auto" />
                <span className="sr-only">{site.owner}</span>
                <span
                  className={cn(
                    "text-muted-foreground",
                    crumbs.length > 0 && "max-sm:hidden"
                  )}
                  aria-hidden="true"
                >
                  /
                </span>
                <span
                  className={cn(
                    crumbs.length > 0 &&
                      "text-muted-foreground group-hover:text-foreground transition-colors max-sm:sr-only"
                  )}
                >
                  skills
                </span>
              </a>
            </li>
            {crumbs.map((crumb, index) => {
              const current = index === crumbs.length - 1;
              // Narrow screens keep the logo and the current page.
              const collapse = current ? undefined : "max-sm:hidden";

              return (
                <Fragment key={crumb.href}>
                  <li
                    className={cn("text-muted-foreground", collapse)}
                    aria-hidden="true"
                  >
                    /
                  </li>
                  <li className={cn("min-w-0 truncate", collapse)}>
                    <a
                      href={crumb.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "no-underline transition-colors",
                        current
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {crumb.label}
                    </a>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>
        <nav aria-label="Main" className="shrink-0">
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
