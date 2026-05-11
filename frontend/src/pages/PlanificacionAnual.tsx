import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, ChevronDown, ChevronUp, X, Check, CalendarDays } from 'lucide-react';
import { getPlanificacion, createPlanificacion, updatePlanificacion, deletePlanificacion, sugerirPlanificacionMensual } from '../api';
import type { PlanificacionAnual } from '../types';
import { MESES, COLORES_MES, SALAS } from '../types';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { PlanificacionSkeleton } from '../components/Skeleton';

const ANIO_ACTUAL = new Date().getFullYear();

type FormData = Omit<PlanificacionAnual, 'id' | 'createdAt' | 'updatedAt'>;
const emptyForm = (mes?: string): FormData => ({
  anio: ANIO_ACTUAL, mes: mes || MESES[0], propuesta: '', propositos: '', areasContenidos: '', objetivos: '', orden: 0,
});

export default function PlanificacionAnualPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [items, setItems] = useState<PlanificacionAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanificacionAnual | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [expandedMes, setExpandedMes] = useState<string | null>(null);
  const [iaModal, setIaModal] = useState<{ mes: string } | null>(null);
  const [iaSala, setIaSala] = useState('4 años');
  const [iaCantidad, setIaCantidad] = useState(3);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSugerencia, setIaSugerencia] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try { setItems(await getPlanificacion(anio)); }
    catch { toast('Error al cargar la planificación', 'error'); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [anio]);

  const porMes = MESES.reduce<Record<string, PlanificacionAnual[]>>((acc, mes) => {
    acc[mes] = items.filter(i => i.mes === mes);
    return acc;
  }, {});

  const guardar = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updatePlanificacion(editing.id, form);
        toast('Propuesta actualizada');
      } else {
        await createPlanificacion(form);
        toast('Propuesta creada');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      cargar();
    } catch { toast('Error al guardar', 'error'); }
    setSaving(false);
  };

  const eliminar = async (id: number, nombre: string) => {
    const ok = await confirm({
      title: '¿Eliminar propuesta?',
      message: `Se eliminará "${nombre}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try { await deletePlanificacion(id); toast('Propuesta eliminada'); cargar(); }
    catch { toast('Error al eliminar', 'error'); }
  };

  const abrirEdicion = (item: PlanificacionAnual) => {
    setEditing(item);
    setForm({ anio: item.anio, mes: item.mes, propuesta: item.propuesta, propositos: item.propositos, areasContenidos: item.areasContenidos, objetivos: item.objetivos, orden: item.orden });
    setShowForm(true);
  };

  const abrirNuevo = (mes?: string) => {
    setEditing(null);
    setForm(emptyForm(mes));
    setShowForm(true);
  };

  const pedirSugerenciaIA = async () => {
    if (!iaModal) return;
    setIaLoading(true);
    setIaSugerencia('');
    try {
      const { respuesta } = await sugerirPlanificacionMensual({ mes: iaModal.mes, sala: iaSala, cantidadPropuestas: iaCantidad });
      setIaSugerencia(respuesta);
    } catch { toast('Error al conectar con la IA', 'error'); }
    setIaLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Planificación Anual</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Organizá tus propuestas por mes</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-24 text-sm py-1.5" value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => <option key={a}>{a}</option>)}
          </select>
          <button className="btn-primary text-sm py-2 px-3" onClick={() => abrirNuevo()}>
            <Plus size={15} /><span className="hidden sm:inline"> Nueva propuesta</span>
          </button>
        </div>
      </div>

      {/* Tabla impresión */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-center">Planificación Anual {anio}</h1>
        <table className="w-full border-collapse text-sm mt-4">
          <thead>
            <tr className="bg-slate-100">
              {['Mes', 'Propuesta', 'Propósitos', 'Áreas y Contenidos', 'Objetivos'].map(h => (
                <th key={h} className="border border-slate-300 px-2 py-1 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 px-2 py-1 font-medium">{item.mes}</td>
                <td className="border border-slate-300 px-2 py-1">{item.propuesta}</td>
                <td className="border border-slate-300 px-2 py-1 whitespace-pre-wrap">{item.propositos}</td>
                <td className="border border-slate-300 px-2 py-1 whitespace-pre-wrap">{item.areasContenidos}</td>
                <td className="border border-slate-300 px-2 py-1 whitespace-pre-wrap">{item.objetivos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? (
        <PlanificacionSkeleton />
      ) : items.length === 0 && !loading ? (
        <div className="text-center py-10 px-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={30} className="text-sky-600" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">Planificá el año {anio}</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Organizá tus propuestas mes a mes. Abrí cualquier mes para agregar o usar la IA.
          </p>
        </div>
      ) : (
        <div className="space-y-2 no-print">
          {MESES.map(mes => {
            const propuestas = porMes[mes];
            const isOpen = expandedMes === mes;
            const color = COLORES_MES[mes] || 'bg-slate-100 text-slate-700 border-slate-200';
            return (
              <div key={mes} className="card overflow-hidden">
                <div
                  className="flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedMes(isOpen ? null : mes)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className={`badge border ${color} font-semibold min-w-20 sm:min-w-24 justify-center text-xs shrink-0`}>{mes}</span>
                    <span className="text-xs text-slate-500 truncate">{propuestas.length} propuesta{propuestas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost text-xs py-1 px-1.5 sm:px-2" onClick={() => { setIaModal({ mes }); setIaSugerencia(''); }}>
                      <Sparkles size={12} /><span className="hidden sm:inline"> IA</span>
                    </button>
                    <button className="btn-ghost text-xs py-1 px-1.5 sm:px-2" onClick={() => abrirNuevo(mes)}>
                      <Plus size={12} /><span className="hidden sm:inline"> Agregar</span>
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100">
                    {propuestas.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-400 italic text-center">Sin propuestas para este mes.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {propuestas.map(item => (
                          <div key={item.id} className="px-3 sm:px-6 py-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-semibold text-slate-800 text-sm">{item.propuesta}</p>
                              <div className="flex gap-1 shrink-0">
                                <button className="btn-ghost p-1" onClick={() => abrirEdicion(item)}><Pencil size={13} /></button>
                                <button className="btn-danger p-1" onClick={() => eliminar(item.id, item.propuesta)}><Trash2 size={13} /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-slate-600">
                              {[
                                { label: 'Propósitos', value: item.propositos },
                                { label: 'Áreas y Contenidos', value: item.areasContenidos },
                                { label: 'Objetivos', value: item.objetivos },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <span className="font-semibold text-slate-400 uppercase tracking-wide block mb-0.5 text-xs">{label}</span>
                                  <p className="whitespace-pre-wrap">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base">{editing ? 'Editar propuesta' : 'Nueva propuesta'}</h3>
              <button className="btn-ghost p-1.5" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Mes</label>
                  <select className="input" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}>
                    {MESES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Año</label>
                  <select className="input" value={form.anio} onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}>
                    {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Propuesta / Nombre</label>
                <input className="input" value={form.propuesta} onChange={e => setForm(f => ({ ...f, propuesta: e.target.value }))} placeholder="Ej: Huellas de Libertad" />
              </div>
              <div>
                <label className="label">Propósitos</label>
                <textarea className="textarea" rows={3} value={form.propositos} onChange={e => setForm(f => ({ ...f, propositos: e.target.value }))} />
              </div>
              <div>
                <label className="label">Áreas y Contenidos</label>
                <textarea className="textarea" rows={3} value={form.areasContenidos} onChange={e => setForm(f => ({ ...f, areasContenidos: e.target.value }))} />
              </div>
              <div>
                <label className="label">Objetivos</label>
                <textarea className="textarea" rows={2} value={form.objetivos} onChange={e => setForm(f => ({ ...f, objetivos: e.target.value }))} />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={guardar} disabled={saving || !form.propuesta}>
                <Check size={15} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IA */}
      {iaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-sheet bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-violet-500" />
                <h3 className="font-bold text-base">Sugerencias IA — {iaModal.mes}</h3>
              </div>
              <button className="btn-ghost p-1.5" onClick={() => setIaModal(null)}><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sala</label>
                  <select className="input" value={iaSala} onChange={e => setIaSala(e.target.value)}>
                    {SALAS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cantidad</label>
                  <select className="input" value={iaCantidad} onChange={e => setIaCantidad(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={pedirSugerenciaIA} disabled={iaLoading}>
                <Sparkles size={15} /> {iaLoading ? 'Generando...' : 'Generar sugerencias'}
              </button>
              {iaSugerencia && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {iaSugerencia}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
