import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** apps/api/site, from src/ (tests) as from dist/ (build). */
const SITE_DIR = join(__dirname, '..', '..', '..', '..', 'site');

/** The only files served: logo, illustrations and fonts of the website. */
const TYPES: Record<string, string> = {
  'monogram.svg': 'image/svg+xml',
  'hero.webp': 'image/webp',
  'wardrobe.webp': 'image/webp',
  'vanity.webp': 'image/webp',
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
