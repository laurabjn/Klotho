import { REDACTED } from './redaction';
import { AppLogger } from './app-logger';

describe('AppLogger', () => {
  let lines: string[];
  let stdout: jest.SpyInstance;
  let stderr: jest.SpyInstance;

  beforeEach(() => {
    lines = [];
    const capture = (chunk: unknown) => {
      lines.push(String(chunk));
      return true;
    };
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(capture);
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(capture);
  });

  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
  });

  it('writes one redacted JSON object per line in json format', () => {
    new AppLogger('json').log(
      'POST /auth/login 200 3ms',
      { method: 'POST', status: 200, password: 'Dressing2026!' },
      'HTTP',
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]!.trimEnd()).not.toContain('\n');
    const entry = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(entry).toMatchObject({
      level: 'log',
      context: 'HTTP',
      message: 'POST /auth/login 200 3ms',
      method: 'POST',
      status: 200,
      password: REDACTED,
    });
  });

  it('scrubs secrets from messages and stack traces', () => {
    const logger = new AppLogger('json');
    logger.error(
      'call failed with Bearer abc.def',
      'Error: boom\n    at https://x.test/a?X-Amz-Signature=deadbeef',
      'Test',
    );

    const output = lines.join('');
    expect(output).not.toContain('abc.def');
    expect(output).not.toContain('deadbeef');
    expect(output).toContain(REDACTED);
  });

  it('stays readable text in pretty format', () => {
    new AppLogger('pretty').log('GET /health 200 1ms', 'HTTP');
    expect(lines.join('')).toContain('GET /health 200 1ms');
    expect(() => JSON.parse(lines[0]!) as unknown).toThrow();
  });
});
