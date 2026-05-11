import { Router, Response } from 'express';
import prisma from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const secuencias = await prisma.secuencia.findMany({
    where: { userId: req.userId },
    include: { actividades: { orderBy: { numero: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(secuencias);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const secuencia = await prisma.secuencia.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!secuencia) return res.status(404).json({ error: 'Secuencia no encontrada' });
  res.json(secuencia);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { titulo, sala, area, duracion, proposito } = req.body;
  const secuencia = await prisma.secuencia.create({
    data: { userId: req.userId, titulo, sala, area: area || '', duracion: duracion || '', proposito: proposito || '' },
  });
  res.status(201).json({ id: secuencia.id });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { titulo, sala, area, duracion, proposito } = req.body;
  await prisma.secuencia.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { titulo, sala, area, duracion, proposito },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.secuencia.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.json({ ok: true });
});

router.post('/:id/duplicar', async (req: AuthRequest, res: Response) => {
  const original = await prisma.secuencia.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!original) return res.status(404).json({ error: 'No encontrada' });
  const { id, createdAt, updatedAt, actividades, titulo, ...data } = original;
  const nueva = await prisma.secuencia.create({
    data: { ...data, userId: req.userId, titulo: `${titulo} (copia)` },
  });
  for (const act of actividades) {
    const { id: _id, createdAt: _ca, secuenciaId: _sid, ...actData } = act;
    await prisma.secuenciaActividad.create({ data: { ...actData, secuenciaId: nueva.id } });
  }
  res.status(201).json({ id: nueva.id });
});

// Actividades de secuencia
router.post('/:id/actividades', async (req: AuthRequest, res: Response) => {
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

router.put('/actividades/:actId', async (req: AuthRequest, res: Response) => {
  const { numero, nombre, inicio, desarrollo, cierre, materiales, area } = req.body;
  await prisma.secuenciaActividad.update({
    where: { id: Number(req.params.actId) },
    data: { numero, nombre, inicio, desarrollo, cierre, materiales, area },
  });
  res.json({ ok: true });
});

router.delete('/actividades/:actId', async (req: AuthRequest, res: Response) => {
  await prisma.secuenciaActividad.delete({ where: { id: Number(req.params.actId) } });
  res.json({ ok: true });
});

export default router;
