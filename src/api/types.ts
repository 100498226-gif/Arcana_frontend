export interface SourceItem {
  file_name: string;
  path: string;
  abs_path?: string;
}

export interface ApiMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceItem[];
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  title: string;
  model: string;
  out_of_scope: boolean;
  created_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ApiMessage[];
}

export interface QueryDonePayload {
  chunks_used: number;
  sources: SourceItem[];
  conversation_id: number | null;
}

export interface UploadResult {
  status: string;
  file_name: string;
  chunks_ingested: number;
  errors: string[];
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (payload: QueryDonePayload) => void;
  onOutOfScope: (conversationId: number, searchQuery: string) => void;
  onError: (message: string) => void;
}
