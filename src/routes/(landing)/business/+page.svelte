<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Check, Building, Shield, Users, Server, Key, Lock, Zap } from "@lucide/svelte";
</script>

<svelte:head>
  <title>Business & Enterprise - boreal.chat</title>
  <meta
    name="description"
    content="Enterprise AI solutions with boreal.chat. Self-host on your infrastructure, maintain complete data control, and eliminate AI usage restrictions for your business."
  />
</svelte:head>

<!-- Hero Section -->
<section class="py-16 md:py-24">
  <div class="container mx-auto px-4 text-center">
    <div class="mx-auto max-w-4xl">
      <Badge variant="secondary" class="mb-6 px-4 py-2">🏢 Enterprise Ready</Badge>

      <h1 class="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Enterprise AI
        </span>
        <br />
        <span class="text-slate-900 dark:text-slate-50">Without Restrictions</span>
      </h1>

      <p class="mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300">
        End the era of <em>"don't use ChatGPT with internal data"</em> policies. Give your employees
        a powerful, secure AI platform they can actually use with your business data.
      </p>

      <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button
          size="lg"
          class="min-w-[200px] px-8 py-4 text-lg"
          onclick={() =>
            window.open("mailto:contact@boreal.chat?subject=Enterprise%20Inquiry", "_blank")}
        >
          📧 Contact Sales
        </Button>
        <Button
          variant="outline"
          size="lg"
          class="min-w-[200px] px-8 py-4 text-lg"
          onclick={() => window.open("https://docs.boreal.chat/beta-docs/self-hosting/", "_blank")}
        >
          📚 Self-Hosting Guide
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- Problem Statement -->
<section class="border-t border-slate-200 py-16 md:py-24 dark:border-slate-800">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">The Enterprise AI Dilemma</h2>
      <p class="mb-12 text-xl text-slate-600 dark:text-slate-300">
        Most businesses face a frustrating choice: use AI tools that compromise data security, or
        ban AI entirely and fall behind.
      </p>

      <div class="grid gap-6 md:grid-cols-3">
        <Card class="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader class="text-center">
            <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
              <Lock class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle class="text-red-800 dark:text-red-200">Data Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-red-700 dark:text-red-300">
              Public AI services can't guarantee your sensitive business data stays private
            </p>
          </CardContent>
        </Card>

        <Card class="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader class="text-center">
            <div
              class="mx-auto mb-2 h-12 w-12 rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/50"
            >
              <Shield class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle class="text-yellow-800 dark:text-yellow-200">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-yellow-700 dark:text-yellow-300">
              Regulatory requirements make external AI services a compliance nightmare
            </p>
          </CardContent>
        </Card>

        <Card class="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader class="text-center">
            <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
              <Users class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle class="text-blue-800 dark:text-blue-200">Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-blue-700 dark:text-blue-300">
              Employees need AI tools to stay competitive, but current solutions aren't safe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</section>

<!-- Solution -->
<section class="bg-slate-100 py-16 md:py-24 dark:bg-slate-800/50">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">The boreal.chat Enterprise Solution</h2>
      <p class="mb-12 text-xl text-slate-600 dark:text-slate-300">
        A complete AI platform that you own, control, and can trust with your most sensitive data.
      </p>
    </div>

    <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
      <Card class="h-full">
        <CardHeader>
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-2">
              <Server class="text-primary h-6 w-6" />
            </div>
            <CardTitle>Complete Self-Hosting</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Deploy on your own infrastructure</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Full control over data storage and processing</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>No data ever leaves your environment</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Meet any compliance requirement</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="h-full">
        <CardHeader>
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-2">
              <Users class="text-primary h-6 w-6" />
            </div>
            <CardTitle>Enterprise Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Centralized user management</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Role-based access controls</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Usage analytics and monitoring</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Custom integrations and API access</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="h-full">
        <CardHeader>
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-2">
              <Key class="text-primary h-6 w-6" />
            </div>
            <CardTitle>Flexible AI Access</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Use your own AI model APIs</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Support for all major AI providers</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>On-premises model deployment options</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Custom model fine-tuning support</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="h-full">
        <CardHeader>
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-2">
              <Zap class="text-primary h-6 w-6" />
            </div>
            <CardTitle>Enterprise Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Advanced security and audit logging</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>SSO integration (SAML, OIDC)</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Priority support and training</span>
            </li>
            <li class="flex items-center gap-3">
              <Check class="h-5 w-5 text-green-500" />
              <span>Custom development and consulting</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</section>

