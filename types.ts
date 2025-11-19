
export enum View {
  Dashboard,
  ABCLogger,
  DrawingInterpreter,
  StrategyGuide,
  VisualSchedule,
  ResourceLibrary,
  RealTimeMonitor,
  DataAnalytics,
  SpeechInterpreter,
  RealTimeSpeechMonitor,
  EarlyWarningSystem,
  SuccessJournal,
  SkillBuilder,
  EscalationMonitor,
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
  ConversationArchive,
  ProactivePlanner,
  PrivacySettings,
  RemoteMonitor,
  UpgradeView, // Added specifically for navigation
}

export type AppRole = 'Parent' | 'Child' | null;

export interface PairingConfig {
    deviceId: string;
    pairedDeviceId: string | null;
    parentEmail: string;
    // isRemoteListeningActive removed - feature deprecated for privacy/legal reasons
    parentName?: string;
    childName?: string;
    goals?: string;
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
  detectedEmotions?: string[];
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

export interface GeminiCard {
    emoji: string;
    title: string;
    description: string;
}

export type AssistantPersona = 'Friendly & Calm' | 'Energetic & Playful' | 'Neutral';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  conditions: string[]; 
  preferredAssistantPersona: AssistantPersona;
  preferredVoice?: string; 
}

export interface ConversationReport {
    id: string;
    date: string;
    childProfileId: string | null; 
    assistantPersona: AssistantPersona; 
    summary: string;
    emotionalTone: string;
    keyThemes: string[];
    potentialTriggers: string[];
    positiveMoments: string[];
    suggestionsForCaregiver: string[];
}

export interface JournalEntry {
    id: number;
    text: string;
    date: string;
}

// --- PURCHASING & SUBSCRIPTION TYPES ---

export enum PremiumFeature {
    AI_Assistant = 'AI_Assistant', // GeminiKids
    Video_Analysis = 'Video_Analysis', // VideoAnalyzer, VideoGenerator
    Deep_Analytics = 'Deep_Analytics', // DataAnalytics, EarlyWarning, ProactivePlanner
    Creative_Tools = 'Creative_Tools', // DrawingInterpreter, ImageEditor
    Remote_Access = 'Remote_Access', // RemoteMonitor
}

export interface UserSubscription {
    isSubscribed: boolean;
    planType: 'monthly' | 'one_time' | 'trial' | 'none'; 
    expiryDate: string | null; // ISO Date string
    unlockedFeatures: PremiumFeature[]; // Individual unlocks
    hasUsedTrial: boolean; // Prevents repeated trials
}
