import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  AI_TOOLS,
  AiError,
  generateContent,
  isAiAvailable,
  isAiKeyless,
  isAiMock,
} from '../services/aiProvider';

export const aiRouter = Router();

// Field values are capped twice: here for a fast 400 and again in the service
// after sanitising. The whole prompt is capped there at 5000 characters.
const generateSchema = z.object({
  tool: z.enum(AI_TOOLS),
  language: z.enum(['ar', 'fr', 'en']).default('ar'),
  fields: z
    .record(z.string(), z.string().max(1200, 'Field is too long'))
    .refine((value) => Object.keys(value).length <= 12, 'Too many fields'),
  // One compressed image for the ad review; the service validates the format
  // and the real size limit.
  image: z.string().max(1_000_000).optional(),
});

aiRouter.get('/status', (_req: Request, res: Response) => {
  // Public flag only: the provider name, model and key stay on the server.
  res.json({ available: isAiAvailable(), mock: isAiMock(), keyless: isAiKeyless() });
});

aiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { tool, language, fields, image } = generateSchema.parse(req.body);
    const result = await generateContent({ tool, language, fields, image });
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
