import type { RemoteImageAsset } from '@/components/ui/remote-image';

export type TripKind = 'experience' | 'flight_stay' | 'villa';

export type HighlightIcon = 'map' | 'walk' | 'camera' | 'airplane' | 'restaurant' | 'bed' | 'boat';

export type TripHighlight = {
  id: string;
  day: number;
  text: string;
  icon: HighlightIcon;
};

/** One travel bundle as it arrives in the trips JSON (`TRIPS_URL`). */
export type TripBundleData = {
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

/** Card text, formatted once when the trips load so scrolling never formats. */
export type TripLabels = {
  price: string;
  duration: string;
  rating: string;
  ratingA11y: string;
  image: string;
  details: string;
  highlights: string;
};

/**
 * A trip as the app holds it. Build it only with `withLabels` (`parseTrips` does this for the
 * feed): spreading a trip and changing a field keeps the old, now wrong, labels.
 */
export type TripBundle = TripBundleData & { labels: TripLabels };

export type TripCardProps = {
  trip: TripBundle;
};
