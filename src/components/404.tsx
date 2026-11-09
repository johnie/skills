import type { PageProps } from "@rshono/core";

import { Container } from "@/components/container";

import { Layout } from "./layout";

export default function NotFound({ url }: PageProps) {
  return (
    <Layout title="Not found">
      <Container className="space-y-4 py-24">
        <h1 className="font-heading text-6xl tracking-tight">404</h1>
        <p className="text-muted-foreground">
          Nothing at <code>{url.pathname}</code>.
        </p>
        <p>
          <a href="/">Back home</a>
        </p>
      </Container>
    </Layout>
  );
}
