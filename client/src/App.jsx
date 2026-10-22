import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthFrame from './components/AuthFrame.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Code-split dashboard routes on demand for smaller initial load
const DashboardLayout = lazy(() => import('./components/DashboardLayout.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const FoodListingPage = lazy(() => import('./pages/FoodListingPage.jsx'));
const FoodInformationPage = lazy(() => import('./pages/FoodInformationPage.jsx'));
const PickupSchedulePage = lazy(() => import('./pages/PickupSchedulePage.jsx'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage.jsx'));

function LoadingFallback() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      FoodBridge <span>✳</span>
    </div>
  );
}

function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return session ? (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardLayout />
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  );
}

function AuthRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return session ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthRoute>
            <AuthFrame>
              <LoginPage />
            </AuthFrame>
          </AuthRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AuthRoute>
            <AuthFrame>
              <LoginPage />
            </AuthFrame>
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <AuthFrame>
              <RegisterPage />
            </AuthFrame>
          </AuthRoute>
        }
      />
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route
          index
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="listings/new"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FoodListingPage />
            </Suspense>
          }
        />
        <Route
          path="listings/:listingId/information"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FoodInformationPage />
            </Suspense>
          }
        />
        <Route
          path="listings/:listingId/pickup"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PickupSchedulePage />
            </Suspense>
          }
        />
        <Route
          path="listings/mine"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MyListingsPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
