import React, { useState, useRef, useEffect } from 'react';
import type { Config, LocalSource, ChatSession } from '../types';
import { SettingsIcon, CodeIcon, ChevronDownIcon, ChevronUpIcon, FileTextIcon, PlusIcon, TrashIcon, ChatBubbleIcon, EditIcon, MapPinIcon } from './icons/Icons';

interface SidebarProps {
    sessions: ChatSession[];
    activeSession: ChatSession | undefined;
    onNewChat: () => void;
    onSwitchChat: (sessionId: string) => void;
    onDeleteChat: (sessionId: string) => void;
    onRenameChat: (sessionId: string, newTitle: string) => void;
    onToggleRename: (sessionId: string, isRenaming: boolean) => void;
    onConfigChange: (newConfig: Config) => void;
    onLocalSourcesChange: (sources: LocalSource[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const { sessions, activeSession, onNewChat, onSwitchChat, onDeleteChat, onRenameChat, onToggleRename, onConfigChange, onLocalSourcesChange } = props;

    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);

    const [newSourceTitle, setNewSourceTitle] = useState('');
    const [newSourceContent, setNewSourceContent] = useState('');
    
    const [renameText, setRenameText] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeSession?.isRenaming) {
            setRenameText(activeSession.title);
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [activeSession?.isRenaming, activeSession?.title]);
    
    if (!activeSession) {
        return (
             <aside className="w-96 bg-gray-800 border-r border-gray-700 p-4 flex flex-col h-screen overflow-y-auto">
                 <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-gray-400 flex items-center">
                        <CodeIcon className="w-6 h-6 mr-2 text-blue-500" />
                        Gemini Agent
                    </h1>
                </div>
                <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    New Chat
                </button>
             </aside>
        );
    }

    const { config, localSources } = activeSession;

    const handleConfigChange = <T extends keyof Config,>(key: T, value: Config[T]) => {
        onConfigChange({ ...config, [key]: value });
    };

    const handleAddSource = () => {
        if (!newSourceTitle.trim() || !newSourceContent.trim()) return;
        onLocalSourcesChange([...localSources, { id: Date.now().toString(), title: newSourceTitle, content: newSourceContent }]);
        setNewSourceTitle('');
        setNewSourceContent('');
    };

