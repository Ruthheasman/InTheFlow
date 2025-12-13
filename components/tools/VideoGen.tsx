import React, { useState, useEffect } from 'react';
import { generateVideo } from '../../services/geminiService';
import { Icons } from '../../constants';

interface VideoGenProps {
    inputData?: any; // Can be an image URL/Base64
    onOutputChange: (data: string) => void;
}

export const VideoGen: React.FC<VideoGenProps> = ({ inputData, onOutputChange }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const handleGenerate = async () => {
    // If we have an image input, we can allow empty prompt (Veo supports optional prompt with image)
    // But usually prompt helps.
    if (!prompt && !inputData) return;

    setLoading(true);
    setError(null);
    setStatusMsg('Checking API Key permissions...');
    
    try {
      // 1. Trigger Key Selection if needed (Handled in service but we might need UI feedback)
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            setStatusMsg('Waiting for API Key selection...');
            await win.aistudio.openSelectKey();
        }
      }

      setStatusMsg('Starting generation (this may take a minute)...');
      // Pass inputData (image) to service
      const videoUrl = await generateVideo(prompt || "Animate this image", aspectRatio, inputData);
      setResult(videoUrl);
      onOutputChange(videoUrl); // Broadcast output
      setStatusMsg('');
    } catch (err: any) {
        if (err.message && err.message.includes('Requested entity was not found')) {
             setError("API Key issue. Please try again to select a valid key.");
        } else {
             setError("Failed to generate video. Ensure you are using a paid Project ID.");
        }
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/50">
        <strong>Note:</strong> Requires a paid Google Cloud Project API Key selected via the popup.
      </div>

      {inputData && (
          <div className="relative rounded-lg overflow-hidden border border-red-200 dark:border-red-900 h-24 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group">
              <img src={inputData} alt="Input Reference" className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Icons.Image className="w-3 h-3" /> Using Input Image
                  </span>
              </div>
          </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prompt {inputData ? '(Optional)' : ''}</label>
        <textarea 
          className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-300 outline-none resize-none h-20 transition-colors"
          placeholder={inputData ? "Describe how to animate the image..." : "Cinematic drone shot of a futuristic city..."}
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
          <option value="16:9">Landscape (16:9)</option>
          <option value="9:16">Portrait (9:16)</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || (!prompt && !inputData)}
        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <Icons.Video className="w-4 h-4 animate-pulse" />
            Generating...
          </>
        ) : (
          <>
            <Icons.Video className="w-4 h-4" />
            {inputData ? 'Generate Video from Image' : 'Generate Video'}
          </>
        )}
      </button>

      {loading && <p className="text-xs text-center text-gray-500 dark:text-gray-400 animate-pulse">{statusMsg}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black relative group">
           <video controls src={result} className="w-full h-auto aspect-video" />
           <a 
              href={result} 
              download="generated-video.mp4" 
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Download Video"
           >
              <Icons.Download className="w-4 h-4" />
           </a>
        </div>
      )}
    </div>
  );
};