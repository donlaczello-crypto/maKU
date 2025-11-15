
export enum View {
  Dashboard,
  ABCLogger,
  DrawingInterpreter,
  StrategyGuide,
  VisualSchedule,
  Collaboration,
  ResourceLibrary,
  RealTimeMonitor,
  DataAnalytics,
  SpeechInterpreter,
  RealTimeSpeechMonitor,
  SuccessJournal,
  SkillBuilder,
  EscalationMonitor,
  EarlyWarningSystem,
  AssistantConversation,
  DyadicRegulation,
  AttentionHub,
  GeminiKids,
  Smartwatch,
  ProgressTracker,
  LoyaltyProgram,
  ImageEditor,
  VideoAnalyzer,
  VideoGenerator,
  LocalResources,
}

export interface ABCEvent {
  id: string;
  timestamp: Date;
  antecedent: string[];
  behavior: {
    name: string;
    count: number;
    durationSeconds: number;
  };
  consequence: string;
  regulationState: RegulationState;
  triggers: string[];
}

export enum RegulationState {
  Regulated = 'W oknie tolerancji',
  HyperArousal = 'Hiper-pobudzenie (walka/ucieczka)',
  HypoArousal = 'Hipo-pobudzenie (zamrożenie)',
}

export interface ScheduleStep {
    task: string;
    emoji: string;
}

export interface LiveSpeechAnalysis {
  emotionalValence: 'Pozytywny' | 'Neutralny' | 'Negatywny' | 'N/A';
  wordCount: number;
  speechPace: 'Normalne' | 'Przyspieszone' | 'Spowolnione' | 'Monotonne' | 'N/A';
  anxietyKeywords: string[];
  isFragmented: boolean;
  isTopicShift: boolean;
  repetitions: string[];
  questionCount: number;
}

export interface StructuredSpeechAnalysis {
  transcriptionAttempt: string;
  keywords: string[];
  probableIntent: string;
  emotionalValence: 'Pozytywny' | 'Neutralny' | 'Negatywny';
  emotionalToneDescription: string;
  suggestedResponses: string[];
  wordCount: number;
}

export interface RiskAlert {
  id: string;
  riskFactor: string;
  evidence: string[];
  strategy: string;
  level: 'Niski' | 'Umiarkowany' | 'Wysoki';
}

export interface TrainingStep {
  step: number;
  title: string;
  description: string;
}

export interface SkillPlan {
  replacementSkill: string;
  rationale: string;
  trainingPlan: TrainingStep[];
}

export interface EscalationStrategy {
    title: string;
    caregiverAction: string;
    communicationTip: string;
}

export interface DyadicExercise {
    title: string;
    goal: string;
    caregiverInstructions: string[];
    childScript: string[];
    rationale: string;
}

export interface AttentionConcentrator {
    title: string;
    description: string;
    durationMinutes: number;
    rationale: string;
}

export interface ChildProfile {
    name: string;
    favoriteAnimal: string;
    interests: string;
}

export interface GeminiCard {
    emoji: string;
    title: string;
    description: string;
}

export interface LinkedDrawingData {
    analysis: string;
    context: string;
    imageBase64: string;
}

export interface Sticker {
  id: string;
  imageBase64: string;
  name: string;
  earnedDate: string;
}

export interface FamilyActivity {
    title: string;
    description: string;
}

export interface Selfie {
    id: string;
    imageBase64: string;
    date: string;
}
