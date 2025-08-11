<script lang="ts">
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import {
    FREE_MODELS,
    HIGHLIGHTED_MODELS,
    MODEL_DETAILS,
    MODELS,
    type ModelId,
  } from "$lib/common/ai/models";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import * as Command from "../../ui/command";
  import ModelPickerModelEntry from "../ModelPickerModelEntry.svelte";

  interface Props {
    /**
     * @bindable
     */
    open?: boolean;
    /**
     * @bindable
     */
    selectedModel: ModelId;
    onSelect?: (modelId: ModelId) => void;
    /**
     * @bindable
     */
    inputRef: HTMLInputElement | null;
    byokEnabled?: boolean;
  }

  let {
    open = $bindable(false),
    selectedModel = $bindable(),
    onSelect,
    inputRef = $bindable(null),
    byokEnabled = false,
  }: Props = $props();

  const currentUser = createCurrentUser(() => null);

  const userHighlighted = $derived(() => {
    const settings = currentUser.data?.data?.modelSettings;
    if (!settings) return new Set(HIGHLIGHTED_MODELS as unknown as ModelId[]);
    // ensure that any newly highlighted models are still shown highlighted even if not in saved allmodels
    const base = new Set(settings.highlight as ModelId[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const m of (HIGHLIGHTED_MODELS as any as ModelId[])) base.add(m);
    return base;
  });
</script>

<Command.Root>
  <Command.Input placeholder="Search model..." bind:ref={inputRef} />
  <Command.List>
    <Command.Empty>No model found.</Command.Empty>

    {#if !BILLING_ENABLED || isSubscribed(currentUser.data?.data ?? null) || byokEnabled}
      {@const viewModels = MODELS.filter((model) => byokEnabled || !MODEL_DETAILS[model].free)}
      {@const highlightedModels = viewModels.filter((model) => userHighlighted.has(model))}
      {@const experimentalModels = viewModels.filter((model) => !userHighlighted.has(model))}

      <!-- Highlighted Models Group -->
      <Command.Group heading="Highlighted">
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
      <Command.Group heading="Others">
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
      {@const freeModels = viewModels.filter((model) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FREE_MODELS.includes(model as any),
      )}
      {@const lockedModels = viewModels.filter(
        (model) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !FREE_MODELS.includes(model as any),
      )}

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
            disabled={true}
            class="opacity-50"
          >
            <ModelPickerModelEntry {model} locked />
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Root>
