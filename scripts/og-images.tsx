/**
 * Renders the social card for the site and for every skill into `public/`, where `rshono build` picks it up with
 * the rest of the static files. Run after `content-collections build`: the skill list comes from its output.
 *
 * Build time rather than per request: the skills are known when the site is built, so the cards are static
 * assets with no render CPU (a render takes tens of ms, over the Workers Free plan's 10 ms) and nothing to cache.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { Logo } from "../src/components/logo";
import { installCommand, ogImageHref, site } from "../src/lib/site";
import { skillPaths } from "../src/lib/skills";

const WIDTH = 1200;
const HEIGHT = 630;
const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public");

const require = createRequire(import.meta.url);

/** Satori reads TTF, OTF and WOFF, not WOFF2, so these are the static `@fontsource` cuts rather than the variable ones the site uses. */
const fonts = [
  {
    data: await readFile(
      require.resolve("@fontsource/geist/files/geist-latin-400-normal.woff")
    ),
    name: "Geist",
    style: "normal",
    weight: 400,
  },
  {
    data: await readFile(
      require.resolve("@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff")
    ),
    name: "Geist Mono",
    style: "normal",
    weight: 400,
  },
] as const;

const Card = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div
    style={{
      backgroundColor: "#000",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Geist",
      height: "100%",
      padding: 64,
      width: "100%",
    }}
  >
    <div style={{ alignItems: "center", display: "flex", gap: 32 }}>
      <Logo width={60} height={60} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "Geist Mono",
          fontSize: 22,
          letterSpacing: 1,
          lineHeight: 1.3,
          textTransform: "uppercase",
        }}
      >
        <span>Skills</span>
        <span style={{ color: "#8f8f8f" }}>
          The agent skills I use every day
        </span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", marginTop: 140 }}>
      <span style={{ fontSize: 72, letterSpacing: -2, lineHeight: 1.1 }}>
        {title}
      </span>
      <span
        style={{
          color: "#666",
          fontFamily: "Geist Mono",
          fontSize: 40,
          marginTop: 20,
        }}
      >
        {subtitle}
      </span>
    </div>
  </div>
);

const render = async (href: string, card: Parameters<typeof Card>[0]) => {
  const svg = await satori(<Card {...card} />, {
    fonts: [...fonts],
    height: HEIGHT,
    width: WIDTH,
  });

  const file = path.join(PUBLIC_DIR, href);

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, new Resvg(svg).render().asPng());
};

// The previous build's cards, so a removed skill doesn't leave one behind.
await rm(path.join(PUBLIC_DIR, path.dirname(ogImageHref("_"))), {
  force: true,
  recursive: true,
});

const cards = [
  render(ogImageHref(), {
    subtitle: installCommand,
    title: "My agent skills.",
  }),
  ...skillPaths().map(({ name }) =>
    render(ogImageHref(name), { subtitle: site.repo, title: name })
  ),
];

await Promise.all(cards);

console.log(`og-images: wrote ${cards.length} cards to public/`);
