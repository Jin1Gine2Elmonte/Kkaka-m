import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/PromptInput';
import { GoogleGenAI } from "@google/genai";
import type { Message, Config, GroundingSource, LocalSource, ChatSession } from './types';
import { DEFAULT_CONFIG } from './constants';
import { WelcomeScreen } from './components/WelcomeScreen';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);

    const isRenamingRef = useRef(false);

    // Load sessions from localStorage on initial render
    useEffect(() => {
        try {
            const savedSessions = localStorage.getItem('chatSessions');
            if (savedSessions) {
                const parsedSessions = JSON.parse(savedSessions);
                setSessions(parsedSessions);
                if (parsedSessions.length > 0) {
                    setActiveSessionId(parsedSessions[0].id);
                }
            } else {
                handleNewChat();
            }
        } catch (e) {
            console.error("Failed to load sessions from localStorage", e);
            handleNewChat();
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (isRenamingRef.current) return;
        try {
            if (sessions.length > 0) {
                localStorage.setItem('chatSessions', JSON.stringify(sessions));
            } else {
                 localStorage.removeItem('chatSessions');
            }
        } catch (e) {
            console.error("Failed to save sessions to localStorage", e);
        }
    }, [sessions]);
    
     // Get user location for Maps grounding
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.warn(`Could not get geolocation: ${error.message}`);
            }
        );
    }, []);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const updateActiveSession = (updater: (session: ChatSession) => ChatSession) => {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? updater(s) : s));
    };

    const handleSendMessage = async (prompt: string, image: { data: string; mimeType: string } | null) => {
        if (isLoading || !activeSession) return;

        setIsLoading(true);
        setError(null);

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            text: prompt,
            image: image ? `data:${image.mimeType};base64,${image.data}` : undefined,
        };
        
        // Auto-rename session on first message
        if (activeSession.messages.length === 0 && !activeSession.isRenaming) {
             isRenamingRef.current = true;
             const newTitle = prompt.trim().substring(0, 40);
             updateActiveSession(s => ({ ...s, title: newTitle || "New Chat" }));
             setTimeout(() => isRenamingRef.current = false, 100);
        }

        updateActiveSession(s => ({ ...s, messages: [...s.messages, userMessage] }));

        const aiMessageId = uuidv4();
        const aiMessagePlaceholder: Message = {
            id: aiMessageId,
            role: 'model',
            text: '',
        };
        updateActiveSession(s => ({ ...s, messages: [...s.messages, aiMessagePlaceholder] }));

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const history = activeSession.messages.map(msg => {
                const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
                if (msg.text) {
                    parts.push({ text: msg.text });
                }
                if (msg.role === 'user' && msg.image) {
                    const [meta, base64Data] = msg.image.split(',');
                    const mimeType = meta.match(/:(.*?);/)?.[1];
                    if (mimeType && base64Data) {
                        parts.push({ inlineData: { mimeType, data: base64Data } });
                    }
                }
                return { role: msg.role, parts };
            }).filter(h => h.parts.length > 0);

            let sourceContext = '';
            if (activeSession.localSources.length > 0) {
                const sourceText = activeSession.localSources.map(s => `Title: ${s.title}\nContent:\n${s.content}`).join('\n\n---\n\n');
                sourceContext = `Please use the following sources to answer the user's question. Respond with "I don't have enough information in the provided sources" if you cannot answer from the context.\n\nSOURCES:\n${sourceText}\n\n---\n\n`;
            }

            const userParts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
            if (image) {
                userParts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
            }
            userParts.push({ text: `${sourceContext}${prompt}` });
            
            const tools: any[] = [];
            if (activeSession.config.useGrounding) {
                tools.push({ googleSearch: {} });
            }
            if (activeSession.config.useMapsGrounding) {
                tools.push({ googleMaps: {} });
            }

            const result = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [...history, { role: 'user', parts: userParts }],
                systemInstruction: activeSession.config.systemInstruction,
                generationConfig: {
                    temperature: activeSession.config.temperature,
                    topK: activeSession.config.topK,
                    topP: activeSession.config.topP,
                },
                thinkingConfig: activeSession.config.thinkingBudget > 0 ? { thinkingBudget: activeSession.config.thinkingBudget } : undefined,
                tools: tools.length > 0 ? tools : undefined,
                toolConfig: activeSession.config.useMapsGrounding && userLocation ? { retrievalConfig: { latLng: userLocation } } : undefined,
            });
            
            let fullText = '';
            let groundingSources: GroundingSource[] = [];

            for await (const chunk of result) {
                const chunkText = chunk.text;
                fullText += chunkText;

                const metadata = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (metadata) {
                    const sources = metadata
                        .map((item: any) => {
                            if (item.web) return { type: 'web', uri: item.web.uri, title: item.web.title || 'Untitled Source' };
                            if (item.maps) return { type: 'maps', uri: item.maps.uri, title: item.maps.title || 'Map Location' };
                            return null;
                        })
                        .filter(Boolean) as GroundingSource[];
                    groundingSources = [...new Map([...groundingSources, ...sources].map(item => [item.uri, item])).values()];
                }
                
                updateActiveSession(s => ({
                    ...s,
                    messages: s.messages.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: fullText, sources: groundingSources.length > 0 ? groundingSources : undefined } : msg
                    )
                }));
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Error: ${errorMessage}`);
            updateActiveSession(s => ({
                ...s,
                messages: s.messages.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: `Sorry, I encountered an error: ${errorMessage}` } : msg
                )
            }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: uuidv4(),
            title: "New Chat",
            messages: [],
            config: { ...DEFAULT_CONFIG },
            localSources: [],
            isRenaming: false,
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };

    const handleDeleteChat = (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
            const remainingSessions = sessions.filter(s => s.id !== sessionId);
            setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
        }
    };
    
    const handleRenameChat = (sessionId: string, newTitle: string) => {
        isRenamingRef.current = true;
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle, isRenaming: false } : s));
        setTimeout(() => isRenamingRef.current = false, 100);
    };

    const toggleRenameMode = (sessionId: string, isRenaming: boolean) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isRenaming } : s));
    };


    return (
        <div className="flex h-screen w-screen bg-gray-900 font-sans">
            <Sidebar
                sessions={sessions}
                activeSession={activeSession}
                onNewChat={handleNewChat}
                onSwitchChat={setActiveSessionId}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
                onToggleRename={toggleRenameMode}
                onConfigChange={(newConfig) => updateActiveSession(s => ({ ...s, config: newConfig }))}
                onLocalSourcesChange={(sources) => updateActiveSession(s => ({ ...s, localSources: sources }))}
            />
            <main className="flex-1 flex flex-col h-screen">
                {activeSession && activeSession.messages.length > 0 ? (
                    <ChatWindow messages={activeSession.messages} />
                ) : (
                    <WelcomeScreen />
                )}
                <PromptInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    error={error}
                    disabled={!activeSession}
                />
            </main>
        </div>
    );
};

// Simple UUID v4 generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export default App;