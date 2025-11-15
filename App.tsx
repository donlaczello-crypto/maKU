
import React, { useState } from 'react';
import { View, LinkedDrawingData } from './types';
import Header from './components/common/Header';
import Dashboard from './components/Dashboard';
import ABCLogger from './components/ABCLogger';
import DrawingInterpreter from './components/DrawingInterpreter';
import StrategyGuide from './components/StrategyGuide';
import VisualSchedule from './components/VisualSchedule';
import Collaboration from './components/Collaboration';
import ResourceLibrary from './components/ResourceLibrary';
import RealTimeMonitor from './components/RealTimeMonitor';
import DataAnalytics from './components/DataAnalytics';
import SpeechInterpreter from './components/SpeechInterpreter';
import RealTimeSpeechMonitor from './components/RealTimeSpeechMonitor';
import EarlyWarningSystem from './components/EarlyWarningSystem';
import SuccessJournal from './components/SuccessJournal';
import SkillBuilder from './components/SkillBuilder';
import EscalationMonitor from './components/EscalationMonitor';
import AssistantConversation from './components/AssistantConversation';
import DyadicRegulation from './components/DyadicRegulation';
import AttentionHub from './components/AttentionHub';
import GeminiKids from './components/GeminiKids';
import Smartwatch from './components/Smartwatch';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [linkedDrawingData, setLinkedDrawingData] = useState<LinkedDrawingData | null>(null);
  const { t } = useTranslation();

  const handleLinkToABC = (data: LinkedDrawingData) => {
    setLinkedDrawingData(data);
    setCurrentView(View.ABCLogger);
  };

  const clearLinkedDrawingData = () => {
    setLinkedDrawingData(null);
  };


  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return <Dashboard setView={setCurrentView} />;
      case View.ABCLogger:
        return <ABCLogger linkedDrawing={linkedDrawingData} onClearLinkedDrawing={clearLinkedDrawingData} />;
      case View.DrawingInterpreter:
        return <DrawingInterpreter onLinkToABC={handleLinkToABC} />;
      case View.StrategyGuide:
        return <StrategyGuide />;
      case View.VisualSchedule:
        return <VisualSchedule />;
      case View.Collaboration:
        return <Collaboration />;
      case View.ResourceLibrary:
        return <ResourceLibrary />;
      case View.RealTimeMonitor:
        return <RealTimeMonitor />;
      case View.DataAnalytics:
        return <DataAnalytics />;
      case View.SpeechInterpreter:
        return <SpeechInterpreter />;
      case View.RealTimeSpeechMonitor:
        return <RealTimeSpeechMonitor />;
      case View.EarlyWarningSystem:
        return <EarlyWarningSystem />;
      case View.SuccessJournal:
        return <SuccessJournal />;
      case View.SkillBuilder:
        return <SkillBuilder />;
      case View.EscalationMonitor:
        return <EscalationMonitor />;
      case View.AssistantConversation:
        return <AssistantConversation />;
      case View.DyadicRegulation:
        return <DyadicRegulation />;
      case View.AttentionHub:
        return <AttentionHub />;
      case View.GeminiKids:
        return <GeminiKids />;
      case View.Smartwatch:
        return <Smartwatch />;
      case View.ProgressTracker:
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('progressTracker.title')}</h2>
                <p className="text-slate-500 mt-4">{t('progressTracker.description')}</p>
            </div>
        );
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header currentView={currentView} setView={setCurrentView} />
      <main className="flex-grow">
        {renderView()}
      </main>
      <footer className="text-center p-4 text-slate-400 text-xs">
        <p>{t('footer.dedication')}</p>
      </footer>
    </div>
  );
};

export default App;