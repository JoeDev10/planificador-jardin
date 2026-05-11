import { useEffect, useState } from 'react';
import {
  Plus, ListChecks, Trash2, Pencil, Sparkles, ChevronDown, ChevronUp,
  X, Check, Copy, GripVertical, Bot,
} from 'lucide-react';
import {
  getSecuencias, createSecuencia, updateSecuencia, deleteSecuencia, duplicarSecuencia,
  createSecuenciaActividad, updateSecuenciaActividad, deleteSecuenciaActividad,
  sugerirSecuencia,
} from '../api';
import type { Secuencia, SecuenciaActividad } from '../types';
import { SALAS, AREAS } from '../types';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { SecuenciasSkeleton } from '../components/Skeleton';

type SecForm = Omit<Secuencia, 'id' | 'createdAt' | 'updatedAt' | 'actividades'>;
type ActForm = Omit<SecuenciaActividad, 'id' | 'createdAt' | 'secuenciaId'>;

const emptySecForm = (): SecForm => ({ titulo: '', sala: '4 años', area: '', duracion: '', proposito: '' });
const emptyActForm = (numero: number): ActForm => ({ numero, nombre: '', inicio: '', desarrollo: '', cierre: '', materiales: '', area: '' });

function ActividadRow({
  act, onEdit, onDelete,
}: { act: SecuenciaActividad; onEdit: (a: SecuenciaActividad) => void; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical size={14} className="text-slate-300 shrink-0 hidden sm:block" />
        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
          {act.numero}
        </span>
        <span className="flex-1 font-medium text-slate-800 text-sm leading-snug">{act.nombre}</span>
        {act.area && <span className="badge bg-slate-100 text-slate-500 text-xs hidden sm:inline-flex">{act.area}</span>}
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button className="btn-ghost p-1" onClick={() => onEdit(act)}><Pencil size={12} /></button>
          <button className="btn-danger p-1" onClick={() => onDelete(act.id)}><Trash2 size={12} /></button>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </div>
      {open && (
        <div className="border-t border-slate-100 px-3 sm:px-4 pb-3 pt-2.5 space-y-2.5">
          {[
            { label: 'Inicio', value: act.inicio, color: 'bg-sky-50 border-sky-200' },
            { label: 'Desarrollo', value: act.desarrollo, color: 'bg-amber-50 border-amber-200' },
            { label: 'Cierre', value: act.cierre, color: 'bg-emerald-50 border-emerald-200' },
          ].map(({ label, value, color }) => value ? (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
              <div className={`rounded-lg border p-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${color}`}>{value}</div>
            </div>
          ) : null)}
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

export default function SecuenciasPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [secuencias, setSecuencias] = useState<Secuencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal secuencia
  const [showSecForm, setShowSecForm] = useState(false);
  const [editingSec, setEditingSec] = useState<Secuencia | null>(null);
  const [secForm, setSecForm] = useState<SecForm>(emptySecForm());
  const [savingSec, setSavingSec] = useState(false);

  // Modal actividad
  const [actModal, setActModal] = useState<{ secuenciaId: number; act?: SecuenciaActividad } | null>(null);
  const [actForm, setActForm] = useState<ActForm>(emptyActForm(1));
  const [savingAct, setSavingAct] = useState(false);

  // Modal IA secuencia completa
  const [iaModal, setIaModal] = useState(false);
  const [iaTema, setIaTema] = useState('');
  const [iaSala, setIaSala] = useState('4 años');
  const [iaCantidad, setIaCantidad] = useState(3);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSugerencia, setIaSugerencia] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      setSecuencias(await getSecuencias());
    } catch {
      toast('Error al cargar secuencias', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardarSec = async () => {
    if (!secForm.titulo) return;
    setSavingSec(true);
    try {
      if (editingSec) {
        await updateSecuencia(editingSec.id, secForm);
        toast('Secuencia actualizada');
      } else {
        await createSecuencia(secForm);
        toast('Secuencia creada');
      }
      setShowSecForm(false);
      setEditingSec(null);
      setSecForm(emptySecForm());
      cargar();
    } catch {
      toast('Error al guardar', 'error');
    }
    setSavingSec(false);
  };

  const eliminarSec = async (id: number) => {
    const sec = secuencias.find(s => s.id === id);
    const ok = await confirm({
      title: '¿Eliminar secuencia?',
      message: `Se eliminará "${sec?.titulo ?? 'esta secuencia'}" y todas sus actividades. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteSecuencia(id);
      toast('Secuencia eliminada');
      cargar();
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const duplicar = async (id: number) => {
    try {
      await duplicarSecuencia(id);
      toast('Secuencia duplicada');
      cargar();
    } catch {
      toast('Error al duplicar', 'error');
    }
  };

  const abrirEditarSec = (s: Secuencia) => {
    setEditingSec(s);
    setSecForm({ titulo: s.titulo, sala: s.sala, area: s.area, duracion: s.duracion, proposito: s.proposito });
    setShowSecForm(true);
  };

  const abrirActModal = (secuenciaId: number, act?: SecuenciaActividad) => {
    const sec = secuencias.find(s => s.id === secuenciaId);
    const siguiente = (sec?.actividades?.length ?? 0) + 1;
    setActModal({ secuenciaId, act });
    setActForm(act
      ? { numero: act.numero, nombre: act.nombre, inicio: act.inicio, desarrollo: act.desarrollo, cierre: act.cierre, materiales: act.materiales, area: act.area }
      : emptyActForm(siguiente)
    );
  };

  const guardarAct = async () => {
    if (!actModal || !actForm.nombre) return;
    setSavingAct(true);
    try {
      if (actModal.act) {
        await updateSecuenciaActividad(actModal.act.id, actForm);
        toast('Actividad actualizada');
      } else {
        await createSecuenciaActividad(actModal.secuenciaId, actForm);
        toast('Actividad agregada');
      }
      setActModal(null);
      cargar();
    } catch {
      toast('Error al guardar actividad', 'error');
    }
    setSavingAct(false);
  };

  const eliminarAct = async (actId: number) => {
    const ok = await confirm({
      title: '¿Eliminar actividad?',
      message: 'Se eliminará esta actividad de la secuencia.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteSecuenciaActividad(actId);
      toast('Actividad eliminada');
      cargar();
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const pedirSugerenciaIA = async () => {
    if (!iaTema) return;
    setIaLoading(true);
    setIaSugerencia('');
    try {
      const { respuesta } = await sugerirSecuencia({ tema: iaTema, sala: iaSala, cantidadActividades: iaCantidad });
      setIaSugerencia(respuesta);
    } catch {
      toast('Error al conectar con la IA', 'error');
    }
    setIaLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Secuencias Didácticas</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Actividades encadenadas por tema o área</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button className="btn-secondary text-sm py-2 px-2.5 sm:px-3" onClick={() => { setIaSugerencia(''); setIaModal(true); }}>
            <Sparkles size={14} /><span className="hidden sm:inline"> Sugerir con IA</span>
          </button>
          <button className="btn-primary text-sm py-2 px-2.5 sm:px-3" onClick={() => { setEditingSec(null); setSecForm(emptySecForm()); setShowSecForm(true); }}>
            <Plus size={14} /><span className="hidden sm:inline"> Nueva</span>
          </button>
        </div>
      </div>

      {loading ? (
        <SecuenciasSkeleton />
      ) : secuencias.length === 0 ? (
        <div className="text-center py-10 px-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <ListChecks size={30} className="text-violet-600" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">¡Creá tu primera secuencia!</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Una secuencia es un conjunto de actividades encadenadas sobre un mismo tema o área.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button className="btn-secondary justify-center" onClick={() => { setIaSugerencia(''); setIaModal(true); }}>
              <Sparkles size={15} className="text-violet-500" /> Generar con IA
            </button>
            <button className="btn-primary justify-center" onClick={() => { setEditingSec(null); setSecForm(emptySecForm()); setShowSecForm(true); }}>
              <Plus size={15} /> Crear secuencia
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {secuencias.map(s => {
            const isOpen = expandedId === s.id;
            return (
              <div key={s.id} className="card overflow-hidden">
                <div
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm sm:text-base leading-snug truncate">{s.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="badge bg-emerald-50 text-emerald-700 text-xs">{s.sala}</span>
                      {s.area && <span className="badge bg-violet-50 text-violet-700 text-xs">{s.area}</span>}
                      {s.duracion && <span className="text-xs text-slate-400">{s.duracion}</span>}
                      <span className="text-xs text-slate-400">{s.actividades?.length ?? 0} actividad{(s.actividades?.length ?? 0) !== 1 ? 'es' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost p-1.5" title="Duplicar" onClick={() => duplicar(s.id)}><Copy size={13} /></button>
                    <button className="btn-ghost p-1.5" onClick={() => abrirEditarSec(s)}><Pencil size={13} /></button>
                    <button className="btn-danger p-1.5" onClick={() => eliminarSec(s.id)}><Trash2 size={13} /></button>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100">
                    {s.proposito && (
                      <div className="px-3 sm:px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Propósito</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{s.proposito}</p>
                      </div>
                    )}
                    <div className="px-3 sm:px-4 py-3 space-y-2">
                      {(s.actividades ?? []).length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-2">Sin actividades aún.</p>
                      ) : (
                        (s.actividades ?? []).map(act => (
                          <ActividadRow
                            key={act.id}
                            act={act}
                            onEdit={act => abrirActModal(s.id, act)}
                            onDelete={eliminarAct}
                          />
                        ))
                      )}
                      <button
                        className="btn-ghost w-full justify-center text-sm py-2 border border-dashed border-slate-200 mt-1"
                        onClick={() => abrirActModal(s.id)}
                      >
                        <Plus size={14} /> Agregar actividad
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva/editar secuencia */}
      {showSecForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base">{editingSec ? 'Editar secuencia' : 'Nueva secuencia'}</h3>
              <button className="btn-ghost p-1.5" onClick={() => setShowSecForm(false)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Título *</label>
                <input className="input" value={secForm.titulo} onChange={e => setSecForm(f => ({ ...f, titulo: e.target.value }))} placeholder='Ej: "Los animales del campo"' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sala</label>
                  <select className="input" value={secForm.sala} onChange={e => setSecForm(f => ({ ...f, sala: e.target.value }))}>
                    {SALAS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Área principal</label>
                  <select className="input" value={secForm.area} onChange={e => setSecForm(f => ({ ...f, area: e.target.value }))}>
                    <option value="">Sin área</option>
                    {AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Duración estimada</label>
                <input className="input" value={secForm.duracion} onChange={e => setSecForm(f => ({ ...f, duracion: e.target.value }))} placeholder="Ej: 2 semanas" />
              </div>
              <div>
                <label className="label">Propósito general</label>
                <textarea className="textarea" rows={3} value={secForm.proposito} onChange={e => setSecForm(f => ({ ...f, proposito: e.target.value }))} placeholder="¿Qué se busca lograr con esta secuencia?" />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowSecForm(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={guardarSec} disabled={savingSec || !secForm.titulo}>
                <Check size={15} /> {savingSec ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal actividad */}
      {actModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base">{actModal.act ? 'Editar actividad' : 'Nueva actividad'}</h3>
              <button className="btn-ghost p-1.5" onClick={() => setActModal(null)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">N°</label>
                  <input className="input" type="number" value={actForm.numero} onChange={e => setActForm(f => ({ ...f, numero: Number(e.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Nombre</label>
                  <input className="input" value={actForm.nombre} onChange={e => setActForm(f => ({ ...f, nombre: e.target.value }))} placeholder='Ej: "Exploramos el campo"' />
                </div>
              </div>
              <div>
                <label className="label">Área (opcional)</label>
                <select className="input" value={actForm.area} onChange={e => setActForm(f => ({ ...f, area: e.target.value }))}>
                  <option value="">Sin área específica</option>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              {([
                { key: 'inicio' as const, label: 'Inicio', rows: 3, color: 'border-sky-300 focus:ring-sky-400', placeholder: 'Disparador, conexión con saberes previos...' },
                { key: 'desarrollo' as const, label: 'Desarrollo', rows: 4, color: 'border-amber-300 focus:ring-amber-400', placeholder: 'La actividad paso a paso...' },
                { key: 'cierre' as const, label: 'Cierre', rows: 3, color: 'border-emerald-300 focus:ring-emerald-400', placeholder: 'Cómo se sistematiza y cierra...' },
              ] as const).map(({ key, label, rows, color, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <textarea className={`textarea border ${color}`} rows={rows} value={actForm[key]} onChange={e => setActForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="label">Materiales (opcional)</label>
                <input className="input" value={actForm.materiales} onChange={e => setActForm(f => ({ ...f, materiales: e.target.value }))} placeholder="Ej: Láminas, témperas, hojas..." />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setActModal(null)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={guardarAct} disabled={savingAct || !actForm.nombre}>
                <Check size={15} /> {savingAct ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IA - generar secuencia completa */}
      {iaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-violet-500" />
                <h3 className="font-bold text-base">Generar secuencia con IA</h3>
              </div>
              <button className="btn-ghost p-1.5" onClick={() => setIaModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="label">Tema o disparador *</label>
                <input className="input" value={iaTema} onChange={e => setIaTema(e.target.value)} placeholder='Ej: "Los insectos del jardín"' />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sala</label>
                  <select className="input" value={iaSala} onChange={e => setIaSala(e.target.value)}>
                    {SALAS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cantidad de actividades</label>
                  <select className="input" value={iaCantidad} onChange={e => setIaCantidad(Number(e.target.value))}>
                    {[2, 3, 4, 5, 6].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={pedirSugerenciaIA} disabled={iaLoading || !iaTema}>
                <Sparkles size={15} /> {iaLoading ? 'Generando...' : 'Generar secuencia'}
              </button>
              {iaSugerencia && (
                <div className="space-y-3">
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {iaSugerencia}
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <Bot size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Usá esta sugerencia como base. Copiá el texto y creá la secuencia manualmente, o usalo como inspiración para tu propia planificación.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
