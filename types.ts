export interface JobSearch {
  title: string;
  domain: string;
  searchQuery: string;
  platforms: string[];
}

export interface AnalyzedJob {
  title: string;
  company: string;
  atsScore: number;
  qualificationLevel: 'Under-qualified' | 'Qualified' | 'Over-qualified' | 'Unknown';
  candidacyViability: 'Yes' | 'No' | 'With adjustments';
  overallFit: string;
  resumeStrengths: string[];
  potentialGaps: string[];
  suggestedKeywords: string[];
  interviewQuestions: string[];
}