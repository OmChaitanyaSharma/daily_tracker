export function handleDirectionalNavigation(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  if (!['w', 'a', 's', 'd'].includes(key)) return;

  const activeTag = document.activeElement?.tagName || '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
    if (document.activeElement?.hasAttribute('data-edit-mode')) return;
  }

  const focusableSelectors = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.opacity !== '0' && !el.hasAttribute('disabled');
    });

  if (elements.length === 0) return;

  // Check if we should ignore the event (e.g. modifier keys)
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

  e.preventDefault();

  let current = document.activeElement as HTMLElement;
  if (!current || !elements.includes(current)) {
    elements[0].focus();
    return;
  }

  const currentRect = current.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  };

  let bestMatch: HTMLElement | null = null;
  let minDistance = Infinity;

  elements.forEach(el => {
    if (el === current) return;
    const rect = el.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    let isValidDirection = false;
    
    const dx = center.x - currentCenter.x;
    const dy = center.y - currentCenter.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Primary cone check
    if (key === 'w' && dy < 0 && absDy >= absDx) isValidDirection = true;
    if (key === 's' && dy > 0 && absDy >= absDx) isValidDirection = true;
    if (key === 'a' && dx < 0 && absDx >= absDy) isValidDirection = true;
    if (key === 'd' && dx > 0 && absDx >= absDy) isValidDirection = true;

    // Fallback if no strict cone match but still in the right general direction
    if (!isValidDirection) {
        if (key === 'w' && dy < 0) isValidDirection = true;
        if (key === 's' && dy > 0) isValidDirection = true;
        if (key === 'a' && dx < 0) isValidDirection = true;
        if (key === 'd' && dx > 0) isValidDirection = true;
    }

    if (isValidDirection) {
      // Calculate effective off-axis distance, treating overlapping bounds as 0.
      // This prevents wide elements (like textareas) from being heavily penalized
      // when navigating vertically from a small element on the side.
      let effectiveDx = 0;
      if (currentCenter.x < rect.left) effectiveDx = rect.left - currentCenter.x;
      else if (currentCenter.x > rect.right) effectiveDx = currentCenter.x - rect.right;

      let effectiveDy = 0;
      if (currentCenter.y < rect.top) effectiveDy = rect.top - currentCenter.y;
      else if (currentCenter.y > rect.bottom) effectiveDy = currentCenter.y - rect.bottom;

      // Heuristic distance: heavily penalize true off-axis distance
      let distance = 0;
      if (key === 'w' || key === 's') {
        distance = absDy + (effectiveDx * 4);
      } else {
        distance = absDx + (effectiveDy * 4);
      }

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = el;
      }
    }
  });

  if (bestMatch) {
    (bestMatch as HTMLElement).focus();
  }
}
