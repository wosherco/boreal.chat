// From google
export const GEMINI_2_5_PRO = "google/gemini-2.5-pro-preview";
export const GEMINI_FLASH_2_5 = "google/gemini-2.5-flash";
export const GEMINI_FLASH_2_0 = "google/gemini-2.0-flash-001";
export const GEMINI_FLASH_2_0_FREE = "google/gemini-2.0-flash-exp:free";

// From openai
export const GPT_4O = "openai/gpt-4o";
export const GPT_4O_MINI = "openai/gpt-4o-mini";
export const GPT_O4_MINI = "openai/o4-mini";
export const GPT_O4_MINI_HIGH = "openai/o4-mini-high";
export const GPT_4_1 = "openai/gpt-4.1";
export const GPT_4_1_MINI = "openai/gpt-4.1-mini";
export const GPT_4_1_NANO = "openai/gpt-4.1-nano";

// From anthropic
export const CLAUDE_OPUS_4 = "anthropic/claude-opus-4";
export const CLAUDE_SONNET_4 = "anthropic/claude-sonnet-4";
export const CLAUDE_3_7_SONNET = "anthropic/claude-3.7-sonnet:thinking";
export const CLAUDE_3_5_SONNET = "anthropic/claude-3.5-sonnet";

// From deepseek
export const DEEPSEEK_R1 = "deepseek/deepseek-r1-0528";
export const DEEPSEEK_R1_FREE = "deepseek/deepseek-r1-0528:free";
export const DEEPSEEK_V3 = "deepseek/deepseek-chat-v3-0324";
export const DEEPSEEK_V3_FREE = "deepseek/deepseek-chat-v3-0324:free";

// From meta
/**
 * Not supported in app.
 */
export const LLAMA_3_1_8B = "meta-llama/llama-3.1-8b-instruct";
export const LLAMA_3_3_70B_FREE = "meta-llama/llama-3.3-70b-instruct:free";
export const LLAMA_4_MAVERICK = "meta-llama/llama-4-maverick";
export const LLAMA_4_MAVERICK_FREE = "meta-llama/llama-4-maverick:free";
export const LLAMA_4_SCOUT = "meta-llama/llama-4-scout";
export const LLAMA_4_SCOUT_FREE = "meta-llama/llama-4-scout:free";

// From qwen
export const QWEN_3_30B_A3B = "qwen/qwen3-30b-a3b";

// From xAi
export const GROK_3_BETA = "x-ai/grok-3-beta";
export const GROK_3_MINI_BETA = "x-ai/grok-3-mini-beta";
export const GROK_4 = "x-ai/grok-4";

// Moonshot
export const KIMI_K2 = "moonshotai/kimi-k2";
export const KIMI_K2_FREE = "moonshotai/kimi-k2:free";

export const MODELS = [
  // From google
  GEMINI_2_5_PRO,
  GEMINI_FLASH_2_5,
  GEMINI_FLASH_2_0,
  GEMINI_FLASH_2_0_FREE,

  // From openai
  GPT_4O,
  GPT_4O_MINI,
  GPT_O4_MINI,
  GPT_O4_MINI_HIGH,
  GPT_4_1,
  GPT_4_1_NANO,
  GPT_4_1_MINI,

  // From anthropic
  CLAUDE_OPUS_4,
  CLAUDE_SONNET_4,
  CLAUDE_3_7_SONNET,
  CLAUDE_3_5_SONNET,

  // From deepseek
  DEEPSEEK_R1,
  DEEPSEEK_R1_FREE,
  DEEPSEEK_V3,
  DEEPSEEK_V3_FREE,

  // From meta
  LLAMA_4_MAVERICK,
  LLAMA_4_MAVERICK_FREE,
  LLAMA_4_SCOUT,
  LLAMA_4_SCOUT_FREE,

  // From qwen
  QWEN_3_30B_A3B,

  // From xAi
  GROK_3_BETA,
  GROK_3_MINI_BETA,
  GROK_4,

  // From moonshot
  KIMI_K2,
  KIMI_K2_FREE,
] as const;
export type ModelId = (typeof MODELS)[number];

export const HIGHLIGHTED_MODELS = [
  // Gemini
  GEMINI_2_5_PRO,
  GEMINI_FLASH_2_5,

  // Anthropic
  CLAUDE_SONNET_4,
  CLAUDE_3_7_SONNET,
  CLAUDE_3_5_SONNET,

  // OpenAI
  GPT_4_1,
  GPT_4_1_MINI,
  GPT_O4_MINI,
  GPT_O4_MINI,

  // Deepseek
  DEEPSEEK_R1,
  DEEPSEEK_V3,

  // Grok
  GROK_3_MINI_BETA,
  GROK_4,

  // Moonshot
  KIMI_K2,
] as const;

