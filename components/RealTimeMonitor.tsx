
import React, { useState, useEffect, useRef } from 'react';
import { analyzeLiveSpeechChunk } from '../services/geminiService';
import { LiveSpeechAnalysis, PairingConfig } from '../types';
import { cleanAndParseJson } from '../utils/jsonHelpers';

interface Alert {
  id: number;
  message: string;
  type: 'warning' | 'critical' | 'info';
  timestamp: string;
}

interface SensorMetricProps {
    label: string;
    value: number;
    unit: string;
    maxValue: number;
    colorFn: (val: number) => string;
    thresholds: { low: number; high: number };
}

const SensorMetric: React.FC<SensorMetricProps> = ({ label, value, unit, maxValue, colorFn, thresholds }) => {
    const colorClass = colorFn(value);
    
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <label className="flex items-center text-slate-600 font-semibold">
                    <span className={`w-3 h-3 rounded-full mr-2 transition-colors ${colorClass}`}></span>
                    {label}
                </label>
                <span className="text-2xl font-bold text-slate-800">{value.toFixed(0)} <span className="text-sm font-normal text-slate-500">{unit}</span></span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div 
                    className={`h-4 rounded-full transition-all duration-200 ease-out ${colorClass}`} 
                    style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

// --- Local Interface Declarations for Web Speech API to prevent global conflicts ---
interface MonitorSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: MonitorSpeechRecognitionEvent) => void;
    onerror: (event: MonitorSpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface MonitorSpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: MonitorSpeechRecognitionResultList;
}

interface MonitorSpeechRecognitionResultList {
    readonly length: number;
    item(index: number): MonitorSpeechRecognitionResult;
    [index: number]: MonitorSpeechRecognitionResult;
}

interface MonitorSpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): MonitorSpeechRecognitionAlternative;
    [index: number]: MonitorSpeechRecognitionAlternative;
}

