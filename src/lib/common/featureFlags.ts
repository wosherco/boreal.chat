import { browser } from "$app/environment";

// Feature flag keys and defaults
export const FEATURE_FLAGS = {
  BILLING: {
    key: "billing",
    defaultEnabled: false,
    defaultValue: null,
  },
  SHOW_FOOTER_ICONS: {
    key: "show_footer_icons", 
    defaultEnabled: true,
    defaultValue: null,
  },
} as const;

// Legacy exports for backward compatibility
export const BILLING_FEATURE_FLAG = FEATURE_FLAGS.BILLING.key;
