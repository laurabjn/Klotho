import { AiUnavailableError } from '../../domain/ai/errors';
import type { ProcessedImage } from '../../domain/storage/ports/image-processor';
import {
  OpenAiCompatibleGarmentAnalyzer,
  type OpenAiCompatibleProvider,
} from './openai-compatible-garment-analyzer';

const image: ProcessedImage = {
  bytes: new TextEncoder().encode('jpeg bytes'),
  contentType: 'image/jpeg',
  width: 600,
  height: 800,
};

const answer = (args: unknown, content: string | null = '') => ({
  id: 'cmpl_1',
  object: 'chat.completion',
  model: 'mistral-small-2506',
  choices: [
    {
      index: 0,
      finish_reason: 'tool_calls',
      message: {
        role: 'assistant',
        content,
        tool_calls:
          args === undefined
            ? null
            : [
                {
                  id: 'call_1',
                  type: 'function',
                  function: { name: 'record_garment', arguments: args },
                },
              ],
      },
    },
  ],
  usage: { prompt_tokens: 1320, completion_tokens: 140, total_tokens: 1460 },
});

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('OpenAiCompatibleGarmentAnalyzer', () => {
  let fetchMock: jest.Mock<Promise<Response>, [URL, RequestInit]>;
  const analyzer = ({
    apiKey = 'secret-key',
    provider = 'groq',
    model,
  }: {
    apiKey?: string;
    provider?: OpenAiCompatibleProvider;
    model?: string;
  } = {}) =>
    new OpenAiCompatibleGarmentAnalyzer(
      { provider, apiKey, model, timeoutMs: 1000 },
      fetchMock,
    );
  const sentBody = () =>
    JSON.parse(fetchMock.mock.calls[0]![1].body as string) as {
      model: string;
      tool_choice: unknown;
      tools: {
        type: string;
        function: { name: string; parameters: { properties: object } };
      }[];
      messages: {
        role: string;
        content:
          | string
          | { type: string; image_url?: { url: string }; text?: string }[];
      }[];
    };

  beforeEach(() => {
    fetchMock = jest.fn<Promise<Response>, [URL, RequestInit]>();
  });

  it('sends the photo and forces the structured answer', async () => {
    fetchMock.mockReturnValue(json(answer('{"isGarment":true}')));

    await analyzer().analyze(image, 'fr');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.href).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ authorization: 'Bearer secret-key' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = sentBody();
    expect(body.model).toBe('qwen/qwen3.8-27b');
    expect(body.tool_choice).toBe('required');
    expect(body.tools[0]!.function.name).toBe('record_garment');
    expect(Object.keys(body.tools[0]!.function.parameters.properties)).toEqual(
      expect.arrayContaining(['category', 'primaryColor', 'styles', 'seasons']),
    );
    expect(body.messages[0]!.role).toBe('system');
    const [photo, instruction] = body.messages[1]!.content as {
      type: string;
      image_url?: { url: string };
      text?: string;
    }[];
    expect(photo).toEqual({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${Buffer.from('jpeg bytes').toString('base64')}`,
      },
    });
    expect(instruction!.text).toContain('French');
  });

  it.each([
    [
      'gemini',
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      'gemini-2.5-flash',
    ],
    [
      'mistral',
      'https://api.mistral.ai/v1/chat/completions',
      'mistral-small-latest',
    ],
  ] as const)('talks to %s with its model', async (provider, url, model) => {
    fetchMock.mockReturnValue(json(answer('{"isGarment":true}')));

    await analyzer({ provider }).analyze(image, 'fr');

    expect(fetchMock.mock.calls[0]![0].href).toBe(url);
    expect(sentBody().model).toBe(model);
  });

  it('uses the model asked for', async () => {
    fetchMock.mockReturnValue(json(answer('{"isGarment":true}')));

    await analyzer({ model: 'other-model' }).analyze(image, 'fr');

    expect(sentBody().model).toBe('other-model');
  });

  it('returns the attributes and what the call cost', async () => {
    fetchMock.mockReturnValue(
      json(
        answer(
          JSON.stringify({
            isGarment: true,
            name: 'Blouse romantique',
            category: 'TOP',
            styles: ['romantic'],
          }),
        ),
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
        model: 'mistral-small-2506',
        inputTokens: 1320,
        outputTokens: 140,
      },
    });
  });

  it('accepts arguments already parsed', async () => {
    fetchMock.mockReturnValue(json(answer({ isGarment: false })));

    await expect(analyzer().analyze(image, 'fr')).resolves.toMatchObject({
      isGarment: false,
    });
  });

  it('reads the JSON written as text when the model skips the tool', async () => {
    fetchMock.mockReturnValue(
      json(answer(undefined, '{"isGarment":true,"category":"SHOES"}')),
    );

    await expect(analyzer().analyze(image, 'fr')).resolves.toMatchObject({
      isGarment: true,
      attributes: { category: 'SHOES' },
    });
  });

  it('is unavailable without a key, without calling the service', async () => {
    await expect(
      analyzer({ apiKey: '' }).analyze(image, 'fr'),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['the free plan limit', () => json({ message: 'Rate limit' }, 429)],
    ['a network failure', () => Promise.reject(new TypeError('fetch failed'))],
    ['broken arguments', () => json(answer('{"isGarment": tru'))],
    ['an answer without isGarment', () => json(answer('{"name":"x"}'))],
    ['no choice at all', () => json({ ...answer('{}'), choices: [] })],
    ['something else than JSON', () => Promise.resolve(new Response('<html>'))],
  ])('is unavailable on %s', async (_case, reply) => {
    fetchMock.mockImplementation(reply);

    await expect(analyzer().analyze(image, 'fr')).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });
});
