import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ListChecks, CalendarDays, Sparkles, Plus,
  ChevronRight, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { getProyectos, getSecuencias, getPlanificacion, getPerfil } from '../api';
import type { PerfilData } from '../api';
import type { Proyecto, Secuencia, PlanificacionAnual } from '../types';
import { MESES } from '../types';
import { getProximasEfemerides, formatearFecha } from '../data/efemerides';

function getSaludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getMesActual(): string {
  const idx = new Date().getMonth(); // 0-based
  // El calendario escolar empieza en marzo (índice 2)
  const map: Record<number, string> = {
    2: 'Marzo', 3: 'Abril', 4: 'Mayo', 5: 'Junio',
    6: 'Julio', 7: 'Agosto', 8: 'Septiembre', 9: 'Octubre',
    10: 'Noviembre', 11: 'Diciembre', 0: 'Marzo', 1: 'Marzo',
  };
  return map[idx] ?? MESES[0];
}

export default function Dashboard() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [secuencias, setSecuencias] = useState<Secuencia[]>([]);
  const [planMes, setPlanMes] = useState<PlanificacionAnual[]>([]);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const anio = new Date().getFullYear();
  const mesActual = getMesActual();

  useEffect(() => {
    Promise.all([
      getProyectos(),
      getSecuencias(),
      getPlanificacion(anio),
      getPerfil(),
    ]).then(([p, s, plan, perf]) => {
      setProyectos(p);
      setSecuencias(s);
      setPlanMes(plan.filter(e => e.mes === mesActual));
      setPerfil(perf);
    }).finally(() => setLoading(false));
  }, []);

  const recientes = [...proyectos]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const finalizados = proyectos.filter(p => p.estado === 'finalizado').length;
  const borradores = proyectos.filter(p => p.estado === 'borrador').length;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Saludo */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white shadow-sm">
        <p className="text-emerald-200 text-sm font-medium mb-0.5">{getSaludo()}</p>
        <h2 className="text-xl sm:text-2xl font-bold">
          {perfil?.nombre ? `¡${perfil.nombre}! 🌱` : '¡Bienvenida! 🌱'}
        </h2>
        {perfil?.sala && (
          <p className="text-emerald-200 text-sm mt-1">{perfil.sala} · {perfil.institucion || 'Nivel Inicial'}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/proyectos" className="card p-3 sm:p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{proyectos.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Proyecto{proyectos.length !== 1 ? 's' : ''}</div>
          {proyectos.length > 0 && (
            <div className="text-xs text-slate-400 mt-1 hidden sm:block">
              {finalizados} final. · {borradores} borr.
            </div>
          )}
        </Link>
        <Link to="/secuencias" className="card p-3 sm:p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-2xl sm:text-3xl font-bold text-violet-600">{secuencias.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Secuencia{secuencias.length !== 1 ? 's' : ''}</div>
        </Link>
        <Link to="/planificacion" className="card p-3 sm:p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-2xl sm:text-3xl font-bold text-amber-500">{planMes.length}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">Plan. {mesActual}</div>
        </Link>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Acciones rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Link
            to="/proyectos"
            state={{ openForm: true }}
            className="card p-3.5 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
              <Plus size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Nuevo proyecto</p>
              <p className="text-xs text-slate-400 hidden sm:block">Crear planificación</p>
            </div>
          </Link>
          <Link
            to="/asistente"
            className="card p-3.5 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Asistente IA</p>
              <p className="text-xs text-slate-400 hidden sm:block">Pedir sugerencias</p>
            </div>
          </Link>
          <Link
            to="/planificacion"
            className="card p-3.5 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group sm:col-span-1 col-span-2"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
              <CalendarDays size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Plan. {mesActual}</p>
              <p className="text-xs text-slate-400 hidden sm:block">Ver planificación mensual</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Proyectos recientes */}
      {recientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Proyectos recientes</h3>
            <Link to="/proyectos" className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recientes.map(p => (
              <Link
                key={p.id}
                to={`/proyectos/${p.id}`}
                className="card px-4 py-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen size={15} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{p.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{p.seccion}</span>
                    {p.actividades && p.actividades.length > 0 && (
                      <span className="text-xs text-slate-400">· {p.actividades.length} actividades</span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-0.5">
                      {p.estado === 'finalizado'
                        ? <><CheckCircle2 size={10} className="text-emerald-500" /> Finalizado</>
                        : <><Clock size={10} /> Borrador</>
                      }
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 shrink-0 group-hover:text-emerald-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Plan del mes */}
      {planMes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Planificación de {mesActual}
            </h3>
            <Link to="/planificacion" className="text-xs text-amber-600 font-medium flex items-center gap-0.5 hover:underline">
              Ver completa <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {planMes.slice(0, 3).map(e => (
              <div key={e.id} className="card px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <CalendarDays size={15} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{e.propuesta}</p>
                </div>
              </div>
            ))}
            {planMes.length > 3 && (
              <Link to="/planificacion" className="text-xs text-slate-400 text-center block py-1 hover:text-amber-600 transition-colors">
                +{planMes.length - 3} propuesta{planMes.length - 3 !== 1 ? 's' : ''} más
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty state si no tiene nada */}
      {proyectos.length === 0 && secuencias.length === 0 && (
        <div className="card p-6 text-center border-dashed bg-slate-50/50">
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="font-bold text-slate-700 mb-2">¡Empezá a planificar!</h3>
          <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto">
            Creá tu primer proyecto o pedile ideas a la IA para arrancar.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/proyectos" className="btn-primary text-sm">
              <Plus size={15} /> Nuevo proyecto
            </Link>
            <Link to="/asistente" className="btn-secondary text-sm">
              <Sparkles size={15} className="text-violet-500" /> Hablar con la IA
            </Link>
          </div>
        </div>
      )}

      {/* Efemérides próximas */}
      {(() => {
        const proximas = getProximasEfemerides(3);
        return (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Próximas efemérides</h3>
              <Link to="/efemerides" className="text-xs text-amber-600 font-medium flex items-center gap-0.5 hover:underline">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card p-3 space-y-2.5">
              {proximas.map(e => (
                <div key={`${e.mes}-${e.dia}`} className="flex items-center gap-2.5">
                  <span className="text-lg w-7 text-center shrink-0">{e.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{e.nombre}</p>
                    <p className="text-xs text-slate-400">{formatearFecha(e)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    e.diasRestantes === 0 ? 'bg-red-100 text-red-700' :
                    e.diasRestantes <= 7 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {e.diasRestantes === 0 ? '¡Hoy!' : e.diasRestantes === 1 ? 'Mañana' : `${e.diasRestantes}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Links módulos secundarios */}
      <div className="grid grid-cols-2 gap-2.5 pb-2">
        <Link to="/secuencias" className="card p-3.5 flex items-center gap-2.5 hover:shadow-md transition-all group">
          <ListChecks size={16} className="text-violet-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">Secuencias</p>
            <p className="text-xs text-slate-400 truncate">{secuencias.length} guardada{secuencias.length !== 1 ? 's' : ''}</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 ml-auto shrink-0" />
        </Link>
        <Link to="/guia" className="card p-3.5 flex items-center gap-2.5 hover:shadow-md transition-all">
          <span className="text-base shrink-0">📖</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">Guía de uso</p>
            <p className="text-xs text-slate-400 truncate">Cómo usar la app</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 ml-auto shrink-0" />
        </Link>
      </div>
    </div>
  );
}
