import React, { useState } from 'react';
import { generateImage } from '../../services/geminiService';
import { Icons } from '../../constants';

interface ImageGenProps {
    onOutputChange: (data: string) => void;
}

export const ImageGen: React.FC<ImageGenProps> = ({ onOutputChange }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const imgData = await generateImage(prompt, aspectRatio);
      setResult(imgData);
      onOutputChange(imgData); // Update node output data
    } catch (err) {
      setError("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prompt</label>
        <textarea 
          className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 focus:border-pink-300 outline-none resize-none h-20 transition-colors"
          placeholder="A cyberpunk street at night..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aspect Ratio</label>
        <select 
          className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none transition-colors"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          <option value="1:1">Square (1:1)</option>
          <option value="16:9">Landscape (16:9)</option>
          <option value="9:16">Portrait (9:16)</option>
          <option value="3:4">Portrait (3:4)</option>
          <option value="4:3">Landscape (4:3)</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <Icons.Sparkles className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Icons.Sparkles className="w-4 h-4" />
            Generate Image
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 relative group">
           <img src={result} alt="Generated" className="w-full h-auto object-cover" />
           <a href={result} download="generated-image.png" className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 text-black dark:text-white p-1.5 rounded-full shadow hover:bg-white dark:hover:bg-black opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
           </a>
        </div>
      )}
    </div>
  );
};