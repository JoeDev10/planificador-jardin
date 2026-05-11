import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import Layout from './components/Layout';
import ProyectosPage from './pages/Proyectos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import PlanificacionAnualPage from './pages/PlanificacionAnual';
import Asistente from './pages/Asistente';
import SecuenciasPage from './pages/Secuencias';
import Guia from './pages/Guia';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ProyectosPage />} />
            <Route path="proyectos/:id" element={<ProyectoDetalle />} />
            <Route path="planificacion" element={<PlanificacionAnualPage />} />
            <Route path="secuencias" element={<SecuenciasPage />} />
            <Route path="asistente" element={<Asistente />} />
            <Route path="guia" element={<Guia />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}
