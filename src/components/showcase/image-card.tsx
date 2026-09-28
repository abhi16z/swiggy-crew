import { Text, View } from 'react-native';

import { CARD_IMAGE_HEIGHT, CARD_IMAGE_RADIUS } from '@/components/trip-card/constants';
import { RemoteImage, type RemoteImageAsset, type RemoteUri } from '@/components/ui/remote-image';

type ImageCardProps = {
  title: string;
  uri: string;
  loaderUri?: RemoteUri;
  image: RemoteImageAsset;
  accessibilityLabel: string;
};

// Mirrors the feed card frame from design 01: a white card with a 6pt inset around the image.
export function ImageCard({ title, uri, loaderUri, image, accessibilityLabel }: ImageCardProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</Text>
      <View className="rounded-3xl bg-white p-1.5 dark:bg-neutral-900">
        <RemoteImage
          uri={uri}
          loaderUri={loaderUri}
          width="100%"
          height={CARD_IMAGE_HEIGHT}
          borderRadius={CARD_IMAGE_RADIUS}
          placeholderColor={image.placeholderColor}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </View>
  );
}
