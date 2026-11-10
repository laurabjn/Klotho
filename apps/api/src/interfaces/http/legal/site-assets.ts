import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** apps/api/site, from src/ (tests) as from dist/ (build). */
const SITE_DIR = join(__dirname, '..', '..', '..', '..', 'site');

/** The only files served: logo, illustrations, video and fonts of the website. */
const TYPES: Record<string, string> = {
  'monogram.svg': 'image/svg+xml',
  'hero.webp': 'image/webp',
  'wardrobe.webp': 'image/webp',
  'vanity.webp': 'image/webp',
  'look-complet.mp4': 'video/mp4',
  'look-complet.webp': 'image/webp',
  'look-complet-en.webp': 'image/webp',
  'fonts/cormorant-500.woff2': 'font/woff2',
  'fonts/cormorant-600.woff2': 'font/woff2',
  'fonts/jost-400.woff2': 'font/woff2',
  'fonts/jost-500.woff2': 'font/woff2',
};

const cache = new Map<string, Buffer>();

/** Null when the file is not part of the website. */
export function siteAsset(
  name: string,
): { body: Buffer; contentType: string } | null {
  const contentType = TYPES[name];
  if (!contentType) return null;
  let body = cache.get(name);
  if (!body) {
    body = readFileSync(join(SITE_DIR, name));
    cache.set(name, body);
  }
  return { body, contentType };
}

/** [start, end] of "bytes=start-end", null when it is out of the file. */
export function byteRange(
  header: string,
  size: number,
): [number, number] | null | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return undefined;
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end =
    match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end && start < size ? [start, end] : null;
}
