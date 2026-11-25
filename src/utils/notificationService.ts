/**
 * Streamlined Notification System for Loan Budget.
 *
 * Emits concise, deduplicated alerts (one actionable alert per critical due-today or overdue loan)
 * without dual-party duplicate spam or emoji clutter.
 */

import { Loan, Language, InAppNotification, CurrencyCode, NotificationType } from '../types';
import { formatCardDebt, getTodayIsoDate, parseIsoDateLocal } from './loanLogic';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const IN_APP_STORAGE_KEY = 'loan_budget_in_app_notifications';
const DUE_NOTIFIED_PREFIX = 'loan_budget_due_notified_';
const OVERDUE_NOTIFIED_PREFIX = 'loan_budget_overdue_notified_';

/**
 * Format loan amount with currency code: e.g. "500 USD" or "1,500,000 IQD"
 */
export function formatLoanAmountCurrency(amount: number, currency: CurrencyCode | string = 'USD'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatBorrowerDueMessage(
  debtorName: string,
  amountFormatted: string,
  creditorName: string
): { title: string; body: string; fullMessage: string } {
  const title = 'Payment Due Today';
  const body = `Hi ${debtorName}, your payment of ${amountFormatted} to ${creditorName} is due today.`;
  const fullMessage = `${title}: ${body}`;
  return { title, body, fullMessage };
}

export function formatLenderMaturityMessage(
  creditorName: string,
  debtorName: string,
  amountFormatted: string
): { title: string; body: string; fullMessage: string } {
  const title = 'Collection Due Today';
  const body = `Hi ${creditorName}, ${debtorName}'s payment of ${amountFormatted} is scheduled for today.`;
  const fullMessage = `${title}: ${body}`;
  return { title, body, fullMessage };
}

export function formatOverdueFollowUpMessage(
  amountFormatted: string,
  creditorName: string,
  debtorName: string
): { title: string; body: string; fullMessage: string } {
  const title = 'Overdue Payment';
  const body = `The loan of ${amountFormatted} between ${creditorName} and ${debtorName} has passed its due date. Tap to review or settle.`;
  const fullMessage = `${title}: ${body}`;
  return { title, body, fullMessage };
}

export function formatPoliteDueMessage(personName: string, amountFormatted: string): string {
  return `Dear ${personName}, this is a friendly reminder that your payment of ${amountFormatted} is due today. We appreciate your prompt attention to this matter.`;
}

export function isCapacitorNative(): boolean {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isPushNotificationSupported(): boolean {
  if (isCapacitorNative()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (isCapacitorNative()) return 'granted';
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (isCapacitorNative()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'granted';
    }
  }

  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission;
  }
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

export async function sendPushNotification(
  title: string,
  body: string,
  extra?: Record<string, any>
): Promise<boolean> {
  if (isCapacitorNative()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 10000000) + 1,
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'beep.wav',
            extra,
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Capacitor LocalNotifications schedule error:', err);
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      let perm: NotificationPermission | 'unsupported' = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `loan-budget-${extra?.loanId || 'alert'}`,
              data: extra,
            });
            return true;
          }
        }
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      }
    } catch (err) {
      console.warn('Web notification dispatch error:', err);
    }
  }

  return false;
}

// ==========================================
// In-App Notification Center State Management
// ==========================================

export function getInAppNotifications(): InAppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(IN_APP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInAppNotifications(list: InAppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(list.slice(0, 60)));
    window.dispatchEvent(new CustomEvent('loan_budget_notifications_updated'));
  } catch {
    // ignore
  }
}

/**
 * Adds an in-app notification with built-in same-day deduplication per (loanId, type).
 */
