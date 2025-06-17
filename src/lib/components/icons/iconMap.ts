import type { ModelId } from "$lib/common/ai/models";
import type { Component } from "svelte";
import GeminiIcon from "./GeminiIcon.svelte";
import {
  GEMINI_2_5_PRO,
  GEMINI_FLASH_2_5,
  GEMINI_FLASH_2_0,
  GEMINI_FLASH_2_0_FREE,
  GPT_4O,
  GPT_4O_MINI,
  GPT_O4_MINI,
  GPT_O4_MINI_HIGH,
  GPT_4_1,
  GPT_4_1_NANO,
  GPT_4_1_MINI,
  CLAUDE_OPUS_4,
  CLAUDE_SONNET_4,
  CLAUDE_3_7_SONNET,
  CLAUDE_3_5_SONNET,
  DEEPSEEK_R1,
  DEEPSEEK_R1_FREE,
  DEEPSEEK_V3,
  DEEPSEEK_V3_FREE,
  LLAMA_4_MAVERICK,
  LLAMA_4_MAVERICK_FREE,
  LLAMA_4_SCOUT,
  LLAMA_4_SCOUT_FREE,
  QWEN_3_30B_A3B,
  GROK_3_BETA,
  GROK_3_MINI_BETA,
} from "$lib/common/ai/models";
import OpenAiIcon from "./OpenAIIcon.svelte";
import AnthropicIcon from "./AnthropicIcon.svelte";
import DeepseekIcon from "./DeepseekIcon.svelte";
import MetaIcon from "./MetaIcon.svelte";
import QwenIcon from "./QwenIcon.svelte";
import GrokIcon from "./GrokIcon.svelte";

export const ICON_MAP: Record<ModelId, Component> = {
  // From google
  [GEMINI_2_5_PRO]: GeminiIcon,
  [GEMINI_FLASH_2_5]: GeminiIcon,
  [GEMINI_FLASH_2_0]: GeminiIcon,
  [GEMINI_FLASH_2_0_FREE]: GeminiIcon,

  // From openai
  [GPT_4O]: OpenAiIcon,
  [GPT_4O_MINI]: OpenAiIcon,
  [GPT_O4_MINI]: OpenAiIcon,
  [GPT_O4_MINI_HIGH]: OpenAiIcon,
  [GPT_4_1]: OpenAiIcon,
  [GPT_4_1_NANO]: OpenAiIcon,
  [GPT_4_1_MINI]: OpenAiIcon,

  // From anthropic
  [CLAUDE_OPUS_4]: AnthropicIcon,
  [CLAUDE_SONNET_4]: AnthropicIcon,
  [CLAUDE_3_7_SONNET]: AnthropicIcon,
  [CLAUDE_3_5_SONNET]: AnthropicIcon,

  // From deepseek
  [DEEPSEEK_R1]: DeepseekIcon,
  [DEEPSEEK_R1_FREE]: DeepseekIcon,
  [DEEPSEEK_V3]: DeepseekIcon,
  [DEEPSEEK_V3_FREE]: DeepseekIcon,

  // From meta
  [LLAMA_4_MAVERICK]: MetaIcon,
  [LLAMA_4_MAVERICK_FREE]: MetaIcon,
  [LLAMA_4_SCOUT]: MetaIcon,
  [LLAMA_4_SCOUT_FREE]: MetaIcon,

  // From qwen
  [QWEN_3_30B_A3B]: QwenIcon,

  // From xAi
  [GROK_3_BETA]: GrokIcon,
  [GROK_3_MINI_BETA]: GrokIcon,
};
