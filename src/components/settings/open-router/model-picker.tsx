import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { matchesQuery, type OpenRouterModel } from '@/lib/open-router';

import { MODEL_ROW_HEIGHT, ModelRow } from './model-row';
import { useChatModels } from './use-chat-models';

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
  const { models, error, retry } = useChatModels();
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => (models ?? []).filter((model) => matchesQuery(model, query)),
    [models, query],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<OpenRouterModel>) => (
      <ModelRow model={item} selected={item.id === selectedId} onSelect={onSelect} />
    ),
    [onSelect, selectedId],
  );

  if (error) {
    return (
      <View className="mt-3 gap-2">
        <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          className="min-h-11 justify-center self-start"
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
        placeholderTextColor="#8e8e93"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        className="min-h-11 rounded-xl bg-neutral-100 px-4 text-base text-black dark:bg-neutral-900 dark:text-white"
      />
      {models ? (
        <View className="mt-2 flex-1">
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
                No models match “{query.trim()}”.
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
