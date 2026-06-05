import { Controller, Post, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { ReviewEssayDto, TargetModel } from './dto/review-essay.dto';
import { ReviewerService } from './reviewer.service';
import { ReviewResultDto } from '../common/dto/review-result.dto';
import { FingerprintThrottlerGuard } from '../common/guards/fingerprint-throttler.guard';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class ReviewerController {
  constructor(private readonly reviewerService: ReviewerService) { }

  @Post('review')
  @UseGuards(FingerprintThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async reviewEssay(
    @Body() reviewEssayDto: ReviewEssayDto,
    @Headers('x-gemini-key') clientGeminiKey?: string,
    @Headers('x-openai-key') clientOpenaiKey?: string,
    @Headers('x-anthropic-key') clientAnthropicKey?: string,
  ): Promise<ReviewResultDto> {
    let apiKey: string | undefined;

    switch (reviewEssayDto.targetModel) {
      case TargetModel.GEMINI:
        apiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new BadRequestException(
            'Gemini API key is not configured on the server. Please provide your own key in the x-gemini-key header.',
          );
        }
        break;
      case TargetModel.OPENAI:
        apiKey = clientOpenaiKey;
        if (!apiKey) {
          throw new BadRequestException('OpenAI requires a custom API key passed in the x-openai-key header.');
        }
        break;
      case TargetModel.ANTHROPIC:
        apiKey = clientAnthropicKey;
        if (!apiKey) {
          throw new BadRequestException('Anthropic requires a custom API key passed in the x-anthropic-key header.');
        }
        break;
      default:
        throw new BadRequestException('Invalid targetModel requested.');
    }

    return this.reviewerService.executeReview(reviewEssayDto, apiKey);
  }
}
