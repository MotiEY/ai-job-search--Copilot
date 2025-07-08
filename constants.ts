
import type { JobSearch } from './types';

export const JOB_SEARCH_CONFIGS: JobSearch[] = [
  {
    title: "VP Customer Success",
    domain: "Customer Success",
    searchQuery: '("VP" OR "AVP" OR "Director") AND ("Customer Success" OR "Post-Sales")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
  {
    title: "AI Enablement Director",
    domain: "AI Enablement",
    searchQuery: '("AI Enablement" OR "AI Transformation") AND ("Director" OR "VP")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
  {
    title: "Chief of Staff",
    domain: "Strategy",
    searchQuery: '("Chief of Staff") AND (CCO OR COO OR CEO)',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
  {
    title: "Business Operations Leader",
    domain: "Global Programs",
    searchQuery: '("Transformation Lead" OR "Business Operations") AND ("Global Program")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
  {
    title: "Customer Program Manager",
    domain: "Program/Operations",
    searchQuery: '("Senior Program Manager") AND ("Customer Success" OR "Delivery")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
   {
    title: "Product Marketing Lead",
    domain: "Marketing",
    searchQuery: '("Product Marketing Lead" OR "Head of Product Marketing")',
    platforms: ["LinkedIn", "Indeed", "Glassdoor"]
  },
];
