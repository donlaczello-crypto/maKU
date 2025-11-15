
import React from 'react';
import { View } from '../types';
import Card from './common/Card';

interface DashboardProps {
  setView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  return (
    <div className="p-4 md:p-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Witaj w Asystencie Wsparcia</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Twoje centrum do zrozumienia, wspierania i reagowania na potrzeby dziecka. Wybierz moduł, aby rozpocząć.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Gemini Kids"
          description="Porozmawiaj z Iskierką, przyjaznym robotem, który jest Twoim nowym przyjacielem."
          iconName="gemini-kids"
          onClick={() => setView(View.GeminiKids)}
        />
        <Card
          title="Smartwatch Dziecka"
          description="Wirtualny zegarek, który pomaga w trudnych chwilach, dając wspierające zadania."
          iconName="smartwatch"
          onClick={() => setView(View.Smartwatch)}
        />
        <Card
          title="Koncentratory Uwagi"
          description="Strefa skupienia dla dzieci: interaktywne, sensoryczne aktywności generowane przez AI."
          iconName="attention"
          onClick={() => setView(View.AttentionHub)}
        />
        <Card
          title="Rozmowa z Asystentem"
          description="Rozmawiaj na żywo z asystentem AI, aby wspierać komunikację i interpretować potrzeby dziecka."
          iconName="conversation"
          onClick={() => setView(View.AssistantConversation)}
        />
        <Card
          title="Ćwiczenia Razem"
          description="Wzmacniaj więź i regulację poprzez wspólne, interaktywne ćwiczenia z dzieckiem."
          iconName="dyadic"
          onClick={() => setView(View.DyadicRegulation)}
        />
        <Card
          title="Strategie i Wsparcie"
          description="Otrzymaj natychmiastowe, spersonalizowane porady w trudnych sytuacjach."
          iconName="strategy"
          onClick={() => setView(View.StrategyGuide)}
        />
        <Card
          title="Monitor Eskalacji"
          description="Identyfikuj etapy eskalacji i otrzymuj strategie interwencji w czasie rzeczywistym."
          iconName="escalation"
          onClick={() => setView(View.EscalationMonitor)}
        />
        <Card
          title="Tłumacz Rysunków"
          description="Zinterpretuj rysunki dziecka, aby uzyskać wgląd w jego świat emocjonalny."
          iconName="drawing"
          onClick={() => setView(View.DrawingInterpreter)}
        />
        <Card
          title="Rejestrator ABC"
          description="Zapisuj zdarzenia, aby analizować poprzedniki, zachowania i konsekwencje."
          iconName="abc"
          onClick={() => setView(View.ABCLogger)}
        />
        <Card
          title="Trener Umiejętności"
          description="Zastąp trudne zachowania nowymi, pozytywnymi sposobami komunikacji."
          iconName="skill-builder"
          onClick={() => setView(View.SkillBuilder)}
        />
        <Card
          title="System Ostrzegania"
          description="Analizuj dane, aby proaktywnie identyfikować czynniki ryzyka i zapobiegać kryzysom."
          iconName="warning"
          onClick={() => setView(View.EarlyWarningSystem)}
        />
        <Card
          title="Monitor Mowy na Żywo"
          description="Analizuj mowę w czasie rzeczywistym pod kątem emocji i wskaźników poznawczych."
          iconName="live-speech"
          onClick={() => setView(View.RealTimeSpeechMonitor)}
        />
        <Card
          title="Wizualny Plan Dnia"
          description="Generuj plany dnia z piktogramami, aby zwiększyć przewidywalność."
          iconName="schedule"
          onClick={() => setView(View.VisualSchedule)}
        />
        <Card
          title="Dziennik Sukcesów"
          description="Zapisuj i celebruj pozytywne chwile, małe i duże osiągnięcia oraz postępy."
          iconName="journal"
          onClick={() => setView(View.SuccessJournal)}
        />
        <Card
          title="Analiza i Predykcje"
          description="Odkrywaj wzorce, korelacje i prognozy na podstawie zebranych danych."
          iconName="analytics"
          onClick={() => setView(View.DataAnalytics)}
        />
        <Card
          title="Moje Postępy"
          description="Śledź ścieżkę rozwoju dziecka na podstawie zebranych danych i analiz."
          iconName="analytics"
          onClick={() => setView(View.ProgressTracker)}
        />
        <Card
          title="Tłumacz Mowy"
          description="Nagraj i przeanalizuj wypowiedź dziecka, aby lepiej zrozumieć jego intencje."
          iconName="speech"
          onClick={() => setView(View.SpeechInterpreter)}
        />
      </div>
    </div>
  );
};

export default Dashboard;