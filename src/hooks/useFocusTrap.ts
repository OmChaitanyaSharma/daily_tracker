import { useEffect, useRef } from 'react';

/**
 * useFocusTrap
 * Traps keyboard focus within an active modal dialog (WCAG 2.2 AA SC 2.1.2)
 * Ensures Shift+Tab and Tab wrap around, auto-focuses first focusable element,
 * and calls onEscape when Escape key is pressed.
 */
export function useFocusTrap(isActive: boolean, onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = [
      'button:not([disabled]):not([aria-hidden="true"])',
      '[href]:not([aria-hidden="true"])',
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
    ].join(', ');

    // Store the element that had focus before modal opened
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside the modal container
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
    let timer: any;
    if (focusables.length > 0) {
      // Small timeout to allow DOM to finish rendering
      timer = setTimeout(() => {
        focusables[0].focus();
      }, 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const currentFocusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
        if (currentFocusables.length === 0) return;

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
}
