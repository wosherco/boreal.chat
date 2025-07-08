<script lang="ts">
  import { controlKeyName } from "$lib/utils/platform";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
  import * as m from "$lib/paraglide/messages";

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
      description: m.shortcuts_searchDescription(),
    },
    {
      keys: [controlKeyName, "Shift", "O"],
      action: m.shortcuts_newChat(),
      description: m.shortcuts_newChatDescription(),
    },
    {
      keys: [controlKeyName, "J"],
      action: m.shortcuts_focusInput(),
      description: m.shortcuts_focusInputDescription(),
    },
    {
      keys: [controlKeyName, "M"],
      action: m.shortcuts_openModelPicker(),
      description: m.shortcuts_openModelPickerDescription(),
    },
    {
      keys: [controlKeyName, "B"],
      action: m.shortcuts_toggleSidebar(),
      description: m.shortcuts_toggleSidebarDescription(),
    },
    {
      keys: [controlKeyName, "Enter"],
      action: m.shortcuts_submitMessage(),
      description: m.shortcuts_submitMessageDescription(),
    },
  ];
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{m.shortcuts_title()}</DialogTitle>
      <DialogDescription>
        {m.shortcuts_description()}
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
