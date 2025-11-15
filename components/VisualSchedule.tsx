import React, { useState } from 'react';
import { generateVisualSchedule } from '../services/geminiService';
import { ScheduleStep } from '../types';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const VisualSchedule: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [schedule, setSchedule] = useState<ScheduleStep[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            setError('Proszę opisać plan dnia.');
            return;
        }
        setError('');
        setIsLoading(true);
        setSchedule([]);
        try {
            const result = await generateVisualSchedule(prompt);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setSchedule(parsedResult.schedule);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania planu. Sprawdź format odpowiedzi z API.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Wizualny Plan Dnia</h2>
            <p className="text-slate-500 mb-6">Wygeneruj prosty plan dnia z obrazkami, aby zwiększyć przewidywalność.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <div>
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Opisz planowane czynności</h3>
                    <ConfidentialDataWarning />
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Np. 'Rano pobudka, śniadanie, mycie zębów, a potem wyjście do przedszkola. Po przedszkolu obiad i zabawa.'"
                        className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        required
                    />
                </div>
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={isLoading || !prompt}
                >
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'Generuję plan...' : 'Stwórz plan dnia'}
                </button>
            </form>
            
            {schedule.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Twój Plan Dnia</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {schedule.map((step, index) => (
                           <div key={index} className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                               <span className="text-5xl">{step.emoji}</span>
                               <p className="text-slate-700 font-semibold">{step.task}</p>
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisualSchedule;
