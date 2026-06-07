import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { ReviewEssayDto } from '../dto/review-essay.dto';
import { DetectTypeDto } from '../dto/detect-type.dto';
import { ReviewResultDto } from '../../common/dto/review-result.dto';
import { DetectionResultDto } from '../../common/dto/detection-result.dto';
import { VALID_DOCUMENT_TYPES } from '../../common/constants/document-types';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, sharedReviewSchemaProperties } from '../prompt-builder';

@Injectable()
export class AnthropicProvider implements BaseReviewer {
  async review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('Anthropic API key was not provided.');
    }

    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = buildSystemPrompt(dto.documentType || 'General Essay') + 
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

  async detectType(dto: DetectTypeDto, apiKey?: string): Promise<DetectionResultDto> {
    if (!apiKey) {
      throw new InternalServerErrorException('Anthropic API key was not provided.');
    }

    const anthropic = new Anthropic({ apiKey });

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: `You are an expert linguistic classifier. Read the provided text and determine its exact writing format.\n\nYou must execute the record_detection tool. You MUST choose your primaryGuess and alternatives ONLY from the following list:\n${VALID_DOCUMENT_TYPES.join(', ')}`,
        messages: [
          { role: 'user', content: `Text to analyze:\n\n${dto.essayText}` },
        ],
        tools: [
          {
            name: 'record_detection',
            description: 'Record the document type detection results.',
            input_schema: {
              type: 'object',
              properties: {
                primaryGuess: { type: 'string', description: 'The single most likely document type (e.g., Formal Letter, Thesis, Poem).' },
                confidenceScore: { type: 'number', description: 'Confidence score from 0 to 100.' },
                alternatives: { type: 'array', items: { type: 'string' }, description: 'The next 3 most likely formats.' }
              },
              required: ['primaryGuess', 'confidenceScore', 'alternatives'],
            },
          },
        ],
        tool_choice: {
          type: 'tool',
          name: 'record_detection',
        },
        temperature: 0.1,
      });

      const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
      if (!toolUseBlock) {
        throw new InternalServerErrorException('Anthropic did not call the record_detection tool.');
      }

      return toolUseBlock.input as DetectionResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`Anthropic detection execution failed: ${error.message}`);
    }
  }
}
