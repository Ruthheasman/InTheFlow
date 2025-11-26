import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';

interface SequencerProps {
    inputs: string[]; // List of video URLs from connected nodes
}

export const Sequencer: React.FC<SequencerProps> = ({ inputs }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [validInputs, setValidInputs] = useState<string[]>([]);

    useEffect(() => {
        // Filter inputs to only include valid video blobs/urls
        const videos = inputs.filter(i => i && (i.startsWith('blob:') || i.startsWith('http')));
        setValidInputs(videos);
        // Reset index if list changes drastically
        if (videos.length === 0) setCurrentIndex(0);
    }, [inputs]);

    useEffect(() => {
        // Update video source when index or list changes, if not playing
        if (videoRef.current && validInputs.length > 0) {
            const currentSrc = validInputs[currentIndex];
            // Only update src if it's different to prevent flickering
            if (!videoRef.current.src.includes(currentSrc)) {
                videoRef.current.src = currentSrc;
            }
        }
    }, [currentIndex, validInputs]);

    const handlePlay = () => {
        if (validInputs.length === 0) return;
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Play error", e));
        }
    };

    const handlePause = () => {
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    const handleVideoEnded = () => {
        if (currentIndex < validInputs.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            // Auto-play next
            setTimeout(() => {
                if (videoRef.current) {
                     videoRef.current.play().catch(() => setIsPlaying(false));
                }
            }, 100);
        } else {
            setIsPlaying(false);
            setCurrentIndex(0);
        }
    };

    const handleTimelineClick = (index: number) => {
        setCurrentIndex(index);
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    if (validInputs.length === 0) {
        return (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <Icons.Film className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Connect video nodes to sequence</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Player */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-md group border border-gray-800">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-contain"
                    onEnded={handleVideoEnded}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onClick={() => isPlaying ? handlePause() : handlePlay()}
                    src={validInputs[currentIndex]}
                />
                
                {/* Overlay Play Button */}
                {!isPlaying && (
                    <div 
                        onClick={handlePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors cursor-pointer"
                    >
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 shadow-xl group-hover:scale-110 transition-transform">
                             <Icons.Play className="w-8 h-8 text-white fill-current" />
                        </div>
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-mono pointer-events-none">
                    Scene {currentIndex + 1} / {validInputs.length}
                </div>
            </div>

            {/* Timeline Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {validInputs.map((src, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleTimelineClick(idx)}
                        className={`
                            relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all
                            ${currentIndex === idx 
                                ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' 
                                : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-600'}
                        `}
                    >
                        <video src={src} className="w-full h-full object-cover pointer-events-none" />
                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1">
                            {idx + 1}
                        </div>
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {validInputs.length} Scenes Connected
                </span>
                <button 
                    onClick={() => {
                        // Simple export manifest logic
                        const manifest = validInputs.map((url, i) => `Scene ${i + 1}: ${url}`).join('\n');
                        const blob = new Blob([manifest], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sequence_manifest.txt';
                        a.click();
                        alert("Manifest downloaded. To export a single video file, a cloud rendering service would be required.");
                    }}
                    className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded transition-colors"
                >
                    <Icons.Film className="w-3 h-3" />
                    Export List
                </button>
            </div>
        </div>
    );
};