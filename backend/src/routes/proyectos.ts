import { Router, Response } from 'express';
import prisma from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const proyectos = await prisma.proyecto.findMany({
    where: { userId: req.userId },
    include: { actividades: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(proyectos);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const proyecto = await prisma.proyecto.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(proyecto);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion } = req.body;
  const proyecto = await prisma.proyecto.create({
    data: { userId: req.userId, nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion },
  });
  res.status(201).json({ id: proyecto.id });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion, estado } = req.body;
  await prisma.proyecto.updateMany({
    where: { id: Number(req.params.id), userId: req.userId },
    data: { nombre, institucion, seccion, duracion, fundamentacion, propositos, areasContenidos, evaluacion, estado },
  });
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.proyecto.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.json({ ok: true });
});

router.post('/:id/duplicar', async (req: AuthRequest, res: Response) => {
  const original = await prisma.proyecto.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { actividades: { orderBy: { numero: 'asc' } } },
  });
  if (!original) return res.status(404).json({ error: 'No encontrado' });
  const { id, createdAt, updatedAt, actividades, nombre, ...rest } = original;
  const nuevo = await prisma.proyecto.create({
    data: { ...rest, userId: req.userId, nombre: `${nombre} (copia)`, estado: 'borrador' },
  });
  for (const act of actividades) {
    const { id: _id, createdAt: _ca, proyectoId: _pid, ...actData } = act;
    await prisma.actividad.create({ data: { ...actData, proyectoId: nuevo.id } });
  }
  res.status(201).json({ id: nuevo.id });
});

export default router;
