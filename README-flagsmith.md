# Flagsmith Setup

Simple Flagsmith integration for SvelteKit with SSR and client-side support, based on the [official Flagsmith Svelte example](https://github.com/Flagsmith/flagsmith-js-examples/tree/main/svelte).

## Installation

Flagsmith is already installed via:
```bash
pnpm add flagsmith
```

## Environment Variables

Add to your `.env`:
```env
PUBLIC_FLAGSMITH_ENVIRONMENT_KEY=your_environment_key_here
```

## How It Works

### 1. Server-Side Rendering (SSR)
- `src/routes/+layout.server.ts` initializes Flagsmith with `flagsmith/isomorphic`
- Gets the state with `flagsmith.getState()` and passes it to the client

### 2. Client-Side
- `src/routes/+layout.svelte` initializes Flagsmith with the server state
- `src/lib/flagsmith.ts` provides helper functions with fallbacks
- User identification happens automatically (same as PostHog)

## Usage

### Check Feature Flags
```typescript
import { isFlagEnabled, getFlagValue } from "$lib/flagsmith";
import { FEATURE_FLAGS } from "$lib/common/featureFlags";

// In a component
const billingEnabled = isFlagEnabled(FEATURE_FLAGS.BILLING.key, FEATURE_FLAGS.BILLING.defaultEnabled);
const fontSize = getFlagValue("font_size", 16);
```

### Add New Flags
1. Add to `FEATURE_FLAGS` in `src/lib/common/featureFlags.ts`
2. Create the flag in your Flagsmith dashboard
3. Use it with `isFlagEnabled()` or `getFlagValue()`

## Features

✅ **SSR Support** - Flags available immediately on page load  
✅ **Client-side Updates** - Real-time flag changes  
✅ **SPA Compatible** - Works without SSR  
✅ **User Identification** - Automatic user identification matching PostHog  
✅ **Fallback Defaults** - Works offline with default values  
✅ **Simple API** - Based on official Flagsmith example  

## Key Files

- `src/lib/flagsmith.ts` - Main Flagsmith utilities
- `src/lib/common/featureFlags.ts` - Flag definitions
- `src/routes/+layout.server.ts` - SSR initialization  
- `src/routes/+layout.svelte` - Client initialization and user ID

## Example: Billing Feature Flag

```svelte
<!-- src/routes/(settings)/settings/billing/+page.svelte -->
<script>
  import { isFlagEnabled } from "$lib/flagsmith";
  import { FEATURE_FLAGS } from "$lib/common/featureFlags";
  
  let billingEnabled = false;
  
  onMount(() => {
    billingEnabled = isFlagEnabled(
      FEATURE_FLAGS.BILLING.key, 
      FEATURE_FLAGS.BILLING.defaultEnabled
    );
  });
</script>

{#if billingEnabled}
  <BillingPage />
{:else}
  <p>Billing is not available</p>
{/if}
```

That's it! Much simpler than complex abstractions.