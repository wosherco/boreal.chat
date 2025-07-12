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
  import { Separator } from "../ui/separator";
  import { toast } from "svelte-sonner";
  import { SHARE_PRIVACY_OPTIONS, type SharePrivacy } from "$lib/common";
  import { CopyIcon, ExternalLinkIcon, EyeIcon, MailIcon, LockIcon, MessageSquareIcon, GitBranchIcon } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  interface Props {
    open: boolean;
    messageId: string;
    threadId?: string;
    lastMessageId?: string;
  }

  const { open, messageId, threadId, lastMessageId }: Props = $props();
  const dispatch = createEventDispatcher<{ close: void }>();

  let shareType = $state<"message" | "thread">("message");
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

  async function createShare() {
    loading = true;
    try {
      let result;
      
      if (shareType === "message") {
        result = await orpc.v1.share.message.create({
          messageId,
          privacy: sharingOptions.privacy,
          emails: sharingOptions.emails,
        });
      } else {
        if (!threadId || !lastMessageId) {
          toast.error("Thread information is required");
          return;
        }
        result = await orpc.v1.share.thread.create({
          threadId,
          lastMessageId,
          privacy: sharingOptions.privacy,
          emails: sharingOptions.emails,
        });
      }

      const baseUrl = window.location.origin;
      const shareUrl = shareType === "message" 
        ? `${baseUrl}/sm/${result.id}`
        : `${baseUrl}/st/${result.id}`;
      
      navigator.clipboard.writeText(shareUrl);
      toast.success(`${shareType === "message" ? "Message" : "Thread"} share created and URL copied to clipboard!`);
      onClose();
    } catch (error) {
      console.error("Failed to create share:", error);
      toast.error("Failed to create share");
    }
    loading = false;
  }

  function onClose() {
    dispatch("close");
  }

  $effect(() => {
    if (open) {
      // Reset form when modal opens
      shareType = "message";
      sharingOptions = {
        privacy: "public",
        emails: [],
      };
    }
  });
</script>

<Dialog {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <DialogContent class="max-w-lg">
    <DialogHeader>
      <DialogTitle>Share {shareType === "message" ? "Message" : "Thread"}</DialogTitle>
      <DialogDescription>
        Create a shareable link for this {shareType === "message" ? "message" : "thread"}.
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-6">
      <!-- Share Type Selection -->
      <div class="space-y-3">
        <label class="text-sm font-medium">Share Type</label>
        <div class="flex gap-2">
          <Button
            variant={shareType === "message" ? "default" : "outline"}
            size="sm"
            onclick={() => shareType = "message"}
            class="flex items-center gap-2"
          >
            <MessageSquareIcon size={16} />
            This Message Only
          </Button>
          {#if threadId && lastMessageId}
            <Button
              variant={shareType === "thread" ? "default" : "outline"}
              size="sm"
              onclick={() => shareType = "thread"}
              class="flex items-center gap-2"
            >
              <GitBranchIcon size={16} />
              Full Thread
            </Button>
          {/if}
        </div>
        <p class="text-xs text-muted-foreground">
          {#if shareType === "message"}
            Share only this specific message.
          {:else}
            Share the entire conversation thread up to this point.
          {/if}
        </p>
      </div>

      <Separator />

      <!-- Privacy Options -->
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

      <!-- Email List for Restricted Sharing -->
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
          <p class="text-xs text-muted-foreground">
            Only users with these email addresses will be able to access the share.
          </p>
        </div>
      {/if}
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={onClose}>Cancel</Button>
      <Button onclick={createShare} disabled={loading}>
        {#if loading}
          Creating...
        {:else}
          Create Share
        {/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>