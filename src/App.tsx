/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import {
  CurrencyCode,
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  LoanType,
  ChatSession,
  ChatMessage,
  UserSettings,
  TransactionEntry,
} from './types';
import {
  translations,
  calculateTotals,
  defaultSettings,
  ARCHIVE_STORAGE_KEY,
  TRANSACTIONS_STORAGE_KEY,
  partitionActiveAndArchivedLoans,
  settleAndArchiveLoan,
  restoreArchivedLoan,
  mergeLocalAndCloudLoans,
  mergeLocalAndCloudTransactions,
  createTransactionEntry,
  deriveUpdateTransaction,
  getRemainingLoanBalance,
  getTodayIsoDate,
  buildDueDateBannerState,
  buildHistoricalRateSnapshot,
  canShowPaymentActions,
  normalizeCustomRates,
  normalizeThemeMode,
  isLightThemeMode,
  sanitizeCurrencyCode,
  sanitizeLanguageCode,
  settleLoanByCardPayment,
  settleLoanByFibPayment,
  checkUsernameChangeEligibility,
  formatUsernameCooldownDate,
  reconcileOptimisticAndCloudLoans,
  isUsernameTakenInLocalStore,
  registerUsernameInLocalStore,
  normalizeUsernameHandle,
  resolveExactLoanChatUsername,
  readStoredAuthSession,
  writeStoredAuthSession,
  clearStoredAuthSession,
  PersistedAuthUser,
  CardBrand,
  FibPaymentMethod,
  PaymentRail,
  ParsedAiLedgerCommand,
} from './utils/loanLogic';
import {
  CloudSyncStatus,
  subscribeToAuth,
  subscribeUserCloudSync,
  saveLoanToCloud,
  removeLoanFromCloud,
  saveTransactionToCloud,
  removeTransactionFromCloud,
  savePreferencesToCloud,
  syncPublicUsernameHandle,
  checkUsernameAvailabilityInCloud,
  syncProfileSnapshotToChats,
  subscribeFriendsCloudSync,
  subscribeFriendChats,
  signOutAccount,
} from './firebase';
import { AuthModal } from './components/AuthModal';
import { playMoneyChime, playSettleChime, playSadChime } from './utils/soundEffects';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { DashboardStats } from './components/DashboardStats';
import { DebtCreditTrends } from './components/DebtCreditTrends';
import { ArchiveDatabaseView } from './components/ArchiveDatabaseView';
import { TransactionsView } from './components/TransactionsView';
import { FriendsChatView } from './components/FriendsChatView';
import { EmptyState } from './components/EmptyState';
import { LoanCard } from './components/LoanCard';
import { AddLoanModal } from './components/AddLoanModal';
import { EditLoanModal } from './components/EditLoanModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { CurrencyRateModal } from './components/CurrencyRateModal';
import { ProfileModal, ProfileSaveResult } from './components/ProfileModal';
import { BudgetAiFAB } from './components/BudgetAiFAB';
import { TutorialModal } from './components/TutorialModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { CardPaymentModal } from './components/CardPaymentModal';
import { CounterpartyProfileModal } from './components/CounterpartyProfileModal';
import {
  Search,
  Filter,
  Check,
  Plus,
  Archive,
  LayoutGrid,
  Bell,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
} from './components/OrganicIcons';
import {
  registerNotificationServiceWorker,
  checkAndTriggerAutomatedDueAndOverdue,
  triggerDueDateNotification,
  getUnreadNotificationCount,
} from './utils/notificationService';

const STORAGE_KEY = 'loan_budget_items_v2';
const SETTINGS_KEY = 'loan_budget_settings_v3';
const CHAT_SESSIONS_KEY = 'loan_budget_chat_sessions_v3';

