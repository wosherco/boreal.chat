<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    MODELS,
    HIGHLIGHTED_MODELS,
    type ModelId,
    FREE_MODELS,
    MODEL_DETAILS,
  } from "$lib/common/ai/models";
  import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
  import * as Command from "../ui/command";
  import ModelPickerModelEntry from "./ModelPickerModelEntry.svelte";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import { isSubscribed } from "$lib/common/utils/subscription";

  interface Props {
    children: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
    /**
     * @bindable
     */
    selectedModel: ModelId;
    onSelect?: (modelId: ModelId) => void;
  }

  let {
    children,
    selectedModel = $bindable(),
    onSelect,
    open = $bindable(false),
  }: Props = $props();

  const currentUser = useCurrentUser(null);
</script>

<Popover bind:open>
  <PopoverTrigger>
    {@render children()}
  </PopoverTrigger>
  <PopoverContent class="w-80 p-0">
    <Command.Root>
      <Command.Input placeholder="Search model..." />
      <Command.List>
        <Command.Empty>No framework found.</Command.Empty>

        {#if !BILLING_ENABLED || isSubscribed($currentUser.data?.data ?? null)}
          {@const highlightedModels = MODELS.filter((model) =>
            HIGHLIGHTED_MODELS.includes(model as any),
          )}
          {@const experimentalModels = MODELS.filter(
            (model) => !HIGHLIGHTED_MODELS.includes(model as any),
          )}

          <!-- Highlighted Models Group -->
          <Command.Group heading="Recommended">
            {#each highlightedModels as model (model)}
              <Command.Item
                value={model}
                onSelect={() => {
                  selectedModel = model;
                  onSelect?.(model);
                  open = false;
                }}
              >
                <ModelPickerModelEntry {model} />
              </Command.Item>
            {/each}
          </Command.Group>

          <!-- Experimental Models Group -->
          <Command.Group heading="Experimental">
            {#each experimentalModels as model (model)}
              <Command.Item
                value={model}
                onSelect={() => {
                  selectedModel = model;
                  onSelect?.(model);
                  open = false;
                }}
              >
                <ModelPickerModelEntry {model} />
              </Command.Item>
            {/each}
          </Command.Group>
        {:else}
          {@const viewModels = MODELS.filter((model) => !MODEL_DETAILS[model].free)}
          {@const freeModels = viewModels.filter((model) => FREE_MODELS.includes(model as any))}
          {@const lockedModels = viewModels.filter((model) => !FREE_MODELS.includes(model as any))}

          <!-- We just show the free models, and the locked models -->
          <Command.Group heading="Free">
            {#each freeModels as model (model)}
              <Command.Item
                value={model}
                onSelect={() => {
                  selectedModel = model;
                  onSelect?.(model);
                  open = false;
                }}
              >
                <ModelPickerModelEntry {model} />
              </Command.Item>
            {/each}
          </Command.Group>

          <Command.Group heading="Locked">
            {#each lockedModels as model (model)}
              <Command.Item
                value={model}
                onSelect={() => {
                  selectedModel = model;
                  onSelect?.(model);
                  open = false;
                }}
              >
                <ModelPickerModelEntry {model} locked />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
      </Command.List>
    </Command.Root>
  </PopoverContent>
</Popover>
