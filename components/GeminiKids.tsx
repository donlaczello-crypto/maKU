import React, { useState, useRef, useEffect } from 'react';
import { getGeminiKidsMultimodalResponse } from '../services/geminiService';
import { ChildProfile } from '../types';
import Icon from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

type Message = {
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
};

const GeminiKids: React.FC = () => {
    const [profile, setProfile] = useState<ChildProfile | null>(null);
    const [history, setHistory] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProfile: ChildProfile = {
            name: formData.get('name') as string,
            favoriteAnimal: formData.get('animal') as string,
            interests: formData.get('interests') as string,
        };
        setProfile(newProfile);
        setHistory([{ role: 'model', text: `Cześć ${newProfile.name}! Jestem Iskierka, Twój nowy przyjaciel-robot. O czym chcesz dzisiaj porozmawiać?` }]);
    };

    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !profile) return;

        const userMessage: Message = { role: 'user', text: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getGeminiKidsMultimodalResponse(
                profile,
                newHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
            );

            const modelMessage: Message = {
                role: 'model',
                text: response.text,
                imageUrl: response.imageUrl,
            };
    
            setHistory(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Error in Gemini Kids chat:", error);
            const errorMessage: Message = {
                role: 'model',
                text: "Ojej, coś mi się zepsuło. Spróbujmy jeszcze raz!"
            };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!profile) {
        return (
            <div className="p-4 md:p-8 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                    <div className="mx-auto bg-sky-100 text-sky-600 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                        <Icon name="gemini-kids" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">Witaj w Gemini Kids!</h2>
                    <p className="text-slate-500 mb-6">Zanim zaczniemy, opowiedz mi trochę o dziecku, abym mógł być najlepszym przyjacielem.</p>
                    <ConfidentialDataWarning />
                    <form onSubmit={handleProfileSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Jak ma na imię dziecko?</label>
                            <input type="text" name="name" id="name" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="animal" className="block text-sm font-medium text-slate-700">Jakie jest jego ulubione zwierzę?</label>
                            <input type="text" name="animal" id="animal" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="interests" className="block text-sm font-medium text-slate-700">Czym się interesuje? (np. dinozaury, kosmos, rysowanie)</label>
                            <input type="text" name="interests" id="interests" required className="mt-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition">Zacznijmy rozmowę!</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">Rozmowa z Iskierką</h2>
            <p className="text-slate-500 mb-6 text-center">Naciśnij "enter" lub przycisk, aby wysłać wiadomość.</p>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[70vh]">
                <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="gemini-kids" /></div>}
                            <div className={`px-4 py-3 rounded-2xl max-w-sm ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-700 text-white rounded-bl-none'}`}>
                                {msg.imageUrl && (
                                    <img 
                                        src={msg.imageUrl} 
                                        alt="Odpowiedź od Iskierki" 
                                        className="rounded-lg mb-2 max-w-full h-auto" 
                                    />
                                )}
                                <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-end gap-3 justify-start">
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0"><Icon name="gemini-kids" /></div>
                            <div className="px-4 py-3 rounded-2xl max-w-sm bg-slate-700 text-white rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Napisz coś do Iskierki..."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="bg-sky-600 text-white p-3 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeminiKids;
