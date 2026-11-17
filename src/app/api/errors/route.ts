import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Error Proxy Route
 *
 * Captures errors and forwards them to Sentry in tunnel mode.
 * Used by middleware to forward client-side errors to server.
 */

export async function POST(request: Request) {
  try {
    // Read the error event from the request body
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        { error: 'No error data provided' },
        { status: 400 }
      );
    }

    // Parse and capture the event
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[Sentry Error Proxy] Failed to parse error event:', parseError);
      return NextResponse.json(
        { error: 'Invalid error data', details: String(parseError) },
        { status: 400 }
      );
    }

    // Capture the error via Sentry
    if (Sentry.captureException) {
      Sentry.captureException(null, {
        levels: { type: event?.level || 'error' as const }
      });
    }

    // Log for debugging in development
    console.log('[Sentry Error Proxy] Captured event:', event.message || event.event_id);

    return NextResponse.json({
      success: true,
      eventId: Sentry.lastEventId(),
    });
  } catch (error) {
    console.error('[Sentry Error Proxy] Internal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
