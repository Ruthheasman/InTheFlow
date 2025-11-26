import React, { useState } from 'react';
import { generateText } from '../../services/geminiService';
import { Icons } from '../../constants';

interface ScriptGenProps {
  type: 'script' | 'research' | 'character';
  onOutputChange: (data: string) => void;
}

export const ScriptGen: React.FC<ScriptGenProps> = ({ type, onOutputChange }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [sources, setSources] = useState<{url: string, title: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getConfig = () => {
    switch(type) {
        case 'research': return { 
            placeholder: "What are the latest trends in...", 
            system: "You are a helpful research assistant. Provide detailed, sourced information.",
            btnColor: 'bg-blue-600 hover:bg-blue-700',
            ringColor: 'focus:ring-blue-200 dark:focus:ring-blue-900',
            label: 'Research Topic'
        };
        case 'character': return { 
            placeholder: "A 30-year-old detective who...", 
            system: "You are a character design expert. Create detailed character profiles including background, personality, and appearance.",
            btnColor: 'bg-orange-600 hover:bg-orange-700',
            ringColor: 'focus:ring-orange-200 dark:focus:ring-orange-900',
            label: 'Character Concept'
        };
        default: return { 
            placeholder: "A scene where two friends meet...", 
            system: "You are a professional screenwriter. Write a script scene based on the prompt.",
            btnColor: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
            ringColor: 'focus:ring-slate-200 dark:focus:ring-slate-700',
            label: 'Script Idea'
        };
    }
  }

  const config = getConfig();

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setResult('');
    setSources([]);

    try {
      const data = await generateText(prompt, config.system, type === 'research');
      setResult(data.text);
      if (data.groundingUrls) setSources(data.groundingUrls);
      onOutputChange(data.text);
    } catch (err) {
      setError("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{config.label}</label>
        <textarea 
          className={`w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 ${config.ringColor} outline-none resize-none h-24 transition-colors`}
          placeholder={config.placeholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className={`w-full py-2 ${config.btnColor} text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2`}
      >
        {loading ? (
          <>
            <Icons.Sparkles className="w-4 h-4 animate-spin" />
            Thinking...
          </>
        ) : (
          <>
            <Icons.FileText className="w-4 h-4" />
            Generate
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="mt-4">
           <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto whitespace-pre-wrap">
             {result}
           </div>
           {sources.length > 0 && (
             <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sources:</p>
                <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded truncate max-w-[200px]">
                            {s.title}
                        </a>
                    ))}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};