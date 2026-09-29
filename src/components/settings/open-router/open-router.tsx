import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { loadApiKey, useApiKey, useApiKeyLoaded } from '@/lib/ai-settings/api-key-store';

import { ApiKeyField } from './api-key-field';
import { ModelSetting } from './model-setting';

/** Ask Crew settings: the OpenRouter key and, once a key is saved, the model to use. */
export function OpenRouterSettings() {
  const apiKey = useApiKey();
  const loaded = useApiKeyLoaded();

  useEffect(() => {
    void loadApiKey();
  }, []);

  return (
    <View className="mt-8 flex-1">
      <Text
        accessibilityRole="header"
        className="text-sm font-semibold text-neutral-500 uppercase dark:text-neutral-400"
      >
        Ask Crew
      </Text>
      {loaded ? (
        <ApiKeyField apiKey={apiKey} />
      ) : (
        <View className="mt-4 self-start">
          <ActivityIndicator accessibilityLabel="Loading OpenRouter key" />
        </View>
      )}
      {apiKey ? <ModelSetting /> : null}
    </View>
  );
}
