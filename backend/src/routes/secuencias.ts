import { Router, Request, Response } from 'express';
import prisma from '../db/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const secuencias = await prisma.secuencia.findMany({
    include: { actividades: { orderBy: { numero: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(secuencias);
});

router.get('/:id', async (req: Request, res: Response) => {
  const secuencia = await prisma.secuencia.findUnique({
    where: { id: Number(req.params.id) },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!secuencia) return res.status(404).json({ error: 'Secuencia no encontrada' });
  res.json(secuencia);
});

router.post('/', async (req: Request, res: Response) => {
  const { titulo, sala, area, duracion, proposito } = req.body;
  const secuencia = await prisma.secuencia.create({
    data: { titulo, sala, area: area || '', duracion: duracion || '', proposito: proposito || '' },
  });
  res.status(201).json({ id: secuencia.id });
});

router.put('/:id', async (req: Request, res: Response) => {
  const { titulo, sala, area, duracion, proposito } = req.body;
  await prisma.secuencia.update({
    where: { id: Number(req.params.id) },
    data: { titulo, sala, area, duracion, proposito },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.secuencia.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

router.post('/:id/duplicar', async (req: Request, res: Response) => {
  const original = await prisma.secuencia.findUnique({
    where: { id: Number(req.params.id) },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!original) return res.status(404).json({ error: 'No encontrada' });
  const { id, createdAt, updatedAt, actividades, ...data } = original;
  const nueva = await prisma.secuencia.create({
    data: { ...data, titulo: `${data.titulo} (copia)` },
  });
  for (const act of actividades) {
    const { id: _id, createdAt: _ca, secuenciaId: _sid, ...actData } = act;
    await prisma.secuenciaActividad.create({ data: { ...actData, secuenciaId: nueva.id } });
  }
  res.status(201).json({ id: nueva.id });
});

// Actividades de secuencia
router.post('/:id/actividades', async (req: Request, res: Response) => {
  const { numero, nombre, inicio, desarrollo, cierre, materiales, area } = req.body;
  const act = await prisma.secuenciaActividad.create({
    data: {
      secuenciaId: Number(req.params.id),
      numero, nombre,
      inicio: inicio || '', desarrollo: desarrollo || '', cierre: cierre || '',
      materiales: materiales || '', area: area || '',
    },
  });
  res.status(201).json({ id: act.id });
});

router.put('/actividades/:actId', async (req: Request, res: Response) => {
  const { numero, nombre, inicio, desarrollo, cierre, materiales, area } = req.body;
  await prisma.secuenciaActividad.update({
    where: { id: Number(req.params.actId) },
    data: { numero, nombre, inicio, desarrollo, cierre, materiales, area },
  });
  res.json({ ok: true });
});

router.delete('/actividades/:actId', async (req: Request, res: Response) => {
  await prisma.secuenciaActividad.delete({ where: { id: Number(req.params.actId) } });
  res.json({ ok: true });
});

export default router;
