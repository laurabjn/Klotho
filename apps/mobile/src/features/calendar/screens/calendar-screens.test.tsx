import type { Outfit, WardrobeItem } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { outfitsApi } from '@/features/outfits/api/outfits.api';
import { plansApi } from '@/features/calendar/api/plans.api';
import { weatherApi } from '@/features/weather/api/weather.api';
import { addDays, endOfMonth, startOfMonth, today } from '@/lib/days';
import { renderWithProviders } from '@/testing/render';

import { CalendarScreen } from './CalendarScreen';
import { DayDetailScreen } from './DayDetailScreen';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/outfits/api/outfits.api');
jest.mock('@/features/calendar/api/plans.api');
jest.mock('@/features/weather/api/weather.api');
const api = jest.mocked(outfitsApi);

const BLOUSE = {
  id: 'blouse',
  name: 'Blouse',
  category: 'TOP',
  primaryColor: 'ecru',
  secondaryColors: [],
  styles: [],
  photos: [],
} as unknown as WardrobeItem;

const outfit = (overrides: Partial<Outfit> = {}): Outfit => ({
  id: 'o1',
  style: 'romantic',
  occasion: 'work',
  temperature: 17,
  condition: 'cloudy',
  pieces: [{ role: 'top', item: BLOUSE }],
  highlights: [],
  variantOf: null,
  createdAt: '2026-10-01T08:00:00.000Z',
  isFavorite: false,
  feedback: null,
  lastWornOn: null,
  ...overrides,
});

const page = <T,>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 100,
  hasMore: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  jest.mocked(plansApi.list).mockResolvedValue([]);
  jest
    .mocked(plansApi.note)
    .mockImplementation((day) => Promise.resolve({ day, text: null }));
  jest.mocked(weatherApi.settings).mockResolvedValue({
    locationMode: null,
    city: null,
    temperatureUnit: 'celsius',
  });
});

describe('CalendarScreen', () => {
  it("marks the month's worn days and opens a day", async () => {
    const day = today();
    api.history.mockResolvedValue(
      page([{ id: 'w1', wornOn: day, outfit: outfit() }]),
    );
    await renderWithProviders(<CalendarScreen />);

    // The month and the week are both asked for.
    await waitFor(() =>
      expect(api.history).toHaveBeenCalledWith({
        from: startOfMonth(day),
        to: endOfMonth(day),
        pageSize: 100,
      }),
    );
    const worn = await screen.findAllByRole('button', {
      name: /tenue portée$/,
    });
    await fireEvent.press(worn[0]!);

    expect(router.push).toHaveBeenCalledWith(`/calendar/${day}`);
  });

  it('plans the week, then shows it', async () => {
    api.history.mockResolvedValue(page([]));
    jest
      .mocked(plansApi.planWeek)
      .mockResolvedValue([
        { id: 'p1', day: today(), outfit: outfit(), forecast: null },
      ]);
    await renderWithProviders(<CalendarScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Planifier ma semaine' }),
    );

    expect(await screen.findByText('Tenue planifiée !')).toBeOnTheScreen();
    expect(plansApi.planWeek).toHaveBeenCalledWith(
      expect.objectContaining({ from: today() }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Voir le calendrier' }),
    );
    expect(
      screen.getByRole('tab', { name: 'Semaine' }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('lists the planned looks', async () => {
    api.history.mockResolvedValue(page([]));
    jest.mocked(plansApi.list).mockResolvedValue([
      {
        id: 'p1',
        day: addDays(today(), 2),
        outfit: outfit(),
        forecast: null,
      },
    ]);
    await renderWithProviders(<CalendarScreen />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Liste' }));

    expect(await screen.findByText('Prévue')).toBeOnTheScreen();
  });
});

describe('DayDetailScreen', () => {
  it('shows the look worn that day and goes to the next day', async () => {
    const day = '2026-10-01';
    mockParams = { day };
    api.history.mockImplementation(({ from }) =>
      Promise.resolve(
        page(from === day ? [{ id: 'w1', wornOn: day, outfit: outfit() }] : []),
      ),
    );
    await renderWithProviders(<DayDetailScreen />);

    expect(await screen.findByText('Assurance au bureau')).toBeOnTheScreen();
    expect(screen.getByText('Jeudi 1 octobre 2026')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Jour suivant' }));

    expect(
      await screen.findByText('Aucune tenue portée ce jour-là.'),
    ).toBeOnTheScreen();
    expect(api.history).toHaveBeenLastCalledWith({
      from: addDays(day, 1),
      to: addDays(day, 1),
      pageSize: 100,
    });
  });

  it('removes the look from that day', async () => {
    mockParams = { day: '2026-10-01' };
    api.history.mockResolvedValue(
      page([{ id: 'w1', wornOn: '2026-10-01', outfit: outfit() }]),
    );
    api.removeWear.mockResolvedValue(undefined);
    await renderWithProviders(<DayDetailScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Supprimer' }),
    );
    const buttons = screen.getAllByRole('button', { name: 'Supprimer' });
    await fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(api.removeWear).toHaveBeenCalledWith('w1'));
  });
});

describe('DayDetailScreen with a planned look', () => {
  const day = '2026-10-01';
  beforeEach(() => {
    mockParams = { day };
    api.history.mockResolvedValue(page([]));
    jest.mocked(plansApi.list).mockResolvedValue([
      {
        id: 'p1',
        day,
        outfit: outfit(),
        forecast: { temperature: 15, condition: 'rain' },
      },
    ]);
  });

  it('changes the planned look', async () => {
    jest
      .mocked(plansApi.regenerate)
      .mockResolvedValue({ id: 'p1', day, outfit: outfit(), forecast: null });
    await renderWithProviders(<DayDetailScreen />);

    expect(await screen.findByText('Tenue prévue')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Changer la tenue' }),
    );

    await waitFor(() => expect(plansApi.regenerate).toHaveBeenCalledWith(day));
  });

  it('moves the planned look to another day', async () => {
    jest.mocked(plansApi.move).mockResolvedValue([]);
    await renderWithProviders(<DayDetailScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Déplacer' }),
    );
    const days = screen.getAllByRole('radio');
    await fireEvent.press(days[1]!);
    // The sheet's button, after the screen's one.
    const buttons = screen.getAllByRole('button', { name: 'Déplacer' });
    await fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() => expect(plansApi.move).toHaveBeenCalled());
    expect(jest.mocked(plansApi.move).mock.calls[0]![0]).toBe(day);
  });

  it('writes a note for the day', async () => {
    jest
      .mocked(plansApi.saveNote)
      .mockResolvedValue({ day, text: 'Réunion à 10 h' });
    await renderWithProviders(<DayDetailScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Notes, Ajouter une note' }),
    );
    await fireEvent.changeText(
      screen.getByLabelText('Notes'),
      'Réunion à 10 h',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(plansApi.saveNote).toHaveBeenCalledWith(day, {
        text: 'Réunion à 10 h',
      }),
    );
  });
});
