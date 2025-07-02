import { browser } from "$app/environment";

let initialViewportHeight = 0;
let isKeyboardOpen = false;

export function initializeMobileKeyboardHandler() {
  if (!browser) return;
  
  initialViewportHeight = window.innerHeight;
  
  function handleViewportChange() {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // If height decreased by more than 150px, assume keyboard is open
    const keyboardThreshold = 150;
    const wasKeyboardOpen = isKeyboardOpen;
    isKeyboardOpen = heightDifference > keyboardThreshold;
    
    // Update CSS custom properties
    const vh = currentHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Add/remove keyboard open class for additional styling
    if (isKeyboardOpen !== wasKeyboardOpen) {
      document.documentElement.classList.toggle('keyboard-open', isKeyboardOpen);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('keyboardToggle', { 
        detail: { isOpen: isKeyboardOpen, height: currentHeight } 
      }));
    }
  }
  
  // Handle resize with debouncing
  let resizeTimeout: number;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleViewportChange, 100);
  }
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportChange, 500); // Delay for orientation change
  });
  
  // Handle visual viewport API if available (better for keyboard detection)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
  }
  
  // Initial setup
  handleViewportChange();
  
  return () => {
    window.removeEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
    }
    clearTimeout(resizeTimeout);
  };
}

export function isKeyboardVisible(): boolean {
  return isKeyboardOpen;
}