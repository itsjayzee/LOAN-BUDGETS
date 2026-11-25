import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  CurrencyCode,
  FriendChatMessage,
  FriendChatMessageKind,
  FriendChatParticipantSnapshot,
  FriendChatThread,
  FriendRecord,
  Loan,
  LoanType,
  PublicUserProfile,
  TransactionEntry,
  UserSettings,
} from './types';
import { getTodayIsoDate, normalizeCustomRates } from './utils/loanLogic';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // ignore in restricted environments; localStorage ai_budget_auth still persists session state
});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export type CloudSyncStatus = 'local' | 'syncing' | 'synced' | 'error' | 'unverified';

const ALLOWED_CURRENCIES = new Set(['USD', 'IQD', 'SAR', 'EUR', 'TRY', 'IRR']);
const ALLOWED_LANGUAGES = new Set(['en', 'ar', 'ku', 'tr', 'fr', 'es']);
const ALLOWED_THEMES = new Set(['obsidian_neon', 'midnight_gold', 'nordic_frost', 'velvet_pink', 'dark', 'light', 'emerald', 'sapphire', 'amethyst', 'sunset', 'custom']);
const ALLOWED_FONTS = new Set(['small', 'medium', 'large']);
const ALLOWED_VIEWS = new Set(['compact', 'spacious']);
const ALLOWED_SORTS = new Set(['newest', 'oldest', 'highest_amount', 'due_soonest', 'name_asc']);

function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `loan_${Date.now()}`;
}

/**
 * Builds a strict schema-compliant Loan payload matching firebase-blueprint.json & firestore.rules.
 */
