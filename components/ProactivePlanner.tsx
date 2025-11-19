
import React, { useState } from 'react';
import { getProactivePlan } from '../services/geminiService';
import { renderMarkdownSafe } from '../utils/markdown';

const ProactivePlanner: React.FC = () => {
    const [plan, setPlan] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError('');
        setPlan(null);

        // In a real app, this context would be dynamically fetched and summarized from various app modules.
        const dataContext = `
- Logi ABC: Wczorajsze popołudnie było trudne, 2 epizody krzyku po prośbie o wyłączenie bajki. Dziecko było zmęczone.
- Dziennik Sukcesów: Dwa dni temu dziecko pięknie dzieliło się zabawkami z kuzynem.
- Dane ze smartwatcha: Sen ostatniej nocy był o 45 minut krótszy.
- Nadchodzące wydarzenia: Brak zaplanowanych stresujących wydarzeń na dziś.
- Profil Dziecka: Uwielbia dinozaury i budować z klocków.
        `;

        try {
            const result = await getProactivePlan(dataContext);
            setPlan(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Proaktywny Planer</h2>
                <p className="text-slate-500 mb-6">Otrzymuj codzienne, spersonalizowane sugestie i strategie oparte na analizie danych z aplikacji.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 text-center">
                <h3 className="text-lg font-bold text-sky-700">Gotowy na dzisiejszy dzień?</h3>
                <p className="text-sm text-slate-500 my-2">Naciśnij przycisk, aby Gemini przeanalizowało najnowsze dane i przygotowało dla Ciebie spersonalizowany plan wsparcia.</p>
                <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading}
                    className="mt-2 w-full md:w-auto bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center mx-auto"
                >
                    {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <span>Analizuję...</span>
                        </>
                    ) : 'Wygeneruj Plan na Dziś'}
                </button>
            </div>

            {isLoading && (
                 <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-slate-500 mt-2">Gemini Pro tworzy Twój plan...</p>
                </div>
            )}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm text-center">{error}</p>}
            
            {plan && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-sky-200">
                    <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={renderMarkdownSafe(plan)} />
                </div>
            )}
        </div>
    );
};

export default ProactivePlanner;
