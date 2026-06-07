import { Injectable } from '@nestjs/common';
import { StrategyFactory } from './strategies/strategy.factory';
import { ReviewEssayDto } from './dto/review-essay.dto';
import { DetectTypeDto } from './dto/detect-type.dto';
import { ReviewResultDto } from '../common/dto/review-result.dto';
import { DetectionResultDto } from '../common/dto/detection-result.dto';

@Injectable()
export class ReviewerService {
  constructor(private readonly strategyFactory: StrategyFactory) {}

  async executeReview(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto> {
    const strategy = this.strategyFactory.getStrategy(dto.targetModel);
    return strategy.review(dto, apiKey);
  }

  async detectDocumentType(dto: DetectTypeDto, apiKey?: string): Promise<DetectionResultDto> {
    const strategy = this.strategyFactory.getStrategy(dto.targetModel);
    return strategy.detectType(dto, apiKey);
  }
}
