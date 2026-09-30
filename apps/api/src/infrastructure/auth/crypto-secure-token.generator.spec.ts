import { CryptoSecureTokenGenerator } from './crypto-secure-token.generator';

describe('CryptoSecureTokenGenerator', () => {
  const generator = new CryptoSecureTokenGenerator();

  it('generates url-safe tokens of 256 bits', () => {
    expect(generator.generate()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('never generates the same token twice', () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generator.generate()),
    );
    expect(tokens.size).toBe(1000);
  });

  it('hashes deterministically without exposing the token', () => {
    const token = generator.generate();

    expect(generator.hash(token)).toBe(generator.hash(token));
    expect(generator.hash(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(generator.hash(token)).not.toContain(token);
  });
});
