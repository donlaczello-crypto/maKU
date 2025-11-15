import React, { useState, useEffect } from 'react';
import { getSupportStrategyStream } from '../services/geminiService';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const StrategyGuide: React.FC = () => {
    const [situation, setSituation] = useState('');
    const [strategy, setStrategy] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (isComplete && strategy) {
            const formattedResult = strategy
                .replace(/### (.*?)(?:\n|$)/g, '<h3 class="text-lg font-bold text-sky-700 mt-4 mb-2">$1</h3>')
                .replace(/\* (.*?)(?:\n|$)/g, '<li class="ml-4 list-disc">$1</li>')
                .replace(/\n/g, '<br/>');
            setStrategy(formattedResult);
        }
    }, [isComplete]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!situation) {
            setError('Proszę opisać sytuację.');
            return;
        }
        setError('');
        setIsLoading(true);
        setIsComplete(false);
        setStrategy('');
        try {
            const stream = await getSupportStrategyStream(situation);
            for await (const chunk of stream) {
                setStrategy(prev => prev + chunk.text);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania strategii.');
        } finally {
            setIsLoading(false);
            setIsComplete(true);
        }
    };
    
    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Strategie i Wsparcie</h2>
            <p className="text-slate-500 mb-6">Otrzymaj natychmiastowe wskazówki dopasowane do trudnej sytuacji.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Opisz sytuację</h3>
                    <ConfidentialDataWarning />
                    <textarea
                        value={situation}
                        onChange={e => setSituation(e.target.value)}
                        placeholder="Np. 'Syn (5 lat, ASD) wpada w złość, gdy wyłączam bajkę. Zaczyna krzyczeć i rzucać zabawkami.'"
                        className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        required
                    />
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}

                <button
                    type="submit"
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={isLoading || !situation}
                >
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'Generuję porady...' : 'Daj mi strategię'}
                </button>
            </form>
            
            {(strategy) && (
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">Twoje spersonalizowane strategie</h2>
                     <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: strategy }} />
                </div>
            )}
        </div>
    );
}

export default StrategyGuide;
