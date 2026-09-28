import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Accordion } from '.';

const header = () => screen.getByRole('button', { name: 'Sort by, Top rated' });

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
});
