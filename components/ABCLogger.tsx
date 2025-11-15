import React, { useState, useEffect, useRef } from 'react';
import { RegulationState, LinkedDrawingData } from '../types';
import Icon from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';

const commonAntecedents = ["Zmiana rutyny", "Bodźce sensoryczne (np. hałas)", "Odmowa/Zakaz", "Polecenie/Prośba", "Nuda", "Zmęczenie", "Głód"];
const commonConsequences = ["Uwaga dorosłego", "Otrzymanie przedmiotu", "Ucieczka od zadania", "Naturalna konsekwencja", "Brak reakcji"];

interface ABCLoggerProps {
    linkedDrawing: LinkedDrawingData | null;
    onClearLinkedDrawing: () => void;
}

const ABCLogger: React.FC<ABCLoggerProps> = ({ linkedDrawing, onClearLinkedDrawing }) => {
  const [behaviorName, setBehaviorName] = useState('');
  const [count, setCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(false);
  // Fix: In a browser environment, setInterval returns a number, not a NodeJS.Timeout object.
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
    // In a real app, this would save to a database or state management store
    console.log({
        behaviorName, count, duration,
        antecedents: [...selectedAntecedents, customAntecedent].filter(Boolean),
        consequence: customConsequence || selectedConsequence,
        regulationState, triggers,
        linkedDrawing,
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
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-sky-200">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Połączona Analiza Rysunku</h3>
                    <button type="button" onClick={onClearLinkedDrawing} className="text-sm text-red-500 hover:underline flex-shrink-0">
                        Odłącz
                    </button>
                </div>
                <div className="flex items-start gap-4">
                    <img src={`data:image/jpeg;base64,${linkedDrawing.imageBase64}`} alt="Połączony rysunek" className="w-24 h-24 rounded-lg object-cover border" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 font-semibold">Kontekst:</p>
                        <p className="text-sm text-slate-500 mb-2 italic truncate">"{linkedDrawing.context}"</p>
                        <p className="text-sm text-slate-600 font-semibold">Analiza (fragment):</p>
                        <p className="text-sm text-slate-500">{linkedDrawing.analysis.length > 150 ? `${linkedDrawing.analysis.substring(0, 150)}...` : linkedDrawing.analysis}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Behavior */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-sky-700 mb-4">B: Zachowanie (Behavior)</h3>
          <p className="text-sm text-slate-500 mb-4">Co się wydarzyło? Opisz zachowanie, policz wystąpienia i zmierz czas trwania.</p>
          <input
            type="text"
            value={behaviorName}
            onChange={(e) => setBehaviorName(e.target.value)}
            placeholder="Np. krzyk, rzucanie przedmiotem"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-lg">
                <span className="text-3xl font-bold text-slate-700">{count}</span>
                <span className="text-sm text-slate-500 mb-2">Licznik One-Tap</span>
                <button type="button" onClick={() => setCount(c => c + 1)} className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition flex items-center justify-center"><Icon name="plus"/> Zwiększ</button>
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-lg">
                <span className="text-3xl font-bold text-slate-700">{formatTime(duration)}</span>
                <span className="text-sm text-slate-500 mb-2">Czas trwania</span>
                <div className="flex w-full space-x-2">
                    <button type="button" onClick={handleToggleTimer} className={`w-full font-bold py-2 px-4 rounded-lg transition ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-500 hover:bg-teal-600'} text-white`}>
                        {isActive ? 'Pauza' : 'Start'}
                    </button>
                    <button type="button" onClick={handleReset} className="w-full bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-400 transition">Reset</button>
                </div>
            </div>
          </div>
        </div>

        {/* Antecedent */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-sky-700 mb-4">A: Poprzednik (Antecedent)</h3>
          <p className="text-sm text-slate-500 mb-4">Co wydarzyło się tuż przed zachowaniem?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {commonAntecedents.map(a => (
                <button type="button" key={a} onClick={() => handleAntecedentToggle(a)} className={`px-3 py-1.5 text-sm rounded-full transition ${selectedAntecedents.includes(a) ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{a}</button>
            ))}
          </div>
          <input type="text" value={customAntecedent} onChange={e => setCustomAntecedent(e.target.value)} placeholder="Inny poprzednik..." className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" />
        </div>
        
        {/* Consequence */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
          <h3 className="text-lg font-bold text-sky-700 mb-4">C: Konsekwencja (Consequence)</h3>
          <p className="text-sm text-slate-500 mb-4">Co wydarzyło się tuż po zachowaniu?</p>
          <div className="flex flex-wrap gap-2 mb-4">
              {commonConsequences.map(c => (
                  <button type="button" key={c} onClick={() => setSelectedConsequence(c)} className={`px-3 py-1.5 text-sm rounded-full transition ${selectedConsequence === c ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{c}</button>
              ))}
          </div>
          <input type="text" value={customConsequence} onChange={e => setCustomConsequence(e.target.value)} placeholder="Inna konsekwencja..." className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" />
        </div>

        {/* Trauma Module */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-amber-200 border">
          <h3 className="text-lg font-bold text-amber-700 mb-4">Moduł Trauma</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Skala Oceny Regulacji (Okno Tolerancji)
                </label>
                {getRegulationIndicator(regulationState)}
              </div>
              <select
                value={regulationState}
                onChange={(e) => setRegulationState(e.target.value as RegulationState)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white"
              >
                <option value={RegulationState.Regulated}>{RegulationState.Regulated}</option>
                <option value={RegulationState.HyperArousal}>{RegulationState.HyperArousal}</option>
                <option value={RegulationState.HypoArousal}>{RegulationState.HypoArousal}</option>
              </select>
            </div>
            <div>
              <label htmlFor="triggers" className="block text-sm font-medium text-slate-700 mb-2">
                Wyzwalacze (Triggers)
              </label>
              <input
                id="triggers"
                type="text"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="Np. głośny dźwięk, konkretne słowo"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
              <p className="text-xs text-slate-500 mt-1">Opisz bodźce, które mogły przypomnieć o traumie.</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
            <button
                type="submit"
                className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition-transform duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400"
                disabled={!behaviorName}
            >
                Zapisz zdarzenie
            </button>
        </div>
      </form>
    </div>
  );
};

export default ABCLogger;