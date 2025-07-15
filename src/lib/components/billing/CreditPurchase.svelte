<script lang="ts">
  import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
  import { env } from '$env/dynamic/public';
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { Button } from "../ui/button";
  import { Input } from "../ui/input";
  import { Switch } from "../ui/switch";
  import { Label } from "../ui/label";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
  import { Separator } from "../ui/separator";
  import { Badge } from "../ui/badge";
  import { Loader2, CreditCard, Plus, Trash2 } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";

  const user = useCurrentUser(null);

  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let cardElement: any = null;
  let addCardElement: any = null;
  let cardMounted = false;

  let amount = $state(5);
  let isOneTime = $state(true);
  let selectedPaymentMethod = $state<string>("");
  let useNewCard = $state(true);
  let processing = $state(false);

  // Reactive calculations
  const fee = $derived(Math.round(amount * 8) / 100);
  const totalAmount = $derived(amount + fee);

  // Load Stripe
  onMount(async () => {
    try {
      stripe = await loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (stripe) {
        elements = stripe.elements();
        setupCardElement();
      }
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      toast.error('Failed to load payment system');
    }
  });

  function setupCardElement() {
    if (!elements) return;
    
    // Main card element for purchases
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });
    
    cardElement.mount('#card-element');

    cardElement.on('change', ({ error }: any) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        displayError.textContent = error ? error.message : '';
      }
    });

    // Second card element for adding payment methods
    addCardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });
    
    addCardElement.mount('#card-element-add');
    cardMounted = true;

    addCardElement.on('change', ({ error }: any) => {
      const displayError = document.getElementById('add-card-errors');
      if (displayError) {
        displayError.textContent = error ? error.message : '';
      }
    });
  }

  // Queries and mutations
  const paymentMethodsQuery = createQuery(
    orpcQuery.v1.billing.getPaymentMethods.queryOptions({
      enabled: !!$user.data?.authenticated,
    })
  );

  const creditsQuery = createQuery(
    orpcQuery.v1.billing.getUserCredits.queryOptions({
      enabled: !!$user.data?.authenticated,
    })
  );

  const addPaymentMethodMutation = createMutation(
    orpcQuery.v1.billing.addPaymentMethod.mutationOptions({
      onSuccess: () => {
        toast.success('Payment method added successfully');
        $paymentMethodsQuery.refetch();
      },
      onError: (error) => {
        toast.error('Failed to add payment method');
        console.error(error);
      },
    })
  );

  const deletePaymentMethodMutation = createMutation(
    orpcQuery.v1.billing.deletePaymentMethod.mutationOptions({
      onSuccess: () => {
        toast.success('Payment method removed');
        $paymentMethodsQuery.refetch();
      },
      onError: (error) => {
        toast.error('Failed to remove payment method');
        console.error(error);
      },
    })
  );

  const createCreditPurchaseMutation = createMutation(
    orpcQuery.v1.billing.createCreditPurchase.mutationOptions({
      onSuccess: async (result) => {
        if (result.success && result.clientSecret) {
          await processPayment(result.clientSecret);
        } else {
          toast.error(result.error || 'Failed to create purchase');
        }
      },
      onError: (error) => {
        toast.error('Failed to create purchase');
        console.error(error);
        processing = false;
      },
    })
  );

  async function addNewPaymentMethod() {
    if (!stripe || !addCardElement || !cardMounted) {
      toast.error('Payment system not ready');
      return;
    }

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: addCardElement,
      });

      if (error) {
        toast.error(error.message || 'Failed to create payment method');
        return;
      }

      if (paymentMethod) {
        $addPaymentMethodMutation.mutate({
          paymentMethodId: paymentMethod.id,
        });
      }
    } catch (error) {
      toast.error('Failed to add payment method');
      console.error(error);
    }
  }

  async function purchaseCredits() {
    if (amount < 5) {
      toast.error('Minimum amount is $5');
      return;
    }

    processing = true;

    try {
      $createCreditPurchaseMutation.mutate({
        amount,
        paymentMethodId: useNewCard ? undefined : selectedPaymentMethod,
        isOneTime,
      });
    } catch (error) {
      processing = false;
      toast.error('Failed to start purchase');
      console.error(error);
    }
  }

  async function processPayment(clientSecret: string) {
    if (!stripe) {
      processing = false;
      return;
    }

    try {
      let result;
      
      if (useNewCard && cardElement) {
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });
      } else {
        result = await stripe.confirmCardPayment(clientSecret);
      }

      if (result.error) {
        toast.error(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        toast.success(`Successfully added $${amount} in credits!`);
        $creditsQuery.refetch();
        // Reset form
        amount = 5;
        selectedPaymentMethod = "";
        useNewCard = true;
      }
    } catch (error) {
      toast.error('Payment processing failed');
      console.error(error);
    } finally {
      processing = false;
    }
  }

  function deletePaymentMethod(paymentMethodId: string) {
    $deletePaymentMethodMutation.mutate({ paymentMethodId });
  }

  $: paymentMethods = $paymentMethodsQuery.data?.paymentMethods || [];
  $: currentCredits = $creditsQuery.data?.credits || 0;
