<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Zap } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import PricingPlan from "$lib/components/PricingPlan.svelte";
  import { pricingPlans } from "$lib/common/pricing";
</script>

<svelte:head>
  <title>Pricing - boreal.chat</title>
  <meta
    name="description"
    content="Choose the perfect plan for your AI conversations. From free BYOK to unlimited usage - transparent pricing with no hidden fees."
  />
</svelte:head>

<!-- Hero Section -->
<section class="py-16 md:py-24">
  <div class="container mx-auto px-4 text-center">
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Simple, Transparent
        </span>
        <br />
        <span class="text-slate-900 dark:text-slate-50">Pricing</span>
      </h1>

      <p class="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
        Choose the plan that works for you. Start free with bring-your-own-key, or go unlimited for
        just <strong>10€/month</strong>.
      </p>
    </div>
  </div>
</section>

<!-- Pricing Cards -->
<section class="pb-16 md:pb-24">
  <div class="container mx-auto px-4">
    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
      {#each pricingPlans as plan}
        <PricingPlan
          title={plan.title}
          description={plan.description}
          price={plan.price}
          priceSubtext={plan.priceSubtext}
          features={plan.features}
          buttonText={plan.buttonText}
          buttonVariant={plan.buttonVariant}
          isPopular={plan.isPopular}
          isPrimary={plan.isPrimary}
          buttonAction={() => goto("/auth")}
        />
      {/each}
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section class="border-t border-slate-200 py-16 md:py-24 dark:border-slate-800">
  <div class="container mx-auto px-4">
    <div class="mx-auto max-w-4xl">
      <h2 class="mb-12 text-center text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>

      <div class="grid gap-8 md:grid-cols-2">
        <div>
          <h3 class="mb-3 text-lg font-semibold">What does "Bring Your Own Key" mean?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            You can use your own API key from openrouter.ai. This gives you direct control over
            costs and ensures complete privacy.
          </p>
        </div>

        <div>
          <h3 class="mb-3 text-lg font-semibold">Can I switch between plans?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            Yes! You can upgrade to Unlimited at any time. You can also cancel your subscription and
            continue using the free plan with BYOK.
          </p>
        </div>

        <div>
          <h3 class="mb-3 text-lg font-semibold">What are "fair rate limits"?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            We apply reasonable limits to prevent abuse while ensuring normal users never hit them.
            Think thousands of messages per day, not dozens.
          </p>
        </div>

        <div>
          <h3 class="mb-3 text-lg font-semibold">Is my data secure?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            Absolutely. Your conversations are encrypted. Plus, you can always self-host for
            complete control.
          </p>
        </div>

        <div>
          <h3 class="mb-3 text-lg font-semibold">What about commercial usage?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            Our current license is for non-commercial use. We're developing enterprise solutions for
            businesses.
            <a href="/business" class="text-primary hover:underline">Learn more</a>.
          </p>
        </div>

        <div>
          <h3 class="mb-3 text-lg font-semibold">Do you offer refunds?</h3>
          <p class="text-slate-600 dark:text-slate-300">
            Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact us and
            we'll process the refund.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="bg-gradient-to-r from-blue-600 to-purple-600 py-16 md:py-24">
  <div class="container mx-auto px-4 text-center">
    <h2 class="mb-6 text-3xl font-bold text-white md:text-4xl">Ready to Start Your AI Journey?</h2>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <Button
        size="lg"
        variant="secondary"
        class="min-w-[200px] bg-white px-8 py-4 text-lg text-blue-600 hover:bg-slate-100"
        onclick={() => goto("/auth")}
      >
        🚀 Start Free
      </Button>
      <Button
        size="lg"
        variant="outline"
        class="min-w-[200px] border-white px-8 py-4 text-lg text-white hover:bg-white hover:text-blue-600"
        onclick={() => goto("/")}
      >
        💬 Try Demo
      </Button>
    </div>

    <p class="mt-6 text-sm text-blue-200">
      Questions? <a href="/settings/contact" class="underline hover:text-white">Contact our team</a>
    </p>
  </div>
</section>
