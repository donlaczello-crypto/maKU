
import React, { useState, useEffect, useRef } from 'react';
import { generateAttentionConcentrator } from '../services/geminiService';
import { AttentionConcentrator } from '../types';

const goals = ["Przygotowanie do nauki", "Wyciszenie po przedszkolu", "Chwila zabawy sensorycznej"];
const sensoryNeeds = ["Potrzebuję stymulacji (więcej energii)", "Potrzebuję wyciszenia (mniej energii)"];
const sounds = [
    { name: 'Deszcz', src: 'https://www.soundjay.com/nature/rain-07.mp3' },
    { name: 'Las', src: 'https://www.soundjay.com/nature/forest-1.mp3' },
    { name: 'Fale', src: 'https://www.soundjay.com/nature/ocean-wave-1.mp3' },
];

const AttentionHub: React.FC = () => {
    const [selectedGoal, setSelectedGoal] = useState<string>('');
    const [selectedNeed, setSelectedNeed] = useState<string>('');
    const [activity, setActivity] = useState<AttentionConcentrator | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerIntervalRef = useRef<number | null>(null);

    // Audio state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentSound, setCurrentSound] = useState<string | null>(null);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerIntervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isTimerRunning, timeLeft]);
    
    const handleGenerate = async () => {
        if (!selectedGoal || !selectedNeed) {
            setError('Proszę wybrać cel i potrzebę sensoryczną.');
            return;
        }
        setError('');
        setIsLoading(true);
        setActivity(null);
        try {
            const result = await generateAttentionConcentrator(selectedGoal, selectedNeed);
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.error);
            } else {
                setActivity(parsedResult);
                setTimeLeft(parsedResult.durationMinutes * 60);
                setIsTimerRunning(false);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas generowania aktywności.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleTimer = () => {
        if (timeLeft > 0) {
            setIsTimerRunning(!isTimerRunning);
        }
    }

    const toggleSound = (src: string) => {
        if (audioRef.current) {
            if (currentSound === src) {
                audioRef.current.pause();
                setCurrentSound(null);
            } else {
                audioRef.current.src = src;
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                setCurrentSound(src);
            }
        }
    };
    
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = activity ? circumference - (timeLeft / (activity.durationMinutes * 60)) * circumference : circumference;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Gemini Kids: Strefa Skupienia</h2>
            <p className="text-slate-500 mb-6">Interaktywne środowisko, które pomaga dziecku w regulacji i koncentracji.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-sky-700 mb-3">1. Jaki jest Wasz cel?</h3>
                        <div className="flex flex-col space-y-2">
                            {goals.map(goal => (
                                <button key={goal} onClick={() => setSelectedGoal(goal)} className={`p-3 rounded-lg text-left transition border-2 ${selectedGoal === goal ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}`}>{goal}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-sky-700 mb-3">2. Jakiej energii potrzebuje dziecko?</h3>
                        <div className="flex flex-col space-y-2">
                            {sensoryNeeds.map(need => (
                                <button key={need} onClick={() => setSelectedNeed(need)} className={`p-3 rounded-lg text-left transition border-2 ${selectedNeed === need ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'}`}>{need}</button>
                            ))}
                        </div>
                    </div>
                     {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                    <button onClick={handleGenerate} disabled={isLoading || !selectedGoal || !selectedNeed} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center">
                        {isLoading ? 'Myślę...' : 'Wygeneruj Aktywność'}
                    </button>
                </div>

                {/* Activity & Tools */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    {activity ? (
                        <div className="text-center flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-2xl font-bold text-sky-800">{activity.title}</h3>
                                <p className="text-slate-600 my-4">{activity.description}</p>
                            </div>
                            
                            {/* Visual Timer */}
                            <div className="relative w-48 h-48 mx-auto my-4 cursor-pointer" onClick={toggleTimer}>
                                <svg className="w-full h-full" viewBox="0 0 140 140">
                                    <circle className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="70" cy="70" />
                                    <circle
                                        className="text-teal-500"
                                        strokeWidth="10"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r={radius}
                                        cx="70"
                                        cy="70"
                                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                </svg>
                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-slate-700">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}</span>
                                    <span className="text-sm text-slate-500">{isTimerRunning ? 'Pauza' : 'Start'}</span>
                                </div>
                            </div>
                            
                            {/* Ambient Sounds */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 mb-2">Dźwięki w tle</h4>
                                <div className="flex justify-center space-x-2">
                                    <audio ref={audioRef} loop />
                                    {sounds.map(sound => (
                                        <button key={sound.name} onClick={() => toggleSound(sound.src)} className={`px-4 py-2 text-sm rounded-full transition ${currentSound === sound.src ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{sound.name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-slate-500">
                            <p>{isLoading ? 'Generuję aktywność...' : 'Wybierz cel i potrzebę, aby wygenerować aktywność dla dziecka.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttentionHub;