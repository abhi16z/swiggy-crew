export type ChatMessageStatus = 'streaming' | 'done' | 'stopped' | 'error';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: ChatMessageStatus;
  /** User-facing reason, set when `status` is `error`. */
  error?: string;
};
