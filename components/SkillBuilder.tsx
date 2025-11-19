
import React, { useState } from 'react';
import { generateReplacementSkillPlan } from '../services/geminiService';
import { SkillPlan } from '../types';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const behaviorFunctions = [
    "Uzyskanie uwagi",
    "Ucieczka/unikanie zadania",
    "Dostęp do przedmiotu/aktywności",
    "Stymulacja sensoryczna",
];

const SkillBuilder: React.FC = () => {
    const [behavior, setBehavior] = useState('');
    const [behaviorFunction, setBehaviorFunction] = useState('');
    const [plan, setPlan] = useState<SkillPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!behavior || !behaviorFunction) {
            setError('Proszę opisać zachowanie i wybrać jego funkcję.');
            return;
        }
        setError('');
        setIsLoading(true);
        setPlan(null);
        try {
            const result = await generateReplacementSkillPlan(behavior, behaviorFunction);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setPlan(parsedResult);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania planu. Sprawdź format odpowiedzi z API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Trener Umiejętności (FCT/DRA)</h2>
            <p className="text-slate-500 mb-6">Zastąp trudne zachowania nowymi, pozytywnymi umiejętnościami komunikacyjnymi.</p>
            <ConfidentialDataWarning />
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-4 mt-6">
                <div>
                    <label htmlFor="behavior" className="block text-sm font-medium text-slate-700 mb-1">Opisz trudne zachowanie:</label>
                    <input
                        id="behavior"
                        type="text"
                        value={behavior}
                        onChange={(e) => setBehavior(e.target.value)}
                        placeholder="Np. Rzucanie zabawkami"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="function" className="block text-sm font-medium text-slate-700 mb-1">Jaki cel (funkcję) pełni to zachowanie?</label>
                    <select
                        id="function"
                        value={behaviorFunction}
                        onChange={(e) => setBehaviorFunction(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                        required
                    >
                        <option value="" disabled>Wybierz funkcję...</option>
                        {behaviorFunctions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={isLoading || !behavior || !behaviorFunction}
                >
                    {isLoading ? 'Generuję plan...' : 'Stwórz Plan Nauki'}
                </button>
            </form>

            {plan && (
                <div className="mt-8 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-sky-200">
                        <h3 className="text-lg font-bold text-sky-700">Nowa Umiejętność Zastępcza:</h3>
                        <p className="text-2xl font-bold text-slate-800 my-2">{plan.replacementSkill}</p>
                        <p className="text-sm text-slate-600">{plan.rationale}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                         <h3 className="text-lg font-bold text-sky-700 mb-4">Plan Treningu Krok po Kroku:</h3>
                         <div className="space-y-4">
                            {plan.trainingPlan.map(step => (
                                <div key={step.step} className="p-4 bg-slate-50 rounded-lg border-l-4 border-sky-500">
                                    <h4 className="font-bold text-slate-800">{step.title}</h4>
                                    <p className="text-sm text-slate-600">{step.description}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillBuilder;