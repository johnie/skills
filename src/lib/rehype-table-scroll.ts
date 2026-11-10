import type { Element, Root, RootContent } from "hast";

const wrap = (node: Root | Element) => {
  node.children = node.children.map((child): RootContent => {
    if (child.type !== "element") {
      return child;
    }

    if (child.tagName === "table") {
      return {
        children: [child],
        properties: { className: ["table-scroll"] },
        tagName: "div",
        type: "element",
      };
    }

    wrap(child);

    return child;
  });
};

/**
 * Rehype plugin wrapping every `<table>` in `<div class="table-scroll">`, so a table wider than the column scrolls
 * inside it instead of widening the page. The wrapper scrolls rather than the table: `display: block` on a table
 * drops its table semantics in some screen readers.
 */
export const rehypeTableScroll = () => (tree: Root) => {
  wrap(tree);
};
