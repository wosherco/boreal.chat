import { browser } from "$app/environment";

export interface FeatureFlag {
  key: string;
  defaultEnabled: boolean;
  defaultValue?: any;
  description?: string;
}

// Feature Flag Definitions
export const FEATURE_FLAGS = {
  BILLING: {
    key: "billing",
    defaultEnabled: false,
    defaultValue: null,
    description: "Enable billing and subscription features",
  },
  SHOW_FOOTER_ICONS: {
    key: "show_footer_icons", 
    defaultEnabled: true,
    defaultValue: null,
    description: "Show social media icons in the footer",
  },
} as const satisfies Record<string, FeatureFlag>;

// Helper function to get feature flag value (to be used after Flagsmith is initialized)
export const getFeatureFlagState = (flag: FeatureFlag): { enabled: boolean; value: any } => {
  return {
    enabled: flag.defaultEnabled,
    value: flag.defaultValue,
  };
};

// Legacy exports for backward compatibility
export const BILLING_FEATURE_FLAG = FEATURE_FLAGS.BILLING.key;
