import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthFrame from './components/AuthFrame.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FoodListingPage from './pages/FoodListingPage.jsx';
import FoodInformationPage from './pages/FoodInformationPage.jsx';
import PickupSchedulePage from './pages/PickupSchedulePage.jsx';
import MyListingsPage from './pages/MyListingsPage.jsx';

function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <div className="loading-screen">FoodBridge <span>✳</span></div>;
  return session ? <DashboardLayout /> : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="loading-screen">FoodBridge <span>✳</span></div>;
  return session ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/register" replace />} />
    <Route path="/register" element={<AuthRoute><AuthFrame><RegisterPage /></AuthFrame></AuthRoute>} />
    <Route path="/login" element={<AuthRoute><AuthFrame><LoginPage /></AuthFrame></AuthRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute />}>
      <Route index element={<DashboardPage />} />
      <Route path="listings/new" element={<FoodListingPage />} />
      <Route path="listings/:listingId/information" element={<FoodInformationPage />} />
      <Route path="listings/:listingId/pickup" element={<PickupSchedulePage />} />
      <Route path="listings/mine" element={<MyListingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
