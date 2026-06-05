import { ReviewEssayDto } from '../../reviewer/dto/review-essay.dto';
import { ReviewResultDto } from '../dto/review-result.dto';

export interface BaseReviewer {
  review(dto: ReviewEssayDto, apiKey?: string): Promise<ReviewResultDto>;
}
