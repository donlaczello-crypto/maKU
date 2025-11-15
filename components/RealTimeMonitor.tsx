import React, { useState, useEffect, useRef } from 'react';

interface Alert {
  id: number;
  message: string;
  type: 'warning' | 'info';
}

const RealTimeMonitor: React.FC = () => {
  const [soundLevel, setSoundLevel] = useState(0); // dB - starting from 0
  const [lightLevel, setLightLevel] = useState(300); // lux
  const [heartRate, setHeartRate] = useState(85); // BPM
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState({
    sound: { low: 65, high: 75 },
    light: { low: 700, high: 900 },
    heartRate: { low: 110, high: 130 },
  });
  
  // New state for audio monitoring
  const [isMonitoringAudio, setIsMonitoringAudio] = useState(false);
  const [audioError, setAudioError] = useState('');

  // Refs for audio objects and animation frame
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Function to stop audio monitoring and clean up resources
  const stopAudioMonitoring = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    setIsMonitoringAudio(false);
    setSoundLevel(0); // Reset level
  };
  
  // Function to start audio monitoring
  const startAudioMonitoring = async () => {
    stopAudioMonitoring(); // Ensure any previous instances are cleaned up
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Smaller FFT size for faster response
      analyserRef.current = analyser;

      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        // Scale the average volume (0-255 range from analyser) to a more intuitive 0-100 range for the UI.
        const scaledLevel = (average / 140) * 100;
        
        setSoundLevel(Math.min(100, scaledLevel));
        animationFrameIdRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
      setIsMonitoringAudio(true);

    } catch (err) {
      console.error("Microphone access error:", err);
      setAudioError("Nie udało się uzyskać dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki.");
      setIsMonitoringAudio(false);
    }
  };

  const handleToggleMonitoring = () => {
    if (isMonitoringAudio) {
      stopAudioMonitoring();
    } else {
      startAudioMonitoring();
    }
  };

  // Effect to clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, []);


  // Simulate sensor data fluctuations for light and heart rate ONLY
  useEffect(() => {
    const interval = setInterval(() => {
      setLightLevel(prev => Math.max(100, Math.min(1100, prev + (Math.random() - 0.5) * 50)));
      setHeartRate(prev => Math.max(60, Math.min(145, prev + (Math.random() - 0.5) * 5)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update alerts based on thresholds
  useEffect(() => {
    const newAlerts: Alert[] = [];
    if (isMonitoringAudio && soundLevel > thresholds.sound.high) {
        newAlerts.push({
            id: 1,
            message: `Wysoki poziom hałasu (${soundLevel.toFixed(0)} dB). Przekroczono próg ${thresholds.sound.high} dB. Rozważ wyciszenie otoczenia.`,
            type: 'warning',
        });
    }
    if (lightLevel > thresholds.light.high) {
        newAlerts.push({
            id: 2,
            message: `Zbyt intensywne światło (${lightLevel.toFixed(0)} lux). Przekroczono próg ${thresholds.light.high} lux. Rozważ przyciemnienie.`,
            type: 'warning',
        });
    }
    if (heartRate > thresholds.heartRate.high) {
        newAlerts.push({
            id: 3,
            message: `Podwyższone tętno (${heartRate.toFixed(0)} BPM). Przekroczono próg ${thresholds.heartRate.high} BPM. Może wskazywać na stres.`,
            type: 'warning',
        });
    }
    setAlerts(newAlerts);
  }, [soundLevel, lightLevel, heartRate, thresholds, isMonitoringAudio]);

  const handleThresholdChange = (metric: keyof typeof thresholds, type: keyof typeof thresholds[keyof typeof thresholds], value: number) => {
    setThresholds(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [type]: value,
        // Ensure 'low' threshold is always less than 'high'
        ...(type === 'high' && { low: Math.min(prev[metric].low, value - 10) }),
        ...(type === 'low' && { high: Math.max(prev[metric].high, value + 10) }),
      }
    }));
  };

  const getStatusColor = (value: number, thresholds: { low: number, high: number }) => {
    if (value > thresholds.high) return 'bg-red-500';
    if (value > thresholds.low) return 'bg-yellow-500';
    return 'bg-teal-500';
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Monitorowanie na Żywo</h2>
      <p className="text-slate-500 mb-8">Obserwuj dane z sensorów w czasie rzeczywistym, aby proaktywnie wspierać dziecko.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Data & Settings Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Analiza Dźwięku Otoczenia</h3>
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleToggleMonitoring}
                        className={`w-full font-bold py-3 px-4 rounded-lg transition ${isMonitoringAudio ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'} text-white`}
                    >
                        {isMonitoringAudio ? 'Zatrzymaj Analizę' : 'Rozpocznij Analizę Dźwięku'}
                    </button>
                    {audioError && <p className="text-red-600 text-sm mt-2 text-center">{audioError}</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Dane na Żywo</h3>
                <div className="space-y-5">
                    {/* Sound Level */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="flex items-center text-slate-600 font-semibold">
                                <span className={`w-3 h-3 rounded-full mr-2 transition-colors ${getStatusColor(soundLevel, thresholds.sound)}`}></span>
                                Poziom Dźwięku
                            </label>
                            <span className="text-2xl font-bold text-slate-800">{soundLevel.toFixed(0)} <span className="text-sm font-normal text-slate-500">dB (skala względna)</span></span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                            <div className={`h-4 rounded-full transition-all duration-100 ${getStatusColor(soundLevel, thresholds.sound)}`} style={{ width: `${soundLevel}%` }}></div>
                        </div>
                    </div>
                     {/* Light Level */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="flex items-center text-slate-600 font-semibold">
                                <span className={`w-3 h-3 rounded-full mr-2 transition-colors ${getStatusColor(lightLevel, thresholds.light)}`}></span>
                                Natężenie Światła
                            </label>
                             <span className="text-2xl font-bold text-slate-800">{lightLevel.toFixed(0)} <span className="text-sm font-normal text-slate-500">lux</span></span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                            <div className={`h-4 rounded-full transition-all duration-500 ${getStatusColor(lightLevel, thresholds.light)}`} style={{ width: `${(lightLevel / 1200) * 100}%` }}></div>
                        </div>
                    </div>
                     {/* Heart Rate */}
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="flex items-center text-slate-600 font-semibold">
                                <span className={`w-3 h-3 rounded-full mr-2 transition-colors ${getStatusColor(heartRate, thresholds.heartRate)}`}></span>
                                Tętno Dziecka (Smartwatch)
                            </label>
                             <span className="text-2xl font-bold text-slate-800">{heartRate.toFixed(0)} <span className="text-sm font-normal text-slate-500">BPM</span></span>
                        </div>
                         <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                            <div className={`h-4 rounded-full transition-all duration-500 ${getStatusColor(heartRate, thresholds.heartRate)}`} style={{ width: `${(heartRate / 160) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Aktywne Alerty i Wskazówki</h3>
                {alerts.length > 0 ? (
                    <div className="space-y-3">
                        {/* FIX: Renamed `alert` to `alertItem` to avoid shadowing the global `alert` function. */}
                        {alerts.map(alertItem => (
                             <div key={alertItem.id} className={`p-4 rounded-lg ${alertItem.type === 'warning' ? 'bg-amber-100 border-amber-300' : 'bg-sky-100 border-sky-300'} border`}>
                                <p className={`font-semibold ${alertItem.type === 'warning' ? 'text-amber-800' : 'text-sky-800'}`}>{alertItem.message}</p>
                                {alertItem.id === 1 && ( // Only show button for sound alert
                                    <button onClick={() => alert('Przekierowanie do logera ABC z wstępnie wypełnionym poprzednikiem "Wysoki poziom hałasu"...')} className="text-sm font-bold text-sky-700 hover:underline mt-2">
                                        Zarejestruj Zdarzenie ABC (Hałas)
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">Brak aktywnych alertów. Wszystko w normie.</p>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Ustawienia Progów Alertów</h3>
                <div className="space-y-4">
                    <div>
                      <label htmlFor="sound-threshold" className="block text-sm font-medium text-slate-700 mb-1">
                        Próg alertu dla hałasu: <span className="font-bold">{thresholds.sound.high}</span>
                      </label>
                      <input id="sound-threshold" type="range" min="50" max="95" value={thresholds.sound.high}
                        onChange={(e) => handleThresholdChange('sound', 'high', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                    </div>
                    <div>
                      <label htmlFor="light-threshold" className="block text-sm font-medium text-slate-700 mb-1">
                        Próg alertu dla światła: <span className="font-bold">{thresholds.light.high} lux</span>
                      </label>
                      <input id="light-threshold" type="range" min="500" max="1100" step="25" value={thresholds.light.high}
                        onChange={(e) => handleThresholdChange('light', 'high', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                    </div>
                    <div>
                      <label htmlFor="hr-threshold" className="block text-sm font-medium text-slate-700 mb-1">
                        Próg alertu dla tętna: <span className="font-bold">{thresholds.heartRate.high} BPM</span>
                      </label>
                      <input id="hr-threshold" type="range" min="100" max="145" value={thresholds.heartRate.high}
                        onChange={(e) => handleThresholdChange('heartRate', 'high', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Devices Column */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Podłączone Urządzenia</h3>
            <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-800">Mikrofon urządzenia</p>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${isMonitoringAudio ? 'text-teal-600 bg-teal-100' : 'text-slate-500 bg-slate-200'}`}>
                        {isMonitoringAudio ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-800">Smartwatch Dziecka</p>
                    <span className="text-sm font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Połączono</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-800">Kamera w Pokoju</p>
                    <span className="text-sm font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Rozłączono</span>
                </div>
            </div>
            <button className="w-full mt-4 bg-sky-100 text-sky-700 font-bold py-2 px-4 rounded-lg hover:bg-sky-200 transition">
                Zarządzaj urządzeniami
            </button>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;