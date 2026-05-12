import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  EFEMERIDES, TIPO_COLOR, TIPO_LABEL, formatearFecha, getProximasEfemerides,
} from '../data/efemerides';
import { MESES } from '../types';

const MESES_NUM: Record<string, number> = {
  Marzo: 3, Abril: 4, Mayo: 5, Junio: 6, Julio: 7,
  Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
};

export default function EfemeridesPage() {
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const mesActualNum = new Date().getMonth() + 1;

  const efemeridesVista = mesSeleccionado
    ? EFEMERIDES.filter(e => e.mes === MESES_NUM[mesSeleccionado])
    : getProximasEfemerides(10);

  const proximas = getProximasEfemerides(3);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays size={22} className="text-amber-500" />
          Efemérides escolares
        </h2>
        <p className="text-slate-500 text-sm mt-1">Fechas importantes del año escolar argentino</p>
      </div>

      {/* Próximas (siempre visibles arriba) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">📌 Próximas fechas</p>
        {proximas.map(e => (
          <div key={`${e.mes}-${e.dia}`} className="flex items-center gap-3">
            <span className="text-xl w-8 text-center shrink-0">{e.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{e.nombre}</p>
              <p className="text-xs text-slate-500">{formatearFecha(e)}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${
              e.diasRestantes === 0 ? 'bg-red-100 text-red-700 border-red-200' :
              e.diasRestantes <= 7 ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {e.diasRestantes === 0 ? '¡Hoy!' : e.diasRestantes === 1 ? 'Mañana' : `En ${e.diasRestantes} días`}
            </span>
          </div>
        ))}
      </div>

      {/* Filtro por mes */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Ver por mes</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMesSeleccionado('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              !mesSeleccionado
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
            }`}
          >
            Próximas
          </button>
          {MESES.map(m => {
            const num = MESES_NUM[m];
            const count = EFEMERIDES.filter(e => e.mes === num).length;
            const esMesActual = num === mesActualNum;
            return (
              <button
                key={m}
                onClick={() => setMesSeleccionado(m === mesSeleccionado ? '' : m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors relative ${
                  mesSeleccionado === m
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : esMesActual
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {m}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] ${mesSeleccionado === m ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
                {esMesActual && mesSeleccionado !== m && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de efemérides */}
      <div className="space-y-2">
        {mesSeleccionado && (
          <p className="text-xs text-slate-400 font-medium">
            {efemeridesVista.length} fecha{efemeridesVista.length !== 1 ? 's' : ''} en {mesSeleccionado}
          </p>
        )}
        {efemeridesVista.length === 0 ? (
          <div className="card p-6 text-center text-slate-400">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm">Sin efemérides para este mes</p>
          </div>
        ) : (
          efemeridesVista.map(e => (
            <div key={`${e.mes}-${e.dia}`} className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
              <span className="text-2xl w-10 text-center shrink-0 mt-0.5">{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{e.nombre}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${TIPO_COLOR[e.tipo]}`}>
                    {TIPO_LABEL[e.tipo]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatearFecha(e)}</p>
                {e.descripcion && (
                  <p className="text-xs text-slate-400 mt-1 italic">{e.descripcion}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 pt-2">
        {Object.entries(TIPO_LABEL).map(([tipo, label]) => (
          <span key={tipo} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TIPO_COLOR[tipo]}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
