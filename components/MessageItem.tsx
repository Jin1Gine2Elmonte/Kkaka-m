import React from 'react';
import type { Message } from '../types';
import { UserIcon, SparklesIcon, LinkIcon, MapPinIcon } from './icons/Icons';

declare var Remarkable: any;

interface MessageItemProps {
    message: Message;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const md = new Remarkable({
        html: true,
        breaks: true,
        linkify: true,
    });

    const renderedHTML = md.render(content);

    return <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderedHTML }} />;
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const Icon = isUser ? UserIcon : SparklesIcon;

    return (
        <div className={`flex items-start gap-4 ${isUser ? '' : 'bg-gray-800/50 p-4 rounded-lg'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-green-500'}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pt-1">
                <div className="font-bold text-gray-400 mb-2">{isUser ? 'You' : 'Gemini'}</div>
                {message.image && (
                    <div className="mb-2">
                        <img src={message.image} alt="User upload" className="max-w-xs rounded-lg border border-gray-600" />
                    </div>
                )}
                <div className="text-gray-400 leading-relaxed">
                     <MarkdownRenderer content={message.text || '...' } />
                </div>
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 border-t border-gray-700 pt-3">
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                            <LinkIcon className="w-4 h-4 mr-1" />
                            Sources
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-gray-700 hover:bg-gray-600 text-blue-400 px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                                >
                                    {source.type === 'maps' ? <MapPinIcon className="w-3 h-3"/> : null}
                                    {source.title || new URL(source.uri).hostname}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};