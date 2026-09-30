import { buildUploadKey, parseUploadKey } from './upload-key';

const id = '0b7e5c1e-8a8e-4a57-9b77-2d3f0c1a9e11';

describe('upload keys', () => {
  it('round-trips the owner and the size', () => {
    const key = buildUploadKey('user-1', id, { width: 1200, height: 1600 });

    expect(key).toBe(`users/user-1/photos/${id}_1200x1600.jpg`);
    expect(parseUploadKey(key, 'user-1')).toEqual({
      width: 1200,
      height: 1600,
    });
  });

  it("refuses another user's key", () => {
    const key = buildUploadKey('user-1', id, { width: 10, height: 10 });

    expect(parseUploadKey(key, 'user-2')).toBeNull();
  });

  it.each([
    'users/user-1/photos/../../secret.jpg',
    `users/user-1/photos/${id}.jpg`,
    `users/user-1/other/${id}_10x10.jpg`,
    `/users/user-1/photos/${id}_10x10.jpg`,
    'anything',
  ])('refuses the malformed key %s', (key) => {
    expect(parseUploadKey(key, 'user-1')).toBeNull();
  });
});
