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
  } from "@lucide/svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { orpc } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { mode, setMode } from "mode-watcher";
  import type { Chat, HydratableDataResult } from "$lib/common/sharedTypes";
  import VirtualizedChatList from "./chatList/VirtualizedChatList.svelte";
  import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
  import BetaBadge from "./BetaBadge.svelte";
  import { clearLocalDb } from "$lib/client/db/index.svelte";
  import { SheetClose } from "./ui/sheet";

  interface Props {
    loading: boolean;
    user?: {
      name: string;
      email: string;
      profilePicture: string;
    };
    authenticated?: boolean;
    chats: HydratableDataResult<Chat[]>;
    onSearchOpen?: () => void;
    onNewChat?: () => void;
    isPhone?: boolean;
  }

  const {
    user,
    loading,
    authenticated,
    chats,
    onSearchOpen,
    onNewChat,
    isPhone = false,
  }: Props = $props();

  // Detect if user is on Mac or Windows/Linux for keyboard shortcuts
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl";
  let logoutLoading = $state(false);

  async function onLogout() {
    if (logoutLoading) return;
    logoutLoading = true;
    try {
      await orpc.v1.auth.logout();
      await clearLocalDb();
      window.location.reload();
    } catch (e) {
      toast.error("Failed to log out");
    } finally {
      logoutLoading = false;
    }
  }
</script>

<TooltipProvider>
  <div class="bg-sidebar text-sidebar-foreground flex h-full w-80 flex-col overflow-hidden">
    <!-- Header -->
    <a href="/" class="flex items-center justify-between p-4">
      <div class="flex items-center gap-2">
        {#if isPhone}
          <SheetClose
            class="ring-offset-background focus-visible:ring-ring rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none md:hidden"
          >
            <XIcon class="size-6" />
            <span class="sr-only">Close</span>
          </SheetClose>
        {/if}
        <h1 class="text-lg font-semibold md:ml-12">boreal.chat</h1>
      </div>
      <BetaBadge />
    </a>

    <!-- New Chat and Search Row -->
    <div class="flex items-center gap-2 p-3">
      <!-- New Chat Button -->
      <Tooltip>
        <TooltipTrigger>
          <Button variant="default" size="icon" onclick={onNewChat} class="flex-shrink-0">
            <PlusIcon class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>New chat ({cmdKey}+Shift+O)</p>
        </TooltipContent>
      </Tooltip>

      <!-- Search Button -->
      <Button
        variant="secondary"
        onclick={onSearchOpen}
        class="bg-input/50 border-input hover:bg-input/70 text-foreground/70 hover:text-foreground flex-1 justify-between border"
      >
        <div class="flex items-center gap-2">
          <SearchIcon class="size-4" />
          <span>Search...</span>
        </div>
        <div class="bg-muted/80 border-border rounded border px-1.5 py-0.5 font-mono text-xs">
          {cmdKey}+K
        </div>
      </Button>
    </div>

    <!-- Chat List -->
    <div class="flex-1 overflow-y-auto p-2">
      {#if chats.loading}
        <div class="flex flex-col items-center justify-center">
          <Loader2 class="size-4 animate-spin" />
        </div>
      {:else}
        <VirtualizedChatList chats={chats.data} />
      {/if}
    </div>

    <!-- Account Section -->
    <div class="p-3">
      {#if loading}
        <!-- Skeleton State -->
        <div class="flex items-center gap-2">
          <Skeleton class="size-8 rounded-full" />
          <div class="flex-1 space-y-1">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3 w-16" />
          </div>
        </div>
      {:else if !authenticated}
        <!-- Login Button -->
        <Button href="/auth" class="w-full" variant="default">Sign In</Button>
      {:else if user}
        <!-- User Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger class="w-full">
            <Button variant="ghost" class="h-auto w-full justify-start p-2 text-start">
              <div class="flex w-full items-center gap-2">
                <Avatar class="size-8">
                  <AvatarImage src={user.profilePicture} />
                  <AvatarFallback class="text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col items-start">
                  <p class="w-full truncate text-sm font-medium">{user.name}</p>
                  <p class="text-muted-foreground text-xs">Free</p>
                </div>
                <ChevronsUpDownIcon class="size-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <div class="flex flex-col space-y-1">
                <p class="text-sm leading-none font-medium">{user.name}</p>
                <p class="text-muted-foreground text-xs leading-none">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div class="px-2 py-2">
              <div class="flex flex-row items-center justify-between gap-2">
                <span class="text-sm font-medium">Theme</span>
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
            <DropdownMenuItem onclick={() => goto("/settings")}>
              <SettingsIcon class="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={onLogout} variant="destructive" disabled={logoutLoading}>
              {#if logoutLoading}
                <Loader2 class="mr-2 size-4 animate-spin" />
              {:else}
                <LogOutIcon class="mr-2 size-4" />
              {/if}
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      {/if}
    </div>
  </div>
</TooltipProvider>
