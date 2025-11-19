
import React, { useState, useEffect } from 'react';
import { View, LinkedDrawingData, ConversationReport, ABCEvent, JournalEntry, ChildProfile, AssistantPersona, AppRole, PairingConfig, UserSubscription, PremiumFeature } from './types';
import Header from './components/common/Header';
import Dashboard from './components/Dashboard';
import ABCLogger from './components/ABCLogger';
import DrawingInterpreter from './components/DrawingInterpreter';
import StrategyGuide from './components/StrategyGuide';
import VisualSchedule from './components/VisualSchedule';
import ResourceLibrary from './components/ResourceLibrary';
import { RealTimeMonitor } from './components/RealTimeMonitor';
import DataAnalytics from './components/DataAnalytics';
import SpeechInterpreter from './components/SpeechInterpreter';
import RealTimeSpeechMonitor from './components/RealTimeSpeechMonitor';
import EarlyWarningSystem from './components/EarlyWarningSystem';
import SuccessJournal from './components/SuccessJournal';
import SkillBuilder from './components/SkillBuilder';
import EscalationMonitor from './components/EscalationMonitor';
import DyadicRegulation from './components/DyadicRegulation';
import AttentionHub from './components/AttentionHub';
import { GeminiKids } from './components/GeminiKids';
import Smartwatch from './components/Smartwatch';
import LoyaltyProgram from './components/LoyaltyProgram';
import ImageEditor from './components/ImageEditor';
import VideoAnalyzer from './components/VideoAnalyzer';
import VideoGenerator from './components/VideoGenerator';
import LocalResources from './components/LocalResources';
import ConversationArchive from './components/ConversationArchive';
import ProactivePlanner from './components/ProactivePlanner';
import PrivacySettings from './components/PrivacySettings';
import ProgressTracker from './components/ProgressTracker';
import RoleSelection from './components/RoleSelection';
import RemoteMonitor from './components/RemoteMonitor';
import UpgradeView from './components/UpgradeView'; // Import UpgradeView
import { loadFromLocalStorage, saveToLocalStorage, storageKeys, clearAllAppData } from './utils/storage';

// Map features to views for locking
const premiumFeatureMap: Partial<Record<View, PremiumFeature>> = {
    [View.GeminiKids]: PremiumFeature.AI_Assistant,
    [View.RealTimeSpeechMonitor]: PremiumFeature.AI_Assistant,
    [View.SpeechInterpreter]: PremiumFeature.AI_Assistant,
    [View.VideoAnalyzer]: PremiumFeature.Video_Analysis,
    [View.VideoGenerator]: PremiumFeature.Video_Analysis,
    [View.DataAnalytics]: PremiumFeature.Deep_Analytics,
    [View.EarlyWarningSystem]: PremiumFeature.Deep_Analytics,
    [View.ProactivePlanner]: PremiumFeature.Deep_Analytics,
    [View.DrawingInterpreter]: PremiumFeature.Creative_Tools,
    [View.ImageEditor]: PremiumFeature.Creative_Tools,
    [View.RemoteMonitor]: PremiumFeature.Remote_Access,
};

