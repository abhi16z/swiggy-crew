import { create } from 'zustand';

import { loadApiKey } from '@/lib/ai-settings/api-key-store';
import { getModelId } from '@/lib/ai-settings/model-store';
import { describeError } from '@/lib/open-router/errors';
import { streamChat } from '@/lib/open-router/stream-chat';
import type { ChatMessageParam } from '@/lib/open-router/types';

import { HISTORY_LIMIT } from './constants';
import { createDeltaBuffer } from './delta-buffer';
import { buildSystemPrompt } from './system-prompt';
import type { Chat, ChatMessage, ChatMessageStatus } from './types';

type ChatState = {
  /** Every chat of this app session, most recently used first. */
  chats: Chat[];
  /** The chat on screen; `null` is a new chat that is created by its first message. */
  activeChatId: string | null;
};

// Lives outside the sheet body, which unmounts on close: chats and replies that are still
// streaming survive closing and reopening the sheet. Kept in memory only, so a fresh app
// launch starts with no chats.
export const useChatStore = create<ChatState>()(() => ({
  chats: [],
  activeChatId: null,
}));

const NO_MESSAGES: ChatMessage[] = [];

// One in-flight request per chat, so a reply keeps streaming while another chat is open.
const controllers = new Map<string, AbortController>();
let nextId = 0;

// The composer's unsent text, kept across closing and reopening the sheet. Not store state:
// nothing renders from it, and a store update per keystroke would rerun every chat selector.
let draft = '';

function createId(prefix: string) {
  nextId += 1;
  return `${prefix}${nextId}`;
}

function activeChatOf(state: ChatState) {
  return state.chats.find((chat) => chat.id === state.activeChatId);
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

/**
 * Puts the question and an empty reply after `earlier` in the chat, creating and opening the
 * chat if it is new, and moves it first in the list.
 */
function addTurn(
  existing: Chat | undefined,
  earlier: ChatMessage[],
  content: string,
  reply: ChatMessage,
) {
  const question: ChatMessage = { id: createId('m'), role: 'user', content, status: 'done' };
  const chat: Chat = existing
    ? { ...existing, messages: [...earlier, question, reply] }
    : { id: createId('c'), title: content, messages: [question, reply] };
  useChatStore.setState((state) => ({
    chats: [chat, ...state.chats.filter((other) => other.id !== chat.id)],
    // An existing chat is either already open, or being retried; a retry must not switch chats.
    ...(existing ? null : { activeChatId: chat.id }),
  }));
  return chat.id;
}

/**
 * Sends `content` into chat `chatId`, or into the open chat (starting it if new) when no id is
 * given, and streams the reply into that chat even if the user switches chats meanwhile.
 * `replacing` names messages the new turn takes the place of; they are removed only once it
 * is added. Ignored while that chat is replying.
 */
async function send(content: string, chatId?: string, replacing: readonly string[] = []) {
  const targetOf = () => findChat(chatId ?? useChatStore.getState().activeChatId);
  if (content === '' || isStreaming(targetOf())) return;
  const apiKey = await loadApiKey();
  // Read again after the await: a second send may have started this chat's reply meanwhile.
  const target = targetOf();
  if (!apiKey || isStreaming(target) || (chatId !== undefined && !target)) return;

  const earlier = (target?.messages ?? NO_MESSAGES).filter(
    (message) => !replacing.includes(message.id),
  );
  const history = toHistory(earlier);
  const reply: ChatMessage = {
    id: createId('m'),
    role: 'assistant',
    content: '',
    status: 'streaming',
  };
  const id = addTurn(target, earlier, content, reply);

  const current = new AbortController();
  controllers.set(id, current);
  const buffer = createDeltaBuffer((delta) => appendToMessage(id, reply.id, delta));
  const finish = (status: ChatMessageStatus, error?: string) => {
    buffer.flush();
    updateMessage(id, reply.id, { status, error });
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
    if (controllers.get(id) === current) controllers.delete(id);
  }
}

/** Sends a message in the open chat, starting it if it is new. */
export function sendMessage(text: string) {
  return send(text.trim());
}

/** Stops the open chat's reply; the text so far stays in the chat. */
export function stopReply() {
  const { activeChatId } = useChatStore.getState();
  if (activeChatId) controllers.get(activeChatId)?.abort();
}

/**
 * Sends the message behind the open chat's failed reply again. Only the chat's last message
 * can be retried, so a retry never reorders the conversation. The failed pair is replaced only
 * once the new turn starts, and the reply goes to that chat even if another one is opened.
 */
export function retryReply(replyId: string) {
  const chat = findChat(useChatStore.getState().activeChatId);
  const reply = chat?.messages[chat.messages.length - 1];
  const prompt = chat?.messages[chat.messages.length - 2];
  if (!chat || reply?.id !== replyId || reply.status !== 'error' || prompt?.role !== 'user') {
    return;
  }
  void send(prompt.content, chat.id, [prompt.id, reply.id]);
}

/** Opens an empty chat. Other chats, including any still replying, stay in the list. */
export function startNewChat() {
  useChatStore.setState({ activeChatId: null });
}

export function openChat(chatId: string) {
  if (findChat(chatId)) useChatStore.setState({ activeChatId: chatId });
}

export function setDraft(value: string) {
  draft = value;
}

export function getDraft() {
  return draft;
}

export function useActiveMessages() {
  return useChatStore((state) => activeChatOf(state)?.messages ?? NO_MESSAGES);
}

/** A boolean, so callers do not re-render on every streamed update of the messages. */
export function useActiveHasMessages() {
  return useChatStore((state) => (activeChatOf(state)?.messages.length ?? 0) > 0);
}

export function useActiveChatStreaming() {
  return useChatStore((state) => isStreaming(activeChatOf(state)));
}

/** Test helper: stops every reply and forgets all chats and the draft. */
export function resetChats() {
  for (const controller of controllers.values()) controller.abort();
  controllers.clear();
  draft = '';
  useChatStore.setState({ chats: [], activeChatId: null });
}
