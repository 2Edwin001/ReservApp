import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Reservas from './pages/admin/Reservas'
import Configuracion from './pages/admin/Configuracion'
import ReservaPage from './pages/public/ReservaPage'
import Confirmacion from './pages/public/Confirmacion'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/r/:slug" element={<ReservaPage />} />
        <Route path="/r/:slug/confirmacion" element={<Confirmacion />} />

        {/* Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Rutas privadas con layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/reservas" element={<Reservas />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
          </Route>
        </Route>

        {/* Redirect raíz */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
