import { coarsen } from './weather';

describe('coarsen', () => {
  it('keeps about 1 km of precision', () => {
    expect(coarsen({ latitude: 45.764043, longitude: 4.835659 })).toEqual({
      latitude: 45.76,
      longitude: 4.84,
    });
  });

  it('works south and west of Greenwich', () => {
    expect(coarsen({ latitude: -33.86882, longitude: -151.20929 })).toEqual({
      latitude: -33.87,
      longitude: -151.21,
    });
  });
});
