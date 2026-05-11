import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    console.error('SUPABASE_JWT_SECRET no configurado');
    return res.status(500).json({ error: 'Configuración de servidor incompleta' });
  }

  try {
    const decoded = jwt.verify(token, secret) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
