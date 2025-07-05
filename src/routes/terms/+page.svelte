<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeftIcon } from "@lucide/svelte";
</script>

<svelte:head>
  <title>Terms of Service</title>
  <meta name="description" content="Terms of Service for our application" />
</svelte:head>

<div class="container mx-auto max-w-4xl p-4 py-8">
  <div class="mb-6">
    <Button variant="ghost" href="/" class="mb-4">
      <ArrowLeftIcon class="mr-2 h-4 w-4" />
      Back to Home
    </Button>
    <h1 class="text-3xl font-bold">Terms of Service</h1>
    <p class="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Terms of Service</CardTitle>
    </CardHeader>
    <CardContent class="prose prose-neutral dark:prose-invert max-w-none">
      <p>
        Welcome to our application. By using our service, you agree to these terms. Please read them carefully.
      </p>
      
      <h2>Acceptance of Terms</h2>
      <p>
        By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
      </p>
      
      <h2>Use License</h2>
      <p>
        Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only.
      </p>
      
      <h2>Disclaimer</h2>
      <p>
        The materials on this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
      </p>
      
      <h2>Contact Information</h2>
      <p>
        If you have any questions about these Terms of Service, please contact us at support@example.com.
      </p>
    </CardContent>
  </Card>
</div>