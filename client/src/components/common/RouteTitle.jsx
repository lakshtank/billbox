import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'BillBox';

/**
 * Static route -> title map. Dynamic segments are handled by the prefix rules
 * below so a detail page still gets a meaningful title before its data loads.
 */
const EXACT = {
  '/': 'Overview',
  '/login': 'Sign in',
  '/register': 'Create account',
  '/receipts': 'Receipts',
  '/receipts/new': 'Add receipt',
  '/products': 'Products',
  '/warranties': 'Warranties',
  '/stores': 'Merchants',
  '/reminders': 'Reminders',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

const PREFIXES = [
  ['/receipts/batch/', 'Batch review'],
  ['/receipts/', 'Receipt'],
  ['/products/', 'Product'],
  ['/stores/', 'Merchant'],
  ['/public/r/', 'Shared receipt'],
];

const titleForPath = (pathname) => {
  if (EXACT[pathname]) return EXACT[pathname];
  const match = PREFIXES.find(([prefix]) => pathname.startsWith(prefix));
  if (match) return match[1];
  return 'Page not found';
};

/**
 * Keeps document.title in sync with the active route.
 * Mounted once inside the Router; individual pages may override by calling
 * setDocumentTitle with a more specific value once their data has loaded.
 */
const RouteTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${titleForPath(pathname)} · ${BASE}`;
  }, [pathname]);

  return null;
};

export default RouteTitle;
