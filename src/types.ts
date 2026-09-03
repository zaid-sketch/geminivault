export type MoodType = 
  | 'peaceful'
  | 'energized'
  | 'reflective'
  | 'grateful'
  | 'focused'
  | 'anxious'
  | 'tired';

export interface JournalReflection {
  id: string;
  type: 'summary' | 'question' | 'theme' | 'insight';
  text: string;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: MoodType;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  aiPromptUsed?: string;
  reflections?: JournalReflection[];
  createdAt: number;
  updatedAt: number;
}

export type JournalEntryInput = Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTimeMinutes'> & {
  wordCount?: number;
  readingTimeMinutes?: number;
};

export type DashboardTab = 'new' | 'history' | 'ai-assistant' | 'insights';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
}

export interface ReflectionInsight {
  id: string;
  userId: string;
  entryIds: string[];
  entryTitles: string[];
  keyThemes: string[];
  emotionalPatterns: string[];
  positiveProgress: string[];
  recurringChallenges: string[];
  reflectionSummary: string;
  followUpQuestions: string[];
  modelUsed: string;
  createdAt: number;
}

export interface ReflectionGenerationPayload {
  keyThemes: string[];
  emotionalPatterns: string[];
  positiveProgress: string[];
  recurringChallenges: string[];
  reflectionSummary: string;
  followUpQuestions: string[];
  modelUsed: string;
}

