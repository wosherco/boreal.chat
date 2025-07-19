<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import PremiumBadge from "$lib/components/ui/premium-badge/PremiumBadge.svelte";
  import PremiumWrapper from "$lib/components/ui/premium-badge/PremiumWrapper.svelte";

  const { Story } = defineMeta({
    title: "UI/Premium Badge",
    component: PremiumBadge,
    argTypes: {
      variant: {
        control: "select",
        options: ["icon-only", "with-text"],
        description: "Controls the badge display style",
      },
      color: {
        control: "select",
        options: ["gradient"],
        description: "Badge color theme",
      },
    },
  });
</script>

<Story
  name="Icon Only"
  tags={["autodocs"]}
  args={{
    variant: "icon-only",
    color: "gradient",
  }}
>
  {#snippet template(args)}
    <div class="p-8">
      <PremiumBadge {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="With Text"
  tags={["autodocs"]}
  args={{
    variant: "with-text",
    color: "gradient",
  }}
>
  {#snippet template(args)}
    <div class="p-8">
      <PremiumBadge {...args} />
    </div>
  {/snippet}
</Story>

<!-- Premium Wrapper Stories -->
<Story
  name="Premium Wrapper"
  tags={["autodocs"]}
  args={{
    variant: "icon-only",
    color: "gradient",
  }}
>
  {#snippet template(args)}
    <div class="flex gap-4 p-8">
      <PremiumWrapper {...args}>
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">Basic</div>
      </PremiumWrapper>

      <PremiumWrapper showBadge variant="with-text">
        <div class="flex h-12 w-24 items-center justify-center rounded-lg bg-gray-100">
          With Text
        </div>
      </PremiumWrapper>

      <PremiumWrapper showBadge={false}>
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
          No Badge
        </div>
      </PremiumWrapper>
    </div>
  {/snippet}
</Story>

<!-- Example Usage in Context -->
<Story name="Usage Examples" tags={["autodocs"]}>
  {#snippet template()}
    <div class="flex flex-col gap-8 p-8">
      <!-- Button Example -->
      <div class="flex gap-4">
        <PremiumWrapper showBadge>
          <button class="rounded-lg bg-blue-500 px-4 py-2 text-white"> Premium Feature </button>
        </PremiumWrapper>

        <PremiumWrapper showBadge variant="with-text">
          <button class="rounded-lg bg-blue-500 px-4 py-2 text-white"> Unlimited Access </button>
        </PremiumWrapper>
      </div>

      <!-- Card Example -->
      <div class="flex gap-4">
        <PremiumWrapper showBadge>
          <div class="rounded-lg bg-white p-4 shadow">
            <h3 class="font-semibold">Premium Card</h3>
            <p class="text-sm text-gray-600">With icon-only badge</p>
          </div>
        </PremiumWrapper>

        <PremiumWrapper showBadge variant="with-text">
          <div class="rounded-lg bg-white p-4 shadow">
            <h3 class="font-semibold">Premium Card</h3>
            <p class="text-sm text-gray-600">With text badge</p>
          </div>
        </PremiumWrapper>
      </div>
    </div>
  {/snippet}
</Story>
