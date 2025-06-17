import type { MessageWithOptionalChainRow } from "$lib/common/sharedTypes";
import buildTree from "fast-tree-builder";

export function createMessageTree(messages: MessageWithOptionalChainRow[]) {
  return buildTree(messages, { id: "id", parentId: "parentMessageId" });
}

export type MessageTree = ReturnType<typeof createMessageTree>;
export type MessageTreeNode = MessageTree["roots"][number];

export function findMessageTreePath(
  node: MessageTreeNode,
  check: (value: MessageWithOptionalChainRow) => boolean,
  path: MessageTreeNode[] = [],
): MessageTreeNode[] | undefined {
  path.push(node);

  if (check(node.value)) return [...path];

  if (node.children) {
    for (const child of node.children) {
      const result = findMessageTreePath(child, check, path);
      if (result) return result;
    }
  }

  path.pop(); // backtrack
  return undefined;
}

/**
 * Given a starting node, returns the path from it
 * down to a leaf by always choosing the child with max ordinal.
 */
export function findMaxVersionPath(node: MessageTreeNode): MessageTreeNode[] {
  const path: MessageTreeNode[] = [node];
  let current = node;

  while (current.children && current.children.length > 0) {
    // pick the child with the highest ordinal
    let maxChild = current.children[0];
    for (let i = 1; i < current.children.length; i++) {
      if (current.children[i].value.version > maxChild.value.version) {
        maxChild = current.children[i];
      }
    }
    path.push(maxChild);
    current = maxChild;
  }

  return path;
}
