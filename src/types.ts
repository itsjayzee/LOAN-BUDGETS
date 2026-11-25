export type LoanType = 'they_owe_me' | 'i_owe_them';

export interface Loan {
  id: string;
  personName: string;
  linkedUsername?: string;
  amount: number;
  currency?: CurrencyCode;
  paidAmount?: number;
  type: LoanType;
  phone?: string;
  dueDate?: string;
  notes?: string;
  status: 'active' | 'settled';
  createdAt: string;
  settledAt?: string;
  exchangeRateAtEntry?: number;
  fxRateToUsdAtEntry?: number;
}

export type Language = 'en' | 'ar' | 'ku' | 'tr' | 'fr' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  shortCode: string;
  isRtl: boolean;
}

export type ReminderTone = 'friendly' | 'formal' | 'urgent';

export type CurrencyCode = 'USD' | 'IQD' | 'EUR' | 'TRY' | 'IRR' | 'SAR';

export interface CurrencyItem {
  code: CurrencyCode;
  flag: string;
  symbol: string;
  nameEn: string;
  nameEs?: string;
  nameAr: string;
  nameKu?: string;
  nameTr?: string;
  nameFr?: string;
}

export type AiPersonality = 'diplomat' | 'auditor' | 'friend' | 'advisor';
export type AiResponseLength = 'short' | 'medium' | 'long';
export type AiCreativity = 'precise' | 'balanced' | 'creative';
export type ThemeMode = 'obsidian_neon' | 'midnight_gold' | 'nordic_frost' | 'velvet_pink' | 'dark' | 'light' | 'emerald' | 'sapphire' | 'amethyst' | 'sunset' | 'custom';
export type FontSize = 'small' | 'medium' | 'large';

