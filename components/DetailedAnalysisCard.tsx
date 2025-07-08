import React from 'react';
import type { AnalyzedJob } from '../types';
import { TargetIcon, SparklesIcon, AlertTriangleIcon, KeyIcon, HelpCircleIcon } from './Icons';

interface DetailedAnalysisCardProps {
  job: AnalyzedJob;
}

const AtsScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-sky-100 text-sky-800 border-sky-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <div className={`text-sm font-bold px-3 py-1.5 rounded-full border ${getScoreColor()}`}>
      ATS Score: {score}/100
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
  <div className={`border-t border-slate-200 pt-5 mt-5 ${className}`}>
    <div className="flex items-center mb-3">
      {icon}
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
    </div>
    <div className="prose prose-sm prose-slate max-w-none text-slate-600">
      {children}
    </div>
  </div>
);

export const DetailedAnalysisCard: React.FC<DetailedAnalysisCardProps> = ({ job }) => {
  const getQualificationColor = (level: AnalyzedJob['qualificationLevel']) => {
    switch(level) {
      case 'Qualified': return 'text-green-700 bg-green-50';
      case 'Over-qualified': return 'text-sky-700 bg-sky-50';
      case 'Under-qualified': return 'text-amber-700 bg-amber-50';
      default: return 'text-slate-700 bg-slate-50';
    }
  };

  const getViabilityColor = (viability: AnalyzedJob['candidacyViability']) => {
     switch(viability) {
      case 'Yes': return 'text-green-700 bg-green-50';
      case 'With adjustments': return 'text-sky-700 bg-sky-50';
      case 'No': return 'text-red-700 bg-red-50';
      default: return 'text-slate-700 bg-slate-50';
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-4">
        <div className="flex-grow">
          <h2 className="text-2xl font-bold text-slate-900">{job.title || 'Unknown Title'}</h2>
          <p className="text-md text-slate-500">{job.company || 'Unknown Company'}</p>
        </div>
        <div className="flex-shrink-0">
         {job.atsScore > 0 && <AtsScoreBadge score={job.atsScore} />}
        </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-center">
        <div className={`p-3 rounded-lg ${getQualificationColor(job.qualificationLevel)}`}>
          <p className="text-xs font-bold uppercase tracking-wider">Qualification</p>
          <p className="font-semibold">{job.qualificationLevel}</p>
        </div>
        <div className={`p-3 rounded-lg ${getViabilityColor(job.candidacyViability)}`}>
          <p className="text-xs font-bold uppercase tracking-wider">Candidacy Viability</p>
          <p className="font-semibold">{job.candidacyViability}</p>
        </div>
      </div>


      <Section 
        icon={<TargetIcon className="h-6 w-6 mr-3 text-sky-500" />} 
        title="Overall Fit Assessment"
      >
        <p>{job.overallFit}</p>
      </Section>

      <Section 
        icon={<SparklesIcon className="h-6 w-6 mr-3 text-green-500" />} 
        title="Your Core Strengths"
      >
        <ul className="list-disc pl-5 space-y-1">
          {job.resumeStrengths?.map((strength, i) => <li key={i}>{strength}</li>)}
        </ul>
      </Section>

      <Section 
        icon={<AlertTriangleIcon className="h-6 w-6 mr-3 text-amber-500" />} 
        title="Critical Gaps"
      >
        <ul className="list-disc pl-5 space-y-1">
          {job.potentialGaps?.map((gap, i) => <li key={i}>{gap}</li>)}
        </ul>
      </Section>
      
      <Section 
        icon={<KeyIcon className="h-6 w-6 mr-3 text-violet-500" />} 
        title="Keywords to Emphasize"
      >
        <div className="flex flex-wrap gap-2">
          {job.suggestedKeywords?.map((keyword, i) => (
            <span key={i} className="bg-violet-100 text-violet-800 text-xs font-medium px-2.5 py-1 rounded-full">{keyword}</span>
          ))}
        </div>
      </Section>

      <Section 
        icon={<HelpCircleIcon className="h-6 w-6 mr-3 text-slate-500" />} 
        title="Potential Interview Questions"
      >
        <ol className="list-decimal pl-5 space-y-2">
           {job.interviewQuestions?.map((question, i) => <li key={i}>{question}</li>)}
        </ol>
      </Section>
    </div>
  );
};