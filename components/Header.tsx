import React, { useState, useEffect } from 'react';
import { BotIcon } from './Icons';

export const Header: React.FC<{ onShowGuide: () => void }> = ({ onShowGuide }) => {
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
        <BotIcon className="h-8 w-8 text-sky-500 mr-2" />
        <span className="text-xl font-bold text-sky-700 tracking-tight">Bruno the Headhunter</span>
        <button
          onClick={onShowGuide}
          className="ml-2 p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Show app guide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
        </button>
      </div>
      <div className="flex items-center space-x-4">
        {/* Removed 'Powered by Gemini' link for cleaner UI */}
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
