import type { ImageSource } from 'expo-image';

// Sizes from designs 01-03 (390pt wide screen): the card hero image fills the card width
// minus a 6pt inset and is 208pt tall. Remote images are 16:9, so they are cropped to cover.
export const CARD_IMAGE_HEIGHT = 208;
export const CARD_IMAGE_INSET = 6;
export const CARD_IMAGE_RADIUS = 16;

export const ERROR_ICON_SIZE = 48;
export const FADE_IN_MS = 150;

export const LOADING_IMAGE: ImageSource = require('@/assets/image-loading.png');
export const ERROR_IMAGE: ImageSource = require('@/assets/image-placeholder.png');
