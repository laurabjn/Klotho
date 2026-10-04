import { Logger } from '@nestjs/common';
import { z } from 'zod';

import { AiUnavailableError } from '../../domain/ai/errors';
import type {
  GarmentAnalysis,
  GarmentAnalyzer,
} from '../../domain/ai/ports/garment-analyzer';
import type { ProcessedImage } from '../../domain/storage/ports/image-processor';
import {
  garmentAnswer,
  GARMENT_INSTRUCTIONS,
  GARMENT_SCHEMA,
  GARMENT_TOOL,
  photoRequest,
} from './garment-prompt';

/**
 * Services speaking the OpenAI "chat completions" format, with a free plan
 * (rate limited) at the time of writing.
 */
export const OPENAI_COMPATIBLE_PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'qwen/qwen3.8-27b',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
  },
} as const;

export type OpenAiCompatibleProvider = keyof typeof OPENAI_COMPATIBLE_PROVIDERS;

export interface OpenAiCompatibleConfig {
  provider: OpenAiCompatibleProvider;
  /** Without a key, the analysis is simply unavailable. */
  apiKey: string | undefined;
  /** Default: the provider's model above. */
  model?: string;
  timeoutMs: number;
}

type Fetch = (url: URL, init: RequestInit) => Promise<Response>;

const completionResponse = z.object({
  model: z.string(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional(),
          tool_calls: z
            .array(
              z.object({
                function: z.object({
                  name: z.string(),
                  // A JSON string, sometimes already parsed.
                  arguments: z.union([
                    z.string(),
                    z.record(z.string(), z.unknown()),
                  ]),
                }),
              }),
            )
            .nullable()
            .optional(),
        }),
      }),
    )
    .min(1),
  usage: z.object({
    prompt_tokens: z.number().int(),
    completion_tokens: z.number().int(),
  }),
});

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

/**
 * Photo analysis with a vision model of Groq, Gemini or Mistral, forced to
 * answer with our tool.
 */
export class OpenAiCompatibleGarmentAnalyzer implements GarmentAnalyzer {
  private readonly logger = new Logger(OpenAiCompatibleGarmentAnalyzer.name);
  private readonly url: URL;
  private readonly model: string;

  constructor(
    private readonly config: OpenAiCompatibleConfig,
    private readonly fetchFn: Fetch = fetch,
  ) {
    const preset = OPENAI_COMPATIBLE_PROVIDERS[config.provider];
    this.url = new URL(preset.url);
    this.model = config.model ?? preset.model;
  }

  async analyze(
    image: ProcessedImage,
    language: 'fr' | 'en',
  ): Promise<GarmentAnalysis> {
    if (!this.config.apiKey) {
      throw new AiUnavailableError('AI_API_KEY is not set');
    }
    const photo = Buffer.from(image.bytes).toString('base64');
    const body = {
      model: this.model,
      max_tokens: 1024,
      temperature: 0.2,
      tools: [
        {
          type: 'function',
          function: {
            name: GARMENT_TOOL,
            description: 'Records the attributes of the piece on the photo.',
            parameters: GARMENT_SCHEMA,
          },
        },
      ],
      tool_choice: 'required',
      messages: [
        { role: 'system', content: GARMENT_INSTRUCTIONS },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${image.contentType};base64,${photo}` },
            },
            { type: 'text', text: photoRequest(language) },
          ],
        },
      ],
    };

    // Never log the request: it holds the key and the user's photo.
    let response: Response;
    try {
      response = await this.fetchFn(this.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown';
      this.logger.warn(`analysis failed (${reason})`);
      throw new AiUnavailableError();
    }
    if (!response.ok) {
      // 429: the free plan's rate limit.
      this.logger.warn(
        `${this.config.provider} analysis answered ${response.status}`,
      );
      throw new AiUnavailableError();
    }

    const parsed = completionResponse.safeParse(
      await response.json().catch(() => null),
    );
    const message = parsed.data?.choices[0]!.message;
    const call = message?.tool_calls?.find(
      (c) => c.function.name === GARMENT_TOOL,
    );
    // Without a tool call, some models still answer the JSON as text.
    const input = garmentAnswer.safeParse(
      parseJson(call ? call.function.arguments : message?.content),
    );
    if (!parsed.success || !input.success) {
      this.logger.warn('analysis returned an unexpected answer');
      throw new AiUnavailableError();
    }
    const { isGarment, ...attributes } = input.data;
    return {
      isGarment,
      attributes,
      usage: {
        model: parsed.data.model,
        inputTokens: parsed.data.usage.prompt_tokens,
        outputTokens: parsed.data.usage.completion_tokens,
      },
    };
  }
}
