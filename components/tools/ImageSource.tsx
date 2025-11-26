import React, { useState, useRef } from 'react';
import { Icons } from '../../constants';

interface ImageSourceProps {
    onOutputChange: (data: string) => void;
}

export const ImageSource: React.FC<ImageSourceProps> = ({ onOutputChange }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                if (result) {
                    setPreview(result);
                    onOutputChange(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                if (result) {
                    setPreview(result);
                    onOutputChange(result);
                }
            };
            reader.readAsDataURL(file);
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
                        Drag & drop an image, or click to upload
                    </p>
                    <input 
                        type="file" 
                        ref={inputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                </div>
            ) : (
                <div className="relative group">
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        <img src={preview} alt="Uploaded" className="w-full h-auto object-cover max-h-60" />
                    </div>
                    <button 
                        onClick={() => {
                            setPreview(null);
                            onOutputChange(''); // Clear output
                        }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Icons.X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Icons.Image className="w-3 h-3" /> Ready to connect
                    </p>
                </div>
            )}
        </div>
    );
};