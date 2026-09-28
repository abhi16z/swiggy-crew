import type { DimensionValue } from 'react-native';

/** Remote image as it arrives in the data. `width` and `height` are the source pixels. */
export type RemoteImageAsset = {
  url: string;
  width: number;
  height: number;
  placeholderColor: string;
};

/** An http(s) URL. Bundled images (`require(...)`) are numbers, so they don't fit. */
export type RemoteUri = `https://${string}` | `http://${string}`;

export type RemoteImageProps = {
  uri: string;
  /**
   * Tiny remote copy of the same image in the same aspect ratio, scaled up to fill the box while
   * the full image loads. Must be remote; falls back to the bundled loading image when omitted.
   */
  loaderUri?: RemoteUri;
  /** Display size. Both are required so the layout never waits on the image. */
  width: DimensionValue;
  height: DimensionValue;
  /** Low-fidelity color painted behind the image while it loads. */
  placeholderColor?: string;
  borderRadius?: number;
  accessibilityLabel?: string;
  testID?: string;
};