    const handleRemoveSource = (id: string) => {
        onLocalSourcesChange(localSources.filter(source => source.id !== id));
    };

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (renameText.trim()) {
            onRenameChat(activeSession.id, renameText.trim());
        }
    };
    
    const handleRenameBlur = () => {
        if (renameText.trim()) {
             onRenameChat(activeSession.id, renameText.trim());
        }
        onToggleRename(activeSession.id, false);
    };

    return (
        <aside className="w-96 bg-gray-800 border-r border-gray-700 p-4 flex flex-col h-screen">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-gray-400 flex items-center">
                    <CodeIcon className="w-6 h-6 mr-2 text-blue-500" />
                    Gemini Agent
                </h1>
                <button onClick={onNewChat} className="p-2 text-gray-500 hover:text-blue-500" title="New Chat">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-4 px-4 mb-4 border-y border-gray-700">
                {sessions.map(session => (
                    <div key={session.id} 
                         className={`group flex items-center justify-between p-2 my-1 rounded-md cursor-pointer ${activeSession.id === session.id ? 'bg-blue-500/20' : 'hover:bg-gray-700/50'}`}
                         onClick={() => onSwitchChat(session.id)}
                    >
                         <ChatBubbleIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                         {session.isRenaming ? (
                            <form onSubmit={handleRenameSubmit} className="flex-grow">
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renameText}
                                    onChange={(e) => setRenameText(e.target.value)}
                                    onBlur={handleRenameBlur}
                                    className="bg-transparent text-sm text-gray-400 w-full focus:outline-none"
                                />
                            </form>
                         ) : (
                            <span className="text-sm text-gray-400 truncate flex-grow">{session.title}</span>
                         )}
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); onToggleRename(session.id, true); }} className="p-1 text-gray-500 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                             <button onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 overflow-y-auto -mx-4 px-4">
                <div className="border-t border-gray-700 pt-4 mb-4">
                     <button onClick={() => setIsSourcesExpanded(!isSourcesExpanded)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-400 mb-2 focus:outline-none">
                        <span className="flex items-center">
                            <FileTextIcon className="w-5 h-5 mr-2" />
                            Sources
                        </span>
                        {isSourcesExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                   {isSourcesExpanded && (
                    <div className="space-y-4 pl-1">
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Source Title"
                                value={newSourceTitle}
                                onChange={(e) => setNewSourceTitle(e.target.value)}
                                 className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <textarea
                                rows={3}
                                placeholder="Source content..."
                                value={newSourceContent}
                                onChange={(e) => setNewSourceContent(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button onClick={handleAddSource} className="w-full flex items-center justify-center gap-2 bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors">
                                <PlusIcon className="w-4 h-4" />
                                Add Source
                            </button>
                        </div>
                         {localSources.length > 0 && (
                            <div className="border-t border-gray-700 pt-2 space-y-2">
                                {localSources.map(source => (
                                    <div key={source.id} className="bg-gray-700/50 p-2 rounded-md flex justify-between items-center">
                                        <p className="text-sm text-gray-400 truncate flex-1 pr-2">{source.title}</p>
                                        <button onClick={() => handleRemoveSource(source.id)} className="text-gray-500 hover:text-red-500 p-1">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                   )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                     <button onClick={() => setIsConfigExpanded(!isConfigExpanded)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-400 mb-2 focus:outline-none">
                        <span className="flex items-center">
                            <SettingsIcon className="w-5 h-5 mr-2" />
                            Configuration
                        </span>
                        {isConfigExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                   {isConfigExpanded && (
                    <div className="space-y-4 pl-1">
                         <div>
                            <label htmlFor="system-instruction" className="block text-sm font-medium text-gray-500 mb-2">System Instruction</label>
                            <textarea
                                id="system-instruction"
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={config.systemInstruction}
                                onChange={(e) => handleConfigChange('systemInstruction', e.target.value)}
                                placeholder="e.g., You are a helpful AI assistant."
                            />
                        </div>
                        <div className="flex items-center justify-between">
                             <label htmlFor="grounding" className="text-sm text-gray-500 flex items-center gap-2"><CodeIcon className="w-4 h-4"/> Google Search</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="grounding" checked={config.useGrounding} onChange={(e) => handleConfigChange('useGrounding', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>
                         <div className="flex items-center justify-between">
                             <label htmlFor="maps-grounding" className="text-sm text-gray-500 flex items-center gap-2"><MapPinIcon className="w-4 h-4"/> Google Maps</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="maps-grounding" checked={config.useMapsGrounding} onChange={(e) => handleConfigChange('useMapsGrounding', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>
                        <div>
                            <label htmlFor="thinking-budget" className="block text-sm text-gray-500 mb-1">Thinking Budget: {config.thinkingBudget}</label>
                            <input type="range" id="thinking-budget" min="0" max="24576" step="1024" value={config.thinkingBudget} onChange={(e) => handleConfigChange('thinkingBudget', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <label htmlFor="temperature" className="block text-sm text-gray-500 mb-1">Temperature: {config.temperature.toFixed(2)}</label>
                            <input type="range" id="temperature" min="0" max="1" step="0.01" value={config.temperature} onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div>
                            <label htmlFor="topP" className="block text-sm text-gray-500 mb-1">Top P: {config.topP.toFixed(2)}</label>
                            <input type="range" id="topP" min="0" max="1" step="0.01" value={config.topP} onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div>
                            <label htmlFor="topK" className="block text-sm text-gray-500 mb-1">Top K: {config.topK}</label>
                            <input type="range" id="topK" min="1" max="120" step="1" value={config.topK} onChange={(e) => handleConfigChange('topK', parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                   )}
                </div>
            </div>
            <div className="mt-auto pt-4 text-xs text-gray-600 text-center">
                <p>Powered by Gemini</p>
            </div>
        </aside>
    );
};