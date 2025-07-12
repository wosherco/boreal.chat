<!-- Extracted from https://codepen.io/nzbin/pen/GGrXbp. Created by [nzbin](https://github.com/nzbin). MIT License. -->
<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    class?: string;
  }

  const { class: className }: Props = $props();
</script>

<div
  class={cn("dot-falling", className)}
  style="--three-dots-streaming-color: var(--foreground)"
></div>

<style>
  /**
 * ==============================================
 * Dot Falling
 * ==============================================
 */
  .dot-falling {
    position: relative;
    left: -9999px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: var(--three-dots-streaming-color);
    color: var(--three-dots-streaming-color);
    box-shadow: 9999px 0 0 0 var(--three-dots-streaming-color);
    animation: dot-falling 1s infinite linear;
    animation-delay: 0.1s;
  }
  .dot-falling::before,
  .dot-falling::after {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0;
  }
  .dot-falling::before {
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: var(--three-dots-streaming-color);
    color: var(--three-dots-streaming-color);
    animation: dot-falling-before 1s infinite linear;
    animation-delay: 0s;
  }
  .dot-falling::after {
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: var(--three-dots-streaming-color);
    color: var(--three-dots-streaming-color);
    animation: dot-falling-after 1s infinite linear;
    animation-delay: 0.2s;
  }

  @keyframes dot-falling {
    0% {
      box-shadow: 9999px -15px 0 0 transparent;
    }
    25%,
    50%,
    75% {
      box-shadow: 9999px 0 0 0 var(--three-dots-streaming-color);
    }
    100% {
      box-shadow: 9999px 15px 0 0 transparent;
    }
  }
  @keyframes dot-falling-before {
    0% {
      box-shadow: 9984px -15px 0 0 transparent;
    }
    25%,
    50%,
    75% {
      box-shadow: 9984px 0 0 0 var(--three-dots-streaming-color);
    }
    100% {
      box-shadow: 9984px 15px 0 0 transparent;
    }
  }
  @keyframes dot-falling-after {
    0% {
      box-shadow: 10014px -15px 0 0 transparent;
    }
    25%,
    50%,
    75% {
      box-shadow: 10014px 0 0 0 var(--three-dots-streaming-color);
    }
    100% {
      box-shadow: 10014px 15px 0 0 transparent;
    }
  }
</style>
