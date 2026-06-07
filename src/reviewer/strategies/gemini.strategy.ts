import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { ReviewEssayDto } from '../dto/review-essay.dto';
import { ReviewResultDto } from '../../common/dto/review-result.dto';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt } from '../prompt-builder';
import { DetectTypeDto } from '../dto/detect-type.dto';
import { DetectionResultDto } from '../../common/dto/detection-result.dto';
import { VALID_DOCUMENT_TYPES } from '../../common/constants/document-types';

@Injectable()
export class GeminiProvider implements BaseReviewer {
  async review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new InternalServerErrorException('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const systemPrompt = buildSystemPrompt(dto.documentType || 'General Essay');

    const reviewSchema = {
      type: 'OBJECT',
      properties: {
        overallScore: { type: 'NUMBER', description: 'Academic score reflecting grammar, clarity, argumentation, and style, from 1.0 to 10.0.' },
        feedbackSummary: { type: 'STRING', description: 'A comprehensive, encouraging yet highly constructive high-level feedback summary (3-4 sentences).' },
        strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: '3 bullet points of notable strengths of the writing.' },
        suggestions: { type: 'ARRAY', items: { type: 'STRING' }, description: '3 actionable key suggestions for improvement.' },
        sectionEvaluations: {
          type: 'ARRAY',
          description: 'An array of evaluations for the specific structural sections requested in the prompt.',
          items: {
            type: 'OBJECT',
            properties: {
              sectionName: { type: 'STRING', description: 'The name of the section being evaluated.' },
              score: { type: 'NUMBER', description: 'Score for this section from 1.0 to 10.0.' },
              currentAssessment: { type: 'STRING', description: 'A detailed evaluation of what they are doing right or wrong in this section.' },
              actionableSuggestions: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Specific, actionable suggestions to improve this section.',
              },
            },
            required: ['sectionName', 'score', 'currentAssessment', 'actionableSuggestions'],
          },
        },
        revisedEssay: { type: 'STRING', description: 'A polished, clean copy of the entire essay text implementing all suggested style and grammar edits smoothly.' },
      },
      required: ['overallScore', 'feedbackSummary', 'strengths', 'suggestions', 'sectionEvaluations', 'revisedEssay'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please review the following document:\n\n${dto.essayText}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: reviewSchema as any,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) {
        throw new InternalServerErrorException('Gemini returned an empty response.');
      }

      return JSON.parse(text) as ReviewResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`Gemini review execution failed: ${error.message}`);
    }
  }

  async detectType(dto: DetectTypeDto, apiKey?: string): Promise<DetectionResultDto> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new InternalServerErrorException('Gemini API key is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const detectSchema = {
      type: 'OBJECT',
      properties: {
        primaryGuess: { type: 'STRING', description: 'The single most likely document type (e.g., Formal Letter, Thesis, Poem).' },
        confidenceScore: { type: 'NUMBER', description: 'Confidence score from 0 to 100.' },
        alternatives: { type: 'ARRAY', items: { type: 'STRING' }, description: 'The next 3 most likely formats.' }
      },
      required: ['primaryGuess', 'confidenceScore', 'alternatives'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert linguistic classifier. Read the provided text and determine its exact writing format. You MUST choose your primaryGuess and alternatives ONLY from the following list:\n${VALID_DOCUMENT_TYPES.join(', ')}\n\nText to analyze:\n${dto.essayText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: detectSchema as any,
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (!text) {
        throw new InternalServerErrorException('Gemini returned an empty response for detection.');
      }

      return JSON.parse(text) as DetectionResultDto;
    } catch (error) {
      throw new InternalServerErrorException(`Gemini detection execution failed: ${error.message}`);
    }
  }
}