export default function App() {
  // 1. Unified User Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          language: sanitizeLanguageCode(parsed?.language, defaultSettings.language),
          currency: sanitizeCurrencyCode(parsed?.currency, defaultSettings.currency),
          theme: normalizeThemeMode(parsed?.theme),
          customRates: normalizeCustomRates(parsed?.customRates),
          showDualCurrency: parsed?.showDualCurrency !== false,
          dualPrimaryCurrency: parsed?.dualPrimaryCurrency === 'USD' ? 'USD' : 'IQD',
        };
      }
      // Migrate legacy individual preferences if present
      const legacyLang = localStorage.getItem('loan_budget_lang_pref');
      const legacyCurr = localStorage.getItem('loan_budget_currency_pref');
      const legacyTheme = localStorage.getItem('loan_budget_theme_pref');
      const legacyProf = localStorage.getItem('loan_budget_profile_pref');
      return {
        ...defaultSettings,
        language: sanitizeLanguageCode(legacyLang, defaultSettings.language),
        currency: sanitizeCurrencyCode(legacyCurr, defaultSettings.currency),
        theme: normalizeThemeMode(legacyTheme || undefined),
        profileName: legacyProf || defaultSettings.profileName,
        customRates: normalizeCustomRates(defaultSettings.customRates),
        showDualCurrency: true,
        dualPrimaryCurrency: 'IQD',
      };
    } catch {
      return defaultSettings;
    }
  });

  // Partial settings updater
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated: UserSettings = {
        ...prev,
        ...newSettings,
        ...(newSettings.customRates !== undefined
          ? { customRates: normalizeCustomRates(newSettings.customRates) }
          : {}),
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Synchronize document direction and language attribute
  useEffect(() => {
    const isRtl = settings.language === 'ar' || settings.language === 'ku';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Synchronize root html & body background with active theme palette to prevent overscroll mismatch
  useEffect(() => {
    const mode = normalizeThemeMode(settings.theme);
    const rootBg =
      mode === 'velvet_pink'
        ? '#120B14'
        : mode === 'midnight_gold'
        ? '#060D1E'
        : mode === 'nordic_frost'
        ? '#08111B'
        : '#07090E';
    document.documentElement.style.backgroundColor = rootBg;
    document.body.style.backgroundColor = rootBg;
  }, [settings.theme]);

  const t = translations[settings.language];

  // 2. Partitioned Active Loans & Archive (auto-migrates any settled records)
  const initialPartition = useMemo(() => {
    try {
      const savedActive = localStorage.getItem(STORAGE_KEY);
      const savedArchive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      const parsedActive: Loan[] = savedActive ? JSON.parse(savedActive) : [];
      const parsedArchive: Loan[] = savedArchive ? JSON.parse(savedArchive) : [];
      return partitionActiveAndArchivedLoans(
        Array.isArray(parsedActive) ? parsedActive : [],
        Array.isArray(parsedArchive) ? parsedArchive : []
      );
    } catch {
      return { activeLoans: [], archivedLoans: [] };
    }
  }, []);

  const [loans, setLoans] = useState<Loan[]>(initialPartition.activeLoans);
  const [archivedLoans, setArchivedLoans] = useState<Loan[]>(initialPartition.archivedLoans);
  const [transactions, setTransactions] = useState<TransactionEntry[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeView, setActiveView] = useState<'active' | 'friends' | 'archive' | 'transactions'>('active');
  const [dashboardTransitionKey, setDashboardTransitionKey] = useState(0);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [chatThreads, setChatThreads] = useState<FriendChatThread[]>([]);
  const [preselectedChatLoan, setPreselectedChatLoan] = useState<Loan | null>(null);

  // Persistent Auth State initialized synchronously from localStorage ('ai_budget_auth') so refreshing never logs user out
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readStoredAuthSession().isAuthenticated);
  const [currentUser, setCurrentUser] = useState<PersistedAuthUser | null>(() => readStoredAuthSession().user);

  // Firebase Authentication & Cloud Sync State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loansRef = useRef<Loan[]>(loans);
  const archivedLoansRef = useRef<Loan[]>(archivedLoans);
  const transactionsRef = useRef<TransactionEntry[]>(transactions);
  const settingsRef = useRef<UserSettings>(settings);
  const friendsRef = useRef<FriendRecord[]>(friends);
  const chatThreadsRef = useRef<FriendChatThread[]>(chatThreads);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const currentUserRef = useRef<PersistedAuthUser | null>(currentUser);
  const wasFirebaseAuthenticatedRef = useRef<boolean>(false);
  const prevSyncedUsernameRef = useRef<string>(settings.profileUsername || '');
  const loanCreatedAtMapRef = useRef<Map<string, unknown>>(new Map());
  const prefsCreatedAtServerRef = useRef<unknown>(undefined);
  const prefsLastUsernameChangedAtRef = useRef<unknown>(undefined);
  const shouldStampUsernameChangeRef = useRef<boolean>(false);
  const pendingLoanUpsertsRef = useRef<Map<string, { loan: Loan; expiresAt: number }>>(new Map());
  const pendingLoanDeletesRef = useRef<Map<string, number>>(new Map());
  const hasMergedInitialCloudRef = useRef<boolean>(false);
  const hasMergedInitialTxCloudRef = useRef<boolean>(false);
  const isApplyingRemoteSnapshotRef = useRef<boolean>(false);
  const toastTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const markPendingLoanUpsert = useCallback((loan: Loan) => {
    pendingLoanDeletesRef.current.delete(loan.id);
    pendingLoanUpsertsRef.current.set(loan.id, {
      loan,
      expiresAt: Date.now() + 8000,
    });
  }, []);

  const markPendingLoanDelete = useCallback((loanId: string) => {
    pendingLoanUpsertsRef.current.delete(loanId);
    pendingLoanDeletesRef.current.set(loanId, Date.now() + 8000);
  }, []);

  useEffect(() => {
    loansRef.current = loans;
  }, [loans]);

  useEffect(() => {
    archivedLoansRef.current = archivedLoans;
  }, [archivedLoans]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    chatThreadsRef.current = chatThreads;
  }, [chatThreads]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Persist active loans in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
    } catch {
      // ignore
    }
  }, [loans]);

  // Persist Archive in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedLoans));
    } catch {
      // ignore
    }
  }, [archivedLoans]);

  // Persist Transaction Ledger in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  const recordTransaction = useCallback(
    (entry: TransactionEntry) => {
      setTransactions((prev) => [entry, ...prev]);
      if (authUser && authUser.emailVerified) {
        saveTransactionToCloud(authUser.uid, entry).catch(() => setCloudSyncStatus('error'));
      }
    },
    [authUser]
  );

  // Automated Due Date & Overdue Follow-Up Notification System (1 concise alert per critical loan)
  useEffect(() => {
    registerNotificationServiceWorker();
    if (settings.pushNotificationsEnabled) {
      checkAndTriggerAutomatedDueAndOverdue(loans, settings.profileName || 'You');
    }
  }, [loans, settings.pushNotificationsEnabled, settings.profileName]);

  // 3. Chat Sessions State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Initial default session
    return [
      {
        id: 'sess_' + Date.now(),
        title:
          settings.language === 'ar'
            ? 'محادثة Ai Budget'
            : settings.language === 'es'
            ? 'Sesión de Ai Budget'
            : 'Ai Budget Session',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_welcome',
            sender: 'assistant',
            text:
              settings.language === 'ar'
                ? 'مرحباً بك! أنا Ai Budget، مساعدك المالي الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن كيفية تسجيل الديون، أو تحليل استراتيجيات السداد (Snowball / Avalanche)، أو رفع صورة إيصال، أو الضغط على زر الميكروفون للتحدث معي صوتياً.'
                : settings.language === 'es'
                ? '¡Hola! Soy Ai Budget, tu asistente financiero inteligente. ¿Cómo puedo ayudarte hoy? Puedes preguntarme cómo gestionar tus préstamos, planificar pagos (Bola de Nieve / Avalancha), subir recibos o usar el micrófono para hablar conmigo.'
                : 'Hello! I am Ai Budget, your intelligent financial assistant. How can I help you today? You can ask me how to manage your loans, plan repayment strategies (Snowball / Avalanche), upload receipt photos, or press the microphone to talk with me directly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return chatSessions[0]?.id || 'sess_default';
  });

  // Persist sessions unless in incognito mode
  useEffect(() => {
    if (settings.incognitoMode) return;
    try {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
    } catch {
      // ignore
    }
  }, [chatSessions, settings.incognitoMode]);

  const activeSession = useMemo(() => {
    return chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  }, [chatSessions, activeSessionId]);

  const handleUpdateSessionMessages = (messages: ChatMessage[]) => {
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        // Derive dynamic session title from first user query if still generic
        let updatedTitle = s.title;
        const firstUserMsg = messages.find((m) => m.sender === 'user');
        if (firstUserMsg && (s.title.includes('Session') || s.title.includes('محادثة'))) {
          updatedTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        }
        return {
          ...s,
          title: updatedTitle,
          messages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: 'sess_' + Date.now(),
      title:
        settings.language === 'ar'
          ? `محادثة جديدة #${chatSessions.length + 1}`
          : settings.language === 'es'
          ? `Nuevo Chat #${chatSessions.length + 1}`
          : `New Chat #${chatSessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'assistant',
          text:
            settings.language === 'ar'
              ? 'أهلاً بك في جلسة جديدة! كيف أستطيع خدمتك في ميزانيتك اليوم؟'
              : settings.language === 'es'
              ? '¡Bienvenido a una nueva sesión! ¿En qué consulta financiera puedo ayudarte hoy?'
              : 'Welcome to a fresh session! What financial question can I help you explore today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setChatSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: 'sess_' + Date.now(),
          title:
            settings.language === 'ar'
              ? 'محادثة Ai Budget'
              : settings.language === 'es'
              ? 'Sesión de Ai Budget'
              : 'Ai Budget Session',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleClearAllSessions = () => {
    const fresh: ChatSession = {
      id: 'sess_' + Date.now(),
      title:
        settings.language === 'ar'
          ? 'محادثة جديدة'
          : settings.language === 'es'
          ? 'Nueva Sesión de Chat'
          : 'New Chat Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setChatSessions([fresh]);
    setActiveSessionId(fresh.id);
    try {
      localStorage.removeItem(CHAT_SESSIONS_KEY);
    } catch {
      // ignore
    }
  };

  // Toast banner for AI loan addition
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  const syncAllLocalToCloud = useCallback(
    async (uid: string) => {
      setCloudSyncStatus('syncing');
      try {
        const combined = [...loansRef.current, ...archivedLoansRef.current];
        for (const item of combined) {
          await saveLoanToCloud(uid, item, loanCreatedAtMapRef.current);
        }
        for (const tx of transactionsRef.current) {
          await saveTransactionToCloud(uid, tx);
        }
        await savePreferencesToCloud(
          uid,
          settingsRef.current,
          prefsCreatedAtServerRef.current,
          prefsLastUsernameChangedAtRef.current,
          shouldStampUsernameChangeRef.current
        );
        shouldStampUsernameChangeRef.current = false;
        setCloudSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Cloud sync failed:', err);
        setCloudSyncStatus('error');
      }
    },
    []
  );

  // Subscribe to Firebase Auth state and attach Firestore real-time sync listeners
  useEffect(() => {
    let unsubCloud: (() => void) | null = null;
    let unsubFriends: (() => void) | null = null;
    let unsubChats: (() => void) | null = null;

    const unsubAuth = subscribeToAuth((user) => {
      if (unsubCloud) {
        unsubCloud();
        unsubCloud = null;
      }
      if (unsubFriends) {
        unsubFriends();
        unsubFriends = null;
      }
      if (unsubChats) {
        unsubChats();
        unsubChats = null;
      }
      hasMergedInitialCloudRef.current = false;
      hasMergedInitialTxCloudRef.current = false;
      loanCreatedAtMapRef.current = new Map();
      prefsCreatedAtServerRef.current = undefined;
      prefsLastUsernameChangedAtRef.current = undefined;
      shouldStampUsernameChangeRef.current = false;
      pendingLoanUpsertsRef.current.clear();
      pendingLoanDeletesRef.current.clear();
      setAuthUser(user);

      if (!user) {
        setCloudSyncStatus('local');
        setFriends([]);
        setChatThreads([]);
        // Only clear persisted 'ai_budget_auth' when an active Firebase session explicitly transitions out,
        // NOT on initial mount when localStorage already holds a restored session.
        if (wasFirebaseAuthenticatedRef.current) {
          wasFirebaseAuthenticatedRef.current = false;
          clearStoredAuthSession();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
        return;
      }

      wasFirebaseAuthenticatedRef.current = true;

      // Auto-populate blank profile fields from authenticated Google/Account info once
      const profilePatch: Partial<UserSettings> = {};
      if (!settingsRef.current.profileName?.trim() && user.displayName?.trim()) {
        profilePatch.profileName = user.displayName.trim().slice(0, 80);
      }
      if (!settingsRef.current.profileAvatar?.trim() && user.photoURL?.trim()) {
        profilePatch.profileAvatar = user.photoURL.trim();
      }
      if (Object.keys(profilePatch).length > 0) {
        handleUpdateSettings(profilePatch);
      }

      // Sync persisted 'ai_budget_auth' session cleanly with live Firebase user + profile fields
      const syncedSession = writeStoredAuthSession({
        uid: user.uid,
        name:
          profilePatch.profileName ||
          settingsRef.current.profileName ||
          user.displayName ||
          currentUserRef.current?.name ||
          '',
        username: settingsRef.current.profileUsername || currentUserRef.current?.username || '',
        email: user.email || currentUserRef.current?.email || '',
        avatar:
          profilePatch.profileAvatar ||
          settingsRef.current.profileAvatar ||
          user.photoURL ||
          currentUserRef.current?.avatar,
        lastUsernameChangeDate:
          settingsRef.current.lastUsernameChangeDate ||
          currentUserRef.current?.lastUsernameChangeDate ||
          Date.now(),
      });
      setIsAuthenticated(syncedSession.isAuthenticated);
      setCurrentUser(syncedSession.user);

      if (!user.emailVerified) {
        setCloudSyncStatus('unverified');
        return;
      }

      setCloudSyncStatus('syncing');
      unsubCloud = subscribeUserCloudSync(user.uid, {
        onLoansSnapshot: async (cloudLoans, createdAtMap) => {
          loanCreatedAtMapRef.current = createdAtMap;
          const reconciledCloudLoans = reconcileOptimisticAndCloudLoans({
            cloudLoans,
            pendingUpserts: pendingLoanUpsertsRef.current,
            pendingDeletes: pendingLoanDeletesRef.current,
          });
          if (!hasMergedInitialCloudRef.current) {
            hasMergedInitialCloudRef.current = true;
            const merged = mergeLocalAndCloudLoans(
              loansRef.current,
              archivedLoansRef.current,
              reconciledCloudLoans
            );
            isApplyingRemoteSnapshotRef.current = true;
            setLoans(merged.activeLoans);
            setArchivedLoans(merged.archivedLoans);
            isApplyingRemoteSnapshotRef.current = false;

            if (merged.toUpload.length > 0) {
              for (const localLoan of merged.toUpload) {
                try {
                  await saveLoanToCloud(user.uid, localLoan, loanCreatedAtMapRef.current);
                } catch {
                  // surfaced by onError/status
                }
              }
            }
          } else {
            const partitioned = partitionActiveAndArchivedLoans(reconciledCloudLoans, []);
            isApplyingRemoteSnapshotRef.current = true;
            setLoans(partitioned.activeLoans);
            setArchivedLoans(partitioned.archivedLoans);
            isApplyingRemoteSnapshotRef.current = false;
          }
          setCloudSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        },
        onTransactionsSnapshot: async (cloudTxs) => {
          if (!hasMergedInitialTxCloudRef.current) {
            hasMergedInitialTxCloudRef.current = true;
            const merged = mergeLocalAndCloudTransactions(transactionsRef.current, cloudTxs);
            setTransactions(merged.mergedTransactions);
            if (merged.toUpload.length > 0) {
              for (const localTx of merged.toUpload) {
                try {
                  await saveTransactionToCloud(user.uid, localTx);
                } catch {
                  // surfaced by onError/status
                }
              }
            }
          } else {
            setTransactions([...cloudTxs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
          }
        },
        onPreferencesSnapshot: (settingsPatch, createdAtServer, lastUsernameChangedAtServer) => {
          prefsCreatedAtServerRef.current = createdAtServer;
          prefsLastUsernameChangedAtRef.current = lastUsernameChangedAtServer;
          isApplyingRemoteSnapshotRef.current = true;
          if (typeof settingsPatch.profileUsername === 'string') {
            prevSyncedUsernameRef.current = settingsPatch.profileUsername;
          }
          if (Object.keys(settingsPatch).length > 0) {
            setSettings((prev) => {
              const next = { ...prev, ...settingsPatch };
              try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
              } catch {
                // ignore
              }
              return next;
            });
          }
          isApplyingRemoteSnapshotRef.current = false;
        },
        onError: () => {
          setCloudSyncStatus('error');
        },
      });

      unsubFriends = subscribeFriendsCloudSync(user.uid, {
        onFriendsSnapshot: (list) => setFriends(list),
        onError: () => setCloudSyncStatus('error'),
      });

      unsubChats = subscribeFriendChats(user.uid, {
        onChatsSnapshot: (threads) => setChatThreads(threads),
        onError: () => setCloudSyncStatus('error'),
      });

      if (settingsRef.current.profileUsername) {
        syncPublicUsernameHandle(user.uid, {
          username: settingsRef.current.profileUsername,
          displayName: settingsRef.current.profileName,
          avatar: settingsRef.current.profileAvatar,
          bio: settingsRef.current.profileBio,
          fibAccount: settingsRef.current.profileFibAccount,
        })
          .then((res) => {
            if (res.status === 'updated') {
              prevSyncedUsernameRef.current = settingsRef.current.profileUsername || '';
            }
          })
          .catch(() => {
            // ignore background username sync failure on initial mount
          });
      }
    });

    return () => {
      unsubAuth();
      if (unsubCloud) unsubCloud();
      if (unsubFriends) unsubFriends();
      if (unsubChats) unsubChats();
    };
  }, []);

  // Check whether a @username is unique across local registry, friends list, and Firestore /usernames
  const handleCheckUsernameAvailable = useCallback(
    async (candidateUsername: string): Promise<boolean> => {
      const normalized = normalizeUsernameHandle(candidateUsername);
      if (!normalized) return true;
      const currentOwnerId = authUser?.uid || 'guest_local';
      if (
        isUsernameTakenInLocalStore({
          username: normalized,
          ownerId: currentOwnerId,
          friends: friendsRef.current,
        })
      ) {
        return false;
      }
      const cloudRes = await checkUsernameAvailabilityInCloud(normalized, authUser?.uid || null);
      return cloudRes.available;
    },
    [authUser?.uid]
  );

  // Persistent Login Handler ('ai_budget_auth') + smooth dashboard transition
  const handleLogin = useCallback(
    (userData: {
      uid?: string;
      name: string;
      username: string;
      email: string;
      avatar?: string;
      fibAccount?: string;
      lastUsernameChangeDate?: number | string;
    }) => {
      try {
        const userSession = writeStoredAuthSession({
          ...userData,
          lastUsernameChangeDate: userData.lastUsernameChangeDate || Date.now(),
        });

        setIsAuthenticated(true);
        setCurrentUser(userSession.user);

        // Trigger smooth transition/redirect back to Home dashboard
        setActiveView('active');
        setFilterType('all');
        setDashboardTransitionKey((k) => k + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Failed to save session to local storage:', error);
        showToast(
          settingsRef.current.language === 'ku'
            ? 'نەتوانرا داتای چوونەژوورەوە پاشەکەوت بکرێت.'
            : settingsRef.current.language === 'ar'
            ? 'تعذر حفظ جلسة تسجيل الدخول محلياً.'
            : settingsRef.current.language === 'es'
            ? 'No se pudo guardar la sesión de acceso localmente.'
            : 'Unable to save authentication session locally. Please check browser storage settings.'
        );
      }
    },
    []
  );

  // Explicit Logout Handler: clears 'ai_budget_auth' and signs out Firebase cleanly
  const handleLogout = useCallback(async () => {
    wasFirebaseAuthenticatedRef.current = false;
    clearStoredAuthSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthUser(null);
    setCloudSyncStatus('local');
    setFriends([]);
    setChatThreads([]);
    setIsAuthModalOpen(false);
    try {
      await signOutAccount();
    } catch {
      // ignore if already signed out of Firebase SDK
    }
  }, []);

  // Instant post-login redirect straight to Home / Dashboard with smooth GPU transition
  const handleAuthLoginSuccess = useCallback(
    (
      signedUser: User,
      options?: { isNewAccount?: boolean; claimedUsername?: string; claimedDisplayName?: string }
    ) => {
      wasFirebaseAuthenticatedRef.current = true;
      setAuthUser(signedUser);
      setIsAuthModalOpen(false);
      setIsDrawerOpen(false);
      setIsSettingsOpen(false);
      setIsProfileOpen(false);

      let activeUsername = settingsRef.current.profileUsername || '';
      let activeDisplayName =
        (options?.claimedDisplayName || '').trim().slice(0, 120) ||
        settingsRef.current.profileName ||
        signedUser.displayName ||
        signedUser.email?.split('@')[0] ||
        'User';
      let activeLastUsernameChange: number | string = settingsRef.current.lastUsernameChangeDate || Date.now();

      if (options?.claimedDisplayName?.trim()) {
        handleUpdateSettings({
          profileName: activeDisplayName,
        });
      }

      if (options?.claimedUsername) {
        const cleanHandle = options.claimedUsername
          .trim()
          .replace(/^@+/, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 32);
        if (cleanHandle) {
          const prevHandle = settingsRef.current.profileUsername || '';
          const nowIso = new Date().toISOString();
          activeUsername = cleanHandle;
          activeLastUsernameChange = nowIso;
          shouldStampUsernameChangeRef.current = true;
          registerUsernameInLocalStore({
            nextUsername: cleanHandle,
            previousUsername: prevHandle,
            ownerId: signedUser.uid,
          });
          handleUpdateSettings({
            profileUsername: cleanHandle,
            lastUsernameChangeDate: nowIso,
          });
          if (signedUser.emailVerified) {
            syncPublicUsernameHandle(
              signedUser.uid,
              {
                username: cleanHandle,
                displayName: activeDisplayName,
                avatar: settingsRef.current.profileAvatar,
                bio: settingsRef.current.profileBio,
                fibAccount: settingsRef.current.profileFibAccount,
              },
              prevSyncedUsernameRef.current || prevHandle
            )
              .then((res) => {
                if (res.status === 'updated') {
                  prevSyncedUsernameRef.current = cleanHandle;
                }
              })
              .catch(() => {
                // ignore background sync retry
              });
          }
        }
      }

      handleLogin({
        uid: signedUser.uid,
        name: activeDisplayName,
        username: activeUsername,
        email: signedUser.email || '',
        avatar: settingsRef.current.profileAvatar || signedUser.photoURL || undefined,
        fibAccount: settingsRef.current.profileFibAccount || undefined,
        lastUsernameChangeDate: activeLastUsernameChange,
      });
    },
    [handleLogin]
  );

  // Save profile settings with strict 7-day username cooldown + atomic uniqueness validation before state mutation
  const handleSaveProfileSettings = async (patch: Partial<UserSettings>): Promise<ProfileSaveResult> => {
    const previousHandle = settingsRef.current.profileUsername || '';
    const previousCooldownDate = settingsRef.current.lastUsernameChangeDate || '';
    const nextCandidateUsername =
      patch.profileUsername !== undefined ? patch.profileUsername : previousHandle;

    const eligibility = checkUsernameChangeEligibility({
      currentUsername: previousHandle,
      nextUsername: nextCandidateUsername,
      lastUsernameChangeDate: previousCooldownDate,
    });

    if (!eligibility.allowed && eligibility.availableAtIso) {
      const unlockText = formatUsernameCooldownDate(eligibility.availableAtIso, settingsRef.current.language);
      showToast(
        settingsRef.current.language === 'ku'
          ? `گۆڕینی ناوی بەکارهێنەر لە ${unlockText} بەردەست دەبێت`
          : settingsRef.current.language === 'ar'
          ? `تغيير اسم المستخدم متاح في ${unlockText}`
          : settingsRef.current.language === 'tr'
          ? `Kullanıcı adı değişikliği ${unlockText} tarihinde açılır`
          : settingsRef.current.language === 'fr'
          ? `Changement de nom disponible le ${unlockText}`
          : settingsRef.current.language === 'es'
          ? `Cambio de usuario disponible el ${unlockText}`
          : `Username change available on ${unlockText}`
      );
      return {
        blocked: true,
        reason: 'cooldown',
        availableAtIso: eligibility.availableAtIso,
      };
    }

    const ownerId = authUser?.uid || 'guest_local';
    const normalizedNext = normalizeUsernameHandle(nextCandidateUsername);
    const takenErrorToast =
      settingsRef.current.language === 'ku'
        ? 'ئەم ناوی بەکارهێنەرە پێشتر گیراوە. تکایە ناوێکی تر هەڵبژێرە.'
        : settingsRef.current.language === 'ar'
        ? 'اسم المستخدم هذا مأخوذ بالفعل. يرجى اختيار اسم آخر.'
        : settingsRef.current.language === 'tr'
        ? 'Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seçin.'
        : settingsRef.current.language === 'fr'
        ? "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre."
        : settingsRef.current.language === 'es'
        ? 'Este nombre de usuario ya está en uso. Elige otro.'
        : 'This username is already taken. Please choose another.';

    if (eligibility.changed && normalizedNext) {
      const takenLocally = isUsernameTakenInLocalStore({
        username: normalizedNext,
        ownerId,
        friends: friendsRef.current,
      });
      if (takenLocally) {
        showToast(takenErrorToast);
        return { blocked: true, reason: 'taken' };
      }

      const cloudAvail = await checkUsernameAvailabilityInCloud(normalizedNext, authUser?.uid || null);
      if (!cloudAvail.available) {
        showToast(takenErrorToast);
        return { blocked: true, reason: 'taken' };
      }
    }

    const effectivePatch: Partial<UserSettings> = {
      ...patch,
      ...(eligibility.changed && eligibility.nextChangeDateIso
        ? { lastUsernameChangeDate: eligibility.nextChangeDateIso }
        : {}),
    };

    const nextUsername = effectivePatch.profileUsername ?? settingsRef.current.profileUsername ?? '';
    const nextDisplayName = effectivePatch.profileName ?? settingsRef.current.profileName;
    const nextAvatar = effectivePatch.profileAvatar ?? settingsRef.current.profileAvatar;
    const nextBio = effectivePatch.profileBio ?? settingsRef.current.profileBio;
    const nextFibAccount = effectivePatch.profileFibAccount ?? settingsRef.current.profileFibAccount;

    if (authUser && authUser.emailVerified) {
      const syncedPrevious = prevSyncedUsernameRef.current || previousHandle;
      try {
        const result = await syncPublicUsernameHandle(
          authUser.uid,
          {
            username: nextUsername,
            displayName: nextDisplayName,
            avatar: nextAvatar,
            bio: nextBio,
            fibAccount: nextFibAccount,
          },
          syncedPrevious
        );
        if (result.status === 'taken') {
          showToast(takenErrorToast);
          return { blocked: true, reason: 'taken' };
        }
        prevSyncedUsernameRef.current = result.status === 'cleared' ? '' : nextUsername;
      } catch {
        setCloudSyncStatus('error');
      }

      if (chatThreadsRef.current.length > 0) {
        syncProfileSnapshotToChats(
          authUser.uid,
          {
            displayName: nextDisplayName,
            username: nextUsername,
            avatar: nextAvatar,
            fibAccount: nextFibAccount,
          },
          chatThreadsRef.current
        ).catch(() => {
          // ignore background chat snapshot refresh error
        });
      }
    }

    if (eligibility.changed) {
      shouldStampUsernameChangeRef.current = true;
      registerUsernameInLocalStore({
        nextUsername,
        previousUsername: previousHandle,
        ownerId,
      });
    }

    handleUpdateSettings(effectivePatch);
    if (isAuthenticatedRef.current) {
      const updatedSession = writeStoredAuthSession({
        uid: authUser?.uid || currentUserRef.current?.uid,
        name: nextDisplayName || currentUserRef.current?.name || '',
        username: nextUsername,
        email: authUser?.email || currentUserRef.current?.email || '',
        avatar: nextAvatar || currentUserRef.current?.avatar,
        fibAccount: nextFibAccount || currentUserRef.current?.fibAccount,
        lastUsernameChangeDate:
          effectivePatch.lastUsernameChangeDate ||
          settingsRef.current.lastUsernameChangeDate ||
          currentUserRef.current?.lastUsernameChangeDate ||
          Date.now(),
      });
      setCurrentUser(updatedSession.user);
    }
    return { blocked: false };
  };

  // Push settings updates to Firestore whenever user modifies them locally
  useEffect(() => {
    if (!authUser || !authUser.emailVerified || isApplyingRemoteSnapshotRef.current) return;
    const timer = setTimeout(() => {
      const stampNow = shouldStampUsernameChangeRef.current;
      shouldStampUsernameChangeRef.current = false;
      savePreferencesToCloud(
        authUser.uid,
        settings,
        prefsCreatedAtServerRef.current,
        prefsLastUsernameChangedAtRef.current,
        stampNow
      )
        .then(() => {
          setCloudSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        })
        .catch(() => {
          if (stampNow) {
            shouldStampUsernameChangeRef.current = true;
          }
          setCloudSyncStatus('error');
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [authUser, settings]);

  // Modal & Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalArchiveDefault, setAddModalArchiveDefault] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() => getUnreadNotificationCount());
  const [payCardLoan, setPayCardLoan] = useState<Loan | null>(null);
  const [payInitialRail, setPayInitialRail] = useState<PaymentRail>('card');
  const [deleteTargetLoan, setDeleteTargetLoan] = useState<Loan | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [profileOverlayLoan, setProfileOverlayLoan] = useState<Loan | null>(null);
  const [newlyAddedLoanId, setNewlyAddedLoanId] = useState<string | null>(null);

  const avatarByUsernameLower = useMemo(() => {
    const map = new Map<string, string>();
    for (const thread of chatThreads) {
      if (!thread.participantProfiles) continue;
      for (const [uid, snap] of Object.entries(thread.participantProfiles)) {
        if (authUser?.uid && uid === authUser.uid) continue;
        const norm = snap.username ? normalizeUsernameHandle(snap.username) : '';
        if (norm && snap.avatar && !map.has(norm)) {
          map.set(norm, snap.avatar);
        }
      }
    }
    for (const friend of friends) {
      const norm = normalizeUsernameHandle(friend.username);
      if (norm && friend.avatar) {
        map.set(norm, friend.avatar);
      }
    }
    return map;
  }, [friends, chatThreads, authUser?.uid]);

  // Sync notification badges in real-time
  useEffect(() => {
    const handleUpdate = () => {
      setUnreadNotifCount(getUnreadNotificationCount());
    };
    window.addEventListener('loan_budget_notifications_updated', handleUpdate);
    return () => window.removeEventListener('loan_budget_notifications_updated', handleUpdate);
  }, []);

  // Filter & Search states
  const [filterType, setFilterType] = useState<'all' | 'they_owe_me' | 'i_owe_them'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard Totals calculation (direct per-currency summaries, no FX distortion)
  const totals = useMemo(
    () => calculateTotals(loans, settings.currency),
    [loans, settings.currency]
  );

  // Add Loan handler (supports Active Loans or adding directly to Archive)
  const handleAddLoan = (data: {
    personName: string;
    linkedUsername?: string;
    amount: number;
    type: LoanType;
    currency?: CurrencyCode;
    dueDate?: string;
    phone?: string;
    notes?: string;
    saveToArchive?: boolean;
  }) => {
    const loanCurrency = data.currency || settings.currency;
    const fxSnapshot = buildHistoricalRateSnapshot(loanCurrency, settings.customRates);
    const cleanHandle = (data.linkedUsername || '')
      .trim()
      .replace(/^@+/, '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 32);
    const newLoan: Loan = {
      id: 'loan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      personName: data.personName,
      ...(cleanHandle ? { linkedUsername: cleanHandle } : {}),
      amount: data.amount,
      type: data.type,
      currency: loanCurrency,
      dueDate: data.dueDate,
      phone: data.phone,
      notes: data.notes,
      status: data.saveToArchive ? 'settled' : 'active',
      createdAt: getTodayIsoDate(),
      ...fxSnapshot,
    };

    if (data.saveToArchive) {
      const archivedRecord = settleAndArchiveLoan(newLoan);
      markPendingLoanUpsert(archivedRecord);
      setArchivedLoans((prev) => [archivedRecord, ...prev]);
      if (authUser && authUser.emailVerified) {
        saveLoanToCloud(authUser.uid, archivedRecord, loanCreatedAtMapRef.current).catch(() =>
          setCloudSyncStatus('error')
        );
      }
      recordTransaction(
        createTransactionEntry({
          loan: archivedRecord,
          action: 'created',
          amountChange: archivedRecord.amount,
          balanceBefore: 0,
          balanceAfter: 0,
          notes: archivedRecord.notes,
        })
      );
      playSettleChime(settings.soundEffectsEnabled);
      showToast(
        settings.language === 'ku'
          ? `${data.personName} ڕاستەوخۆ زیادکرا بۆ ئەرشیف!`
          : settings.language === 'ar'
          ? `تمت إضافة ${data.personName} مباشرة إلى الأرشيف!`
          : settings.language === 'tr'
          ? `${data.personName} doğrudan Arşiv'e eklendi!`
          : settings.language === 'fr'
          ? `${data.personName} ajouté directement à l'Archive !`
          : settings.language === 'es'
          ? `¡Se añadió ${data.personName} directamente al Archivo!`
          : `Added ${data.personName} directly to Archive!`
      );
      return;
    }

    markPendingLoanUpsert(newLoan);
    setLoans((prev) => [newLoan, ...prev]);
    if (authUser && authUser.emailVerified) {
      saveLoanToCloud(authUser.uid, newLoan, loanCreatedAtMapRef.current).catch(() =>
        setCloudSyncStatus('error')
      );
    }
    recordTransaction(
      createTransactionEntry({
        loan: newLoan,
        action: 'created',
        amountChange: newLoan.amount,
        balanceBefore: 0,
        balanceAfter: newLoan.amount,
        notes: newLoan.notes,
      })
    );
    setNewlyAddedLoanId(newLoan.id);

    // Auto clear newly added status after organic entrance settles
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setNewlyAddedLoanId((curr) => (curr === newLoan.id ? null : curr));
    }, 1200);

    // Subtle audio feedback
    if (data.type === 'i_owe_them') {
      playSadChime(settings.soundEffectsEnabled);
    } else {
      playMoneyChime(settings.soundEffectsEnabled);
    }
  };

  // Add loan directly from AI suggestion / receipt extraction
  const handleAddLoanFromAi = (data: {
    personName: string;
    amount: number;
    type: LoanType;
    currency?: CurrencyCode;
    notes?: string;
  }) => {
    handleAddLoan(data);
    const usedCurr = data.currency || settings.currency;
    showToast(
      settings.language === 'ku'
        ? `بەسەرکەوتوویی ${data.personName} (${data.amount} ${usedCurr}) زیادکرا بۆ تۆمارەکانت!`
        : settings.language === 'ar'
        ? `تمت إضافة ${data.personName} (${data.amount} ${usedCurr}) بنجاح إلى سجلاتك!`
        : settings.language === 'tr'
        ? `${data.personName} (${data.amount} ${usedCurr}) başarıyla eklendi!`
        : settings.language === 'fr'
        ? `${data.personName} (${data.amount} ${usedCurr}) a été ajouté avec succès !`
        : settings.language === 'es'
        ? `¡Se añadió ${data.personName} (${data.amount} ${usedCurr}) a tu panel!`
        : `Added ${data.personName} (${data.amount} ${usedCurr}) to your dashboard!`
    );
  };

  // Automatic ledger updates triggered by natural-language commands in Ai Budget
  const handleExecuteAiLedgerAction = (cmd: ParsedAiLedgerCommand) => {
    const { targetLoan, updatedLoan: rawUpdatedLoan, shouldArchive, actionType } = cmd;
    const updatedLoan: Loan = rawUpdatedLoan.exchangeRateAtEntry
      ? rawUpdatedLoan
      : {
          ...rawUpdatedLoan,
          ...buildHistoricalRateSnapshot(rawUpdatedLoan.currency || settings.currency, settings.customRates),
        };
    const txAction = shouldArchive
      ? 'settled'
      : actionType === 'added_money'
      ? 'added_money'
      : 'repayment';

    if (shouldArchive) {
      const archivedRecord = settleAndArchiveLoan(updatedLoan);
      markPendingLoanUpsert(archivedRecord);
      setLoans((prev) => prev.filter((l) => l.id !== targetLoan.id));
      setArchivedLoans((prev) => [archivedRecord, ...prev.filter((a) => a.id !== targetLoan.id)]);
      if (authUser && authUser.emailVerified) {
        saveLoanToCloud(authUser.uid, archivedRecord, loanCreatedAtMapRef.current).catch(() =>
          setCloudSyncStatus('error')
        );
      }
      recordTransaction(deriveUpdateTransaction(targetLoan, archivedRecord, txAction));
      playSettleChime(settings.soundEffectsEnabled);
    } else {
      markPendingLoanUpsert(updatedLoan);
      setLoans((prev) => prev.map((l) => (l.id === targetLoan.id ? updatedLoan : l)));
      if (authUser && authUser.emailVerified) {
        saveLoanToCloud(authUser.uid, updatedLoan, loanCreatedAtMapRef.current).catch(() =>
          setCloudSyncStatus('error')
        );
      }
      recordTransaction(deriveUpdateTransaction(targetLoan, updatedLoan, txAction));
      setNewlyAddedLoanId(updatedLoan.id);
      if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => {
        setNewlyAddedLoanId((curr) => (curr === updatedLoan.id ? null : curr));
      }, 1200);
      if (updatedLoan.type === 'i_owe_them') {
        playSadChime(settings.soundEffectsEnabled);
      } else {
        playMoneyChime(settings.soundEffectsEnabled);
      }
    }

    const loanCurr = targetLoan.currency || settings.currency;
    showToast(
      settings.language === 'ku'
        ? `Ai Budget: تۆماری ${targetLoan.personName} خۆکار نوێکرایەوە!`
        : settings.language === 'ar'
        ? `Ai Budget: تم تحديث سجل ${targetLoan.personName} تلقائياً!`
        : settings.language === 'tr'
        ? `Ai Budget: ${targetLoan.personName} kaydı otomatik güncellendi!`
        : settings.language === 'fr'
        ? `Ai Budget : Dossier de ${targetLoan.personName} mis à jour (${cmd.balanceAfter} ${loanCurr}) !`
        : settings.language === 'es'
        ? `Ai Budget actualizó a ${targetLoan.personName} (quedan ${cmd.balanceAfter.toLocaleString()} ${loanCurr}).`
        : `Ai Budget updated ${targetLoan.personName} (${cmd.balanceAfter.toLocaleString()} ${loanCurr} left)!`
    );
  };

  // Mark loan settled -> automatically moves to Archive
  const handleToggleStatus = (id: string) => {
    const target = loans.find((l) => l.id === id);
    if (target) {
      const targetWithFx = target.exchangeRateAtEntry
        ? target
        : {
            ...target,
            ...buildHistoricalRateSnapshot(target.currency || settings.currency, settings.customRates),
          };
      const prevRemaining = getRemainingLoanBalance(targetWithFx);
      const archivedRecord = settleAndArchiveLoan(targetWithFx);
      markPendingLoanUpsert(archivedRecord);
      setLoans((prev) => prev.filter((l) => l.id !== id));
      setArchivedLoans((prev) => [archivedRecord, ...prev.filter((a) => a.id !== id)]);
      if (authUser && authUser.emailVerified) {
        saveLoanToCloud(authUser.uid, archivedRecord, loanCreatedAtMapRef.current).catch(() =>
          setCloudSyncStatus('error')
        );
      }
      recordTransaction(
        createTransactionEntry({
          loan: archivedRecord,
          action: 'settled',
          amountChange: prevRemaining,
          balanceBefore: prevRemaining,
          balanceAfter: 0,
          notes: archivedRecord.notes,
        })
      );
      playSettleChime(settings.soundEffectsEnabled);
      showToast(
        settings.language === 'ku'
          ? `${target.personName} پاکتاو کرا و گواسترایەوە بۆ ئەرشیف!`
          : settings.language === 'ar'
          ? `تمت تسوية سجل ${target.personName} ونقله إلى الأرشيف!`
          : settings.language === 'tr'
          ? `${target.personName} ödendi olarak işaretlendi ve Arşive taşındı!`
          : settings.language === 'fr'
          ? `${target.personName} réglé et déplacé vers l'Archive !`
          : settings.language === 'es'
          ? `¡${target.personName} liquidado y movido al Archivo!`
          : `${target.personName} settled & moved to Archive!`
      );
      return;
    }

    // Fallback: if toggled from archive, restore to active
    const archivedTarget = archivedLoans.find((l) => l.id === id);
    if (archivedTarget) {
      handleRestoreFromArchive(id);
    }
  };

  // Animate active debt progress ring to 100% during checkout verification overlay
  const handlePreSettleRing = (loan: Loan) => {
    setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...l, paidAmount: l.amount } : l)));
  };

  // Settle active loan via simulated Visa / Mastercard card payment -> move to Archive
  const handleCompleteCardPayment = (
    loan: Loan,
    paymentMeta: { brand: CardBrand; last4: string; cardholderName: string; lockedAmount?: number }
  ) => {
    const loanWithFx = loan.exchangeRateAtEntry
      ? loan
      : {
          ...loan,
          ...buildHistoricalRateSnapshot(loan.currency || settings.currency, settings.customRates),
        };
    const prevRemaining = getRemainingLoanBalance(loanWithFx);
    const settledDelta =
      typeof paymentMeta.lockedAmount === 'number' && paymentMeta.lockedAmount >= 0
        ? paymentMeta.lockedAmount
        : prevRemaining;
    const settledRecord = settleLoanByCardPayment(loanWithFx, { ...paymentMeta, lockedAmount: settledDelta });
    markPendingLoanUpsert(settledRecord);
    setLoans((prev) => prev.filter((l) => l.id !== loan.id));
    setArchivedLoans((prev) => [settledRecord, ...prev.filter((a) => a.id !== loan.id)]);
    if (authUser && authUser.emailVerified) {
      saveLoanToCloud(authUser.uid, settledRecord, loanCreatedAtMapRef.current).catch(() =>
        setCloudSyncStatus('error')
      );
    }
    recordTransaction(
      createTransactionEntry({
        loan: settledRecord,
        action: 'card_payment',
        amountChange: settledDelta,
        balanceBefore: prevRemaining,
        balanceAfter: 0,
        notes: settledRecord.notes,
      })
    );
    playSettleChime(settings.soundEffectsEnabled);
    const networkLabel = paymentMeta.brand === 'mastercard' ? 'Mastercard' : 'Visa';
    showToast(
      settings.language === 'ku'
        ? `پارەدان بە ${networkLabel} (•••• ${paymentMeta.last4}) سەرکەوتوو بوو و گواسترایەوە بۆ ئەرشیف!`
        : settings.language === 'ar'
        ? `تم السداد عبر ${networkLabel} (•••• ${paymentMeta.last4}) ونقل السجل إلى الأرشيف!`
        : settings.language === 'tr'
        ? `${networkLabel} (•••• ${paymentMeta.last4}) ile ödeme alındı ve Arşive taşındı!`
        : settings.language === 'fr'
        ? `Payé par ${networkLabel} (•••• ${paymentMeta.last4}) et déplacé vers l'Archive !`
        : settings.language === 'es'
        ? `¡Pagado con ${networkLabel} •••• ${paymentMeta.last4} y movido al Archivo!`
        : `Paid via ${networkLabel} •••• ${paymentMeta.last4} & moved to Archive!`
    );
  };

  // Settle active loan via First Iraqi Bank (FIB) QuickPay QR / IBAN -> move to Archive
  const handleCompleteFibPayment = (
    loan: Loan,
    paymentMeta: {
      method: FibPaymentMethod;
      reference: string;
      accountLast4: string;
      accountHolderName: string;
      lockedAmount?: number;
    }
  ) => {
    const loanWithFx = loan.exchangeRateAtEntry
      ? loan
      : {
          ...loan,
          ...buildHistoricalRateSnapshot(loan.currency || settings.currency, settings.customRates),
        };
    const prevRemaining = getRemainingLoanBalance(loanWithFx);
    const settledDelta =
      typeof paymentMeta.lockedAmount === 'number' && paymentMeta.lockedAmount >= 0
        ? paymentMeta.lockedAmount
        : prevRemaining;
    const settledRecord = settleLoanByFibPayment(loanWithFx, { ...paymentMeta, lockedAmount: settledDelta });
    markPendingLoanUpsert(settledRecord);
    setLoans((prev) => prev.filter((l) => l.id !== loan.id));
    setArchivedLoans((prev) => [settledRecord, ...prev.filter((a) => a.id !== loan.id)]);
    if (authUser && authUser.emailVerified) {
      saveLoanToCloud(authUser.uid, settledRecord, loanCreatedAtMapRef.current).catch(() =>
        setCloudSyncStatus('error')
      );
    }
    recordTransaction(
      createTransactionEntry({
        loan: settledRecord,
        action: 'card_payment',
        amountChange: settledDelta,
        balanceBefore: prevRemaining,
        balanceAfter: 0,
        notes: settledRecord.notes,
      })
    );
    playSettleChime(settings.soundEffectsEnabled);
    showToast(
      settings.language === 'ku'
        ? `پارەدان بە بانکی عێراقی یەکەم (FIB · ${paymentMeta.reference}) سەرکەوتوو بوو و گواسترایەوە بۆ ئەرشیف!`
        : settings.language === 'ar'
        ? `تم السداد عبر مصرف العراق الأول (FIB · ${paymentMeta.reference}) ونقل السجل إلى الأرشيف!`
        : settings.language === 'tr'
        ? `First Iraqi Bank (FIB · ${paymentMeta.reference}) ödemesi onaylandı ve Arşive taşındı!`
        : settings.language === 'fr'
        ? `Payé via First Iraqi Bank (FIB · ${paymentMeta.reference}) et déplacé vers l'Archive !`
        : settings.language === 'es'
        ? `¡Pagado vía First Iraqi Bank (FIB · ${paymentMeta.reference}) y movido al Archivo!`
        : `Paid via First Iraqi Bank (FIB · ${paymentMeta.reference}) & moved to Archive!`
    );
  };

  // Restore loan from Archive back to Active Dashboard
  const handleRestoreFromArchive = (id: string) => {
    const target = archivedLoans.find((l) => l.id === id);
    if (!target) return;
    const rawRestored = restoreArchivedLoan(target);
    const restored: Loan = rawRestored.exchangeRateAtEntry
      ? rawRestored
      : {
          ...rawRestored,
          ...buildHistoricalRateSnapshot(rawRestored.currency || settings.currency, settings.customRates),
        };
    const restoredBal = getRemainingLoanBalance(restored);
    markPendingLoanUpsert(restored);
    setArchivedLoans((prev) => prev.filter((l) => l.id !== id));
    setLoans((prev) => [restored, ...prev.filter((l) => l.id !== id)]);
    if (authUser && authUser.emailVerified) {
      saveLoanToCloud(authUser.uid, restored, loanCreatedAtMapRef.current).catch(() =>
        setCloudSyncStatus('error')
      );
    }
    recordTransaction(
      createTransactionEntry({
        loan: restored,
        action: 'restored',
        amountChange: restoredBal,
        balanceBefore: 0,
        balanceAfter: restoredBal,
        notes: restored.notes,
      })
    );
    setNewlyAddedLoanId(restored.id);
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setNewlyAddedLoanId((curr) => (curr === restored.id ? null : curr));
    }, 1200);
    if (restored.type === 'i_owe_them') {
      playSadChime(settings.soundEffectsEnabled);
    } else {
      playMoneyChime(settings.soundEffectsEnabled);
    }
    showToast(
      settings.language === 'ku'
        ? `${restored.personName} گەڕێنرایەوە بۆ لیستی چالاک!`
        : settings.language === 'ar'
        ? `تمت استعادة ${restored.personName} إلى القائمة النشطة!`
        : settings.language === 'tr'
        ? `${restored.personName} aktif kayıtlara geri alındı!`
        : settings.language === 'fr'
        ? `${restored.personName} restauré dans les prêts actifs !`
        : settings.language === 'es'
        ? `¡${restored.personName} restaurado a Préstamos Activos!`
        : `Restored ${restored.personName} to Active Loans!`
    );
  };

  // Update loan (person details, notes, or partial / full repayment -> auto-archives if settled)
  const handleUpdateLoan = (rawUpdated: Loan) => {
    const updated: Loan = rawUpdated.exchangeRateAtEntry
      ? rawUpdated
      : {
          ...rawUpdated,
          ...buildHistoricalRateSnapshot(rawUpdated.currency || settings.currency, settings.customRates),
        };
    const prevLoan = loans.find((l) => l.id === updated.id) || archivedLoans.find((l) => l.id === updated.id);
    if (updated.status === 'settled') {
      const archivedRecord = settleAndArchiveLoan(updated);
      markPendingLoanUpsert(archivedRecord);
      setLoans((prev) => prev.filter((l) => l.id !== updated.id));
      setArchivedLoans((prev) => [archivedRecord, ...prev.filter((a) => a.id !== updated.id)]);
      if (authUser && authUser.emailVerified) {
        saveLoanToCloud(authUser.uid, archivedRecord, loanCreatedAtMapRef.current).catch(() =>
          setCloudSyncStatus('error')
        );
      }
      recordTransaction(deriveUpdateTransaction(prevLoan || updated, archivedRecord, 'settled'));
      playSettleChime(settings.soundEffectsEnabled);
      showToast(
        settings.language === 'ku'
          ? `قەرزی ${updated.personName} بە تەواوی درایەوە و گواسترایەوە بۆ ئەرشیف!`
          : settings.language === 'ar'
          ? `تم سداد ${updated.personName} بالكامل ونقله إلى الأرشيف!`
          : settings.language === 'tr'
          ? `${updated.personName} tamamen ödendi ve Arşive taşındı!`
          : settings.language === 'fr'
          ? `Prêt de ${updated.personName} soldé et déplacé dans l'Archive !`
          : settings.language === 'es'
          ? `¡Pagado en su totalidad! Se movió ${updated.personName} al Archivo.`
          : `Paid in full! Moved ${updated.personName} to Archive.`
      );
      return;
    }

    markPendingLoanUpsert(updated);
    setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    if (authUser && authUser.emailVerified) {
      saveLoanToCloud(authUser.uid, updated, loanCreatedAtMapRef.current).catch(() =>
        setCloudSyncStatus('error')
      );
    }
    if (prevLoan) {
      recordTransaction(deriveUpdateTransaction(prevLoan, updated));
    }
    setNewlyAddedLoanId(updated.id);
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setNewlyAddedLoanId((curr) => (curr === updated.id ? null : curr));
    }, 1200);

    if (updated.type === 'i_owe_them') {
      playSadChime(settings.soundEffectsEnabled);
    } else {
      playMoneyChime(settings.soundEffectsEnabled);
    }
    showToast(
      settings.language === 'ku'
        ? `بەسەرکەوتوویی دانەوە و زانیارییەکانی ${updated.personName} نوێکرانەوە!`
        : settings.language === 'ar'
        ? `تم تحديث وتوثيق سداد ${updated.personName} بنجاح!`
        : settings.language === 'tr'
        ? `${updated.personName} bilgileri ve ödeme durumu güncellendi!`
        : settings.language === 'fr'
        ? `Paiement et détails mis à jour pour ${updated.personName} !`
        : settings.language === 'es'
        ? `¡Se actualizaron los pagos y detalles de ${updated.personName}!`
        : `Updated payment & details for ${updated.personName}!`
    );
  };

  // Delete single loan (from either active loans or archive)
  const handleDeleteLoan = (id: string) => {
    const rawTarget = loans.find((l) => l.id === id) || archivedLoans.find((l) => l.id === id);
    if (rawTarget) {
      const target = rawTarget.exchangeRateAtEntry
        ? rawTarget
        : {
            ...rawTarget,
            ...buildHistoricalRateSnapshot(rawTarget.currency || settings.currency, settings.customRates),
          };
      const prevRemaining = target.status === 'settled' ? 0 : getRemainingLoanBalance(target);
      recordTransaction(
        createTransactionEntry({
          loan: target,
          action: 'deleted',
          amountChange: prevRemaining,
          balanceBefore: prevRemaining,
          balanceAfter: 0,
          notes: target.notes,
        })
      );
    }
    markPendingLoanDelete(id);
    setLoans((prev) => prev.filter((l) => l.id !== id));
    setArchivedLoans((prev) => prev.filter((l) => l.id !== id));
    if (authUser && authUser.emailVerified) {
      removeLoanFromCloud(authUser.uid, id).catch(() => setCloudSyncStatus('error'));
    }
  };

  // Danger zone: Clear All Data (both active, archive, and transactions ledger)
  const handleClearAllData = () => {
    const idsToDelete = [...loans, ...archivedLoans].map((l) => l.id);
    const txIdsToDelete = transactions.map((tx) => tx.id);
    idsToDelete.forEach((id) => markPendingLoanDelete(id));
    setLoans([]);
    setArchivedLoans([]);
    setTransactions([]);
    if (authUser && authUser.emailVerified) {
      idsToDelete.forEach((id) => {
        removeLoanFromCloud(authUser.uid, id).catch(() => setCloudSyncStatus('error'));
      });
      txIdsToDelete.forEach((txId) => {
        removeTransactionFromCloud(authUser.uid, txId).catch(() => setCloudSyncStatus('error'));
      });
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ARCHIVE_STORAGE_KEY);
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Import backup from JSON file
  const handleImportBackup = (data: { loans?: any[]; settings?: Partial<UserSettings>; transactions?: TransactionEntry[] }) => {
    if (data.loans && Array.isArray(data.loans)) {
      const partitioned = partitionActiveAndArchivedLoans(data.loans, []);
      setLoans(partitioned.activeLoans);
      setArchivedLoans(partitioned.archivedLoans);
      if (authUser && authUser.emailVerified) {
        [...partitioned.activeLoans, ...partitioned.archivedLoans].forEach((l) => {
          saveLoanToCloud(authUser.uid, l, loanCreatedAtMapRef.current).catch(() =>
            setCloudSyncStatus('error')
          );
        });
      }
    }
    if (data.transactions && Array.isArray(data.transactions)) {
      const merged = mergeLocalAndCloudTransactions(transactionsRef.current, data.transactions);
      setTransactions(merged.mergedTransactions);
      if (authUser && authUser.emailVerified) {
        merged.mergedTransactions.forEach((tx) => {
          saveTransactionToCloud(authUser.uid, tx).catch(() => setCloudSyncStatus('error'));
        });
      }
    }
    if (data.settings) {
      handleUpdateSettings(data.settings);
    }
    showToast(
      settings.language === 'ku'
        ? 'بەسەرکەوتوویی لەبەرگیراوەی یەدەگ و زانیارییەکان گەڕێنرانەوە!'
        : settings.language === 'ar'
        ? 'تم استيراد النسخة الاحتياطية واستعادة البيانات بنجاح!'
        : settings.language === 'tr'
        ? 'Yedek başarıyla içe aktarıldı ve veriler geri yüklendi!'
        : settings.language === 'fr'
        ? 'Sauvegarde importée et données restaurées avec succès !'
        : settings.language === 'es'
        ? '¡Copia de seguridad importada y datos restaurados con éxito!'
        : 'Backup imported and data restored successfully!'
    );
  };

  // Active loans due today for instant awareness & 1-tap polite reminder
  const todayStr = useMemo(() => getTodayIsoDate(), []);
  const dueBannerState = useMemo(
    () => buildDueDateBannerState(loans, settings.language, todayStr),
    [loans, settings.language, todayStr]
  );
  const loansDueToday = dueBannerState.dueTodayLoans;

  // Filtered, searched and sorted list
  const filteredLoans = useMemo(() => {
    const list = loans.filter((loan) => {
      // Filter tab
      if (filterType === 'they_owe_me' && loan.type !== 'they_owe_me') {
        return false;
      }
      if (filterType === 'i_owe_them' && loan.type !== 'i_owe_them') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cleanQ = q.replace(/^@+/, '');
        const matchesName = (loan.personName || '').toLowerCase().includes(q);
        const matchesUsername = Boolean(cleanQ && loan.linkedUsername?.toLowerCase().includes(cleanQ));
        const matchesNotes = loan.notes?.toLowerCase().includes(q);
        const matchesPhone = loan.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesUsername && !matchesNotes && !matchesPhone) {
          return false;
        }
      }

      return true;
    });

    // Apply sort order
    return [...list].sort((a, b) => {
      switch (settings.sortOrder) {
        case 'oldest':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'highest_amount':
          return b.amount - a.amount;
        case 'due_soonest': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case 'name_asc':
          return (a.personName || '').localeCompare(b.personName || '');
        case 'newest':
        default:
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
  }, [loans, filterType, searchQuery, settings.sortOrder]);

  // Curated 4-Dark-Theme Engine & Typography classes
  const activeThemeMode = normalizeThemeMode(settings.theme);
  const isLight = isLightThemeMode(activeThemeMode);
  const isNordic = activeThemeMode === 'nordic_frost';
  const isVelvetPink = activeThemeMode === 'velvet_pink';

  const themeContainerClass =
    activeThemeMode === 'velvet_pink'
      ? 'theme-velvet-pink bg-[#120B14] text-[#FDF4FA]'
      : activeThemeMode === 'midnight_gold'
      ? 'theme-midnight-gold bg-[#060D1E] text-[#F8FAFC]'
      : activeThemeMode === 'nordic_frost'
      ? 'theme-nordic-frost bg-[#08111B] text-[#E6F4FF]'
      : 'theme-obsidian bg-[#07090E] text-[#F3F5F9]';

  const fontSizeClass = useMemo(() => {
    switch (settings.fontSize) {
      case 'small':
        return 'font-size-small';
      case 'large':
        return 'font-size-large';
      case 'medium':
      default:
        return 'font-size-medium';
    }
  }, [settings.fontSize]);

  const effectiveAuthEmail =
    authUser?.email ||
    (isAuthenticated ? currentUser?.email || currentUser?.name || 'Member' : null) ||
    null;
  const effectiveProfileName = settings.profileName || (isAuthenticated ? currentUser?.name || '' : '');
  const effectiveProfileUsername = settings.profileUsername || (isAuthenticated ? currentUser?.username || '' : '');
  const effectiveProfileAvatar = settings.profileAvatar || (isAuthenticated ? currentUser?.avatar || '' : '');
  const effectiveProfileFibAccount = settings.profileFibAccount || (isAuthenticated ? currentUser?.fibAccount || '' : '');

  return (
    <MotionConfig reducedMotion="user">
    <div
      dir={settings.language === 'ar' || settings.language === 'ku' ? 'rtl' : 'ltr'}
      lang={settings.language}
      data-theme={activeThemeMode}
      className={`min-h-screen transition-colors duration-300 flex flex-col font-sans relative ${
        isLight
          ? 'selection:bg-sky-500/20 selection:text-slate-900'
          : isVelvetPink
          ? 'selection:bg-[#FF2E93]/30 selection:text-[#FFD6EB]'
          : 'selection:bg-emerald-500/30 selection:text-emerald-200'
      } ${themeContainerClass} ${fontSizeClass} ${
        settings.language === 'ku' ? 'font-kurdish' : settings.language === 'ar' ? 'font-arabic' : ''
      }`}
    >
      {/* Subtle Atmospheric Velvet Pink Wallpaper Layer (when Velvet Pink theme active & no custom bg) */}
      {isVelvetPink && !settings.customBgImage && (
        <div
          data-testid="velvet-pink-wallpaper-bg"
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.18] scale-[1.02]"
            style={{
              backgroundImage:
                'url("/assets/aistudio/gta-6-sunset-palm-trees-wallpaper-3840x2160-1-1920x1080_fffde830.png")',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 25%, rgba(18, 11, 20, 0.35) 0%, rgba(18, 11, 20, 0.78) 65%, rgba(18, 11, 20, 0.94) 100%)',
            }}
          />
        </div>
      )}

      {/* Dynamic Custom Background Layer (if user uploads a custom background) */}
      {settings.customBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              settings.customBgImage.startsWith('data:') ||
              settings.customBgImage.startsWith('http') ||
              settings.customBgImage.startsWith('blob:')
                ? `url("${settings.customBgImage}")`
                : settings.customBgImage,
            opacity: settings.bgOpacity ?? 0.15,
            filter: settings.bgBlur ? `blur(${settings.bgBlur}px)` : undefined,
          }}
          aria-hidden="true"
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-[4.75rem] sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-organic-enter pointer-events-none max-w-[calc(100vw-2rem)]">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold shadow-xl shadow-emerald-500/20 text-xs sm:text-sm">
            <Check className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header (Minimalist Typographic Branding, Language, Auth & Settings) */}
      <Header
        language={settings.language}
        onLanguageChange={(lang: Language) => handleUpdateSettings({ language: lang })}
        translations={t}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenAiAssistant={() => setIsAiOpen((prev) => !prev)}
        onOpenNotificationCenter={() => {
          setIsNotificationCenterOpen(true);
          setUnreadNotifCount(getUnreadNotificationCount());
        }}
        unreadNotifCount={unreadNotifCount}
        isAiOpen={isAiOpen}
        profileName={effectiveProfileName}
        profileUsername={effectiveProfileUsername}
        profileAvatar={effectiveProfileAvatar}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        authUserEmail={effectiveAuthEmail}
        cloudSyncStatus={cloudSyncStatus}
        themeMode={activeThemeMode}
        onThemeChange={(theme) => handleUpdateSettings({ theme })}
        customRates={settings.customRates}
        onOpenFxCalculator={() => setIsFxModalOpen(true)}
      />

      {/* Main Content Area with generous mobile breathing space */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-32 sm:pb-24 space-y-5 sm:space-y-6">

        {/* Primary View Switcher: Active Dashboard, Archive / History Database & Transactions Ledger */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div
            className={`inline-flex flex-wrap items-center gap-1 p-1.5 rounded-2xl backdrop-blur-xl shadow-lg border ${
              isNordic
                ? 'bg-[#0E1B2B]/90 border-sky-400/22'
                : isVelvetPink
                ? 'bg-[#1F1224]/90 border-[#E8B4A0]/20'
                : 'bg-[#0D121F]/90 border-white/[0.08]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveView('active')}
              data-testid="active-tab-btn"
              className={`min-h-[40px] flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold smooth-interactive cursor-pointer ${
                activeView === 'active'
                  ? isNordic
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/45 shadow-sm'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/22 text-[#FFD6EB] border border-[#FF65B5]/50 shadow-[0_0_18px_-4px_rgba(255,46,147,0.45)]'
                    : activeThemeMode === 'midnight_gold'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid glow="accent" className="w-4 h-4" />
              <span>
                {settings.language === 'ku'
                  ? 'قەرزە چالاکەکان'
                  : settings.language === 'ar'
                  ? 'السجلات النشطة'
                  : settings.language === 'tr'
                  ? 'Aktif Kayıtlar'
                  : settings.language === 'fr'
                  ? 'Prêts Actifs'
                  : settings.language === 'es'
                  ? 'Préstamos Activos'
                  : 'Active Loans'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-numeric ${
                  activeView === 'active' && isLight
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-slate-200/80 text-slate-700'
                    : 'bg-white/10 text-white'
                }`}
              >
                {loans.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('friends')}
              data-testid="friends-tab-btn"
              className={`min-h-[40px] flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold smooth-interactive cursor-pointer active:scale-[0.98] ${
                activeView === 'friends'
                  ? isNordic
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/45 shadow-sm'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/22 text-[#FFD6EB] border border-[#FF65B5]/50 shadow-[0_0_18px_-4px_rgba(255,46,147,0.45)]'
                    : activeThemeMode === 'midnight_gold'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-200'
              }`}
            >
              <Users glow="accent" className="w-4 h-4" />
              <span>
                {settings.language === 'ku'
                  ? 'هاوڕێیان'
                  : settings.language === 'ar'
                  ? 'الأصدقاء'
                  : settings.language === 'tr'
                  ? 'Arkadaşlar'
                  : settings.language === 'fr'
                  ? 'Amis'
                  : settings.language === 'es'
                  ? 'Amigos'
                  : 'Friends'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-numeric ${
                  activeView === 'friends' && isLight
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-emerald-100 text-emerald-700'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/25 text-[#FFD6EB]'
                    : 'bg-emerald-500/25 text-emerald-200'
                }`}
              >
                {friends.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('archive')}
              data-testid="archive-tab-btn"
              className={`min-h-[40px] flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold smooth-interactive cursor-pointer active:scale-[0.98] ${
                activeView === 'archive'
                  ? isNordic
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/45 shadow-sm'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/22 text-[#FFD6EB] border border-[#FF65B5]/50 shadow-[0_0_18px_-4px_rgba(255,46,147,0.45)]'
                    : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-indigo-200'
              }`}
            >
              <Archive glow="accent" className="w-4 h-4" />
              <span>
                {settings.language === 'ku'
                  ? 'ئەرشیف'
                  : settings.language === 'ar'
                  ? 'الأرشيف'
                  : settings.language === 'tr'
                  ? 'Arşiv'
                  : settings.language === 'fr'
                  ? 'Archive'
                  : settings.language === 'es'
                  ? 'Archivo'
                  : 'Archive'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-numeric ${
                  activeView === 'archive' && isLight
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-indigo-100 text-indigo-700'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/25 text-[#FFD6EB]'
                    : 'bg-indigo-500/25 text-indigo-200'
                }`}
              >
                {archivedLoans.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('transactions')}
              data-testid="transactions-tab-btn"
              className={`min-h-[40px] flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold smooth-interactive cursor-pointer active:scale-[0.98] ${
                activeView === 'transactions'
                  ? isNordic
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/45 shadow-sm'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/22 text-[#FFD6EB] border border-[#FF65B5]/50 shadow-[0_0_18px_-4px_rgba(255,46,147,0.45)]'
                    : activeThemeMode === 'midnight_gold'
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40 shadow-sm'
                    : 'bg-teal-500/25 text-teal-200 border border-teal-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-teal-200'
              }`}
            >
              <ArrowLeftRight glow="accent" className="w-4 h-4" />
              <span>
                {settings.language === 'ku'
                  ? 'مامەڵەکان'
                  : settings.language === 'ar'
                  ? 'سجل المعاملات'
                  : settings.language === 'tr'
                  ? 'İşlemler'
                  : settings.language === 'fr'
                  ? 'Transactions'
                  : settings.language === 'es'
                  ? 'Transacciones'
                  : 'Transactions'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-numeric ${
                  activeView === 'transactions' && isLight
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-teal-500/25 text-teal-200'
                }`}
              >
                {transactions.length}
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
        {activeView === 'friends' ? (
          <motion.div
            key="view-friends"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.85 }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
          >
            <FriendsChatView
              language={settings.language}
              themeMode={activeThemeMode}
              authUid={authUser?.uid || null}
              authEmailVerified={Boolean(authUser?.emailVerified)}
              settings={settings}
              allLoans={[...loans, ...archivedLoans]}
              friends={friends}
              chatThreads={chatThreads}
              preselectedLoan={preselectedChatLoan}
              onClearPreselectedLoan={() => setPreselectedChatLoan(null)}
              onBackToActive={() => setActiveView('active')}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onShowToast={showToast}
            />
          </motion.div>
        ) : activeView === 'transactions' ? (
          <motion.div
            key="view-transactions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.85 }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
          >
            <TransactionsView
              transactions={transactions}
              language={settings.language}
              translations={t}
              activeCurrency={settings.currency}
              maskBalances={settings.maskBalances}
              themeMode={activeThemeMode}
              customRates={settings.customRates}
              showDualCurrency={settings.showDualCurrency !== false}
              dualPrimaryCurrency={settings.dualPrimaryCurrency || 'IQD'}
              onBackToActive={() => setActiveView('active')}
            />
          </motion.div>
        ) : activeView === 'archive' ? (
          <motion.div
            key="view-archive"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.85 }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
          >
            <ArchiveDatabaseView
              archivedLoans={archivedLoans}
              language={settings.language}
              translations={t}
              activeCurrency={settings.currency}
              maskBalances={settings.maskBalances}
              themeMode={activeThemeMode}
              customRates={settings.customRates}
              showDualCurrency={settings.showDualCurrency !== false}
              dualPrimaryCurrency={settings.dualPrimaryCurrency || 'IQD'}
              onRestoreLoan={handleRestoreFromArchive}
              onDeleteArchivedLoan={(l) => setDeleteTargetLoan(l)}
              onBackToActive={() => setActiveView('active')}
              onOpenAddToArchive={() => {
                setAddModalArchiveDefault(true);
                setIsAddModalOpen(true);
              }}
              dueTodayCount={dueBannerState.dueCount}
              dueTodayHeadline={dueBannerState.headline}
              onJumpToDueAlerts={() => setActiveView('active')}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`dashboard-${dashboardTransitionKey}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.85 }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
            data-testid="dashboard-home-view"
            className={dashboardTransitionKey > 0 ? 'space-y-6 animate-dashboard-entry' : 'space-y-6'}
          >
            {/* Due Today Intelligent Alert Banner — Integrated at Top of Active Loans Dashboard */}
            {dueBannerState.hasDueToday && (
              <div
                data-testid="active-dashboard-due-banner"
                className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 backdrop-blur-2xl border shadow-xl animate-organic-enter ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/80 border-amber-300 shadow-amber-900/10'
                    : 'bg-gradient-to-r from-amber-500/10 via-[#0D121F]/85 to-amber-500/5 border-amber-500/25 shadow-amber-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                        isLight
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" strokeWidth={1.65} />
                    </div>
                    <div>
                      <p className={`text-xs sm:text-sm font-bold tracking-wide ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                        {dueBannerState.headline}
                      </p>
                      <p className={`text-[11px] mt-0.5 font-medium flex items-center gap-1.5 ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                        <span>{dueBannerState.peopleSummary}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        let sent = 0;
                        for (const l of loansDueToday) {
                          await triggerDueDateNotification(l, settings.profileName || 'You');
                          sent++;
                        }
                        setUnreadNotifCount(getUnreadNotificationCount());
                        showToast(
                          settings.language === 'ku'
                            ? `ئاگاداری کاتی دانەوە بۆ (${sent}) تۆمار نێردرا!`
                            : settings.language === 'ar'
                            ? `تم إرسال تنبيه الاستحقاق لـ (${sent}) سجل!`
                            : settings.language === 'tr'
                            ? `(${sent}) kayıt için vade uyarısı gönderildi!`
                            : settings.language === 'fr'
                            ? `Alerte d'échéance envoyée pour (${sent}) prêt(s) !`
                            : settings.language === 'es'
                            ? `¡Aviso de vencimiento enviado para (${sent}) registro(s)!`
                            : `Sent due alert for (${sent}) scheduled loan(s)!`
                        );
                      }}
                      className="btn-premium px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.85} />
                      <span>
                        {settings.language === 'ku'
                          ? 'ناردنی ئاگاداری'
                          : settings.language === 'ar'
                          ? 'إرسال تنبيه الاستحقاق'
                          : settings.language === 'tr'
                          ? 'Vade Uyarısı Gönder'
                          : settings.language === 'fr'
                          ? 'Envoyer alerte échéance'
                          : settings.language === 'es'
                          ? 'Enviar avisos'
                          : 'Send Due Alerts'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNotificationCenterOpen(true)}
                      className={`btn-premium px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                        isLight
                          ? 'bg-amber-100/70 hover:bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white/[0.06] hover:bg-white/[0.1] text-amber-200 border-amber-500/30'
                      }`}
                    >
                      <Bell className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-300'}`} strokeWidth={1.65} />
                      <span>{t.notificationCenterTitle}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Dashboard Stats (They Owe Me & I Owe Them — Signed +/-) */}
            <DashboardStats
              totals={totals}
              loans={loans}
              language={settings.language}
              translations={t}
              activeCurrency={settings.currency}
              maskBalances={settings.maskBalances}
              onToggleMask={() => handleUpdateSettings({ maskBalances: !settings.maskBalances })}
              themeMode={activeThemeMode}
              customRates={settings.customRates}
              onUpdateCustomRates={(nextRates) => handleUpdateSettings({ customRates: nextRates })}
              showDualCurrency={settings.showDualCurrency !== false}
              dualPrimaryCurrency={settings.dualPrimaryCurrency || 'IQD'}
              onToggleDualPrimaryCurrency={() =>
                handleUpdateSettings({
                  dualPrimaryCurrency: (settings.dualPrimaryCurrency || 'IQD') === 'IQD' ? 'USD' : 'IQD',
                })
              }
              onOpenFxCalculator={() => setIsFxModalOpen(true)}
              onShowToast={showToast}
            />

            {/* 4. Empty State if active loans array is empty */}
            {loans.length === 0 ? (
              <EmptyState
                translations={t}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                themeMode={activeThemeMode}
              />
            ) : (
              <div>
                {/* Search and Filters Bar with comfortable touch targets */}
                <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
                  {/* Filter Tabs - Sleek segmented pill bar */}
                  <div
                    className={`flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-inner overflow-x-auto scrollbar-none ${
                      isNordic
                        ? 'bg-[#0E1B2B]/90 border-sky-400/22'
                        : isVelvetPink
                        ? 'bg-[#1F1224]/85 border-[#E8B4A0]/20'
                        : 'bg-[#0D121F]/80 border-white/[0.07]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setFilterType('all')}
                      className={`btn-premium flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.98] ${
                        filterType === 'all'
                          ? isLight
                            ? 'bg-slate-900 text-white shadow-sm'
                            : isVelvetPink
                            ? 'bg-[#FF2E93]/20 text-[#FFD6EB] shadow-sm border border-[#FF65B5]/45'
                            : 'bg-white/10 text-white shadow-sm border border-white/15'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wallet glow="accent" className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                      <span>{t.filterAll}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-numeric ${
                          filterType === 'all' && isLight
                            ? 'bg-white/20 text-white'
                            : isLight
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {loans.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterType('they_owe_me')}
                      className={`btn-premium flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.98] ${
                        filterType === 'they_owe_me'
                          ? isLight
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                          : isLight
                          ? 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <ArrowDownLeft glow="they_owe" className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                      <span className="inline-emoji text-xs" aria-hidden="true">💰</span>
                      <span>{t.filterTheyOwe}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-numeric ${
                          filterType === 'they_owe_me' && isLight
                            ? 'bg-white/20 text-white'
                            : isLight
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {totals.activeTheyOweCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterType('i_owe_them')}
                      className={`btn-premium flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.98] ${
                        filterType === 'i_owe_them'
                          ? isLight
                            ? 'bg-rose-600 text-white shadow-sm'
                            : isVelvetPink
                            ? 'bg-[#FF2E93]/22 border border-[#FF65B5]/55 text-[#FFD6EB] shadow-sm shadow-[#FF2E93]/20'
                            : 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10'
                          : isLight
                          ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                          : isVelvetPink
                          ? 'text-slate-300 hover:text-[#FF65B5]'
                          : 'text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      <ArrowUpRight glow="i_owe" className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                      <span className="inline-emoji text-xs" aria-hidden="true">💸</span>
                      <span>{t.filterIOwe}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-numeric ${
                          filterType === 'i_owe_them' && isLight
                            ? 'bg-white/20 text-white'
                            : isVelvetPink
                            ? 'bg-[#FF2E93]/25 text-[#FFD6EB]'
                            : isLight
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {totals.activeIOweCount}
                      </span>
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative min-w-[240px]">
                    <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full ps-10 pe-3.5 py-2.5 rounded-2xl backdrop-blur-xl border text-xs outline-none smooth-interactive shadow-inner ${
                        isNordic
                          ? 'bg-[#0B1624]/90 border-sky-400/25 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-[#E6F4FF] placeholder-sky-200/40'
                          : isVelvetPink
                          ? 'bg-[#1F1224]/85 border-[#E8B4A0]/22 focus:border-[#FF2E93]/65 focus:ring-2 focus:ring-[#FF2E93]/25 text-white placeholder-pink-200/40'
                          : 'bg-[#0D121F]/80 border-white/[0.08] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Loans Grid */}
                {filteredLoans.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl glass-card">
                    <Filter className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {settings.language === 'ku'
                        ? 'هیچ تۆمارێک نەدۆزرایەوە بەپێی گەڕانەکەت'
                        : settings.language === 'ar'
                        ? 'لا توجد نتائج مطابقة لبحثك'
                        : settings.language === 'tr'
                        ? 'Aramanıza uygun kayıt bulunamadı'
                        : settings.language === 'fr'
                        ? 'Aucun résultat ne correspond à votre filtre'
                        : settings.language === 'es'
                        ? 'No hay registros que coincidan con tu filtro'
                        : 'No records match your filter'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {filteredLoans.map((loan) => {
                      const loanHandle = resolveExactLoanChatUsername(loan);
                      return (
                        <LoanCard
                          key={loan.id}
                          loan={loan}
                          language={settings.language}
                          translations={t}
                          viewMode={settings.viewMode}
                          themeMode={activeThemeMode}
                          isNewlyAdded={loan.id === newlyAddedLoanId}
                          counterpartyAvatar={loanHandle ? avatarByUsernameLower.get(loanHandle) : undefined}
                          customRates={settings.customRates}
                          showDualCurrency={settings.showDualCurrency !== false}
                          onOpenCounterpartyProfile={(l) => setProfileOverlayLoan(l)}
                          onEdit={(l) => setEditingLoan(l)}
                          onPayWithCard={(l) => {
                            if (!canShowPaymentActions(l)) return;
                            setPayInitialRail('card');
                            setPayCardLoan(l);
                          }}
                          onPayWithFib={(l) => {
                            if (!canShowPaymentActions(l)) return;
                            setPayInitialRail('fib');
                            setPayCardLoan(l);
                          }}
                          onDiscussInChat={(l) => {
                            setPreselectedChatLoan(l);
                            setActiveView('friends');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onToggleStatus={handleToggleStatus}
                          onDelete={(l) => setDeleteTargetLoan(l)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4.5. Debt & Credit Trends Chart (below Active Loans so cards sit above the fold) */}
            {loans.length + archivedLoans.length > 0 && (
              <DebtCreditTrends
                loans={[...loans, ...archivedLoans]}
                language={settings.language}
                translations={t}
                activeCurrency={settings.currency}
                maskBalances={settings.maskBalances}
                themeMode={activeThemeMode}
              />
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t pt-8 pb-32 text-center text-xs ${
          isLight ? 'border-slate-200/90 text-slate-500' : 'border-white/[0.05] text-slate-500'
        }`}
      >
        <p className="tracking-wide">
          {t.appName} &bull; {settings.language === 'ku' ? 'سیستەمی دارایی زیرەک بەوپەڕی وردی و پارێزراوی تایبەت' : settings.language === 'ar' ? 'نظام مالي ذكي فائق الدقة والأمان' : settings.language === 'tr' ? 'Yüksek Hassasiyetli ve Güvenli Kişisel Finans Yönetimi' : settings.language === 'fr' ? 'Gestion Budgétaire Personnelle Sécurisée et Ultra-Précise' : settings.language === 'es' ? 'Inteligencia Financiera Privada y Ultraprecisa' : 'Ultra-Precise & Private Personal Debt Intelligence'}
        </p>
      </footer>

      {/* 5. In-App AI Assistant (Ai Budget FAB & Chat with Voice, Receipts, Multi-Personality) */}
      <BudgetAiFAB
        language={settings.language}
        translations={t}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeSession={activeSession}
        onUpdateSessionMessages={handleUpdateSessionMessages}
        onNewSession={handleNewSession}
        allLoans={[...loans, ...archivedLoans]}
        onAddLoanFromAi={handleAddLoanFromAi}
        onExecuteAiLedgerAction={handleExecuteAiLedgerAction}
        isExternalOpen={isAiOpen}
        onToggleExternalOpen={setIsAiOpen}
        themeMode={activeThemeMode}
      />

      {/* 6. Comprehensive Add Loan Modal (Supports Active Loans & Direct to Archive) */}
      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalArchiveDefault(false);
        }}
        onAddLoan={handleAddLoan}
        translations={t}
        language={settings.language}
        defaultCurrency={settings.currency}
        initialSaveToArchive={addModalArchiveDefault}
        themeMode={activeThemeMode}
        friends={friends}
        chatThreads={chatThreads}
        excludeUid={authUser?.uid || null}
        customRates={settings.customRates}
        onOpenFxCalculator={() => {
          setIsAddModalOpen(false);
          setIsFxModalOpen(true);
        }}
      />

      {/* 7. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetLoan}
        onClose={() => setDeleteTargetLoan(null)}
        loan={deleteTargetLoan}
        onConfirm={handleDeleteLoan}
        translations={t}
        themeMode={activeThemeMode}
      />

      {/* 8. Dedicated User Profile & Account Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        settings={
          isAuthenticated && currentUser
            ? {
                ...settings,
                profileName: effectiveProfileName,
                profileUsername: effectiveProfileUsername,
                profileAvatar: effectiveProfileAvatar,
                profileFibAccount: effectiveProfileFibAccount,
                lastUsernameChangeDate:
                  settings.lastUsernameChangeDate ||
                  (currentUser.lastUsernameChangeDate !== undefined
                    ? String(currentUser.lastUsernameChangeDate)
                    : ''),
              }
            : settings
        }
        onUpdateSettings={handleSaveProfileSettings}
        language={settings.language}
        themeMode={activeThemeMode}
        authUserEmail={effectiveAuthEmail}
        cloudSyncStatus={cloudSyncStatus}
        stats={{
          activeCount: loans.length,
          archivedCount: archivedLoans.length,
          transactionsCount: transactions.length,
        }}
        onCheckUsernameAvailable={handleCheckUsernameAvailable}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onShowToast={showToast}
      />

      {/* 9. Advanced Settings Modal (4 Curated Themes, AI Controls, Data & Backup — Header-Only Language) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        onClearAllData={handleClearAllData}
        onImportBackup={handleImportBackup}
        allLoans={[...loans, ...archivedLoans]}
        allTransactions={transactions}
        translations={t}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        onOpenTutorial={() => {
          setIsSettingsOpen(false);
          setIsTutorialOpen(true);
        }}
        onOpenAddModal={() => {
          setIsSettingsOpen(false);
          setIsAddModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenFxCalculator={() => setIsFxModalOpen(true)}
        authUserEmail={effectiveAuthEmail}
        cloudSyncStatus={cloudSyncStatus}
        onManualSync={async () => {
          if (authUser && authUser.emailVerified) {
            await syncAllLocalToCloud(authUser.uid);
          }
        }}
      />

      {/* 11. Guide / Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        language={settings.language}
        translations={t}
        onOpenAddLoan={() => {
          setIsTutorialOpen(false);
          setIsAddModalOpen(true);
        }}
        onOpenAiAssistant={() => {
          setIsTutorialOpen(false);
          setIsAiOpen(true);
        }}
        themeMode={activeThemeMode}
      />

      {/* 12. Refined Debt Detail, Repayment & Add Money Modal */}
      <EditLoanModal
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        loan={editingLoan}
        onSaveLoan={handleUpdateLoan}
        language={settings.language}
        translations={t}
        themeMode={activeThemeMode}
        friends={friends}
        chatThreads={chatThreads}
        excludeUid={authUser?.uid || null}
        customRates={settings.customRates}
        onOpenFxCalculator={() => {
          setEditingLoan(null);
          setIsFxModalOpen(true);
        }}
        onPayWithCard={(l) => {
          if (!canShowPaymentActions(l)) return;
          setPayInitialRail('card');
          setPayCardLoan(l);
        }}
        onPayWithFib={(l) => {
          if (!canShowPaymentActions(l)) return;
          setPayInitialRail('fib');
          setPayCardLoan(l);
        }}
      />

      {/* 12.25. Connected Counterparty / Debtor Profile Card Overlay */}
      <CounterpartyProfileModal
        isOpen={!!profileOverlayLoan}
        onClose={() => setProfileOverlayLoan(null)}
        targetLoan={profileOverlayLoan}
        allLoans={[...loans, ...archivedLoans]}
        friends={friends}
        chatThreads={chatThreads}
        language={settings.language}
        translations={t}
        themeMode={activeThemeMode}
        onEditLoan={(l) => setEditingLoan(l)}
        onChatNow={(l) => {
          setPreselectedChatLoan(l);
          setActiveView('friends');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 12.5. Visa / Mastercard & First Iraqi Bank (FIB) Checkout Modal */}
      <CardPaymentModal
        isOpen={!!payCardLoan}
        onClose={() => setPayCardLoan(null)}
        loan={payCardLoan}
        language={settings.language}
        activeCurrency={settings.currency}
        initialRail={payInitialRail}
        friends={friends}
        chatThreads={chatThreads}
        customRates={settings.customRates}
        showDualCurrency={settings.showDualCurrency !== false}
        onPreSettleRing={handlePreSettleRing}
        onConfirmCardPayment={handleCompleteCardPayment}
        onConfirmFibPayment={handleCompleteFibPayment}
        themeMode={activeThemeMode}
      />

      {/* 12.75. USD <-> IQD Exchange Rate Calculator & Dual-Currency Preferences Modal */}
      <CurrencyRateModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        language={settings.language}
        themeMode={activeThemeMode}
        onShowToast={showToast}
      />

      {/* 13. Sleek Navigation Drawer (Hamburger Menu, RTL/LTR Adaptive) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        language={settings.language}
        translations={t}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFxCalculator={() => setIsFxModalOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        onOpenNotificationCenter={() => {
          setIsDrawerOpen(false);
          setIsNotificationCenterOpen(true);
          setUnreadNotifCount(getUnreadNotificationCount());
        }}
        unreadNotifCount={unreadNotifCount}
        onFilterChange={(filter) => {
          setActiveView('active');
          setFilterType(filter);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenArchive={() => {
          setActiveView('archive');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTransactions={() => {
          setActiveView('transactions');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFriends={() => {
          setActiveView('friends');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        friendsCount={friends.length}
        transactionsCount={transactions.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        authUserEmail={effectiveAuthEmail}
        cloudSyncStatus={cloudSyncStatus}
        loansCount={{
          active: totals.activeTheyOweCount + totals.activeIOweCount,
          theyOwe: totals.activeTheyOweCount,
          iOwe: totals.activeIOweCount,
          archived: archivedLoans.length,
        }}
      />

      {/* 14. Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => {
          setIsNotificationCenterOpen(false);
          setUnreadNotifCount(getUnreadNotificationCount());
        }}
        translations={t}
        language={settings.language}
        loans={loans}
        userProfileName={effectiveProfileName}
        onSelectLoanForEdit={(loanId) => {
          const target = loans.find((l) => l.id === loanId);
          if (target) {
            setEditingLoan(target);
          }
        }}
        onShowToast={showToast}
        themeMode={activeThemeMode}
      />

      {/* 14.5. Google / Gmail Account & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={settings.language}
        user={authUser}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        syncStatus={cloudSyncStatus}
        lastSyncedAt={lastSyncedAt}
        onManualSync={async () => {
          if (authUser && authUser.emailVerified) {
            await syncAllLocalToCloud(authUser.uid);
          }
        }}
        onLogout={handleLogout}
        onShowToast={showToast}
        onLoginSuccess={handleAuthLoginSuccess}
        onCheckUsernameAvailable={handleCheckUsernameAvailable}
        themeMode={activeThemeMode}
        profileName={effectiveProfileName}
        profileUsername={effectiveProfileUsername}
        profileBio={settings.profileBio}
        profileAvatar={effectiveProfileAvatar}
        onEditProfile={() => {
          setIsAuthModalOpen(false);
          setIsProfileOpen(true);
        }}
      />

      {/* 15. Clean Minimalist Centered Bottom Primary "Add" Action Button (Mobile & Desktop) */}
      <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', damping: 24, stiffness: 340 }}
          data-testid="bottom-add-btn"
          onClick={() => {
            setAddModalArchiveDefault(activeView === 'archive');
            setIsAddModalOpen(true);
          }}
          aria-label={t.addNewLoan}
          className={`pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold backdrop-blur-2xl smooth-interactive cursor-pointer ${
            activeThemeMode === 'velvet_pink'
              ? 'text-white bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:opacity-95 shadow-[0_14px_38px_rgba(255,46,147,0.42)] border border-[#E8B4A0]/45'
              : activeThemeMode === 'midnight_gold'
              ? 'text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 shadow-[0_14px_38px_rgba(245,158,11,0.38)] border border-amber-200/60'
              : isNordic
              ? 'text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 shadow-[0_14px_38px_rgba(56,189,248,0.34)] border border-sky-200/60'
              : 'text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-[0_14px_38px_rgba(16,185,129,0.4)] border border-emerald-200/50'
          } ${
            settings.language === 'ku' ? 'font-kurdish' : ''
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.6] shrink-0" />
          <span>
            {settings.language === 'ku'
              ? 'زیادکردن'
              : settings.language === 'ar'
              ? 'إضافة'
              : settings.language === 'tr'
              ? 'Ekle'
              : settings.language === 'fr'
              ? 'Ajouter'
              : settings.language === 'es'
              ? 'Añadir'
              : 'Add'}
          </span>
        </motion.button>
      </div>
    </div>
    </MotionConfig>
  );
}
