import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

/** A picture ready to upload: resized and re-encoded on the phone. */
export interface LocalPhoto {
  uri: string;
  width: number;
  height: number;
  /** Already on the server (sent for the AI analysis): attached as is. */
  key?: string;
}

export type PickResult =
  | { status: 'picked'; photo: LocalPhoto }
  | { status: 'canceled' }
  /** Refused for good: only the phone settings can grant it now. */
  | { status: 'denied'; canAskAgain: boolean };

/** The server stores 1600 px max; sending more would waste data. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Current permission, without asking: "ask" means the system dialog can
 * still be shown, "blocked" that only the phone settings can grant it.
 */
export async function permissionState(
  source: PhotoSource,
): Promise<'granted' | 'ask' | 'blocked'> {
  const response =
    source === 'camera'
      ? await ImagePicker.getCameraPermissionsAsync()
      : await ImagePicker.getMediaLibraryPermissionsAsync();
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'ask' : 'blocked';
}

async function ensurePermission(source: PhotoSource) {
  const response =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return response;
}

/** Compresses before upload (backlog US3.1): a few hundred KB instead of several MB. */
export async function compressPhoto(asset: {
  uri: string;
  width: number;
  height: number;
}): Promise<LocalPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(
      asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE },
    );
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Asks for the permission when needed, lets the user pick, then compresses. */
export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  const permission = await ensurePermission(source);
  if (!permission.granted) {
    return { status: 'denied', canAskAgain: permission.canAskAgain };
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1, // compression happens once, in compressPhoto
    exif: false,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: 'canceled' };
  return { status: 'picked', photo: await compressPhoto(asset) };
}
