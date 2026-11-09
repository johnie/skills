/**
 * Monochrome marks for the agents `npx skills` installs into, filled with `currentColor`.
 * Claude Code, OpenCode and Pi come from Simple Icons (CC0, each traced from the vendor's own asset), Codex from
 * LobeHub Icons (MIT), and Oh My Pi is the glyph from https://omp.sh/favicon.svg without its tile.
 *
 * The marks are drawn on different canvases with different padding, so each `viewBox` is a square centred on the
 * mark's bounding box, sized so every mark covers the same geometric-mean extent (√(width × height)) at the largest
 * ratio that still fits the widest one, Claude Code. Codex is round and reads small at equal extent, so its box is
 * 8% tighter. Re-derive the box when swapping a path.
 */
const agents = [
  {
    href: "https://claude.com/product/claude-code",
    name: "Claude Code",
    path: "M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z",
    viewBox: "0 0 24 24",
  },
  {
    href: "https://openai.com/codex/",
    name: "Codex",
    path: "M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z",
    viewBox: "-1.97 -1.97 27.93 27.93",
  },
  {
    href: "https://opencode.ai",
    name: "OpenCode",
    path: "M22 24H2V0h20zM17 4.8H7v14.4h10z",
    viewBox: "-1.86 -1.86 27.71 27.71",
  },
  {
    href: "https://omp.sh",
    name: "Oh My Pi",
    path: "M14 16h36v8H40v32h-8V24h-6v22h-8V24h-4z",
    viewBox: "8 12 48 48",
  },
  {
    href: "https://pi.dev",
    name: "Pi",
    path: "M0 0v24h6v-6h6v-6H6V6h6v6h6V0Zm18 12v12h6V12Z",
    viewBox: "-3.18 -3.18 30.36 30.36",
  },
] as const;

export const AgentLogos = () => (
  <ul className="flex items-center gap-5">
    {agents.map((agent) => (
      <li key={agent.name}>
        <a
          href={agent.href}
          aria-label={agent.name}
          title={agent.name}
          className="text-muted-foreground/70 hover:text-muted-foreground flex no-underline outline-offset-4 transition-colors"
        >
          <svg
            aria-hidden
            viewBox={agent.viewBox}
            fill="currentColor"
            className="size-5"
          >
            <path fillRule="evenodd" clipRule="evenodd" d={agent.path} />
          </svg>
        </a>
      </li>
    ))}
  </ul>
);
