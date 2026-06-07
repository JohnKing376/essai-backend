import { IsString, IsNotEmpty, MaxLength, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TargetModel } from './review-essay.dto';

export class DetectTypeDto {
  @ApiProperty({
    description: 'The raw text of the document to classify (min 50 characters, max 10,000 characters).',
    example: 'To whom it may concern...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Document must be at least 50 characters long for accurate detection.' })
  @MaxLength(10000, { message: 'Document text exceeds the 10,000 character limit.' })
  essayText: string;

  @ApiProperty({
    description: 'The AI model selected to perform the detection.',
    enum: TargetModel,
    example: TargetModel.GEMINI,
  })
  @IsEnum(TargetModel, { message: 'targetModel must be either gemini, openai, or anthropic.' })
  targetModel: TargetModel;
}
