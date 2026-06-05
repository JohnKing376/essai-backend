import { IsString, IsNotEmpty, MaxLength, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetModel {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export enum DocumentType {
  GENERAL_ESSAY = 'general_essay',
  FORMAL_LETTER = 'formal_letter',
  THESIS = 'thesis',
  BLOG_POST = 'blog_post',
}

export class ReviewEssayDto {
  @ApiProperty({
    description: 'The raw text of the academic essay (min 100 characters, max 10,000 characters).',
    example: 'Adaptive learning systems are increasingly integrated into elementary and secondary curriculum structures...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'Essay must be at least 100 characters long.' })
  @MaxLength(10000, { message: 'Essay text exceeds the 10,000 character limit.' })
  essayText: string;

  @ApiProperty({
    description: 'The AI model selected to perform the academic review.',
    enum: TargetModel,
    example: TargetModel.GEMINI,
  })
  @IsEnum(TargetModel, { message: 'targetModel must be either gemini, openai, or anthropic.' })
  targetModel: TargetModel;

  @ApiPropertyOptional({
    description: 'The document type/context to grade and review against.',
    enum: DocumentType,
    default: DocumentType.GENERAL_ESSAY,
    example: DocumentType.THESIS,
  })
  @IsEnum(DocumentType, { message: 'documentType must be general_essay, formal_letter, thesis, or blog_post.' })
  @IsOptional()
  documentType?: DocumentType = DocumentType.GENERAL_ESSAY;
}
