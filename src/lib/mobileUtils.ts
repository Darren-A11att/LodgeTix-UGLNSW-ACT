/**
 * Mobile utilities to enhance the mobile experience
 */

/**
 * Initializes mobile-specific features
 */
export const initMobileFeatures = (): void => {
  setupBottomSheet();
  setupFastClick();
  setupFormValidationImprovements();
};

/**
 * Sets up the bottom sheet interactions
 */
const setupBottomSheet = (): void => {
  // Get all bottom sheet elements
  const bottomSheets = document.querySelectorAll('.mobile-bottom-sheet');
  
  bottomSheets.forEach(sheet => {
    const handle = sheet.querySelector('.mobile-bottom-sheet-handle');
    if (!handle) return;
    
    // Set up drag to expand/collapse
    let startY = 0;
    let startHeight = 0;
    
    const onDragStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startHeight = (sheet as HTMLElement).offsetHeight;
      
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    };
    
    const onDragMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = e.touches[0].clientY - startY;
      const newHeight = startHeight - deltaY;
      
      // Limit the height between 20% and 80% of viewport height
      const minHeight = window.innerHeight * 0.2;
      const maxHeight = window.innerHeight * 0.8;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        (sheet as HTMLElement).style.height = `${newHeight}px`;
      }
    };
    
    const onDragEnd = () => {
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
      
      // Snap to either expanded or collapsed state
      const sheetHeight = (sheet as HTMLElement).offsetHeight;
      const viewportHeight = window.innerHeight;
      
      if (sheetHeight < viewportHeight * 0.4) {
        // Collapse
        sheet.classList.add('mobile-bottom-sheet-closed');
      } else {
        // Expand
        (sheet as HTMLElement).style.height = `${viewportHeight * 0.7}px`;
      }
    };
    
    handle.addEventListener('touchstart', onDragStart);
    
    // Double tap to expand/collapse
    let lastTap = 0;
    handle.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        if (sheet.classList.contains('mobile-bottom-sheet-closed')) {
          sheet.classList.remove('mobile-bottom-sheet-closed');
          (sheet as HTMLElement).style.height = `${window.innerHeight * 0.7}px`;
        } else {
          sheet.classList.add('mobile-bottom-sheet-closed');
        }
        e.preventDefault();
      }
      
      lastTap = currentTime;
    });
  });
};

/**
 * Eliminates 300ms tap delay on mobile devices
 */
const setupFastClick = (): void => {
  if ('ontouchstart' in window) {
    // iOS or Android
    document.addEventListener('DOMContentLoaded', () => {
      // Add touch-action: manipulation to all clickable elements
      const clickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
      clickables.forEach(el => {
        (el as HTMLElement).style.touchAction = 'manipulation';
      });
    });
  }
};

/**
 * Improves form validation experience on mobile
 */
const setupFormValidationImprovements = (): void => {
  document.addEventListener('DOMContentLoaded', () => {
    // Get all form elements
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Prevent double submission
      form.addEventListener('submit', (e) => {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && !submitButton.hasAttribute('data-submitting')) {
          submitButton.setAttribute('data-submitting', 'true');
          submitButton.setAttribute('disabled', 'true');
          
          // Re-enable after 3 seconds if form submission fails
          setTimeout(() => {
            submitButton.removeAttribute('data-submitting');
            submitButton.removeAttribute('disabled');
          }, 3000);
        }
      });
      
      // Mobile-friendly validation
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        // Show validation messages immediately on blur
        input.addEventListener('blur', () => {
          if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
            if (input.checkValidity()) {
              input.classList.remove('border-red-500');
              
              // Remove any existing error message
              const errorMsgId = `${input.id || ''}-error`;
              const errorMsg = document.getElementById(errorMsgId);
              if (errorMsg) {
                errorMsg.remove();
              }
            } else {
              input.classList.add('border-red-500');
              
              // Add error message if not already present
              const errorMsgId = `${input.id || ''}-error`;
              if (!document.getElementById(errorMsgId)) {
                const errorMsg = document.createElement('p');
                errorMsg.id = errorMsgId;
                errorMsg.className = 'text-red-500 text-sm mt-1';
                errorMsg.textContent = input.validationMessage;
                input.parentNode?.appendChild(errorMsg);
              }
            }
          }
        });
      });
    });
  });
};

/**
 * Checks if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
