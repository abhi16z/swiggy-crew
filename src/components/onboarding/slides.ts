import type { ComponentType } from 'react';

import { ChatScene, FiltersScene, KeyScene, PanelScene, type SceneProps } from './scenes';

type Slide = {
  key: string;
  title: string;
  body: string;
  Scene: ComponentType<SceneProps>;
};

// The picture does the explaining; the text is one line of what to tap.
export const SLIDES: Slide[] = [
  {
    key: 'key',
    title: 'Add your OpenRouter key',
    body: 'Paste it in Settings under Ask Crew. Get key at openrouter.ai.',
    Scene: KeyScene,
  },
  {
    key: 'chat',
    title: 'Ask Crew anything',
    body: 'Tap Ask Crew on Home to plan a trip with AI, using your key.',
    Scene: ChatScene,
  },
  {
    key: 'panel',
    title: 'See performance live',
    body: 'Switch on the performance panel in Settings. Tap to expand for more details.',
    Scene: PanelScene,
  },
  {
    key: 'filters',
    title: 'Filter your trips',
    body: 'Tap Filters on Home to pick a trip type and sort order.',
    Scene: FiltersScene,
  },
];
