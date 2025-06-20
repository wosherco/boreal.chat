import type { MessageWithOptionalChainRow } from "$lib/common/sharedTypes";
import buildTree from "fast-tree-builder";

export function createMessageTree(messages: MessageWithOptionalChainRow[]) {
  return buildTree(messages, { id: "id", parentId: "parentMessageId" });
}

export type MessageTree = ReturnType<typeof createMessageTree>;
export type MessageTreeNode = MessageTree["roots"][number];

export function findMessageTreePath(
  node: MessageTreeNode | MessageTreeNode[],
  check: (value: MessageWithOptionalChainRow) => boolean,
  path: MessageTreeNode[] = [],
): MessageTreeNode[] | undefined {
  if (Array.isArray(node)) {
    for (const n of node) {
      const result = findMessageTreePath(n, check, [n]);
      if (result) return result;
    }
    return undefined;
  }

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
export function findMaxVersionPath(node: MessageTreeNode | MessageTreeNode[]): MessageTreeNode[] {
  let startNode: MessageTreeNode;

  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [];
    }

    // Pick the node with the highest version as the starting point
    let maxVersionNode = node[0];
    for (let i = 1; i < node.length; i++) {
      if (node[i].value.version > maxVersionNode.value.version) {
        maxVersionNode = node[i];
      }
    }
    startNode = maxVersionNode;
  } else {
    startNode = node;
  }

  const path: MessageTreeNode[] = [startNode];
  let current = startNode;

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

export function appendParentsToFirstNode(
  roots: MessageTreeNode[],
  generatedThreadedChat: MessageTreeNode[],
) {
  if (generatedThreadedChat.length > 0) {
    const firstNode = generatedThreadedChat[0];

    firstNode.parent = {
      value: roots[0].value,
      children: roots,
    };
  }

  return generatedThreadedChat;
}

export function createThreadedChat(
  messages: MessageWithOptionalChainRow[],
  aimAtMessageId?: string,
) {
  const messageTree = createMessageTree(messages);

  let path: MessageTreeNode[] | undefined = undefined;
  let lastNode: MessageTreeNode | undefined = undefined;

  if (aimAtMessageId) {
    path = findMessageTreePath(messageTree.roots, (val) => val.id === aimAtMessageId);

    if (!path) {
      return [];
    }

    lastNode = path[path.length - 1];
  }

  const restThread = findMaxVersionPath(lastNode ?? messageTree.roots);

  return appendParentsToFirstNode(messageTree.roots, [
    ...(path ?? []).slice(1),
    ...restThread.slice(1),
  ]);
}
