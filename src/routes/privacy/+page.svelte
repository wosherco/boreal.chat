<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeftIcon } from "@lucide/svelte";
</script>

<svelte:head>
  <title>Privacy Policy</title>
  <meta name="description" content="Privacy Policy for our application" />
</svelte:head>

<div class="container mx-auto max-w-4xl p-4 py-8">
  <div class="mb-6">
    <Button variant="ghost" href="/" class="mb-4">
      <ArrowLeftIcon class="mr-2 h-4 w-4" />
      Back to Home
    </Button>
    <h1 class="text-3xl font-bold">Privacy Policy</h1>
    <p class="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Privacy Policy</CardTitle>
    </CardHeader>
    <CardContent class="prose prose-neutral dark:prose-invert max-w-none">
      <p>
        This Privacy Policy describes how we collect, use, and protect your information when you use our service.
      </p>
      
      <h2>Information We Collect</h2>
      <p>
        We collect information you provide directly to us, such as when you create an account or contact us for support.
      </p>
      
      <h2>How We Use Your Information</h2>
      <p>
        We use the information we collect to:
      </p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send technical notices and support messages</li>
        <li>Respond to your comments and questions</li>
      </ul>
      
      <h2>Cookies and Tracking</h2>
      <p>
        We use cookies and similar tracking technologies to collect and use personal information about you. 
        You can control cookies through your browser settings and our cookie consent banner.
      </p>
      
      <h2>Analytics</h2>
      <p>
        We use PostHog for analytics to understand how users interact with our application. 
        This helps us improve our service. You can opt out of analytics tracking through our cookie consent options.
      </p>
      
      <h2>Data Protection</h2>
      <p>
        We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
      </p>
      
      <h2>Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal information. 
        You can also opt out of certain communications and data processing activities.
      </p>
      
      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at privacy@example.com.
      </p>
    </CardContent>
  </Card>
</div>