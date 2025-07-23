<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { goto } from "$app/navigation";
  import type { LayoutProps } from "./$types";

  const { children }: LayoutProps = $props();

  const navItems = [
    { href: "/consumer", label: "Home", icon: "🏠" },
    { href: "/pricing", label: "Pricing", icon: "💰" },
    { href: "/business", label: "Business", icon: "🏢" },
  ];

  const currentPath = $derived(page.url.pathname);
</script>

<div
  class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
>
  <!-- Navigation Header -->
  <header
    class="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80"
  >
    <div class="container mx-auto px-4">
      <nav class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold">🌌</span>
          <span class="text-xl font-bold text-slate-900 dark:text-slate-50">boreal.chat</span>
        </div>

        <!-- Navigation Links -->
        <div class="hidden items-center gap-1 md:flex">
          {#each navItems as item (item.href)}
            <Button
              variant={currentPath === item.href ? "default" : "ghost"}
              class="gap-2"
              onclick={() => goto(item.href)}
            >
              <span>{item.icon}</span>
              {item.label}
            </Button>
          {/each}
        </div>

        <!-- CTA Buttons -->
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" onclick={() => goto("/auth")}>Sign In</Button>
          <Button size="sm" onclick={() => goto("/")}>Try Now</Button>
        </div>
      </nav>

      <!-- Mobile Navigation -->
      <div class="border-t border-slate-200 py-2 md:hidden dark:border-slate-800">
        <div class="flex gap-1">
          {#each navItems as item (item.href)}
            <Button
              variant={currentPath === item.href ? "default" : "ghost"}
              size="sm"
              class="flex-1 gap-1 text-xs"
              onclick={() => goto(item.href)}
            >
              <span>{item.icon}</span>
              {item.label}
            </Button>
          {/each}
        </div>
      </div>
    </div>
  </header>

  <!-- Page Content -->
  <main>
    {@render children()}
  </main>
</div>
