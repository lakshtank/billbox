import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Stores from './pages/Stores';
import StoreDetail from './pages/StoreDetail';
import ReminderCenter from './pages/ReminderCenter';
import AddReceipt from './pages/AddReceipt';
import WarrantyTracker from './pages/WarrantyTracker';
import BatchReview from './pages/BatchReview';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PublicReceipt from './pages/PublicReceipt';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/common/ErrorBoundary';
import useAuth from './hooks/useAuth';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';
  const isPublicPage = location.pathname.startsWith('/public/');
  const showSidebar = isAuthenticated && !isAuthPage && !isPublicPage;

  if (isPublicPage) {
    return (
      <div className="min-h-screen w-screen overflow-y-auto bg-slate-50">
        <Routes>
          <Route path="/public/r/:publicToken" element={<PublicReceipt />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg-app">
      <Navbar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public/r/:publicToken" element={<PublicReceipt />} />
            <Route
              path="/"
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
              path="/stores/:storeName"
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
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            },
          }}
        />
        <ErrorBoundary>
          <AppLayout />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
