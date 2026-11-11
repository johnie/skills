import type { ErrorPageProps } from "@rshono/core";

import { Container } from "@/components/container";

import { Layout } from "./layout";

export default function ServerError({ error }: ErrorPageProps) {
  return (
    <Layout title="Server error">
      <Container className="space-y-4 py-24">
        <h1 className="font-heading text-6xl tracking-tight">500</h1>
        <p>Unable to load this page. Try again in a moment.</p>
        {error.stack && (
          // Dev only: in a build rshono redacts the message and drops the stack, so neither reaches visitors.
          <>
            <p className="text-muted-foreground">{error.message}</p>
            <pre>{error.stack}</pre>
          </>
        )}
        <p>
          <a href="/#skills">Browse skills</a>
        </p>
      </Container>
    </Layout>
  );
}
