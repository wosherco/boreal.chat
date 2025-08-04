<script lang="ts">
  import type { Snippet } from "svelte";
  import SvelteSeo from "svelte-seo";

  interface Props {
    title: string;
    description: string;
    children: Snippet;
  }

  let { title, description, children }: Props = $props();
</script>

<SvelteSeo title={`${title} | boreal.chat`} {description} />

<h1 class="text-2xl font-semibold">{title}</h1>
<h2 class="text-muted-foreground">{description}</h2>

{@render children()}
