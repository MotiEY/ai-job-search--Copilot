
import React from 'react';
import type { AnalyzedJob } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon } from './Icons';

interface JobResultCardProps {
  job: AnalyzedJob;
  isRecommended: boolean;
}

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (score >= 4) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColor()}`}>
      Match Score: {Math.round(score)}/10
    </div>
  );
};

export const JobResultCard: React.FC<JobResultCardProps> = ({ job, isRecommended }) => {
  const borderColor = isRecommended ? 'border-green-200' : 'border-amber-200';
  const iconColor = isRecommended ? 'text-green-500' : 'text-amber-500';
  const iconBgColor = isRecommended ? 'bg-green-100' : 'bg-amber-100';
  const Icon = isRecommended ? ThumbsUpIcon : ThumbsDownIcon;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${borderColor} p-5`}>
      <div className="flex justify-between items-start mb-3">
        <div className="pr-4">
          <h4 className="font-bold text-slate-800">{job.title}</h4>
          <p className="text-sm text-slate-500">{job.company}</p>
        </div>
        <ScoreBadge score={job.atsScore / 10} />
      </div>
      <div className="flex items-start space-x-3 text-sm">
        <div className={`flex-shrink-0 rounded-full h-7 w-7 flex items-center justify-center ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <p className="text-slate-600">{job.overallFit}</p>
      </div>
    </div>
  );
};
