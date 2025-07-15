<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import CreditPurchase from "./CreditPurchase.svelte";

  const user = useCurrentUser(null);
</script>

<div class="space-y-6">
  <div class="mb-6">
    <h1 class="text-2xl font-semibold mb-2">Credits & Billing</h1>
    <p class="text-muted-foreground">
      Purchase credits for pay-as-you-go usage. Credits never expire and can be used for any AI model or feature.
    </p>
  </div>
  
  <CreditPurchase />
</div>
