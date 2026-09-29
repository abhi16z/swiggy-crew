import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import { Text } from 'react-native';

import { BottomSheet } from '.';
import { useBottomSheetPeekInset } from './context';
import { BottomSheetFooter } from './footer';
import type { BottomSheetRef } from './types';

jest.mock('expo-haptics');

// Safe-area mock gives zero insets, so with an 800pt parent: full = 0, half = 400.
const PARENT_HEIGHT = 800;
const HALF = 400;

function PeekInset() {
  return <Text>{`peek ${useBottomSheetPeekInset()}`}</Text>;
}

async function renderWithFooter() {
  const ref = createRef<BottomSheetRef>();
  await render(
    <BottomSheet ref={ref}>
      <PeekInset />
      <BottomSheetFooter testID="footer">
        <Text>Composer</Text>
      </BottomSheetFooter>
    </BottomSheet>,
  );
  await fireEvent(screen.root!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: PARENT_HEIGHT } },
  });
  return ref;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('BottomSheetFooter', () => {
  it('lifts the footer onto the screen edge while the sheet rests at half', async () => {
    await renderWithFooter();

    expect(screen.getByTestId('footer')).toHaveAnimatedStyle({
      transform: [{ translateY: -HALF }],
    });
  });

  it('leaves the footer in place once the sheet reaches full height', async () => {
    const ref = await renderWithFooter();

    await act(async () => ref.current?.snapTo('full'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('footer')).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });
  });

  it('reports how much of the body sits below the screen at half height', async () => {
    await renderWithFooter();

    expect(screen.getByText(`peek ${HALF}`)).toBeOnTheScreen();
  });
});
