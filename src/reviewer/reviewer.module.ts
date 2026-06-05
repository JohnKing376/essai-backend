import { Module } from '@nestjs/common';
import { ReviewerController } from './reviewer.controller';
import { ReviewerService } from './reviewer.service';
import { StrategyFactory } from './strategies/strategy.factory';
import { GeminiProvider } from './strategies/gemini.strategy';
import { OpenAiProvider } from './strategies/openai.strategy';
import { AnthropicProvider } from './strategies/anthropic.strategy';

@Module({
  controllers: [ReviewerController],
  providers: [
    ReviewerService,
    StrategyFactory,
    GeminiProvider,
    OpenAiProvider,
    AnthropicProvider,
  ],
  exports: [ReviewerService],
})
export class ReviewerModule {}
