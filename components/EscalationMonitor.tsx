import React, { useState } from 'react';
import { getEscalationStrategies } from '../services/geminiService';
import { EscalationStrategy } from '../types';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

type EscalationPhase = 'Zaniepokojenie' | 'Kryzys' | 'Regeneracja';

const escalationPhases: { name: EscalationPhase; color: string; description: string }[] = [
    { name: 'Zaniepokojenie', color: 'bg-amber-400', description: 'Dziecko jest poddenerwowane, ale wciąż otwarte na wsparcie.' },
    { name: 'Kryzys', color: 'bg-red-500', description: 'Walka, ucieczka lub zamrożenie. Priorytetem jest bezpieczeństwo.' },
    { name: 'Regeneracja', color: 'bg-sky-500', description: 'Emocje opadają. Czas na odbudowę poczucia bezpieczeństwa.' },
];

const EscalationMonitor: React.FC = () => {
    const [phase, setPhase] = useState<EscalationPhase | null>(null);
    const [situation, setSituation] = useState('');
    const [strategies, setStrategies] = useState<EscalationStrategy[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phase || !situation) {
            setError('Proszę wybrać fazę i opisać sytuację.');
            return;
        }
        setError('');
        setIsLoading(true);
        setStrategies([]);
        try {
            const result = await getEscalationStrategies(phase, situation);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setStrategies(parsedResult.strategies);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania strategii. Sprawdź format odpowiedzi z API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Monitor Eskalacji</h2>
            <p className="text-slate-500 mb-6">Otrzymaj natychmiastowe wsparcie w sytuacji kryzysowej.</p>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-sky-700 mb-3">1. Wybierz fazę eskalacji</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {escalationPhases.map(p => (
                            <button
                                type="button"
                                key={p.name}
                                onClick={() => setPhase(p.name)}
                                className={`p-4 rounded-lg text-left transition border-2 ${phase === p.name ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-400'}`}
                            >
                                <div className="flex items-center mb-1">
                                    <span className={`w-3 h-3 rounded-full mr-2 ${p.color}`}></span>
                                    <span className="font-bold text-slate-800">{p.name}</span>
                                </div>
                                <p className="text-xs text-slate-500">{p.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-sky-700 mb-3">2. Opisz krótko sytuację</h3>
                    <ConfidentialDataWarning />
                    <textarea
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        placeholder="Np. 'Nie chce wyłączyć tabletu, zaczyna uderzać rękami w stół.'"
                        className="w-full p-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-sky-500"
                        required
                    />
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                
                <button
                    type="submit"
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={isLoading || !phase || !situation}
                >
                    {isLoading ? 'Generuję strategie...' : 'Daj mi plan działania'}
                </button>
            </form>

            {strategies.length > 0 && (
                <div className="mt-8">
                     <h3 className="text-xl font-bold text-slate-800 mb-4">Twoje strategie na teraz:</h3>
                     <div className="space-y-4">
                        {strategies.map((strategy, index) => (
                            <div key={index} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-sky-500">
                                <h4 className="text-lg font-bold text-sky-800 mb-2">{strategy.title}</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-sm text-slate-600">Co robić (akcja):</p>
                                        <p className="text-slate-700">{strategy.caregiverAction}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-600">Co mówić (komunikacja):</p>
                                        <p className="text-slate-700">{strategy.communicationTip}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
};

export default EscalationMonitor;
