import * as React from 'react';

/**
 * Step 14.1 Lenis Smooth Scroll
 * Transparent wrapper that ensures native mouse wheel scrolling is preserved
 * across all desktop viewports and scrollable containers without event cancellation.
 */
export function SmoothScroll({ children }) {
  return <>{children}</>;
}

export default SmoothScroll;

