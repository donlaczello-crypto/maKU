
import React, { useState } from 'react';
import { getRiskFactorAnalysis } from '../services/geminiService';
import { RiskAlert } from '../types';
import { Icon } from './common/Icon';

export const EarlyWarningSystem: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [alerts, setAlerts] = useState<RiskAlert[]>([]);
    const [acknowledged, setAcknowledged] = useState<string[]>([]);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError('');
        setAlerts([]);
        setAcknowledged([]);

        // In a real app, this summary would be dynamically generated from a database.
        const dataSummary = "W ciągu ostatnich 48h zanotowano: 2 epizody krzyku po odmowie (funkcja: ucieczka od zadania), dziecko spało niespokojnie i o 90 minut krócej (dane z smartwatcha), jutro w planie jest wizyta u dentysty, która jest nową, nieprzewidywalną sytuacją. Poziom hałasu w domu był podwyższony wczoraj wieczorem.";

        try {
            const result = await getRiskFactorAnalysis(dataSummary);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setAlerts(parsedResult.alerts);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas analizy. Sprawdź format odpowiedzi z API.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getRiskColor = (level: RiskAlert['level']): { border: string, bg: string, text: string } => {
        switch (level) {
            case 'Wysoki': return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-800' };
            case 'Umiarkowany': return { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-800' };
            case 'Niski': return { border: 'border-teal-400', bg: 'bg-teal-50', text: 'text-teal-800' };
            default: return { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' };
        }
    }
    
    const toggleAcknowledge = (id: string) => {
        setAcknowledged(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">System Wczesnego Ostrzegania</h2>
            <p className="text-slate-500 mb-6">Analizuj dane, aby proaktywnie identyfikować czynniki ryzyka i zapobiegać kryzysom.</p>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8">
                <h3 className="text-lg font-bold text-sky-700">Analiza Predykcyjna</h3>
                <p className="text-sm text-slate-500 my-2">Uruchom analizę, aby system przejrzał ostatnie dane (logi ABC, dane z sensorów) i zidentyfikował potencjalne czynniki ryzyka na najbliższe 24 godziny.</p>
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full md:w-auto bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Analizuję...</span>
                        </>
                    ) : 'Uruchom Analizę'}
                </button>
            </div>
            
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mb-6">{error}</p>}
            
            <div className="space-y-4">
                {alerts.length > 0 ? alerts.map(alert => {
                    const colors = getRiskColor(alert.level);
                    const isAck = acknowledged.includes(alert.id);
                    return (
                        <div key={alert.id} className={`p-5 rounded-xl shadow-md border ${colors.border} ${colors.bg} ${isAck ? 'opacity-50' : ''} transition-opacity`}>
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                <div className="flex-1">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>{alert.level} Ryzyko</span>
                                    <h4 className={`font-bold text-xl mt-2 ${colors.text}`}>{alert.riskFactor}</h4>
                                </div>
                                <button onClick={() => toggleAcknowledge(alert.id)} className={`w-full md:w-auto flex-shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition ${isAck ? 'bg-slate-400 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'}`}>
                                    {isAck ? 'Oznacz jako niezałatwione' : '✓ Zrozumiano'}
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-semibold text-slate-600 text-sm mb-1">Dowody w danych:</h5>
                                    <ul className="list-disc pl-5 text-sm text-slate-500 space-y-1">
                                        {alert.evidence.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                                 <div>
                                    <h5 className="font-semibold text-slate-600 text-sm mb-1">Sugerowana strategia prewencyjna:</h5>
                                    <p className="text-sm text-slate-700 bg-white/50 p-2 rounded-md">{alert.strategy}</p>
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    !isLoading && <p className="text-center text-slate-500 py-8">Brak aktywnych alertów. Uruchom analizę, aby sprawdzić potencjalne ryzyka.</p>
                )}
            </div>

        </div>
    );
};

export default EarlyWarningSystem;