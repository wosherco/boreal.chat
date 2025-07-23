<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Check, Zap } from "@lucide/svelte";
  import { goto } from "$app/navigation";

  interface Props {
    title: string;
    description: string;
    price: string;
    priceSubtext: string;
    features: string[];
    buttonText: string;
    buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost";
    buttonAction: () => void;
    isPopular: boolean;
    isPrimary: boolean;
    customBadgeText?: string | null;
    customBadgeIcon?: any;
    isButtonDisabled?: boolean;
  }

  const {
    title,
    description,
    price,
    priceSubtext,
    features,
    buttonText,
    buttonVariant,
    buttonAction,
    isPopular,
    isPrimary,
    customBadgeText,
    customBadgeIcon,
    isButtonDisabled,
  }: Props = $props();
</script>

<Card
  class={`relative h-full ${isPrimary ? "border-primary from-primary/5 via-primary/10 to-primary/5 border-2 bg-gradient-to-br" : ""}`}
>
  {#if customBadgeText}
    <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
      <Badge class="bg-primary text-primary-foreground">
        {#if customBadgeIcon}
          <svelte:component this={customBadgeIcon} class="mr-1 h-3 w-3" />
        {/if}
        {customBadgeText}
      </Badge>
    </div>
  {:else if isPopular}
    <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
      <Badge class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <Zap class="mr-1 h-3 w-3" />
        Most Popular
      </Badge>
    </div>
  {/if}

  <CardHeader>
    <CardTitle
      class={`text-2xl ${isPrimary ? "from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-transparent" : "text-gray-600 dark:text-gray-400"}`}
    >
      {title}
    </CardTitle>
    <CardDescription>{description}</CardDescription>
    <div class="text-3xl font-bold">
      {price}<span class="text-muted-foreground text-base font-normal">{priceSubtext}</span>
    </div>
  </CardHeader>

  <CardContent class="flex-1 space-y-4">
    <ul class="space-y-3">
      {#each features as feature}
        <li class="flex items-center gap-3">
          {#if isPrimary}
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
          {:else}
            <Check class="h-5 w-5 text-green-500" />
          {/if}
          <span>{@html feature}</span>
        </li>
      {/each}
    </ul>
  </CardContent>

  <CardFooter class="mt-auto">
    {#if isPrimary}
      <Button
        class="from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary w-full bg-gradient-to-r shadow-lg"
        size="lg"
        onclick={buttonAction}
        disabled={isButtonDisabled}
      >
        <Zap class="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    {:else}
      <Button
        variant={buttonVariant}
        class="w-full"
        size="lg"
        onclick={buttonAction}
        disabled={isButtonDisabled}
      >
        {buttonText}
      </Button>
    {/if}
  </CardFooter>
</Card>
