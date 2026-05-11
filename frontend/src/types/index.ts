export interface Actividad {
  id: number;
  proyectoId: number;
  numero: number;
  nombre: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  materiales: string;
  area: string;
  createdAt: string;
}

export interface Proyecto {
  id: number;
  docenteId?: number;
  nombre: string;
  institucion: string;
  seccion: string;
  duracion: string;
  fundamentacion: string;
  propositos: string;
  areasContenidos: string;
  evaluacion: string;
  estado: 'borrador' | 'finalizado';
  createdAt: string;
  updatedAt: string;
  docente?: { nombre: string; institucion: string };
  actividades?: Actividad[];
}

export interface PlanificacionAnual {
  id: number;
  anio: number;
  mes: string;
  propuesta: string;
  propositos: string;
  areasContenidos: string;
  objetivos: string;
  orden: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecuenciaActividad {
  id: number;
  secuenciaId: number;
  numero: number;
  nombre: string;
  inicio: string;
  desarrollo: string;
  cierre: string;
  materiales: string;
  area: string;
  createdAt: string;
}

export interface Secuencia {
  id: number;
  docenteId?: number;
  titulo: string;
  sala: string;
  area: string;
  duracion: string;
  proposito: string;
  actividades?: SecuenciaActividad[];
  createdAt: string;
  updatedAt: string;
}

export const MESES = [
  'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const SALAS = ['2 años', '3 años', '4 años', '5 años', 'Multiedad'];

export const AREAS = [
  'Formación Personal y Social',
  'Ambiente Natural y Social',
  'Prácticas del Lenguaje',
  'Educación Artística',
  'Matemática',
  'Juego',
  'Educación Física',
];

export const COLORES_MES: Record<string, string> = {
  'Marzo': 'bg-sky-100 text-sky-800 border-sky-200',
  'Abril': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Mayo': 'bg-violet-100 text-violet-800 border-violet-200',
  'Junio': 'bg-amber-100 text-amber-800 border-amber-200',
  'Julio': 'bg-blue-100 text-blue-800 border-blue-200',
  'Agosto': 'bg-orange-100 text-orange-800 border-orange-200',
  'Septiembre': 'bg-rose-100 text-rose-800 border-rose-200',
  'Octubre': 'bg-lime-100 text-lime-800 border-lime-200',
  'Noviembre': 'bg-pink-100 text-pink-800 border-pink-200',
  'Diciembre': 'bg-red-100 text-red-800 border-red-200',
};
