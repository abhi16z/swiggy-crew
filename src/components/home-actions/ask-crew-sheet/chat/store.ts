import { create } from 'zustand';

import { getModelId, loadApiKey } from '@/lib/ai-settings';
import { describeError, streamChat, type ChatMessageParam } from '@/lib/open-router';

import { HISTORY_LIMIT } from './constants';
import { createDeltaBuffer } from './delta-buffer';
import { buildSystemPrompt } from './system-prompt';
import type { ChatMessage, ChatMessageStatus } from './types';

type ChatState = {
  messages: ChatMessage[];
  streaming: boolean;
  draft: string;
};

// Lives outside the sheet body, which unmounts on close: history, the draft and a reply that
// is still streaming all survive closing and reopening the sheet. Kept in memory only, so a
// fresh app launch starts a fresh chat.
export const useChatStore = create<ChatState>()(() => ({
  messages: [],
  streaming: false,
  draft: '',
}));

let controller: AbortController | null = null;
let nextId = 0;

function createId() {
  nextId += 1;
  return `m${nextId}`;
}

function updateReply(id: string, update: (message: ChatMessage) => ChatMessage) {
  useChatStore.setState((state) => ({
    messages: state.messages.map((message) => (message.id === id ? update(message) : message)),
  }));
}

function finishReply(id: string, status: ChatMessageStatus, error?: string) {
  updateReply(id, (message) => ({ ...message, status, error }));
}

/** Earlier turns to send with a new message: completed text only, most recent last. */
export function toHistory(messages: ChatMessage[]): ChatMessageParam[] {
  return messages
    .filter((message) => message.status !== 'error' && message.content.trim() !== '')
    .slice(-HISTORY_LIMIT)
    .map(({ role, content }) => ({ role, content }));
}

/** Sends a message and streams the reply into the chat. Ignored while a reply is streaming. */
export async function sendMessage(text: string) {
  const content = text.trim();
  if (content === '' || useChatStore.getState().streaming) return;
  const apiKey = await loadApiKey();
  // Checked again: a second send may have started while the key was loading.
  if (!apiKey || useChatStore.getState().streaming) return;

  const history = toHistory(useChatStore.getState().messages);
  const reply: ChatMessage = {
    id: createId(),
    role: 'assistant',
    content: '',
    status: 'streaming',
  };
  useChatStore.setState((state) => ({
    messages: [
      ...state.messages,
      { id: createId(), role: 'user', content, status: 'done' },
      reply,
    ],
    streaming: true,
  }));

  const current = new AbortController();
  controller = current;
  const buffer = createDeltaBuffer((delta) => {
    updateReply(reply.id, (message) => ({ ...message, content: message.content + delta }));
  });

  try {
    const system = await buildSystemPrompt();
    await streamChat({
      apiKey,
      model: getModelId(),
      messages: [{ role: 'system', content: system }, ...history, { role: 'user', content }],
      signal: current.signal,
      onDelta: buffer.push,
    });
    buffer.flush();
    finishReply(reply.id, 'done');
  } catch (error) {
    buffer.flush();
    if (current.signal.aborted) finishReply(reply.id, 'stopped');
    else finishReply(reply.id, 'error', describeError(error));
  } finally {
    // A cleared chat may already be streaming a newer request; leave that one alone.
    if (controller === current) {
      controller = null;
      useChatStore.setState({ streaming: false });
    }
  }
}

/** Stops the reply that is streaming; the text so far stays in the chat. */
export function stopReply() {
  controller?.abort();
}

/** Removes a failed reply and the message that prompted it, then sends that message again. */
export function retryReply(replyId: string) {
  const { messages, streaming } = useChatStore.getState();
  const index = messages.findIndex((message) => message.id === replyId);
  const prompt = messages[index - 1];
  if (streaming || index < 1 || prompt.role !== 'user') return;
  useChatStore.setState({ messages: messages.filter((_, i) => i !== index && i !== index - 1) });
  void sendMessage(prompt.content);
}

export function clearChat() {
  stopReply();
  controller = null;
  useChatStore.setState({ messages: [], streaming: false });
}

export function setDraft(draft: string) {
  useChatStore.setState({ draft });
}

export function getDraft() {
  return useChatStore.getState().draft;
}
