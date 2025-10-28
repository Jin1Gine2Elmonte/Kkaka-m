export interface GroundingSource {
    type: 'web' | 'maps';
    uri: string;
    title: string;
}

export interface LocalSource {
    id: string;
    title: string;
    content: string;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string;
    sources?: GroundingSource[];
}

export interface Config {
    systemInstruction: string;
    temperature: number;
    topK: number;
    topP: number;
    useGrounding: boolean;
    useMapsGrounding: boolean;
    thinkingBudget: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    config: Config;
    localSources: LocalSource[];
    isRenaming?: boolean;
}