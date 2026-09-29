import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { createRef } from 'react';
import { BackHandler, Text } from 'react-native';
import { State, type PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { BottomSheet } from '.';
import { PAN_TEST_ID } from './constants';
import type { BottomSheetProps, BottomSheetRef } from './types';

jest.mock('expo-haptics');

// Safe-area mock gives zero insets, so with an 800pt parent: full = 0, half = 400, closed = 840.
const PARENT_HEIGHT = 800;
const ANIMATION_MS = 1000;

async function renderSheet(props: Omit<BottomSheetProps, 'children'> = {}) {
  const ref = createRef<BottomSheetRef>();
  const onSnapChange = jest.fn();
  await render(
    <BottomSheet ref={ref} onSnapChange={onSnapChange} {...props}>
      <Text>Sheet content</Text>
    </BottomSheet>,
  );
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: PARENT_HEIGHT } },
  });
  return { ref, onSnapChange };
}

function getSheet() {
  return screen.getByLabelText('Bottom sheet', { includeHiddenElements: true });
}

async function finishAnimations() {
  await act(async () => {
    jest.advanceTimersByTime(ANIMATION_MS);
  });
}

async function drag(translationY: number, velocityY: number) {
  await act(async () => {
    fireGestureHandler<PanGesture>(getByGestureTestId(PAN_TEST_ID), [
      { state: State.BEGAN, translationY: 0, velocityY: 0 },
      { state: State.ACTIVE, translationY: 0, velocityY: 0 },
      { state: State.ACTIVE, translationY, velocityY },
      { state: State.END, translationY, velocityY },
    ]);
    // scheduleOnRN defers to a microtask, which fake timers hold until flushed.
    jest.runAllTicks();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(Haptics.impactAsync).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('BottomSheet', () => {
  it('waits for the parent to be measured before rendering the sheet', async () => {
    await render(
      <BottomSheet>
        <Text>Sheet content</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();

    await fireEvent(screen.root!, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: PARENT_HEIGHT } },
    });
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('opens at half by default and is reachable by assistive tech', async () => {
    await renderSheet();

    expect(screen.getByLabelText('Bottom sheet')).toBeVisible();
    expect(screen.getByText('Sheet content')).toBeVisible();
  });

  it('starts hidden and non-interactive when initialSnap is closed', async () => {
    await renderSheet({ initialSnap: 'closed' });

    expect(getSheet()).not.toBeVisible();
    expect(getSheet()).toHaveProp('pointerEvents', 'none');
    expect(screen.queryByText('Sheet content')).not.toBeOnTheScreen();
  });

  it('opens from closed when snapTo is called and reports the new snap once', async () => {
    const { ref, onSnapChange } = await renderSheet({ initialSnap: 'closed' });

    await act(async () => ref.current?.snapTo('full'));
    await act(async () => ref.current?.snapTo('full'));

    expect(onSnapChange).toHaveBeenCalledTimes(1);
    expect(onSnapChange).toHaveBeenCalledWith('full');
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(getSheet()).toBeVisible();
    expect(getSheet()).toHaveProp('pointerEvents', 'auto');
  });

  it('stays interactive while closing and only hides once the close animation finishes', async () => {
    const { ref, onSnapChange } = await renderSheet();

    await act(async () => ref.current?.snapTo('closed'));
    expect(onSnapChange).toHaveBeenCalledWith('closed');
    expect(getSheet()).toBeVisible();

    await finishAnimations();
    expect(getSheet()).not.toBeVisible();
    expect(getSheet()).toHaveProp('pointerEvents', 'none');
  });

  it('reports onClosed only after the close animation finishes', async () => {
    const onClosed = jest.fn();
    const { ref } = await renderSheet({ onClosed });

    await act(async () => ref.current?.snapTo('closed'));
    expect(onClosed).not.toHaveBeenCalled();

    await finishAnimations();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('does not report onClosed when reopened before the close animation finishes', async () => {
    const onClosed = jest.fn();
    const { ref } = await renderSheet({ onClosed });

    await act(async () => ref.current?.snapTo('closed'));
    await act(async () => ref.current?.snapTo('half'));
    await finishAnimations();

    expect(onClosed).not.toHaveBeenCalled();
  });

  describe('Android back button', () => {
    const backHandlers = new Set<() => boolean | null | undefined>();

    // Mirrors Android: newest listener first, stop at the first that handles the press.
    async function pressBack() {
      let handled = false;
      await act(async () => {
        handled = [...backHandlers].reverse().some((handler) => handler());
      });
      return handled;
    }

    beforeEach(() => {
      backHandlers.clear();
      jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        backHandlers.add(handler as () => boolean);
        return { remove: () => backHandlers.delete(handler as () => boolean) };
      });
    });

    afterEach(() => {
      jest.mocked(BackHandler.addEventListener).mockRestore();
    });

    it('closes an open sheet and consumes the press', async () => {
      const { ref, onSnapChange } = await renderSheet({ initialSnap: 'closed' });
      await act(async () => ref.current?.snapTo('full'));

      expect(await pressBack()).toBe(true);
      expect(onSnapChange).toHaveBeenLastCalledWith('closed');
      await finishAnimations();
      expect(getSheet()).not.toBeVisible();
    });

    it('lets back through while the sheet is closing or closed', async () => {
      const { ref } = await renderSheet();

      await act(async () => ref.current?.snapTo('closed'));
      expect(await pressBack()).toBe(false);

      await finishAnimations();
      expect(backHandlers.size).toBe(0);
      expect(await pressBack()).toBe(false);
    });
  });

  it('reopens after being closed', async () => {
    const { ref, onSnapChange } = await renderSheet();

    await act(async () => ref.current?.snapTo('closed'));
    await finishAnimations();
    await act(async () => ref.current?.snapTo('half'));

    expect(onSnapChange).toHaveBeenLastCalledWith('half');
    expect(getSheet()).toBeVisible();
  });

  it('supports expand and collapse accessibility actions', async () => {
    const { onSnapChange } = await renderSheet();
    const sheet = screen.getByLabelText('Bottom sheet');

    await fireEvent(sheet, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onSnapChange).toHaveBeenLastCalledWith('full');

    await fireEvent(sheet, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onSnapChange).toHaveBeenLastCalledWith('half');
  });

  describe('dragging', () => {
    it('settles at full when slowly dragged up from half', async () => {
      const { onSnapChange } = await renderSheet();

      await drag(-300, 0);

      expect(onSnapChange).toHaveBeenCalledWith('full');
    });

    it('snaps back to half without reporting a change on a short drag', async () => {
      const { onSnapChange } = await renderSheet();

      await drag(-60, 0);

      expect(onSnapChange).not.toHaveBeenCalled();
    });

    it('moves only one stop on a flick, even if the finger travelled a short distance', async () => {
      const { onSnapChange } = await renderSheet({ initialSnap: 'full' });

      // Flick down from full: lands on half, not closed.
      await drag(40, 2000);

      expect(onSnapChange).toHaveBeenCalledTimes(1);
      expect(onSnapChange).toHaveBeenCalledWith('half');
    });

    it('closes and hides the sheet when flicked down from half', async () => {
      const { onSnapChange } = await renderSheet();

      await drag(40, 2000);
      await finishAnimations();

      expect(onSnapChange).toHaveBeenCalledWith('closed');
      expect(getSheet()).not.toBeVisible();
    });
  });
});
