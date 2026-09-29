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
   * the full image loads. Must be remote. When omitted, `placeholderColor` alone is shown, or the
   * bundled loading image if there is no color either.
   */
  loaderUri?: RemoteUri;
  /** Display size. Both are required so the layout never waits on the image. */
  width: DimensionValue;
  height: DimensionValue;
  /**
   * Low-fidelity color painted behind the image while it loads. Without a `loaderUri` it is the
   * whole placeholder: no loader image is fetched or decoded.
   */
  placeholderColor?: string;
  borderRadius?: number;
  accessibilityLabel?: string;
  testID?: string;
};
