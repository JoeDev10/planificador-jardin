import { Router, Response } from 'express';
import prisma from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  let perfil = await prisma.perfil.findUnique({ where: { userId: req.userId! } });
  if (!perfil) {
    perfil = await prisma.perfil.create({
      data: { userId: req.userId!, nombre: '', institucion: '', sala: '', provincia: '', notas: '' },
    });
  }
  res.json(perfil);
});

router.put('/', async (req: AuthRequest, res: Response) => {
  const { nombre, institucion, sala, provincia, notas } = req.body;
  const perfil = await prisma.perfil.upsert({
    where: { userId: req.userId! },
    update: { nombre, institucion, sala, provincia, notas },
    create: { userId: req.userId!, nombre, institucion, sala, provincia, notas },
  });
  res.json(perfil);
});

export default router;
