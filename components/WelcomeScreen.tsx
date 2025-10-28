import React from 'react';
import { CodeIcon, ImageIcon, SearchIcon, SparklesIcon, FileTextIcon, ChatBubbleIcon, BrainCircuitIcon, MapPinIcon } from './icons/Icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center flex flex-col items-center">
        <div className="flex-shrink-0 mb-3">{icon}</div>
        <div>
            <h3 className="font-semibold text-gray-400 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
            <div className="mb-8">
                <SparklesIcon className="w-16 h-16 text-blue-500 mx-auto" />
                <h1 className="text-4xl font-bold text-gray-400 mt-4">Gemini Pro Agent</h1>
                <p className="text-gray-500 mt-2 max-w-2xl">
                    Your versatile AI assistant. Create multiple chats, ground answers in local sources or Google services, and fine-tune the model's behavior.
                </p>
            </div>
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FeatureCard 
                    icon={<ChatBubbleIcon className="w-8 h-8 text-teal-400" />}
                    title="Multi-Chat"
                    description="Organize your work with multiple, persistent conversations."
                />
                <FeatureCard 
                    icon={<FileTextIcon className="w-8 h-8 text-purple-400" />}
                    title="Source Grounding"
                    description="Provide your own documents for the AI to use as context."
                />
                <FeatureCard 
                    icon={<BrainCircuitIcon className="w-8 h-8 text-pink-400" />}
                    title="Thinking Mode"
                    description="Allocate a 'thinking budget' for more complex reasoning tasks."
                />
                 <FeatureCard 
                    icon={<MapPinIcon className="w-8 h-8 text-orange-400" />}
                    title="Maps & Search"
                    description="Get up-to-date, location-aware answers from Google."
                />
            </div>
        </div>
    );
};