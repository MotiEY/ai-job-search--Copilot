import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ResumeUploader } from './components/ResumeUploader';
import { JobSearchCard } from './components/JobSearchCard';
import { Spinner } from './components/Spinner';
import { DetailedAnalysisCard } from './components/DetailedAnalysisCard';
import { TailoredResumeDisplay } from './components/TailoredResumeDisplay';
import { analyzePastedJobs, generateTailoredResume } from './services/geminiService';
import type { AnalyzedJob, JobSearch } from './types';
import { JOB_SEARCH_CONFIGS } from './constants';
import { ErrorIcon, LightbulbIcon, ClipboardPasteIcon, WandIcon } from './components/Icons';
import { GoogleGenAI } from '@google/genai';

interface FavoriteSearch {
  name: string;
  query: string;
}

const RECENT_SEARCHES_KEY = 'recentJobSearchQueries';
const MAX_RECENT = 5;
const GUIDE_KEY = 'seenGuide';
const FAVORITES_KEY = 'favoriteJobSearches';

// Tooltip component
const TipWithTooltip: React.FC<{ tip: React.ReactNode; tooltip: string }> = ({ tip, tooltip }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative group inline-flex items-center mr-2">
      <span>{tip}</span>
      <button
        type="button"
        className="ml-1 text-sky-500 hover:text-sky-700 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        aria-label="More info"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /><text x="10" y="15" textAnchor="middle" fontSize="12" fill="#fff">i</text></svg>
      </button>
      {show && (
        <span className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-white border border-slate-300 rounded shadow text-xs text-slate-700 whitespace-normal">
          {tooltip}
        </span>
      )}
    </span>
  );
};

const OnboardingGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold focus:outline-none"
        aria-label="Close guide"
      >
        ×
      </button>
      <h2 className="text-2xl font-bold text-sky-700 mb-2">Welcome to Bruno the Headhunter!</h2>
      <ol className="list-decimal pl-5 space-y-2 text-slate-700 text-sm mb-4">
        <li><b>Enter your Gemini API key</b> in the top right field. This key is stored only in your browser and never shared.</li>
        <li><b>Upload your resume</b> (DOCX or TXT) to get started.</li>
        <li><b>Search for jobs</b> using Boolean queries. Use the example chips or write your own. Click a platform to search.</li>
        <li><b>Analyze jobs</b> by pasting a job description and clicking Analyze. Get AI-powered fit analysis and tailored resume suggestions.</li>
      </ol>
      <p className="text-xs text-slate-500 mb-4">You can always view this guide again by clicking the <b>i</b> in the top bar.</p>
      <button
        onClick={onClose}
        className="w-full py-2 bg-sky-600 text-white rounded font-semibold hover:bg-sky-700 transition"
      >
        Got it!
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [pastedJobsText, setPastedJobsText] = useState<string>('');
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedJob | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [isGeneratingResume, setIsGeneratingResume] = useState<boolean>(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [resumeGenerationError, setResumeGenerationError] = useState<string | null>(null);
  
  const [jobSearches, setJobSearches] = useState<JobSearch[]>(JOB_SEARCH_CONFIGS);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [favoriteSearches, setFavoriteSearches] = useState<FavoriteSearch[]>([]);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [pendingFavoriteQuery, setPendingFavoriteQuery] = useState('');

  useEffect(() => {
    try {
      const savedText = localStorage.getItem('resumeText');
      const savedFileName = localStorage.getItem('resumeFileName');
      if (savedText && savedFileName) {
        setResumeText(savedText);
        setResumeFileName(savedFileName);
      }
    } catch (error) {
      console.error("Failed to read resume from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Show onboarding guide for first-time users
    if (!localStorage.getItem(GUIDE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  useEffect(() => {
    // Load favorites from localStorage
    const favs = localStorage.getItem(FAVORITES_KEY);
    if (favs) setFavoriteSearches(JSON.parse(favs));
  }, []);

  const saveRecentSearch = (query: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  
  const handleUpdateSearchQuery = (index: number, newQuery: string) => {
    const updatedSearches = [...jobSearches];
    updatedSearches[index] = { ...updatedSearches[index], searchQuery: newQuery };
    setJobSearches(updatedSearches);
    saveRecentSearch(newQuery);
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setTailoredResume(null);
    setResumeGenerationError(null);
  };

  const handleResumeUpload = async (text: string, fileName: string) => {
    setResumeText(text);
    setResumeFileName(fileName);
    clearResults();
    try {
      localStorage.setItem('resumeText', text);
      localStorage.setItem('resumeFileName', fileName);
    } catch (error) {
      console.error("Failed to save resume to localStorage:", error);
      setAnalysisError("Could not save resume to browser storage. It will be lost on refresh.");
    }
  };

  const handleRemoveResume = () => {
    setResumeText(null);
    setResumeFileName(null);
    setPastedJobsText('');
    clearResults();
    try {
      localStorage.removeItem('resumeText');
      localStorage.removeItem('resumeFileName');
    } catch (error) {
      console.error("Failed to remove resume from localStorage:", error);
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!resumeText) {
      setAnalysisError("Please upload your resume first.");
      return;
    }
    if (!pastedJobsText.trim()) {
      setAnalysisError("Please paste at least one job description to analyze.");
      return;
    }
    
    setIsAnalyzing(true);
    clearResults();

    try {
      const result = await analyzePastedJobs(resumeText, pastedJobsText);
      setAnalysisResult(result);
      if (!result || !result.title || !result.overallFit) {
        setAnalysisError("The AI could not identify a valid job in the text you pasted. Please try pasting a single, complete job description.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during analysis.";
      setAnalysisError(`Failed to get analysis. ${errorMessage}. Please ensure your API key is configured correctly and try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeText, pastedJobsText]);

  const handleGenerateResumeClick = useCallback(async () => {
    if (!resumeText || !pastedJobsText) {
      setResumeGenerationError("Missing resume or job description to generate a tailored version.");
      return;
    }
    
    setIsGeneratingResume(true);
    setTailoredResume(null);
    setResumeGenerationError(null);

    try {
      const result = await generateTailoredResume(resumeText, pastedJobsText);
      setTailoredResume(result);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during resume generation.";
      setResumeGenerationError(`Failed to generate resume. ${errorMessage}. Please try again.`);
    } finally {
      setIsGeneratingResume(false);
    }
  }, [resumeText, pastedJobsText]);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem(GUIDE_KEY, 'true');
  };

  const saveFavorite = (name: string, query: string) => {
    setFavoriteSearches(prev => {
      const filtered = prev.filter(fav => fav.query !== query && fav.name !== name);
      const updated = [{ name, query }, ...filtered].slice(0, 8);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = (query: string) => {
    setFavoriteSearches(prev => {
      const updated = prev.filter(fav => fav.query !== query);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
      <Header onShowGuide={() => setShowGuide(true)} />
      {showGuide && <OnboardingGuide onClose={handleCloseGuide} />}
      {showFavoriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full relative animate-fade-in">
            <button
              onClick={() => setShowFavoriteModal(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-sky-700 mb-2">Save Favorite Search</h3>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-2 py-1 mb-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Favorite name (e.g. Dream CTO)"
              value={favoriteName}
              onChange={e => setFavoriteName(e.target.value)}
              autoFocus
            />
            <button
              className="w-full py-2 bg-sky-600 text-white rounded font-semibold hover:bg-sky-700 transition"
              onClick={() => {
                if (favoriteName.trim()) {
                  saveFavorite(favoriteName.trim(), pendingFavoriteQuery);
                  setShowFavoriteModal(false);
                  setFavoriteName('');
                  setPendingFavoriteQuery('');
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Step 1: Resume Upload */}
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-1 flex items-center">
              <span className="bg-sky-500 text-white rounded-full h-8 w-8 text-sm font-bold flex items-center justify-center mr-3">1</span>
              Upload Your Resume
            </h2>
            <p className="text-slate-500 mb-4 ml-11">Your resume is saved in your browser for next time.</p>
            <ResumeUploader onResumeUpload={handleResumeUpload} fileName={resumeFileName} onRemoveResume={handleRemoveResume} />
          </div>

          {/* Step 2: Find Jobs */}
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
              <span className="bg-sky-500 text-white rounded-full h-8 w-8 text-sm font-bold flex items-center justify-center mr-3">2</span>
              Find Jobs
            </h2>
             <p className="text-slate-500 mb-4 ml-11">Use the search below to find jobs on LinkedIn, Indeed, or Glassdoor. Edit the query as needed, or click an example to get started.</p>
            <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
              {/* Only show the first card */}
              {jobSearches.slice(0, 1).map((config, index) => (
                <div key={config.title}>
                  <div className="relative mb-2">
                    {/* Star button absolutely positioned over the top right of the textarea */}
                    <JobSearchCard
                      jobSearch={config}
                      onUpdateQuery={(newQuery) => handleUpdateSearchQuery(index, newQuery)}
                    />
                    <button
                      className="absolute top-8 right-4 p-2 rounded-full border border-yellow-400 bg-white hover:bg-yellow-50 text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 z-10 shadow-sm"
                      aria-label="Save as favorite"
                      onClick={() => {
                        setPendingFavoriteQuery(config.searchQuery);
                        setShowFavoriteModal(true);
                      }}
                      title="Save this search as a favorite"
                      style={{ transform: 'translateY(-50%)' }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" /></svg>
                    </button>
                  </div>
                  {/* Example and Recent Searches - Cleaned Layout */}
                  <div className="mt-4 mb-2">
                    {/* Resume keyword chips and section selector */}
                    <h4 className="text-xs font-semibold text-slate-600 mb-1">Example Searches</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        {
                          query: '(title:VP OR title:Director) AND (Product OR Engineering) AND (SaaS OR B2B)',
                          desc: 'VP or Director roles in Product/Engineering, SaaS/B2B focus'
                        },
                        {
                          query: '(VP OR Head OR Director OR Manager) AND (Product OR Engineering OR Technology)',
                          desc: 'Seniority and function keywords anywhere in the job description'
                        },
                        {
                          query: <><span>(title:Manager OR title:Lead) AND (Data OR Analytics) <span className="text-red-600 font-bold">NOT</span> "Sales"</span></>,
                          desc: 'Manager/Lead roles in Data/Analytics, excluding Sales'
                        },
                        {
                          query: '"Chief Technology Officer" AND (Cloud OR AI) AND Israel',
                          desc: 'CTO roles with Cloud/AI focus, mentioning Israel'
                        },
                        {
                          query: 'Product Manager AND (Mobile OR Web)',
                          desc: 'Product Manager jobs with a focus on mobile or web'
                        },
                      ].map((example, i) => (
                        <button
                          key={i}
                          className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200 text-xs font-mono hover:bg-sky-200 transition relative group"
                          onClick={() => handleUpdateSearchQuery(index, typeof example.query === 'string' ? example.query : 'NOT')}
                          type="button"
                          title={example.desc}
                        >
                          {example.query}
                          <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-2 bg-white border border-slate-300 rounded shadow text-xs text-slate-700 whitespace-normal z-20">
                            {example.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                    {recentSearches.length > 0 && (
                      <>
                        <h4 className="text-xs font-semibold text-slate-600 mb-1">Recent Searches</h4>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(recentSearches)].map((recent, i) => (
                            <button
                              key={i}
                              className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs font-mono hover:bg-amber-200 transition"
                              onClick={() => handleUpdateSearchQuery(index, recent)}
                              type="button"
                              title="Copy to search"
                            >
                              {recent}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {favoriteSearches.length > 0 && (
                      <>
                        <h4 className="text-xs font-semibold text-slate-600 mb-1">Favorite Searches</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {favoriteSearches.map((fav, i) => (
                            <span key={i} className="flex items-center px-3 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300 text-xs font-mono">
                              <button
                                className="mr-2 font-semibold hover:underline"
                                onClick={() => handleUpdateSearchQuery(index, fav.query)}
                                title={fav.query}
                              >
                                {fav.name}
                              </button>
                              <button
                                className="ml-1 text-amber-700 hover:text-red-500 focus:outline-none"
                                onClick={() => removeFavorite(fav.query)}
                                aria-label="Remove favorite"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Info tooltip / concise Boolean guide */}
                  <details className="mt-2 mb-4 cursor-pointer select-none">
                    <summary className="text-xs text-slate-500 hover:text-sky-600">How to write a search? (Boolean tips)</summary>
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-3 mt-2">
                      <ul className="list-disc pl-5 space-y-1">
                        <li><TipWithTooltip tip={<><b>OR</b> for alternatives:</>} tooltip="Find jobs with either keyword. Example: VP OR Director matches jobs with either VP or Director." /> <span className='font-mono'>VP OR Director</span></li>
                        <li><TipWithTooltip tip={<><b>AND</b> to combine:</>} tooltip="Find jobs that mention both keywords. Example: Customer Success AND Delivery matches jobs mentioning both." /> <span className='font-mono'>Customer Success AND Delivery</span></li>
                        <li><TipWithTooltip tip={<><b>Quotes</b> for exact job titles:</>} tooltip="Use quotes to search for the exact phrase, not just the words. Example: 'Chief of Staff' matches only that phrase." /> <span className='font-mono'>"Chief of Staff"</span></li>
                        <li><TipWithTooltip tip={<><b>title:</b> to search in job titles only:</>} tooltip="Only jobs with this in the title will match. Example: title:Frontend Team Lead matches jobs with 'Frontend Team Lead' in the title." /> <span className='font-mono'>title:Frontend Team Lead</span></li>
                        <li><TipWithTooltip tip={<>Combine:</>} tooltip="Mix AND, OR, and parentheses for complex searches. Example: VP OR Director AND (Customer Success OR Delivery) matches jobs with VP or Director and either Customer Success or Delivery." /> <span className='font-mono'>VP OR Director AND (Customer Success OR Delivery)</span></li>
                        <li><TipWithTooltip tip={<><b>Tip:</b> Avoid quotes for broad concepts</>} tooltip="Quotes limit results to the exact phrase. For broad topics, leave out the quotes. Example: AI Enablement (not 'AI Enablement')." /> <span className='font-mono'>AI Enablement</span></li>
                        <li><TipWithTooltip tip={<>LinkedIn searches the whole job description, not just the title.</>} tooltip="You may see jobs where your keywords appear in the description, not just the title. Use title: for more precise results." /> </li>
                      </ul>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
          
          {/* Step 3: Paste & Analyze */}
          <div>
             <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
              <span className="bg-sky-500 text-white rounded-full h-8 w-8 text-sm font-bold flex items-center justify-center mr-3">3</span>
              Paste & Analyze
            </h2>
            <div className="ml-11">
                <p className="text-slate-500 mb-2">Paste one full job description into the text box below, then click analyze.</p>
                <p className="text-xs text-slate-400 mb-4">For best results, please analyze one job at a time.</p>
                <textarea
                    value={pastedJobsText}
                    onChange={(e) => {
                      setPastedJobsText(e.target.value);
                      clearResults();
                    }}
                    placeholder={resumeText ? "Paste one full job description here..." : "Upload your resume to enable this text area."}
                    className="w-full h-60 p-4 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow disabled:bg-slate-100"
                    disabled={!resumeText}
                />
                <button
                    onClick={handleAnalyzeClick}
                    disabled={!resumeText || !pastedJobsText || isAnalyzing}
                    className="mt-4 w-full md:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
                >
                     {isAnalyzing ? (
                        <>
                        <Spinner small />
                        <span className="ml-2">Analyzing...</span>
                        </>
                    ) : (
                        <>
                        <ClipboardPasteIcon className="h-5 w-5 mr-2" />
                        <span>Analyze Pasted Job</span>
                        </>
                    )}
                </button>
            </div>
          </div>


          {/* Step 4: Results */}
          <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
              <span className="bg-sky-500 text-white rounded-full h-8 w-8 text-sm font-bold flex items-center justify-center mr-3">4</span>
              AI Analysis Results
            </h2>
            
            <div className="ml-11">
                {isAnalyzing && (
                <div className="flex flex-col items-center justify-center bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                    <Spinner />
                    <p className="mt-4 text-lg font-medium text-slate-600">AI is analyzing your pasted job...</p>
                    <p className="text-slate-500">This might take a moment.</p>
                </div>
                )}

                {analysisError && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-start space-x-3">
                    <ErrorIcon className="h-6 w-6 mt-0.5" />
                    <div>
                    <h3 className="font-bold">Analysis Failed</h3>
                    <p>{analysisError}</p>
                    </div>
                </div>
                )}
                
                {!isAnalyzing && !analysisResult && !analysisError && (
                <div className="bg-sky-100/50 border border-sky-200 text-sky-800 p-6 rounded-lg flex items-center space-x-4">
                    <LightbulbIcon className="h-8 w-8 text-sky-500 flex-shrink-0" />
                    <div>
                    <h3 className="font-bold">Ready for Analysis</h3>
                    <p className="text-sky-700">Your results will appear here once you paste a job description and click "Analyze".</p>
                    </div>
                </div>
                )}

                {analysisResult && (
                    <DetailedAnalysisCard job={analysisResult} />
                )}
            </div>
          </div>

          {/* Step 5: Tailored Resume */}
          {analysisResult && !analysisError && (
            <div>
              <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
                <span className="bg-sky-500 text-white rounded-full h-8 w-8 text-sm font-bold flex items-center justify-center mr-3">5</span>
                Get a Tailored Resume Draft
              </h2>
              <div className="ml-11">
                <p className="text-slate-500 mb-4">Based on the analysis, the AI can generate a new version of your resume optimized for this role.</p>
                <button
                  onClick={handleGenerateResumeClick}
                  disabled={isGeneratingResume || isAnalyzing}
                  className="w-full md:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200"
                >
                  {isGeneratingResume ? (
                    <>
                      <Spinner small />
                      <span className="ml-2">Generating Draft...</span>
                    </>
                  ) : (
                    <>
                      <WandIcon className="h-5 w-5 mr-2" />
                      <span>Generate Tailored Resume</span>
                    </>
                  )}
                </button>
                
                {isGeneratingResume && (
                  <div className="mt-6 flex flex-col items-center justify-center bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                      <Spinner />
                      <p className="mt-4 text-lg font-medium text-slate-600">AI is drafting your tailored resume...</p>
                      <p className="text-slate-500">This might take a moment.</p>
                  </div>
                )}

                {resumeGenerationError && (
                  <div className="mt-6 bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-start space-x-3">
                    <ErrorIcon className="h-6 w-6 mt-0.5" />
                    <div>
                      <h3 className="font-bold">Resume Generation Failed</h3>
                      <p>{resumeGenerationError}</p>
                    </div>
                  </div>
                )}

                {tailoredResume && (
                  <TailoredResumeDisplay resumeText={tailoredResume} />
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;