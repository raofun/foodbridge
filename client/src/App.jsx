import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthFrame from './components/AuthFrame.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomeLayout from './components/HomeLayout.jsx';
import HomePage from './pages/HomePage.jsx';

// Code-split listing routes on demand for optimal loading performance
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

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  return session ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function AuthRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  return session ? <Navigate to={location.state?.from || '/'} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Homepage is the first page when entering the website */}
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<HomePage />} />

        {/* Food Listing Workflows */}
        <Route
          path="listings/new"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FoodListingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="create-listing"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FoodListingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="listings/:listingId/information"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FoodInformationPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="listings/:listingId/pickup"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PickupSchedulePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="listings/mine"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyListingsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Authentication Pages */}
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

      {/* Legacy and fallback routes redirect to Homepage */}
      <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
