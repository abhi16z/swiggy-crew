import { create } from 'zustand';

import { getModelId, loadApiKey } from '@/lib/ai-settings';
import { describeError, streamChat, type ChatMessageParam } from '@/lib/open-router';

import { HISTORY_LIMIT } from './constants';
import { createDeltaBuffer } from './delta-buffer';
import { buildSystemPrompt } from './system-prompt';
import type { Chat, ChatMessage, ChatMessageStatus } from './types';

type ChatState = {
  /** Every chat of this app session, most recently used first. */
  chats: Chat[];
  /** The chat on screen; `null` is a new chat that is created by its first message. */
  activeChatId: string | null;
  draft: string;
};

// Lives outside the sheet body, which unmounts on close: chats, the draft and replies that
// are still streaming all survive closing and reopening the sheet. Kept in memory only, so a
// fresh app launch starts with no chats.
export const useChatStore = create<ChatState>()(() => ({
  chats: [],
  activeChatId: null,
  draft: '',
}));

const NO_MESSAGES: ChatMessage[] = [];

// One in-flight request per chat, so a reply keeps streaming while another chat is open.
const controllers = new Map<string, AbortController>();
let nextId = 0;

function createId(prefix: string) {
  nextId += 1;
  return `${prefix}${nextId}`;
}

function findChat(chatId: string | null) {
  return useChatStore.getState().chats.find((chat) => chat.id === chatId);
}

export function isStreaming(chat: Chat | undefined) {
  return chat?.messages[chat.messages.length - 1]?.status === 'streaming';
}

function updateChat(chatId: string, update: (chat: Chat) => Chat) {
  useChatStore.setState((state) => ({
    chats: state.chats.map((chat) => (chat.id === chatId ? update(chat) : chat)),
  }));
}

function updateMessage(chatId: string, messageId: string, update: Partial<ChatMessage>) {
  updateChat(chatId, (chat) => ({
    ...chat,
    messages: chat.messages.map((message) =>
      message.id === messageId ? { ...message, ...update } : message,
    ),
  }));
}

function appendToMessage(chatId: string, messageId: string, text: string) {
  updateChat(chatId, (chat) => ({
    ...chat,
    messages: chat.messages.map((message) =>
      message.id === messageId ? { ...message, content: message.content + text } : message,
    ),
  }));
}

/** Earlier turns to send with a new message: completed text only, most recent last. */
export function toHistory(messages: ChatMessage[]): ChatMessageParam[] {
  return messages
    .filter((message) => message.status !== 'error' && message.content.trim() !== '')
    .slice(-HISTORY_LIMIT)
    .map(({ role, content }) => ({ role, content }));
}

/** Adds the question and an empty reply to the chat, creating it if new, and moves it first. */
function addTurn(chatId: string | null, content: string, reply: ChatMessage) {
  const question: ChatMessage = { id: createId('m'), role: 'user', content, status: 'done' };
  const existing = findChat(chatId);
  const chat: Chat = existing
    ? { ...existing, messages: [...existing.messages, question, reply] }
    : { id: createId('c'), title: content, messages: [question, reply] };
  useChatStore.setState((state) => ({
    chats: [chat, ...state.chats.filter((other) => other.id !== chat.id)],
    activeChatId: chat.id,
  }));
  return chat.id;
}

/**
 * Sends a message in the open chat (starting it if it is new) and streams the reply into
 * that chat, even if the user switches chats meanwhile. Ignored while that chat is replying.
 */
export async function sendMessage(text: string) {
  const content = text.trim();
  if (content === '' || isStreaming(findChat(useChatStore.getState().activeChatId))) return;
  const apiKey = await loadApiKey();
  // Read again after the await: a second send may have started this chat's reply meanwhile.
  const target = findChat(useChatStore.getState().activeChatId);
  if (!apiKey || isStreaming(target)) return;

  const history = toHistory(target?.messages ?? NO_MESSAGES);
  const reply: ChatMessage = {
    id: createId('m'),
    role: 'assistant',
    content: '',
    status: 'streaming',
  };
  const chatId = addTurn(target?.id ?? null, content, reply);

  const current = new AbortController();
  controllers.set(chatId, current);
  const buffer = createDeltaBuffer((delta) => appendToMessage(chatId, reply.id, delta));
  const finish = (status: ChatMessageStatus, error?: string) => {
    buffer.flush();
    updateMessage(chatId, reply.id, { status, error });
  };

  try {
    const system = await buildSystemPrompt();
    await streamChat({
      apiKey,
      model: getModelId(),
      messages: [{ role: 'system', content: system }, ...history, { role: 'user', content }],
      signal: current.signal,
      onDelta: buffer.push,
    });
    finish('done');
  } catch (error) {
    if (current.signal.aborted) finish('stopped');
    else finish('error', describeError(error));
  } finally {
    if (controllers.get(chatId) === current) controllers.delete(chatId);
  }
}

/** Stops the open chat's reply; the text so far stays in the chat. */
export function stopReply() {
  const { activeChatId } = useChatStore.getState();
  if (activeChatId) controllers.get(activeChatId)?.abort();
}

/** Removes a failed reply and the message that prompted it, then sends that message again. */
export function retryReply(replyId: string) {
  const chat = findChat(useChatStore.getState().activeChatId);
  if (!chat || isStreaming(chat)) return;
  const index = chat.messages.findIndex((message) => message.id === replyId);
  const prompt = chat.messages[index - 1];
  if (index < 1 || prompt.role !== 'user') return;
  updateChat(chat.id, (current) => ({
    ...current,
    messages: current.messages.filter((_, i) => i !== index && i !== index - 1),
  }));
  void sendMessage(prompt.content);
}

/** Opens an empty chat. Other chats, including any still replying, stay in the list. */
export function startNewChat() {
  useChatStore.setState({ activeChatId: null });
}

export function openChat(chatId: string) {
  if (findChat(chatId)) useChatStore.setState({ activeChatId: chatId });
}

export function setDraft(draft: string) {
  useChatStore.setState({ draft });
}

export function getDraft() {
  return useChatStore.getState().draft;
}

export function useActiveMessages() {
  return useChatStore(
    (state) => state.chats.find((chat) => chat.id === state.activeChatId)?.messages ?? NO_MESSAGES,
  );
}

export function useActiveChatStreaming() {
  return useChatStore((state) =>
    isStreaming(state.chats.find((chat) => chat.id === state.activeChatId)),
  );
}

/** Test helper: stops every reply and forgets all chats. */
export function resetChats() {
  for (const controller of controllers.values()) controller.abort();
  controllers.clear();
  useChatStore.setState({ chats: [], activeChatId: null, draft: '' });
}
