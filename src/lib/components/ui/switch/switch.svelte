<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cn } from '$lib/utils';

  export let checked = false;
  export let disabled = false;
  export let id: string | undefined = undefined;

  const dispatch = createEventDispatcher<{ change: boolean }>();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    dispatch('change', checked);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  {disabled}
  {id}
  on:click={toggle}
  on:keydown={handleKeydown}
  class={cn(
    "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
    checked 
      ? "bg-primary" 
      : "bg-input",
    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
  )}
  data-state={checked ? 'checked' : 'unchecked'}
>
  <div
    class={cn(
      "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
      checked ? "translate-x-5" : "translate-x-0"
    )}
  />
</button>