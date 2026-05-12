import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, Trash2, BookOpen, ListChecks, X, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  chatIA, guardarProyectoDesdeIA, guardarSecuenciaDesdeIA,
  createProyecto, createActividad, createSecuencia, createSecuenciaActividad,
} from '../api';
import { SALAS } from '../types';
import { useToast } from '../components/Toast';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGERENCIAS = [
  '¿Qué actividades puedo hacer para el Día de la Primavera con sala de 4 años?',
  'Necesito actividades de matemática para sala de 3 años',
  '¿Cómo armo la fundamentación de un proyecto sobre la familia?',
  'Dame ideas para el cierre de un proyecto sobre animales',
  '¿Qué contenidos de Lenguaje puedo trabajar en sala de 5?',
];

// Detecta si el texto parece un proyecto o secuencia
function detectarTipo(texto: string): 'proyecto' | 'secuencia' | null {
  const lower = texto.toLowerCase();
  const esProyecto = /fundamentaci[oó]n|prop[oó]sitos|[aá]reas y contenidos/.test(lower);
  const esSecuencia = /actividad n[°º]?\s*\d|secuencia didáctica|actividad\s+\d/.test(lower);
  if (esProyecto) return 'proyecto';
  if (esSecuencia) return 'secuencia';
  return null;
}

