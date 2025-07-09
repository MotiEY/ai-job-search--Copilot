import React, { useState, useEffect } from 'react';
import type { JobSearch } from '../types';
import { LinkedInIcon, DocumentIcon, IndeedIcon, GlassdoorIcon } from './Icons';

interface JobSearchCardProps {
  jobSearch: JobSearch;
  onUpdateQuery: (newQuery: string) => void;
}

const PlatformIcon: React.FC<{platform: string, className?: string}> = ({ platform, className }) => {
    if (platform === 'LinkedIn') return <LinkedInIcon className={className} />;
    if (platform === 'Indeed') return <IndeedIcon className={className} />;
    if (platform === 'Glassdoor') return <GlassdoorIcon className={className} />;
    return null;
}

/**
 * Transforms a Google-style boolean query into one compatible with Indeed.
 * e.g., '("A" OR "B") AND "C"' becomes '("A" or "B") "C"'
 * @param query The complex Boolean query.
 * @returns A query string formatted for Indeed.
 */
const transformQueryForIndeed = (query: string): string => {
  return query
    .replace(/\bAND\b/g, ' ')  // Replace AND with a space (implicit)
    .replace(/\bOR\b/g, 'or'); // Replace OR with lowercase 'or'
};

// Tooltip for Glassdoor button
const GlassdoorTooltip: React.FC = () => (
  <span className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-white border border-slate-300 rounded shadow text-xs text-slate-700 whitespace-normal">
    Glassdoor search uses Google for best results (site:glassdoor.com)
  </span>
);


export const JobSearchCard: React.FC<JobSearchCardProps> = ({ jobSearch, onUpdateQuery }) => {
  const { title, domain, platforms } = jobSearch;
  const [currentQuery, setCurrentQuery] = useState(jobSearch.searchQuery);

  useEffect(() => {
    setCurrentQuery(jobSearch.searchQuery);
  }, [jobSearch.searchQuery]);

  const createSinglePlatformUrl = (platform: string) => {
    const location = "Israel";
    const locationParam = encodeURIComponent(location);
    const queryToUse = currentQuery;

    if (platform === 'LinkedIn') {
        const keywords = encodeURIComponent(queryToUse);
        return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${locationParam}`;
    }
    if (platform === 'Indeed') {
        const indeedQuery = transformQueryForIndeed(queryToUse);
        const keywords = encodeURIComponent(indeedQuery);
        return `https://il.indeed.com/jobs?q=${keywords}&l=${locationParam}`;
    }
    if (platform === 'Glassdoor') {
        const fullQuery = `${queryToUse} "${location}" site:glassdoor.com`;
        return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
    }
    // Fallback (should not happen)
    return '#';
  };

  // Only show the 3 fixed platforms
  const fixedPlatforms = ['LinkedIn', 'Indeed', 'Glassdoor'];
  const platformsToShow = platforms.filter(p => fixedPlatforms.includes(p));

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col border border-sky-200 w-full max-w-xl mx-auto mb-6">
      <div className="p-6 flex-grow">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{domain}</p>
        <div className="space-y-3 text-sm">
           <div className="flex items-start space-x-2">
            <DocumentIcon className="h-4 w-4 text-slate-400 mt-2 flex-shrink-0" />
            <textarea
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                onBlur={() => onUpdateQuery(currentQuery)}
                className="w-full font-mono text-xs bg-slate-100 p-2 rounded border border-transparent focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition resize-none"
                rows={4}
                aria-label="Editable search query"
            />
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200/80">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {platformsToShow.map(platform => {
            const isGlassdoor = platform === 'Glassdoor';
            const [showTooltip, setShowTooltip] = React.useState(false);
            // Assign color classes based on platform
            let buttonClasses = "w-full flex items-center justify-center px-4 py-2 border text-sm font-semibold rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ";
            let iconColor = "";
            if (platform === 'LinkedIn') {
              buttonClasses += " border-blue-500 text-blue-700 hover:bg-blue-50 focus:ring-blue-400";
              iconColor = "text-blue-500";
            } else if (platform === 'Indeed') {
              buttonClasses += " border-orange-400 text-orange-600 hover:bg-orange-50 focus:ring-orange-300";
              iconColor = "text-orange-400";
            } else if (platform === 'Glassdoor') {
              buttonClasses += " border-green-500 text-green-700 hover:bg-green-50 focus:ring-green-400";
              iconColor = "text-green-500";
            } else {
              buttonClasses += " border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-sky-500";
              iconColor = "text-slate-500";
            }
            return (
              <span key={platform} className="relative">
                <a
                  href={createSinglePlatformUrl(platform)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses}
                  onMouseEnter={() => isGlassdoor && setShowTooltip(true)}
                  onMouseLeave={() => isGlassdoor && setShowTooltip(false)}
                  onFocus={() => isGlassdoor && setShowTooltip(true)}
                  onBlur={() => isGlassdoor && setShowTooltip(false)}
                >
                  <PlatformIcon platform={platform} className={`h-5 w-5 mr-2 ${iconColor}`} />
                  <span>Search on {platform}</span>
                </a>
                {isGlassdoor && showTooltip && <GlassdoorTooltip />}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};