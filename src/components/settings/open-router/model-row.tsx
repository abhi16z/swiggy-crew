import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatPrice } from '@/lib/open-router/models';
import type { OpenRouterModel } from '@/lib/open-router/types';

/** Fixed row height (`h-16`) so the list can skip measuring rows. */
export const MODEL_ROW_HEIGHT = 64;

type ModelRowProps = {
  model: OpenRouterModel;
  selected: boolean;
  onSelect: (modelId: string) => void;
};

export const ModelRow = memo(function ModelRow({ model, selected, onSelect }: ModelRowProps) {
  const price = formatPrice(model);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${model.name}, ${price}`}
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(model.id)}
      className="h-16 flex-row items-center gap-3 border-b border-neutral-200 dark:border-neutral-800"
    >
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base text-black dark:text-white">
          {model.name}
        </Text>
        <Text numberOfLines={1} className="text-xs text-neutral-600 dark:text-neutral-400">
          {`${model.id} · ${price}`}
        </Text>
      </View>
      {selected ? (
        <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">✓</Text>
      ) : null}
    </Pressable>
  );
});