export function addInAppNotification(
  item: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>
): InAppNotification {
  const current = getInAppNotifications();
  const todayStr = getTodayIsoDate();

  const existing = current.find(
    (n) =>
      n.loanId === item.loanId &&
      n.type === item.type &&
      (n.timestamp || '').slice(0, 10) === todayStr
  );

  if (existing) {
    return existing;
  }

  const newNotif: InAppNotification = {
    ...item,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  saveInAppNotifications([newNotif, ...current]);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getInAppNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveInAppNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getInAppNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveInAppNotifications(updated);
}

export function clearAllNotifications(): void {
  saveInAppNotifications([]);
}

export function getUnreadNotificationCount(): number {
  return getInAppNotifications().filter((n) => !n.read).length;
}

export function resolveLoanParties(loan: Loan, userProfileName: string = 'You'): {
  creditorName: string;
  debtorName: string;
} {
  const profile = userProfileName.trim() || 'You';
  const counterparty = (loan.personName || '').trim() || (loan.linkedUsername ? `@${loan.linkedUsername}` : 'Contact');
  if (loan.type === 'they_owe_me') {
    return {
      creditorName: profile,
      debtorName: counterparty,
    };
  }
  return {
    creditorName: counterparty,
    debtorName: profile,
  };
}

/**
 * Emits a single clean, actionable due-date alert for a loan (no duplicate dual-party entries).
 */
export async function triggerDueDateNotification(
  loan: Loan,
  userProfileName: string = 'You'
): Promise<{ sent: boolean; notice: InAppNotification }> {
  const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
  const amountFormatted = formatLoanAmountCurrency(remaining, loan.currency || 'USD');
  const { creditorName, debtorName } = resolveLoanParties(loan, userProfileName);

  const isIOwe = loan.type === 'i_owe_them';
  const notifType: NotificationType = isIOwe ? 'borrower_due' : 'lender_maturity';
  const msg = isIOwe
    ? formatBorrowerDueMessage(debtorName, amountFormatted, creditorName)
    : formatLenderMaturityMessage(creditorName, debtorName, amountFormatted);

  const notice = addInAppNotification({
    loanId: loan.id,
    type: notifType,
    title: msg.title,
    body: msg.body,
    fullMessage: msg.fullMessage,
    creditorName,
    debtorName,
    amount: remaining,
    currency: loan.currency || 'USD',
    dueDate: loan.dueDate || '',
  });

  const sent = await sendPushNotification(msg.title, msg.body, {
    loanId: loan.id,
    type: notifType,
  });

  return { sent, notice };
}

/**
 * Emits a single deduplicated overdue alert when a loan passes its due date.
 */
export async function triggerOverdueFollowUpNotification(
  loan: Loan,
  userProfileName: string = 'You'
): Promise<{ sent: boolean; notice: InAppNotification }> {
  const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
  const amountFormatted = formatLoanAmountCurrency(remaining, loan.currency || 'USD');
  const { creditorName, debtorName } = resolveLoanParties(loan, userProfileName);

  const overdueMsg = formatOverdueFollowUpMessage(amountFormatted, creditorName, debtorName);
  const notice = addInAppNotification({
    loanId: loan.id,
    type: 'overdue_followup',
    title: overdueMsg.title,
    body: overdueMsg.body,
    fullMessage: overdueMsg.fullMessage,
    creditorName,
    debtorName,
    amount: remaining,
    currency: loan.currency || 'USD',
    dueDate: loan.dueDate || '',
  });

  const sent = await sendPushNotification(overdueMsg.title, overdueMsg.body, {
    loanId: loan.id,
    type: 'overdue_followup',
  });

  return { sent, notice };
}

/**
 * Automated due date and overdue scanner:
 * Checks active loans and triggers one deduplicated alert per critical loan.
 */
export function checkAndTriggerAutomatedDueAndOverdue(
  loans: Loan[],
  userProfileName: string = 'You',
  options: { force?: boolean } = {}
): { dueNotified: Loan[]; overdueNotified: Loan[] } {
  if (typeof window === 'undefined') {
    return { dueNotified: [], overdueNotified: [] };
  }

  const todayStr = getTodayIsoDate();
  const todayDate = parseIsoDateLocal(todayStr) || new Date();

  const dueNotified: Loan[] = [];
  const overdueNotified: Loan[] = [];

  loans.forEach((loan) => {
    if (loan.status !== 'active' || !loan.dueDate) return;

    const dateOnly = loan.dueDate.split(' ')[0];
    const loanDate = parseIsoDateLocal(dateOnly);
    if (!loanDate) return;
    const diffTime = loanDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const cacheKey = `${DUE_NOTIFIED_PREFIX}${loan.id}_${todayStr}`;
      if (options.force || !localStorage.getItem(cacheKey)) {
        triggerDueDateNotification(loan, userProfileName);
        localStorage.setItem(cacheKey, 'true');
        dueNotified.push(loan);
      }
    }

    if (diffDays < 0) {
      const cacheKey = `${OVERDUE_NOTIFIED_PREFIX}${loan.id}_${todayStr}`;
      if (options.force || !localStorage.getItem(cacheKey)) {
        triggerOverdueFollowUpNotification(loan, userProfileName);
        localStorage.setItem(cacheKey, 'true');
        overdueNotified.push(loan);
      }
    }
  });

  return { dueNotified, overdueNotified };
}

export async function showPoliteDueDateNotification(
  loan: Loan,
  language: Language = 'en'
): Promise<boolean> {
  const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
  const amountStr = formatCardDebt(remaining, loan.currency || 'USD', language);
  const safeName = (loan.personName || '').trim() || (loan.linkedUsername ? `@${loan.linkedUsername}` : 'Contact');
  const messageBody = formatPoliteDueMessage(safeName, amountStr);
  const title = `Loan Budget - Payment Due Today (${safeName})`;
  return await sendPushNotification(title, messageBody, { loanId: loan.id });
}

export function checkAndNotifyDueTodayLoans(
  loans: Loan[],
  _language: Language = 'en',
  options: { force?: boolean } = {}
): Loan[] {
  const res = checkAndTriggerAutomatedDueAndOverdue(loans, 'You', options);
  return res.dueNotified;
}
