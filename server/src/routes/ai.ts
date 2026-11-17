import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AiError, generateContent, isAiAvailable, isAiMock } from '../services/aiProvider';

export const aiRouter = Router();

// Field values are capped twice: here for a fast 400 and again in the service
// after sanitising. The whole prompt is capped there at 4000 characters.
const generateSchema = z.object({
  tool: z.enum(['cv', 'post', 'product']),
  language: z.enum(['ar', 'fr', 'en']).default('ar'),
  fields: z
    .record(z.string(), z.string().max(700, 'Field is too long'))
    .refine((value) => Object.keys(value).length <= 10, 'Too many fields'),
});

aiRouter.get('/status', (_req: Request, res: Response) => {
  // Public flag only: the provider name, model and key stay on the server.
  res.json({ available: isAiAvailable(), mock: isAiMock() });
});

aiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { tool, language, fields } = generateSchema.parse(req.body);
    const result = await generateContent({ tool, language, fields });
    res.json({
      text: result.text,
      tool,
      language,
      mock: result.mock,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'ai_invalid_request',
        details: err.issues,
      });
    }
    if (err instanceof AiError) {
      return res.status(err.status).json({
        error: err.message,
        code: err.code,
        fields: err.fields,
      });
    }
    // Never log the request body: it contains the customer's text.
    console.error('[AI] Route error:', err?.name || 'Error');
    res.status(500).json({ error: 'AI generation failed', code: 'ai_error' });
  }
});
