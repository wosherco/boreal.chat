<script lang="ts">
  import { controlKeyName } from "$lib/utils/platform";
  import type { Snippet } from "svelte";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "./ui/dialog";

  interface Props {
    /**
     * @bindable
     */
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  const shortcuts = [
    {
      keys: [controlKeyName, "K"],
      action: "Search",
      description: "Search for anything in the app.",
    },
    {
      keys: [controlKeyName, "Shift", "O"],
      action: "New chat",
      description: "Start a new conversation.",
    },
    {
      keys: [controlKeyName, "J"],
      action: "Focus input",
      description: "Focus the message input field.",
    },
    {
      keys: [controlKeyName, "M"],
      action: "Open model picker",
      description: "Choose a different model for the conversation.",
    },
    {
      keys: [controlKeyName, "B"],
      action: "Toggle sidebar",
      description: "Show or hide the conversation list.",
    },
    {
      keys: [controlKeyName, "Enter"],
      action: "Submit message",
      description: "Send the message in the input field.",
    },
  ];
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>Shortcuts</DialogTitle>
      <DialogDescription>
        A detailed list of all the shortcuts available in the app.
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-4">
        {#each shortcuts as shortcut}
          <div>
            <div class="font-medium">{shortcut.action}</div>
            <div class="text-muted-foreground text-sm">{shortcut.description}</div>
          </div>
          <div class="flex items-center gap-2 justify-self-end">
            {#each shortcut.keys as key}
              <kbd
                class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none"
              >
                {key}
              </kbd>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </DialogContent>
</Dialog>
