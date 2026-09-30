import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { compressPhoto, permissionState, pickPhoto } from './pick-photo';

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockResize = jest.fn();
const mockSaveAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: mockResize,
      renderAsync: () => Promise.resolve({ saveAsync: mockSaveAsync }),
    })),
  },
}));

const picker = jest.mocked(ImagePicker);
const granted = {
  granted: true,
  canAskAgain: true,
} as ImagePicker.PermissionResponse;

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveAsync.mockResolvedValue({
    uri: 'file:///compressed.jpg',
    width: 1200,
    height: 1600,
  });
});

describe('compressPhoto', () => {
  it('bounds the longest side to 1600 px and re-encodes as JPEG', async () => {
    const result = await compressPhoto({
      uri: 'file:///big.jpg',
      width: 3000,
      height: 4000,
    });

    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file:///big.jpg');
    expect(mockResize).toHaveBeenCalledWith({ height: 1600 });
    expect(mockSaveAsync).toHaveBeenCalledWith({
      format: SaveFormat.JPEG,
      compress: 0.8,
    });
    expect(result).toEqual({
      uri: 'file:///compressed.jpg',
      width: 1200,
      height: 1600,
    });
  });

  it('does not enlarge a small picture', async () => {
    await compressPhoto({ uri: 'file:///small.jpg', width: 800, height: 600 });

    expect(mockResize).not.toHaveBeenCalled();
    expect(mockSaveAsync).toHaveBeenCalled();
  });
});

describe('pickPhoto', () => {
  it('asks for the camera permission only when taking a photo', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue(granted);
    picker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///shot.jpg', width: 3000, height: 4000 }],
    } as ImagePicker.ImagePickerResult);

    const result = await pickPhoto('camera');

    expect(picker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(picker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'], exif: false }),
    );
    expect(result).toEqual({
      status: 'picked',
      photo: { uri: 'file:///compressed.jpg', width: 1200, height: 1600 },
    });
  });

  it('reports a refusal without opening the picker', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as ImagePicker.MediaLibraryPermissionResponse);

    await expect(pickPhoto('library')).resolves.toEqual({
      status: 'denied',
      canAskAgain: false,
    });
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('reports a cancellation', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    } as ImagePicker.ImagePickerResult);

    await expect(pickPhoto('library')).resolves.toEqual({ status: 'canceled' });
    expect(mockSaveAsync).not.toHaveBeenCalled();
  });
});

describe('permissionState', () => {
  it.each([
    [{ granted: true, canAskAgain: true }, 'granted'],
    [{ granted: false, canAskAgain: true }, 'ask'],
    [{ granted: false, canAskAgain: false }, 'blocked'],
  ] as const)(
    'reads the permission without asking (%#)',
    async (response, expected) => {
      picker.getCameraPermissionsAsync.mockResolvedValue(
        response as unknown as ImagePicker.PermissionResponse,
      );

      await expect(permissionState('camera')).resolves.toBe(expected);
      expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    },
  );
});
