/**
 * Route preloading utility to ensure instant, zero-delay navigation without blank screens.
 * Preloads application routes and prefetches query data on navigation hover/focus and background idle.
 */
import api from '../api/axios';
import { queryClient } from './queryClient';
import { fetchCategories } from '../queries/useCategoryQueries';

export const routeLoaders = {
  dashboard: () => import('../pages/Dashboard'),
  overview: () => import('../pages/Dashboard'),
  receipts: () => import('../pages/Receipts'),
  receiptDetail: () => import('../pages/ReceiptDetail'),
  products: () => import('../pages/Products'),
  productDetail: () => import('../pages/ProductDetail'),
  stores: () => import('../pages/Stores'),
  storeDetail: () => import('../pages/StoreDetail'),
  reminders: () => import('../pages/ReminderCenter'),
  warranties: () => import('../pages/WarrantyTracker'),
  addReceipt: () => import('../pages/AddReceipt'),
  batchReview: () => import('../pages/BatchReview'),
  landing: () => import('../pages/LandingPage'),
  profile: () => import('../pages/Profile'),
  settings: () => import('../pages/Settings'),
};

export const routeQueryPrefetchers = {
  dashboard: () => {
    queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: async () => {
        const { data } = await api.get('/dashboard/stats');
        return data.data;
      },
    });
  },
  overview: () => {
    queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: async () => {
        const { data } = await api.get('/dashboard/stats');
        return data.data;
      },
    });
  },
  receipts: () => {
    queryClient.prefetchQuery({
      queryKey: ['receipts', { page: 1, limit: 25, sortBy: 'date-desc' }],
      queryFn: async () => {
        const { data } = await api.get('/receipts', { params: { page: 1, limit: 25, sortBy: 'date-desc' } });
        return data.data;
      },
    });
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: fetchCategories,
    });
  },
  products: () => {
    queryClient.prefetchQuery({
      queryKey: ['products', { page: 1, limit: 20, sortBy: 'createdAt-desc' }],
      queryFn: async () => {
        const { data } = await api.get('/products', { params: { page: 1, limit: 20, sortBy: 'createdAt-desc' } });
        return data.data;
      },
    });
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: fetchCategories,
    });
  },
  warranties: () => {
    queryClient.prefetchQuery({
      queryKey: ['products', { limit: 5000 }],
      queryFn: async () => {
        const { data } = await api.get('/products', { params: { limit: 5000 } });
        return data.data;
      },
    });
  },
  stores: () => {
    queryClient.prefetchQuery({
      queryKey: ['stores', { page: 1, limit: 20, sortBy: 'spend_desc' }],
      queryFn: async () => {
        const { data } = await api.get('/stores', { params: { page: 1, limit: 20, sortBy: 'spend_desc' } });
        return data.data;
      },
    });
  },
  reminders: () => {
    queryClient.prefetchQuery({
      queryKey: ['reminders', { search: '' }],
      queryFn: async () => {
        const { data } = await api.get('/reminders', { params: { search: '' } });
        return data.data;
      },
    });
  },
};

const preloadedPromises = new Map();

/**
 * Preload an individual route module immediately.
 * Caches in-flight and completed promises so a module is never fetched twice.
 */
export function preloadRoute(name) {
  if (preloadedPromises.has(name)) {
    return preloadedPromises.get(name);
  }

  const loader = routeLoaders[name];
  if (typeof loader === 'function') {
    const promise = loader().catch((err) => {
      preloadedPromises.delete(name);
      console.warn(`[RoutePreloader] Failed to preload route "${name}":`, err?.message);
    });
    preloadedPromises.set(name, promise);
    return promise;
  }
  return Promise.resolve();
}

/**
 * High-performance route prefetcher:
 * Simultaneously warms both the JavaScript bundle and the TanStack Query API cache.
 * When the user clicks the link, the page renders instantly with 0ms waiting!
 */
export function prefetchRoute(name) {
  // Preload code bundle
  preloadRoute(name);

  // Preload API query data if authenticated
  if (typeof window !== 'undefined' && localStorage.getItem('billbox_token')) {
    const prefetchData = routeQueryPrefetchers[name];
    if (typeof prefetchData === 'function') {
      try {
        prefetchData();
      } catch {
        // Safe silent fallback
      }
    }
  }
}

/**
 * Staggered background preloading for primary app routes and data.
 * Waits 1 second after initial boot so active page API requests are never contested.
 * Then loads primary routes sequentially with a 150ms gap to keep dev and prod networks silky smooth.
 */
export function preloadAllRoutes() {
  if (typeof window === 'undefined') return;

  const priorityRoutes = [
    'receipts',
    'receiptDetail',
    'stores',
    'products',
    'productDetail',
    'warranties',
    'reminders',
    'settings',
    'profile',
    'addReceipt',
  ];

  let timerId = null;

  const startStaggeredQueue = () => {
    let index = 0;

    const loadNext = () => {
      if (index >= priorityRoutes.length) return;
      const routeName = priorityRoutes[index++];
      prefetchRoute(routeName);
      timerId = setTimeout(loadNext, 180);
    };

    loadNext();
  };

  const initialDelay = 1200;

  if ('requestIdleCallback' in window) {
    window.setTimeout(() => {
      window.requestIdleCallback(startStaggeredQueue, { timeout: 3000 });
    }, initialDelay);
  } else {
    window.setTimeout(startStaggeredQueue, initialDelay);
  }

  return () => {
    if (timerId) clearTimeout(timerId);
  };
}

export default preloadAllRoutes;
