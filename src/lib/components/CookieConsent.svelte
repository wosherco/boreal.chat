<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
  import { Button } from "./ui/button";
  import { browser } from "$app/environment";
  import { createCookieConsentState } from "$lib/utils/localStorage";
  import { CookieIcon, XIcon } from "@lucide/svelte";

  const cookieConsent = createCookieConsentState();

  // Show the prompt only if user hasn't answered and we're in the browser
  $: showPrompt = browser && !cookieConsent.hasAnswered;

  const handleAccept = () => {
    cookieConsent.accept();
  };

  const handleDecline = () => {
    cookieConsent.decline();
  };
</script>

{#if showPrompt}
  <div
    class="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none md:items-end md:justify-end"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class="pointer-events-auto w-full max-w-sm md:max-w-md"
      in:fly={{ y: 100, duration: 400, delay: 100 }}
      out:fly={{ y: 100, duration: 300 }}
    >
      <Card class="shadow-lg border-2">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <CookieIcon class="h-5 w-5 text-amber-600" />
            <CardTitle class="text-lg">We use cookies</CardTitle>
          </div>
          <CardDescription class="text-sm text-muted-foreground">
            We use cookies to improve your experience and for analytics. You can choose to accept or decline tracking cookies.
          </CardDescription>
        </CardHeader>
        <CardContent class="pb-3">
          <p class="text-xs text-muted-foreground">
            By continuing, you agree to our 
            <a href="/terms" class="underline hover:no-underline text-primary">Terms of Service</a>
            and 
            <a href="/privacy" class="underline hover:no-underline text-primary">Privacy Policy</a>.
          </p>
        </CardContent>
        <CardFooter class="flex gap-2 pt-0">
          <Button variant="outline" size="sm" class="flex-1" onclick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" class="flex-1" onclick={handleAccept}>
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
{/if}

<!-- Responsive styles for mobile -->
<style>
  @media (max-width: 768px) {
    .fixed {
      padding: 1rem;
    }
    
    .fixed > div {
      max-width: 100%;
    }
  }
</style>