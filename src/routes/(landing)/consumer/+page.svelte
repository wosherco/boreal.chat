<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { goto } from "$app/navigation";

  const features = [
    {
      icon: "🧠",
      title: "Most Flagship Models",
      description: "Access to the latest and greatest AI models through reliable API providers",
    },
    {
      icon: "🗣️",
      title: "Voice Mode",
      description: "Talk to the AI with your voice",
    },
    {
      icon: "🔌",
      title: "Offline Syncing",
      description: "Never lose your conversations with seamless syncing across all devices",
    },
    {
      icon: "📌",
      title: "Smart Organization",
      description: "Pin, archive, and organize your chats with intuitive management tools",
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Built with Svelte for incredible performance and speed",
    },
    {
      icon: "🌐",
      title: "Responsive Design",
      description: "Perfect experience on phone, tablet, and desktop",
    },
    {
      icon: "🔒",
      title: "Self-Hostable",
      description: "Full control over your data with self-hosting options",
    },
    {
      icon: "🛡️",
      title: "Reliable & Secure",
      description: "Excellent uptime inherited from top-tier API providers",
    },
  ];

  const upcomingFeatures = [
    { icon: "🖼️", title: "Image Generation", description: "Create images directly in your chats" },
    {
      icon: "🗂️",
      title: "Advanced Organization",
      description: "Enhanced tagging, folders, and search",
    },
    { icon: "🎨", title: "Canvas Mode", description: "Interactive content creation and editing" },
    { icon: "☁️", title: "File Syncing", description: "Google Drive & OneDrive integration" },
    { icon: "🖥️", title: "Desktop App", description: "Native desktop experience" },
    { icon: "📱", title: "Mobile Apps", description: "Dedicated iOS and Android apps" },
  ];
</script>

<svelte:head>
  <title>boreal.chat - The Best AI Chat Platform</title>
  <meta
    name="description"
    content="Experience the future of AI conversations with boreal.chat - featuring flagship models, voice mode, offline syncing, and more. Open-source and self-hostable."
  />
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden">
  <div class="container mx-auto px-4 py-16 md:py-24 lg:py-32">
    <div class="mx-auto max-w-4xl text-center">
      <div class="mb-6 flex justify-center">
        <Badge variant="secondary" class="px-4 py-2 text-sm">🌌 Now in Public Beta</Badge>
      </div>

      <h1 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          The Future of
        </span>
        <br />
        <span class="text-slate-900 dark:text-slate-50">AI Conversations</span>
      </h1>

      <p
        class="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl dark:text-slate-300"
      >
        Experience the most advanced AI chat platform with flagship models, voice conversations,
        offline syncing, and lightning-fast performance. <strong>Fully open-source</strong> and self-hostable.
      </p>

      <div class="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" class="min-w-[200px] px-8 py-4 text-lg" onclick={() => goto("/")}>
          🚀 Try boreal.chat
        </Button>
        <Button
          variant="outline"
          size="lg"
          class="min-w-[200px] px-8 py-4 text-lg"
          onclick={() => goto("/auth")}
        >
          📝 Register Today
        </Button>
        <Button
          variant="ghost"
          size="lg"
          class="min-w-[200px] px-8 py-4 text-lg"
          onclick={() => window.open("https://docs.boreal.chat/beta-docs/self-hosting/", "_blank")}
        >
          🔧 Self-Host
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="py-16 md:py-24">
  <div class="container mx-auto px-4">
    <div class="mb-16 text-center">
      <h2 class="mb-4 text-3xl font-bold md:text-4xl">
        Why Choose <span class="text-blue-600">boreal.chat</span>?
      </h2>
      <p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
        Built with reliability, speed, and user experience in mind. Here's what makes us different.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {#each features as feature}
        <Card class="h-full transition-shadow duration-300 hover:shadow-lg">
          <CardHeader class="pb-4 text-center">
            <div class="mb-2 text-4xl">{feature.icon}</div>
            <CardTitle class="text-lg">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription class="text-center">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- Benefits Section -->
