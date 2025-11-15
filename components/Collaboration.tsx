
import React from 'react';

const specialists = [
    { name: 'Anna Kowalska', role: 'Psycholog Dziecięcy', avatar: 'AK' },
    { name: 'Piotr Nowak', role: 'Terapeuta SI', avatar: 'PN' },
    { name: 'Ewa Wiśniewska', role: 'Nauczyciel przedszkolny', avatar: 'EW' },
];

const Collaboration: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Współpraca i Komunikacja</h2>
      <p className="text-slate-500 mb-8">Zarządzaj swoim zespołem wsparcia i bezpiecznie udostępniaj informacje.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* My Team Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Twój Zespół Wsparcia</h3>
            <div className="space-y-4">
                {specialists.map(s => (
                    <div key={s.name} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center font-bold">
                            {s.avatar}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{s.name}</p>
                            <p className="text-sm text-slate-500">{s.role}</p>
                        </div>
                    </div>
                ))}
            </div>
             <button className="w-full mt-4 bg-sky-100 text-sky-700 font-bold py-2 px-4 rounded-lg hover:bg-sky-200 transition">
                Zaproś nowego specjalistę
            </button>
        </div>

        {/* Share Reports Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
             <h3 className="text-lg font-bold text-sky-700 mb-4">Udostępnij Raport</h3>
             <p className="text-sm text-slate-500 mb-4">Wygeneruj i udostępnij podsumowanie obserwacji z wybranego okresu.</p>
             <div className="space-y-4">
                <div>
                    <label htmlFor="report-period" className="block text-sm font-medium text-slate-700 mb-1">Okres raportu</label>
                    <select id="report-period" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white">
                        <option>Ostatnie 7 dni</option>
                        <option>Ostatnie 30 dni</option>
                        <option>Ten miesiąc</option>
                        <option>Poprzedni miesiąc</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="share-with" className="block text-sm font-medium text-slate-700 mb-1">Udostępnij dla</label>
                    <select id="share-with" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white">
                        <option>Wszyscy specjaliści</option>
                        {specialists.map(s => <option key={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <button className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition">
                    Wygeneruj i udostępnij
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;