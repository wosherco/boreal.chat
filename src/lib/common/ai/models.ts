// From google
export const GEMINI_2_5_PRO = "google/gemini-2.5-pro-preview";
export const GEMINI_FLASH_2_5 = "google/gemini-2.5-flash";
export const GEMINI_FLASH_2_5_LITE = "google/gemini-2.5-flash-lite";
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
export const GPT_OSS_120B = "openai/gpt-oss-120b";
export const GPT_OSS_20B = "openai/gpt-oss-20b";

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
export const QWEN_3_CODER = "qwen/qwen3-coder";
export const QWEN_3_CODER_FREE = "qwen/qwen3-coder:free";

// From xAi
export const GROK_3_BETA = "x-ai/grok-3-beta";
export const GROK_3_MINI_BETA = "x-ai/grok-3-mini-beta";
export const GROK_4 = "x-ai/grok-4";

// Moonshot
export const KIMI_K2 = "moonshotai/kimi-k2";
export const KIMI_K2_FREE = "moonshotai/kimi-k2:free";

// Openrouter
export const HORIZON_BETA = "openrouter/horizon-beta";

// Z-AI
export const Z_AI_4_5 = "z-ai/glm-4.5";
export const Z_AI_4_5_AIR = "z-ai/glm-4.5-air";
export const Z_AI_4_5_AIR_FREE = "z-ai/glm-4.5-air:free";

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
  GPT_OSS_120B,
  GPT_OSS_20B,

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
  LLAMA_3_3_70B_FREE,
  LLAMA_4_MAVERICK,
  LLAMA_4_MAVERICK_FREE,
  LLAMA_4_SCOUT,
  LLAMA_4_SCOUT_FREE,

  // From qwen
  QWEN_3_30B_A3B,
  QWEN_3_CODER,
  QWEN_3_CODER_FREE,

  // From xAi
  GROK_3_BETA,
  GROK_3_MINI_BETA,
  GROK_4,

  // From moonshot
  KIMI_K2,
  KIMI_K2_FREE,

  // From openrouter
  HORIZON_BETA,

  // From z-ai
  Z_AI_4_5,
  Z_AI_4_5_AIR,
  Z_AI_4_5_AIR_FREE,
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
  GPT_OSS_120B,

  // Deepseek
  DEEPSEEK_R1,
  DEEPSEEK_V3,

  // Qwen
  QWEN_3_CODER,

  // Grok
  GROK_3_MINI_BETA,
  GROK_4,

  // Moonshot
  KIMI_K2,

  // Openrouter
  HORIZON_BETA,

  // Z-AI
  Z_AI_4_5,
  Z_AI_4_5_AIR,
] as const;

export const FREE_MODELS = [
  // Gemini
  GEMINI_FLASH_2_5,
  GEMINI_FLASH_2_0,

  // OpenAI
  GPT_4_1_MINI,
  GPT_OSS_20B,

  // Meta
  LLAMA_4_MAVERICK,
  LLAMA_4_SCOUT,

  // Deepseek
  DEEPSEEK_R1,
  DEEPSEEK_V3,

  // Grok
  GROK_3_MINI_BETA,

  // Moonshot
  KIMI_K2,

  // Openrouter
  HORIZON_BETA,

  // Z-AI
  Z_AI_4_5_AIR,
];

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
  [GPT_OSS_120B]: {
    displayName: "GPT-OSS 120B",
    reasoning: true,
  },
  [GPT_OSS_20B]: {
    displayName: "GPT-OSS 20B",
    reasoning: true,
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
  [LLAMA_3_3_70B_FREE]: {
    displayName: "(Free) Llama 3.3 70B",
    reasoning: false,
    free: true,
  },
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
  [QWEN_3_CODER]: {
    displayName: "Qwen 3 Coder",
  },
  [QWEN_3_CODER_FREE]: {
    displayName: "(Free) Qwen 3 Coder",
    free: true,
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

  // From openrouter
  [HORIZON_BETA]: {
    displayName: "Horizon Beta",
    reasoning: false,
  },

  // From z-ai
  [Z_AI_4_5]: {
    displayName: "Z-AI 4.5",
    reasoning: true,
  },
  [Z_AI_4_5_AIR]: {
    displayName: "Z-AI 4.5 Air",
    reasoning: true,
  },
  [Z_AI_4_5_AIR_FREE]: {
    displayName: "(Free) Z-AI 4.5 Air",
    reasoning: true,
    free: true,
  },
};

export const DEFAULT_MODEL = GEMINI_FLASH_2_5;

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