<section class="bg-slate-100 py-16 md:py-24 dark:bg-slate-800/50">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h2 class="mb-6 text-3xl font-bold md:text-4xl">Key Benefits</h2>
        <p class="text-lg text-slate-600 dark:text-slate-300">
          Experience the perfect combination of cutting-edge technology and user-focused design.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">🛡️</span>
              Reliability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-slate-600 dark:text-slate-300">
              Inherit the best uptime from openrouter.ai, the premier API provider for LLMs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">⚡</span>
              Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-slate-600 dark:text-slate-300">
              Lightning-fast UI built with Svelte and local-first database syncing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">✨</span>
              Quality Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-slate-600 dark:text-slate-300">
              Threading, keyboard shortcuts, chat archiving, voice mode, and much more.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">🔓</span>
              Open Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-slate-600 dark:text-slate-300">
              Fully open-source with clear licensing. Self-host for free and contribute.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</section>

<!-- Roadmap Section -->
<section class="py-16 md:py-24">
  <div class="container mx-auto px-4">
    <div class="mb-16 text-center">
      <h2 class="mb-4 text-3xl font-bold md:text-4xl">🗺️ What's Coming Next</h2>
      <p class="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
        We're just getting started! Here are the exciting features coming to boreal.chat.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each upcomingFeatures as feature}
        <Card
          class="border-2 border-dashed opacity-80 transition-shadow duration-300 hover:shadow-lg"
        >
          <CardHeader class="text-center">
            <div class="mb-2 text-3xl">{feature.icon}</div>
            <CardTitle class="text-lg">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription class="text-center">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-blue-600 to-purple-600 py-16 md:py-24">
  <div class="container mx-auto px-4 text-center">
    <h2 class="mb-6 text-3xl font-bold text-white md:text-4xl">Ready to Experience the Future?</h2>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button
        size="lg"
        variant="secondary"
        class="min-w-[200px] bg-white px-8 py-4 text-lg text-blue-600 hover:bg-slate-100"
        onclick={() => goto("/")}
      >
        🚀 Start Chatting Now
      </Button>
      <Button
        size="lg"
        variant="outline"
        class="min-w-[200px] border-white px-8 py-4 text-lg text-white hover:bg-white hover:text-blue-600"
        onclick={() => goto("/auth")}
      >
        📝 Create Account
      </Button>
    </div>

    <div class="mt-8 border-t border-blue-400 pt-8">
      <p class="mb-4 text-blue-100">Prefer to self-host?</p>
      <Button
        variant="ghost"
        class="text-white hover:bg-blue-500/20"
        onclick={() => window.open("https://docs.boreal.chat/beta-docs/self-hosting/", "_blank")}
      >
        📚 View Self-Hosting Guide →
      </Button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-slate-900 py-12 text-slate-300">
  <div class="container mx-auto px-4 text-center">
    <div class="mb-6">
      <h3 class="mb-2 text-2xl font-bold text-white">🌌 boreal.chat</h3>
      <p class="text-slate-400">The best AI chat platform - open-source & self-hostable</p>
    </div>

    <div class="mb-6 flex flex-wrap justify-center gap-6">
      <a href="https://docs.boreal.chat" target="_blank" class="transition-colors hover:text-white">
        📚 Documentation
      </a>
      <a
        href="https://discord.gg/boreal-chat"
        target="_blank"
        class="transition-colors hover:text-white"
      >
        💬 Discord
      </a>
      <a
        href="https://github.com/wosherco/boreal.chat"
        target="_blank"
        class="transition-colors hover:text-white"
      >
        ⭐ GitHub
      </a>
    </div>

    <p class="text-sm text-slate-400">Made with ❤️ by the boreal.chat team</p>
  </div>
</footer>
