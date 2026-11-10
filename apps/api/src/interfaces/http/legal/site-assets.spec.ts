import { byteRange, siteAsset } from './site-assets';

describe('siteAsset', () => {
  it('serves the video of the complete look, and nothing outside the list', () => {
    expect(siteAsset('look-complet.mp4')?.contentType).toBe('video/mp4');
    expect(siteAsset('look-complet.webp')?.contentType).toBe('image/webp');
    expect(siteAsset('look-complet-en.webp')?.contentType).toBe('image/webp');
    expect(siteAsset('../package.json')).toBeNull();
  });
});

describe('byteRange', () => {
  it('reads the part of the file a browser asks for', () => {
    expect(byteRange('bytes=0-1', 100)).toEqual([0, 1]);
    expect(byteRange('bytes=10-', 100)).toEqual([10, 99]);
    expect(byteRange('bytes=-20', 100)).toEqual([80, 99]);
    expect(byteRange('bytes=90-500', 100)).toEqual([90, 99]);
  });

  it('refuses a part out of the file, and ignores what it cannot read', () => {
    expect(byteRange('bytes=100-', 100)).toBeNull();
    expect(byteRange('bytes=5-2', 100)).toBeNull();
    expect(byteRange('bytes=-', 100)).toBeUndefined();
    expect(byteRange('items=0-1', 100)).toBeUndefined();
  });
});
