import * as React from 'react';

/**
 * ScrollContainerContext provides the ref of the primary scrollable container (<main id="main">)
 * so that layout chrome components like Navbar and BottomTabBar can monitor scroll position
 * via motion's useScroll({ container: scrollRef }).
 */
export const ScrollContainerContext = React.createContext({ current: null });

export function useScrollContainer() {
  return React.useContext(ScrollContainerContext);
}
