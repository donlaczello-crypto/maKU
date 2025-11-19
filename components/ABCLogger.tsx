
import React, { useState, useEffect, useRef } from 'react';
import { RegulationState, LinkedDrawingData, ABCEvent } from '../types';
import { Icon } from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const commonAntecedents = ["Zmiana rutyny", "Bodźce sensoryczne (np. hałas)", "Odmowa/Zakaz", "Polecenie/Prośba", "Nuda", "Zmęczenie", "Głód", "Przejście/zmiana aktywności", "Frustracja zadaniem", "Interakcja z rówieśnikiem", "Przemęczenie", "Nagła zmiana planów"];
const commonConsequences = ["Uwaga dorosłego", "Otrzymanie przedmiotu", "Ucieczka od zadania", "Naturalna konsekwencja", "Brak reakcji"];

interface ABCLoggerProps {
    linkedDrawing: LinkedDrawingData | null;
    onClearLinkedDrawing: () => void;
    onAddEvent: (event: Omit<ABCEvent, 'id' | 'timestamp'>) => void;
}

const ABCLogger: React.FC<ABCLoggerProps> = ({ linkedDrawing, onClearLinkedDrawing, onAddEvent }) => {
  const [behaviorName, setBehaviorName] = useState('');
  const [count, setCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const [selectedAntecedents, setSelectedAntecedents] = useState<string[]>([]);
  const [customAntecedent, setCustomAntecedent] = useState('');
  const [selectedConsequence, setSelectedConsequence] = useState('');
  const [customConsequence, setCustomConsequence] = useState('');
  const [regulationState, setRegulationState] = useState<RegulationState>(RegulationState.Regulated);
  const [triggers, setTriggers] = useState('');

  useEffect(() => {
    // This effect manages the timer interval.
    // It only runs when the timer is active.
    if (!isActive) {
      return;
    }

    // Start the interval, incrementing the duration every second.
    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // The cleanup function clears the interval when the component
    // unmounts or when `isActive` changes to false.
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  const handleToggleTimer = () => setIsActive(!isActive);
  const handleReset = () => {
    setIsActive(false);
    setDuration(0);
  };
  
  const handleAntecedentToggle = (antecedent: string) => {
    setSelectedAntecedents(prev => 
        prev.includes(antecedent) ? prev.filter(a => a !== antecedent) : [...prev, antecedent]
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent({
        antecedent: [...selectedAntecedents, customAntecedent].filter(Boolean),
        behavior: {
            name: behaviorName,
            count: count,
            durationSeconds: duration,
        },
        consequence: customConsequence || selectedConsequence,
        regulationState: regulationState,
        triggers: triggers.split(',').map(t => t.trim()).filter(Boolean),
    });
    alert("Zdarzenie zapisane!");
    // Reset form
    setBehaviorName('');
    setCount(0);
    handleReset();
    setSelectedAntecedents([]);
    setCustomAntecedent('');
    setSelectedConsequence('');
    setCustomConsequence('');
    setRegulationState(RegulationState.Regulated);
    setTriggers('');
    onClearLinkedDrawing();
  };

  const getRegulationIndicator = (state: RegulationState) => {
    switch(state) {
        case RegulationState.Regulated:
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-teal-100 text-teal-800 border-teal-200">W oknie</span>;
        case RegulationState.HyperArousal:
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-100 text-red-800 border-red-200">Hiper-pobudzenie</span>;
        case RegulationState.HypoArousal:
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-sky-100 text-sky-800 border-sky-200">Hipo-pobudzenie</span>;
        default:
            return null;
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Zapisz nowe zdarzenie (ABC)</h2>
      <p className="text-slate-500 mb-6">Rejestruj dane, aby odkrywać wzorce i lepiej rozumieć potrzeby dziecka.</p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <ConfidentialDataWarning />
        
        {linkedDrawing && (
            <div className="bg-sky-50 border-l-4 border-sky-400 p-4 rounded-r-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-sky-800">Dołączono analizę rysunku</p>
                        <p className="text-sm text-slate-600 italic mt-1">"{linkedDrawing.context}"</p>
                    </div>
                    <button type="button" onClick={onClearLinkedDrawing} className="text-slate-500 hover:text-red-600">
                        <Icon name="trash" />
                    </button>
                </div>
            </div>
        )}

        {/* ANTECEDENT */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">A: Poprzednik (Co się stało tuż przed?)</h3>
            <div className="flex flex-wrap gap-2">
                {commonAntecedents.map(a => (
                    <button type="button" key={a} onClick={() => handleAntecedentToggle(a)} className={`px-3 py-1.5 text-sm rounded-full transition ${selectedAntecedents.includes(a) ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{a}</button>
                ))}
            </div>
            <textarea value={customAntecedent} onChange={e => setCustomAntecedent(e.target.value)} placeholder="Inny, niestandardowy poprzednik..." className="w-full mt-4 p-3 border border-slate-300 rounded-lg h-20 focus:ring-2 focus:ring-sky-500"></textarea>
        </div>

        {/* BEHAVIOR */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">B: Zachowanie (Co zrobiło dziecko?)</h3>
            <input type="text" value={behaviorName} onChange={e => setBehaviorName(e.target.value)} placeholder="Opisz zachowanie, np. 'Krzyk'" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ilość wystąpień</label>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCount(c => Math.max(0, c - 1))} className="p-2 bg-slate-200 rounded-full">-</button>
                        <span className="font-bold text-lg w-12 text-center">{count}</span>
                        <button type="button" onClick={() => setCount(c => c + 1)} className="p-2 bg-slate-200 rounded-full">+</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Czas trwania</label>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xl">{formatTime(duration)}</span>
                        <button type="button" onClick={handleToggleTimer} className={`px-3 py-1 rounded-full text-white ${isActive ? 'bg-red-500' : 'bg-green-500'}`}>{isActive ? 'Stop' : 'Start'}</button>
                        <button type="button" onClick={handleReset} className="p-2 bg-slate-200 rounded-full text-xs">Reset</button>
                    </div>
                </div>
            </div>
        </div>
        
        {/* CONSEQUENCE */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">C: Konsekwencja (Co się stało zaraz po?)</h3>
            <div className="space-y-2">
                {commonConsequences.map(c => (
                    <label key={c} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <input type="radio" name="consequence" value={c} checked={selectedConsequence === c} onChange={(e) => setSelectedConsequence(e.target.value)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300" />
                        <span>{c}</span>
                    </label>
                ))}
            </div>
            <textarea value={customConsequence} onChange={e => setCustomConsequence(e.target.value)} placeholder="Inna, niestandardowa konsekwencja..." className="w-full mt-4 p-3 border border-slate-300 rounded-lg h-20 focus:ring-2 focus:ring-sky-500"></textarea>
        </div>

        {/* Additional info */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Dodatkowe Informacje</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stan regulacji dziecka:</label>
                    <div className="flex flex-wrap gap-2">
                        {(Object.values(RegulationState)).map(state => (
                            <button type="button" key={state} onClick={() => setRegulationState(state)} className={`p-2 rounded-lg text-sm border-2 ${regulationState === state ? 'border-sky-500' : 'border-transparent'}`}>{getRegulationIndicator(state)}</button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Potencjalne wyzwalacze (oddzielone przecinkami):</label>
                    <input type="text" value={triggers} onChange={e => setTriggers(e.target.value)} placeholder="Np. głośny dźwięk, zmiana planów" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                </div>
            </div>
        </div>

        <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition" disabled={!behaviorName}>Zapisz Zdarzenie</button>
      </form>
    </div>
  );
};

export default ABCLogger;
