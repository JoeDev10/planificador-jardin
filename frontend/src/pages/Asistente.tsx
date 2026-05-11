import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, Trash2 } from 'lucide-react';
import { chatIA } from '../api';
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

export default function Asistente() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sala, setSala] = useState('4 años');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-violet-100 text-violet-600'
                }`}>
                  {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                }`}>
                  {m.role === 'user' ? m.content.replace(/^\[Sala: [^\]]+\] /, '') : m.content}
                </div>
              </div>
            ))}
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
          ref={textareaRef}
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
    </div>
  );
}
