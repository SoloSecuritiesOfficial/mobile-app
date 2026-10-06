/**
 * types.ts — Navigation param list
 *
 * Kept in its own file so navigationRef.ts, screens, and components can
 * import RootStackParamList WITHOUT pulling in AppNavigator.tsx.
 *
 * AppNavigator.tsx previously exported RootStackParamList, which caused a
 * circular dependency:
 *
 *   navigationRef  →  AppNavigator  →  every screen
 *   every screen   →  AdBanner      →  adRewardService  →  apiClient
 *   apiClient (lazy-require) → navigationRef   ← CYCLE
 *
 * Moving the type here breaks the cycle at its root.
 * AppNavigator re-exports it from here for backwards compatibility.
 */

export type RootStackParamList = {
  // Auth
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  NotificationPermission: undefined;
  // Core
  Dashboard: undefined;
  // Learning
  Learning: undefined;
  LearningDetails: { id: string };
  Labs: undefined;
  LabDetails: { id: string };
  // Quiz
  Quiz: undefined;
  QuizQuestion: { quizId: string };
  // Security
  SecurityScan: undefined;
  ScanHistory: undefined;
  CVEUpdates: undefined;
  BugReports: undefined;
  // Certificates
  Certificates: undefined;
  CertificateDetails: { id: string };
  // Profile
  Profile: undefined;
  ProfileSettings: undefined;
  AccountSettings: undefined;
  Settings: undefined;
  Notifications: undefined;
  // Jobs
  Jobs: undefined;
  JobDetails: { id: string };
  // Chat
  ChatList: undefined;
  Chat: { userId: string; username: string; profileImage?: string };
  // Social
  Friends: undefined;
  FriendProfile: { userId: string; username: string; profileImage?: string };
  Leaderboard: undefined;
  Achievements: undefined;
  // Premium & CTF
  Premium: undefined;
  CTF: undefined;
  // Tools
  PasswordChecker: undefined;
  HashGenerator: undefined;
  Tools: undefined;
  // Rewards
  AdRewards: undefined;
};
