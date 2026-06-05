import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { ReviewEssayDto, DocumentType } from '../dto/review-essay.dto';
import { ReviewResultDto } from '../../common/dto/review-result.dto';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, sharedReviewSchemaProperties } from '../prompt-builder';

@Injectable()
export class AnthropicProvider implements BaseReviewer {
  async review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('Anthropic API key was not provided.');
    }

    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = buildSystemPrompt(dto.documentType || DocumentType.GENERAL_ESSAY) + 
      '\n\nYou must execute the record_essay_review tool and provide your review fields directly as the tool arguments.';

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Please review the following document:\n\n${dto.essayText}` },
        ],
        tools: [
          {
            name: 'record_essay_review',
            description: 'Record the structured review metrics and suggestions for the document.',
            input_schema: {
              type: 'object',
              properties: sharedReviewSchemaProperties as any,
              required: ['overallScore', 'feedbackSummary', 'strengths', 'suggestions', 'detailedMetrics', 'revisedEssay'],
            },
          },
        ],
        tool_choice: {
          type: 'tool',
          name: 'record_essay_review',
        },
        temperature: 0.2,
      });

      const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
      if (!toolUseBlock) {
        throw new InternalServerErrorException('Anthropic did not call the record_essay_review tool.');
      }

      return toolUseBlock.input as ReviewResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`Anthropic review execution failed: ${error.message}`);
    }
  }
}
