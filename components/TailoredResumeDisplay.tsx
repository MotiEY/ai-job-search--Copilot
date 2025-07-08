import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

interface TailoredResumeDisplayProps {
  resumeText: string;
}

export const TailoredResumeDisplay: React.FC<TailoredResumeDisplayProps> = ({ resumeText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(resumeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
  }, [resumeText]);

  return (
    <div className="mt-6 animate-fade-in">
        <div className="relative bg-slate-800 rounded-xl shadow-lg">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900/70 rounded-t-xl border-b border-slate-700">
                <p className="text-sm font-medium text-slate-300">Generated Resume Draft</p>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50"
                    disabled={copied}
                >
                    {copied ? (
                        <>
                            <CheckIcon className="h-4 w-4 text-green-400" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon className="h-4 w-4" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 sm:p-6 text-sm text-slate-50 whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto">
                <code>{resumeText}</code>
            </pre>
        </div>
        <p className="text-xs text-slate-500 mt-3">Review the generated text. Remember to check any sections marked with <span className="font-mono bg-amber-100 text-amber-800 px-1 py-0.5 rounded">[NEW ADDITION]</span> to ensure they are accurate.</p>
    </div>
  );
};
