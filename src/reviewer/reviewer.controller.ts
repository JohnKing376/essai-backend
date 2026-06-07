import { Controller, Post, Body, Headers, BadRequestException, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReviewEssayDto, TargetModel } from './dto/review-essay.dto';
import { DetectTypeDto } from './dto/detect-type.dto';
import { ReviewerService } from './reviewer.service';
import { DocumentParserService } from './document-parser.service';
import { ReviewResultDto } from '../common/dto/review-result.dto';
import { DetectionResultDto } from '../common/dto/detection-result.dto';
import { FingerprintThrottlerGuard } from '../common/guards/fingerprint-throttler.guard';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class ReviewerController {
  constructor(
    private readonly reviewerService: ReviewerService,
    private readonly documentParser: DocumentParserService,
  ) { }

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

  @Post('detect-type')
  @UseGuards(FingerprintThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async detectDocumentType(
    @Body() detectTypeDto: DetectTypeDto,
    @Headers('x-gemini-key') clientGeminiKey?: string,
    @Headers('x-openai-key') clientOpenaiKey?: string,
    @Headers('x-anthropic-key') clientAnthropicKey?: string,
  ): Promise<DetectionResultDto> {
    let apiKey: string | undefined;

    switch (detectTypeDto.targetModel) {
      case TargetModel.GEMINI:
        apiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new BadRequestException('Gemini API key is not configured.');
        break;
      case TargetModel.OPENAI:
        apiKey = clientOpenaiKey;
        if (!apiKey) throw new BadRequestException('OpenAI requires a custom API key.');
        break;
      case TargetModel.ANTHROPIC:
        apiKey = clientAnthropicKey;
        if (!apiKey) throw new BadRequestException('Anthropic requires a custom API key.');
        break;
      default:
        throw new BadRequestException('Invalid targetModel requested.');
    }

    return this.reviewerService.detectDocumentType(detectTypeDto, apiKey);
  }

  @Post('upload')
  @UseGuards(FingerprintThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<{ extractedText: string }> {
    const text = await this.documentParser.extractText(file);
    return { extractedText: text };
  }
}
