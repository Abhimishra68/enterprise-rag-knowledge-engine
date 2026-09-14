/**
 * RAG Network Telemetry Service
 * Emits genuine HTTP fetch events to Vite dev server so that every single phase
 * (Query Embedding, Vector DB Search, Prompt Construction, and LLM Response)
 * is immediately visible in the browser DevTools "Network" tab -> "Response" tab!
 */

export async function trackNetworkPhase(endpoint: string, payload: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/rag/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Non-blocking telemetry
    console.debug('Telemetry non-critical notice:', err);
  }
}
