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
import { optionalAuth, type AuthRequest } from '../middleware/auth';
import { recordAiUsage, resolveAiAccess } from '../services/subscription';

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

aiRouter.post('/generate', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { tool, language, fields, image } = generateSchema.parse(req.body);

    // Free trial gate: a visitor gets one answer per tool, a signed-in
    // customer gets one extra preview, and an active subscription is
    // unlimited. Counted on the server so clearing localStorage does not
    // reset it.
    const access = await resolveAiAccess({
      userId: req.userId,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      tool,
    });
    if (!access.allowed) {
      return res.status(access.status).json({
        error:
          access.code === 'subscription_required'
            ? 'Your free preview is used. Subscribe to keep using the tools.'
            : 'Sign in to get one extra free preview.',
        code: access.code,
      });
    }

    const result = await generateContent({ tool, language, fields, image });

    // A demo answer must not consume the free trial; the client applies the
    // same rule locally.
    if (!result.mock) {
      await recordAiUsage({
        userId: req.userId,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        tool,
      });
    }

    res.json({
      text: result.text,
      tool,
      language,
      mock: result.mock,
      previewRemaining: access.previewRemaining,
      subscribed: access.subscribed,
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
