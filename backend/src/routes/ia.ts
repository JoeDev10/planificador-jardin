import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `Sos una asistente especializada en planificación didáctica para el Nivel Inicial argentino (jardín de infantes, salas de 2 a 5 años). Tu rol es ayudar a docentes a crear planificaciones pedagógicas de alta calidad, siguiendo el Diseño Curricular del Nivel Inicial.

Conocés en profundidad:
- Las áreas curriculares: Formación Personal y Social (FPS), Ambiente Natural y Social, Prácticas del Lenguaje, Educación Artística (Plástica, Música, Teatro, Expresión Corporal), Matemática, Juego.
- La estructura de un proyecto didáctico: Fundamentación, Propósitos, Áreas y Contenidos, Actividades (con Inicio, Desarrollo y Cierre), Evaluación.
- La secuencia de actividades con momentos bien definidos: inicio motivador, desarrollo con participación activa, cierre que retoma y sistematiza.
- Los materiales apropiados para cada sala (2, 3, 4 y 5 años).
- Las efemérides y el calendario escolar argentino.

Respondés siempre en español rioplatense (vos), con lenguaje pedagógico apropiado pero accesible. Cuando generás actividades, usás la estructura Inicio / Desarrollo / Cierre. Cuando generás propuestas para la planificación anual, usás el formato: Propuesta, Propósitos, Áreas y Contenidos, Objetivos.

Si el docente no especifica la sala, preguntás por ella ya que es información clave.`;

async function geminiChat(userPrompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function geminiChatHistory(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user' as const,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const last = messages[messages.length - 1];
  const result = await chat.sendMessage(last.content);
  return result.response.text();
}

router.post('/sugerir-actividad', async (req: Request, res: Response) => {
  try {
    const { objetivo, sala, area, contexto } = req.body;
    const prompt = `El docente quiere una actividad con estas características:
- Sala: ${sala || 'no especificada'}
- Área: ${area || 'no especificada'}
- Objetivo: ${objetivo}
${contexto ? `- Contexto del proyecto: ${contexto}` : ''}

Generá una actividad completa con:
1. Nombre de la actividad (entre comillas, creativo y descriptivo)
2. Inicio (cómo capturar la atención y conectar con saberes previos)
3. Desarrollo (la actividad propiamente dicha, paso a paso)
4. Cierre (cómo sistematizar y cerrar)
5. Materiales necesarios`;

    const respuesta = await geminiChat(prompt);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error IA:', error);
    res.status(500).json({ error: 'Error al generar sugerencia' });
  }
});

router.post('/sugerir-proyecto', async (req: Request, res: Response) => {
  try {
    const { tema, sala, duracion } = req.body;
    const prompt = `Necesito un proyecto didáctico completo para Nivel Inicial:
- Tema/disparador: ${tema}
- Sala: ${sala || 'no especificada'}
- Duración: ${duracion || 'un mes'}

Generá:
1. Nombre del proyecto (entre comillas)
2. Fundamentación (2-3 párrafos)
3. Propósitos (lista de 4-5)
4. Áreas y Contenidos (por área curricular)
5. Evaluación (criterios)
6. Al menos 3 actividades de ejemplo con Nombre, Inicio, Desarrollo y Cierre`;

    const respuesta = await geminiChat(prompt);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error IA:', error);
    res.status(500).json({ error: 'Error al generar proyecto' });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
    };
    const respuesta = await geminiChatHistory(messages);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error IA:', error);
    res.status(500).json({ error: 'Error en el chat' });
  }
});

router.post('/sugerir-secuencia', async (req: Request, res: Response) => {
  try {
    const { tema, sala, cantidadActividades } = req.body;
    const prompt = `Generá una secuencia didáctica completa para Nivel Inicial con estas características:
- Tema: ${tema}
- Sala: ${sala || '4 años'}
- Cantidad de actividades: ${cantidadActividades || 3}

Generá:
1. Título de la secuencia (breve y descriptivo)
2. Propósito general (1-2 oraciones)
3. ${cantidadActividades || 3} actividades, cada una con:
   ACTIVIDAD N°[número]: [nombre]
   INICIO: [texto]
   DESARROLLO: [texto]
   CIERRE: [texto]
   MATERIALES: [lista]
   ---`;

    const respuesta = await geminiChat(prompt);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error IA:', error);
    res.status(500).json({ error: 'Error al generar secuencia' });
  }
});

router.post('/planificacion-mensual', async (req: Request, res: Response) => {
  try {
    const { mes, sala, cantidadPropuestas } = req.body;
    const prompt = `Generá ${cantidadPropuestas || 3} propuestas para la planificación mensual de ${mes} para sala de ${sala || '4 años'}.

Para cada propuesta usá este formato exacto:
PROPUESTA: [nombre]
PROPÓSITOS: [texto]
ÁREAS Y CONTENIDOS: [texto por área]
OBJETIVOS: [texto]
---`;

    const respuesta = await geminiChat(prompt);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error IA:', error);
    res.status(500).json({ error: 'Error al generar planificación' });
  }
});

export default router;
