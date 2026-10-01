import { ApiError, NetworkError } from './api/errors';
import { isUnexpected } from './query-client';

describe('isUnexpected', () => {
  it('reports server errors and bugs, not the expected failures', () => {
    expect(isUnexpected(new NetworkError())).toBe(false);
    expect(isUnexpected(new ApiError(404, 'outfits.notFound'))).toBe(false);
    expect(isUnexpected(new ApiError(500, 'internal'))).toBe(true);
    expect(isUnexpected(new TypeError('undefined is not a function'))).toBe(
      true,
    );
  });
});
