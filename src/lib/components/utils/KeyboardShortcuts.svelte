<script lang="ts">
  interface Props {
    combos: {
      key: string;
      isControl?: boolean;
      isShift?: boolean;
      isAlt?: boolean;
      validate?: (event: KeyboardEvent) => boolean;
      callback: () => void;
      needsFocusedElement?: HTMLElement;
    }[];
  }

  let { combos }: Props = $props();

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

  function handleKeyDown(event: KeyboardEvent) {
    const ctrlPressed = isMac ? event.metaKey : event.ctrlKey;

    const combo = combos.find((combo) => {
      return (
        combo.key.toLowerCase() === event.key.toLowerCase() &&
        (combo.isControl ?? false) === ctrlPressed &&
        (combo.isShift ?? false) === event.shiftKey &&
        (combo.isAlt ?? false) === event.altKey &&
        (combo.validate?.(event) ?? true) &&
        (combo.needsFocusedElement ? combo.needsFocusedElement === event.target : true)
      );
    });

    if (combo) {
      event.preventDefault();
      event.stopPropagation();
      combo.callback();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />
