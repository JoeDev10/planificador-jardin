import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import proyectosRouter from './routes/proyectos';
import actividadesRouter from './routes/actividades';
import planificacionRouter from './routes/planificacion';
import iaRouter from './routes/ia';
import secuenciasRouter from './routes/secuencias';
import perfilRouter from './routes/perfil';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/proyectos', proyectosRouter);
app.use('/api/actividades', actividadesRouter);
app.use('/api/planificacion', planificacionRouter);
app.use('/api/ia', iaRouter);
app.use('/api/secuencias', secuenciasRouter);
app.use('/api/perfil', perfilRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Solo escucha en local, en Vercel se exporta
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

export default app;
