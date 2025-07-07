import { env } from "$env/dynamic/public";
import flagsmith from "flagsmith";
import { browser } from "$app/environment";

let isInitialized = false;

export const initializeFlagsmith = async (ssrFlags?: any) => {
  if (!browser || !env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY || isInitialized) {
    return;
  }

  try {
    await flagsmith.init({
      environmentID: env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY,
      api: env.PUBLIC_FLAGSMITH_API_URL || "https://edge.api.flagsmith.com/api/v1/",
      cacheFlags: true,
      enableLogs: false, // Set to true for debugging
      defaultFlags: ssrFlags || {},
    });
    
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Flagsmith:", error);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (!browser || !isInitialized) return;
  
  try {
    flagsmith.identify(userId, traits);
  } catch (error) {
    console.error("Failed to identify user with Flagsmith:", error);
  }
};

export const resetUser = () => {
  if (!browser || !isInitialized) return;
  
  try {
    flagsmith.logout();
  } catch (error) {
    console.error("Failed to reset Flagsmith user:", error);
  }
};

export const getFlagValue = (flagKey: string, defaultValue?: any) => {
  if (!browser || !isInitialized) return defaultValue;
  
  try {
    return flagsmith.getValue(flagKey) ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get flag value for ${flagKey}:`, error);
    return defaultValue;
  }
};

export const isFlagEnabled = (flagKey: string, defaultEnabled: boolean = false) => {
  if (!browser || !isInitialized) return defaultEnabled;
  
  try {
    return flagsmith.hasFeature(flagKey) ?? defaultEnabled;
  } catch (error) {
    console.error(`Failed to check flag enabled for ${flagKey}:`, error);
    return defaultEnabled;
  }
};

export { flagsmith };