import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { setModelId, useModelId } from '@/lib/ai-settings/model-store';

import { ModelPicker } from './model-picker';

/** The model Ask Crew uses, with an inline picker that fills the rest of the screen. */
export function ModelSetting() {
  const modelId = useModelId();
  const [picking, setPicking] = useState(false);

  const select = useCallback((id: string) => {
    setModelId(id);
    setPicking(false);
  }, []);

  return (
    <View className={picking ? 'mt-6 flex-1' : 'mt-6'}>
      <View className="min-h-11 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base text-black dark:text-white">Model</Text>
          <Text numberOfLines={1} className="text-sm text-neutral-600 dark:text-neutral-400">
            {modelId}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={picking ? 'Close model list' : 'Change model'}
          onPress={() => setPicking((open) => !open)}
          className="min-h-11 justify-center px-3"
        >
          <Text className="text-base font-medium text-blue-600 dark:text-blue-400">
            {picking ? 'Done' : 'Change'}
          </Text>
        </Pressable>
      </View>
      {picking ? <ModelPicker selectedId={modelId} onSelect={select} /> : null}
    </View>
  );
}
