import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, BookOpen, Trash2, ChevronRight, Clock, CheckCircle2,
  X, Check, Search, Copy, Sparkles, ListChecks,
} from 'lucide-react';
import { getProyectos, createProyecto, deleteProyecto, duplicarProyecto } from '../api';
import type { Proyecto } from '../types';
import { SALAS } from '../types';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { ProyectosSkeleton } from '../components/Skeleton';

type NuevoProyecto = Pick<Proyecto, 'nombre' | 'institucion' | 'seccion' | 'duracion' | 'fundamentacion' | 'propositos' | 'areasContenidos' | 'evaluacion'>;

const emptyForm = (): NuevoProyecto => ({
  nombre: '', institucion: '', seccion: '4 años', duracion: 'Mes de Abril',
  fundamentacion: '', propositos: '', areasContenidos: '', evaluacion: '',
});

export default function ProyectosPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NuevoProyecto>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSala, setFiltroSala] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = async () => {
    setLoading(true);
    try { setProyectos(await getProyectos()); } catch { toast('Error al cargar proyectos', 'error'); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const proyectosFiltrados = proyectos.filter(p => {
    const q = busqueda.toLowerCase();
    return (!busqueda || p.nombre.toLowerCase().includes(q) || p.institucion.toLowerCase().includes(q))
      && (!filtroSala || p.seccion === filtroSala)
      && (!filtroEstado || p.estado === filtroEstado);
  });

  const crear = async () => {
    if (!form.nombre) return;
    setSaving(true);
    try {
      await createProyecto({ ...form, estado: 'borrador' });
      toast('¡Proyecto creado!');
      setShowForm(false);
      setForm(emptyForm());
      cargar();
    } catch { toast('Error al crear el proyecto', 'error'); }
    setSaving(false);
  };

  const eliminar = async (e: React.MouseEvent, p: Proyecto) => {
    e.preventDefault();
    const ok = await confirm({
      title: '¿Eliminar proyecto?',
      message: `Se eliminará "${p.nombre}" y todas sus actividades. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try { await deleteProyecto(p.id); toast('Proyecto eliminado'); cargar(); }
    catch { toast('Error al eliminar', 'error'); }
  };

  const duplicar = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    try { await duplicarProyecto(id); toast('Proyecto duplicado'); cargar(); }
    catch { toast('Error al duplicar', 'error'); }
  };

  const hayFiltros = busqueda || filtroSala || filtroEstado;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Proyectos</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Tus proyectos didácticos de Nivel Inicial</p>
        </div>
        <button className="btn-primary text-sm py-2 px-3 sm:px-4" onClick={() => setShowForm(true)}>
          <Plus size={15} /> <span className="hidden sm:inline">Nuevo proyecto</span><span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Buscador y filtros */}
      {proyectos.length > 2 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar por nombre o institución..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <select className="input sm:w-36" value={filtroSala} onChange={e => setFiltroSala(e.target.value)}>
            <option value="">Todas las salas</option>
            {SALAS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input sm:w-36" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="finalizado">Finalizado</option>
          </select>
          {hayFiltros && (
            <button className="btn-ghost text-sm py-2 px-3 shrink-0" onClick={() => { setBusqueda(''); setFiltroSala(''); setFiltroEstado(''); }}>
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      )}

      {loading ? (
        <ProyectosSkeleton />
      ) : proyectos.length === 0 ? (
        /* Empty state guiado */
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={30} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">¡Empezá tu primera planificación!</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Creá un proyecto para organizar tus actividades de sala. Podés usar la IA para generar ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn-primary justify-center" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Crear proyecto
            </button>
            <Link to="/asistente" className="btn-secondary justify-center">
              <Sparkles size={16} className="text-violet-500" /> Pedir ideas a la IA
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {[
              { icon: '📁', title: 'Creá un proyecto', desc: 'Nombre, sala, fundamentación y propósitos.' },
              { icon: '📝', title: 'Agregá actividades', desc: 'Con Inicio, Desarrollo y Cierre para cada una.' },
              { icon: '🤖', title: 'Usá la IA', desc: 'Generá actividades o proyectos completos.' },
            ].map(s => (
              <div key={s.title} className="card p-3 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="font-semibold text-slate-700 text-xs mt-2 mb-1">{s.title}</p>
                <p className="text-slate-400 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Search size={36} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Sin resultados</p>
          <p className="text-slate-400 text-sm mt-1">Probá con otros filtros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {proyectosFiltrados.map(p => (
            <Link
              key={p.id}
              to={`/proyectos/${p.id}`}
              className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group flex items-center gap-3 sm:block"
            >
              <div className="flex-1 min-w-0 sm:mb-3">
                <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug text-sm sm:text-base">{p.nombre}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{p.institucion || 'Sin institución'}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-0 sm:mb-3 shrink-0 sm:shrink">
                <span className="badge bg-emerald-50 text-emerald-700 text-xs">{p.seccion}</span>
                {(p.actividades?.length ?? 0) > 0 && (
                  <span className="badge bg-slate-100 text-slate-500 text-xs">
                    <ListChecks size={10} className="mr-0.5" />{p.actividades!.length} act.
                  </span>
                )}
              </div>
              <div className="items-center justify-between text-xs text-slate-400 hidden sm:flex">
                <div className="flex items-center gap-1">
                  {p.estado === 'finalizado'
                    ? <><CheckCircle2 size={12} className="text-emerald-500" /> Finalizado</>
                    : <><Clock size={12} /> Borrador</>
                  }
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Duplicar"
                    onClick={e => duplicar(e, p.id)}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => eliminar(e, p)}
                  >
                    <Trash2 size={13} />
                  </button>
                  <span className="text-emerald-600 font-medium flex items-center gap-0.5">Ver <ChevronRight size={13} /></span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 shrink-0 sm:hidden" />
            </Link>
          ))}
        </div>
      )}

      {/* Modal nuevo proyecto */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base sm:text-lg">Nuevo proyecto</h3>
              <button className="btn-ghost p-1.5" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Nombre del proyecto *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder='Ej: "Conociendo el zorro"' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Institución</label>
                  <input className="input" value={form.institucion} onChange={e => setForm(f => ({ ...f, institucion: e.target.value }))} placeholder="Nombre del jardín" />
                </div>
                <div>
                  <label className="label">Sección</label>
                  <select className="input" value={form.seccion} onChange={e => setForm(f => ({ ...f, seccion: e.target.value }))}>
                    {SALAS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Duración</label>
                <input className="input" value={form.duracion} onChange={e => setForm(f => ({ ...f, duracion: e.target.value }))} placeholder="Ej: Mes de Abril" />
              </div>
              <div>
                <label className="label">Fundamentación</label>
                <textarea className="textarea" rows={4} value={form.fundamentacion} onChange={e => setForm(f => ({ ...f, fundamentacion: e.target.value }))} placeholder="¿Por qué elegiste este tema? ¿Qué intereses o situaciones del grupo motivaron este proyecto?" />
                <p className="field-hint">Justificación pedagógica: relacioná con los intereses del grupo y el contexto.</p>
              </div>
              <div>
                <label className="label">Propósitos</label>
                <textarea className="textarea" rows={3} value={form.propositos} onChange={e => setForm(f => ({ ...f, propositos: e.target.value }))} placeholder="- Ofrecer situaciones de enseñanza que permitan...&#10;- Promover el intercambio y la participación..." />
                <p className="field-hint">Lo que vos como docente te proponés hacer. Usá verbos en infinitivo: ofrecer, promover, habilitar.</p>
              </div>
              <div>
                <label className="label">Áreas y Contenidos</label>
                <textarea className="textarea" rows={4} value={form.areasContenidos} onChange={e => setForm(f => ({ ...f, areasContenidos: e.target.value }))} placeholder="Formación Personal y Social:&#10;- ...&#10;&#10;Ambiente Natural y Social:&#10;- ..." />
                <p className="field-hint">Organizá por área curricular. Podés incluir solo las que trabajes en el proyecto.</p>
              </div>
              <div>
                <label className="label">Evaluación</label>
                <textarea className="textarea" rows={3} value={form.evaluacion} onChange={e => setForm(f => ({ ...f, evaluacion: e.target.value }))} placeholder="- La participación activa en las propuestas...&#10;- La capacidad de expresar..." />
                <p className="field-hint">¿Cómo vas a observar y registrar los aprendizajes? Listá los indicadores.</p>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={crear} disabled={saving || !form.nombre}>
                <Check size={15} /> {saving ? 'Creando...' : 'Crear proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
