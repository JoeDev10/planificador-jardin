import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProyectosPage from './pages/Proyectos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import PlanificacionAnualPage from './pages/PlanificacionAnual';
import Asistente from './pages/Asistente';
import SecuenciasPage from './pages/Secuencias';
import Guia from './pages/Guia';
import Perfil from './pages/Perfil';
import Dashboard from './pages/Dashboard';
import EfemeridesPage from './pages/Efemerides';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="proyectos" element={<ProyectosPage />} />
        <Route path="proyectos/:id" element={<ProyectoDetalle />} />
        <Route path="planificacion" element={<PlanificacionAnualPage />} />
        <Route path="secuencias" element={<SecuenciasPage />} />
        <Route path="asistente" element={<Asistente />} />
        <Route path="guia" element={<Guia />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="efemerides" element={<EfemeridesPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
