<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import {
    ArchiveIcon,
    ArrowLeftIcon,
    BotIcon,
    CreditCardIcon,
    ExternalLinkIcon,
    KeyIcon,
    LockIcon,
    MailIcon,
    PaintbrushIcon,
    TrashIcon,
    UserIcon,
  } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import type { Component } from "svelte";
  import Tabs from "$lib/components/ui/tabs/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs/tabs-trigger.svelte";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import Avatar from "$lib/components/ui/avatar/avatar.svelte";
  import AvatarImage from "$lib/components/ui/avatar/avatar-image.svelte";
  import AvatarFallback from "$lib/components/ui/avatar/avatar-fallback.svelte";
  import EmailVerificationAlert from "$lib/components/alerts/EmailVerificationAlert.svelte";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import Badge from "$lib/components/ui/badge/badge.svelte";
  import PremiumBadge from "$lib/components/ui/premium-badge/PremiumBadge.svelte";

  interface Route {
    label: string;
    href: string;
    icon: Component | null;
  }

  const { children, data }: LayoutProps = $props();

  const ROUTES: Route[] = [
    {
      label: "Account",
      href: "/settings/account",
      icon: UserIcon,
    },
    {
      label: "Authentication",
      href: "/settings/authentication",
      icon: LockIcon,
    },
    {
      label: "Customization",
      href: "/settings/customization",
      icon: PaintbrushIcon,
    },
    {
      label: "Models",
      href: "/settings/models",
      icon: BotIcon,
    },
    BILLING_ENABLED && {
      label: "Billing",
      href: "/settings/billing",
      icon: CreditCardIcon,
    },
    {
      label: "Keys",
      href: "/settings/byok",
      icon: KeyIcon,
    },
    {
      label: "Contact Us",
      href: "/settings/contact",
      icon: MailIcon,
    },
  ].filter(Boolean) as Route[];

  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);
</script>

<div
  class="min-h-pwa mx-auto h-full w-full max-w-[min(100vw,var(--breakpoint-lg))] overflow-x-hidden px-4"
  style="view-transition-name: settings-wrapper"
>
  <Button variant="ghost" href="/" class="mt-2">
    <ArrowLeftIcon class="size-4" />
    Go Back
  </Button>
  <div class="flex w-full flex-row gap-8 py-2">
    <div class="hidden h-full w-52 flex-col items-center justify-start gap-2 lg:flex">
      <Avatar class="aspect-square size-52 text-4xl">
        <AvatarImage src={currentUser.data?.data?.profilePicture} alt="Profile Picture" />
        <AvatarFallback>
          {currentUser.data?.data?.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <p class="text-center text-lg font-semibold text-wrap">{currentUser.data?.data?.name}</p>
      {#if BILLING_ENABLED}
        {#if isSubscribed(currentUser.data?.data ?? null)}
          <PremiumBadge variant="with-text" />
        {:else}
          <a href="/settings/billing">
            <Badge class="w-fit">Free</Badge>
          </a>
        {/if}
      {/if}

      {#if BILLING_ENABLED}
        <div class="bg-card mt-4 flex flex-col gap-2 rounded-lg p-3">
          <p class="text-sm font-semibold">Power Usage</p>
          <p class="text-muted-foreground text-xs">
            In the future you'll be able to see your power usage here, and the remaining power you
            have left.
          </p>
        </div>
      {/if}

      <hr class="my-2" />

      <Button variant="ghost" class="w-full justify-start" href="/archived">
        <ArchiveIcon class="size-4" />
        Archived Chats
        <ExternalLinkIcon class="ml-auto size-4" />
      </Button>
      <Button variant="ghost" class="w-full justify-start" href="/deleted">
        <TrashIcon class="size-4" />
        Deleted Chats
        <ExternalLinkIcon class="ml-auto size-4" />
      </Button>
    </div>
    <div class="flex w-full flex-1 flex-col gap-4">
      {#if currentUser.data?.authenticated && !currentUser.data?.data?.emailVerified}
        <EmailVerificationAlert />
      {/if}
      <nav>
        <Tabs value={page.url.pathname} class="max-w-full pb-2">
          <div class="overflow-x-auto rounded-lg">
            <TabsList class="w-fit">
              {#each ROUTES as route (route.href)}
                <a href={route.href}>
                  <TabsTrigger value={route.href}>
                    <route.icon class="size-4" />
                    {route.label}
                  </TabsTrigger>
                </a>
              {/each}
            </TabsList>
          </div>
        </Tabs>
      </nav>
      <div>
        {@render children()}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes zoom-in-with-blur {
    from {
      transform: scale(0.9);
      filter: blur(4px);
      opacity: 0;
    }
    to {
      transform: scale(1);
      filter: blur(0px);
      opacity: 1;
    }
  }

  @keyframes zoom-out-with-blur {
    from {
      transform: scale(1);
      filter: blur(0px);
      opacity: 1;
    }
    to {
      transform: scale(0.9);
      filter: blur(8px);
      opacity: 0;
    }
  }

  :global(::view-transition-new(settings-wrapper)) {
    animation: 150ms cubic-bezier(0, 0, 0.58, 1) 150ms both zoom-in-with-blur;
  }

  :global(::view-transition-old(settings-wrapper)) {
    animation: 150ms cubic-bezier(0.42, 0, 1, 1) both zoom-out-with-blur;
  }
</style>
