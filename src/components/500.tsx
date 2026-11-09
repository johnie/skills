import type { ErrorPageProps } from "@rshono/core";

import { Container } from "@/components/container";

import { Layout } from "./layout";

export default function ServerError({ error }: ErrorPageProps) {
  return (
    <Layout title="Something went wrong">
      <Container className="space-y-4 py-24">
        <h1 className="font-heading text-6xl tracking-tight">500</h1>
        <p className="text-muted-foreground">{error.message}</p>
        {error.stack && <pre>{error.stack}</pre>}
        <p>
          <a href="/">Back home</a>
        </p>
      </Container>
    </Layout>
  );
}
