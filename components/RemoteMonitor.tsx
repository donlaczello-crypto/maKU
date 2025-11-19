
import React, { useState, useEffect } from 'react';
import { PairingConfig } from '../types';
import { Icon } from './common/Icon';

const RemoteMonitor: React.FC = () => {
    const [pairingConfig, setPairingConfig] = useState<PairingConfig>(() => {
        try {
            const saved = localStorage.getItem('mypoint_pairingConfig');
            return saved ? JSON.parse(saved) : { deviceId: `PARENT-${Date.now()}`, pairedDeviceId: null, parentEmail: '' };
        } catch { return { deviceId: '', pairedDeviceId: null, parentEmail: '' }; }
    });
    const [emailInput, setEmailInput] = useState(pairingConfig.parentEmail);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected'>('disconnected');

    useEffect(() => {
        localStorage.setItem('mypoint_pairingConfig', JSON.stringify(pairingConfig));
    }, [pairingConfig]);

    // Simulate connection logic
    useEffect(() => {
        if (pairingConfig.pairedDeviceId) {
            setConnectionStatus('connected');
        }
    }, [pairingConfig.pairedDeviceId]);

    const handleSaveEmail = () => {
        setPairingConfig(prev => ({ ...prev, parentEmail: emailInput }));
        alert("Adres e-mail do powiadomień krytycznych został zapisany.");
    };

    const childDisplayName = pairingConfig.childName || 'Dziecko';

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Centrum Bezpieczeństwa ({childDisplayName})</h2>
            <p className="text-slate-500 mb-6">Monitoruj status urządzenia dziecka i otrzymuj powiadomienia tylko w sytuacjach kryzysowych.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Status Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Status Połączenia</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-4 h-4 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <p className="font-bold text-slate-700">
                            {connectionStatus === 'connected' ? `${childDisplayName}: OCHRONA AKTYWNA` : 'Brak połączenia'}
                        </p>
                    </div>
                    <p className="text-xs text-slate-400">ID Twojego urządzenia: {pairingConfig.deviceId}</p>
                    <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <p className="text-sm text-slate-600 mb-2">Aby sparować, wprowadź ten kod na telefonie dziecka:</p>
                         <p className="text-2xl font-mono font-bold text-center tracking-widest text-slate-800">{pairingConfig.deviceId}</p>
                    </div>
                </div>

                {/* Notification Settings Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-4">Powiadomienia Krytyczne</h3>
                    <p className="text-sm text-slate-500 mb-4">Otrzymasz natychmiastowy alert e-mail tylko w przypadku wykrycia:</p>
                    <ul className="list-disc pl-5 text-sm text-slate-600 mb-4 space-y-1">
                        <li>Głośnego krzyku lub płaczu (analiza audio)</li>
                        <li>Słów kluczowych zagrożenia (np. "pomocy", "boli", "krew")</li>
                        <li>Nietypowego wzrostu tętna (jeśli podłączono smartwatch)</li>
                    </ul>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Adres e-mail rodzica:</label>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="rodzic@example.com"
                                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                            />
                            <button onClick={handleSaveEmail} className="bg-sky-600 text-white px-4 rounded-lg font-bold hover:bg-sky-700">Zapisz</button>
                        </div>
                        {pairingConfig.parentEmail && <p className="text-xs text-green-600">✓ Alerty aktywne na: {pairingConfig.parentEmail}</p>}
                    </div>
                </div>

                {/* Log Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icon name="warning" className="w-5 h-5 text-amber-500" />
                        Ostatnie Zdarzenia Krytyczne
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 min-h-[150px] flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                        <p>Brak incydentów w ciągu ostatnich 24h. Dziecko jest bezpieczne.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoteMonitor;
