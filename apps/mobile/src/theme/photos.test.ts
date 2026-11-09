import { HAIRSTYLES, MAKEUP_LOOKS } from '@klotho/shared';

import { lookPhotos } from './photos';

describe('lookPhotos', () => {
  it('illustrates every hairstyle and makeup look of "Le look complet"', () => {
    for (const key of [...HAIRSTYLES, ...MAKEUP_LOOKS])
      expect(lookPhotos[key]).toBeDefined();
  });
});