export interface ModelDetails {
  displayName: string;
  /**
   * If true, the model supports reasoning. If a string, it supports reasoning, but under another slug.
   *
   * @default false
   */
  reasoning?: boolean | string;
  /**
   * If the model is free.
   *
   * @default false
   */
  free?: boolean;
}

export const MODEL_DETAILS: Record<ModelId, ModelDetails> = {
  // From google
  [GEMINI_2_5_PRO]: {
    displayName: "Gemini Pro 2.5",
    reasoning: true,
  },
  [GEMINI_FLASH_2_5]: {
    displayName: "Gemini Flash 2.5",
    reasoning: true,
  },
  [GEMINI_FLASH_2_0]: {
    displayName: "Gemini Flash 2.0",
    reasoning: false,
  },
  [GEMINI_FLASH_2_0_FREE]: {
    displayName: "(Free) Gemini Flash 2.0",
    reasoning: false,
    free: true,
  },

  // From openai
  [GPT_4O]: {
    displayName: "GPT-4o",
    reasoning: false,
  },
  [GPT_4O_MINI]: {
    displayName: "GPT-4o-mini",
    reasoning: false,
  },
  [GPT_O4_MINI]: {
    displayName: "o4-mini",
    reasoning: true,
  },
  [GPT_O4_MINI_HIGH]: {
    displayName: "o4-mini-high",
    reasoning: true,
  },
  [GPT_4_1]: {
    displayName: "GPT-4.1",
    reasoning: false,
  },
  [GPT_4_1_NANO]: {
    displayName: "GPT-4.1-nano",
    reasoning: false,
  },
  [GPT_4_1_MINI]: {
    displayName: "GPT-4.1-mini",
    reasoning: false,
  },

  // From anthropic
  [CLAUDE_OPUS_4]: {
    displayName: "Claude Opus 4",
    reasoning: true,
  },
  [CLAUDE_SONNET_4]: {
    displayName: "Claude Sonnet 4",
    reasoning: true,
  },
  [CLAUDE_3_7_SONNET]: {
    displayName: "Claude 3.7 Sonnet",
    reasoning: "anthropic/claude-3.7-sonnet:thinking",
  },
  [CLAUDE_3_5_SONNET]: {
    displayName: "Claude 3.5 Sonnet",
    reasoning: false,
  },

  // From deepseek
  [DEEPSEEK_R1]: {
    displayName: "DeepSeek R1",
    reasoning: true,
  },
  [DEEPSEEK_R1_FREE]: {
    displayName: "(Free) DeepSeek R1",
    reasoning: true,
    free: true,
  },
  [DEEPSEEK_V3]: {
    displayName: "DeepSeek V3",
    reasoning: false,
  },
  [DEEPSEEK_V3_FREE]: {
    displayName: "(Free) DeepSeek V3",
    reasoning: false,
    free: true,
  },

  // From meta
  [LLAMA_4_MAVERICK]: {
    displayName: "Llama 4 Maverick",
    reasoning: false,
  },
  [LLAMA_4_MAVERICK_FREE]: {
    displayName: "(Free) Llama 4 Maverick",
    reasoning: false,
    free: true,
  },
  [LLAMA_4_SCOUT]: {
    displayName: "Llama 4 Scout",
    reasoning: false,
  },
  [LLAMA_4_SCOUT_FREE]: {
    displayName: "(Free) Llama 4 Scout",
    reasoning: false,
    free: true,
  },

  // From qwen
  [QWEN_3_30B_A3B]: {
    displayName: "Qwen 3.30B A3B",
    reasoning: true,
  },

  // From xAi
  [GROK_3_BETA]: {
    displayName: "Grok 3 Beta",
    reasoning: false,
  },
  [GROK_3_MINI_BETA]: {
    displayName: "Grok 3 Mini Beta",
    reasoning: true,
  },
  [GROK_4]: {
    displayName: "Grok 4",
    reasoning: true,
  },

  // From moonshot
  [KIMI_K2]: {
    displayName: "Kimi K2",
    reasoning: true,
  },
  [KIMI_K2_FREE]: {
    displayName: "(Free) Kimi K2",
    reasoning: true,
    free: true,
  },
};

export const DEFAULT_MODEL = GPT_4_1;

export const REASONING_HIGH = "high";
export const REASONING_MEDIUM = "medium";
export const REASONING_LOW = "low";
export const REASONING_NONE = "none";

export const REASONING_LEVELS = [
  REASONING_HIGH,
  REASONING_MEDIUM,
  REASONING_LOW,
  REASONING_NONE,
] as const;
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

export function addWebSearchToModel(model: string) {
  return `${model}:online`;
}
