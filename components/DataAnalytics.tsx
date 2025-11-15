
import React, { useState, useEffect } from 'react';
import { getComplexDataAnalysis } from '../services/geminiService';

interface AnalysisData {
  prediction: {
    riskLevel: 'Niskie' | 'Umiarkowane' | 'Wysokie';
    factors: string[];
  };
  heatmapData: { day: number; time: number; intensity: number }[];
  correlationData: {
    antecedents: string[];
    behaviors: string[];
    matrix: number[][];
  };
  escalationPaths: { path: string[]; count: number }[];
}

const DataAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const dataSummary = "W ciągu ostatnich 7 dni zanotowano 15 zdarzeń ABC, głównie popołudniami (krzyk, rzucanie przedmiotami). Kluczowe poprzedniki to 'odmowa dostępu do tabletu' i 'konieczność odrobienia pracy domowej'. Dane ze smartwatcha wskazują na podwyższone tętno w tych momentach i skrócony sen w noce poprzedzające trudne dni. Zbliża się weekend, co zwykle wiąże się ze zmianą rutyny.";
        const result = await getComplexDataAnalysis(dataSummary);
        const parsedData = JSON.parse(result);
        setData(parsedData);
      } catch (err) {
        setError('Nie udało się załadować analizy danych. Spróbuj odświeżyć stronę.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIntensityColor = (intensity: number, max: number = 5) => {
    if (intensity === 0) return 'bg-slate-100';
    const opacity = intensity / max;
    return `bg-sky-500`;
  };

  if (isLoading) {
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto text-center">
            <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-slate-500 mt-2">Analizuję dane przy użyciu Gemini 2.5 Pro... To może chwilę potrwać.</p>
        </div>
    );
  }
  
  if (error) {
    return <div className="p-4 md:p-8 max-w-6xl mx-auto text-center text-red-600 bg-red-100 rounded-lg">{error}</div>;
  }
  
  if (!data) {
    return <div className="p-4 md:p-8 max-w-6xl mx-auto text-center text-slate-500">Brak danych do wyświetlenia.</div>;
  }
  
  const getRiskColor = (level: 'Niskie' | 'Umiarkowane' | 'Wysokie') => {
    switch(level) {
        case 'Wysokie': return 'text-red-600 bg-red-100';
        case 'Umiarkowane': return 'text-amber-600 bg-amber-100';
        default: return 'text-teal-600 bg-teal-100';
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Analiza Danych i Predykcje</h2>
      <p className="text-slate-500 mb-8">Odkrywaj wzorce, aby lepiej rozumieć i proaktywnie wspierać dziecko.</p>
      
      <div className="space-y-8">
        {/* Prediction Engine */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Prognoza na 24h (Prediction Engine)</h3>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                    <p className="text-slate-600">Szacowane ryzyko trudnych zachowań:</p>
                    <p className={`text-2xl font-bold my-1 px-3 py-1 rounded-md inline-block ${getRiskColor(data.prediction.riskLevel)}`}>{data.prediction.riskLevel}</p>
                </div>
                <div className="flex-1 w-full">
                     <p className="font-semibold text-slate-700">Kluczowe czynniki do obserwacji:</p>
                     <ul className="list-disc pl-5 text-slate-500 text-sm mt-1 space-y-1">
                        {data.prediction.factors.map(f => <li key={f}>{f}</li>)}
                     </ul>
                </div>
            </div>
        </div>

        {/* Temporal Patterns Heatmap */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Mapa Ciepła Wzorców Czasowych</h3>
            <div className="grid grid-cols-8 gap-1 text-center text-xs font-semibold">
                <div />
                {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(d => <div key={d} className="text-slate-500">{d}</div>)}
                
                {['Rano', 'Południe', 'Popołudnie', 'Wieczór'].map((time, timeIdx) => (
                    <React.Fragment key={time}>
                        <div className="text-slate-500 self-center">{time}</div>
                        {[...Array(7)].map((_, dayIdx) => {
                            const heatmapCell = data.heatmapData.find(d => d.day === dayIdx && d.time === timeIdx);
                            const intensity = heatmapCell ? heatmapCell.intensity : 0;
                            const color = getIntensityColor(intensity, 5);
                            const opacity = intensity === 0 ? 1 : 0.2 + (intensity / 5) * 0.8;
                             return <div key={`${dayIdx}-${timeIdx}`} className={`h-10 rounded ${color}`} style={{ opacity: opacity }} title={`Zdarzenia: ${intensity}`}></div>
                        })}
                    </React.Fragment>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Im ciemniejszy kolor, tym większa częstotliwość zarejestrowanych zdarzeń.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Correlation Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Analiza Korelacji: Poprzednik → Zachowanie</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead>
                            <tr>
                                <th className="p-2"></th>
                                {data.correlationData.behaviors.map(b => <th key={b} className="p-2 font-bold text-sky-800 text-center">{b}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.correlationData.antecedents.map((a, aIdx) => (
                                <tr key={a} className="border-t border-slate-200">
                                    <td className="p-2 font-bold text-sky-800">{a}</td>
                                    {data.correlationData.matrix[aIdx].map((val, bIdx) => {
                                        const opacity = val === 0 ? 0.1 : 0.2 + (val/5) * 0.8;
                                        return <td key={bIdx} className="p-2 text-center"><div className="w-10 h-10 rounded-lg bg-amber-500 mx-auto" style={{ opacity: opacity }} title={`Siła korelacji: ${val}`}></div></td>
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <p className="text-xs text-slate-400 mt-2 text-center">Im ciemniejszy kolor, tym silniejszy związek między poprzednikiem a zachowaniem.</p>
            </div>

            {/* Escalation Sequences */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                 <h3 className="text-lg font-bold text-sky-700 mb-4">Najczęstsze Sekwencje Eskalacji</h3>
                 <div className="space-y-3">
                    {data.escalationPaths.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm text-slate-700 flex-wrap">
                                {item.path.map((step, stepIdx) => (
                                    <React.Fragment key={stepIdx}>
                                        <span>{step}</span>
                                        {stepIdx < item.path.length - 1 && <span className="text-sky-500 font-bold">→</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-right mt-1">Liczba wystąpień: {item.count}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DataAnalytics;
