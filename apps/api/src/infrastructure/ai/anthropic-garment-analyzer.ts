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

export interface AnthropicConfig {
  /** Without a key, the analysis is simply unavailable. */
  apiKey: string | undefined;
  model: string;
  timeoutMs: number;
}

type Fetch = (url: URL, init: RequestInit) => Promise<Response>;

const MESSAGES_URL = new URL('https://api.anthropic.com/v1/messages');
const API_VERSION = '2023-06-01';
const messagesResponse = z.object({
  model: z.string(),
  content: z.array(
    z.looseObject({ type: z.string(), name: z.string().optional() }),
  ),
  usage: z.object({
    input_tokens: z.number().int(),
    output_tokens: z.number().int(),
  }),
});

/** Photo analysis with Claude (Anthropic Messages API, forced tool call). */
export class AnthropicGarmentAnalyzer implements GarmentAnalyzer {
  private readonly logger = new Logger(AnthropicGarmentAnalyzer.name);

  constructor(
    private readonly config: AnthropicConfig,
    private readonly fetchFn: Fetch = fetch,
  ) {}

  async analyze(
    image: ProcessedImage,
    language: 'fr' | 'en',
  ): Promise<GarmentAnalysis> {
    if (!this.config.apiKey) {
      throw new AiUnavailableError('ANTHROPIC_API_KEY is not set');
    }
    const body = {
      model: this.config.model,
      max_tokens: 1024,
      system: GARMENT_INSTRUCTIONS,
      tools: [
        {
          name: GARMENT_TOOL,
          description: 'Records the attributes of the piece on the photo.',
          input_schema: GARMENT_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: GARMENT_TOOL },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.contentType,
                data: Buffer.from(image.bytes).toString('base64'),
              },
            },
            {
              type: 'text',
              text: photoRequest(language),
            },
          ],
        },
      ],
    };

    // Never log the request: it holds the key and the user's photo.
    let response: Response;
    try {
      response = await this.fetchFn(MESSAGES_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': API_VERSION,
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
      this.logger.warn(`analysis answered ${response.status}`);
      throw new AiUnavailableError();
    }

    const parsed = messagesResponse.safeParse(
      await response.json().catch(() => null),
    );
    const call = parsed.data?.content.find(
      (block) => block.type === 'tool_use' && block.name === GARMENT_TOOL,
    );
    const input = garmentAnswer.safeParse(call?.input);
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
        inputTokens: parsed.data.usage.input_tokens,
        outputTokens: parsed.data.usage.output_tokens,
      },
    };
  }
}
