import { Image } from 'expo-image';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ERROR_ICON_SIZE, ERROR_IMAGE, FADE_IN_MS, LOADING_IMAGE } from './constants';
import type { RemoteImageProps } from './types';
import { assertRemoteLoaderUri } from './utils';

// The loader is a native placeholder, so a successful load causes no React render.
// Only a failure renders, and it is keyed by `uri` so a recycled list cell retries a new image.
export const RemoteImage = memo(function RemoteImage({
  uri,
  loaderUri,
  width,
  height,
  placeholderColor,
  borderRadius,
  accessibilityLabel,
  testID,
}: RemoteImageProps) {
  // Dev only: a bad loader is a coding mistake, not something to crash a release build over.
  if (__DEV__) assertRemoteLoaderUri(loaderUri);

  const reduceMotion = useReducedMotion();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;
  // An unlabelled image is decorative: no empty stop for screen readers.
  const labelled = Boolean(accessibilityLabel);

  const handleError = useCallback(() => setFailedUri(uri), [uri]);

  if (failed) {
    return (
      <View
        testID={testID}
        accessible={labelled}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        className="items-center justify-center bg-neutral-200 dark:bg-neutral-800"
        style={{ width, height, borderRadius }}
      >
        <Image
          source={ERROR_IMAGE}
          contentFit="contain"
          style={styles.errorIcon}
          accessible={false}
        />
      </View>
    );
  }

  return (
    <View style={{ width, height, borderRadius, backgroundColor: placeholderColor }}>
      <Image
        testID={testID}
        source={uri}
        recyclingKey={uri}
        contentFit="cover"
        placeholder={loaderUri ?? (placeholderColor ? undefined : LOADING_IMAGE)}
        placeholderContentFit="cover"
        transition={reduceMotion ? 0 : FADE_IN_MS}
        cachePolicy="memory-disk"
        accessible={labelled}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        onError={handleError}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  errorIcon: { width: ERROR_ICON_SIZE, height: ERROR_ICON_SIZE },
});
