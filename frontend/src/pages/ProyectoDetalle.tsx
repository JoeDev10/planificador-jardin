import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trash2, Sparkles, Check, X,
  Printer, ChevronDown, ChevronUp, GripVertical, Copy,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getProyecto, updateProyecto, createActividad, updateActividad,
  deleteActividad, sugerirActividad, duplicarActividad,
} from '../api';
import type { Proyecto, Actividad } from '../types';
import { AREAS, SALAS } from '../types';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { DetalleSkeleton } from '../components/Skeleton';
import axios from 'axios';

type ActForm = Omit<Actividad, 'id' | 'createdAt' | 'proyectoId'>;
const emptyAct = (numero: number): ActForm => ({
  numero, nombre: '', inicio: '', desarrollo: '', cierre: '', materiales: '', area: '',
});

function parsearRespuestaIA(texto: string): Partial<ActForm> {
  const extract = (label: string) => {
    const regex = new RegExp(`\\*{0,2}${label}\\*{0,2}[:\\s]+(.*?)(?=\\n\\s*\\n?\\*{0,2}(?:Desarrollo|Cierre|Materiales|$))`, 'is');
    return texto.match(regex)?.[1]?.trim() ?? '';
  };
  const nombre = texto.match(/^["«]?([^"\n«»]{5,80})["»]?\n/)?.[1]?.trim() ?? '';
  const materiales = texto.match(/\*{0,2}Materiales\*{0,2}[:\s]+(.*?)(?=\n\n|$)/is)?.[1]?.trim() ?? '';
  return {
    nombre: nombre.replace(/^\*+|\*+$/g, ''),
    inicio: extract('Inicio'),
    desarrollo: extract('Desarrollo'),
    cierre: extract('Cierre'),
    materiales,
  };
}

// ── Sortable actividad card ──────────────────────────────────────
function SortableActividadCard({
  act, onEdit, onDelete, onDuplicar,
}: {
  act: Actividad;
  onEdit: (a: Actividad) => void;
  onDelete: (id: number) => void;
  onDuplicar: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: act.id });
  const [open, setOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="card overflow-hidden">
      <div
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <button
          className="touch-none shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5"
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>
        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
          {act.numero}
        </span>
        <span className="flex-1 font-semibold text-slate-800 text-sm leading-snug">{act.nombre}</span>
        {act.area && <span className="badge bg-slate-100 text-slate-600 text-xs hidden sm:inline-flex">{act.area}</span>}
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button className="btn-ghost p-1.5" title="Duplicar" onClick={() => onDuplicar(act.id)}><Copy size={12} /></button>
          <button className="btn-ghost p-1.5" onClick={() => onEdit(act)}><Pencil size={13} /></button>
          <button className="btn-danger p-1.5" onClick={() => onDelete(act.id)}><Trash2 size={13} /></button>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
      </div>
      {open && (
        <div className="border-t border-slate-100 px-3 sm:px-5 pb-4 pt-3 space-y-3 animate-fade-in">
          {act.area && <span className="badge bg-slate-100 text-slate-600 text-xs sm:hidden">{act.area}</span>}
          {[
            { label: 'Inicio', value: act.inicio, color: 'bg-sky-50 border-sky-200' },
            { label: 'Desarrollo', value: act.desarrollo, color: 'bg-amber-50 border-amber-200' },
            { label: 'Cierre', value: act.cierre, color: 'bg-emerald-50 border-emerald-200' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
              <div className={`rounded-xl border p-2.5 sm:p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${color}`}>{value}</div>
            </div>
          ))}
          {act.materiales && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Materiales</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{act.materiales}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── IA Modal ──────────────────────────────────────────────────────
function IAModal({
  sala, contexto, onClose, onApply,
}: {
  sala: string; contexto: string;
  onClose: () => void; onApply: (campos: Partial<ActForm>) => void;
}) {
  const { toast } = useToast();
  const [objetivo, setObjetivo] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [parsed, setParsed] = useState<Partial<ActForm> | null>(null);

  const generar = async () => {
    setLoading(true); setRespuesta(''); setParsed(null);
    try {
      const { respuesta: r } = await sugerirActividad({ objetivo, sala, area, contexto });
      setRespuesta(r);
      setParsed(parsearRespuestaIA(r));
    } catch { toast('Error al conectar con la IA', 'error'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Sparkles size={14} className="text-violet-600" />
            </div>
            <h3 className="font-bold text-base">Sugerir actividad con IA</h3>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="label">¿Qué querés trabajar?</label>
            <textarea className="textarea" rows={2} value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ej: Que los niños conozcan dónde vive el zorro y qué come" />
            <p className="field-hint">Cuanto más específico, mejor será la sugerencia.</p>
          </div>
          <div>
            <label className="label">Área (opcional)</label>
            <select className="input" value={area} onChange={e => setArea(e.target.value)}>
              <option value="">Cualquier área</option>
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <button className="btn-primary w-full justify-center" onClick={generar} disabled={loading || !objetivo}>
            <Sparkles size={15} /> {loading ? 'La IA está pensando...' : 'Generar actividad'}
          </button>
          {respuesta && (
            <>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 sm:p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {respuesta}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="btn-primary flex-1 justify-center" onClick={() => onApply(parsed ?? {})}>
                  <Check size={15} /> Completar formulario automáticamente
                </button>
                <button className="btn-secondary flex-1 justify-center" onClick={() => onApply({})}>
                  Usar como referencia
                </button>
              </div>
              {parsed?.nombre && (
                <p className="text-xs text-slate-400 text-center">
                  Se completarán: Nombre, Inicio, Desarrollo, Cierre y Materiales
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ProyectoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProyecto, setEditingProyecto] = useState(false);
  const [proyectoForm, setProyectoForm] = useState<Partial<Proyecto>>({});
  const [saving, setSaving] = useState(false);
  const [actForm, setActForm] = useState<ActForm | null>(null);
  const [editingActId, setEditingActId] = useState<number | null>(null);
  const [showIA, setShowIA] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const cargar = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProyecto(Number(id));
      setProyecto(p);
      setActividades(p.actividades ?? []);
    } catch { toast('Error al cargar el proyecto', 'error'); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = actividades.findIndex(a => a.id === active.id);
    const newIdx = actividades.findIndex(a => a.id === over.id);
    const reordenadas = arrayMove(actividades, oldIdx, newIdx).map((a, i) => ({ ...a, numero: i + 1 }));
    setActividades(reordenadas);
    try {
      await axios.put(`/api/actividades/reorder/${id}`, {
        orden: reordenadas.map(a => ({ id: a.id, numero: a.numero })),
      });
    } catch { toast('Error al guardar el orden', 'error'); cargar(); }
  };

  const guardarProyecto = async () => {
    if (!proyecto) return;
    setSaving(true);
    try {
      await updateProyecto(proyecto.id, proyectoForm);
      toast('Proyecto guardado');
      setEditingProyecto(false);
      cargar();
    } catch { toast('Error al guardar', 'error'); }
    setSaving(false);
  };

  const abrirEditarAct = (act: Actividad) => {
    setEditingActId(act.id);
    setActForm({ numero: act.numero, nombre: act.nombre, inicio: act.inicio, desarrollo: act.desarrollo, cierre: act.cierre, materiales: act.materiales, area: act.area });
  };

  const guardarActividad = async () => {
    if (!actForm || !proyecto) return;
    setSaving(true);
    try {
      if (editingActId) {
        await updateActividad(editingActId, actForm);
        toast('Actividad guardada');
      } else {
        await createActividad({ ...actForm, proyectoId: proyecto.id });
        toast('Actividad creada');
      }
      setActForm(null); setEditingActId(null); cargar();
    } catch { toast('Error al guardar actividad', 'error'); }
    setSaving(false);
  };

  const eliminarActividad = async (actId: number) => {
    const act = actividades.find(a => a.id === actId);
    const ok = await confirm({
      title: '¿Eliminar actividad?',
      message: act ? `Se eliminará "${act.nombre}".` : 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try { await deleteActividad(actId); toast('Actividad eliminada'); cargar(); }
    catch { toast('Error al eliminar', 'error'); }
  };

  const duplicarActividadHandler = async (actId: number) => {
    try { await duplicarActividad(actId); toast('Actividad duplicada'); cargar(); }
    catch { toast('Error al duplicar', 'error'); }
  };

  const aplicarSugerenciaIA = (campos: Partial<ActForm>) => {
    if (!proyecto) return;
    setActForm({ ...emptyAct(actividades.length + 1), ...campos });
    setEditingActId(null);
    setShowIA(false);
  };

  if (loading) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200 rounded-lg w-48 animate-pulse" />
          <div className="h-3 bg-slate-200 rounded-lg w-32 animate-pulse" />
        </div>
      </div>
      <DetalleSkeleton />
    </div>
  );
  if (!proyecto) return <div className="text-center py-12 text-slate-400">Proyecto no encontrado</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 no-print">
        <button className="btn-ghost p-2 shrink-0" onClick={() => navigate('/proyectos')}><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">{proyecto.nombre}</h2>
          <p className="text-xs sm:text-sm text-slate-500 truncate">{proyecto.seccion} · {proyecto.duracion}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <button className="btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:px-3" onClick={() => handlePrint()}>
            <Printer size={14} /><span className="hidden sm:inline"> Imprimir</span>
          </button>
          <button
            className="btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:px-3"
            onClick={() => {
              setEditingProyecto(true);
              setProyectoForm({
                nombre: proyecto.nombre, institucion: proyecto.institucion, seccion: proyecto.seccion,
                duracion: proyecto.duracion, fundamentacion: proyecto.fundamentacion,
                propositos: proyecto.propositos, areasContenidos: proyecto.areasContenidos,
                evaluacion: proyecto.evaluacion, estado: proyecto.estado,
              });
            }}
          >
            <Pencil size={14} /><span className="hidden sm:inline"> Editar</span>
          </button>
        </div>
      </div>

      <div ref={printRef}>
        {/* Info del proyecto */}
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="print:block hidden mb-4 text-center">
            <h1 className="text-xl font-bold">{proyecto.nombre}</h1>
            <p className="text-sm text-slate-500">{proyecto.institucion} · Sección: {proyecto.seccion} · Duración: {proyecto.duracion}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Section title="Fundamentación" content={proyecto.fundamentacion} />
            <Section title="Propósitos" content={proyecto.propositos} />
            <Section title="Áreas y Contenidos" content={proyecto.areasContenidos} className="md:col-span-2" />
            <Section title="Evaluación" content={proyecto.evaluacion} className="md:col-span-2" />
          </div>
        </div>

        {/* Actividades */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4 no-print">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Actividades <span className="text-slate-400 font-normal text-sm">({actividades.length})</span>
              </h3>
              {actividades.length > 1 && (
                <p className="text-xs text-slate-400 mt-0.5">Arrastrá para reordenar</p>
              )}
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <button className="btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:px-3" onClick={() => setShowIA(true)}>
                <Sparkles size={13} className="text-violet-500" /><span className="hidden sm:inline"> Sugerir con IA</span><span className="sm:hidden"> IA</span>
              </button>
              <button
                className="btn-primary text-xs sm:text-sm py-1.5 px-2 sm:px-3"
                onClick={() => { setEditingActId(null); setActForm(emptyAct(actividades.length + 1)); }}
              >
                <Plus size={13} /><span className="hidden sm:inline"> Nueva</span>
              </button>
            </div>
          </div>

          {actividades.length === 0 ? (
            <div className="card p-6 sm:p-8 text-center no-print border-dashed bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Plus size={22} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Sin actividades todavía</p>
              <p className="text-slate-400 text-sm mb-4">Agregá la primera actividad o pedile una sugerencia a la IA.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button className="btn-secondary" onClick={() => setShowIA(true)}>
                  <Sparkles size={15} className="text-violet-500" /> Sugerir con IA
                </button>
                <button className="btn-primary" onClick={() => setActForm(emptyAct(1))}>
                  <Plus size={15} /> Agregar actividad
                </button>
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={actividades.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 sm:space-y-3 no-print">
                  {actividades.map(act => (
                    <SortableActividadCard
                      key={act.id}
                      act={act}
                      onEdit={abrirEditarAct}
                      onDelete={eliminarActividad}
                      onDuplicar={duplicarActividadHandler}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Vista impresión */}
          <div className="hidden print:block space-y-4 mt-4">
            {actividades.map(act => (
              <div key={act.id} className="card p-4">
                <h4 className="font-bold text-base mb-3">Actividad N° {act.numero}: {act.nombre}</h4>
                {[{ label: 'Inicio', value: act.inicio }, { label: 'Desarrollo', value: act.desarrollo }, { label: 'Cierre', value: act.cierre }].map(({ label, value }) => (
                  <div key={label} className="mb-2">
                    <span className="font-semibold text-sm">• {label}: </span>
                    <span className="text-sm whitespace-pre-wrap">{value}</span>
                  </div>
                ))}
                {act.materiales && <p className="text-sm mt-1"><span className="font-semibold">Materiales:</span> {act.materiales}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal editar proyecto */}
      {editingProyecto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base">Editar proyecto</h3>
              <button className="btn-ghost p-1.5" onClick={() => setEditingProyecto(false)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={proyectoForm.nombre || ''} onChange={e => setProyectoForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Institución</label>
                  <input className="input" value={proyectoForm.institucion || ''} onChange={e => setProyectoForm(f => ({ ...f, institucion: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Sección</label>
                  <select className="input" value={proyectoForm.seccion || ''} onChange={e => setProyectoForm(f => ({ ...f, seccion: e.target.value }))}>
                    {SALAS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Duración</label>
                <input className="input" value={proyectoForm.duracion || ''} onChange={e => setProyectoForm(f => ({ ...f, duracion: e.target.value }))} />
              </div>
              <div>
                <label className="label">Fundamentación</label>
                <textarea className="textarea" rows={4} value={proyectoForm.fundamentacion || ''} onChange={e => setProyectoForm(f => ({ ...f, fundamentacion: e.target.value }))} />
                <p className="field-hint">¿Por qué elegiste este tema? Relacioná con los intereses del grupo.</p>
              </div>
              <div>
                <label className="label">Propósitos</label>
                <textarea className="textarea" rows={3} value={proyectoForm.propositos || ''} onChange={e => setProyectoForm(f => ({ ...f, propositos: e.target.value }))} />
                <p className="field-hint">Lo que vos te proponés hacer. Verbos en infinitivo: ofrecer, promover, habilitar.</p>
              </div>
              <div>
                <label className="label">Áreas y Contenidos</label>
                <textarea className="textarea" rows={4} value={proyectoForm.areasContenidos || ''} onChange={e => setProyectoForm(f => ({ ...f, areasContenidos: e.target.value }))} />
              </div>
              <div>
                <label className="label">Evaluación</label>
                <textarea className="textarea" rows={3} value={proyectoForm.evaluacion || ''} onChange={e => setProyectoForm(f => ({ ...f, evaluacion: e.target.value }))} />
                <p className="field-hint">Indicadores de observación y registro de aprendizajes.</p>
              </div>
              <div>
                <label className="label">Estado</label>
                <select className="input" value={proyectoForm.estado || 'borrador'} onChange={e => setProyectoForm(f => ({ ...f, estado: e.target.value as 'borrador' | 'finalizado' }))}>
                  <option value="borrador">Borrador</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setEditingProyecto(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={guardarProyecto} disabled={saving}>
                <Check size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal actividad */}
      {actForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base">{editingActId ? 'Editar actividad' : 'Nueva actividad'}</h3>
              <button className="btn-ghost p-1.5" onClick={() => setActForm(null)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">N°</label>
                  <input className="input" type="number" value={actForm.numero} onChange={e => setActForm(f => f ? { ...f, numero: Number(e.target.value) } : f)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Nombre de la actividad</label>
                  <input className="input" value={actForm.nombre} onChange={e => setActForm(f => f ? { ...f, nombre: e.target.value } : f)} placeholder='Ej: "¿Dónde vive el zorro?"' />
                </div>
              </div>
              <div>
                <label className="label">Área</label>
                <select className="input" value={actForm.area} onChange={e => setActForm(f => f ? { ...f, area: e.target.value } : f)}>
                  <option value="">Sin área específica</option>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              {[
                { key: 'inicio' as const, label: 'Inicio', placeholder: '¿Cómo abrís la actividad? Contá el disparador o pregunta inicial que usás para conectar con lo que ya saben.', rows: 4, color: 'border-sky-300 focus:ring-sky-400' },
                { key: 'desarrollo' as const, label: 'Desarrollo', placeholder: 'La actividad propiamente dicha. Describí qué hacen los nenes, cómo se organizan, qué materiales usan, paso a paso.', rows: 5, color: 'border-amber-300 focus:ring-amber-400' },
                { key: 'cierre' as const, label: 'Cierre', placeholder: '¿Cómo cerrás? ¿Qué preguntás para sistematizar? ¿Hay una producción final, una puesta en común?', rows: 3, color: 'border-emerald-300 focus:ring-emerald-400' },
              ].map(({ key, label, placeholder, rows, color }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <textarea className={`textarea border ${color}`} rows={rows} value={actForm[key]} onChange={e => setActForm(f => f ? { ...f, [key]: e.target.value } : f)} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="label">Materiales (opcional)</label>
                <input className="input" value={actForm.materiales} onChange={e => setActForm(f => f ? { ...f, materiales: e.target.value } : f)} placeholder="Ej: Afiche, plasticolas, imágenes del zorro, lupa..." />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setActForm(null)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={guardarActividad} disabled={saving || !actForm.nombre}>
                <Check size={15} /> {saving ? 'Guardando...' : 'Guardar actividad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIA && (
        <IAModal sala={proyecto.seccion} contexto={proyecto.nombre} onClose={() => setShowIA(false)} onApply={aplicarSugerenciaIA} />
      )}
    </div>
  );
}

function Section({ title, content, className = '' }: { title: string; content: string; className?: string }) {
  return (
    <div className={className}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">{title}</h4>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
        {content || <span className="italic text-slate-300">Sin completar</span>}
      </p>
    </div>
  );
}
