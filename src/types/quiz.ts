export type SlideType = 
  | 'multiple_choice'
  | 'true_false'
  | 'numeric'
  | 'poll'
  | 'rating'
  | 'open_ended'
  | 'word_cloud'
  | 'content';

export type GameMode = 'live' | 'solo' | 'team' | 'self_paced';

export type GameSessionStatus = 
  | 'waiting'
  | 'active_question'
  | 'question_locked'
  | 'answer_reveal'
  | 'leaderboard'
  | 'completed'
  | 'cancelled';

export interface SlideOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  color?: string;
}

export interface QuizSlide {
  id: string;
  quizId: string;
  position: number;
  slideType: SlideType;
  title: string;
  content?: string;
  imageUrl?: string;
  timeLimitSeconds: number; // e.g. 15, 20, 30, 60
  basePoints: number; // e.g. 1000
  isDoublePoints?: boolean;
  speedScoring?: boolean; // default true
  options?: SlideOption[];
  expectedNumericAnswer?: number;
  numericTolerance?: number;
  explanation?: string;
  ratingMin?: number;
  ratingMax?: number;
  ratingMinLabel?: string;
  ratingMaxLabel?: string;
  openEndedMaxChars?: number;
  wordCloudMaxWords?: number;
}

export interface QuizSettings {
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showCorrectAnswerImmediately?: boolean;
  allowTeamMode?: boolean;
  requireParticipantApproval?: boolean;
  soundEffectsEnabled?: boolean;
  musicEnabled?: boolean;
}

export interface Quiz {
  id: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  category: string;
  tags: string[];
  language: string;
  visibility: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'published' | 'archived';
  settings: QuizSettings;
  slides: QuizSlide[];
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'creator' | 'admin';
  preferredTheme: 'light' | 'dark' | 'system';
  createdAt: string;
  googleId?: string;
  authProvider?: 'password' | 'google' | 'mongodb_realm';
}

export interface Participant {
  id: string;
  sessionId: string;
  userId?: string;
  nickname: string;
  avatarKey: string;
  teamId?: string;
  score: number;
  streak: number;
  correctCount: number;
  incorrectCount: number;
  lastResponseTimeMs: number;
  connectionStatus: 'connected' | 'disconnected';
  joinedAt: string;
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  avatarKey: string;
  totalScore: number;
  memberCount: number;
}

export interface AnswerSubmission {
  sessionId: string;
  participantId: string;
  slideId: string;
  answer: string | number | string[];
  responseTimeMs: number;
}

export interface AnswerRecord {
  id: string;
  sessionId: string;
  participantId: string;
  slideId: string;
  answer: string | number | string[];
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  submittedAt: string;
}

export interface LeaderboardEntry {
  participantId: string;
  nickname: string;
  avatarKey: string;
  score: number;
  rank: number;
  previousRank: number;
  streak: number;
  lastPointsEarned: number;
  isCorrectLastAnswer?: boolean;
  teamId?: string;
  teamName?: string;
}

export interface GameSession {
  id: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  hostName: string;
  joinCode: string;
  mode: GameMode;
  status: GameSessionStatus;
  currentSlideIndex: number;
  currentSlideStartedAt?: number; // timestamp ms
  questionDeadline?: number; // timestamp ms
  isLobbyLocked: boolean;
  participants: Participant[];
  teams: Team[];
  slides: QuizSlide[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface GameResult {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  totalParticipants: number;
  averageScore: number;
  topParticipants: LeaderboardEntry[];
  completedAt: string;
}

export interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedDurationMinutes: number;
  questionCount: number;
  slides: Partial<QuizSlide>[];
  tags: string[];
}