export interface AttachedFile {
  name: string;
  type: string;
  base64: string;
  previewUrl?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachedFile?: AttachedFile;
  isError?: boolean;
  suggestedAction?: {
    type: 'add_loan';
    data: {
      personName: string;
      amount: number;
      loanType: LoanType;
      notes?: string;
    };
  };
  ledgerUpdate?: {
    actionType: 'repayment' | 'added_money';
    personName: string;
    loanType: LoanType;
    deltaAmount: number;
    deltaCurrency: CurrencyCode;
    balanceBefore: number;
    balanceAfter: number;
    loanCurrency: CurrencyCode;
    archived: boolean;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}


export type DefaultDuePeriod = 'none' | '7days' | '14days' | '30days' | '60days';
export type ViewMode = 'spacious' | 'compact';
export type SortOrder = 'newest' | 'oldest' | 'highest_amount' | 'due_soonest' | 'name_asc';

export interface UserSettings {
  profileName: string;
  theme: ThemeMode;
  customThemeColor?: string;
  customBgImage?: string;
  bgOpacity?: number;
  bgBlur?: number;
  fontSize: FontSize;
  language: Language;
  currency: CurrencyCode;
  aiPersonality: AiPersonality;
  responseLength: AiResponseLength;
  creativity: AiCreativity;
  customInstructions: string;
  incognitoMode: boolean;
  autoVoiceResponse: boolean;
  resetChatOnExit: boolean;
  soundEffectsEnabled: boolean;
  // Extra User Settings
  defaultReminderTone: ReminderTone;
  defaultDuePeriod: DefaultDuePeriod;
  viewMode: ViewMode;
  maskBalances: boolean;
  sortOrder: SortOrder;
  animationsEnabled: boolean;
  hapticFeedback: boolean;
  pushNotificationsEnabled: boolean;
  overdueFollowUpEnabled?: boolean;
  useEasternNumerals?: boolean;
  profileUsername?: string;
  profileBio?: string;
  profileAvatar?: string;
  profileJoinedAt?: string;
  lastUsernameChangeDate?: string;
  profileFibAccount?: string;
  customRates?: Record<CurrencyCode, number>;
  showDualCurrency?: boolean;
  dualPrimaryCurrency?: 'USD' | 'IQD';
}

export interface Translations {
  appName: string;
  tagline: string;
  theyOweMe: string;
  theyOweMeDesc: string;
  iOweThem: string;
  iOweThemDesc: string;
  totalToCollect: string;
  totalToPay: string;
  netPosition: string;
  netSurplus: string;
  netLiability: string;
  balanced: string;
  activeLoansCount: string;
  addNewLoan: string;
  quickLoan: string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  startByAdding: string;
  quickAddNow: string;
  nameLabel: string;
  namePlaceholder: string;
  amountLabel: string;
  amountPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  dueDateLabel: string;
  dueDateRequired: string;
  selectDueDate: string;
  dueToday: string;
  dueInDays: string;
  overdueByDays: string;
  dueSoon: string;
  notesLabel: string;
  notesPlaceholder: string;
  loanTypeLabel: string;
  saveLoan: string;
  cancel: string;
  quickLoanModalTitle: string;
  quickLoanModalSubtitle: string;
  addLoanModalTitle: string;
  addLoanModalSubtitle: string;
  filterAll: string;
  filterTheyOwe: string;
  filterIOwe: string;
  filterSettled: string;
  searchPlaceholder: string;
  sendReminder: string;
  markAsSettled: string;
  markAsActive: string;
  deleteLoan: string;
  confirmDelete: string;
  confirmDeleteMessage: string;
  delete: string;
  reminderModalTitle: string;
  reminderModalSubtitle: string;
  reminderPreviewLabel: string;
  toneLabel: string;
  toneFriendly: string;
  toneFormal: string;
  toneUrgent: string;
  sendViaWhatsApp: string;
  sendViaTelegram: string;
  sendViaViber: string;
  copyMessage: string;
  messageCopied: string;
  statusActive: string;
  statusSettled: string;
  createdOn: string;
  dueOn: string;
  overdue: string;
  requiredFieldError: string;
  invalidAmountError: string;
  currency: string;
  selectCurrency: string;
  totalDebt: string;
  settlementProgress: string;
  currencyBreakdownTitle: string;
  multiCurrencyNotice: string;


  // Tutorial
  tutorialTitle: string;
  tutorialSubtitle: string;
  openTutorial: string;

  // AI & Chat Reset
  resetChatTooltip: string;
  resetChatConfirm: string;
  resetChatOnExitLabel: string;
  resetChatOnExitDesc: string;
  soundEffectsLabel: string;
  soundEffectsDesc: string;

