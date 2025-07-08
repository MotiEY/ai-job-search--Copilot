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
        // LinkedIn's search engine understands the original advanced query syntax perfectly.
        const keywords = encodeURIComponent(queryToUse);
        return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${locationParam}`;
    }
    
    if (platform === 'Indeed') {
        // Indeed uses a slightly different syntax (lowercase 'or', implicit 'and').
        const indeedQuery = transformQueryForIndeed(queryToUse);
        const keywords = encodeURIComponent(indeedQuery);
        return `https://il.indeed.com/jobs?q=${keywords}&l=${locationParam}`;
    }
    
    // For Google-based searches (Glassdoor), use the original powerful query.
    if (platform === 'Glassdoor') {
        const fullQuery = `${queryToUse} "${location}" site:glassdoor.com`;
        return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
    }
    
    // Fallback to a generic Google search if platform is unrecognized
    const fullQuery = `${queryToUse} "${location}"`;
    return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col border border-slate-200/80">
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
        <div className="flex flex-col space-y-2">
          {platforms.map(platform => (
            <a
              key={platform}
              href={createSinglePlatformUrl(platform)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-semibold rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
            >
                <PlatformIcon platform={platform} className="h-5 w-5 mr-2 text-slate-500" />
                <span>Search on {platform}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};