import type { TripBundle } from '@/components/trip-card';

// Shared by the feed tests: `count` distinct trips named "Trip 1", "Trip 2", ...
export function makeTrips(count: number): TripBundle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `trip-${index + 1}`,
    destination: `Trip ${index + 1}`,
    country: 'Tanzania',
    kind: 'experience',
    price: { amount: 34300, currency: 'INR' },
    duration: { nights: 2, days: 3 },
    rating: 4.7,
    image: {
      url: `https://ik.imagekit.io/a16xyz/crew/${index + 1}.jpg?tr=w-1280,h-720`,
      width: 1280,
      height: 720,
      placeholderColor: '#8a5436',
    },
    highlights: [{ id: `trip-${index + 1}-d1`, day: 1, text: 'Arrive', icon: 'map' }],
  }));
}

/** Makes `fetch` answer once with this JSON body and status. */
export function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
