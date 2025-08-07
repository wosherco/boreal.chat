<script lang="ts">
  import type { VoiceMessageService } from "$lib/client/services/voiceMessageService.svelte";
  import { toast } from "svelte-sonner";
  import Button from "../ui/button/button.svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { Loader2Icon } from "@lucide/svelte";

  interface Props {
    voiceMessageService: VoiceMessageService;
    onTranscript: (transcript: string) => void;
  }

  const { voiceMessageService, onTranscript }: Props = $props();

  const volumeLevels = $derived.by(() => {
    const levels = voiceMessageService.volumeLevels.slice(-20);
    const remaining = new Array(20 - levels.length).fill(0);
    return [...remaining, ...levels];
  });

  async function pauseRecording() {
    await voiceMessageService.pauseRecording();
  }

  async function resumeRecording() {
    await voiceMessageService.resumeRecording();
  }

  const transcribeMutation = createMutation(
    orpcQuery.v1.voice.transcribe.mutationOptions({
      onSuccess: (res) => {
        onTranscript(res.transcript);
        voiceMessageService.reset();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Failed to transcribe voice message");
      },
    }),
  );

  async function stopRecording() {
    const result = await voiceMessageService.stopRecording();

    if (!result) {
      voiceMessageService.reset();
      toast.error("Failed to stop recording");
      return;
    }

    $transcribeMutation.mutate({
      audioBlob: result.audioBlob,
      duration: result.duration / 1000,
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <!-- Controls row -->
  <div class="flex items-center justify-between">
    <!-- Cancel button on the left -->
    <Button
      variant="outline"
      size="sm"
      onclick={async () => {
        voiceMessageService.cancelRecording();
      }}
      class="text-destructive hover:text-destructive"
    >
      Cancel
    </Button>

    <!-- Pause/Resume and Finish buttons on the right -->
    <div class="flex items-center gap-2">
      {#if voiceMessageService.state === "recording"}
        <Button variant="outline" size="sm" onclick={pauseRecording}>Pause</Button>
      {:else if voiceMessageService.state === "paused"}
        <Button variant="outline" size="sm" onclick={resumeRecording}>Resume</Button>
      {/if}

      {#if voiceMessageService.state === "processing"}
        <Loader2Icon class="animate-spin" />
        Processing...
      {:else}
        <Button variant="default" size="sm" onclick={stopRecording}>Finish</Button>
      {/if}
    </div>
  </div>

  <!-- Volume visualization -->
  <div class="flex flex-col items-center gap-2">
    <!-- Animated vertical bars -->
    <div class="flex h-12 items-end gap-1">
      {#each volumeLevels as level, index (index)}
        <div
          class="bg-primary rounded-sm transition-all duration-75 ease-out"
          style="width: 3px; height: {Math.max(2, level * 48)}px; opacity: {0.3 + level * 0.7};"
        ></div>
      {/each}
    </div>

    <!-- Duration display -->
    <div class="text-muted-foreground font-mono text-sm">
      {voiceMessageService.duration / 1000}
    </div>

    <!-- Recording state indicator -->
    <div class="text-muted-foreground flex items-center gap-2 text-xs">
      {#if voiceMessageService.state === "recording"}
        <div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
        Recording...
      {:else if voiceMessageService.state === "paused"}
        <div class="h-2 w-2 rounded-full bg-yellow-500"></div>
        Paused
      {:else if voiceMessageService.state === "processing"}
        <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
        Processing...
      {/if}
    </div>
  </div>
</div>
