import { useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { ICON_COLORS } from '@/constants/colors';
import { maskApiKey, removeApiKey, saveApiKey } from '@/lib/ai-settings';
import { describeError, isOpenRouterError, verifyKey } from '@/lib/open-router';

type ApiKeyFieldProps = {
  apiKey: string | null;
};

const STORAGE_NOTE =
  process.env.EXPO_OS === 'web'
    ? 'Kept in memory for this session only, and sent only to OpenRouter.'
    : 'Stored securely on this device and sent only to OpenRouter.';

function keyErrorMessage(error: unknown) {
  if (isOpenRouterError(error) && error.kind === 'auth') {
    return 'OpenRouter did not accept this key.';
  }
  return describeError(error);
}

/** Shows the saved key (masked) or a field to enter one. A key is checked before it is saved. */
export function ApiKeyField({ apiKey }: ApiKeyFieldProps) {
  const placeholderColor = ICON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'].muted;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (apiKey && !editing) {
    return (
      <View className="mt-4 min-h-11 flex-row items-center gap-2">
        <View className="flex-1">
          <Text className="text-base text-black dark:text-white">OpenRouter key</Text>
          <Text className="text-sm text-neutral-600 dark:text-neutral-400">
            {maskApiKey(apiKey)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replace OpenRouter key"
          onPress={() => setEditing(true)}
          className="min-h-11 justify-center px-3"
        >
          <Text className="text-base font-medium text-blue-600 dark:text-blue-400">Replace</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove OpenRouter key"
          onPress={() => void removeApiKey()}
          className="min-h-11 justify-center px-3"
        >
          <Text className="text-base font-medium text-red-600 dark:text-red-400">Remove</Text>
        </Pressable>
      </View>
    );
  }

  const trimmed = draft.trim();
  const canSave = trimmed !== '' && !checking;

  const save = async () => {
    if (!canSave) return;
    setChecking(true);
    setError(null);
    try {
      await verifyKey(trimmed);
      await saveApiKey(trimmed);
      setDraft('');
      setEditing(false);
    } catch (reason) {
      const message = keyErrorMessage(reason);
      setError(message);
      // The live region below covers Android; iOS needs the announcement.
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View className="mt-4 gap-2">
      <Text className="text-base text-black dark:text-white">OpenRouter key</Text>
      <TextInput
        accessibilityLabel="OpenRouter key"
        placeholder="sk-or-v1-…"
        placeholderTextColor={placeholderColor}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => void save()}
        editable={!checking}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
        className="min-h-11 rounded-xl bg-neutral-100 px-4 text-base text-black dark:bg-neutral-900 dark:text-white"
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save OpenRouter key"
          accessibilityState={{ disabled: !canSave, busy: checking }}
          disabled={!canSave}
          onPress={() => void save()}
          className={`min-h-11 flex-row items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 dark:bg-white ${canSave ? '' : 'opacity-40'}`}
        >
          {checking ? <ActivityIndicator color="#8e8e93" /> : null}
          <Text className="text-base font-medium text-white dark:text-black">
            {checking ? 'Checking' : 'Save'}
          </Text>
        </Pressable>
        {apiKey ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditing(false);
              setDraft('');
              setError(null);
            }}
            className="min-h-11 justify-center px-3"
          >
            <Text className="text-base font-medium text-blue-600 dark:text-blue-400">Cancel</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-xs text-neutral-600 dark:text-neutral-400">{STORAGE_NOTE}</Text>
    </View>
  );
}
