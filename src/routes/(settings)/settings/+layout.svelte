<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { Sheet, SheetContent, SheetTrigger } from "$lib/components/ui/sheet";
  import {
    ArrowLeftIcon,
    CreditCardIcon,
    HomeIcon,
    KeyIcon,
    LockIcon,
    MailIcon,
    MenuIcon,
    PaintbrushIcon,
  } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";
  import SheetClose from "$lib/components/ui/sheet/sheet-close.svelte";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import type { Component } from "svelte";

  interface Route {
    label: string;
    href: string;
    icon: Component | null;
  }

  const { children }: LayoutProps = $props();

  const DIVIDER = {
    label: "---",
    href: "DIVIDER",
    icon: null,
  };

  const ROUTES: Route[] = [
    {
      label: "Home",
      href: "/",
      icon: ArrowLeftIcon,
    },
    DIVIDER,
    {
      label: "Overview",
      href: "/settings",
      icon: HomeIcon,
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
    BILLING_ENABLED && {
      label: "Billing",
      href: "/settings/billing",
      icon: CreditCardIcon,
    },
    {
      label: "BYOK (Bring Your Own Key)",
      href: "/settings/byok",
      icon: KeyIcon,
    },
    {
      label: "Contact Us",
      href: "/settings/contact",
      icon: MailIcon,
    },
  ].filter(Boolean) as Route[];
</script>

{#snippet NavLinks()}
  <nav class="flex h-full flex-col gap-1 px-2 py-4">
    {#each ROUTES as route (route.href)}
      {#if route === DIVIDER}
        <hr class="my-2" />
      {:else}
        <SheetClose class="w-full justify-start text-start">
          <Button
            variant={page.url.pathname === route.href ? "secondary" : "ghost"}
            href={route.href}
            class="w-full justify-start"
          >
            <route.icon class="mr-2 size-4" />
            {route.label}
          </Button>
        </SheetClose>
      {/if}
    {/each}
  </nav>
{/snippet}

<div class="min-h-pwa h-full w-full p-4 md:pt-16" style="view-transition-name: settings-wrapper">
  <div class="flex h-full min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-4rem)]">
    <Sheet>
      <aside
        class="bg-background hidden h-full min-h-full w-64 border-r md:flex md:flex-col lg:w-72 2xl:w-80"
      >
        {@render NavLinks()}
      </aside>
      <main class="flex-1 overflow-auto">
        <div class="md:hidden">
          <SheetTrigger>
            <Button variant="outline" class="mb-4">
              <MenuIcon class="mr-2 size-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="p-4">
            {@render NavLinks()}
          </SheetContent>
        </div>
        <div class="h-full p-6">
          {@render children()}
        </div>
      </main>
    </Sheet>
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
