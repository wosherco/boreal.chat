<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
  import { Button } from "./ui/button";
  import { Skeleton } from "./ui/skeleton";
  import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
  } from "./ui/dropdown-menu";
  import {
    LogOutIcon,
    PlusIcon,
    SearchIcon,
    SettingsIcon,
    ChevronsUpDownIcon,
    SunIcon,
    MoonIcon,
    MonitorIcon,
    Loader2,
    XIcon,
    KeyboardIcon,
    BookOpenIcon,
  } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { orpc } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { mode, setMode } from "mode-watcher";
  import type { Chat, CurrentUserInfo, HydratableDataResult } from "$lib/common/sharedTypes";
  import VirtualizedChatList from "./chatList/VirtualizedChatList.svelte";
  import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
  import BetaBadge from "./BetaBadge.svelte";
  import { clearLocalDb } from "$lib/client/db/index.svelte";
  import { SheetClose } from "./ui/sheet";
  import { openSearchCommand } from "./SearchCommand.svelte";

  interface Props {
    loading: boolean;
    user: CurrentUserInfo | null;
    chats: HydratableDataResult<Chat[]>;
    onNewChat?: () => void;
    isPhone?: boolean;
  }

  const { user, loading, chats, onNewChat, isPhone = false }: Props = $props();

  import { controlKeyName } from "$lib/utils/platform";
  import { browser } from "$app/environment";
  import ShortcutsCheatsheetDialog from "./ShortcutsCheatsheetDialog.svelte";
  import SheetClosableOnlyOnPhone from "./utils/SheetClosableOnlyOnPhone.svelte";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import * as m from "$lib/paraglide/messages";

  let shortcutsCheatsheetOpen = $state(false);

  let logoutLoading = $state(false);

  async function onLogout() {
    if (logoutLoading) return;
    logoutLoading = true;

    try {
      await orpc.v1.auth.logout();

      if (browser) {
        clearLocalDb();
      }

      await goto("/");
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      logoutLoading = false;
    }
  }

  async function onNewChatLocal() {
    if (!browser) return;

    try {
      await goto("/");
      await onNewChat?.();
    } catch (error) {
      console.error(error);
    }
  }
</script>

{#snippet SearchBar()}
  <button
    onclick={() => openSearchCommand()}
    class="hover:bg-muted/50 border-border text-muted-foreground mx-2 flex h-10 w-full items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <SearchIcon class="h-4 w-4" />
    Search...
    <div class="ml-auto flex gap-1">
      <kbd
        class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100"
      >
        {controlKeyName}K
      </kbd>
    </div>
  </button>
{/snippet}

<div class="flex h-full w-full flex-col">
  <SheetClosableOnlyOnPhone {isPhone}>
    <div class="space-y-4 py-4">
      <!-- Search Bar -->
      {@render SearchBar()}

      <!-- Create New Chat Button -->
      <div class="mx-2">
        <Button onclick={onNewChatLocal} class="w-full justify-start">
          <PlusIcon />
          New Chat
          <div class="ml-auto flex gap-1">
            <kbd
              class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100"
            >
              {controlKeyName}Shift O
            </kbd>
          </div>
        </Button>
      </div>

      <!-- Chats List -->
      <div class="flex-1">
        <VirtualizedChatList {chats} />
      </div>
    </div>
  </SheetClosableOnlyOnPhone>

  <!-- User section at the bottom -->
  <div class="border-t p-4">
    <SheetClosableOnlyOnPhone {isPhone}>
      {#if loading || !user}
        <!-- Skeleton State -->
        <div class="flex items-center gap-2">
          <Skeleton class="size-8 rounded-full" />
          <div class="flex-1 space-y-1">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3 w-16" />
          </div>
        </div>
      {:else if !user.data || !user.authenticated}
        <!-- Login Button -->
        <div class="flex flex-row gap-2">
          <Button href="/auth" class="w-full flex-1" variant="default">{m.sidebar_signIn()}</Button>
          <Button href="/settings" class="shrink-0" variant="outline" size="icon">
            <SettingsIcon />
          </Button>
        </div>
      {:else}
        <!-- User Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger class="w-full">
            <Button variant="ghost" class="h-auto w-full justify-start p-2 text-start">
              <div class="flex w-full items-center gap-2">
                <Avatar class="size-8">
                  <AvatarImage src={user.data.profilePicture} />
                  <AvatarFallback class="text-xs">
                    {user.data.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col items-start">
                  <p class="w-full truncate text-sm font-medium">{user.data.name}</p>
                  <p class="text-muted-foreground text-xs">
                    {#if isSubscribed(user.data)}
                      {m.sidebar_pro()}
                    {:else}
                      {m.sidebar_free()}
                    {/if}
                  </p>
                </div>
                <ChevronsUpDownIcon class="size-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <div class="flex flex-col space-y-1">
                <p class="text-sm leading-none font-medium">{user.data.name}</p>
                <p class="text-muted-foreground text-xs leading-none">{user.data.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div class="px-2 py-2">
              <div class="flex flex-row items-center justify-between gap-2">
                <span class="text-sm font-medium">{m.sidebar_theme()}</span>
                <Tabs
                  value={mode.current}
                  onValueChange={(value) => setMode(value as "system" | "light" | "dark")}
                >
                  <TabsList>
                    <TabsTrigger value="system">
                      <MonitorIcon class="size-4" />
                    </TabsTrigger>
                    <TabsTrigger value="light">
                      <SunIcon class="size-4" />
                    </TabsTrigger>
                    <TabsTrigger value="dark">
                      <MoonIcon class="size-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={() => (shortcutsCheatsheetOpen = true)}>
              <KeyboardIcon class="mr-2 size-4" />
              <span>{m.sidebar_shortcuts()}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onclick={() => goto("/settings")}>
              <SettingsIcon class="mr-2 size-4" />
              <span>{m.nav_settings()}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onclick={() => window.open("https://docs.boreal.chat", "_blank")}>
              <BookOpenIcon class="mr-2 size-4" />
              <span>{m.sidebar_docs()}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={onLogout} variant="destructive" disabled={logoutLoading}>
              {#if logoutLoading}
                <Loader2 class="mr-2 size-4 animate-spin" />
              {:else}
                <LogOutIcon class="mr-2 size-4" />
              {/if}
              <span>{m.sidebar_logout()}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      {/if}
    </SheetClosableOnlyOnPhone>
  </div>

  <ShortcutsCheatsheetDialog bind:open={shortcutsCheatsheetOpen} />
</div>
