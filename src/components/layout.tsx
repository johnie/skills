import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "../styles.css";

export const appName = process.env.PUBLIC_APP_NAME ?? "johnie / skills";

export const Layout = ({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
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
