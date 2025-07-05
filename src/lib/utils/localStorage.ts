import { GEMINI_FLASH_2_5, MODELS, type ModelId } from "$lib/common/ai/models";
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_ANSWERED_KEY } from "$lib/common/cookies";
import { browser } from "$app/environment";

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

// Cookie consent utilities
export type CookieConsentValue = "accepted" | "declined" | null;

export const getCookieConsent = (): CookieConsentValue => {
  if (!browser) return null;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent as CookieConsentValue;
};

export const setCookieConsent = (consent: CookieConsentValue) => {
  if (!browser) return;
  if (consent === null) {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } else {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  }
  // Mark that user has answered the consent prompt
  localStorage.setItem(COOKIE_CONSENT_ANSWERED_KEY, "true");
};

export const hasCookieConsentAnswered = (): boolean => {
  if (!browser) return false;
  return localStorage.getItem(COOKIE_CONSENT_ANSWERED_KEY) === "true";
};

// Create a rune-like reactive state for cookie consent
export const createCookieConsentState = () => {
  let consentValue = $state<CookieConsentValue>(getCookieConsent());
  let hasAnswered = $state<boolean>(hasCookieConsentAnswered());

  return {
    get consent() {
      return consentValue;
    },
    get hasAnswered() {
      return hasAnswered;
    },
    accept() {
      consentValue = "accepted";
      hasAnswered = true;
      setCookieConsent("accepted");
    },
    decline() {
      consentValue = "declined";
      hasAnswered = true;
      setCookieConsent("declined");
    },
    reset() {
      consentValue = null;
      hasAnswered = false;
      setCookieConsent(null);
      if (browser) {
        localStorage.removeItem(COOKIE_CONSENT_ANSWERED_KEY);
      }
    }
  };
};
