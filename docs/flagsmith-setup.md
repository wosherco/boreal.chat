# Flagsmith Setup and Usage

This project uses Flagsmith for feature flags management with both server-side rendering (SSR) and client-side support.

## Environment Variables

Add these environment variables to your `.env` file:

```env
PUBLIC_FLAGSMITH_ENVIRONMENT_KEY=your_flagsmith_environment_key_here
PUBLIC_FLAGSMITH_API_URL=https://edge.api.flagsmith.com/api/v1/  # Optional, defaults to Flagsmith cloud
```

## How It Works

### 1. Server-Side Rendering (SSR)

- Flagsmith flags are fetched on the server during request processing
- Flags are passed to the client through page data
- This ensures flags are available immediately on page load

### 2. Client-Side

- Flagsmith initializes with SSR flags as defaults
- User identification matches PostHog (same user ID and traits)
- Flags are cached locally for performance

### 3. SPA Support

- If SSR flags aren't available, client-side initialization works independently
- Fallback to default values ensures app always works

## Feature Flag Structure

Feature flags are defined in `src/lib/common/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  BILLING: {
    key: "billing",
    defaultEnabled: false,
    defaultValue: null,
    description: "Enable billing and subscription features",
  },
  SHOW_FOOTER_ICONS: {
    key: "show_footer_icons", 
    defaultEnabled: true,
    defaultValue: null,
    description: "Show social media icons in the footer",
  },
};
```

## Usage Examples

### In Svelte Components

```svelte
<script>
  import { onMount } from "svelte";
  import { FEATURE_FLAGS } from "$lib/common/featureFlags";
  import { env } from "$env/dynamic/public";

  let isBillingEnabled = FEATURE_FLAGS.BILLING.defaultEnabled;

  onMount(async () => {
    if (env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY) {
      try {
        const { isFlagEnabled } = await import("$lib/client/flagsmith");
        isBillingEnabled = isFlagEnabled(
          FEATURE_FLAGS.BILLING.key, 
          FEATURE_FLAGS.BILLING.defaultEnabled
        );
      } catch (error) {
        console.error("Failed to get flag:", error);
      }
    }
  });
</script>

{#if isBillingEnabled}
  <BillingComponent />
{/if}
```

### Server-Side (in load functions)

```typescript
// In a +page.server.ts or +layout.server.ts file
export const load = async ({ locals }) => {
  const flagsmithFlags = locals.flagsmithFlags || {};
  
  const billingEnabled = flagsmithFlags['billing']?.enabled ?? FEATURE_FLAGS.BILLING.defaultEnabled;
  
  return {
    billingEnabled,
  };
};
```

## User Identification

Users are automatically identified with Flagsmith using the same pattern as PostHog:

- **User ID**: Same as PostHog user ID
- **Traits**: Email, name, and any other user properties
- **Automatic**: Happens when user logs in/out

## Adding New Feature Flags

1. Add the flag definition to `FEATURE_FLAGS` in `src/lib/common/featureFlags.ts`
2. Create the flag in your Flagsmith dashboard
3. Use the flag in your components following the examples above

## Fallback Strategy

The system is designed to be resilient:

1. **Flagsmith available**: Use Flagsmith flags
2. **Flagsmith unavailable**: Fall back to PostHog flags (if available)
3. **Both unavailable**: Use default values from flag definitions

This ensures your application always works, even if feature flag services are unavailable.

## Performance Notes

- Flags are cached locally for 10 seconds by default
- SSR flags provide immediate availability
- Client-side flags update in real-time when users are identified

## Troubleshooting

- Check browser console for Flagsmith initialization errors
- Verify environment keys are correctly set
- Ensure flag keys match between code and Flagsmith dashboard
- Use default values for graceful degradation