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
  
  const handleUpdateSearchQuery = (index: number, newQuery: string) => {
    const updatedSearches = [...jobSearches];
    updatedSearches[index] = { ...updatedSearches[index], searchQuery: newQuery };
    setJobSearches(updatedSearches);
  };

  const clearResults = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setTailoredResume(null);
    setResumeGenerationError(null);
  }

  const handleResumeUpload = (text: string, fileName: string) => {
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
      if (!result) {
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


  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
      <Header />
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
             <p className="text-slate-500 mb-4 ml-11">Use the links below to search for jobs on Google. When you find a role you're interested in, copy its full job description.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobSearches.map((config, index) => (
                <JobSearchCard
                  key={config.title}
                  jobSearch={config}
                  onUpdateQuery={(newQuery) => handleUpdateSearchQuery(index, newQuery)}
                />
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