interface MonitorSpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface MonitorSpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface RealTimeMonitorProps {
    hiddenMode?: boolean; // If true, shows a child-friendly clock instead of graphs
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ hiddenMode = false }) => {
  const [soundLevel, setSoundLevel] = useState(0);
  const [lightLevel, setLightLevel] = useState(300); 
  const [heartRate, setHeartRate] = useState(85); 

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [transcript, setTranscript] = useState('');
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState({
    sound: { low: 60, high: 85 }, 
    light: { low: 700, high: 900 },
    heartRate: { low: 110, high: 130 },
  });

  const [pairingConfig, setPairingConfig] = useState<PairingConfig>(() => {
      try {
          const saved = localStorage.getItem('mypoint_pairingConfig');
          return saved ? JSON.parse(saved) : { deviceId: '', pairedDeviceId: null, parentEmail: '' };
      } catch { return { deviceId: '', pairedDeviceId: null, parentEmail: '' }; }
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<MonitorSpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastNotificationTime = useRef<number>(0);
  
  const lastFrameTimeRef = useRef<number>(0);

  const requestNotificationPermission = async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await Notification.requestPermission();
      }
  };

  const sendRemoteAlert = (title: string, body: string) => {
      if (pairingConfig.parentEmail) {
          console.log(`[SIMULATED EMAIL] To: ${pairingConfig.parentEmail} | Subject: ${title} | Body: ${body}`);
      }
  };

  const triggerSystemNotification = (title: string, body: string) => {
      const now = Date.now();
      if (now - lastNotificationTime.current < 5000) return;

      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { 
              body, 
              icon: '/vite.svg',
              tag: 'mypoint-critical-alert' 
          });
      }
      sendRemoteAlert(title, body);
      lastNotificationTime.current = now;
  };

  const startAudioAnalysis = async (stream: MediaStream) => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4; 
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = (timestamp: number) => {
          if (!analyserRef.current) return;
          
          // THROTTLING: Only update state every 100ms (10fps) to save CPU
          if (timestamp - lastFrameTimeRef.current > 100) {
              analyserRef.current.getByteFrequencyData(dataArray);
              
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i] * dataArray[i];
              }
              const rms = Math.sqrt(sum / dataArray.length);
              
              const normalizedVol = Math.min(100, (rms / 255) * 200); 
              setSoundLevel(prev => prev * 0.8 + normalizedVol * 0.2); 

              if (normalizedVol > thresholds.sound.high) {
                   addAlert("WYKRYTO KRZYK / GŁOŚNY DŹWIĘK!", "critical");
                   triggerSystemNotification("MyPoint Alert", "Wykryto bardzo głośny dźwięk (krzyk/płacz)!");
              }
              
              lastFrameTimeRef.current = timestamp;
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      animationFrameRef.current = requestAnimationFrame(checkVolume);
  };

  const startSpeechRecognition = () => {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) return;

      // Cast to unknown then to our local interface to satisfy TS
      const recognition = new SpeechRecognitionConstructor() as unknown as MonitorSpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = false; 
      recognition.lang = 'pl-PL';

      recognition.onresult = async (event: MonitorSpeechRecognitionEvent) => {
          const lastResultIndex = event.results.length - 1;
          const text = event.results[lastResultIndex][0].transcript.trim();
          
          if (text) {
              setTranscript(prev => (prev + ' ' + text).slice(-200)); 
              
              try {
                  const analysisResult = await analyzeLiveSpeechChunk(text);
                  const analysis = cleanAndParseJson<Partial<LiveSpeechAnalysis> & { hasDisturbingContent?: boolean; disturbingContentAlert?: string; isCryingOrScreaming?: boolean }>(analysisResult);

                  if (analysis.hasDisturbingContent) {
                      const msg = analysis.disturbingContentAlert || "Wykryto niepokojące treści w mowie.";
                      addAlert(msg.toUpperCase(), 'critical');
                      triggerSystemNotification("MyPoint: Treść Zabroniona", msg);
                  }
                  
                  if (analysis.isCryingOrScreaming) {
                      const msg = "Dziecko werbalizuje ból lub strach.";
                      addAlert(msg, 'critical');
                      triggerSystemNotification("MyPoint: Zgłoszenie Bólu", msg);
                  }

              } catch (e) {
                  console.error("Analysis error", e);
              }
          }
      };

      recognition.onerror = (e: MonitorSpeechRecognitionErrorEvent) => { 
          console.warn("Speech recognition error:", e.error);
          if (e.error === 'not-allowed') {
              setAudioError("Brak uprawnień do mikrofonu.");
              stopMonitoring();
          }
      };
      
      recognition.onend = () => {
          if (isMonitoring && recognitionRef.current) {
              try { recognition.start(); } catch(e){}
          }
      };

      recognitionRef.current = recognition;
      try {
          recognition.start();
      } catch (e) {
          console.error("Failed to start recognition", e);
      }
  };

  const startMonitoring = async () => {
      setAudioError('');
      await requestNotificationPermission();

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          
          await startAudioAnalysis(stream);
          startSpeechRecognition();
          
          setIsMonitoring(true);
      } catch (err) {
          console.error("Microphone error:", err);
          setAudioError("Brak dostępu do mikrofonu. Sprawdź uprawnienia.");
      }
  };

  const stopMonitoring = () => {
      if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
      }
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
      }
      setIsMonitoring(false);
      setSoundLevel(0);
  };

  const addAlert = (message: string, type: Alert['type']) => {
      setAlerts(prev => {
          const lastAlert = prev[0];
          if (lastAlert && lastAlert.message === message && (Date.now() - new Date(lastAlert.timestamp).getTime() < 5000)) {
              return prev;
          }
          return [{ id: Date.now(), message, type, timestamp: new Date().toISOString() }, ...prev].slice(0, 5);
      });
  };

  useEffect(() => {
      if (hiddenMode && !isMonitoring) {
          startMonitoring();
      }
  }, [hiddenMode]);

  useEffect(() => {
      if (hiddenMode) {
          const checkRemote = setInterval(() => {
             const config = localStorage.getItem('mypoint_pairingConfig');
             if(config) {
                 const parsed = JSON.parse(config);
                 setPairingConfig(parsed);
             }
          }, 3000);
          return () => clearInterval(checkRemote);
      }
  }, [hiddenMode]);


  useEffect(() => {
      const interval = setInterval(() => {
          setLightLevel(prev => Math.max(100, Math.min(1100, prev + (Math.random() - 0.5) * 50)));
          setHeartRate(prev => Math.max(60, Math.min(145, prev + (Math.random() - 0.5) * 5)));
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      return () => stopMonitoring();
  }, []);

  const getStatusColor = (value: number, thresholds: { low: number, high: number }) => {
    if (value > thresholds.high) return 'bg-red-500';
    if (value > thresholds.low) return 'bg-yellow-500';
    return 'bg-teal-500';
  };

  if (hiddenMode) {
      const currentTime = new Date();
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-400 to-indigo-500 text-white p-8">
              <div className="text-center">
                  <p className="text-8xl font-bold font-mono mb-4">{currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-2xl opacity-80">{currentTime.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              
              <div className="mt-12 flex gap-6">
                  <div className="flex flex-col items-center opacity-60">
                      <span className="text-4xl mb-2">❤️</span>
                      <span>{heartRate.toFixed(0)} BPM</span>
                  </div>
                   <div className="flex flex-col items-center text-green-200 animate-pulse">
                         <span className="text-4xl mb-2">🛡️</span>
                         <span className="text-xs">Ochrona aktywna</span>
                   </div>
              </div>

              {audioError && <p className="absolute bottom-4 text-red-200 text-xs opacity-50">{audioError}</p>}
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Centrum Monitoringu Rodzica</h2>
      <p className="text-slate-500 mb-8">Pasywny system analizy zagrożeń. System powiadomi Cię TYLKO w przypadku wykrycia krzyku, płaczu lub słów alarmowych (np. "pomocy").</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg border transition-all ${isMonitoring ? 'bg-sky-50 border-sky-200 shadow-sky-100' : 'bg-white border-slate-100'}`}>
                <h3 className="text-lg font-bold text-sky-700 mb-4 flex items-center gap-2">
                    {isMonitoring && <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>}
                    System Wczesnego Ostrzegania (Sentry Mode)
                </h3>
                <div className="flex flex-col items-center">
                    <p className="text-sm text-slate-500 mb-4 text-center">
                        System lokalnie analizuje dźwięki. W przypadku wykrycia anomalii, wysłane zostanie powiadomienie systemowe i e-mail (jeśli skonfigurowano).
                    </p>
                    <button
                        onClick={isMonitoring ? stopMonitoring : startMonitoring}
                        className={`w-full font-bold py-4 px-6 rounded-xl transition shadow-md text-lg ${isMonitoring ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
                    >
                        {isMonitoring ? 'Dezaktywuj Ochronę' : 'Aktywuj Ochronę Lokalną'}
                    </button>
                    {audioError && <p className="text-red-600 text-sm mt-2 text-center font-semibold">{audioError}</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Sensory na Żywo</h3>
                <div className="space-y-6">
                    <SensorMetric 
                        label="Poziom Hałasu (Mikrofon)" 
                        value={soundLevel} 
                        unit="%" 
                        maxValue={100}
                        thresholds={thresholds.sound}
                        colorFn={(val) => getStatusColor(val, thresholds.sound)}
                    />
                    <SensorMetric 
                        label="Natężenie Światła (Symulacja)" 
                        value={lightLevel} 
                        unit="lux" 
                        maxValue={1200}
                        thresholds={thresholds.light}
                        colorFn={(val) => getStatusColor(val, thresholds.light)}
                    />
                    <SensorMetric 
                        label="Tętno Dziecka (Symulacja Smartwatch)" 
                        value={heartRate} 
                        unit="BPM" 
                        maxValue={160}
                        thresholds={thresholds.heartRate}
                        colorFn={(val) => getStatusColor(val, thresholds.heartRate)}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Dziennik Zdarzeń Krytycznych</h3>
                {alerts.length > 0 ? (
                    <div className="space-y-3">
                        {alerts.map(alertItem => (
                             <div key={alertItem.id} className={`p-4 rounded-lg border-l-4 flex justify-between items-center animate-pulse-once ${
                                 alertItem.type === 'critical' ? 'bg-red-100 border-red-500 text-red-800' : 
                                 alertItem.type === 'warning' ? 'bg-amber-100 border-amber-500 text-amber-800' : 
                                 'bg-sky-100 border-sky-500 text-sky-800'
                             }`}>
                                <div>
                                    <p className="font-bold">{alertItem.message}</p>
                                    <p className="text-xs opacity-70">{new Date(alertItem.timestamp).toLocaleTimeString()}</p>
                                </div>
                                {alertItem.type === 'critical' && <span className="text-2xl">🚨</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4">Brak wykrytych zagrożeń. Otoczenie jest spokojne.</p>
                )}
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-64 flex flex-col">
                 <h3 className="text-lg font-bold text-sky-700 mb-2">Nasłuch Treści (Lokalny)</h3>
                 <div className="flex-1 bg-slate-50 rounded-lg p-3 overflow-y-auto text-sm text-slate-600 italic border border-slate-200">
                     {transcript || "System oczekuje na dźwięk..."}
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Transkrypcja dzieje się lokalnie. Tylko słowa kluczowe wyzwalają alert.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Ustawienia Czułości (Progi)</h3>
                <div className="space-y-4">
                    <div>
                      <label htmlFor="sound-threshold" className="block text-sm font-medium text-slate-700 mb-1">
                        Alarm Hałasu (Krzyk): <span className="font-bold text-sky-600">{thresholds.sound.high}%</span>
                      </label>
                      <input id="sound-threshold" type="range" min="50" max="95" value={thresholds.sound.high}
                        onChange={(e) => setThresholds(prev => ({...prev, sound: {...prev.sound, high: parseInt(e.target.value)}}))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-lg font-bold text-sky-700 mb-4">Status Systemu</h3>
                <div className="space-y-3">
                     <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-600">Mikrofon</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isMonitoring ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isMonitoring ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-600">Analiza AI (Treść)</span>
                         <span className={`text-xs font-bold px-2 py-1 rounded ${isMonitoring ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                            {isMonitoring ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-600">Powiadomienia</span>
                         <span className={`text-xs font-bold px-2 py-1 rounded ${'Notification' in window && Notification.permission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {'Notification' in window && Notification.permission === 'granted' ? 'Zezwolono' : 'Brak Zgody'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};
