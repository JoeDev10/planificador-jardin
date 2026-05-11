import { Router, Response } from 'express';
import prisma from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const ORDEN_MES: Record<string, number> = {
  Marzo: 1, Abril: 2, Mayo: 3, Junio: 4, Julio: 5,
  Agosto: 6, Septiembre: 7, Octubre: 8, Noviembre: 9, Diciembre: 10,
};

const router = Router();
router.use(authMiddleware);

router.get('/:anio', async (req: AuthRequest, res: Response) => {
  const items = await prisma.planificacionAnual.findMany({
    where: { anio: Number(req.params.anio), userId: req.userId },
    orderBy: [{ orden: 'asc' }],
  });
  items.sort((a: { mes: string; orden: number }, b: { mes: string; orden: number }) =>
    (ORDEN_MES[a.mes] ?? 99) - (ORDEN_MES[b.mes] ?? 99) || a.orden - b.orden
  );
  res.json(items);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { anio, mes, propuesta, propositos, areasContenidos, objetivos, orden } = req.body;
  const item = await prisma.planificacionAnual.create({
    data: { userId: req.userId, anio: Number(anio), mes, propuesta, propositos, areasContenidos, objetivos, orden: orden || 0 },
  });
  res.status(201).json({ id: item.id });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { mes, propuesta, propositos, areasContenidos, objetivos, orden } = req.body;
  await prisma.planificacionAnual.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { mes, propuesta, propositos, areasContenidos, objetivos, orden: orden || 0 },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.planificacionAnual.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.json({ ok: true });
});

export default router;