// Modal de guardado con preview
function GuardarModal({
  tipo, texto, sala, onClose, onGuardado,
}: {
  tipo: 'proyecto' | 'secuencia';
  texto: string;
  sala: string;
  onClose: () => void;
  onGuardado: (id: number) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<'parsing' | 'preview' | 'saving' | 'error'>('parsing');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const parsear = async () => {
      try {
        if (tipo === 'proyecto') {
          const parsed = await guardarProyectoDesdeIA({ texto, sala });
          setData(parsed as unknown as Record<string, unknown>);
        } else {
          const parsed = await guardarSecuenciaDesdeIA({ texto, sala });
          setData(parsed as unknown as Record<string, unknown>);
        }
        setStep('preview');
      } catch {
        setErrorMsg('No se pudo interpretar el contenido. Intentá con una respuesta más completa de la IA.');
        setStep('error');
      }
    };
    parsear();
  }, []);

  const guardar = async () => {
    if (!data) return;
    setStep('saving');
    try {
      if (tipo === 'proyecto') {
        const d = data as {
          nombre: string; fundamentacion: string; propositos: string;
          areasContenidos: string; evaluacion: string; sala: string;
          actividades: { nombre: string; inicio: string; desarrollo: string; cierre: string; materiales: string }[];
        };
        const { id } = await createProyecto({
          nombre: d.nombre,
          institucion: '',
          seccion: d.sala || sala,
          duracion: '',
          fundamentacion: d.fundamentacion,
          propositos: d.propositos,
          areasContenidos: d.areasContenidos,
          evaluacion: d.evaluacion,
          estado: 'borrador',
        });
        for (let i = 0; i < (d.actividades ?? []).length; i++) {
          const act = d.actividades[i];
          await createActividad({
            proyectoId: id,
            numero: i + 1,
            nombre: act.nombre,
            inicio: act.inicio,
            desarrollo: act.desarrollo,
            cierre: act.cierre,
            materiales: act.materiales || '',
            area: '',
          });
        }
        toast(`Proyecto "${d.nombre}" guardado`, 'success');
        onGuardado(id);
      } else {
        const d = data as {
          titulo: string; proposito: string; sala: string; area: string; duracion: string;
          actividades: { numero: number; nombre: string; inicio: string; desarrollo: string; cierre: string; materiales: string }[];
        };
        const { id } = await createSecuencia({
          titulo: d.titulo,
          sala: d.sala || sala,
          area: d.area || '',
          duracion: d.duracion || '',
          proposito: d.proposito,
        });
        for (const act of (d.actividades ?? [])) {
          await createSecuenciaActividad(id, {
            numero: act.numero,
            nombre: act.nombre,
            inicio: act.inicio,
            desarrollo: act.desarrollo,
            cierre: act.cierre,
            materiales: act.materiales || '',
            area: '',
          });
        }
        toast(`Secuencia "${d.titulo}" guardada`, 'success');
        onGuardado(id);
      }
    } catch {
      toast('Error al guardar', 'error');
      setStep('preview');
    }
  };

  const esProyecto = tipo === 'proyecto';
  const d = data as Record<string, unknown> | null;
  const actividades = (d?.actividades as unknown[]) ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {esProyecto ? <BookOpen size={16} className="text-emerald-600" /> : <ListChecks size={16} className="text-violet-600" />}
            <h3 className="font-bold text-sm">
              Guardar como {esProyecto ? 'proyecto' : 'secuencia'}
            </h3>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-4">
          {/* Parseando */}
          {step === 'parsing' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 size={28} className="text-violet-500 animate-spin mx-auto" />
              <p className="text-slate-600 text-sm font-medium">Interpretando la respuesta de la IA...</p>
              <p className="text-slate-400 text-xs">Esto tarda unos segundos</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-3">
              <p className="text-2xl">😕</p>
              <p className="text-slate-700 font-medium text-sm">{errorMsg}</p>
              <button className="btn-secondary text-sm" onClick={onClose}>Cerrar</button>
            </div>
          )}

          {/* Preview */}
          {(step === 'preview' || step === 'saving') && d && (
            <div className="space-y-3">
              <div className={`rounded-xl p-3 ${esProyecto ? 'bg-emerald-50 border border-emerald-200' : 'bg-violet-50 border border-violet-200'}`}>
                <p className="font-bold text-slate-800 text-sm">
                  {esProyecto ? String(d.nombre ?? '') : String(d.titulo ?? '')}
                </p>
                {esProyecto && d.sala && (
                  <p className="text-xs text-slate-500 mt-0.5">{String(d.sala)}</p>
                )}
                {!esProyecto && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {d.sala && <span className="badge bg-white text-slate-600 text-xs border">{String(d.sala)}</span>}
                    {d.area && <span className="badge bg-white text-slate-600 text-xs border">{String(d.area)}</span>}
                  </div>
                )}
              </div>

              {esProyecto && d.fundamentacion && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fundamentación</p>
                  <p className="text-xs text-slate-600 line-clamp-3">{String(d.fundamentacion)}</p>
                </div>
              )}

              {!esProyecto && d.proposito && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Propósito</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{String(d.proposito)}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}
                </p>
                <div className="space-y-1">
                  {(actividades as Record<string, unknown>[]).slice(0, 5).map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {String(act.nombre ?? '')}
                    </div>
                  ))}
                  {actividades.length > 5 && (
                    <p className="text-xs text-slate-400 text-center">+{actividades.length - 5} más</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                💡 Podés editar todos los campos después de guardarlo
              </p>

              <div className="flex gap-2 pt-1">
                <button className="btn-secondary flex-1 justify-center text-sm" onClick={onClose}>Cancelar</button>
                <button
                  className="btn-primary flex-1 justify-center text-sm"
                  onClick={guardar}
                  disabled={step === 'saving'}
                >
                  {step === 'saving' ? (
                    <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><Check size={14} /> Guardar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Asistente() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sala, setSala] = useState('4 años');
  const [guardarModal, setGuardarModal] = useState<{ tipo: 'proyecto' | 'secuencia'; texto: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const enviar = async (texto?: string) => {
    const msg = texto || input.trim();
    if (!msg || loading) return;
    const contextMsg = `[Sala: ${sala}] ${msg}`;
    const newMessages: Message[] = [...messages, { role: 'user', content: contextMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { respuesta } = await chatIA(newMessages);
      setMessages(m => [...m, { role: 'assistant', content: respuesta }]);
    } catch {
      toast('Error al conectar con la IA. Revisá tu conexión.', 'error');
      setMessages(m => m.slice(0, -1));
    }
    setLoading(false);
  };

  const handleGuardado = (tipo: 'proyecto' | 'secuencia', id: number) => {
    setGuardarModal(null);
    if (tipo === 'proyecto') {
      navigate(`/proyectos/${id}`);
    } else {
      navigate('/secuencias');
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={20} className="text-violet-500" /> Asistente IA
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Tu asistente pedagógica de Nivel Inicial</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-28 sm:w-32 text-sm py-1.5" value={sala} onChange={e => setSala(e.target.value)}>
            {SALAS.map(s => <option key={s}>{s}</option>)}
          </select>
          {messages.length > 0 && (
            <button className="btn-ghost p-2" onClick={() => setMessages([])} title="Limpiar">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto card p-3 sm:p-4 space-y-3 mb-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles size={30} className="text-violet-500" />
            </div>
            <h3 className="font-bold text-slate-700 text-base sm:text-lg mb-1">Hola! ¿En qué te ayudo hoy?</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-5 max-w-xs leading-relaxed">
              Soy tu asistente de Nivel Inicial. Puedo ayudarte con actividades, proyectos, fundamentaciones y mucho más.
            </p>
            <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Sugerencias</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGERENCIAS.map(s => (
                <button
                  key={s}
                  className="text-left text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 hover:bg-violet-50 hover:border-violet-300 hover:shadow-sm transition-all text-slate-600 bg-white"
                  onClick={() => enviar(s)}
                >
                  <span className="text-violet-400 mr-2">→</span>{s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => {
              const tipo = m.role === 'assistant' ? detectarTipo(m.content) : null;
              return (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-violet-100 text-violet-600'
                  }`}>
                    {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div className="max-w-[80%] flex flex-col gap-1.5">
                    <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                      {m.role === 'user' ? m.content.replace(/^\[Sala: [^\]]+\] /, '') : m.content}
                    </div>
                    {/* Botones guardar — solo en mensajes del asistente con contenido detectado */}
                    {tipo && (
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium inline-flex items-center gap-1.5 transition-colors ${
                            tipo === 'proyecto'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                          }`}
                          onClick={() => setGuardarModal({ tipo, texto: m.content })}
                        >
                          {tipo === 'proyecto' ? <BookOpen size={11} /> : <ListChecks size={11} />}
                          Guardar como {tipo}
                        </button>
                        {/* También ofrece la alternativa */}
                        {tipo === 'proyecto' && (
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 font-medium inline-flex items-center gap-1.5 transition-colors"
                            onClick={() => setGuardarModal({ tipo: 'secuencia', texto: m.content })}
                          >
                            <ListChecks size={11} />
                            ...o como secuencia
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Bot size={13} />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-slate-400 text-sm">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          className="textarea flex-1 resize-none text-sm"
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribí tu consulta..."
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
        />
        <button
          className="btn-primary self-end px-4 py-2.5"
          onClick={() => enviar()}
          disabled={!input.trim() || loading}
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1">Enter para enviar · Shift+Enter para nueva línea</p>

      {/* Modal guardar desde IA */}
      {guardarModal && (
        <GuardarModal
          tipo={guardarModal.tipo}
          texto={guardarModal.texto}
          sala={sala}
          onClose={() => setGuardarModal(null)}
          onGuardado={(id) => handleGuardado(guardarModal.tipo, id)}
        />
      )}
    </div>
  );
}
