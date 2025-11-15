
import React from 'react';

// Mock data for demonstration purposes
const prediction = {
  riskLevel: 'Umiarkowane',
  riskColor: 'text-amber-600 bg-amber-100',
  factors: ['Zmęczenie po południu', 'Nadchodząca zmiana rutyny (wizyta u lekarza)', 'Wysoka stymulacja sensoryczna wczoraj'],
};

const heatmapData = [
  // day: 0=Pon, 1=Wt, ... | time: 0=Rano, 1=Południe, 2=Popołudnie, 3=Wieczór
  { day: 0, time: 2, intensity: 3 }, { day: 1, time: 3, intensity: 1 },
  { day: 2, time: 2, intensity: 4 }, { day: 2, time: 3, intensity: 2 },
  { day: 3, time: 0, intensity: 2 }, { day: 4, time: 2, intensity: 5 },
  { day: 5, time: 1, intensity: 2 }, { day: 6, time: 2, intensity: 1 },
];

const correlationData = {
  antecedents: ['Hałas', 'Zmiana rutyny', 'Polecenie', 'Nuda'],
  behaviors: ['Krzyk', 'Rzucanie', 'Płacz', 'Ucieczka'],
  matrix: [
    [4, 2, 3, 1], // Hałas
    [2, 3, 1, 4], // Zmiana rutyny
    [5, 1, 2, 3], // Polecenie
    [1, 4, 1, 2], // Nuda
  ],
};

const escalationPaths = [
    { path: ['Polecenie', 'Odmowa', 'Krzyk'], count: 12 },
    { path: ['Zmiana rutyny', 'Niepokój', 'Płacz', 'Wycofanie'], count: 9 },
    { path: ['Nuda', 'Szukanie uwagi', 'Rzucanie przedmiotem'], count: 7 },
];

const DataAnalytics: React.FC = () => {

  const getIntensityColor = (intensity: number, max: number = 5) => {
    if (intensity === 0) return 'bg-slate-100';
    const opacity = intensity / max;
    return `bg-sky-500`;
  };

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
                    <p className={`text-2xl font-bold ${prediction.riskColor.split(' ')[0]} my-1 px-3 py-1 rounded-md inline-block ${prediction.riskColor.split(' ')[1]}`}>{prediction.riskLevel}</p>
                </div>
                <div className="flex-1 w-full">
                     <p className="font-semibold text-slate-700">Kluczowe czynniki do obserwacji:</p>
                     <ul className="list-disc pl-5 text-slate-500 text-sm mt-1 space-y-1">
                        {prediction.factors.map(f => <li key={f}>{f}</li>)}
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
                            const data = heatmapData.find(d => d.day === dayIdx && d.time === timeIdx);
                            const intensity = data ? data.intensity : 0;
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
                                {correlationData.behaviors.map(b => <th key={b} className="p-2 font-bold text-sky-800 text-center">{b}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {correlationData.antecedents.map((a, aIdx) => (
                                <tr key={a} className="border-t border-slate-200">
                                    <td className="p-2 font-bold text-sky-800">{a}</td>
                                    {correlationData.matrix[aIdx].map((val, bIdx) => {
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
                    {escalationPaths.map((item, index) => (
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