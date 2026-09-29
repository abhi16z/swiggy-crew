import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Accordion } from './accordion';
import { EXPAND_MS, REDUCE_MOTION_MS } from './constants';

// Only the reduced-motion setting is replaced; animations stay real on Jest timers.
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual<object>('react-native-reanimated'),
  useReducedMotion: jest.fn(() => false),
}));

const CONTENT_HEIGHT = 120;

const header = () => screen.getByRole('button', { name: 'Sort by, Top rated' });

// The animated wrapper around the content: Text -> measured View -> animated body.
const body = () => screen.getByText('Content', { includeHiddenElements: true }).parent!.parent!;

async function measureContent() {
  await fireEvent(screen.getByText('Content'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: CONTENT_HEIGHT } },
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

async function renderAccordion() {
  await render(
    <Accordion title="Sort by" summary="Top rated">
      <Text>Content</Text>
    </Accordion>,
  );
}

describe('Accordion', () => {
  it('starts collapsed and does not mount its content until first expanded', async () => {
    await renderAccordion();

    expect(header()).toBeCollapsed();
    expect(screen.queryByText('Content', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('shows the title and summary on the header, so the value reads while collapsed', async () => {
    await renderAccordion();

    expect(screen.getByText('Sort by')).toBeOnTheScreen();
    expect(screen.getByText('Top rated')).toBeOnTheScreen();
  });

  it('expands and collapses from the header', async () => {
    const user = userEvent.setup();
    await renderAccordion();

    await user.press(header());
    expect(header()).toBeExpanded();
    expect(screen.getByText('Content')).toBeOnTheScreen();

    await user.press(header());
    expect(header()).toBeCollapsed();
    // Kept mounted for the next expand, but hidden from screen readers and touches.
    expect(screen.queryByText('Content')).not.toBeOnTheScreen();
    expect(screen.getByText('Content', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('uses the title alone as the label when there is no summary', async () => {
    await render(
      <Accordion title="Details">
        <Text>Content</Text>
      </Accordion>,
    );

    expect(screen.getByRole('button', { name: 'Details' })).toBeOnTheScreen();
  });

  describe('height animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.mocked(useReducedMotion).mockReturnValue(false);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('opens to the measured content height and closes back to zero', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await renderAccordion();

      await user.press(header());
      await measureContent();
      await advance(EXPAND_MS);
      expect(body()).toHaveAnimatedStyle({ height: CONTENT_HEIGHT });

      await user.press(header());
      await advance(EXPAND_MS);
      expect(body()).toHaveAnimatedStyle({ height: 0 });
    });

    it('finishes sooner when the user prefers reduced motion', async () => {
      jest.mocked(useReducedMotion).mockReturnValue(true);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await renderAccordion();

      await user.press(header());
      await measureContent();
      await advance(REDUCE_MOTION_MS);

      expect(body()).toHaveAnimatedStyle({ height: CONTENT_HEIGHT });
    });
  });
});
