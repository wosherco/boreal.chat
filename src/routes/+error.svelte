<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeftIcon } from "@lucide/svelte";
</script>

<div class="m-auto flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-center">
  <h1 class="text-4xl font-bold">{page.status}</h1>
  <p class="text-muted-foreground text-lg">{page.error?.message}</p>
  <Button variant="link" href="/">Go back home <ArrowLeftIcon class="h-4 w-4" /></Button>
</div>
