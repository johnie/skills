import { Container } from "@/components/container";
import { site } from "@/lib/site";

const links = [
  { href: site.githubUrl, label: "GitHub" },
  { href: site.homepageUrl, label: site.homepageLabel },
];

export const SiteFooter = () => (
  <footer className="border-t">
    <Container className="text-muted-foreground flex items-center justify-between gap-6 py-8 font-mono text-xs">
      <p>{site.author}</p>
      <ul className="flex items-center gap-4">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-muted-foreground hover:text-foreground no-underline transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </Container>
  </footer>
);
