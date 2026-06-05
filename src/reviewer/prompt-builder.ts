import { DocumentType } from './dto/review-essay.dto';

export function buildSystemPrompt(documentType: DocumentType): string {
  let contextRules = '';

  switch (documentType) {
    case DocumentType.FORMAL_LETTER:
      contextRules = `
You are evaluating a Formal Letter.
REQUIRED SECTIONS TO EVALUATE:
1. "Heading & Salutation": Check for sender/recipient addresses and a formal salutation.
2. "Letter Body": Check for conciseness, clarity, and directness of the primary message.
3. "Sign-off & Professional Tone": Check for a proper formal sign-off and overall professional vocabulary.
If any standard components are missing, you MUST explicitly flag this as a critical actionable suggestion in that section.`;
      break;
    case DocumentType.THESIS:
      contextRules = `
You are evaluating a Thesis or Academic Chapter.
REQUIRED SECTIONS TO EVALUATE:
1. "Abstract / Introduction": Evaluate the core research question and hook.
2. "Literature & Methodology": Assess the use of citations, objectivity, and methodological clarity.
3. "Results & Analysis": Evaluate analytical depth and logical flow.
4. "Conclusion & Academic Tone": Analyze passive voice usage, scholarly vocabulary, and conclusion strength.`;
      break;
    case DocumentType.BLOG_POST:
      contextRules = `
You are evaluating a Creative Writing or Blog Post.
REQUIRED SECTIONS TO EVALUATE:
1. "Title & Hook": Focus heavily on reader engagement and the opening hook.
2. "Body Paragraphs (Scannability)": Evaluate paragraph length (shorter is better) and conversational tone.
3. "Conclusion & Call to Action": Provide actionable advice on making the conclusion more engaging and actionable.`;
      break;
    case DocumentType.GENERAL_ESSAY:
    default:
      contextRules = `
You are evaluating a General Academic Essay.
REQUIRED SECTIONS TO EVALUATE:
1. "Introduction & Thesis": Check for a clear, strong thesis statement upfront.
2. "Body Paragraphs & Evidence": Check for logical flow, topic sentences, and supporting evidence.
3. "Conclusion": Check for a strong summary without introducing new arguments.
4. "Grammar & Mechanics": Evaluate punctuation, spelling, and sentence structure.`;
      break;
  }

  return `You are a professional writing assistant and expert document reviewer. 
Your task is to analyze the provided text and output a detailed, structured review using the provided JSON schema.
Be encouraging yet highly rigorous. Pay close attention to grammar, style, clarity, structure, and argument strength.
All scores must be calculated on a 1.0 to 10.0 decimal scale (e.g. 8.5).

${contextRules}

OUTPUT STRUCTURE REQUIREMENTS:
Instead of generic categories, you must provide a 'sectionEvaluations' array.
For EACH of the REQUIRED SECTIONS listed above, create one entry in 'sectionEvaluations' containing:
1. 'sectionName': The exact name of the section from the required list.
2. 'score': A number from 1.0 to 10.0 evaluating that specific section.
3. 'currentAssessment': A detailed evaluation (1-2 sentences) of what the writer is doing right or wrong in this section.
4. 'actionableSuggestions': A list of specific, actionable things the user can do to improve this specific section.`;
}

export const sharedReviewSchemaProperties = {
  overallScore: { type: 'number', description: 'Overall quality score from 1.0 to 10.0.' },
  feedbackSummary: { type: 'string', description: 'Comprehensive feedback summary text.' },
  strengths: { type: 'array', items: { type: 'string' }, description: '3 bullet points of writing strengths.' },
  suggestions: { type: 'array', items: { type: 'string' }, description: '3 actionable bullet points of overarching recommendations.' },
  sectionEvaluations: {
    type: 'array',
    description: 'An array of evaluations for the specific structural sections requested in the prompt.',
    items: {
      type: 'object',
      properties: {
        sectionName: { type: 'string', description: 'The name of the section being evaluated.' },
        score: { type: 'number', description: 'Score for this section from 1.0 to 10.0.' },
        currentAssessment: { type: 'string', description: 'A detailed evaluation of what they are doing right or wrong in this section.' },
        actionableSuggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific, actionable suggestions to improve this section.',
        },
      },
      required: ['sectionName', 'score', 'currentAssessment', 'actionableSuggestions'],
      additionalProperties: false,
    },
  },
  revisedEssay: { type: 'string', description: 'Fully polished, rewritten copy of the text.' },
};
