export class SectionEvaluationDto {
  sectionName: string;
  score: number;
  currentAssessment: string;
  actionableSuggestions: string[];
}

export class ReviewResultDto {
  overallScore: number;
  feedbackSummary: string;
  strengths: string[];
  suggestions: string[];
  sectionEvaluations: SectionEvaluationDto[];
  revisedEssay: string;
}
