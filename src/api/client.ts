import type {
  ConversationDetail,
  ConversationSummary,
  QueryDonePayload,
  StreamCallbacks,
  UploadResult,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream a query to the backend via POST + ReadableStream SSE.
 * EventSource only supports GET; we use fetch + manual SSE parsing for POST.
 */
export async function streamQuery(
  question: string,
  history: HistoryEntry[],
  model: string,
  conversationId: number | null,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/query/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ question, history, model, conversation_id: conversationId }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    callbacks.onError('Cannot reach the backend. Make sure the server is running.');
    return;
  }

  if (!response.ok || !response.body) {
    callbacks.onError(`Server error: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    let done: boolean, value: Uint8Array | undefined;
    try {
      ({ done, value } = await reader.read());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    let eventType = 'message';
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const raw = line.slice(5).trim();
        if (!raw) continue;
        try {
          const payload = JSON.parse(raw);
          if (eventType === 'chunk') {
            callbacks.onChunk(payload.text ?? '');
          } else if (eventType === 'done') {
            callbacks.onDone(payload as QueryDonePayload);
          } else if (eventType === 'out_of_scope') {
            callbacks.onOutOfScope(payload.conversation_id ?? null, payload.search_query ?? '');
          } else if (eventType === 'error') {
            callbacks.onError(payload.message ?? 'Unknown error');
          }
        } catch {
          // malformed SSE data — skip
        }
        eventType = 'message';
      }
    }
  }
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE_URL}/conversations/`);
  if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
  return res.json();
}

export async function getConversation(id: number): Promise<ConversationDetail> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`);
  if (!res.ok) throw new Error(`Failed to load conversation: ${res.status}`);
  return res.json();
}

export async function deleteConversation(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}

export async function revealFile(absPath: string): Promise<void> {
  await fetch(`${BASE_URL}/files/reveal?path=${encodeURIComponent(absPath)}`);
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/ingest/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail ?? 'Upload failed');
  }
  return res.json();
}
