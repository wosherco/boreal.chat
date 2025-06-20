import { GEMINI_FLASH_2_5, MODELS, type ModelId } from "$lib/common/ai/models";

const LAST_SELECTED_MODEL_KEY = "last_selected_model";

export const getLastSelectedModel = (): ModelId => {
  const model = localStorage.getItem(LAST_SELECTED_MODEL_KEY);

  if (!model || !MODELS.includes(model as ModelId)) {
    return GEMINI_FLASH_2_5;
  }

  return model as ModelId;
};

export const setLastSelectedModel = (model: ModelId) => {
  localStorage.setItem(LAST_SELECTED_MODEL_KEY, model);
};
