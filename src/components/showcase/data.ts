import type { TripBundle } from '@/components/trip-card';
import { withLabels } from '@/components/trip-card/utils';

export const SHOWCASE_BUNDLE: TripBundle = withLabels({
  id: 'serengeti-1',
  destination: 'Serengeti',
  country: 'Tanzania',
  kind: 'experience',
  price: { amount: 34300, currency: 'INR' },
  duration: { nights: 2, days: 3 },
  rating: 4.7,
  image: {
    url: 'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-1280,h-720',
    width: 1280,
    height: 720,
    placeholderColor: '#8a5436',
  },
  highlights: [
    { id: 'serengeti-1-d1', day: 1, text: 'Arrive and get oriented around Serengeti', icon: 'map' },
    { id: 'serengeti-1-d2', day: 2, text: 'Walk the main sight with time to linger', icon: 'walk' },
    {
      id: 'serengeti-1-d3',
      day: 3,
      text: 'Safari jeep at sunset with wildebeest and zebras on dry savanna',
      icon: 'camera',
    },
  ],
});

// Same image path with a file name that does not exist, to show the failure state.
export const SHOWCASE_BROKEN_IMAGE_URL = 'https://ik.imagekit.io/a16xyz/crew/missing.jpg';

// Same image at 45x25 (about 16:9, like the full image), ~0.5 KB, shown while the full one loads.
export const SHOWCASE_LOADER_URL = 'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-45,h-25';
