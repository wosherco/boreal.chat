<script lang="ts">
  import { controlKeyName } from "$lib/utils/platform";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
  import { m } from '$lib/paraglide/messages.js';

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
      action: m.shortcuts_search(),
      description: m.shortcuts_searchdescription(),
    },
    {
      keys: [controlKeyName, "Shift", "O"],
      action: m.shortcuts_newchat(),
      description: m.shortcuts_newchatdescription(),
    },
    {
      keys: [controlKeyName, "J"],
      action: m.shortcuts_focusinput(),
      description: m.shortcuts_focusinputdescription(),
    },
    {
      keys: [controlKeyName, "M"],
      action: m.shortcuts_openmodelpicker(),
      description: m.shortcuts_openmodelpickerdescription(),
    },
    {
      keys: [controlKeyName, "B"],
      action: m.shortcuts_togglesidebar(),
      description: m.shortcuts_togglesidebardescription(),
    },
    {
      keys: [controlKeyName, "Enter"],
      action: m.shortcuts_submitmessage(),
      description: m.shortcuts_submitmessagedescription(),
    },
  ];
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{m.shortcuts_shortcuts()}</DialogTitle>
      <DialogDescription>
        {m.shortcuts_detailedlist()}
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-4">
        {#each shortcuts as shortcut (shortcut.action)}
          <div>
            <div class="font-medium">{shortcut.action}</div>
            <div class="text-muted-foreground text-sm">{shortcut.description}</div>
          </div>
          <div class="flex items-center gap-2 justify-self-end">
            {#each shortcut.keys as key (key)}
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