  // Advanced Settings Dashboard
  settingsTitle: string;
  settingsSubtitle: string;
  tabGeneral: string;
  tabPreferences: string;
  tabAiControls: string;
  tabGuide: string;
  tabChatHistory: string;
  tabPrivacySecurity: string;
  interactiveGuideTitle: string;
  interactiveGuideDesc: string;
  launchInteractiveGuide: string;
  defaultReminderToneLabel: string;
  defaultDuePeriodLabel: string;
  duePeriodNone: string;
  duePeriod7Days: string;
  duePeriod14Days: string;
  duePeriod30Days: string;
  duePeriod60Days: string;
  viewModeLabel: string;
  viewModeSpacious: string;
  viewModeCompact: string;
  maskBalancesLabel: string;
  maskBalancesDesc: string;
  sortOrderLabel: string;
  sortNewest: string;
  sortOldest: string;
  sortHighest: string;
  sortDueSoonest: string;
  sortNameAsc: string;
  animationsLabel: string;
  animationsDesc: string;
  hapticsLabel: string;
  hapticsDesc: string;
  profileSection: string;
  profileNameLabel: string;
  appearanceSection: string;
  themeLabel: string;
  themeDark: string;
  themeLight: string;
  themeEmerald: string;
  fontSizeLabel: string;
  fontSmall: string;
  fontMedium: string;
  fontLarge: string;
  preferredCurrency: string;
  aiPersonalityLabel: string;
  personalityDiplomat: string;
  personalityDiplomatDesc: string;
  personalityAuditor: string;
  personalityAuditorDesc: string;
  personalityFriend: string;
  personalityFriendDesc: string;
  personalityAdvisor: string;
  personalityAdvisorDesc: string;
  responseLengthLabel: string;
  lengthShort: string;
  lengthMedium: string;
  lengthLong: string;
  creativityLabel: string;
  creativityPrecise: string;
  creativityBalanced: string;
  creativityCreative: string;
  customInstructionsLabel: string;
  customInstructionsPlaceholder: string;
  autoVoiceLabel: string;
  autoVoiceDesc: string;
  chatHistoryTitle: string;
  chatHistoryDesc: string;
  newChatSession: string;
  clearAllChats: string;
  clearAllChatsDesc: string;
  confirmClearChats: string;
  noChatHistory: string;
  sessionMessagesCount: string;
  privacySecurityTitle: string;
  incognitoModeLabel: string;
  incognitoModeDesc: string;
  exportDataLabel: string;
  exportDataDesc: string;
  importDataLabel: string;
  importDataDesc: string;
  dangerZone: string;
  clearAllData: string;
  clearAllDataDesc: string;
  confirmClearTitle: string;
  confirmClearDesc: string;
  confirmClearBtn: string;
  saveSettings: string;
  settingsSaved: string;

  // Advanced AI Assistant features
  aiAssistantTitle: string;
  aiAssistantSubtitle: string;
  aiWelcomeMessage: string;
  aiInputPlaceholder: string;
  askAiHelp: string;
  suggestedQuestions: string[];
  searchChatPlaceholder: string;
  voiceInputListening: string;
  voiceInputPermissionError: string;
  voiceSpeakMessage: string;
  voiceStopSpeaking: string;
  copyMsgAction: string;
  regenerateAction: string;
  retryAction: string;
  editMsgAction: string;
  saveEditBtn: string;
  uploadFileAction: string;
  fileTooLarge: string;
  oneClickAddFromInvoice: string;
  newChatTooltip: string;
  tutorialGuide: string;
  clearChat: string;

  // Loan Edit & Partial Repayment
  editLoan: string;
  editLoanModalTitle: string;
  editLoanModalSubtitle: string;
  paidAmountLabel: string;
  remainingDebt: string;
  paidSoFar: string;
  payHalf: string;
  payQuarter: string;
  payThreeQuarters: string;
  payAll: string;
  resetPayment: string;
  saveChanges: string;
  logRepayment: string;
  repaymentProgress: string;
  originalDebt: string;

  // Add More Money / Debt
  addMoreDebtTab: string;
  logRepaymentTab: string;
  addAmountLabel: string;
  addMoneyDesc: string;
  amountAddedSuccess: string;
  addDebtBtn: string;
  customDebtTotal: string;

  // Export CSV & PDF
  exportCsvBtn: string;
  exportPdfBtn: string;
  exportScopeLabel: string;
  exportAllLoans: string;
  exportActiveOnly: string;
  exportSettledOnly: string;
  exportStatementTitle: string;
  exportReportDesc: string;

  // Due Date Push Notifications & Dual-Party System
  pushNotificationsLabel: string;
  pushNotificationsDesc: string;
  testNotificationBtn: string;
  notificationSentToast: string;
  notificationPermissionDenied: string;
  politeDueTodayReminder: string;
  dueTodayNotice: string;
  dualPartyNotifications: string;
  dualPartyDesc: string;
  borrowerReminderTitle: string;
  lenderMaturityTitle: string;
  overduePaymentTitle: string;
  tapToUpdateOrSettle: string;
  notificationCenterTitle: string;
  allNotifications: string;
  markAllRead: string;
  clearAll: string;
  noNotificationsYet: string;
  dualPartyTriggeredToast: string;
  capacitorPushActive: string;
  webPushActive: string;

