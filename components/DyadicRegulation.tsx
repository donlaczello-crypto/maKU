
import React, { useState } from 'react';
import { generateDyadicExercise } from '../services/geminiService';
import { DyadicExercise } from '../types';

const goals = [
    "Chcemy się razem uspokoić",
    "Chcę lepiej zrozumieć, co czuje moje dziecko",
    "Chcemy się połączyć po trudnym dniu",
    "Chcemy się razem pobawić i pośmiać"
];

const DyadicRegulation: React.FC = () => {
    const [selectedGoal, setSelectedGoal] = useState<string>('');
    const [exercise, setExercise] = useState<DyadicExercise | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedGoal) {
            setError('Proszę wybrać cel.');
            return;
        }
        setError('');
        setIsLoading(true);
        setExercise(null);
        try {
            const result = await generateDyadicExercise(selectedGoal);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setExercise(parsedResult);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania ćwiczenia. Sprawdź format odpowiedzi z API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Ćwiczenia Razem (Regulacja Diadyczna)</h2>
            <p className="text-slate-500 mb-6">Wzmacniaj więź poprzez krótkie, interaktywne ćwiczenia do wykonania z dzieckiem.</p>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-sky-700 mb-3">1. Wybierz cel na dziś</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {goals.map(goal => (
                            <button
                                key={goal}
                                onClick={() => setSelectedGoal(goal)}
                                className={`p-4 rounded-lg text-left transition border-2 text-sm ${selectedGoal === goal ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-400'}`}
                            >
                                {goal}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                
                <button
                    onClick={handleSubmit}
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={isLoading || !selectedGoal}
                >
                    {isLoading ? 'Generuję ćwiczenie...' : 'Stwórz nasze ćwiczenie'}
                </button>
            </div>

            {isLoading && (
                <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-slate-500 mt-2">Asystent tworzy dla Was ćwiczenie...</p>
                </div>
            )}

            {exercise && (
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border-2 border-sky-200">
                     <h3 className="text-2xl font-bold text-sky-800 text-center mb-2">{exercise.title}</h3>
                     <p className="text-center text-slate-500 mb-6 italic">Cel: {exercise.goal}</p>

                     <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-lg text-slate-700 mb-2 border-b pb-2">Instrukcja dla Ciebie (Opiekun):</h4>
                            <ul className="list-decimal pl-5 space-y-2 text-slate-600">
                                {exercise.caregiverInstructions.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-bold text-lg text-slate-700 mb-2 border-b pb-2">Co możesz powiedzieć dziecku:</h4>
                            <div className="bg-sky-50 p-4 rounded-lg border-l-4 border-sky-400">
                                {exercise.childScript.map((line, i) => <p key={i} className="italic text-sky-800">"{line}"</p>)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-700 mb-2 border-b pb-2">Dlaczego to działa?</h4>
                            <p className="text-sm text-slate-600">{exercise.rationale}</p>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default DyadicRegulation;