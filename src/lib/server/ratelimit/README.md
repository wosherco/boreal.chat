# Compute Units (CU) Rate Limiting System

This directory implements a sophisticated rate limiting system based on Compute Units (CUs) that takes into account the actual cost and complexity of AI model requests.

## Overview

The system calculates "Compute Units" based on token usage and model pricing, then applies rate limits based on these CUs rather than simple request counts. This ensures fair usage across different models with varying costs.

## Key Components

### 1. Compute Units Calculation (`computeUnits.ts`)

**Base Formula:**
- Input tokens: $1/M tokens = 1 CU
- Output tokens: $2.5/M tokens = 1 CU
- Models are scaled based on their relative pricing

**Features:**
- Calculates CUs based on actual model pricing
- Rounds to common ratios (1, 1.25, 1.5, etc.)
- Supports estimation for rate limiting before actual usage
- Handles free models (0 cost = 0 CUs)

### 2. Rate Limiters (`limiters.ts`)

**CU-based Limiters:**
- Free tier: 10 CUs/hour (~10M tokens of cheap models)
- Premium tier: 100 CUs/hour (~100M tokens of cheap models)  
- Unlimited tier: 1000 CUs/hour (~1B tokens of cheap models)

**Request-based Limiters:**
- Chat requests per tier (30/100/500 per 10 minutes)
- High-cost model limits (5 requests per 10 minutes)
- Ultra-high-cost model limits (2 requests per 10 minutes)

### 3. Middleware (`cuMiddleware.ts`)

**CU Rate Limiting Middleware:**
- Estimates CU cost before processing
- Checks multiple rate limit layers
- Sets informative headers about usage
- Provides detailed error messages

**Unlimited Middleware (Example):**
- Demonstrates the system by bypassing all limits
- Logs what would normally be checked
- Shows estimated costs and usage

## Usage Examples

### Basic CU Calculation

```typescript
import { calculateCUs } from "./computeUnits";

const usage = {
  inputTokens: 1000,
  outputTokens: 500,
  model: "anthropic/claude-sonnet-4"
};

const result = calculateCUs(usage);
console.log(`Total CUs: ${result.totalCUs}`);
console.log(`Total Cost: $${result.totalCost}`);
```

### Using CU Middleware in Routes

```typescript
import { cuRatelimitMiddleware } from "./cuMiddleware";

export const myRoute = osBase
  .use(cuRatelimitMiddleware)
  .input(z.object({
    model: z.enum(MODELS),
    message: z.string()
  }))
  .handler(async ({ input, context }) => {
    // Request has been rate limited based on CUs
    // context.cuInfo contains usage information
    return processRequest(input);
  });
```

### Model-Specific Middleware

```typescript
import { createModelSpecificCUMiddleware } from "./cuMiddleware";

// Pre-configure for a specific model
const gpt4Middleware = createModelSpecificCUMiddleware(
  "openai/gpt-4o",
  1500, // estimated input tokens
  800   // estimated output tokens
);
```

## Rate Limiting Layers

The system applies multiple layers of rate limiting:

1. **Chat Request Limits** - Basic request counting per tier
2. **Model-Specific Limits** - Extra limits for expensive models
3. **CU-based Limits** - Core usage-based limiting
4. **Credit Balance** (TODO) - Account balance checking

## CU Calculation Examples

| Model | Input (1K tokens) | Output (500 tokens) | Total CUs | Est. Cost |
|-------|-------------------|---------------------|-----------|-----------|
| GPT-4o Mini | 0.00015 CUs | 0.00075 CUs | 0.0009 CUs | $0.0000009 |
| Claude Sonnet 4 | 0.003 CUs | 0.0075 CUs | 0.0105 CUs | $0.000010 |
| DeepSeek V3 Free | 0 CUs | 0 CUs | 0 CUs | $0 |

## User Tier Limits

| Tier | CUs/Hour | Approx. Requests/Hour* |
|------|----------|------------------------|
| Free | 10 | 1,000+ (cheap models) |
| Premium | 100 | 10,000+ (cheap models) |
| Unlimited | 1,000 | 100,000+ (cheap models) |

*Actual request counts depend on model choice and token usage

## Headers Set by Middleware

- `X-CU-Cost` - CUs consumed by this request
- `X-CU-Remaining` - CUs remaining in current window
- `X-User-Tier` - User's subscription tier
- `X-RateLimit-CU-Limit` - Total CU limit per window
- `X-Unlimited-Access` - Set when using unlimited middleware

## TODO: Future Enhancements

### Credits System
- [ ] User credit balance tracking
- [ ] Credit deduction on usage
- [ ] Subscription tier integration
- [ ] Usage analytics and billing

### Enhanced Rate Limiting
- [ ] Variable-cost rate limiting (instead of multiple calls)
- [ ] Burst allowances for premium users
- [ ] Model-specific quotas
- [ ] Time-based rate adjustments

### Monitoring & Analytics
- [ ] Usage tracking per user/model
- [ ] Cost prediction and budgeting
- [ ] Rate limit hit analysis
- [ ] Performance metrics

## Error Handling

The system provides clear error messages:

```
RATE_LIMIT_EXCEEDED: You have reached your Compute Unit limit. 
This request would cost 5 CUs. Please try again later or upgrade your plan.
```

## Testing

Run the examples to see the system in action:

```typescript
import { runAllExamples } from "./example";
runAllExamples();
```

This will demonstrate:
- CU calculations for different models
- Rate limiting scenarios by tier
- Model CU rates comparison
- Simulated rate limiting headers

## Integration

The system is designed to integrate with existing ORPC middleware patterns and can be easily added to any route that needs CU-based rate limiting.