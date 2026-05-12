import axios from 'axios';
import type { Proyecto, Actividad, PlanificacionAnual, Secuencia, SecuenciaActividad } from '../types';
import { supabase } from '../lib/supabase';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const api = axios.create({ baseURL: BASE });

// Interceptor: agrega el token de Supabase en cada request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Proyectos
export const getProyectos = () => api.get<Proyecto[]>('/proyectos').then(r => r.data);
export const getProyecto = (id: number) => api.get<Proyecto>(`/proyectos/${id}`).then(r => r.data);
export const createProyecto = (data: Omit<Proyecto, 'id' | 'createdAt' | 'updatedAt' | 'actividades' | 'docente'>) =>
  api.post<{ id: number }>('/proyectos', data).then(r => r.data);
export const updateProyecto = (id: number, data: Partial<Proyecto>) =>
  api.put(`/proyectos/${id}`, data).then(r => r.data);
export const deleteProyecto = (id: number) => api.delete(`/proyectos/${id}`).then(r => r.data);
export const duplicarProyecto = (id: number) =>
  api.post<{ id: number }>(`/proyectos/${id}/duplicar`).then(r => r.data);

// Actividades
export const createActividad = (data: Omit<Actividad, 'id' | 'createdAt'>) =>
  api.post<{ id: number }>('/actividades', data).then(r => r.data);
export const updateActividad = (id: number, data: Partial<Actividad>) =>
  api.put(`/actividades/${id}`, data).then(r => r.data);
export const deleteActividad = (id: number) => api.delete(`/actividades/${id}`).then(r => r.data);
export const duplicarActividad = (id: number) =>
  api.post<{ id: number }>(`/actividades/${id}/duplicar`).then(r => r.data);

// Secuencias
export const getSecuencias = () => api.get<Secuencia[]>('/secuencias').then(r => r.data);
export const getSecuencia = (id: number) => api.get<Secuencia>(`/secuencias/${id}`).then(r => r.data);
export const createSecuencia = (data: Omit<Secuencia, 'id' | 'createdAt' | 'updatedAt' | 'actividades'>) =>
  api.post<{ id: number }>('/secuencias', data).then(r => r.data);
export const updateSecuencia = (id: number, data: Partial<Secuencia>) =>
  api.put(`/secuencias/${id}`, data).then(r => r.data);
export const deleteSecuencia = (id: number) => api.delete(`/secuencias/${id}`).then(r => r.data);
export const duplicarSecuencia = (id: number) =>
  api.post<{ id: number }>(`/secuencias/${id}/duplicar`).then(r => r.data);

// Actividades de secuencia
export const createSecuenciaActividad = (secuenciaId: number, data: Omit<SecuenciaActividad, 'id' | 'createdAt' | 'secuenciaId'>) =>
  api.post<{ id: number }>(`/secuencias/${secuenciaId}/actividades`, data).then(r => r.data);
export const updateSecuenciaActividad = (actId: number, data: Partial<SecuenciaActividad>) =>
  api.put(`/secuencias/actividades/${actId}`, data).then(r => r.data);
export const deleteSecuenciaActividad = (actId: number) =>
  api.delete(`/secuencias/actividades/${actId}`).then(r => r.data);

// Planificación anual
export const getPlanificacion = (anio: number) =>
  api.get<PlanificacionAnual[]>(`/planificacion/${anio}`).then(r => r.data);
export const createPlanificacion = (data: Omit<PlanificacionAnual, 'id' | 'createdAt' | 'updatedAt'>) =>
  api.post<{ id: number }>('/planificacion', data).then(r => r.data);
export const updatePlanificacion = (id: number, data: Partial<PlanificacionAnual>) =>
  api.put(`/planificacion/${id}`, data).then(r => r.data);
export const deletePlanificacion = (id: number) => api.delete(`/planificacion/${id}`).then(r => r.data);

// Perfil
export interface PerfilData {
  id?: number;
  nombre: string;
  institucion: string;
  sala: string;
  provincia: string;
  notas: string;
}
export const getPerfil = () => api.get<PerfilData>('/perfil').then(r => r.data);
export const updatePerfil = (data: Omit<PerfilData, 'id'>) => api.put<PerfilData>('/perfil', data).then(r => r.data);

// Chat historial
export const limpiarHistorialChat = () => api.delete('/ia/chat/historial').then(r => r.data);

// IA
export const guardarProyectoDesdeIA = (data: { texto: string; sala?: string }) =>
  api.post<{
    nombre: string; fundamentacion: string; propositos: string;
    areasContenidos: string; evaluacion: string; sala: string;
    actividades: { nombre: string; inicio: string; desarrollo: string; cierre: string; materiales: string }[];
  }>('/ia/guardar-proyecto', data).then(r => r.data);

export const guardarSecuenciaDesdeIA = (data: { texto: string; sala?: string }) =>
  api.post<{
    titulo: string; proposito: string; sala: string; area: string; duracion: string;
    actividades: { numero: number; nombre: string; inicio: string; desarrollo: string; cierre: string; materiales: string }[];
  }>('/ia/guardar-secuencia', data).then(r => r.data);

export const sugerirActividad = (data: { objetivo: string; sala?: string; area?: string; contexto?: string }) =>
  api.post<{ respuesta: string }>('/ia/sugerir-actividad', data).then(r => r.data);
export const sugerirProyecto = (data: { tema: string; sala?: string; duracion?: string }) =>
  api.post<{ respuesta: string }>('/ia/sugerir-proyecto', data).then(r => r.data);
export const chatIA = (messages: { role: 'user' | 'assistant'; content: string }[]) =>
  api.post<{ respuesta: string }>('/ia/chat', { messages }).then(r => r.data);
export const sugerirPlanificacionMensual = (data: { mes: string; sala?: string; cantidadPropuestas?: number }) =>
  api.post<{ respuesta: string }>('/ia/planificacion-mensual', data).then(r => r.data);
export const sugerirSecuencia = (data: { tema: string; sala?: string; cantidadActividades?: number }) =>
  api.post<{ respuesta: string }>('/ia/sugerir-secuencia', data).then(r => r.data);
