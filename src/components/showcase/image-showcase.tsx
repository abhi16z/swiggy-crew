import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SHOWCASE_BROKEN_IMAGE_URL, SHOWCASE_BUNDLE, SHOWCASE_LOADER_URL } from './data';
import { ImageCard } from './image-card';

const { destination, country, image } = SHOWCASE_BUNDLE;
const label = `${destination}, ${country}`;

export function ImageShowcase() {
  // A new query string misses the cache, so the loading state shows again.
  const [reloads, setReloads] = useState(0);
  const uri = reloads === 0 ? image.url : `${image.url}&reload=${reloads}`;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-black dark:text-white">Remote image</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setReloads((count) => count + 1)}
          className="min-h-11 items-center justify-center rounded-full bg-white px-5 dark:bg-neutral-800"
        >
          <Text className="text-base font-medium text-black dark:text-white">Reload</Text>
        </Pressable>
      </View>
      <ImageCard
        title="Remote loader, cropped to cover"
        uri={uri}
        loaderUri={SHOWCASE_LOADER_URL}
        image={image}
        accessibilityLabel={label}
      />
      <ImageCard
        title="Bundled loader (no loaderUri)"
        uri={`${uri}&card=bundled`}
        image={image}
        accessibilityLabel={label}
      />
      <ImageCard
        title="Fails to load"
        uri={SHOWCASE_BROKEN_IMAGE_URL}
        image={image}
        accessibilityLabel={label}
      />
    </View>
  );
}
