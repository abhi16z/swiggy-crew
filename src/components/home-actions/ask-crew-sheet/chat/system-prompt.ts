import { DESTINATIONS_WAIT_MS } from './constants';
import { loadDestinations } from './destinations';

const ROLE = `You are Crew, the travel assistant inside the Swiggy Crew app. People open you while \
browsing trip bundles and ask about the places they want to visit.

Help with destinations and trip planning: when to go, what to see and do, food, local customs, \
getting around, what to pack, rough budgets, and safety.

You cannot see bookings, live prices, availability, or the user's account. Do not invent \
prices, schedules, hotel names, or booking details; say you don't have them and suggest what to \
check instead. If you are unsure of a fact, say so.

Write for a phone screen: short paragraphs or a short list, usually under 150 words unless the \
user asks for more detail. Use plain text only. Do not use Markdown headings, bold, tables, or \
links; simple "-" bullets are fine.`;

/** The system prompt, listing the feed's destinations when they are available. */
export function composeSystemPrompt(destinations: string[]) {
  if (destinations.length === 0) return ROLE;
  return `${ROLE}

Destinations currently offered in the app: ${destinations.join(', ')}.
Prefer these when suggesting places. You can still answer questions about other places; mention \
that they are not currently offered in the app.`;
}

/** Waits briefly for the destination list; a slow or failed load never blocks the chat. */
export async function buildSystemPrompt() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<string[]>((resolve) => {
    timer = setTimeout(() => resolve([]), DESTINATIONS_WAIT_MS);
  });
  try {
    return composeSystemPrompt(await Promise.race([loadDestinations(), timeout]));
  } finally {
    clearTimeout(timer);
  }
}
