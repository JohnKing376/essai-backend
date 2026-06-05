import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseReviewer } from '../../common/interfaces/reviewer.interface';
import { TargetModel } from '../dto/review-essay.dto';
import { GeminiProvider } from './gemini.strategy';
import { OpenAiProvider } from './openai.strategy';
import { AnthropicProvider } from './anthropic.strategy';

@Injectable()
export class StrategyFactory {
  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
  ) {}

  getStrategy(model: TargetModel): BaseReviewer {
    switch (model) {
      case TargetModel.GEMINI:
        return this.geminiProvider;
      case TargetModel.OPENAI:
        return this.openAiProvider;
      case TargetModel.ANTHROPIC:
        return this.anthropicProvider;
      default:
        throw new BadRequestException(`Provider strategy for model "${model}" is not implemented.`);
    }
  }
}
