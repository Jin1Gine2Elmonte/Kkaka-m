import type { Config } from './types';

export const DEFAULT_CONFIG: Config = {
    systemInstruction: "You are a helpful and brilliant AI assistant. When sources are provided, ground your answer in them. If you can't answer from the sources, say so. Respond in Markdown format.",
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    useGrounding: false,
    useMapsGrounding: false,
    thinkingBudget: 0,
};