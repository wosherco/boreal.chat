<script lang="ts">
  import { getAstNode } from "svelte-exmarkdown";
  import {
    getCodeBlockProps,
    getHighlighterSync,
    highlighterPromise,
    type Highlighter,
  } from "$lib/utils/codeblock.svelte";

  import { bundledLanguages } from "shiki/langs";
  import { Button } from "../ui/button";
  import { CopyIcon, DownloadIcon, TextIcon, WrapTextIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import { onMount, getContext } from "svelte";
  import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

  const reasoning = getContext<boolean>("reasoning");

  const astContext = getAstNode();

  let isWrapped = $state(false);
  const codeProps = $derived(getCodeBlockProps(astContext.current));
  let renderedCode = $state<string | undefined>(undefined);

  onMount(() => void highlighterPromise);

  let i = 0;

  $effect(() => {
    if (!codeProps) {
      return;
    }

    const loadNewLang = (h: Highlighter) => {
      if (codeProps.lang in bundledLanguages) {
        return h.loadLanguage(bundledLanguages[codeProps.lang as keyof typeof bundledLanguages]);
      }
    };

    i++;
    const currentI = i;

    void new Promise(async (resolve) => {
      let highlighter = getHighlighterSync();
      if (highlighter) {
        await loadNewLang(highlighter);
      } else {
        let highlighter = await highlighterPromise;
        await loadNewLang(highlighter);
      }

      if (currentI === i) {
        const currentRenderedCode = highlighter?.codeToHtml(codeProps.code, {
          lang: codeProps.lang,
          theme: "one-dark-pro",
        });

        renderedCode = currentRenderedCode;
      }

      resolve(true);
    });
  });

  // Stuff about the component down below

  function copyToClipboard() {
    navigator.clipboard.writeText(codeProps?.code ?? "");
  }

  function downloadFile() {
    const blob = new Blob([codeProps?.code ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = codeProps?.filename ?? `snippet.${codeProps?.lang}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleWrap() {
    isWrapped = !isWrapped;
  }
</script>

{#if !codeProps}
  <Alert variant="destructive">
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription>We couldn't render this code block. Please try again later.</AlertDescription>
  </Alert>
{/if}

<div
  class={cn(
    "not-prose relative flex h-fit w-full flex-col overflow-hidden rounded-lg border text-sm [&_pre]:overflow-auto [&_pre]:px-[1em] [&_pre]:py-[1em]",
    isWrapped && "[&_pre]:break-words [&_pre]:![white-space:pre-wrap]",
  )}
>
  {#if !reasoning}
    <div class="bg-input flex h-full flex-row items-center justify-between border-b px-4">
      <p class="">{codeProps?.filename ?? codeProps?.lang}</p>

      <div class="sticky top-4">
        <Button variant="ghost" size="icon" onclick={copyToClipboard}>
          <CopyIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onclick={toggleWrap}
          class={cn(isWrapped && "bg-accent")}
        >
          {#if isWrapped}
            <TextIcon />
          {:else}
            <WrapTextIcon />
          {/if}
        </Button>
        <Button variant="ghost" size="icon" onclick={downloadFile}>
          <DownloadIcon />
        </Button>
      </div>
    </div>
  {/if}

  {#if renderedCode}
    {@html renderedCode}
  {:else}
    <pre class="bg-muted p-2" style="background-color:#282c34;color:#abb2bf">{codeProps?.code}</pre>
  {/if}
</div>