const App: React.FC = () => {
  // --- SAFETY CHECK: MISSING API KEY ---
  // This ensures users who deploy without configuring the .env file get a helpful message instead of a crash.
  const isKeyMissing = !process.env.API_KEY || 
                       process.env.API_KEY === 'undefined' || 
                       process.env.API_KEY === 'MISSING_API_KEY' ||
                       process.env.API_KEY.includes('TU_WKLEJ_SWOJ_KLUCZ');

  if (isKeyMissing) {
      return (
           <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
             <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border-2 border-red-100">
               <h1 className="text-2xl font-bold text-red-600 mb-4">Wymagana Konfiguracja</h1>
               <p className="text-slate-600 mb-6 leading-relaxed">
                 Aplikacja MyPoint wymaga klucza <strong>Google Gemini API</strong> do działania. 
                 Wygląda na to, że klucz nie został jeszcze dodany lub jest niepoprawny.
               </p>
               <div className="bg-slate-100 p-4 rounded text-left text-sm font-mono text-slate-800 mb-6 border border-slate-200 overflow-x-auto">
                 <strong>Twój plik .env:</strong><br/>
                 <span className="text-xs text-slate-500 break-all">{process.env.API_KEY ? `API_KEY=${process.env.API_KEY.substring(0, 10)}...` : 'Brak zmiennej API_KEY'}</span><br/><br/>
                 <strong>Instrukcja:</strong><br/>
                 1. Otwórz plik <code>.env</code> w głównym folderze.<br/>
                 2. Zastąp tekst <code>TU_WKLEJ_...</code> swoim kluczem z Google AI Studio.<br/>
                 3. Zapisz plik i odśwież stronę (lub uruchom ponownie serwer).
               </div>
               <a 
                 href="https://aistudio.google.com/app/apikey" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-block bg-sky-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-sky-700 transition shadow-lg"
               >
                 Pobierz Darmowy Klucz API
               </a>
             </div>
           </div>
      );
  }

  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [linkedDrawing, setLinkedDrawing] = useState<LinkedDrawingData | null>(null);
  
  // --- Data Loading ---
  const [appRole, setAppRole] = useState<AppRole>(() => 
    loadFromLocalStorage<AppRole>(storageKeys.APP_ROLE, null)
  );
  
  const [pairingConfig, setPairingConfig] = useState<PairingConfig>(() => 
    loadFromLocalStorage<PairingConfig>(storageKeys.PAIRING_CONFIG, { deviceId: '', pairedDeviceId: null, parentEmail: '' })
  );

  const [abcEvents, setAbcEvents] = useState<ABCEvent[]>(() =>
    loadFromLocalStorage<ABCEvent[]>(storageKeys.ABC_EVENTS, [])
  );

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadFromLocalStorage<JournalEntry[]>(storageKeys.JOURNAL_ENTRIES, [])
  );
  
  const [conversationReports, setConversationReports] = useState<ConversationReport[]>(() =>
    loadFromLocalStorage<ConversationReport[]>(storageKeys.CONVERSATION_REPORTS, [])
  );
    
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>(() =>
    loadFromLocalStorage<ChildProfile[]>(storageKeys.CHILD_PROFILES, [])
  );

  const [subscription, setSubscription] = useState<UserSubscription>(() => 
    loadFromLocalStorage<UserSubscription>(storageKeys.USER_SUBSCRIPTION, { isSubscribed: false, planType: 'none', expiryDate: null, unlockedFeatures: [], hasUsedTrial: false })
  );

  // --- TIME GUARDIAN: Subscription Expiry Check ---
  useEffect(() => {
    const checkSubscriptionExpiry = () => {
      if (subscription.expiryDate && subscription.isSubscribed) {
        const now = new Date().getTime();
        const expiry = new Date(subscription.expiryDate).getTime();

        if (now > expiry) {
          // Subscription or Trial has expired
          console.log("Strażnik Czasu: Subskrypcja/Trial wygasł. Degradacja konta.");
          const expiredSub: UserSubscription = {
            ...subscription,
            isSubscribed: false,
            planType: 'none',
            expiryDate: null
          };
          setSubscription(expiredSub);
          saveToLocalStorage(storageKeys.USER_SUBSCRIPTION, expiredSub);
          
          // If currently on a premium view, force redirect to Upgrade
          if (premiumFeatureMap[currentView]) {
             alert("Twój okres próbny lub subskrypcja wygasły. Funkcje Premium zostały zablokowane.");
             setCurrentView(View.UpgradeView);
          }
        }
      }
    };

    // Check immediately on mount
    checkSubscriptionExpiry();

    // Check every 60 seconds while app is running
    const interval = setInterval(checkSubscriptionExpiry, 60000);
    return () => clearInterval(interval);
  }, [subscription, currentView]);
  
  // --- Persistence Effects ---
  useEffect(() => { saveToLocalStorage(storageKeys.ABC_EVENTS, abcEvents); }, [abcEvents]);
  useEffect(() => { saveToLocalStorage(storageKeys.JOURNAL_ENTRIES, journalEntries); }, [journalEntries]);
  useEffect(() => { saveToLocalStorage(storageKeys.CONVERSATION_REPORTS, conversationReports); }, [conversationReports]);
  useEffect(() => { saveToLocalStorage(storageKeys.CHILD_PROFILES, childProfiles); }, [childProfiles]);
  useEffect(() => { saveToLocalStorage(storageKeys.APP_ROLE, appRole); }, [appRole]);
  useEffect(() => { saveToLocalStorage(storageKeys.PAIRING_CONFIG, pairingConfig); }, [pairingConfig]);
  useEffect(() => { saveToLocalStorage(storageKeys.USER_SUBSCRIPTION, subscription); }, [subscription]);

  const handleAddABCEvent = (event: Omit<ABCEvent, 'id' | 'timestamp'>) => {
    const newEvent: ABCEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setAbcEvents(prev => [...prev, newEvent]);
  };

  const handleClearLinkedDrawing = () => {
    setLinkedDrawing(null);
  };

  const handleLinkDrawing = (data: LinkedDrawingData) => {
    setLinkedDrawing(data);
    setCurrentView(View.ABCLogger); 
  };

  const handleAddJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    setJournalEntries(prev => [...prev, newEntry]);
  };
    
  const handleSaveConversationReport = (
    reportData: Omit<ConversationReport, 'id' | 'date' | 'childProfileId' | 'assistantPersona'>,
    childProfileId: string | null,
    assistantPersona: AssistantPersona
  ) => {
    const newReport: ConversationReport = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      childProfileId,
      assistantPersona,
      ...reportData,
    };
    setConversationReports(prev => [...prev, newReport]);
  };

  const handleClearAllData = () => {
    if (window.confirm("Czy na pewno chcesz zresetować całą aplikację?")) {
        clearAllAppData();
        setAbcEvents([]);
        setJournalEntries([]);
        setConversationReports([]);
        setChildProfiles([]);
        setAppRole(null);
        setSubscription({ isSubscribed: false, planType: 'none', expiryDate: null, unlockedFeatures: [], hasUsedTrial: false });
        setCurrentView(View.Dashboard);
    }
  };

  const handleSetupComplete = (data: { role: AppRole, parentName: string, childName: string, goals: string }) => {
      setAppRole(data.role);
      
      const newConfig = {
          ...pairingConfig,
          parentName: data.parentName,
          childName: data.childName,
          goals: data.goals,
          deviceId: pairingConfig.deviceId || (data.role === 'Parent' ? `PARENT-${Date.now()}` : `CHILD-${Date.now()}`)
      };
      setPairingConfig(newConfig);
      saveToLocalStorage(storageKeys.PAIRING_CONFIG, newConfig);
      saveToLocalStorage(storageKeys.APP_ROLE, data.role);

      if (data.role === 'Child') {
          setCurrentView(View.RealTimeMonitor);
      } else {
          setCurrentView(View.Dashboard);
      }
  };

  // Logic to handle checking locked features
  const handleSetView = (newView: View) => {
      const requiredFeature = premiumFeatureMap[newView];
      if (requiredFeature) {
          // Check if sub is active (Monthly, One-time, or Trial) OR if feature is bought individually
          // IMPORTANT: Trial (isSubscribed=true) unlocks everything automatically.
          const isUnlocked = subscription.isSubscribed || subscription.unlockedFeatures.includes(requiredFeature);
          
          if (!isUnlocked) {
              // Redirect to upgrade view if locked
              setCurrentView(View.UpgradeView);
              return;
          }
      }
      setCurrentView(newView);
  };

  // VIEW RENDERING LOGIC
  if (!appRole) {
      return <RoleSelection onSetupComplete={handleSetupComplete} />;
  }

  if (appRole === 'Child') {
      return <RealTimeMonitor hiddenMode={true} />;
  }

  const renderParentView = (): React.ReactElement => {
    switch (currentView) {
      case View.Dashboard: return <Dashboard setView={handleSetView} />;
      case View.UpgradeView: return <UpgradeView setView={setCurrentView} currentSubscription={subscription} onUpgrade={setSubscription} />; 
      case View.RemoteMonitor: return <RemoteMonitor />;
      case View.ABCLogger: return <ABCLogger linkedDrawing={linkedDrawing} onClearLinkedDrawing={handleClearLinkedDrawing} onAddEvent={handleAddABCEvent} />;
      case View.DrawingInterpreter: return <DrawingInterpreter onLinkToABC={handleLinkDrawing} />;
      case View.StrategyGuide: return <StrategyGuide />;
      case View.VisualSchedule: return <VisualSchedule />;
      case View.ResourceLibrary: return <ResourceLibrary />;
      case View.RealTimeMonitor: return <RealTimeMonitor />;
      case View.DataAnalytics: return <DataAnalytics />;
      case View.SpeechInterpreter: return <SpeechInterpreter />;
      case View.RealTimeSpeechMonitor: return <RealTimeSpeechMonitor />;
      case View.EarlyWarningSystem: return <EarlyWarningSystem />;
      case View.SuccessJournal: return <SuccessJournal entries={journalEntries} onAddEntry={handleAddJournalEntry} />;
      case View.SkillBuilder: return <SkillBuilder />;
      case View.EscalationMonitor: return <EscalationMonitor />;
      case View.DyadicRegulation: return <DyadicRegulation />;
      case View.AttentionHub: return <AttentionHub />;
      case View.GeminiKids: return <GeminiKids onSaveReport={handleSaveConversationReport} />;
      case View.Smartwatch: return <Smartwatch />;
      case View.ProgressTracker: return <ProgressTracker reports={conversationReports} abcEvents={abcEvents} successEntries={journalEntries} />;
      case View.LoyaltyProgram: return <LoyaltyProgram />;
      case View.ImageEditor: return <ImageEditor />;
      case View.VideoAnalyzer: return <VideoAnalyzer />;
      case View.VideoGenerator: return <VideoGenerator />;
      case View.LocalResources: return <LocalResources />;
      case View.ConversationArchive: return <ConversationArchive reports={conversationReports} />;
      case View.ProactivePlanner: return <ProactivePlanner />;
      case View.PrivacySettings: return <PrivacySettings onClearAllData={handleClearAllData} />;
      default: return <Dashboard setView={handleSetView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header currentView={currentView} setView={handleSetView} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {renderParentView()}
      </main>
    </div>
  );
};

export default App;
    