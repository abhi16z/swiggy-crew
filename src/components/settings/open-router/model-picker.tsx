import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { ICON_COLORS } from '@/constants/colors';
import {
  describeError,
  filterModels,
  loadChatModels,
  type OpenRouterModel,
} from '@/lib/open-router';

import { MODEL_ROW_HEIGHT, ModelRow } from './model-row';

type ModelPickerProps = {
  selectedId: string;
  onSelect: (modelId: string) => void;
};

function keyOf(model: OpenRouterModel) {
  return model.id;
}

function getItemLayout(_data: ArrayLike<OpenRouterModel> | null | undefined, index: number) {
  return { length: MODEL_ROW_HEIGHT, offset: MODEL_ROW_HEIGHT * index, index };
}

/** Searchable list of every OpenRouter model that can chat in text. */
export function ModelPicker({ selectedId, onSelect }: ModelPickerProps) {
  const placeholderColor = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'].muted;
  const [models, setModels] = useState<OpenRouterModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  // Typing stays responsive; the list filters once the keystrokes settle.
  const deferredQuery = useDeferredValue(query);

  // The catalog is cached for the app session; Retry bumps `attempt` to load it again.
  useEffect(() => {
    let active = true;
    loadChatModels().then(
      (list) => {
        if (active) setModels(list);
      },
      (reason: unknown) => {
        if (active) setError(describeError(reason));
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const visible = useMemo(() => filterModels(models ?? [], deferredQuery), [models, deferredQuery]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OpenRouterModel>) => (
      <ModelRow model={item} selected={item.id === selectedId} onSelect={onSelect} />
    ),
    [onSelect, selectedId],
  );

  if (error) {
    return (
      <View className="mt-3 gap-2">
        <Text accessibilityLiveRegion="polite" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading models"
          onPress={() => {
            setError(null);
            setAttempt((count) => count + 1);
          }}
          className="min-h-11 min-w-11 items-center justify-center self-start px-3"
        >
          <Text className="text-base font-medium text-blue-600 dark:text-blue-400">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-3 flex-1">
      <TextInput
        accessibilityLabel="Search models"
        placeholder="Search models"
        placeholderTextColor={placeholderColor}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        className="min-h-11 rounded-xl bg-neutral-100 px-4 text-base text-black dark:bg-neutral-900 dark:text-white"
      />
      {models ? (
        <View accessibilityRole="radiogroup" accessibilityLabel="Models" className="mt-2 flex-1">
          <FlatList
            data={visible}
            keyExtractor={keyOf}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={12}
            windowSize={7}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                No models match “{deferredQuery.trim()}”.
              </Text>
            }
          />
        </View>
      ) : (
        <View className="min-h-11 flex-row items-center gap-3 py-4">
          <ActivityIndicator />
          <Text className="text-sm text-neutral-600 dark:text-neutral-400">Loading models</Text>
        </View>
      )}
    </View>
  );
}
