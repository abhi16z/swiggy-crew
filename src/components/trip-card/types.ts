import type { RemoteImageAsset } from '@/components/ui/remote-image';

export type TripKind = 'experience' | 'flight_stay' | 'villa';

export type HighlightIcon = 'map' | 'walk' | 'camera' | 'airplane' | 'restaurant' | 'bed' | 'boat';

export type TripHighlight = {
  id: string;
  day: number;
  text: string;
  icon: HighlightIcon;
};

/** One travel bundle from `travel-bundles.json`. */
export type TripBundle = {
  id: string;
  destination: string;
  country: string;
  kind: TripKind;
  price: { amount: number; currency: string };
  duration: { nights: number; days: number };
  rating: number;
  image: RemoteImageAsset;
  highlights: TripHighlight[];
};

export type TripCardProps = {
  trip: TripBundle;
};
