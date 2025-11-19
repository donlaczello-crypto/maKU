
import React, { useState, useEffect } from 'react';
import { generateGeminiCardsForChild } from '../services/geminiService';
import { GeminiCard } from '../types';
import { Icon } from './common/Icon';

const emotions = [
    { emoji: '😞', name: 'Smutny' },
    { emoji: '😠', name: 'Zły' },
    { emoji: '😟', name: 'Zmartwiony' },
    { emoji: '😫', name: 'Zmęczony' },
    { emoji: '😒', name: 'Znudzony' },
    { emoji: '😱', name: 'Wystraszony' }
];

const Smartwatch: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
    const [cards, setCards] = useState<GeminiCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const handleGenerateCards = async () => {
        if (!selectedEmotion) {
            setError("Wybierz emocję, aby otrzymać pomoc.");
            return;
        }
        setError('');
        setIsLoading(true);
        setCards([]);
        try {
            const result = await generateGeminiCardsForChild(selectedEmotion);
            const parsedResult = JSON.parse(result);
            if(parsedResult.error){
                setError(parsedResult.error);
            } else {
                setCards(parsedResult.cards);
            }
        } catch(e) {
            setError("Nie udało się wygenerować kart. Spróbuj ponownie.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-4 md:p-8 flex justify-center items-center">
            <div className="w-[320px] h-[600px] bg-slate-800 rounded-3xl shadow-2xl p-4 flex flex-col border-4 border-slate-600">
                <div className="text-center text-white mb-4">
                    <p className="text-5xl font-mono tracking-widest">{currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-slate-400">{currentTime.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>

                <div className="flex-1 bg-slate-700 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                    {cards.length === 0 && !isLoading && (
                        <>
                            <h2 className="text-lg font-bold text-white mb-3">Jak się teraz czujesz?</h2>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {emotions.map(e => (
                                    <button key={e.name} onClick={() => setSelectedEmotion(e.name)} className={`p-2 rounded-lg transition border-2 ${selectedEmotion === e.name ? 'bg-sky-500 border-sky-300' : 'bg-slate-600 border-transparent hover:bg-slate-500'}`}>
                                        <p className="text-4xl">{e.emoji}</p>
                                        <p className="text-xs text-white">{e.name}</p>
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleGenerateCards}
                                disabled={!selectedEmotion || isLoading}
                                className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-500 disabled:cursor-not-allowed">
                                Potrzebuję Pomocy
                            </button>
                             {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                        </>
                    )}
                    
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center text-white">
                             <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             <p>Szukam dla Ciebie pomysłów...</p>
                         </div>
                    )}

                    {cards.length > 0 && (
                        <div className="w-full space-y-3">
                             <h2 className="text-lg font-bold text-white mb-2">Spróbuj tego:</h2>
                             {cards.map((card, index) => (
                                <div key={index} className="bg-slate-600 p-3 rounded-lg text-left flex items-center gap-3">
                                    <p className="text-4xl">{card.emoji}</p>
                                    <div>
                                        <h3 className="font-bold text-white">{card.title}</h3>
                                        <p className="text-sm text-slate-300">{card.description}</p>
                                    </div>
                                </div>
                             ))}
                             <button onClick={() => { setCards([]); setSelectedEmotion(null); }} className="w-full mt-3 bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-400 transition">Gotowe!</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Smartwatch;