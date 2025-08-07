<script lang="ts">
  import type { Component } from "svelte";

  interface Props {
    title: string;
    description: string;
    icon: Component;
    href: string;
  }

  let { title, description, icon: Icon, href }: Props = $props();
</script>

<a
  {href}
  target={!href.startsWith("/") ? "_blank" : undefined}
  rel={href.startsWith("/") ? "noopener noreferrer" : undefined}
  class="hover:bg-accent hover:text-accent-foreground flex max-w-[500px] flex-row items-center gap-4 rounded-lg border p-4 transition-colors"
>
  <Icon class="size-6 shrink-0" />
  <div class="flex flex-col gap-1">
    <p class="font-semibold">{title}</p>
    <p class="text-muted-foreground text-sm">{description}</p>
  </div>
</a>
