<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    class?: string;
    email?: string;
  }

  const { class: className, email }: Props = $props();
</script>

<div class={cn("mt-4 w-full text-center", className)}>
  <p class="text-muted-foreground text-sm">
    Don't have an account? <a
      href={`/auth/signup?email=${encodeURIComponent(email ?? "")}`}
      class="underline">Sign up</a
    >
  </p>
</div>
