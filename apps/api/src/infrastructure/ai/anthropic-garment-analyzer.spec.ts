import { AiUnavailableError } from '../../domain/ai/errors';
import type { ProcessedImage } from '../../domain/storage/ports/image-processor';
import { AnthropicGarmentAnalyzer } from './anthropic-garment-analyzer';

const image: ProcessedImage = {
  bytes: new TextEncoder().encode('jpeg bytes'),
  contentType: 'image/jpeg',
  width: 600,
  height: 800,
};

const answer = (input: unknown) => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-haiku-4-5-20251001',
  content: [{ type: 'tool_use', id: 'tu_1', name: 'record_garment', input }],
  stop_reason: 'tool_use',
  usage: { input_tokens: 1450, output_tokens: 160 },
});

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('AnthropicGarmentAnalyzer', () => {
  let fetchMock: jest.Mock<Promise<Response>, [URL, RequestInit]>;
  const analyzer = ({ apiKey = 'secret-key' }: { apiKey?: string } = {}) =>
    new AnthropicGarmentAnalyzer(
      { apiKey, model: 'claude-haiku-4-5', timeoutMs: 1000 },
      fetchMock,
    );
  const sentBody = () =>
    JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      model: string;
      tool_choice: unknown;
      tools: { name: string; input_schema: { properties: object } }[];
      messages: {
        content: { type: string; source?: object; text?: string }[];
      }[];
    };

  beforeEach(() => {
    fetchMock = jest.fn<Promise<Response>, [URL, RequestInit]>();
  });

  it('sends the photo to Claude and forces the structured answer', async () => {
    fetchMock.mockReturnValue(json(answer({ isGarment: true })));

    await analyzer().analyze(image, 'fr');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.href).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'x-api-key': 'secret-key',
      'anthropic-version': '2023-06-01',
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = sentBody();
    expect(body.model).toBe('claude-haiku-4-5');
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'record_garment' });
    expect(Object.keys(body.tools[0]!.input_schema.properties)).toEqual(
      expect.arrayContaining(['category', 'primaryColor', 'styles', 'seasons']),
    );
    const [photo, instruction] = body.messages[0]!.content;
    expect(photo).toEqual({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: Buffer.from('jpeg bytes').toString('base64'),
      },
    });
    expect(instruction!.text).toContain('French');
  });

  it('returns the attributes and what the call cost', async () => {
    fetchMock.mockReturnValue(
      json(
        answer({
          isGarment: true,
          name: 'Blouse romantique',
          category: 'TOP',
          styles: ['romantic'],
        }),
      ),
    );

    await expect(analyzer().analyze(image, 'en')).resolves.toEqual({
      isGarment: true,
      attributes: {
        name: 'Blouse romantique',
        category: 'TOP',
        styles: ['romantic'],
      },
      usage: {
        model: 'claude-haiku-4-5-20251001',
        inputTokens: 1450,
        outputTokens: 160,
      },
    });
  });

  it('tells when the photo shows no piece', async () => {
    fetchMock.mockReturnValue(json(answer({ isGarment: false })));

    await expect(analyzer().analyze(image, 'fr')).resolves.toMatchObject({
      isGarment: false,
    });
  });

  it('is unavailable without a key, without calling Anthropic', async () => {
    await expect(
      analyzer({ apiKey: '' }).analyze(image, 'fr'),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an error status', () => json({ type: 'error' }, 529)],
    ['a network failure', () => Promise.reject(new TypeError('fetch failed'))],
    ['an answer without the tool', () => json({ ...answer({}), content: [] })],
    ['a tool answer without isGarment', () => json(answer({ name: 'x' }))],
    ['something else than JSON', () => Promise.resolve(new Response('<html>'))],
  ])('is unavailable on %s', async (_case, reply) => {
    fetchMock.mockImplementation(reply);

    await expect(analyzer().analyze(image, 'fr')).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });
});