<!-- Commercial Licensing -->
<section class="py-16 md:py-24">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">Commercial Licensing</h2>
      <p class="mb-12 text-xl text-slate-600 dark:text-slate-300">
        <strong>Using boreal.chat (the official website):</strong> You can pay and use boreal.chat
        for any purpose, including commercial use.<br />
        <strong>Self-hosting:</strong> boreal.chat is currently available under the
        <strong>PolyForm Noncommercial License</strong> when self-hosting for personal, research, and
        educational use. We're developing enterprise licensing for commercial self-hosted deployments.
      </p>
    </div>

    <div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <span class="text-2xl">🔓</span>
            Current: Non-Commercial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2 text-slate-600 dark:text-slate-300">
            <li>• Personal use</li>
            <li>• Research and education</li>
            <li>• Non-profit organizations</li>
            <li>• Open-source projects</li>
          </ul>
        </CardContent>
      </Card>

      <Card class="border-primary bg-primary/5">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <span class="text-2xl">🏢</span>
            Coming: Commercial License
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2 text-slate-600 dark:text-slate-300">
            <li>• Business and enterprise use</li>
            <li>• Revenue-generating activities</li>
            <li>• Commercial services and products</li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <div class="mt-8 text-center">
      <p class="mb-6 text-slate-600 dark:text-slate-300">
        Interested in commercial licensing? We'd love to discuss your needs.
      </p>
      <Button
        size="lg"
        onclick={() =>
          window.open(
            "mailto:contact@boreal.chat?subject=Commercial%20License%20Inquiry",
            "_blank",
          )}
      >
        📧 Contact Us About Licensing
      </Button>
    </div>
  </div>
</section>

<!-- Use Cases -->
<section class="border-t border-slate-200 py-16 md:py-24 dark:border-slate-800">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl text-center">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">Perfect For Your Industry</h2>
      <p class="mb-12 text-xl text-slate-600 dark:text-slate-300">
        boreal.chat enterprise solutions work across industries that demand the highest security
        standards.
      </p>
    </div>

    <div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
            <Building class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Financial Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            Meet strict regulatory requirements while enabling AI-powered customer service and
            analysis.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-green-100 p-3 dark:bg-green-900/50">
            <Shield class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Healthcare</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            HIPAA-compliant AI solutions for medical research, patient care, and administrative
            tasks.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-purple-100 p-3 dark:bg-purple-900/50">
            <Users class="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Government</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            Secure AI deployment for public sector agencies with full data sovereignty.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
            <Lock class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Legal</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            Maintain attorney-client privilege while leveraging AI for document review and research.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/50">
            <Key class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            Protect intellectual property while enabling AI-assisted development and innovation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/50">
            <Zap class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle>Manufacturing</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-center text-slate-600 dark:text-slate-300">
            AI-powered quality control and process optimization with complete data control.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-blue-600 to-purple-600 py-16 md:py-24">
  <div class="container mx-auto px-4 text-center">
    <h2 class="mb-6 text-3xl font-bold text-white md:text-4xl">Ready to Deploy Enterprise AI?</h2>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button
        size="lg"
        variant="secondary"
        class="min-w-[200px] bg-white px-8 py-4 text-lg text-blue-600 hover:bg-slate-100"
        onclick={() =>
          window.open("mailto:contact@boreal.chat?subject=Enterprise%20Demo%20Request", "_blank")}
      >
        📅 Schedule Demo
      </Button>
      <Button
        size="lg"
        variant="outline"
        class="min-w-[200px] border-white px-8 py-4 text-lg text-white"
        onclick={() => window.open("https://docs.boreal.chat/beta-docs/self-hosting/", "_blank")}
      >
        🚀 Try Self-Hosting
      </Button>
    </div>

    <div class="mt-8 border-t border-blue-400 pt-8">
      <p class="mb-4 text-blue-100">Questions about enterprise features or commercial licensing?</p>
      <p class="text-sm text-blue-200">
        Contact us at <a href="mailto:contact@boreal.chat" class="underline hover:text-white"
          >contact@boreal.chat</a
        >
      </p>
    </div>
  </div>
</section>
