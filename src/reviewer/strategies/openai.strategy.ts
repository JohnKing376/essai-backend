import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { ReviewEssayDto } from '../dto/review-essay.dto';
import { DetectTypeDto } from '../dto/detect-type.dto';
import { ReviewResultDto } from '../../common/dto/review-result.dto';
import { DetectionResultDto } from '../../common/dto/detection-result.dto';
import OpenAI from 'openai';
import { buildSystemPrompt, sharedReviewSchemaProperties } from '../prompt-builder';
import { VALID_DOCUMENT_TYPES } from '../../common/constants/document-types';

@Injectable()
export class OpenAiProvider implements BaseReviewer {
  async review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('OpenAI API key was not provided.');
    }

    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(dto.documentType || 'General Essay');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please review the following document:\n\n${dto.essayText}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'essay_review_schema',
            strict: true,
            schema: {
              type: 'object',
              properties: sharedReviewSchemaProperties,
              required: ['overallScore', 'feedbackSummary', 'strengths', 'suggestions', 'detailedMetrics', 'revisedEssay'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new InternalServerErrorException('OpenAI returned an empty response.');
      }

      return JSON.parse(content) as ReviewResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`OpenAI review execution failed: ${error.message}`);
    }
  }

  async detectType(dto: DetectTypeDto, apiKey?: string): Promise<DetectionResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('OpenAI API key was not provided.');
    }

    const openai = new OpenAI({ apiKey });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert linguistic classifier. Read the provided text and determine its exact writing format. You MUST choose your primaryGuess and alternatives ONLY from the following list:\n${VALID_DOCUMENT_TYPES.join(', ')}`
          },
          { role: 'user', content: `Text to analyze:\n\n${dto.essayText}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'document_detection_schema',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                primaryGuess: { type: 'string', description: 'The single most likely document type (e.g., Formal Letter, Thesis, Poem).' },
                confidenceScore: { type: 'number', description: 'Confidence score from 0 to 100.' },
                alternatives: { type: 'array', items: { type: 'string' }, description: 'The next 3 most likely formats.' }
              },
              required: ['primaryGuess', 'confidenceScore', 'alternatives'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new InternalServerErrorException('OpenAI returned an empty response for detection.');
      }

      return JSON.parse(content) as DetectionResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`OpenAI detection execution failed: ${error.message}`);
    }
  }
}
