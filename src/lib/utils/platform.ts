export const isMac =
  typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

export const controlKeyName = isMac ? "⌘" : "Ctrl";
