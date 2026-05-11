import { Router, Request, Response } from 'express';
import prisma from '../db/database';

const ORDEN_MES: Record<string, number> = {
  Marzo: 1, Abril: 2, Mayo: 3, Junio: 4, Julio: 5,
  Agosto: 6, Septiembre: 7, Octubre: 8, Noviembre: 9, Diciembre: 10,
};

const router = Router();

router.get('/:anio', async (req: Request, res: Response) => {
  const items = await prisma.planificacionAnual.findMany({
    where: { anio: Number(req.params.anio) },
    orderBy: [{ orden: 'asc' }],
  });
  items.sort((a: { mes: string; orden: number }, b: { mes: string; orden: number }) => (ORDEN_MES[a.mes] ?? 99) - (ORDEN_MES[b.mes] ?? 99) || a.orden - b.orden);
  res.json(items);
});

router.post('/', async (req: Request, res: Response) => {
  const { docenteId, anio, mes, propuesta, propositos, areasContenidos, objetivos, orden } = req.body;
  const item = await prisma.planificacionAnual.create({
    data: { docenteId: docenteId || null, anio: Number(anio), mes, propuesta, propositos, areasContenidos, objetivos, orden: orden || 0 },
  });
  res.status(201).json({ id: item.id });
});

router.put('/:id', async (req: Request, res: Response) => {
  const { mes, propuesta, propositos, areasContenidos, objetivos, orden } = req.body;
  await prisma.planificacionAnual.update({
    where: { id: Number(req.params.id) },
    data: { mes, propuesta, propositos, areasContenidos, objetivos, orden: orden || 0 },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.planificacionAnual.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default router;
