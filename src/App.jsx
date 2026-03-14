import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import Login from './pages/admin/Login'
import Register from './pages/admin/Register'
import Onboarding from './pages/admin/Onboarding'
import Dashboard from './pages/admin/Dashboard'
import Reservas from './pages/admin/Reservas'
import Configuracion from './pages/admin/Configuracion'
import Reportes from './pages/admin/Reportes'
import ReservaPage from './pages/public/ReservaPage'
import Confirmacion from './pages/public/Confirmacion'
import LandingPage from './pages/public/LandingPage'

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/r/:slug" element={<ReservaPage />} />
        <Route path="/r/:slug/confirmacion" element={<Confirmacion />} />

        {/* Auth */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding (protegida pero fuera del AdminLayout) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/onboarding" element={<Onboarding />} />
        </Route>

        {/* Rutas privadas con layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/reservas" element={<Reservas />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
            <Route path="/admin/reportes" element={<Reportes />} />
          </Route>
        </Route>

        {/* Landing & catch-all */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}