  // Navigation Drawer & Menu
  hamburgerMenu: string;
  navDrawerTitle: string;
  navDrawerSubtitle: string;
  navDashboard: string;
  navQuickLoan: string;
  navAddLoan: string;
  navAiAssistant: string;
  navTutorial: string;
  navSettings: string;
  navExport: string;
  closeDrawer: string;

  // Theme Customization & Presets
  themeSectionTitle: string;
  themeSapphire: string;
  themeAmethyst: string;
  themeSunset: string;
  themeCustom: string;
  customAccentColorLabel: string;

  // Custom Background Image
  bgCustomizerTitle: string;
  bgCustomizerDesc: string;
  bgPresetNone: string;
  bgPresetGrid: string;
  bgPresetAurora: string;
  bgPresetEmerald: string;
  bgPresetCarbon: string;
  bgPresetSunset: string;
  uploadCustomBg: string;
  removeBg: string;
  bgOpacityLabel: string;
  bgBlurLabel: string;
  bgUploadSuccess: string;
  bgUploadTooLarge: string;

  // Debt & Credit Trends
  trendsTitle: string;
  trendsSubtitle: string;
  lent: string;
  borrowed: string;
  repaid: string;
  netFlow: string;
  last6Months: string;
  last12Months: string;
  areaChart: string;
  barChart: string;
  totalLentPeriod: string;
  totalBorrowedPeriod: string;
  totalRepaidPeriod: string;
  noActivityPeriod: string;
}

export interface MonthlyTrendPoint {
  monthKey: string;
  label: string;
  shortLabel: string;
  lentAmount: number;
  borrowedAmount: number;
  repaidAmount: number;
  netFlow: number;
  activeCount: number;
}

export type NotificationType = 'borrower_due' | 'lender_maturity' | 'overdue_followup';

export interface InAppNotification {
  id: string;
  loanId: string;
  type: NotificationType;
  title: string;
  body: string;
  fullMessage: string;
  creditorName: string;
  debtorName: string;
  amount: number;
  currency: CurrencyCode;
  timestamp: string;
  read: boolean;
  dueDate: string;
}

export type TransactionActionType =
  | 'created'
  | 'added_money'
  | 'repayment'
  | 'settled'
  | 'card_payment'
  | 'restored'
  | 'deleted'
  | 'edited';

export interface TransactionEntry {
  id: string;
  loanId: string;
  personName: string;
  linkedUsername?: string;
  loanType: LoanType;
  action: TransactionActionType;
  amountChange: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: CurrencyCode;
  timestamp: string;
  dateStr: string;
  notes?: string;
  exchangeRateAtEntry?: number;
  fxRateToUsdAtEntry?: number;
}

export interface PublicUserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  fibAccount?: string;
}

export interface FriendRecord {
  ownerId: string;
  friendUid: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  fibAccount?: string;
  addedAtIso?: string;
}

export type FriendChatMessageKind = 'text' | 'loan_ref' | 'payment_update';

export interface FriendChatParticipantSnapshot {
  displayName?: string;
  username?: string;
  avatar?: string;
  fibAccount?: string;
}

export interface FriendChatThread {
  id: string;
  participantA: string;
  participantB: string;
  participantIds: string[];
  participantProfiles?: Record<string, FriendChatParticipantSnapshot>;
  lastMessageText?: string;
  lastMessageAtIso?: string;
  lastSenderId?: string;
}

export interface FriendChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  text: string;
  messageKind: FriendChatMessageKind;
  linkedLoanId?: string;
  linkedLoanPerson?: string;
  linkedLoanUsername?: string;
  linkedLoanAmount?: number;
  linkedLoanCurrency?: CurrencyCode;
  linkedLoanType?: LoanType;
  linkedLoanStatus?: 'active' | 'settled';
  clientCreatedAt: string;
}


