import { BookOpen, ListChecks, CalendarDays, Sparkles, Plus, Pencil, Trash2, Copy, GripVertical, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StepProps {
  number: number;
  text: string;
}

function Step({ number, text }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </span>
      <span className="text-slate-600 text-sm leading-relaxed">{text}</span>
    </li>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  steps: string[];
  tips?: string[];
  link?: string;
  linkLabel?: string;
}

function Section({ icon, color, title, subtitle, steps, tips, link, linkLabel }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`${color} px-5 py-4 flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-white text-base leading-tight">{title}</h2>
          <p className="text-white/80 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <Step key={i} number={i + 1} text={step} />
          ))}
        </ol>

        {tips && tips.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1.5">💡 Consejos útiles</p>
            <ul className="space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <ChevronRight size={12} className="mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {link && linkLabel && (
          <Link
            to={link}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Ir a {linkLabel} <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Guia() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="text-4xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-slate-800">Guía de uso</h1>
        <p className="text-slate-500 mt-1 text-sm">Todo lo que necesitás saber para planificar con facilidad</p>
      </div>

      {/* Leyenda de íconos */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Qué significa cada ícono</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: <Plus size={14} />, label: 'Crear nuevo' },
            { icon: <Pencil size={14} />, label: 'Editar' },
            { icon: <Copy size={14} />, label: 'Duplicar' },
            { icon: <Trash2 size={14} />, label: 'Eliminar' },
            { icon: <GripVertical size={14} />, label: 'Arrastrar para reordenar' },
            { icon: <Sparkles size={14} />, label: 'Generar con IA' },
            { icon: <BookOpen size={14} />, label: 'Ver detalle' },
            { icon: <ChevronRight size={14} />, label: 'Navegar' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-slate-100">
              <span className="text-slate-500">{icon}</span>
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proyectos */}
      <Section
        icon={<BookOpen size={20} className="text-white" />}
        color="bg-emerald-600"
        title="Proyectos didácticos"
        subtitle="Organizá tus unidades de trabajo por sala y estado"
        steps={[
          'Hacé clic en el botón verde "+ Nuevo proyecto" para crear uno.',
          'Completá los datos: nombre, sala, duración, fundamentación, propósitos, áreas y evaluación.',
          'Guardá el proyecto. Vas a poder abrirlo para agregar actividades.',
          'Dentro del proyecto, hacé clic en "+ Agregar actividad" para sumar propuestas.',
          'Cada actividad tiene tres momentos: Inicio, Desarrollo y Cierre.',
          'Podés arrastrar las actividades (⠿) para cambiar el orden.',
        ]}
        tips={[
          'Usá el botón "Sugerir con IA" para que la IA complete los tres momentos automáticamente.',
          'Podés duplicar un proyecto completo con todas sus actividades usando el ícono de copiar.',
          'Filtrá tus proyectos por sala o estado (borrador / en curso / finalizado) desde el buscador.',
        ]}
        link="/"
        linkLabel="Proyectos"
      />

      {/* Secuencias */}
      <Section
        icon={<ListChecks size={20} className="text-white" />}
        color="bg-violet-600"
        title="Secuencias didácticas"
        subtitle="Actividades encadenadas sobre un mismo tema o área"
        steps={[
          'Entrá a "Secuencias" desde el menú superior.',
          'Hacé clic en "+ Nueva" para crear una secuencia.',
          'Poné un título, elegí la sala y el área, y completá el propósito.',
          'Dentro de la secuencia, agregá las actividades en orden.',
          'Cada actividad también tiene Inicio, Desarrollo y Cierre.',
        ]}
        tips={[
          'Usá "Generar con IA" para que la IA cree una secuencia completa con todas sus actividades de una vez.',
          'Las secuencias son independientes de los proyectos — son ideales para trabajar contenidos puntuales.',
        ]}
        link="/secuencias"
        linkLabel="Secuencias"
      />

      {/* Planificación anual */}
      <Section
        icon={<CalendarDays size={20} className="text-white" />}
        color="bg-blue-600"
        title="Planificación anual"
        subtitle="Tu mapa de propuestas mes a mes durante el año"
        steps={[
          'Entrá a "Plan. Anual" desde el menú.',
          'Seleccioná el año y hacé clic en "+ Agregar propuesta".',
          'Completá el mes, la propuesta, los propósitos, las áreas y los objetivos.',
          'Las propuestas se organizan automáticamente por mes (marzo a diciembre).',
          'Podés editar o eliminar cada propuesta con los íconos que aparecen al pasar el mouse.',
        ]}
        tips={[
          'Usá "Sugerir con IA" para generar propuestas para un mes entero con un solo clic.',
          'Podés imprimir la planificación anual usando Ctrl+P o el menú de impresión del navegador.',
        ]}
        link="/planificacion"
        linkLabel="Planificación anual"
      />

      {/* Asistente IA */}
      <Section
        icon={<Sparkles size={20} className="text-white" />}
        color="bg-amber-500"
        title="Asistente IA"
        subtitle="Tu asistente pedagógica disponible las 24 horas"
        steps={[
          'Entrá a "Asistente IA" desde el menú.',
          'Seleccioná la sala con la que estás trabajando (2, 3, 4 o 5 años).',
          'Escribí tu consulta en el campo de texto y presioná Enter o el botón de enviar.',
          'El asistente responde con propuestas pedagógicas adaptadas a Nivel Inicial.',
          'Podés hacer preguntas de seguimiento para afinar las respuestas.',
        ]}
        tips={[
          'Podés preguntarle: "¿Qué actividades puedo hacer para el Día de la Primavera?"',
          'También: "Armame la fundamentación de un proyecto sobre el agua".',
          'O: "Dame ideas para el cierre de una secuencia sobre los animales".',
          'El asistente recuerda el contexto de la conversación, así que podés pedir ajustes.',
        ]}
        link="/asistente"
        linkLabel="Asistente IA"
      />

      {/* Preguntas frecuentes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
        <h2 className="font-bold text-slate-700 text-base mb-4">❓ Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            {
              q: '¿Se guardan mis datos automáticamente?',
              a: 'Sí. Todo se guarda en la nube al instante. Podés cerrar la pestaña y al volver todo va a estar como lo dejaste.',
            },
            {
              q: '¿Puedo usar la app desde el celular?',
              a: 'Sí, está diseñada para funcionar en celular, tablet y computadora.',
            },
            {
              q: '¿Qué diferencia hay entre un Proyecto y una Secuencia?',
              a: 'Un Proyecto es una unidad de trabajo completa con fundamentación y evaluación. Una Secuencia es un conjunto de actividades encadenadas sobre un tema específico, más corta y puntual.',
            },
            {
              q: '¿La IA puede equivocarse?',
              a: 'Sí. La IA genera sugerencias, pero siempre revisalas antes de usarlas. Adaptá las propuestas a tu contexto, tu sala y tus niños.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="text-sm font-semibold text-slate-700">{q}</p>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 pb-4">
        Planificador Jardín · Nivel Inicial 🌱
      </p>
    </div>
  );
}
