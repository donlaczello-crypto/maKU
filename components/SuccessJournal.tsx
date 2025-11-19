
import React, { useState } from 'react';
import { Icon } from './common/Icon';
import ConfidentialDataWarning from './common/ConfidentialDataWarning';
import { JournalEntry } from '../types';

interface SuccessJournalProps {
    entries: JournalEntry[];
    onAddEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
}

const SuccessJournal: React.FC<SuccessJournalProps> = ({ entries, onAddEntry }) => {
    const [newEntry, setNewEntry] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.trim()) return;

        onAddEntry({ text: newEntry });
        setNewEntry('');
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Dziennik Sukcesów</h2>
            <p className="text-slate-500 mb-6">Zapisuj i celebruj pozytywne chwile, małe i duże osiągnięcia oraz postępy.</p>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8">
                <ConfidentialDataWarning />
                <textarea
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="Co dobrego się dzisiaj wydarzyło? Np. 'Córka samodzielnie ubrała buty' lub 'Mieliśmy spokojne popołudnie bez krzyku'."
                    className="w-full p-3 border border-slate-300 rounded-lg h-28 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    required
                />
                <button
                    type="submit"
                    className="w-full mt-4 bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                    disabled={!newEntry.trim()}
                >
                    <Icon name="plus" />
                    <span className="ml-2">Dodaj wpis</span>
                </button>
            </form>
            
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-700">Twoje Zapisane Sukcesy</h3>
                {entries.length > 0 ? (
                    entries.map(entry => (
                        <div key={entry.id} className="bg-white p-5 rounded-xl shadow-md border border-slate-100 transition-shadow">
                            <p className="text-slate-700">{entry.text}</p>
                            <p className="text-xs text-slate-400 text-right mt-2">{new Date(entry.date).toLocaleString('pl-PL')}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-500 py-8">Brak zapisanych sukcesów. Dodaj swój pierwszy wpis, aby rozpocząć!</p>
                )}
            </div>
        </div>
    );
};

export default SuccessJournal;