export function buildCloudLoanPayload(
  loan: Loan,
  userId: string,
  existingCreatedAtServer?: unknown
): { docId: string; payload: Record<string, unknown>; isUpdate: boolean } {
  const docId = sanitizeDocId(loan.id);
  const safeAmount = Math.max(0.01, Math.min(1000000000000, Number(loan.amount) || 0.01));
  const safePaid = Math.max(0, Math.min(safeAmount, Number(loan.paidAmount || 0)));
  const isUpdate = Boolean(existingCreatedAtServer);

  const cleanLinkedUsername = (loan.linkedUsername || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 32);

  const payload: Record<string, unknown> = {
    ownerId: userId,
    id: docId,
    personName: (loan.personName || (cleanLinkedUsername ? `@${cleanLinkedUsername}` : 'Record')).trim().slice(0, 160) || 'Record',
    amount: Math.round(safeAmount * 100) / 100,
    paidAmount: Math.round(safePaid * 100) / 100,
    type: loan.type === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me',
    currency: ALLOWED_CURRENCIES.has(loan.currency || 'USD') ? loan.currency || 'USD' : 'USD',
    status: loan.status === 'settled' ? 'settled' : 'active',
    createdAtServer: existingCreatedAtServer || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (cleanLinkedUsername) payload.linkedUsername = cleanLinkedUsername;
  if (loan.dueDate) payload.dueDate = String(loan.dueDate).slice(0, 40);
  if (loan.phone && loan.phone.trim()) payload.phone = loan.phone.trim().slice(0, 60);
  if (loan.notes && loan.notes.trim()) payload.notes = loan.notes.trim().slice(0, 1000);
  if (loan.settledAt) payload.settledAt = String(loan.settledAt).slice(0, 64);
  if (loan.createdAt) payload.createdAt = String(loan.createdAt).slice(0, 64);
  if (
    loan.exchangeRateAtEntry !== undefined &&
    Number.isFinite(loan.exchangeRateAtEntry) &&
    loan.exchangeRateAtEntry > 0 &&
    loan.exchangeRateAtEntry <= 100000000
  ) {
    payload.exchangeRateAtEntry = Number(loan.exchangeRateAtEntry);
  }
  if (
    loan.fxRateToUsdAtEntry !== undefined &&
    Number.isFinite(loan.fxRateToUsdAtEntry) &&
    loan.fxRateToUsdAtEntry > 0 &&
    loan.fxRateToUsdAtEntry <= 100000000
  ) {
    payload.fxRateToUsdAtEntry = Number(loan.fxRateToUsdAtEntry);
  }

  return { docId, payload, isUpdate };
}

/**
 * Builds a strict schema-compliant Preferences payload matching firebase-blueprint.json & firestore.rules.
 */
export function buildCloudPreferencesPayload(
  settings: UserSettings,
  userId: string,
  existingCreatedAtServer?: unknown,
  existingLastUsernameChangedAtServer?: unknown,
  shouldStampUsernameChange?: boolean
): { payload: Record<string, unknown>; isUpdate: boolean } {
  const isUpdate = Boolean(existingCreatedAtServer);
  const cleanUsername = (settings.profileUsername || '')
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 40);

  const payload: Record<string, unknown> = {
    ownerId: userId,
    language: ALLOWED_LANGUAGES.has(settings.language) ? settings.language : 'en',
    currency: ALLOWED_CURRENCIES.has(settings.currency) ? settings.currency : 'USD',
    theme: ALLOWED_THEMES.has(settings.theme) ? settings.theme : 'dark',
    fontSize: ALLOWED_FONTS.has(settings.fontSize) ? settings.fontSize : 'medium',
    viewMode: ALLOWED_VIEWS.has(settings.viewMode) ? settings.viewMode : 'spacious',
    sortOrder: ALLOWED_SORTS.has(settings.sortOrder) ? settings.sortOrder : 'newest',
    profileName: (settings.profileName || '').slice(0, 120),
    profileUsername: cleanUsername,
    profileBio: (settings.profileBio || '').slice(0, 400),
    profileAvatar: settings.profileAvatar && settings.profileAvatar.length <= 250000 ? settings.profileAvatar : '',
    profileJoinedAt: (settings.profileJoinedAt || '').slice(0, 64),
    profileFibAccount: (settings.profileFibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34),
    maskBalances: Boolean(settings.maskBalances),
    soundEffectsEnabled: Boolean(settings.soundEffectsEnabled),
    pushNotificationsEnabled: Boolean(settings.pushNotificationsEnabled),
    overdueFollowUpEnabled: Boolean(settings.overdueFollowUpEnabled),
    bgOpacity: Math.max(0, Math.min(1, Number(settings.bgOpacity ?? 0.15))),
    bgBlur: Math.max(0, Math.min(50, Number(settings.bgBlur ?? 0))),
    customRates: normalizeCustomRates(settings.customRates),
    showDualCurrency: settings.showDualCurrency !== false,
    dualPrimaryCurrency: settings.dualPrimaryCurrency === 'USD' ? 'USD' : 'IQD',
    createdAtServer: existingCreatedAtServer || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (settings.lastUsernameChangeDate && String(settings.lastUsernameChangeDate).trim()) {
    payload.lastUsernameChangeDate = String(settings.lastUsernameChangeDate).trim().slice(0, 64);
  }

  if (shouldStampUsernameChange || (!isUpdate && cleanUsername.length > 0)) {
    payload.lastUsernameChangedAt = serverTimestamp();
  } else if (existingLastUsernameChangedAtServer !== undefined && existingLastUsernameChangedAtServer !== null) {
    payload.lastUsernameChangedAt = existingLastUsernameChangedAtServer;
  }

  if (settings.customBgImage && settings.customBgImage.length <= 600000) {
    payload.customBgImage = settings.customBgImage;
  }

  return { payload, isUpdate };
}

export async function signInWithGoogleAccount(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmailAccount(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function registerWithEmailAccount(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (result.user && !result.user.emailVerified) {
    await sendEmailVerification(result.user);
  }
  return result.user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function saveLoanToCloud(
  userId: string,
  loan: Loan,
  knownCreatedAtMap: Map<string, unknown>
): Promise<void> {
  const existingServerTs = knownCreatedAtMap.get(loan.id);
  const { docId, payload, isUpdate } = buildCloudLoanPayload(loan, userId, existingServerTs);
  const path = `users/${userId}/loans/${docId}`;
  const docRef = doc(db, 'users', userId, 'loans', docId);
  try {
    if (isUpdate) {
      const updatePayload: Record<string, unknown> = { ...payload };
      const updateFields: Record<string, unknown> = {
        personName: updatePayload.personName,
        linkedUsername: updatePayload.linkedUsername ?? '',
        amount: updatePayload.amount,
        paidAmount: updatePayload.paidAmount,
        type: updatePayload.type,
        currency: updatePayload.currency,
        status: updatePayload.status,
        dueDate: updatePayload.dueDate ?? '',
        phone: updatePayload.phone ?? '',
        notes: updatePayload.notes ?? '',
        settledAt: updatePayload.settledAt ?? '',
        updatedAt: serverTimestamp(),
      };
      if (typeof updatePayload.exchangeRateAtEntry === 'number' && updatePayload.exchangeRateAtEntry > 0) {
        updateFields.exchangeRateAtEntry = updatePayload.exchangeRateAtEntry;
      }
      if (typeof updatePayload.fxRateToUsdAtEntry === 'number' && updatePayload.fxRateToUsdAtEntry > 0) {
        updateFields.fxRateToUsdAtEntry = updatePayload.fxRateToUsdAtEntry;
      }
      // Only send updatable fields matching firestore.rules Action 1 + immutable check
      await updateDoc(docRef, updateFields);
    } else {
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function removeLoanFromCloud(userId: string, loanId: string): Promise<void> {
  const docId = sanitizeDocId(loanId);
  const path = `users/${userId}/loans/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'loans', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePreferencesToCloud(
  userId: string,
  settings: UserSettings,
  existingCreatedAtServer?: unknown,
  existingLastUsernameChangedAtServer?: unknown,
  shouldStampUsernameChange?: boolean
): Promise<void> {
  const { payload, isUpdate } = buildCloudPreferencesPayload(
    settings,
    userId,
    existingCreatedAtServer,
    existingLastUsernameChangedAtServer,
    shouldStampUsernameChange
  );
  const path = `users/${userId}/profile/settings`;
  const docRef = doc(db, 'users', userId, 'profile', 'settings');
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

const ALLOWED_TX_ACTIONS = new Set([
  'created',
  'added_money',
  'repayment',
  'settled',
  'card_payment',
  'restored',
  'deleted',
  'edited',
]);

export function buildCloudTransactionPayload(
  tx: TransactionEntry,
  userId: string
): { docId: string; payload: Record<string, unknown> } {
  const docId = sanitizeDocId(tx.id);
  const loanId = sanitizeDocId(tx.loanId);
  const cleanLinkedUsername = (tx.linkedUsername || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 32);

  const payload: Record<string, unknown> = {
    ownerId: userId,
    id: docId,
    loanId,
    personName: (tx.personName || (cleanLinkedUsername ? `@${cleanLinkedUsername}` : 'Record')).trim().slice(0, 160) || 'Record',
    loanType: tx.loanType === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me',
    action: ALLOWED_TX_ACTIONS.has(tx.action) ? tx.action : 'edited',
    amountChange: Math.max(0, Math.min(1000000000000, Math.round((Number(tx.amountChange) || 0) * 100) / 100)),
    balanceBefore: Math.max(0, Math.min(1000000000000, Math.round((Number(tx.balanceBefore) || 0) * 100) / 100)),
    balanceAfter: Math.max(0, Math.min(1000000000000, Math.round((Number(tx.balanceAfter) || 0) * 100) / 100)),
    currency: ALLOWED_CURRENCIES.has(tx.currency) ? tx.currency : 'USD',
    timestamp: String(tx.timestamp || new Date().toISOString()).slice(0, 64),
    dateStr: String(tx.dateStr || getTodayIsoDate()).slice(0, 32),
    createdAtServer: serverTimestamp(),
  };

  if (cleanLinkedUsername) {
    payload.linkedUsername = cleanLinkedUsername;
  }
  if (tx.notes && tx.notes.trim()) {
    payload.notes = tx.notes.trim().slice(0, 1000);
  }
  if (
    tx.exchangeRateAtEntry !== undefined &&
    Number.isFinite(tx.exchangeRateAtEntry) &&
    tx.exchangeRateAtEntry > 0 &&
    tx.exchangeRateAtEntry <= 100000000
  ) {
    payload.exchangeRateAtEntry = Number(tx.exchangeRateAtEntry);
  }
  if (
    tx.fxRateToUsdAtEntry !== undefined &&
    Number.isFinite(tx.fxRateToUsdAtEntry) &&
    tx.fxRateToUsdAtEntry > 0 &&
    tx.fxRateToUsdAtEntry <= 100000000
  ) {
    payload.fxRateToUsdAtEntry = Number(tx.fxRateToUsdAtEntry);
  }

  return { docId, payload };
}

export async function saveTransactionToCloud(
  userId: string,
  tx: TransactionEntry
): Promise<void> {
  const { docId, payload } = buildCloudTransactionPayload(tx, userId);
  const path = `users/${userId}/transactions/${docId}`;
  const docRef = doc(db, 'users', userId, 'transactions', docId);
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeTransactionFromCloud(
  userId: string,
  txId: string
): Promise<void> {
  const docId = sanitizeDocId(txId);
  const path = `users/${userId}/transactions/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserCloudSync(
  userId: string,
  callbacks: {
    onLoansSnapshot: (loans: Loan[], createdAtMap: Map<string, unknown>) => void;
    onTransactionsSnapshot?: (transactions: TransactionEntry[]) => void;
    onPreferencesSnapshot: (
      settingsPatch: Partial<UserSettings>,
      createdAtServer: unknown,
      lastUsernameChangedAtServer?: unknown
    ) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const loansPath = `users/${userId}/loans`;
  const loansQuery = query(collection(db, 'users', userId, 'loans'), where('ownerId', '==', userId));

  const unsubLoans = onSnapshot(
    loansQuery,
    (snapshot) => {
      const nextLoans: Loan[] = [];
      const createdAtMap = new Map<string, unknown>();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.createdAtServer) {
          createdAtMap.set(docSnap.id, d.createdAtServer);
        }
        nextLoans.push({
          id: String(d.id || docSnap.id),
          personName: String(d.personName || ''),
          linkedUsername:
            typeof d.linkedUsername === 'string' && d.linkedUsername.trim()
              ? d.linkedUsername.trim()
              : undefined,
          amount: Number(d.amount || 0),
          paidAmount: Number(d.paidAmount || 0),
          type: d.type === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me',
          currency: ALLOWED_CURRENCIES.has(d.currency) ? d.currency : 'USD',
          status: d.status === 'settled' ? 'settled' : 'active',
          dueDate: d.dueDate ? String(d.dueDate) : undefined,
          phone: d.phone ? String(d.phone) : undefined,
          notes: d.notes ? String(d.notes) : undefined,
          settledAt: d.settledAt ? String(d.settledAt) : undefined,
          createdAt: d.createdAt ? String(d.createdAt) : new Date().toISOString(),
          ...(typeof d.exchangeRateAtEntry === 'number' && Number.isFinite(d.exchangeRateAtEntry) && d.exchangeRateAtEntry > 0
            ? { exchangeRateAtEntry: d.exchangeRateAtEntry }
            : {}),
          ...(typeof d.fxRateToUsdAtEntry === 'number' && Number.isFinite(d.fxRateToUsdAtEntry) && d.fxRateToUsdAtEntry > 0
            ? { fxRateToUsdAtEntry: d.fxRateToUsdAtEntry }
            : {}),
        });
      });
      callbacks.onLoansSnapshot(nextLoans, createdAtMap);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, loansPath);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const prefsPath = `users/${userId}/profile/settings`;
  const unsubPrefs = onSnapshot(
    doc(db, 'users', userId, 'profile', 'settings'),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const d = docSnap.data();
      const settingsPatch: Partial<UserSettings> = {};
      if (ALLOWED_LANGUAGES.has(d.language)) settingsPatch.language = d.language;
      if (ALLOWED_CURRENCIES.has(d.currency)) settingsPatch.currency = d.currency;
      if (ALLOWED_THEMES.has(d.theme)) settingsPatch.theme = d.theme;
      if (ALLOWED_FONTS.has(d.fontSize)) settingsPatch.fontSize = d.fontSize;
      if (ALLOWED_VIEWS.has(d.viewMode)) settingsPatch.viewMode = d.viewMode;
      if (ALLOWED_SORTS.has(d.sortOrder)) settingsPatch.sortOrder = d.sortOrder;
      if (typeof d.profileName === 'string') settingsPatch.profileName = d.profileName;
      if (typeof d.profileUsername === 'string') settingsPatch.profileUsername = d.profileUsername;
      if (typeof d.profileBio === 'string') settingsPatch.profileBio = d.profileBio;
      if (typeof d.profileAvatar === 'string') settingsPatch.profileAvatar = d.profileAvatar;
      if (typeof d.profileJoinedAt === 'string') settingsPatch.profileJoinedAt = d.profileJoinedAt;
      if (typeof d.lastUsernameChangeDate === 'string') settingsPatch.lastUsernameChangeDate = d.lastUsernameChangeDate;
      if (typeof d.profileFibAccount === 'string') settingsPatch.profileFibAccount = d.profileFibAccount;
      if (typeof d.maskBalances === 'boolean') settingsPatch.maskBalances = d.maskBalances;
      if (typeof d.soundEffectsEnabled === 'boolean') settingsPatch.soundEffectsEnabled = d.soundEffectsEnabled;
      if (typeof d.pushNotificationsEnabled === 'boolean') settingsPatch.pushNotificationsEnabled = d.pushNotificationsEnabled;
      if (typeof d.overdueFollowUpEnabled === 'boolean') settingsPatch.overdueFollowUpEnabled = d.overdueFollowUpEnabled;
      if (typeof d.customBgImage === 'string') settingsPatch.customBgImage = d.customBgImage;
      if (typeof d.bgOpacity === 'number') settingsPatch.bgOpacity = d.bgOpacity;
      if (typeof d.bgBlur === 'number') settingsPatch.bgBlur = d.bgBlur;
      if (d.customRates && typeof d.customRates === 'object') {
        settingsPatch.customRates = normalizeCustomRates(d.customRates as Record<string, unknown>);
      }
      if (typeof d.showDualCurrency === 'boolean') settingsPatch.showDualCurrency = d.showDualCurrency;
      if (d.dualPrimaryCurrency === 'USD' || d.dualPrimaryCurrency === 'IQD') {
        settingsPatch.dualPrimaryCurrency = d.dualPrimaryCurrency;
      }

      callbacks.onPreferencesSnapshot(settingsPatch, d.createdAtServer, d.lastUsernameChangedAt);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, prefsPath);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const txPath = `users/${userId}/transactions`;
  const txQuery = query(collection(db, 'users', userId, 'transactions'), where('ownerId', '==', userId));

  const unsubTxs = onSnapshot(
    txQuery,
    (snapshot) => {
      if (!callbacks.onTransactionsSnapshot) return;
      const nextTxs: TransactionEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        nextTxs.push({
          id: String(d.id || docSnap.id),
          loanId: String(d.loanId || ''),
          personName: String(d.personName || ''),
          linkedUsername:
            typeof d.linkedUsername === 'string' && d.linkedUsername.trim()
              ? d.linkedUsername.trim()
              : undefined,
          loanType: d.loanType === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me',
          action: ALLOWED_TX_ACTIONS.has(d.action) ? d.action : 'edited',
          amountChange: Number(d.amountChange || 0),
          balanceBefore: Number(d.balanceBefore || 0),
          balanceAfter: Number(d.balanceAfter || 0),
          currency: ALLOWED_CURRENCIES.has(d.currency) ? d.currency : 'USD',
          timestamp: String(d.timestamp || new Date().toISOString()),
          dateStr: String(d.dateStr || getTodayIsoDate()),
          notes: d.notes ? String(d.notes) : undefined,
          ...(typeof d.exchangeRateAtEntry === 'number' && Number.isFinite(d.exchangeRateAtEntry) && d.exchangeRateAtEntry > 0
            ? { exchangeRateAtEntry: d.exchangeRateAtEntry }
            : {}),
          ...(typeof d.fxRateToUsdAtEntry === 'number' && Number.isFinite(d.fxRateToUsdAtEntry) && d.fxRateToUsdAtEntry > 0
            ? { fxRateToUsdAtEntry: d.fxRateToUsdAtEntry }
            : {}),
        });
      });
      callbacks.onTransactionsSnapshot(nextTxs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, txPath);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubLoans();
    unsubPrefs();
    unsubTxs();
  };
}

/**
 * Checks in Cloud Firestore (/usernames/{usernameLower}) whether a username handle
 * is currently claimed by another account. Safe against offline/transient errors.
 */
export async function checkUsernameAvailabilityInCloud(
  rawUsername: string,
  currentUid?: string | null
): Promise<{ available: boolean; takenByUid?: string }> {
  const cleanLower = rawUsername.trim().replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(cleanLower)) {
    return { available: true };
  }
  try {
    const snap = await getDoc(doc(db, 'usernames', cleanLower));
    if (!snap.exists()) {
      return { available: true };
    }
    const ownerUid = String(snap.data()?.uid || '');
    if (currentUid && ownerUid === currentUid) {
      return { available: true };
    }
    return { available: false, takenByUid: ownerUid || undefined };
  } catch (error) {
    // Allow non-blocking offline fallback; atomic write transaction enforces final uniqueness
    console.warn('Username availability lookup skipped:', error);
    return { available: true };
  }
}

/**
 * Atomically claims/updates the signed-in user's PII-free public @username handle in /usernames/{usernameLower}
 * via Firestore transaction so a taken target handle NEVER deletes the user's existing handle.
 */
export async function syncPublicUsernameHandle(
  userId: string,
  profile: {
    username: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    fibAccount?: string;
  },
  previousUsername?: string
): Promise<{ status: 'updated' | 'cleared' | 'taken' }> {
  const cleanHandle = profile.username.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
  const nextLower = cleanHandle.toLowerCase();
  const prevLower = (previousUsername || '').trim().replace(/^@+/, '').toLowerCase();
  const hasValidNext = Boolean(cleanHandle && /^[a-z0-9_]{3,32}$/.test(nextLower));
  const hasDifferentValidPrev = Boolean(prevLower && prevLower !== nextLower && /^[a-z0-9_]{3,32}$/.test(prevLower));

  const targetPath = hasValidNext ? `usernames/${nextLower}` : `usernames/${prevLower || 'cleared'}`;

  try {
    const outcome = await runTransaction(db, async (tx) => {
      const nextRef = hasValidNext ? doc(db, 'usernames', nextLower) : null;
      const oldRef = hasDifferentValidPrev ? doc(db, 'usernames', prevLower) : null;

      // Read phase first (Firestore requirement: all gets before writes)
      const nextSnap = nextRef ? await tx.get(nextRef) : null;
      const oldSnap = oldRef ? await tx.get(oldRef) : null;

      // Abort BEFORE deleting old handle if target handle is already owned by another UID
      if (nextSnap && nextSnap.exists() && nextSnap.data()?.uid !== userId) {
        return 'taken' as const;
      }

      if (oldRef && oldSnap && oldSnap.exists() && oldSnap.data()?.uid === userId) {
        tx.delete(oldRef);
      }

      if (!nextRef) {
        return 'cleared' as const;
      }

      const payload: Record<string, unknown> = {
        uid: userId,
        usernameLower: nextLower,
        username: cleanHandle,
        updatedAt: serverTimestamp(),
      };
      if (profile.displayName && profile.displayName.trim()) {
        payload.displayName = profile.displayName.trim().slice(0, 120);
      }
      if (profile.avatar && profile.avatar.length <= 250000) {
        payload.avatar = profile.avatar;
      }
      if (profile.bio && profile.bio.trim()) {
        payload.bio = profile.bio.trim().slice(0, 300);
      }
      const cleanFib = (profile.fibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
      if (cleanFib) {
        payload.fibAccount = cleanFib;
      }

      tx.set(nextRef, payload);
      return 'updated' as const;
    });

    return { status: outcome };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, targetPath);
  }
}

/**
 * Exact lookup in /usernames/{usernameLower} by @username handle (zero PII exposed).
 */
export async function lookupUserByUsername(rawUsername: string): Promise<PublicUserProfile | null> {
  const cleanLower = rawUsername.trim().replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(cleanLower)) {
    return null;
  }
  const path = `usernames/${cleanLower}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', cleanLower));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: String(d.uid),
      username: String(d.username || cleanLower),
      usernameLower: String(d.usernameLower || cleanLower),
      displayName: typeof d.displayName === 'string' ? d.displayName : undefined,
      avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
      bio: typeof d.bio === 'string' ? d.bio : undefined,
      fibAccount: typeof d.fibAccount === 'string' ? d.fibAccount : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function addFriendToCloud(
  userId: string,
  friend: PublicUserProfile
): Promise<void> {
  const friendUid = sanitizeDocId(friend.uid);
  const path = `users/${userId}/friends/${friendUid}`;
  const ref = doc(db, 'users', userId, 'friends', friendUid);
  const cleanUsername = (friend.username || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
  const safeDisplayName = (friend.displayName || '').trim().slice(0, 120) || (cleanUsername ? `@${cleanUsername}` : 'Friend');
  const payload: Record<string, unknown> = {
    ownerId: userId,
    friendUid,
    username: cleanUsername,
    displayName: safeDisplayName,
    addedAtIso: new Date().toISOString().slice(0, 64),
    createdAtServer: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (friend.avatar && friend.avatar.length <= 250000) payload.avatar = friend.avatar;
  if (friend.bio) payload.bio = friend.bio.slice(0, 300);
  const cleanFib = (friend.fibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
  if (cleanFib) payload.fibAccount = cleanFib;

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeFriendFromCloud(userId: string, friendUid: string): Promise<void> {
  const safeFriendUid = sanitizeDocId(friendUid);
  const path = `users/${userId}/friends/${safeFriendUid}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'friends', safeFriendUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeFriendsCloudSync(
  userId: string,
  callbacks: {
    onFriendsSnapshot: (friends: FriendRecord[]) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const path = `users/${userId}/friends`;
  const friendsQuery = query(collection(db, 'users', userId, 'friends'), where('ownerId', '==', userId));

  return onSnapshot(
    friendsQuery,
    (snapshot) => {
      const next: FriendRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        next.push({
          ownerId: String(d.ownerId || userId),
          friendUid: String(d.friendUid || docSnap.id),
          username: String(d.username || ''),
          displayName: typeof d.displayName === 'string' ? d.displayName : undefined,
          avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
          bio: typeof d.bio === 'string' ? d.bio : undefined,
          fibAccount: typeof d.fibAccount === 'string' ? d.fibAccount : undefined,
          addedAtIso: typeof d.addedAtIso === 'string' ? d.addedAtIso : undefined,
        });
      });
      next.sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username));
      callbacks.onFriendsSnapshot(next);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function ensureFriendChatThread(
  currentUser: { uid: string; displayName?: string; username?: string; avatar?: string; fibAccount?: string },
  friend: { uid: string; displayName?: string; username?: string; avatar?: string; fibAccount?: string }
): Promise<FriendChatThread> {
  const cleanA = sanitizeDocId(currentUser.uid);
  const cleanB = sanitizeDocId(friend.uid);
  const [participantA, participantB] = cleanA < cleanB ? [cleanA, cleanB] : [cleanB, cleanA];
  const chatId = `${participantA}_${participantB}`;
  const path = `chats/${chatId}`;
  const chatRef = doc(db, 'chats', chatId);

  const cleanFibA = (currentUser.fibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
  const cleanFibB = (friend.fibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);

  const profileMap: Record<string, FriendChatParticipantSnapshot> = {
    [cleanA]: {
      ...(currentUser.displayName ? { displayName: currentUser.displayName.slice(0, 120) } : {}),
      ...(currentUser.username ? { username: currentUser.username.slice(0, 32) } : {}),
      ...(currentUser.avatar && currentUser.avatar.length <= 250000 ? { avatar: currentUser.avatar } : {}),
      ...(cleanFibA ? { fibAccount: cleanFibA } : {}),
    },
    [cleanB]: {
      ...(friend.displayName ? { displayName: friend.displayName.slice(0, 120) } : {}),
      ...(friend.username ? { username: friend.username.slice(0, 32) } : {}),
      ...(friend.avatar && friend.avatar.length <= 250000 ? { avatar: friend.avatar } : {}),
      ...(cleanFibB ? { fibAccount: cleanFibB } : {}),
    },
  };

  try {
    const existing = await getDoc(chatRef);
    if (existing.exists()) {
      const d = existing.data();
      const mergedProfiles = {
        ...(typeof d.participantProfiles === 'object' && d.participantProfiles ? d.participantProfiles : {}),
        ...profileMap,
      };
      await updateDoc(chatRef, {
        participantProfiles: mergedProfiles,
        updatedAt: serverTimestamp(),
      });
      return {
        id: chatId,
        participantA: String(d.participantA || participantA),
        participantB: String(d.participantB || participantB),
        participantIds: Array.isArray(d.participantIds) ? d.participantIds.map(String) : [participantA, participantB],
        participantProfiles: mergedProfiles,
        lastMessageText: typeof d.lastMessageText === 'string' ? d.lastMessageText : undefined,
        lastMessageAtIso: typeof d.lastMessageAtIso === 'string' ? d.lastMessageAtIso : undefined,
        lastSenderId: typeof d.lastSenderId === 'string' ? d.lastSenderId : undefined,
      };
    }

    const nowIso = new Date().toISOString();
    const createPayload: Record<string, unknown> = {
      id: chatId,
      participantA,
      participantB,
      participantIds: [participantA, participantB],
      participantProfiles: profileMap,
      lastMessageAtIso: nowIso,
      createdAtServer: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(chatRef, createPayload);
    return {
      id: chatId,
      participantA,
      participantB,
      participantIds: [participantA, participantB],
      participantProfiles: profileMap,
      lastMessageAtIso: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeFriendChats(
  userId: string,
  callbacks: {
    onChatsSnapshot: (chats: FriendChatThread[]) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const path = 'chats';
  const chatsQuery = query(collection(db, 'chats'), where('participantIds', 'array-contains', userId));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const list: FriendChatThread[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: String(d.id || docSnap.id),
          participantA: String(d.participantA || ''),
          participantB: String(d.participantB || ''),
          participantIds: Array.isArray(d.participantIds) ? d.participantIds.map(String) : [],
          participantProfiles:
            typeof d.participantProfiles === 'object' && d.participantProfiles
              ? (d.participantProfiles as Record<string, FriendChatParticipantSnapshot>)
              : undefined,
          lastMessageText: typeof d.lastMessageText === 'string' ? d.lastMessageText : undefined,
          lastMessageAtIso: typeof d.lastMessageAtIso === 'string' ? d.lastMessageAtIso : undefined,
          lastSenderId: typeof d.lastSenderId === 'string' ? d.lastSenderId : undefined,
        });
      });
      list.sort((a, b) => (b.lastMessageAtIso || '').localeCompare(a.lastMessageAtIso || ''));
      callbacks.onChatsSnapshot(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeChatMessages(
  chatId: string,
  callbacks: {
    onMessagesSnapshot: (messages: FriendChatMessage[]) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const safeChatId = sanitizeDocId(chatId);
  const path = `chats/${safeChatId}/messages`;

  return onSnapshot(
    collection(db, 'chats', safeChatId, 'messages'),
    (snapshot) => {
      const list: FriendChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const kind: FriendChatMessageKind =
          d.messageKind === 'loan_ref' || d.messageKind === 'payment_update' ? d.messageKind : 'text';
        list.push({
          id: String(d.id || docSnap.id),
          chatId: String(d.chatId || safeChatId),
          senderId: String(d.senderId || ''),
          senderName: typeof d.senderName === 'string' ? d.senderName : undefined,
          text: String(d.text || ''),
          messageKind: kind,
          linkedLoanId: typeof d.linkedLoanId === 'string' ? d.linkedLoanId : undefined,
          linkedLoanPerson: typeof d.linkedLoanPerson === 'string' ? d.linkedLoanPerson : undefined,
          linkedLoanUsername:
            typeof d.linkedLoanUsername === 'string' && d.linkedLoanUsername.trim()
              ? d.linkedLoanUsername.trim()
              : undefined,
          linkedLoanAmount: typeof d.linkedLoanAmount === 'number' ? d.linkedLoanAmount : undefined,
          linkedLoanCurrency: ALLOWED_CURRENCIES.has(d.linkedLoanCurrency)
            ? (d.linkedLoanCurrency as CurrencyCode)
            : undefined,
          linkedLoanType:
            d.linkedLoanType === 'they_owe_me' || d.linkedLoanType === 'i_owe_them'
              ? (d.linkedLoanType as LoanType)
              : undefined,
          linkedLoanStatus:
            d.linkedLoanStatus === 'active' || d.linkedLoanStatus === 'settled'
              ? d.linkedLoanStatus
              : undefined,
          clientCreatedAt: String(d.clientCreatedAt || new Date().toISOString()),
        });
      });
      list.sort(
        (a, b) => a.clientCreatedAt.localeCompare(b.clientCreatedAt) || a.id.localeCompare(b.id)
      );
      callbacks.onMessagesSnapshot(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function sendFriendChatMessage(params: {
  chatId: string;
  senderId: string;
  senderName?: string;
  text: string;
  messageKind?: FriendChatMessageKind;
  linkedLoan?: Loan;
  remainingBalance?: number;
}): Promise<void> {
  const safeChatId = sanitizeDocId(params.chatId);
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanedText = params.text.trim().slice(0, 1000);
  if (!cleanedText) return;

  const nowIso = new Date().toISOString();
  const kind: FriendChatMessageKind = params.messageKind || (params.linkedLoan ? 'loan_ref' : 'text');

  const msgPayload: Record<string, unknown> = {
    id: messageId,
    chatId: safeChatId,
    senderId: params.senderId,
    text: cleanedText,
    messageKind: kind,
    clientCreatedAt: nowIso,
    createdAtServer: serverTimestamp(),
  };

  if (params.senderName && params.senderName.trim()) {
    msgPayload.senderName = params.senderName.trim().slice(0, 120);
  }
  if (params.linkedLoan) {
    msgPayload.linkedLoanId = sanitizeDocId(params.linkedLoan.id);
    msgPayload.linkedLoanPerson = (params.linkedLoan.personName || 'Loan').slice(0, 160);
    const cleanLoanHandle = (params.linkedLoan.linkedUsername || '')
      .trim()
      .replace(/^@+/, '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 32);
    if (cleanLoanHandle) {
      msgPayload.linkedLoanUsername = cleanLoanHandle;
    }
    const refAmount =
      typeof params.remainingBalance === 'number'
        ? params.remainingBalance
        : Math.max(0, Number(params.linkedLoan.amount) - Number(params.linkedLoan.paidAmount || 0));
    msgPayload.linkedLoanAmount = Math.max(0, Math.round(refAmount * 100) / 100);
    msgPayload.linkedLoanCurrency = ALLOWED_CURRENCIES.has(params.linkedLoan.currency || 'USD')
      ? params.linkedLoan.currency || 'USD'
      : 'USD';
    msgPayload.linkedLoanType = params.linkedLoan.type === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me';
    msgPayload.linkedLoanStatus = params.linkedLoan.status === 'settled' ? 'settled' : 'active';
  }

  const msgPath = `chats/${safeChatId}/messages/${messageId}`;
  try {
    await setDoc(doc(db, 'chats', safeChatId, 'messages', messageId), msgPayload);
    await updateDoc(doc(db, 'chats', safeChatId), {
      lastMessageText: cleanedText.slice(0, 300),
      lastMessageAtIso: nowIso,
      lastSenderId: params.senderId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

/**
 * Propagates updated displayName / @username / avatar snapshots into active chat threads
 * so chat peers see up-to-date profile info immediately without reloading.
 */
export async function syncProfileSnapshotToChats(
  userId: string,
  profile: { displayName?: string; username?: string; avatar?: string; fibAccount?: string },
  threads: FriendChatThread[]
): Promise<void> {
  if (!userId || threads.length === 0) return;
  const cleanFib = (profile.fibAccount || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
  const selfSnapshot: FriendChatParticipantSnapshot = {
    ...(profile.displayName?.trim() ? { displayName: profile.displayName.trim().slice(0, 120) } : {}),
    ...(profile.username?.trim() ? { username: profile.username.trim().replace(/^@+/, '').slice(0, 32) } : {}),
    ...(profile.avatar && profile.avatar.length <= 250000 ? { avatar: profile.avatar } : {}),
    ...(cleanFib ? { fibAccount: cleanFib } : {}),
  };

  for (const thread of threads) {
    if (!thread.participantIds.includes(userId)) continue;
    try {
      const mergedProfiles = {
        ...(thread.participantProfiles || {}),
        [userId]: selfSnapshot,
      };
      await updateDoc(doc(db, 'chats', sanitizeDocId(thread.id)), {
        participantProfiles: mergedProfiles,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // ignore per-thread transient failure so profile save remains responsive
    }
  }
}
