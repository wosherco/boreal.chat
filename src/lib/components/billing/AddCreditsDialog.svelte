<script lang="ts">
  import { Button } from "../ui/button";
  import { Input } from "../ui/input";
  import { Label } from "../ui/label";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";
  import { Loader2 } from "@lucide/svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  const { open = $bindable(false), onOpenChange }: Props = $props();

  let messages = $state(100); // Default to 100 messages
  const messageRate = 0.06; // €0.06 per message

  const totalPrice = $derived(messages * messageRate);

  const addCreditsMutation = createMutation(
    orpcQuery.v1.billing.addCredits.mutationOptions({
      onSuccess: (res) => {
        if (!res.success || !res.url) {
          toast.error("Failed to create checkout session");
          return;
        }
        window.location.href = res.url;
      },
      onError: (err) => {
        toast.error("Failed to create checkout session");
        console.error(err);
      },
    }),
  );

  function handleAddCredits() {
    console.log(messages);
    $addCreditsMutation.mutate({ messages });
  }

  function updateMessages(value: string) {
    const num = parseInt(value) || 20;
    messages = Math.max(20, Math.min(1000, num));
  }
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">Add Messages</DialogTitle>
      <DialogDescription>
        Purchase messages to use with AI models. Messages never expire.
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="messages">Number of Messages</Label>
        <div class="space-y-2">
          <Input
            id="messages"
            type="number"
            min="20"
            max="1000"
            bind:value={messages}
            onchange={(e) => updateMessages(e.currentTarget.value)}
            class="text-center font-mono"
          />
          <input
            type="range"
            min="20"
            max="1000"
            step="10"
            bind:value={messages}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
          />
          <div class="text-muted-foreground flex justify-between text-xs">
            <span>20</span>
            <span>1000</span>
          </div>
        </div>
      </div>

      <div class="bg-muted/30 rounded-lg border p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">Messages:</span>
          <span class="font-mono">{messages}</span>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">Rate:</span>
          <span class="text-muted-foreground text-sm">€{messageRate} per message</span>
        </div>
        <div class="mt-2 border-t pt-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold">Total:</span>
            <span class="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => onOpenChange(false)}>Cancel</Button>
      <Button onclick={handleAddCredits} disabled={$addCreditsMutation.isPending}>
        {#if $addCreditsMutation.isPending}
          <Loader2 class="mr-2 size-4 animate-spin" />
        {/if}
        Purchase Messages
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
