<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { PlusIcon, BookOpenIcon } from "@lucide/svelte";
  import { goto } from "$app/navigation";

  // TODO: Replace with actual journal entries from database
  const journalEntries = [
    {
      id: "1",
      title: "Feeling grateful today",
      content: "Today was a good day. I accomplished my goals and spent time with loved ones...",
      mood: 8,
      createdAt: new Date("2024-11-20"),
    },
    {
      id: "2",
      title: "Dealing with stress",
      content: "Work has been overwhelming lately. Need to find better ways to manage my time...",
      mood: 4,
      createdAt: new Date("2024-11-19"),
    },
  ];

  function onNewEntry() {
    // TODO: Navigate to create new entry page
    console.log("Create new journal entry");
  }

  function getMoodEmoji(mood: number) {
    if (mood >= 8) return "😊";
    if (mood >= 6) return "🙂";
    if (mood >= 4) return "😐";
    return "😔";
  }

  // Translations
  const messages = {
    title: "Emotional Journal",
    subtitle: "Track your thoughts and emotions",
    newEntry: "New Entry",
    createFirstEntry: "Create Your First Entry",
    noEntries: "No journal entries yet",
    startJourney: "Start your emotional journey by creating your first journal entry.",
    mood: "Mood"
  };
</script>

<svelte:head>
  <title>Emotional Journal - boreal.chat</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-3">
      <BookOpenIcon class="size-8 text-primary" />
      <div>
        <h1 class="text-3xl font-bold">{messages.title}</h1>
        <p class="text-muted-foreground">{messages.subtitle}</p>
      </div>
    </div>

    <Button onclick={onNewEntry} class="gap-2">
      <PlusIcon class="size-4" />
      {messages.newEntry}
    </Button>
  </div>

  {#if journalEntries.length === 0}
    <div class="text-center py-12">
      <BookOpenIcon class="size-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">{messages.noEntries}</h2>
      <p class="text-muted-foreground mb-6">
        {messages.startJourney}
      </p>
      <Button onclick={onNewEntry} class="gap-2">
        <PlusIcon class="size-4" />
        {messages.createFirstEntry}
      </Button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each journalEntries as entry}
        <Card class="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <CardTitle class="flex items-center gap-2 text-lg">
                  <span class="text-2xl">{getMoodEmoji(entry.mood)}</span>
                  {entry.title}
                </CardTitle>
                <p class="text-sm text-muted-foreground mt-1">
                  {entry.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div class="text-sm text-muted-foreground">
                {messages.mood}: {entry.mood}/10
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground line-clamp-3">
              {entry.content}
            </p>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>