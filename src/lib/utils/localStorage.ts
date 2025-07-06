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

const HAS_ASKED_TRACKING_CONSENT_KEY = "has_asked_tracking_consent";

export const hasAskedTrackingConsent = (): boolean => {
  const consent = localStorage.getItem(HAS_ASKED_TRACKING_CONSENT_KEY);

  return consent === "true";
};

export const setHasAskedTrackingConsent = (consent: boolean) => {
  localStorage.setItem(HAS_ASKED_TRACKING_CONSENT_KEY, consent.toString());
};
