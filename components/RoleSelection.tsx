
import React, { useState } from 'react';
import { Icon } from './common/Icon';
import { AppRole } from '../types';

interface RoleSelectionProps {
    onSetupComplete: (data: { role: AppRole, parentName: string, childName: string, goals: string }) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSetupComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [role, setRole] = useState<AppRole>(null);
    const [parentName, setParentName] = useState('');
    const [childName, setChildName] = useState('');
    const [goals, setGoals] = useState('');

    const handleRoleSelect = (selectedRole: AppRole) => {
        setRole(selectedRole);
        setStep(2);
    };

    const handleNamesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parentName && childName) {
            setStep(3);
        }
    };

    const handleGoalsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSetupComplete({ role, parentName, childName, goals });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 text-center transition-all duration-500">
                
                {/* Header - New Branding */}
                <div className="mb-10">
                     <div className="flex flex-col items-center leading-none select-none mb-4">
                        {/* "My Point!" - Main Title, English */}
                        <div className="flex items-end mb-2">
                            <span className="text-6xl text-sky-600 transform -rotate-3 inline-block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                                My Point
                            </span>
                            <span className="text-6xl text-sky-600 transform -rotate-3 inline-block font-bold ml-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>!</span>
                        </div>
                        
                        {/* Motto Line */}
                        <div className="flex flex-col items-center">
                            {/* "Mój punkt myślenia" - Child annotation, Polish */}
                            <span className="text-lg text-slate-400 mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                                Mój punkt myślenia
                            </span>
                            
                            {/* ": Wasz punkt widzenia." - Adult formal, Polish */}
                            <span className="text-lg text-slate-500 italic font-serif" style={{ fontFamily: "'Lora', serif" }}>
                                : Wasz punkt widzenia.
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                        <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                    </div>
                </div>

                {/* STEP 1: SELECT ROLE */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Kto używa tego telefonu?</h1>
                        <p className="text-slate-500 mb-6">Wybierz rolę, aby skonfigurować odpowiednie funkcje.</p>
                        
                        <button 
                            onClick={() => handleRoleSelect('Parent')}
                            className="w-full p-6 rounded-2xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group flex flex-col items-center"
                        >
                            <div className="bg-sky-100 text-sky-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Icon name="settings" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">To jest telefon RODZICA</h3>
                            <p className="text-sm text-slate-500 mt-1">Panel kontrolny, alerty, monitoring.</p>
                        </button>

                        <button 
                            onClick={() => handleRoleSelect('Child')}
                            className="w-full p-6 rounded-2xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all group flex flex-col items-center"
                        >
                            <div className="bg-teal-100 text-teal-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                 <Icon name="gemini-kids" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">To jest telefon DZIECKA</h3>
                            <p className="text-sm text-slate-500 mt-1">Tryb bezpieczny, asystent głosowy.</p>
                        </button>
                    </div>
                )}

                {/* STEP 2: NAMES */}
                {step === 2 && (
                    <form onSubmit={handleNamesSubmit} className="space-y-6 animate-fade-in">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Jak macie na imię?</h1>
                        <p className="text-slate-500 mb-6">Spersonalizujmy Wasze doświadczenie.</p>
                        
                        <div className="text-left space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Imię Rodzica</label>
                                <input 
                                    type="text" 
                                    value={parentName}
                                    onChange={e => setParentName(e.target.value)}
                                    placeholder="Wpisz imię..."
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Imię Dziecka</label>
                                <input 
                                    type="text" 
                                    value={childName}
                                    onChange={e => setChildName(e.target.value)}
                                    placeholder="Wpisz imię..."
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-sky-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-sky-700 transition shadow-lg mt-4">
                            Dalej
                        </button>
                    </form>
                )}

                {/* STEP 3: FUNCTIONS / GOALS */}
                {step === 3 && (
                     <form onSubmit={handleGoalsSubmit} className="space-y-6 animate-fade-in">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Jakie funkcje Cię interesują?</h1>
                        <p className="text-slate-500 mb-6">Opisz krótko, w czym aplikacja ma pomóc (np. "kontrola emocji", "bezpieczeństwo", "lepsza komunikacja").</p>
                        
                        <textarea 
                            value={goals}
                            onChange={e => setGoals(e.target.value)}
                            placeholder="Wpisz swoje cele..."
                            className="w-full p-4 h-32 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition resize-none"
                        />

                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition shadow-lg mt-4">
                            Rozpocznij
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default RoleSelection;
