
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ConversationReport, ABCEvent, JournalEntry } from '../types';
import { generateProgressReport } from '../services/geminiService';
import { renderMarkdownSafe } from '../utils/markdown';

interface ProgressTrackerProps {
    reports: ConversationReport[];
    abcEvents: ABCEvent[];
    successEntries: JournalEntry[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ reports, abcEvents, successEntries }) => {
    const { t } = useTranslation();
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const hasData = reports.length > 0 || abcEvents.length > 0 || successEntries.length > 0;

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError('');
        setReport(null);
        try {
            const result = await generateProgressReport(reports, abcEvents, successEntries);
            setReport(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('dashboard.cards.progressTracker.title')}</h2>
                <p className="text-slate-500 mb-6">{t('dashboard.cards.progressTracker.description')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8">
                <h3 className="text-lg font-bold text-sky-700">Generator Raportu Postępów</h3>
                <p className="text-sm text-slate-500 my-2">Naciśnij przycisk, aby Gemini przeanalizowało wszystkie zebrane dane i stworzyło kompleksowy raport o postępach, mocnych stronach i obszarach do dalszej pracy.</p>
                <div className="text-xs text-slate-400 my-2">
                    <p>Użyte dane: {abcEvents.length} zdarzeń ABC, {successEntries.length} wpisów w dzienniku, {reports.length} raportów z rozmów.</p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading || !hasData}
                    className="mt-2 w-full md:w-auto bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <span>Analizuję...</span>
                        </>
                    ) : 'Wygeneruj Raport Postępów'}
                </button>
                 {!hasData && <p className="text-amber-600 text-sm mt-2">Brak wystarczających danych do wygenerowania raportu. Zacznij korzystać z innych modułów.</p>}
            </div>

            {isLoading && (
                 <div className="text-center py-8">
                    <p className="text-slate-500 mt-2">Gemini Pro analizuje dane i tworzy raport... To może zająć chwilę.</p>
                </div>
            )}
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm text-center">{error}</p>}
            
            {report && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-sky-200">
                    <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={renderMarkdownSafe(report)} />
                </div>
            )}
        </div>
    );
};

export default ProgressTracker;
