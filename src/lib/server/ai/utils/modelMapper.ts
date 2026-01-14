import type { ModelId } from "$lib/common/ai/models";
import {
  CLAUDE_SONNET_4,
  QWEN_3_CODER,
  GEMINI_2_5_PRO,
  GPT_4_1,
  DEEPSEEK_R1,
  CLAUDE_3_5_SONNET,
} from "$lib/common/ai/models";
import type { MessageCategory } from "../agents/classification";

/**
 * Maps message classification categories to appropriate ModelId values.
 * Each category is mapped to a model that best suits the task requirements.
 */
export function getModelForCategory(category: MessageCategory): ModelId {
  switch (category) {
    case "Conversational":
      // Fast, efficient model for casual conversation
      return CLAUDE_3_5_SONNET;
      
    case "Coding":
      // Specialized coding model
      return QWEN_3_CODER;
      
    case "Research":
      // High-quality model with broad knowledge
      return GEMINI_2_5_PRO;
      
    case "Creative":
      // Advanced model good at creative tasks
      return GPT_4_1;
      
    case "Analytical":
      // Reasoning-focused model for analysis
      return DEEPSEEK_R1;
      
    case "Personal Assistant":
      // Reliable, helpful model for task management
      return CLAUDE_SONNET_4;
      
    default:
      // Default fallback
      return CLAUDE_3_5_SONNET;
  }
}