
import React, { useState, useEffect } from 'react';
import { View, PairingConfig, UserSubscription, PremiumFeature } from '../types';
import Card from './common/Card';
import { useTranslation } from '../hooks/useTranslation';
import { Icon } from './common/Icon';
import { loadFromLocalStorage, storageKeys } from '../utils/storage';

interface DashboardProps {
  setView: (view: View) => void;
}

interface Feature {
    view: View;
    icon: React.ComponentProps<typeof Icon>['name'];
    translationKey: string;
    highlight?: boolean;
    titleOverride?: string;
    premiumFeature?: PremiumFeature; // Linked premium feature key
}

// Reusable component for list items in the Parent Zone
const DashboardFeatureList: React.FC<{
    features: Feature[];
    onNavigate: (view: View) => void;
    hoverColorClass: string;
    t: (key: string) => string;
    isUnlocked: (feature?: PremiumFeature) => boolean;
}> = ({ features, onNavigate, hoverColorClass, t, isUnlocked }) => (
    <div className="space-y-3">
        {features.map(feature => {
            const unlocked = isUnlocked(feature.premiumFeature);
            return (
                <button 
                    key={feature.view}
                    onClick={() => onNavigate(feature.view)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${unlocked ? 'hover:bg-slate-50' : 'opacity-80 hover:bg-slate-50/50'}`}
                >
                    <div className={`transition-colors relative ${unlocked ? `text-slate-400 ${hoverColorClass}` : 'text-slate-300'}`}>
                        <Icon name={feature.icon} className="w-5 h-5"/>
                        {!unlocked && (
                             <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 shadow-sm border border-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                </svg>
                             </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`font-semibold text-sm ${unlocked ? 'text-slate-700 group-hover:text-slate-900' : 'text-slate-500'}`}>
                            {feature.titleOverride || t(`dashboard.cards.${feature.translationKey}.title`)}
                        </p>
                    </div>
                     {!unlocked && <span className="text-[10px] font-bold uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Premium</span>}
                </button>
            );
        })}
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<PairingConfig | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription>({ isSubscribed: false, planType: 'none', expiryDate: null, unlockedFeatures: [], hasUsedTrial: false });
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
      const savedConfig = localStorage.getItem(storageKeys.PAIRING_CONFIG);
      if (savedConfig) setConfig(JSON.parse(savedConfig));
      
      const savedSub = loadFromLocalStorage<UserSubscription>(storageKeys.USER_SUBSCRIPTION, { isSubscribed: false, planType: 'none', expiryDate: null, unlockedFeatures: [], hasUsedTrial: false });
      setSubscription(savedSub);

      // Calculate remaining time for trial/sub
      if (savedSub.expiryDate && (savedSub.planType === 'trial' || savedSub.planType === 'one_time')) {
          const updateTimer = () => {
              const now = new Date().getTime();
              const expiry = new Date(savedSub.expiryDate!).getTime();
              const diff = expiry - now;
              
              if (diff > 0) {
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (days > 0) {
                      setTimeLeft(`${days} dni ${hours}h`);
                  } else {
                      setTimeLeft(`${hours}h ${minutes}m`);
                  }
              } else {
                  setTimeLeft('Wygasło');
              }
          };
          updateTimer();
          const interval = setInterval(updateTimer, 60000);
          return () => clearInterval(interval);
      }
  }, []);

  const isFeatureUnlocked = (feature?: PremiumFeature) => {
      if (!feature) return true; // Standard features are always unlocked
      if (subscription.isSubscribed) return true; // Subscription (including trial) unlocks everything
      return subscription.unlockedFeatures.includes(feature); // Check individual unlock
  };

  const handleCardClick = (view: View) => {
    setView(view);
  };

  // --- STREFA DZIECKA (CHILD ZONE) ---
  const childFeatures: Feature[] = [
    { view: View.GeminiKids, icon: 'gemini-kids', translationKey: 'geminiKids', highlight: true, premiumFeature: PremiumFeature.AI_Assistant },
    { view: View.Smartwatch, icon: 'smartwatch', translationKey: 'smartwatch' }, // Standard
    { view: View.VisualSchedule, icon: 'schedule', translationKey: 'visualSchedule' }, // Standard
    { view: View.LoyaltyProgram, icon: 'sticker', translationKey: 'loyaltyProgram' }, // Standard
    { view: View.AttentionHub, icon: 'attention', translationKey: 'attentionHub' }, // Standard
    { view: View.DyadicRegulation, icon: 'dyadic', translationKey: 'dyadicRegulation' }, // Standard
  ];

  // --- STREFA RODZICA (PARENT ZONE) ---
  
  // 1. Analiza i Dane
  const parentAnalysisFeatures: Feature[] = [
    { view: View.RemoteMonitor, icon: 'shield-check', translationKey: 'realTimeMonitor', titleOverride: config?.childName ? `Monitor Zdalny (${config.childName})` : 'Zdalny Monitor (Telefon Dziecka)', premiumFeature: PremiumFeature.Remote_Access },
    { view: View.DataAnalytics, icon: 'analytics', translationKey: 'dataAnalytics', premiumFeature: PremiumFeature.Deep_Analytics },
    { view: View.RealTimeMonitor, icon: 'monitor', translationKey: 'realTimeMonitor' }, // Standard
    { view: View.ABCLogger, icon: 'abc', translationKey: 'abcLogger' }, // Standard
    { view: View.ProgressTracker, icon: 'analytics', translationKey: 'progressTracker' }, // Standard (Basic)
    { view: View.RealTimeSpeechMonitor, icon: 'live-speech', translationKey: 'realTimeSpeechMonitor', premiumFeature: PremiumFeature.AI_Assistant }, // AI Heavy
    { view: View.DrawingInterpreter, icon: 'drawing', translationKey: 'drawingInterpreter', premiumFeature: PremiumFeature.Creative_Tools },
    { view: View.SpeechInterpreter, icon: 'speech', translationKey: 'speechInterpreter', premiumFeature: PremiumFeature.AI_Assistant },
    { view: View.VideoAnalyzer, icon: 'video_library', translationKey: 'videoAnalyzer', premiumFeature: PremiumFeature.Video_Analysis },
  ];

  // 2. Strategie i Interwencje
  const parentStrategyFeatures: Feature[] = [
    { view: View.ProactivePlanner, icon: 'network_intelligence', translationKey: 'proactivePlanner', premiumFeature: PremiumFeature.Deep_Analytics },
    { view: View.StrategyGuide, icon: 'strategy', translationKey: 'strategyGuide' }, // Standard (Search based)
    { view: View.EarlyWarningSystem, icon: 'warning', translationKey: 'earlyWarningSystem', premiumFeature: PremiumFeature.Deep_Analytics },
    { view: View.EscalationMonitor, icon: 'escalation', translationKey: 'escalationMonitor' }, // Standard
    { view: View.SkillBuilder, icon: 'skill-builder', translationKey: 'skillBuilder' }, // Standard
  ];

  // 3. Narzędzia i Zasoby
  const parentToolsFeatures: Feature[] = [
    { view: View.SuccessJournal, icon: 'journal', translationKey: 'successJournal' }, // Standard
    { view: View.ConversationArchive, icon: 'resources', translationKey: 'conversationArchive' }, // Standard
    { view: View.LocalResources, icon: 'google_pin', translationKey: 'localResources' }, // Standard
    { view: View.ImageEditor, icon: 'image_edit_auto', translationKey: 'imageEditor', premiumFeature: PremiumFeature.Creative_Tools },
    { view: View.VideoGenerator, icon: 'video_spark', translationKey: 'videoGenerator', premiumFeature: PremiumFeature.Video_Analysis },
  ];

  const greetingName = config?.parentName ? `, ${config.parentName}` : '';
  const mainAssistantUnlocked = isFeatureUnlocked(PremiumFeature.AI_Assistant);

  return (
    <div className="p-4 md:p-8 space-y-12 bg-slate-50 min-h-screen">
        
        {/* HEADER */}
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('dashboard.title')}{greetingName}!</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('dashboard.description')}</p>
        </div>

        {/* SUBSCRIPTION STATUS BANNERS */}
        {!subscription.isSubscribed && !subscription.hasUsedTrial ? (
             <div onClick={() => setView(View.UpgradeView)} className="bg-gradient-to-r from-rose-500 to-orange-500 text-white p-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                     <div className="bg-white/20 p-2 rounded-full"><Icon name="star" className="w-6 h-6" /></div>
                     <div>
                         <h3 className="font-bold text-lg">Promocja Startowa -50%</h3>
                         <p className="text-sm opacity-90">Dostępne również darmowe 3 dni testów.</p>
                     </div>
                 </div>
                 <div className="bg-white text-rose-600 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap">
                     Sprawdź Ofertę
                 </div>
             </div>
        ) : subscription.planType === 'trial' ? (
             <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-yellow-400/50">
                 <div className="flex items-center gap-3">
                     <div className="bg-indigo-700 p-2 rounded-full"><Icon name="shield-check" className="w-6 h-6 text-yellow-400" /></div>
                     <div>
                         <h3 className="font-bold text-lg">Aktywny Okres Próbny</h3>
                         <p className="text-sm opacity-90">Testujesz pełną wersję. Pozostało: <span className="font-mono font-bold text-yellow-300 text-lg">{timeLeft}</span></p>
                     </div>
                 </div>
                 <button onClick={() => setView(View.UpgradeView)} className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-100">
                     Przejdź na pełny pakiet
                 </button>
             </div>
        ) : null}

        {/* --- CHILD ZONE --- */}
        <section className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-3xl p-6 md:p-8 shadow-sm border border-sky-100">
            <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-sky-100 rounded-full text-sky-600">
                    <Icon name="gemini-kids" className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-sky-800">{t('dashboard.sections.child_zone')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hero Card for Assistant */}
                <div className="md:col-span-3 lg:col-span-1">
                     <div 
                        onClick={() => handleCardClick(childFeatures[0].view)}
                        className={`h-full bg-white rounded-2xl shadow-lg p-6 flex flex-row md:flex-col items-center md:items-start gap-4 border-2 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group ${mainAssistantUnlocked ? 'border-sky-200' : 'border-slate-200 opacity-90'}`}
                     >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>
                        
                        {!mainAssistantUnlocked && (
                             <div className="absolute top-2 right-2 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm z-20 flex items-center gap-1">
                                 <Icon name="star" className="w-3 h-3" /> Premium
                             </div>
                        )}

                        <div className={`p-4 rounded-full shadow-md z-10 ${mainAssistantUnlocked ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                             <Icon name={childFeatures[0].icon} className="w-10 h-10" />
                        </div>
                        <div className="z-10">
                            <h3 className="text-2xl font-bold text-slate-800 mb-1">{t(`dashboard.cards.${childFeatures[0].translationKey}.title`)}</h3>
                            <p className="text-slate-600 text-sm">{t(`dashboard.cards.${childFeatures[0].translationKey}.description`)}</p>
                        </div>
                     </div>
                </div>

                {/* Other Child Features */}
                <div className="md:col-span-3 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {childFeatures.slice(1).map(feature => {
                        const unlocked = isFeatureUnlocked(feature.premiumFeature);
                        return (
                            <div 
                                key={feature.view}
                                onClick={() => handleCardClick(feature.view)}
                                className={`bg-white rounded-xl shadow-md p-4 flex flex-col items-center text-center justify-center gap-3 border hover:shadow-lg cursor-pointer transition-all relative ${unlocked ? 'border-slate-100 hover:border-sky-200' : 'border-slate-100 opacity-80'}`}
                            >
                                {!unlocked && <div className="absolute top-2 right-2 text-amber-400"><Icon name="shield-check" className="w-4 h-4"/></div>}
                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full">
                                    <Icon name={feature.icon} className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-700 leading-tight">{t(`dashboard.cards.${feature.translationKey}.title`)}</h4>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>

        {/* --- PARENT ZONE --- */}
        <section className="space-y-8">
             <div className="flex items-center gap-3 mb-2 px-2">
                 <div className="p-2 bg-slate-200 rounded-full text-slate-600">
                    <Icon name="settings" className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-800">{t('dashboard.sections.parent_zone')}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Analysis */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-lg font-bold text-sky-700 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Icon name="analytics" className="w-5 h-5" />
                        {t('dashboard.subsections.analysis')}
                    </h4>
                    <DashboardFeatureList 
                        features={parentAnalysisFeatures} 
                        onNavigate={handleCardClick} 
                        hoverColorClass="group-hover:text-sky-600"
                        t={t}
                        isUnlocked={isFeatureUnlocked}
                    />
                </div>

                {/* Column 2: Strategy */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-lg font-bold text-emerald-700 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Icon name="strategy" className="w-5 h-5" />
                        {t('dashboard.subsections.strategies')}
                    </h4>
                    <DashboardFeatureList 
                        features={parentStrategyFeatures} 
                        onNavigate={handleCardClick} 
                        hoverColorClass="group-hover:text-emerald-600"
                        t={t}
                        isUnlocked={isFeatureUnlocked}
                    />
                </div>

                {/* Column 3: Tools */}
                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-lg font-bold text-purple-700 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Icon name="resources" className="w-5 h-5" />
                        {t('dashboard.subsections.tools')}
                    </h4>
                    <DashboardFeatureList 
                        features={parentToolsFeatures} 
                        onNavigate={handleCardClick} 
                        hoverColorClass="group-hover:text-purple-600"
                        t={t}
                         isUnlocked={isFeatureUnlocked}
                    />
                </div>

            </div>
        </section>
    </div>
  );
};

export default Dashboard;
