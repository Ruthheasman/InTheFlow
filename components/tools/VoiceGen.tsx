import React, { useState } from 'react';
import { generateSpeech } from '../../services/geminiService';
import { Icons } from '../../constants';

interface VoiceGenProps {
    onOutputChange: (data: string) => void;
}

export const VoiceGen: React.FC<VoiceGenProps> = ({ onOutputChange }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const src = await generateSpeech(text, voice);
      setAudioSrc(src);
      onOutputChange(src);
    } catch (err) {
      setError("Failed to generate speech.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Text to Speak</label>
        <textarea 
          className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900 focus:border-orange-300 outline-none resize-none h-20 transition-colors"
          placeholder="Hello, welcome to the video..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Voice</label>
        <select 
          className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none transition-colors"
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
        >
          <option value="Kore">Kore (Female)</option>
          <option value="Puck">Puck (Male)</option>
          <option value="Charon">Charon (Male)</option>
          <option value="Fenrir">Fenrir (Male)</option>
          <option value="Zephyr">Zephyr (Female)</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !text}
        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <Icons.Sparkles className="w-4 h-4 animate-spin" />
            Synthesizing...
          </>
        ) : (
          <>
            <Icons.Mic className="w-4 h-4" />
            Generate Audio
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {audioSrc && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
           <audio controls src={audioSrc} className="w-full h-8" />
        </div>
      )}
    </div>
  );
};