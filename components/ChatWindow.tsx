
import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
    messages: Message[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};
