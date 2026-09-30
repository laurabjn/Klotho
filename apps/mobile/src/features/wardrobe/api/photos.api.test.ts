import { request } from '@/lib/api/http';

import { photosApi } from './photos.api';

jest.mock('@/lib/api/http', () => ({ request: jest.fn() }));
// Like the real one, the File of expo-file-system is a Blob.
jest.mock('expo-file-system', () => ({
  File: class MockFile extends Blob {
    uri: string;
    constructor(mockUri: string) {
      super(['jpeg bytes'], { type: 'image/jpeg' });
      this.uri = mockUri;
    }
  },
}));

describe('photosApi.upload', () => {
  it('sends the photo as a File in a multipart form (supported by expo/fetch)', async () => {
    jest.mocked(request).mockResolvedValue({ key: 'k', width: 1, height: 1 });

    await photosApi.upload({
      uri: 'file:///cache/photo.jpg',
      width: 1,
      height: 1,
    });

    const [path, options] = jest.mocked(request).mock.calls[0]!;
    expect(path).toBe('/uploads/wardrobe');
    expect(options).toMatchObject({ method: 'POST', auth: true });
    const part = options?.form?.get('file');
    // A real Blob holding the file, not React Native's legacy { uri } object
    // (which expo/fetch rejects before sending anything).
    expect(part).toBeInstanceOf(Blob);
    expect(await (part as Blob).text()).toBe('jpeg bytes');
  });
});
