import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import CommandPalette from './components/common/CommandPalette';
import ShortcutModal from './components/common/ShortcutModal';
import { AuthProvider } from './context/AuthContext';
import { ScrollContainerContext } from './context/ScrollContainerContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import BottomTabBar from './components/common/BottomTabBar';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteTitle from './components/common/RouteTitle';
import AnimatedOutlet from './components/common/AnimatedOutlet';
import { ViewTransitionProvider } from './context/ViewTransitionContext';
import useAuth from './hooks/useAuth';
import useGlobalShortcuts from './hooks/useGlobalShortcuts';
import { preloadAllRoutes } from './lib/routePreloader';

// Lazy-loaded route components for performance optimization & code-splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Receipts = lazy(() => import('./pages/Receipts'));
const ReceiptDetail = lazy(() => import('./pages/ReceiptDetail'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Stores = lazy(() => import('./pages/Stores'));
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const ReminderCenter = lazy(() => import('./pages/ReminderCenter'));
const AddReceipt = lazy(() => import('./pages/AddReceipt'));
const WarrantyTracker = lazy(() => import('./pages/WarrantyTracker'));
const BatchReview = lazy(() => import('./pages/BatchReview'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicReceipt = lazy(() => import('./pages/PublicReceipt'));
const NotFound = lazy(() => import('./pages/NotFound'));
import RouteSkeleton from './components/common/RouteSkeleton';

// Route Suspense fallback with skeleton layout for seamless transitions
const PageLoader = () => <RouteSkeleton />;

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const mainRef = useRef(null);

  // Offline detection banner (Step 21)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Preload all route chunks in the background during browser idle time so unvisited pages load instantly
  useEffect(() => {
    preloadAllRoutes();
  }, []);

  // Register global keyboard navigation (g+o, g+r, n, ?, etc.)
  useGlobalShortcuts();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password');
  const isPublicPage = location.pathname.startsWith('/public/');
  const showSidebar = isAuthenticated && !isAuthPage && !isPublicPage;

  if (isPublicPage) {
    return (
      <div className="h-full w-full overflow-y-auto bg-surface">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/public/r/:publicToken" element={<PublicReceipt />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="min-h-dvh h-full w-full overflow-y-auto bg-bg-app font-sans">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <ScrollContainerContext.Provider value={mainRef}>
      <div className="fixed inset-0 overflow-hidden flex bg-bg-app font-sans">
        {/* Step 10.1 Desktop/Tablet Sidebar (Full Height Left Frame) */}
        {showSidebar && <Sidebar />}

        {/* Right Column: Topbar (56px) + Scrollable Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Step 21 Offline Banner */}
          {!isOnline && (
            <div
              role="status"
              className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-1 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>You're offline. Changes won't be saved.</span>
            </div>
          )}

          <Navbar />

          {/* Skip to Content Link (Step 24 Accessibility) */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-toast focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-fg focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent text-xs font-semibold"
          >
            Skip to content
          </a>

          <main ref={mainRef} id="main" tabIndex="-1" className="flex-1 min-w-0 h-full overflow-y-auto pb-20 md:pb-8 focus:outline-none bg-bg-app">
          <div className="max-w-[1280px] mx-auto px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 min-h-full">
            <Routes>
              <Route element={<AnimatedOutlet />}>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <ProtectedRoute>
                        <Products />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <ProtectedRoute>
                        <ProductDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stores"
                    element={
                      <ProtectedRoute>
                        <Stores />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stores/:storeName/*"
                    element={
                      <ProtectedRoute>
                        <StoreDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stores/:storeName"
                    element={
                      <ProtectedRoute>
                        <StoreDetail />
                      </ProtectedRoute>
                    }
                  />
                  {/* Route alias: /merchants navigates to Stores */}
                  <Route
                    path="/merchants"
                    element={
                      <ProtectedRoute>
                        <Stores />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/merchants/:storeName"
                    element={
                      <ProtectedRoute>
                        <StoreDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reminders"
                    element={
                      <ProtectedRoute>
                        <ReminderCenter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts"
                    element={
                      <ProtectedRoute>
                        <Receipts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/warranties"
                    element={
                      <ProtectedRoute>
                        <WarrantyTracker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts/new"
                    element={
                      <ProtectedRoute>
                        <AddReceipt />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts/batch/:batchId"
                    element={
                      <ProtectedRoute>
                        <BatchReview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts/:id"
                    element={
                      <ProtectedRoute>
                        <ReceiptDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
          </div>
        </main>

        {/* Step 10.4 Mobile Bottom Tab Bar (<768px) */}
        {showSidebar && <BottomTabBar />}
      </div>
    </div>
    </ScrollContainerContext.Provider>
  );
};

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ViewTransitionProvider>
        <AuthProvider>
          <RouteTitle />
          <SonnerToaster position="bottom-right" />
          <CommandPalette />
          <ShortcutModal />
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        </AuthProvider>
      </ViewTransitionProvider>
    </BrowserRouter>
  );
};

export default App;
