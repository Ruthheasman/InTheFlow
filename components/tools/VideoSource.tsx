import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';

interface VideoSourceProps {
    onOutputChange: (data: string) => void;
}

export const VideoSource: React.FC<VideoSourceProps> = ({ onOutputChange }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Using Object URL for better performance with video files
            const url = URL.createObjectURL(file);
            setPreview(url);
            onOutputChange(url);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            onOutputChange(url);
        }
    };

    return (
        <div className="space-y-4">
            {!preview ? (
                <div 
                    className="h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <Icons.Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                        Drag & drop a video, or click to upload
                    </p>
                    <input 
                        type="file" 
                        ref={inputRef} 
                        className="hidden" 
                        accept="video/*" 
                        onChange={handleFileChange} 
                    />
                </div>
            ) : (
                <div className="relative group">
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        <video src={preview} controls className="w-full h-auto object-cover max-h-60" />
                    </div>
                    <button 
                        onClick={() => {
                            if (preview) URL.revokeObjectURL(preview); // Cleanup
                            setPreview(null);
                            onOutputChange('');
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <Icons.X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Icons.Film className="w-3 h-3" /> Ready to connect
                    </p>
                </div>
            )}
        </div>
    );
};