import type { Attachment } from "svelte/attachments";

interface HoldOptions {
  /**
   * The duration in milliseconds to wait before calling onHold.
   * @default 500
   */
  duration?: number;
  /**
   * The callback function to execute when the hold is successful.
   */
  onHold: () => void;
}

const RIPPLE_ANIMATION_KEYFRAMES = `
@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

let styleSheet: HTMLStyleElement | null = null;

function ensureRippleStyleSheet() {
  if (
    styleSheet ||
    typeof document === "undefined" ||
    document.getElementById("ripple-effect-styles")
  ) {
    return;
  }
  styleSheet = document.createElement("style");
  styleSheet.id = "ripple-effect-styles";
  styleSheet.textContent = RIPPLE_ANIMATION_KEYFRAMES;
  document.head.appendChild(styleSheet);
}

/**
 * An attachment that triggers a callback on hold and shows a ripple effect.
 *
 * @example
 * ```svelte
 * <script>
 *   import { hold } from './hold';
 *   function handleHold() {
 *     console.log('Held!');
 *   }
 * </script>
 *
 * <button {@attach hold({ onHold: handleHold, duration: 300 })}>
 *  Hold me
 * </button>
 * ```
 */
export function hold({ onHold, duration = 500 }: HoldOptions): Attachment {
  return (el) => {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const element = el;

    ensureRippleStyleSheet();
    let timer: number | null = null;
    let holdIndicatorTimer: number | null = null;
    let startX = 0;
    let startY = 0;
    const moveThreshold = 10; // pixels
    let holdIndicator: HTMLSpanElement | null = null;

    // For the ripple effect to be contained.
    const originalPosition = element.style.position;
    if (getComputedStyle(element).position === "static") {
      element.style.position = "relative";
    }
    const originalOverflow = element.style.overflow;
    element.style.overflow = "hidden";
    const originalUserSelect = element.style.userSelect;

    function createRipple(x: number, y: number) {
      const ripple = document.createElement("span");
      const rect = element.getBoundingClientRect();

      const rippleX = x - rect.left;
      const rippleY = y - rect.top;

      const size = Math.max(rect.width, rect.height);
      const radius = size / 2;

      Object.assign(ripple.style, {
        position: "absolute",
        left: `${rippleX - radius}px`,
        top: `${rippleY - radius}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "currentColor",
        opacity: "0.2",
        transform: "scale(0)",
        animation: "ripple-effect 0.6s linear",
        pointerEvents: "none",
      });

      element.appendChild(ripple);

      ripple.addEventListener("animationend", () => {
        ripple.remove();
      });
    }

    function preventContextMenu(e: Event) {
      e.preventDefault();
    }

    function startPress(event: PointerEvent) {
      if (event.pointerType !== "touch") {
        return;
      }
      element.style.userSelect = "none";
      element.addEventListener("contextmenu", preventContextMenu);

      startX = event.clientX;
      startY = event.clientY;

      createRipple(event.clientX, event.clientY);

      const holdIndicatorDelay = 150;
      holdIndicatorTimer = window.setTimeout(() => {
        holdIndicatorTimer = null;
        if (holdIndicator) {
          holdIndicator.remove();
        }
        holdIndicator = document.createElement("span");
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        Object.assign(holdIndicator.style, {
          position: "absolute",
          left: `50%`,
          top: `50%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "currentColor",
          opacity: "0.1",
          transform: "translate(-50%, -50%) scale(0)",
          transition: `transform ${duration - holdIndicatorDelay}ms linear, opacity 0.3s linear`,
          pointerEvents: "none",
        });
        element.appendChild(holdIndicator);
        requestAnimationFrame(() => {
          if (holdIndicator) {
            holdIndicator.style.transform = "translate(-50%, -50%) scale(1)";
          }
        });
      }, holdIndicatorDelay);

      timer = window.setTimeout(() => {
        timer = null;
        onHold();

        if (holdIndicator) {
          holdIndicator.style.opacity = "0";
          holdIndicator.addEventListener("transitionend", () => holdIndicator?.remove());
          holdIndicator = null;
        }
      }, duration);
    }

    function cancelPress() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (holdIndicatorTimer) {
        clearTimeout(holdIndicatorTimer);
        holdIndicatorTimer = null;
      }
      if (holdIndicator) {
        holdIndicator.style.opacity = "0";
        holdIndicator.addEventListener("transitionend", () => {
          holdIndicator?.remove();
        });
        holdIndicator = null;
      }
      element.style.userSelect = originalUserSelect;
      element.removeEventListener("contextmenu", preventContextMenu);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!timer) return;

      const dx = Math.abs(event.clientX - startX);
      const dy = Math.abs(event.clientY - startY);

      if (dx > moveThreshold || dy > moveThreshold) {
        cancelPress();
      }
    }

    element.addEventListener("pointerdown", startPress);
    element.addEventListener("pointerup", cancelPress);
    element.addEventListener("pointerleave", cancelPress);
    element.addEventListener("pointermove", handlePointerMove);

    return () => {
      // Restore original styles
      element.style.position = originalPosition;
      element.style.overflow = originalOverflow;
      element.style.userSelect = originalUserSelect;

      cancelPress(); // clean up timer
      element.removeEventListener("pointerdown", startPress);
      element.removeEventListener("pointerup", cancelPress);
      element.removeEventListener("pointerleave", cancelPress);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("contextmenu", preventContextMenu);
    };
  };
}
