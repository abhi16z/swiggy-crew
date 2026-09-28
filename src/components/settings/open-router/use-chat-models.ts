import { useCallback, useEffect, useState } from 'react';

import { describeError, loadChatModels, type OpenRouterModel } from '@/lib/open-router';

/** Loads the OpenRouter catalog (cached for the app session) and exposes a retry. */
export function useChatModels() {
  const [models, setModels] = useState<OpenRouterModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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

  const retry = useCallback(() => {
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  return { models, error, retry };
}
