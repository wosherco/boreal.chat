<script lang="ts">
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";
  import { Input } from "$lib/components/ui/input";
  import { Switch } from "$lib/components/ui/switch";
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "$lib/components/ui/tooltip";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import type { PageProps } from "./$types";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import { MODELS, MODEL_DETAILS, HIGHLIGHTED_MODELS, type ModelId } from "$lib/common/ai/models";
  import { MODEL_FEATURES } from "$lib/common/ai/modelFeatures";
  import { ICON_MAP } from "$lib/components/icons/iconMap";
  import { Button } from "$lib/components/ui/button";

  const { data }: PageProps = $props();

  const user = createCurrentUser(() => data.auth.currentUserInfo);
  const queryClient = useQueryClient();

  // UI State
  let search = $state("");
  let pending = $state(false);

  type ModelSettings = {
    allmodels: ModelId[];
    highlight: ModelId[];
  };

  const defaultSettings = $derived<ModelSettings>(() => ({
    allmodels: MODELS.slice() as ModelId[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlight: HIGHLIGHTED_MODELS.slice() as any,
  }));

  const effectiveSettings = $derived<ModelSettings>(() => {
    const saved = user.data?.data?.modelSettings as ModelSettings | null | undefined;
    if (!saved) return defaultSettings;
    const known = new Set(MODELS);
    // Merge logic: ensure allmodels tracks current MODELS; highlight keeps saved ones, plus any currently highlighted new models not present before
    const mergedAll = Array.from(new Set([...(saved.allmodels ?? []), ...MODELS])).filter((m) =>
      known.has(m),
    ) as ModelId[];

    const savedHighlight = new Set((saved.highlight ?? []) as ModelId[]);
    // Add newly highlighted models that might have been added since save
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalHighlighted = new Set(HIGHLIGHTED_MODELS as any as ModelId[]);

    const mergedHighlight = Array.from(
      new Set([
        ...savedHighlight,
        ...[...globalHighlighted].filter(
          (m) => !saved.allmodels?.includes(m) || !savedHighlight.has(m),
        ),
      ]),
    ) as ModelId[];

    return { allmodels: mergedAll, highlight: mergedHighlight };
  });

  let localHighlight = $state<Set<ModelId>>(new Set(effectiveSettings.highlight));

  $effect(() => {
    // keep local set in sync if user data changes
    localHighlight = new Set(effectiveSettings.highlight);
  });

  const updateMutation = createMutation(
    orpcQuery.v1.settings.updateModelSettings.mutationOptions({
      onMutate: async () => {
        pending = true;
      },
      onSuccess: async () => {
        toast.success("Model settings saved");
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to save settings");
      },
      onSettled: () => {
        pending = false;
      },
    }),
  );

  function toggleHighlight(model: ModelId) {
    if (localHighlight.has(model)) localHighlight.delete(model);
    else localHighlight.add(model);
  }

  function saveChanges() {
    const payload: ModelSettings = {
      allmodels: MODELS.slice() as ModelId[],
      highlight: Array.from(localHighlight),
    };
    updateMutation.mutate(payload);
  }

  const filteredModels = $derived(() => {
    const q = search.trim().toLowerCase();
    const list = MODELS.filter(
      (m) =>
        MODEL_DETAILS[m]?.displayName?.toLowerCase().includes(q) || m.toLowerCase().includes(q),
    );
    return list as ModelId[];
  });
</script>

<SettingsLayout title="Models" description="Choose which models to highlight in pickers.">
  <div class="flex flex-col gap-4 pt-4">
    <div class="flex items-center gap-2">
      <Input placeholder="Search models..." bind:value={search} class="max-w-sm" />
      <Button disabled={pending} onclick={saveChanges}>
        {#if pending}
          Saving...
        {:else}
          Save
        {/if}
      </Button>
    </div>

    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
      {#each filteredModels as model (model)}
        {@const details = MODEL_DETAILS[model]}
        {@const Icon = ICON_MAP[model]}
        <div class="flex items-center justify-between rounded-md border p-3">
          <div class="flex min-w-0 items-center gap-3">
            <Icon class="size-5 flex-shrink-0" />
            <div class="min-w-0">
              <div class="truncate text-sm font-medium">{details.displayName}</div>
              <div class="text-muted-foreground truncate text-xs">{model}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger class="text-xs underline-offset-2 hover:underline"
                  >Pricing</TooltipTrigger
                >
                <TooltipContent>
                  {@const pricing = MODEL_FEATURES[model]?.pricing}
                  {#if pricing}
                    <div class="text-xs">
                      <div>Prompt: ${"{"}{pricing.prompt}}/token</div>
                      <div>Completion: ${"{"}{pricing.completion}}/token</div>
                      {#if pricing.image}<div>Image: {pricing.image}</div>{/if}
                      {#if pricing.web_search}<div>Web: {pricing.web_search}</div>{/if}
                      {#if pricing.request}<div>Request: {pricing.request}</div>{/if}
                    </div>
                  {:else}
                    <div class="text-xs">No pricing info</div>
                  {/if}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div class="flex items-center gap-2">
              <span class="text-xs">Highlight</span>
              <Switch checked={localHighlight.has(model)} onchange={() => toggleHighlight(model)} />
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if BILLING_ENABLED}
      <div class="text-muted-foreground text-xs">Pricing is informative for BYOK users.</div>
    {/if}
  </div>
</SettingsLayout>
