import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ogImageHref, site } from "@/lib/site";

import "../styles.css";

const appName = "johnie / skills";

/** `image` is a root-relative `ogImageHref`; the site's own card unless a page has one. */
export const Layout = ({
  title,
  description,
  image = ogImageHref(),
  children,
}: {
  title?: string;
  description?: string;
  image?: string;
  children: ReactNode;
}) => {
  const heading = title ? `${title} · ${appName}` : appName;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{heading}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={appName} />
        <meta property="og:title" content={heading} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        <meta property="og:image" content={`${site.url}${image}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
      </head>
      <body className="flex min-h-svh flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
};
