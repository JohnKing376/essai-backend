import { ApiProperty } from '@nestjs/swagger';

export class DetectionResultDto {
  @ApiProperty({ description: 'The single most likely document type.' })
  primaryGuess: string;

  @ApiProperty({ description: 'Confidence score from 0 to 100.' })
  confidenceScore: number;

  @ApiProperty({ description: 'The next 3 most likely formats.' })
  alternatives: string[];
}
