import { createHighlighterCore } from "shiki/core";
import type { HastNode } from "svelte-exmarkdown";
import oneDarkPro from "shiki/themes/one-dark-pro.mjs";
import oneLight from "shiki/themes/one-light.mjs";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

export interface CodeBlockProps {
  code: string;
  lang: string;
  filename: string | null;
}

export function getCodeBlockProps(node: HastNode): CodeBlockProps | undefined {
  // Find the <code> child
  const codeEl = node.children?.find((n) => n.type === "element" && n.tagName === "code");

  if (!codeEl) {
    console.error("No <code> element found inside <pre>");
    return undefined;
  }

  // 1) Extract and concatenate all text nodes
  const code = codeEl.children
    ?.filter((n) => n.type === "text")
    .map((n) => n.value)
    .join("");

  // 2) Derive lang by stripping the "language-" prefix
  const lang = (codeEl.properties?.class as string | undefined)?.replace(/^language-/, "") ?? "";

  // 3) Read filename from data.meta (if present)
  const filename = (codeEl.data as { meta?: string } | undefined)?.meta ?? null;

  return { code: code ?? "", lang: lang.toLowerCase(), filename };
}

let highlighter = $state<Highlighter | null>(null);
export const getHighlighterSync = () => highlighter;

async function initializeHighlighter(): ReturnType<typeof createHighlighterCore> {
  if (highlighter) return highlighter;

  const createdHighlighter = await createHighlighterCore({
    themes: [oneDarkPro, oneLight],
    langs: [], // start with zero langs
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });

  highlighter = createdHighlighter;

  return createdHighlighter;
}

export const highlighterPromise = initializeHighlighter();
void highlighterPromise;
export type Highlighter = Awaited<typeof highlighterPromise>;
