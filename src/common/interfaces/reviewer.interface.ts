import { ReviewEssayDto } from '../../reviewer/dto/review-essay.dto';
import { DetectTypeDto } from '../../reviewer/dto/detect-type.dto';
import { ReviewResultDto } from '../dto/review-result.dto';
import { DetectionResultDto } from '../dto/detection-result.dto';

export interface BaseReviewer {
  review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto>;
  detectType(dto: DetectTypeDto, apiKey?: string): Promise<DetectionResultDto>;
}
