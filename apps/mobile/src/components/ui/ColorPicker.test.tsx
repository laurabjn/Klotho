import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/render';

import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('shows every colour, each with its own name', async () => {
    await renderWithProviders(
      <ColorPicker value={undefined} onChange={jest.fn()} />,
    );

    expect(screen.getByRole('radio', { name: 'Jaune pâle' })).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'Jaune citron' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Bordeaux' })).toBeOnTheScreen();
  });

  it('narrows the palette to one family', async () => {
    await renderWithProviders(
      <ColorPicker value={undefined} onChange={jest.fn()} />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Bleus' }));

    expect(
      screen.getByRole('radio', { name: 'Bleu marine' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Noir' })).not.toBeOnTheScreen();
  });

  it('keeps the selection made in another family', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <ColorPicker multiple value={['black']} onChange={onChange} />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Verts' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Kaki' }));

    expect(onChange).toHaveBeenCalledWith(['black', 'khaki']);
  });
});
