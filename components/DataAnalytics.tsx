
import React, { useState, useEffect, useRef } from 'react';
import { getComplexDataAnalysis } from '../services/geminiService';
import { Chart, registerables } from 'chart.js/auto';

// Register Chart.js components
Chart.register(...registerables);

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

// Visual component for risk level
const RiskGauge: React.FC<{ level: 'Niskie' | 'Umiarkowane' | 'Wysokie' }> = ({ level }) => {
    const riskMeta = {
        'Niskie': { angle: -60, color: 'text-teal-500' },
        'Umiarkowane': { angle: 0, color: 'text-amber-500' },
        'Wysokie': { angle: 60, color: 'text-red-500' },
    };
    const { angle, color } = riskMeta[level];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-24">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <path d="M 10 50 A 40 40 0 0 1 30 15.36" fill="none" stroke="#14b8a6" strokeWidth="10" />
                    <path d="M 30 15.36 A 40 40 0 0 1 70 15.36" fill="none" stroke="#f59e0b" strokeWidth="10" />
                    <path d="M 70 15.36 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" strokeWidth="10" />
                </svg>
                <div 
                    className="absolute bottom-0 left-1/2 w-0.5 h-1/2 bg-slate-700 origin-bottom transition-transform duration-700 ease-out" 
                    style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
                ></div>
                <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-slate-700 rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${color}`}>{level}</p>
        </div>
    );
};


const DataAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const escalationChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

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

  useEffect(() => {
    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
    }
    
    if (data?.escalationPaths && escalationChartRef.current) {
        const ctx = escalationChartRef.current.getContext('2d');
        if (ctx) {
            const sortedPaths = [...data.escalationPaths].sort((a, b) => a.count - b.count);
            
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedPaths.map(p => p.path.join(' → ')),
                    datasets: [{
                        label: 'Liczba wystąpień',
                        data: sortedPaths.map(p => p.count),
                        backgroundColor: 'rgba(14, 165, 233, 0.6)',
                        borderColor: 'rgba(14, 165, 233, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: (tooltipItems) => tooltipItems[0].label.replaceAll(' → ', '\n→ ')
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        },
                        y: {
                           ticks: {
                                autoSkip: false,
                                font: {
                                    size: 10
                                }
                           }
                        }
                    }
                }
            });
        }
    }

    return () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
    };
  }, [data]);

  const getIntensityColor = (intensity: number, max: number = 5) => {
    if (intensity === 0) return 'bg-slate-100';
    return `bg-sky-500`; // Always use sky, control with opacity
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Analiza Danych i Predykcje</h2>
      <p className="text-slate-500 mb-8">Odkrywaj wzorce, aby lepiej rozumieć i proaktywnie wspierać dziecko.</p>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4 text-center">Prognoza na 24h (Prediction Engine)</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                    <RiskGauge level={data.prediction.riskLevel} />
                </div>
                <div className="flex-1 w-full">
                     <p className="font-semibold text-slate-700 text-center md:text-left">Kluczowe czynniki do obserwacji:</p>
                     <ul className="list-disc pl-5 text-slate-500 text-sm mt-2 space-y-1">
                        {data.prediction.factors.map(f => <li key={f}>{f}</li>)}
                     </ul>
                </div>
            </div>
        </div>

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
                            const color = getIntensityColor(intensity);
                            const opacity = intensity === 0 ? 1 : 0.2 + (intensity / 5) * 0.8;
                             return <div key={`${dayIdx}-${timeIdx}`} className={`h-10 rounded ${color}`} style={{ opacity: opacity }} title={`Zdarzenia: ${intensity}`}></div>
                        })}
                    </React.Fragment>
                ))}
            </div>
             <div className="flex justify-end items-center mt-2 text-xs text-slate-400 gap-4">
                <span>Mniej zdarzeń</span>
                <div className="flex">
                    <div className="w-4 h-4 rounded-sm bg-sky-500 opacity-20"></div>
                    <div className="w-4 h-4 rounded-sm bg-sky-500 opacity-40"></div>
                    <div className="w-4 h-4 rounded-sm bg-sky-500 opacity-60"></div>
                    <div className="w-4 h-4 rounded-sm bg-sky-500 opacity-80"></div>
                    <div className="w-4 h-4 rounded-sm bg-sky-500 opacity-100"></div>
                </div>
                <span>Więcej zdarzeń</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Analiza Korelacji: Poprzednik → Zachowanie</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead>
                            <tr>
                                <th className="p-2"></th>
                                {data.correlationData.behaviors.map(b => <th key={b} className="p-2 font-bold text-sky-800 text-center text-xs whitespace-nowrap">{b}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.correlationData.antecedents.map((a, aIdx) => (
                                <tr key={a} className="border-t border-slate-200">
                                    <td className="p-2 font-bold text-sky-800 text-xs">{a}</td>
                                    {data.correlationData.matrix[aIdx].map((val, bIdx) => {
                                        const opacity = val === 0 ? 0.05 : 0.15 + (val/5) * 0.85;
                                        return <td key={bIdx} className="p-2 text-center"><div className="w-8 h-8 rounded-lg bg-amber-500 mx-auto transition-opacity" style={{ opacity: opacity }} title={`Siła korelacji: ${val}`}></div></td>
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end items-center mt-2 text-xs text-slate-400 gap-4">
                    <span>Słaba korelacja</span>
                    <div className="flex">
                        <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-20"></div>
                        <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-40"></div>
                        <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-60"></div>
                        <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-80"></div>
                        <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-100"></div>
                    </div>
                    <span>Silna korelacja</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col">
                 <h3 className="text-lg font-bold text-sky-700 mb-4">Najczęstsze Sekwencje Eskalacji</h3>
                 <div className="relative flex-1 min-h-[250px]">
                    <canvas ref={escalationChartRef}></canvas>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalytics;