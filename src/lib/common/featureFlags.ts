import type { IFlagsmith } from "flagsmith";
import { getContext, setContext } from "svelte";

const FLAGSMITH_CONTEXT_KEY = {};

export interface FeatureFlag {
  name: string;
  defaultToggle: boolean;
}

export const FILES_FEATURE_FLAG: FeatureFlag = {
  name: "files",
  defaultToggle: false,
};

export function getFeatureFlag(flag: FeatureFlag): { enabled: boolean; value: undefined } {
  const flagsmith = getFlagsmithContext();

  if (!flagsmith) {
    return {
      enabled: flag.defaultToggle,
      value: undefined,
    };
  }

  const flagValue = flagsmith.hasFeature(flag.name, {
    fallback: flag.defaultToggle,
  });

  return {
    enabled: flagValue,
    value: undefined,
  };
}

export function setFlagsmithContext(flagsmith: IFlagsmith) {
  setContext(FLAGSMITH_CONTEXT_KEY, flagsmith);
}

export function getFlagsmithContext() {
  return getContext(FLAGSMITH_CONTEXT_KEY) as IFlagsmith | undefined;
}
