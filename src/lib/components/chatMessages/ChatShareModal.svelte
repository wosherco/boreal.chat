<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import { Button } from "../ui/button";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
  import { Badge } from "../ui/badge";
  import { Separator } from "../ui/separator";
  import { toast } from "svelte-sonner";
  import { cn } from "$lib/utils";
  import { SHARE_PRIVACY_OPTIONS, type SharePrivacy } from "$lib/common";
  import { CopyIcon, ExternalLinkIcon, TrashIcon, EyeIcon, MailIcon, LockIcon } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  interface Props {
    open: boolean;
    chatId: string;
  }

  const { open, chatId }: Props = $props();
  const dispatch = createEventDispatcher<{ close: void }>();

  interface ShareItem {
    type: "chat" | "message" | "thread";
    id: string;
    shareId: string;
    privacy: SharePrivacy;
    allowedEmails: string[];
    createdAt: Date;
    updatedAt: Date;
    messageId?: string;
    threadId?: string;
    lastMessageId?: string;
  }

  let shares = $state<ShareItem[]>([]);
  let loading = $state(false);
  let sharingOptions = $state({
    privacy: "public" as SharePrivacy,
    emails: [] as string[],
  });

  const privacyIcons = {
    public: EyeIcon,
    emails: MailIcon,
    private: LockIcon,
  };

  const privacyLabels = {
    public: "Public",
    emails: "Specific emails",
    private: "Private",
  };

  async function loadShares() {
    if (!open || !chatId) return;
    loading = true;
    try {
      shares = await orpc.v1.share.chat.list({ chatId });
    } catch (error) {
      console.error("Failed to load shares:", error);
      toast.error("Failed to load shares");
    }
    loading = false;
  }

  async function createChatShare() {
    try {
      await orpc.v1.share.chat.upsert({
        chatId,
        privacy: sharingOptions.privacy,
        emails: sharingOptions.emails,
      });
      toast.success("Chat share created successfully");
      await loadShares();
    } catch (error) {
      console.error("Failed to create chat share:", error);
      toast.error("Failed to create chat share");
    }
  }

  async function deleteShare(shareId: string, type: string) {
    try {
      if (type === "message") {
        await orpc.v1.share.message.delete({ shareId });
      } else if (type === "thread") {
        await orpc.v1.share.thread.delete({ shareId });
      }
      toast.success("Share deleted successfully");
      await loadShares();
    } catch (error) {
      console.error("Failed to delete share:", error);
      toast.error("Failed to delete share");
    }
  }

  function copyShareUrl(shareId: string, type: string) {
    const baseUrl = window.location.origin;
    let shareUrl = "";
    
    if (type === "chat") {
      shareUrl = `${baseUrl}/sc/${shareId}`;
    } else if (type === "message") {
      shareUrl = `${baseUrl}/sm/${shareId}`;
    } else if (type === "thread") {
      shareUrl = `${baseUrl}/st/${shareId}`;
    }
    
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share URL copied to clipboard");
  }

  function openShareUrl(shareId: string, type: string) {
    const baseUrl = window.location.origin;
    let shareUrl = "";
    
    if (type === "chat") {
      shareUrl = `${baseUrl}/sc/${shareId}`;
    } else if (type === "message") {
      shareUrl = `${baseUrl}/sm/${shareId}`;
    } else if (type === "thread") {
      shareUrl = `${baseUrl}/st/${shareId}`;
    }
    
    window.open(shareUrl, "_blank");
  }

  $effect(() => {
    loadShares();
  });

  function onClose() {
    dispatch("close");
  }
</script>

<Dialog {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Share Chat</DialogTitle>
      <DialogDescription>
        Create and manage shares for this chat. You can share the entire chat or individual messages and threads.
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-6">
      <!-- Chat Share Options -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Create Chat Share</h3>
        
        <div class="space-y-3">
          <label class="text-sm font-medium">Privacy Level</label>
          <div class="flex gap-2">
            {#each SHARE_PRIVACY_OPTIONS as privacy}
              {@const Icon = privacyIcons[privacy]}
              <Button
                variant={sharingOptions.privacy === privacy ? "default" : "outline"}
                size="sm"
                onclick={() => sharingOptions.privacy = privacy}
                class="flex items-center gap-2"
              >
                <Icon size={16} />
                {privacyLabels[privacy]}
              </Button>
            {/each}
          </div>
        </div>

        {#if sharingOptions.privacy === "emails"}
          <div class="space-y-2">
            <label class="text-sm font-medium">Allowed Emails</label>
            <textarea
              bind:value={sharingOptions.emails}
              placeholder="Enter email addresses, one per line"
              class="w-full p-2 border rounded-md resize-none"
              rows="3"
              onchange={(e) => {
                sharingOptions.emails = (e.target as HTMLTextAreaElement)?.value
                  .split('\n')
                  .map((email: string) => email.trim())
                  .filter((email: string) => email.length > 0) || [];
              }}
            ></textarea>
          </div>
        {/if}

        <Button onclick={createChatShare} class="w-full">
          Create Chat Share
        </Button>
      </div>

      <Separator />

      <!-- Current Shares -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Current Shares ({shares.length})</h3>
        
        {#if loading}
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        {:else if shares.length === 0}
          <div class="text-center p-8 text-muted-foreground">
            No shares created yet. Create your first share above.
          </div>
        {:else}
          <div class="space-y-3">
            {#each shares as share (share.shareId)}
              {@const Icon = privacyIcons[share.privacy]}
              <div class="border rounded-lg p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">{share.type}</Badge>
                    <Icon size={16} />
                    <span class="text-sm font-medium">{privacyLabels[share.privacy]}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="small-icon"
                            onclick={() => copyShareUrl(share.shareId, share.type)}
                          >
                            <CopyIcon size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="small-icon"
                            onclick={() => openShareUrl(share.shareId, share.type)}
                          >
                            <ExternalLinkIcon size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open Share</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {#if share.type !== "chat"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="small-icon"
                              onclick={() => deleteShare(share.shareId, share.type)}
                              class="text-destructive hover:text-destructive"
                            >
                              <TrashIcon size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Share</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    {/if}
                  </div>
                </div>

                {#if share.privacy === "emails" && share.allowedEmails?.length > 0}
                  <div class="text-sm text-muted-foreground">
                    Shared with: {share.allowedEmails.join(", ")}
                  </div>
                {/if}

                <div class="text-xs text-muted-foreground">
                  Created: {new Date(share.createdAt).toLocaleString()}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={onClose}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>