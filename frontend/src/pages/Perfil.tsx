import { useState, useEffect } from 'react';
import { User, School, BookOpen, MapPin, FileText, Save, Trash2, CheckCircle } from 'lucide-react';
import { getPerfil, updatePerfil, limpiarHistorialChat, type PerfilData } from '../api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

const SALAS = ['Sala de 2 años', 'Sala de 3 años', 'Sala de 4 años', 'Sala de 5 años', 'Plurisala'];
const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

export default function Perfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [form, setForm] = useState<Omit<PerfilData, 'id'>>({
    nombre: '',
    institucion: '',
    sala: '',
    provincia: '',
    notas: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPerfil()
      .then(data => {
        setForm({
          nombre: data.nombre || '',
          institucion: data.institucion || '',
          sala: data.sala || '',
          provincia: data.provincia || '',
          notas: data.notas || '',
        });
      })
      .catch(() => toast('No se pudo cargar el perfil', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePerfil(form);
      setSaved(true);
      toast('Perfil guardado correctamente', 'success');
    } catch {
      toast('Error al guardar el perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLimpiarHistorial = async () => {
    const ok = await confirm({
      title: 'Limpiar historial del chat',
      message: 'Se van a borrar todos los mensajes guardados del Asistente IA. La IA "olvidará" las conversaciones anteriores. ¿Confirmás?',
      confirmLabel: 'Sí, limpiar',
      danger: true,
    });
    if (!ok) return;
    try {
      await limpiarHistorialChat();
      toast('Historial del chat eliminado', 'success');
    } catch {
      toast('Error al limpiar el historial', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-slate-400 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi perfil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Esta información personaliza las respuestas del Asistente IA para vos.
        </p>
      </div>

      {/* Email del usuario (solo lectura) */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-xs text-emerald-600 font-medium">Cuenta</p>
          <p className="text-sm text-slate-700 font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <User size={16} className="text-emerald-600" />
          Datos personales
        </h2>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Nombre de la docente
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => handleChange('nombre', e.target.value)}
            placeholder="Ej: María Fernanda"
            className="input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">La IA te llamará por tu nombre</p>
        </div>

        {/* Institución */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <School size={13} />
            Institución
          </label>
          <input
            type="text"
            value={form.institucion}
            onChange={e => handleChange('institucion', e.target.value)}
            placeholder="Ej: Jardín Nº 5 'Los Girasoles'"
            className="input w-full"
          />
        </div>

        {/* Sala habitual */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <BookOpen size={13} />
            Sala habitual
          </label>
          <select
            value={form.sala}
            onChange={e => handleChange('sala', e.target.value)}
            className="input w-full"
          >
            <option value="">Sin especificar</option>
            {SALAS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">Si tenés sala fija, la IA la usará por defecto</p>
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <MapPin size={13} />
            Provincia
          </label>
          <select
            value={form.provincia}
            onChange={e => handleChange('provincia', e.target.value)}
            className="input w-full"
          >
            <option value="">Sin especificar</option>
            {PROVINCIAS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Notas / preferencias */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <FileText size={13} />
            Notas o preferencias
          </label>
          <textarea
            value={form.notas}
            onChange={e => handleChange('notas', e.target.value)}
            placeholder="Ej: Me gustan las actividades con arte y música. Trabajo con integración."
            rows={3}
            className="input w-full resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            Contale a la IA algo sobre tu estilo de enseñanza o preferencias
          </p>
        </div>

        {/* Botón guardar */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle size={16} />
                Guardado
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sección de privacidad / historial */}
      <div className="card border-red-100 space-y-3">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Trash2 size={16} className="text-red-500" />
          Privacidad
        </h2>
        <p className="text-sm text-slate-500">
          El Asistente IA guarda las últimas conversaciones para darte respuestas más contextualizadas.
          Podés borrar ese historial en cualquier momento.
        </p>
        <button
          onClick={handleLimpiarHistorial}
          className="btn border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
        >
          <Trash2 size={14} />
          Limpiar historial del chat
        </button>
      </div>
    </div>
  );
}
