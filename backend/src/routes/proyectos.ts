import { Router, Request, Response } from 'express';
import prisma from '../db/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const proyectos = await prisma.proyecto.findMany({
    include: { docente: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(proyectos);
});

router.get('/:id', async (req: Request, res: Response) => {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      docente: true,
      actividades: { orderBy: { numero: 'asc' } },
    },
  });
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(proyecto);
});

router.post('/', async (req: Request, res: Response) => {
  const { docenteId, nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion } = req.body;
  const proyecto = await prisma.proyecto.create({
    data: { docenteId: docenteId || null, nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion },
  });
  res.status(201).json({ id: proyecto.id });
});

router.put('/:id', async (req: Request, res: Response) => {
  const { nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion, estado } = req.body;
  await prisma.proyecto.update({
    where: { id: Number(req.params.id) },
    data: { nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion, estado },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.proyecto.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

router.post('/:id/duplicar', async (req: Request, res: Response) => {
  const original = await prisma.proyecto.findUnique({
    where: { id: Number(req.params.id) },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!original) return res.status(404).json({ error: 'No encontrado' });
  const { id, createdAt, updatedAt, actividades, docente, nombre, ...rest } = original;
  const nuevo = await prisma.proyecto.create({
    data: { ...rest, nombre: `${nombre} (copia)`, estado: 'borrador' },
  });
  for (const act of actividades) {
    const { id: _id, createdAt: _ca, proyectoId: _pid, ...actData } = act;
    await prisma.actividad.create({ data: { ...actData, proyectoId: nuevo.id } });
  }
  res.status(201).json({ id: nuevo.id });
});

export default router;
