import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DiseasePrediction from './pages/DiseasePrediction'
import SoilPrediction from './pages/SoilPrediction'
import WeatherForecast from './pages/WeatherForecast'
import CropRecommendation from './pages/CropRecommendation'
import YieldPrediction from './pages/YieldPrediction'
import FertilizerRecommendation from './pages/FertilizerRecommendation'
import Marketplace from './pages/Marketplace'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import SellerDashboard from './pages/SellerDashboard'

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0d1f0d',
                color: '#f0fdf4',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#4ade80', secondary: '#000' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#000' } },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes with sidebar layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/disease-prediction" element={<DiseasePrediction />} />
              <Route path="/soil-prediction" element={<SoilPrediction />} />
              <Route path="/weather" element={<WeatherForecast />} />
              <Route path="/crop-recommendation" element={<CropRecommendation />} />
              <Route path="/yield-prediction" element={<YieldPrediction />} />
              <Route path="/fertilizer" element={<FertilizerRecommendation />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/seller" element={<SellerDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
