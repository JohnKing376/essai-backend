import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { ReviewEssayDto, DocumentType } from '../dto/review-essay.dto';
import { ReviewResultDto } from '../../common/dto/review-result.dto';
import OpenAI from 'openai';
import { buildSystemPrompt, sharedReviewSchemaProperties } from '../prompt-builder';

@Injectable()
export class OpenAiProvider implements BaseReviewer {
  async review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('OpenAI API key was not provided.');
    }

    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(dto.documentType || DocumentType.GENERAL_ESSAY);

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
}
