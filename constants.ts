
import type { JobSearch } from './types';

export const JOB_SEARCH_CONFIGS: JobSearch[] = [
  {
    title: "Job Search",
    domain: "All Domains",
    searchQuery: '"VP" OR "AVP" OR "Director" AND ("Customer Success" OR "Delivery")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  }
];
