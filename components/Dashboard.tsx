
import React from 'react';
import { View } from '../types';
import Card from './common/Card';
import { useTranslation } from '../hooks/useTranslation';

interface DashboardProps {
  setView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('dashboard.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('dashboard.description')}</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title={t('dashboard.cards.geminiKids.title')}
          description={t('dashboard.cards.geminiKids.description')}
          iconName="gemini-kids"
          onClick={() => setView(View.GeminiKids)}
        />
        <Card
          title={t('dashboard.cards.assistantConversation.title')}
          description={t('dashboard.cards.assistantConversation.description')}
          iconName="conversation"
          onClick={() => setView(View.AssistantConversation)}
        />
        <Card
          title={t('dashboard.cards.loyaltyProgram.title')}
          description={t('dashboard.cards.loyaltyProgram.description')}
          iconName="sticker"
          onClick={() => setView(View.LoyaltyProgram)}
        />
         <Card
          title={t('dashboard.cards.imageEditor.title')}
          description={t('dashboard.cards.imageEditor.description')}
          iconName="image_edit_auto"
          onClick={() => setView(View.ImageEditor)}
        />
        <Card
          title={t('dashboard.cards.videoGenerator.title')}
          description={t('dashboard.cards.videoGenerator.description')}
          iconName="video_spark"
          onClick={() => setView(View.VideoGenerator)}
        />
        <Card
          title={t('dashboard.cards.videoAnalyzer.title')}
          description={t('dashboard.cards.videoAnalyzer.description')}
          iconName="video_library"
          onClick={() => setView(View.VideoAnalyzer)}
        />
        <Card
          title={t('dashboard.cards.localResources.title')}
          description={t('dashboard.cards.localResources.description')}
          iconName="google_pin"
          onClick={() => setView(View.LocalResources)}
        />
        <Card
          title={t('dashboard.cards.strategyGuide.title')}
          description={t('dashboard.cards.strategyGuide.description')}
          iconName="strategy"
          onClick={() => setView(View.StrategyGuide)}
        />
        <Card
          title={t('dashboard.cards.dataAnalytics.title')}
          description={t('dashboard.cards.dataAnalytics.description')}
          iconName="analytics"
          onClick={() => setView(View.DataAnalytics)}
        />
        <Card
          title={t('dashboard.cards.drawingInterpreter.title')}
          description={t('dashboard.cards.drawingInterpreter.description')}
          iconName="drawing"
          onClick={() => setView(View.DrawingInterpreter)}
        />
         <Card
          title={t('dashboard.cards.smartwatch.title')}
          description={t('dashboard.cards.smartwatch.description')}
          iconName="smartwatch"
          onClick={() => setView(View.Smartwatch)}
        />
        <Card
          title={t('dashboard.cards.attentionHub.title')}
          description={t('dashboard.cards.attentionHub.description')}
          iconName="attention"
          onClick={() => setView(View.AttentionHub)}
        />
        <Card
          title={t('dashboard.cards.dyadicRegulation.title')}
          description={t('dashboard.cards.dyadicRegulation.description')}
          iconName="dyadic"
          onClick={() => setView(View.DyadicRegulation)}
        />
        <Card
          title={t('dashboard.cards.escalationMonitor.title')}
          description={t('dashboard.cards.escalationMonitor.description')}
          iconName="escalation"
          onClick={() => setView(View.EscalationMonitor)}
        />
        <Card
          title={t('dashboard.cards.abcLogger.title')}
          description={t('dashboard.cards.abcLogger.description')}
          iconName="abc"
          onClick={() => setView(View.ABCLogger)}
        />
        <Card
          title={t('dashboard.cards.skillBuilder.title')}
          description={t('dashboard.cards.skillBuilder.description')}
          iconName="skill-builder"
          onClick={() => setView(View.SkillBuilder)}
        />
        <Card
          title={t('dashboard.cards.earlyWarningSystem.title')}
          description={t('dashboard.cards.earlyWarningSystem.description')}
          iconName="warning"
          onClick={() => setView(View.EarlyWarningSystem)}
        />
        <Card
          title={t('dashboard.cards.realTimeSpeechMonitor.title')}
          description={t('dashboard.cards.realTimeSpeechMonitor.description')}
          iconName="live-speech"
          onClick={() => setView(View.RealTimeSpeechMonitor)}
        />
        <Card
          title={t('dashboard.cards.visualSchedule.title')}
          description={t('dashboard.cards.visualSchedule.description')}
          iconName="schedule"
          onClick={() => setView(View.VisualSchedule)}
        />
        <Card
          title={t('dashboard.cards.successJournal.title')}
          description={t('dashboard.cards.successJournal.description')}
          iconName="journal"
          onClick={() => setView(View.SuccessJournal)}
        />
        <Card
          title={t('dashboard.cards.progressTracker.title')}
          description={t('dashboard.cards.progressTracker.description')}
          iconName="analytics"
          onClick={() => setView(View.ProgressTracker)}
        />
        <Card
          title={t('dashboard.cards.speechInterpreter.title')}
          description={t('dashboard.cards.speechInterpreter.description')}
          iconName="speech"
          onClick={() => setView(View.SpeechInterpreter)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
