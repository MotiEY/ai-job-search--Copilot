import React, { useState, useEffect } from 'react';
import { BotIcon } from './Icons';

export const Header: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('geminiApiKey') || '';
    setApiKey(storedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setSaved(false);
  };

  const handleApiKeySave = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    setSaved(true);
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 bg-white border-b border-slate-200/80">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold text-sky-700 tracking-tight">Bruno the Headhunter</span>
      </div>
      <div className="flex items-center space-x-4">
        <a 
          href="https://github.com/google/generative-ai-docs" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors"
        >
          Powered by Gemini
        </a>
        <div className="flex items-center space-x-2">
          <input
            type="password"
            placeholder="Gemini API Key"
            value={apiKey}
            onChange={handleApiKeyChange}
            className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            style={{ width: 200 }}
          />
          <button
            onClick={handleApiKeySave}
            className="px-2 py-1 bg-sky-500 text-white rounded text-xs font-semibold hover:bg-sky-600 transition-colors"
          >
            Save
          </button>
          {saved && <span className="text-green-600 text-xs ml-1">Saved!</span>}
        </div>
      </div>
    </header>
  );
};