</script>

<div class="space-y-6">
  <!-- Current Credits Display -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <CreditCard class="h-5 w-5" />
        Current Credits
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-3xl font-bold text-green-600">
        ${currentCredits.toFixed(2)}
      </div>
      <p class="text-sm text-muted-foreground">Available for use</p>
    </CardContent>
  </Card>

  <!-- Purchase Credits -->
  <Card>
    <CardHeader>
      <CardTitle>Purchase Credits</CardTitle>
      <CardDescription>Add credits to your account with a one-time payment</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Amount Input -->
      <div class="space-y-2">
        <Label for="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          min="5"
          step="0.01"
          bind:value={amount}
          placeholder="Enter amount"
        />
        <p class="text-sm text-muted-foreground">Minimum: $5.00</p>
      </div>

      <!-- Cost Breakdown -->
      <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <h4 class="font-medium mb-2">Cost Breakdown</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Credits:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Processing Fee (8%):</span>
            <span>${fee.toFixed(2)}</span>
          </div>
          <Separator class="my-2" />
          <div class="flex justify-between font-medium">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- One-time Payment Toggle -->
      <div class="flex items-center space-x-2">
        <Switch id="one-time" bind:checked={isOneTime} />
        <Label for="one-time">One-time payment</Label>
      </div>

      <!-- Payment Method Selection -->
      <div class="space-y-4">
        <h4 class="font-medium">Payment Method</h4>
        
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <input
              type="radio"
              id="new-card"
              bind:group={useNewCard}
              value={true}
              class="h-4 w-4"
            />
            <Label for="new-card">Use new card</Label>
          </div>
          
          {#if paymentMethods.length > 0}
            <div class="flex items-center space-x-2">
              <input
                type="radio"
                id="saved-card"
                bind:group={useNewCard}
                value={false}
                class="h-4 w-4"
              />
              <Label for="saved-card">Use saved payment method</Label>
            </div>
          {/if}
        </div>

        {#if useNewCard}
          <!-- New Card Input -->
          <div class="space-y-2">
            <Label>Card Information</Label>
            <div class="border rounded-md p-3" id="card-element">
              <!-- Stripe Elements will mount here -->
            </div>
            <div id="card-errors" class="text-sm text-red-600"></div>
          </div>
        {:else if paymentMethods.length > 0}
          <!-- Saved Payment Methods -->
          <Select bind:value={selectedPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              {#each paymentMethods as method}
                <SelectItem value={method.id}>
                  <div class="flex items-center gap-2">
                    <CreditCard class="h-4 w-4" />
                    <span class="capitalize">{method.brand}</span>
                    <span>•••• {method.last4}</span>
                    {#if method.isDefault}
                      <Badge variant="secondary" class="text-xs">Default</Badge>
                    {/if}
                  </div>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        {/if}

        <!-- Purchase Button -->
        <Button 
          onclick={purchaseCredits}
          disabled={processing || amount < 5 || (!useNewCard && !selectedPaymentMethod)}
          class="w-full"
        >
          {#if processing}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Purchase ${totalAmount.toFixed(2)} in Credits
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Saved Payment Methods -->
  {#if paymentMethods.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Saved Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          {#each paymentMethods as method}
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center gap-3">
                <CreditCard class="h-5 w-5" />
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium capitalize">{method.brand}</span>
                    <span>•••• {method.last4}</span>
                    {#if method.isDefault}
                      <Badge variant="secondary" class="text-xs">Default</Badge>
                    {/if}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onclick={() => deletePaymentMethod(method.id)}
                disabled={$deletePaymentMethodMutation.isPending}
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Add Payment Method -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Plus class="h-5 w-5" />
        Add Payment Method
      </CardTitle>
      <CardDescription>Save a payment method for future purchases</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label>Card Information</Label>
        <div class="border rounded-md p-3" id="card-element-add">
          <!-- Second Stripe Elements instance for adding payment methods -->
        </div>
        <div id="add-card-errors" class="text-sm text-red-600"></div>
      </div>
      <Button 
        onclick={addNewPaymentMethod}
        disabled={$addPaymentMethodMutation.isPending || !cardMounted}
        variant="outline"
        class="w-full"
      >
        {#if $addPaymentMethodMutation.isPending}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        Add Payment Method
      </Button>
    </CardContent>
  </Card>
</div>