import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";
import flagsmith from "flagsmith/isomorphic";

let initialized = false;

export const initializeFlagsmith = (serverState?: any) => {
  if (browser && !initialized && env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY) {
    console.log("Initializing client-side Flagsmith with server state", serverState);
    flagsmith.init({
      environmentID: env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY,
      state: serverState,
      enableLogs: false, // Set to true for debugging
      onChange: () => {
        // Flags have changed
        console.log("Flagsmith flags updated");
      }
    });
    initialized = true;
  }
};

// Helper functions that use defaults if Flagsmith isn't available
export const getFlagValue = (flagKey: string, defaultValue?: any) => {
  if (!browser || !initialized) return defaultValue;
  return flagsmith.getValue(flagKey) ?? defaultValue;
};

export const isFlagEnabled = (flagKey: string, defaultEnabled: boolean = false) => {
  if (!browser || !initialized) return defaultEnabled;
  return flagsmith.hasFeature(flagKey) ?? defaultEnabled;
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (browser && initialized) {
    flagsmith.identify(userId, traits);
  }
};

export const logout = () => {
  if (browser && initialized) {
    flagsmith.logout();
  }
};

// Export the flagsmith instance for direct access
export { flagsmith };