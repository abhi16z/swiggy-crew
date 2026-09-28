import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { HighlightIcon, TripKind } from './types';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const KIND_BADGES: Record<TripKind, { label: string; icon: IoniconName }> = {
  flight_stay: { label: 'Flight + Stay', icon: 'airplane-outline' },
  villa: { label: 'Villa', icon: 'home-outline' },
  experience: { label: 'Experience', icon: 'compass-outline' },
};

export const HIGHLIGHT_ICONS: Record<HighlightIcon, IoniconName> = {
  map: 'map-outline',
  walk: 'walk-outline',
  camera: 'camera-outline',
  airplane: 'airplane-outline',
  restaurant: 'restaurant-outline',
  bed: 'bed-outline',
  boat: 'boat-outline',
};

// Used when the data sends an icon this build doesn't know yet.
export const FALLBACK_HIGHLIGHT_ICON: IoniconName = 'ellipse-outline';

// ImageKit serves the same image at any size; 45x25 is ~0.5 KB and keeps the 16:9 shape.
export const LOADER_TRANSFORM = 'tr=w-45,h-25';

// Sizes from design 03 (390pt wide screen).
export const HIGHLIGHT_CARD_WIDTH = 204;
export const HIGHLIGHT_GAP = 12;
export const HIGHLIGHT_INSET = 14;
export const HIGHLIGHT_SNAP_INTERVAL = HIGHLIGHT_CARD_WIDTH + HIGHLIGHT_GAP;

export const DOT_SIZE = 5;
export const DOT_SPACING = 16;
export const ACTIVE_DOT_WIDTH = 16;
export const DOT_MOVE_MS = 150;

export const STAR_COLOR = '#a67c2e';

// Icons take a color prop, not a class, so they follow the color scheme by hand.
export const ICON_COLORS = {
  light: { primary: '#171717', muted: '#737373' },
  dark: { primary: '#fafafa', muted: '#a3a3a3' },
} as const;
