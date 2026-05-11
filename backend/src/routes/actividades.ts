import { Router, Response } from 'express';
import prisma from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  const { proyectoId, numero, nombre, inicio, desarrollo, cierre, materiales, area } = req.body;
  const actividad = await prisma.actividad.create({
    data: { proyectoId: Number(proyectoId), numero, nombre, inicio, desarrollo, cierre, materiales: materiales || '', area: area || '' },
  });
  res.status(201).json({ id: actividad.id });
});

router.put('/reorder/:proyectoId', async (req: AuthRequest, res: Response) => {
  const { orden } = req.body as { orden: { id: number; numero: number }[] };
  await prisma.$transaction(
    orden.map(item => prisma.actividad.update({ where: { id: item.id }, data: { numero: item.numero } }))
  );
  res.json({ ok: true });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { numero, nombre, inicio, desarrollo, cierre, materiales, area } = req.body;
  await prisma.actividad.update({
    where: { id: Number(req.params.id) },
    data: { numero, nombre, inicio, desarrollo, cierre, materiales: materiales || '', area: area || '' },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.actividad.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

router.post('/:id/duplicar', async (req: AuthRequest, res: Response) => {
  const original = await prisma.actividad.findUnique({ where: { id: Number(req.params.id) } });
  if (!original) return res.status(404).json({ error: 'No encontrada' });
  const { id, createdAt, numero, nombre, ...rest } = original;
  const nueva = await prisma.actividad.create({
    data: { ...rest, nombre: `${nombre} (copia)`, numero: numero + 1 },
  });
  res.status(201).json({ id: nueva.id });
});

export default router;
