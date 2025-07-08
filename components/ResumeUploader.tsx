import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon, CheckCircleIcon, XCircleIcon, ErrorIcon } from './Icons';
import { Spinner } from './Spinner';

interface ResumeUploaderProps {
  onResumeUpload: (text: string, fileName: string) => void;
  fileName: string | null;
  onRemoveResume: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onResumeUpload, fileName, onRemoveResume }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (fileName && isInitialLoad.current) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      isInitialLoad.current = false;
      return () => clearTimeout(timer);
    }
    if (!fileName) {
      isInitialLoad.current = true;
    }
  }, [fileName]);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;

    setUploadError(null);
    setIsLoading(true);

    try {
      const text = await file.text();
      onResumeUpload(text, file.name);
    } catch (error) {
      console.error('File reading error:', error);
      setUploadError('Failed to read file. Please ensure it is a plain text file (e.g., .txt, .md).');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isLoading) setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isLoading) handleFile(event.dataTransfer.files?.[0]);
  };

  const handleClick = () => {
    if (!isLoading) fileInputRef.current?.click();
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveResume();
  };

  const uploaderClasses = `flex flex-col items-center justify-center w-full p-8 text-center bg-white border-2 border-dashed rounded-lg transition-colors duration-200 ${
    isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300'
  } ${isLoading ? 'cursor-wait' : 'cursor-pointer hover:border-sky-400 hover:bg-slate-50'}`;

  return (
    <div className="ml-11">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.rtf"
        disabled={isLoading}
      />
      {!fileName ? (
        <>
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={uploaderClasses}
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="font-semibold text-slate-600 mt-3">Reading your resume...</span>
            </>
          ) : (
            <>
              <UploadIcon className="h-10 w-10 text-slate-400 mb-3" />
              <span className="font-semibold text-slate-600">Click to upload or drag and drop</span>
              <p className="text-sm text-slate-500 mt-1">TXT, MD, or RTF files</p>
            </>
          )}
        </label>
        {uploadError && (
            <div className="mt-2 bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg flex items-start space-x-3 text-sm">
                <ErrorIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
            </div>
        )}
        </>
      ) : (
        <div className={`flex items-center justify-between w-full p-4 text-left bg-green-50 border rounded-lg ${highlight ? 'animate-highlight-load' : 'border-green-200'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="font-semibold text-green-800 truncate" title={fileName}>Resume: {fileName}</p>
              <p className="text-sm text-green-700">Ready to analyze.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
            <button
              onClick={handleClick}
              className="text-sm font-medium text-sky-600 hover:text-sky-700 disabled:text-slate-400"
              aria-label="Change resume file"
              disabled={isLoading}
            >
              Change
            </button>
            <button
              onClick={handleRemoveClick}
              className="p-1 text-slate-400 hover:text-red-500 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:text-slate-300"
              aria-label="Remove resume"
              disabled={isLoading}
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};