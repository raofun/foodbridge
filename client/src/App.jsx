import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthFrame from './components/AuthFrame.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomeLayout from './components/HomeLayout.jsx';
import HomePage from './pages/HomePage.jsx';

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

function DonorRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (session.user?.role === 'receiver') return <Navigate to="/" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return session ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="listings/new"
          element={
            <DonorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FoodListingPage />
              </Suspense>
            </DonorRoute>
          }
        />
        <Route
          path="create-listing"
          element={
            <DonorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FoodListingPage />
              </Suspense>
            </DonorRoute>
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
          path="food-information"
          element={<Navigate to="/listings/new" replace />}
        />
        <Route
          path="listings/:listingId/pickup"
          element={
            <DonorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PickupSchedulePage />
              </Suspense>
            </DonorRoute>
          }
        />
        <Route
          path="listings/mine"
          element={
            <DonorRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyListingsPage />
              </Suspense>
            </DonorRoute>
          }
        />
      </Route>

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

      <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
