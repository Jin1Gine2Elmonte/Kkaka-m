import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperClipIcon, XIcon, LoadingIcon } from './icons/Icons';

interface PromptInputProps {
    onSendMessage: (prompt: string, image: { data: string; mimeType: string } | null) => void;
    isLoading: boolean;
    error: string | null;
    disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSendMessage, isLoading, error, disabled = false }) => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Auto-resize textarea
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [prompt]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // remove "data:mimeType;base64," prefix
                const base64Data = result.split(',')[1];
                resolve({ data: base64Data, mimeType: file.type });
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || disabled || (!prompt.trim() && !imageFile)) return;

        let imagePayload = null;
        if (imageFile) {
            imagePayload = await fileToBase64(imageFile);
        }
        
        onSendMessage(prompt, imagePayload);
        setPrompt('');
        handleImageRemove();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="px-4 pb-4 md:px-6 md:pb-6 bg-gray-900 border-t border-gray-700">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="relative bg-gray-800 border border-gray-600 rounded-lg p-2 flex flex-col">
                    {imagePreview && (
                        <div className="relative w-24 h-24 mb-2 p-1 border border-gray-600 rounded-md">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                            <button
                                type="button"
                                onClick={handleImageRemove}
                                className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1 text-gray-400 hover:text-white"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-start">
                        <textarea
                            ref={textAreaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={disabled ? "Create a new chat to begin" : "Ask Gemini anything, or describe an image..."}
                            className="flex-1 bg-transparent text-gray-400 placeholder-gray-500 focus:outline-none resize-none px-2 max-h-48"
                            rows={1}
                            disabled={isLoading || disabled}
                        />
                        <div className="flex items-center self-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 hover:text-blue-500 disabled:opacity-50"
                                disabled={isLoading || disabled}
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                            <button
                                type="submit"
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center w-9 h-9"
                                disabled={isLoading || disabled || (!prompt.trim() && !imageFile)}
                            >
                                {isLoading ? <LoadingIcon className="w-5 h-5 animate-spin"/> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </form>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
        </div>
    );
};