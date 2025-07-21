<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Alert } from "$lib/components/ui/alert";
  import { AlertTriangleIcon, CheckIcon, ServerIcon, XIcon } from "@lucide/svelte";
  import { orpc } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";

  interface Props {
    messageId: string;
    toolName: string;
    toolArgs: Record<string, any>;
    confirmationMessage: string;
    mcpServerName?: string;
    onConfirmed?: () => void;
    onRejected?: () => void;
  }

  let { 
    messageId, 
    toolName, 
    toolArgs, 
    confirmationMessage, 
    mcpServerName, 
    onConfirmed, 
    onRejected 
  }: Props = $props();

  let isProcessing = $state(false);

  async function handleConfirmation(confirmed: boolean) {
    if (isProcessing) return;
    
    isProcessing = true;
    try {
      await orpc.v1.mcp.confirmTool({ messageId, confirmed });
      
      if (confirmed) {
        toast.success("Tool execution confirmed");
        onConfirmed?.();
      } else {
        toast.info("Tool execution cancelled");
        onRejected?.();
      }
    } catch (error) {
      console.error("Failed to confirm tool:", error);
      toast.error("Failed to process confirmation");
    } finally {
      isProcessing = false;
    }
  }

  function formatArgs(args: Record<string, any>): string {
    try {
      return JSON.stringify(args, null, 2);
    } catch {
      return String(args);
    }
  }
</script>

<Card class="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
  <CardHeader class="pb-3">
    <CardTitle class="flex items-center gap-2 text-amber-800 dark:text-amber-200">
      <AlertTriangleIcon class="h-5 w-5" />
      Tool Execution Confirmation
    </CardTitle>
  </CardHeader>
  
  <CardContent class="space-y-4">
    <Alert>
      <ServerIcon class="h-4 w-4" />
      <div>
        <p class="font-medium">MCP Tool Execution Request</p>
        <p class="text-sm text-muted-foreground">
          {confirmationMessage}
        </p>
      </div>
    </Alert>

    <div class="space-y-3">
      <div>
        <h4 class="text-sm font-medium mb-1">Tool Details:</h4>
        <div class="bg-muted rounded-md p-3 space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">Tool:</span>
            <span class="text-sm font-mono bg-background px-2 py-1 rounded">{toolName}</span>
          </div>
          {#if mcpServerName}
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">Server:</span>
              <span class="text-sm font-mono bg-background px-2 py-1 rounded">{mcpServerName}</span>
            </div>
          {/if}
        </div>
      </div>

      {#if Object.keys(toolArgs).length > 0}
        <div>
          <h4 class="text-sm font-medium mb-1">Arguments:</h4>
          <pre class="bg-muted rounded-md p-3 text-xs overflow-x-auto">{formatArgs(toolArgs)}</pre>
        </div>
      {/if}
    </div>
  </CardContent>

  <CardFooter class="flex justify-end gap-2 pt-4">
    <Button
      variant="outline"
      onclick={() => handleConfirmation(false)}
      disabled={isProcessing}
    >
      <XIcon class="mr-2 h-4 w-4" />
      Cancel
    </Button>
    <Button
      onclick={() => handleConfirmation(true)}
      disabled={isProcessing}
    >
      <CheckIcon class="mr-2 h-4 w-4" />
      {isProcessing ? "Processing..." : "Confirm & Execute"}
    </Button>
  </CardFooter>
</Card>