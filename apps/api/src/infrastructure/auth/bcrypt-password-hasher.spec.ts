import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4); // minimum cost keeps tests fast

  it('never returns the plain password', async () => {
    const hashed = await hasher.hash('Dressing2026!');

    expect(hashed).not.toContain('Dressing2026!');
    expect(hashed).toMatch(/^\$2b\$04\$/);
  });

  it('verifies the right password only', async () => {
    const hashed = await hasher.hash('Dressing2026!');

    await expect(hasher.verify('Dressing2026!', hashed)).resolves.toBe(true);
    await expect(hasher.verify('dressing2026', hashed)).resolves.toBe(false);
  });

  it('returns false without an account hash', async () => {
    await expect(hasher.verify('anything', null)).resolves.toBe(false);
  });
});
