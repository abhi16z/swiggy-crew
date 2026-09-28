import { fireEvent, render, screen } from '@testing-library/react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { RemoteImage } from '.';
import { ERROR_IMAGE, FADE_IN_MS, LOADING_IMAGE } from './constants';

// Only the reduced-motion setting is replaced.
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual<object>('react-native-reanimated'),
  useReducedMotion: jest.fn(() => false),
}));

const URI = 'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-1280,h-720';
const OTHER_URI = 'https://ik.imagekit.io/a16xyz/crew/2.jpg?tr=w-1280,h-720';
const LOADER_URI = 'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-45,h-25';

function renderImage() {
  return render(
    <RemoteImage
      uri={URI}
      width="100%"
      height={208}
      placeholderColor="#8a5436"
      accessibilityLabel="Serengeti"
      testID="hero"
    />,
  );
}

async function failLoad() {
  await fireEvent(screen.getByTestId('hero'), 'error', { nativeEvent: { error: 'Network error' } });
}

describe('RemoteImage', () => {
  it('reserves its size and falls back to the bundled loading image when no loader is given', async () => {
    await renderImage();

    const image = screen.getByTestId('hero');
    expect(image).toHaveProp('placeholder', [LOADING_IMAGE]);
    expect(image).toHaveProp('contentFit', 'cover');
    expect(image.parent).toHaveStyle({ width: '100%', height: 208, backgroundColor: '#8a5436' });
  });

  it('shows the remote loader while the full image loads', async () => {
    await render(
      <RemoteImage uri={URI} loaderUri={LOADER_URI} width={344} height={208} testID="hero" />,
    );

    expect(screen.getByTestId('hero')).toHaveProp('placeholder', [
      expect.objectContaining({ uri: LOADER_URI }),
    ]);
  });

  it('rejects a bundled image as the loader', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      // @ts-expect-error A bundled image is not a RemoteUri.
      render(<RemoteImage uri={URI} loaderUri={LOADING_IMAGE} width={344} height={208} />),
    ).rejects.toThrow('`loaderUri` must be a remote http(s) URL');

    jest.mocked(console.error).mockRestore();
  });

  it('shows the error image in the same space when the image fails to load', async () => {
    await renderImage();

    await failLoad();

    const fallback = screen.getByRole('image', { name: 'Serengeti' });
    expect(fallback).toHaveStyle({ width: '100%', height: 208 });
    expect(fallback.children[0]).toHaveProp('source', [ERROR_IMAGE]);
  });

  it('fades the image in, but not when the user prefers reduced motion', async () => {
    await renderImage();
    expect(screen.getByTestId('hero')).toHaveProp('transition', { duration: FADE_IN_MS });

    jest.mocked(useReducedMotion).mockReturnValue(true);
    await renderImage();
    expect(screen.getByTestId('hero')).toHaveProp('transition', { duration: 0 });
    jest.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('is announced as an image when labelled, and skipped by screen readers when not', async () => {
    await renderImage();
    expect(screen.getByRole('image', { name: 'Serengeti' })).toBeOnTheScreen();

    await render(<RemoteImage uri={URI} width={344} height={208} testID="decorative" />);
    expect(screen.getByTestId('decorative')).toHaveProp('accessible', false);
  });

  // A recycled list cell receives a new uri; an earlier failure must not stick to it.
  it('loads a new uri after a previous one failed', async () => {
    await renderImage();
    await failLoad();

    await screen.rerender(<RemoteImage uri={OTHER_URI} width="100%" height={208} testID="hero" />);

    expect(screen.getByTestId('hero')).toHaveProp('source', [
      expect.objectContaining({ uri: OTHER_URI }),
    ]);
    expect(screen.getByTestId('hero')).toHaveProp('placeholder', [LOADING_IMAGE]);
  });
});
