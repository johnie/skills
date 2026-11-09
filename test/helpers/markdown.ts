import type { Nodes, Root } from "mdast";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";

export const parseMarkdown = (content: string): Root =>
  remark().use(remarkFrontmatter, ["yaml"]).parse(content);

export const nodesOf = (node: Nodes): Nodes[] => [
  node,
  ...("children" in node ? node.children.flatMap(nodesOf) : []),
];
