import React from 'react';
import { motion } from 'motion/react';
import { CurrencyCode, Language, Loan, ThemeMode, Translations } from '../types';
import {
  CURRENCIES,
  canShowPaymentActions,
  computeDebtProgressPercent,
  formatCardDebt,
  formatSignedCardDebt,
  isLightThemeMode,
  parseIsoDateLocal,
  resolveExactLoanChatUsername,
  resolveRecordDualEquivalent,
} from '../utils/loanLogic';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Edit3,
  FileText,
  MessageSquare,
  Phone,
  RotateCcw,
  Trash2,
  Wallet,
} from './OrganicIcons';
import { FibBadgeSvg } from './CardPaymentModal';

interface LoanCardProps {
  loan: Loan;
  language: Language;
  translations: Translations;
  viewMode?: import('../types').ViewMode;
  themeMode?: ThemeMode;
  isNewlyAdded?: boolean;
  counterpartyAvatar?: string;
  customRates?: Partial<Record<CurrencyCode, number>>;
  showDualCurrency?: boolean;
  onOpenCounterpartyProfile?: (loan: Loan) => void;
  onEdit?: (loan: Loan) => void;
  onPayWithCard?: (loan: Loan) => void;
  onPayWithFib?: (loan: Loan) => void;
  onDiscussInChat?: (loan: Loan) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  language,
  translations,
  viewMode = 'spacious',
  themeMode = 'obsidian_neon',
  isNewlyAdded = false,
  counterpartyAvatar,
  customRates,
  showDualCurrency = true,
  onOpenCounterpartyProfile,
  onEdit,
  onPayWithCard,
  onPayWithFib,
  onDiscussInChat,
  onToggleStatus,
  onDelete,
}) => {
  const isTheyOweMe = loan.type === 'they_owe_me';
  const isSettled = loan.status === 'settled';
  const loanCurrency = loan.currency || 'USD';
  const currencyItem = CURRENCIES.find((c) => c.code === loanCurrency) || CURRENCIES[0];
  const isLight = isLightThemeMode(themeMode);
  const isVelvetPink = themeMode === 'velvet_pink';
  const linkedHandle = resolveExactLoanChatUsername(loan);
  const hasProfileLink = Boolean((linkedHandle || (loan.personName || '').trim()) && onOpenCounterpartyProfile);

  const getDeadlineState = () => {
    if (!loan.dueDate) return null;
    const [dateOnly, timeOnly] = loan.dueDate.split(' ');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseIsoDateLocal(dateOnly) || new Date(dateOnly);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const dateDisplay = timeOnly ? `${dateOnly} (${timeOnly})` : dateOnly;

    if (isSettled) {
      return {
        level: 'settled',
        isUrgent: false,
        label: `${translations.dueOn}: ${dateDisplay}`,
        badge: translations.statusSettled,
        badgeClass: isLight
          ? 'bg-slate-100 text-slate-600 border-slate-200'
          : 'bg-white/[0.04] text-slate-400 border-white/[0.06]',
        textClass: isLight ? 'text-slate-600' : 'text-slate-400',
        containerClass: isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.05]',
      };
    }

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        level: 'overdue',
        isUrgent: true,
        label: `${translations.dueOn}: ${dateDisplay}`,
        badge:
          language === 'ku'
            ? `دواکەوتووە بە ${daysAgo} ڕۆژ`
            : language === 'ar'
            ? `متأخر منذ ${daysAgo} يوماً`
            : language === 'es'
            ? `Vencido hace ${daysAgo}d`
            : `Overdue by ${daysAgo}d`,
        badgeClass: isLight
          ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold'
          : 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold',
        textClass: isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold',
        containerClass: isLight
          ? 'bg-rose-50 border-rose-300 border-s-4 border-s-rose-500'
          : 'bg-rose-500/[0.09] border-rose-500/40 border-s-4 border-s-rose-500',
      };
    }

    if (diffDays === 0) {
      return {
        level: 'today',
        isUrgent: true,
        label: `${translations.dueOn}: ${dateDisplay}`,
        badge:
          language === 'ku'
            ? 'ئەمڕۆ بەسەردەچێت!'
            : language === 'ar'
            ? 'مستحق اليوم!'
            : language === 'es'
            ? '¡Vence hoy!'
            : 'Due Today!',
        badgeClass: isLight
          ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold'
          : 'bg-rose-500/25 text-rose-300 border-rose-500/60 font-bold',
        textClass: isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold',
        containerClass: isLight
          ? 'bg-rose-50 border-rose-300 border-s-4 border-s-rose-500'
          : 'bg-rose-500/[0.1] border-rose-500/45 border-s-4 border-s-rose-500',
      };
    }

    if (diffDays <= 3) {
      return {
        level: 'urgent',
        isUrgent: true,
        label: `${translations.dueOn}: ${dateDisplay}`,
        badge:
          language === 'ku'
            ? `لە ماوەی ${diffDays} ڕۆژدا`
            : language === 'ar'
            ? `مستحق خلال ${diffDays} أيام`
            : language === 'es'
            ? `Vence en ${diffDays}d`
            : `Due in ${diffDays}d`,
        badgeClass: isLight
          ? 'bg-amber-100 text-amber-800 border-amber-400 font-bold'
          : 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold',
        textClass: isLight ? 'text-amber-800 font-bold' : 'text-amber-300 font-bold',
        containerClass: isLight
          ? 'bg-amber-50 border-amber-300 border-s-4 border-s-amber-500'
          : 'bg-amber-500/[0.09] border-amber-500/40 border-s-4 border-s-amber-500',
      };
    }

    return {
      level: 'normal',
      isUrgent: false,
      label: `${translations.dueOn}: ${dateDisplay}`,
      badge:
        language === 'ku'
          ? `لە ${diffDays} ڕۆژدا`
          : language === 'ar'
          ? `خلال ${diffDays} يوماً`
          : language === 'es'
          ? `En ${diffDays}d`
          : `In ${diffDays}d`,
      badgeClass: isLight
        ? 'bg-slate-100 text-slate-700 border-slate-300'
        : 'bg-white/[0.05] text-slate-300 border-white/[0.08]',
      textClass: isLight ? 'text-slate-700' : 'text-slate-300',
      containerClass: isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]',
    };
  };

  const deadline = getDeadlineState();
  const isOverdue = deadline?.level === 'overdue';

  const paidAmount = loan.paidAmount || 0;
  const hasPartialPayment = paidAmount > 0 && !isSettled;
  const remainingAmount = Math.max(0, loan.amount - paidAmount);

  const progressPercent = computeDebtProgressPercent(loan);
  const ringStrokeColor = isTheyOweMe
    ? '#34D399'
    : '#FB7185';
  const ringTrackColor = isVelvetPink
    ? 'rgba(232, 180, 160, 0.16)'
    : 'rgba(255, 255, 255, 0.08)';
  const ringGlowFilter = isTheyOweMe
    ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.45))'
    : 'drop-shadow(0 0 6px rgba(251, 113, 133, 0.45))';

  const compactRadius = 15;
  const compactCircumference = 2 * Math.PI * compactRadius;
  const compactOffset = compactCircumference - (progressPercent / 100) * compactCircumference;

  const spaciousRadius = 23;
  const spaciousCircumference = 2 * Math.PI * spaciousRadius;
  const spaciousOffset = spaciousCircumference - (progressPercent / 100) * spaciousCircumference;

  const formattedSignedTotal = formatSignedCardDebt(loan.amount, loanCurrency, language, loan.type);
  const formattedSignedRemaining = formatSignedCardDebt(remainingAmount, loanCurrency, language, loan.type);
  const formattedUnsignedDebt = formatCardDebt(loan.amount, loanCurrency, language);
  const formattedPaid = formatCardDebt(paidAmount, loanCurrency, language);
  const dualEquiv = showDualCurrency
    ? resolveRecordDualEquivalent(
        hasPartialPayment ? remainingAmount : loan.amount,
        loanCurrency,
        customRates,
        loan
      )
    : null;
  const formattedDualEquiv = dualEquiv
    ? `${isTheyOweMe ? '+' : '-'}${formatCardDebt(dualEquiv.convertedAmount, dualEquiv.targetCurrency, language)}`
    : null;

  const newlyCreatedClass = isNewlyAdded
    ? isTheyOweMe
      ? 'animate-organic-enter ring-2 ring-emerald-400/50'
      : isVelvetPink
      ? 'animate-organic-enter ring-2 ring-[#FF65B5]/60'
      : 'animate-organic-enter ring-2 ring-rose-400/50'
    : '';

  const DirectionIcon = isTheyOweMe ? ArrowDownLeft : ArrowUpRight;
  const directionGlow = isTheyOweMe ? 'they_owe' : 'i_owe';

  if (viewMode === 'compact') {
    return (
      <motion.article
        data-testid={`loan-card-${loan.id}`}
        initial={isNewlyAdded ? { opacity: 0, y: 12, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.85 }}
        style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
        className={`relative overflow-hidden border smooth-interactive flex items-center justify-between gap-3 ${newlyCreatedClass} ${
          isSettled
            ? isLight
              ? 'bg-slate-100/80 border-slate-200 opacity-75 rounded-2xl p-3 sm:p-3.5'
              : 'bg-white/[0.02] border-white/[0.05] opacity-60 rounded-2xl p-3 sm:p-3.5'
            : isTheyOweMe
            ? isLight
              ? 'glass-card border-emerald-300/80 hover:border-emerald-500 rounded-2xl p-3.5 sm:p-4'
              : 'glass-card border-emerald-500/35 hover:border-emerald-400/60 rounded-2xl p-3.5 sm:p-4 shadow-md shadow-emerald-950/20'
            : isVelvetPink
            ? 'glass-card border-[#FF2E93]/35 hover:border-[#FF65B5]/65 rounded-xl p-2.5 sm:p-3 shadow-md shadow-[#FF2E93]/15'
            : isLight
            ? 'glass-card border-rose-300/80 hover:border-rose-500 rounded-xl p-2.5 sm:p-3'
            : 'glass-card border-rose-500/25 hover:border-rose-400/50 rounded-xl p-2.5 sm:p-3 shadow-sm shadow-rose-950/15'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            data-testid={`loan-card-profile-trigger-${loan.id}`}
            onClick={() => (hasProfileLink ? onOpenCounterpartyProfile?.(loan) : onEdit?.(loan))}
            aria-label={hasProfileLink ? `View profile for ${loan.personName}` : `Open details for ${loan.personName}`}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-start cursor-pointer group/profile rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border ${
                isTheyOweMe
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {counterpartyAvatar ? (
                <img
                  src={counterpartyAvatar}
                  alt={loan.personName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <DirectionIcon glow={directionGlow} className="w-4 h-4" strokeWidth={1.65} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  dir="auto"
                  className={`text-sm font-bold font-pricedown tracking-wide truncate transition-colors ${
                    hasProfileLink ? 'group-hover/profile:underline underline-offset-2' : ''
                  } ${
                    isSettled
                      ? 'line-through text-slate-400'
                      : 'text-white'
                  }`}
                >
                  {loan.personName}
                </h4>
                {loan.linkedUsername &&
                  (loan.personName || '').trim().toLowerCase() !== `@${loan.linkedUsername.toLowerCase()}` && (
                    <span
                      dir="ltr"
                      className="text-[11px] font-mono truncate text-slate-400"
                    >
                      @{loan.linkedUsername}
                    </span>
                  )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${
                    isTheyOweMe
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25'
                      : 'bg-rose-400/10 text-rose-400 border-rose-400/25'
                  }`}
                >
                  <DirectionIcon glow={directionGlow} className="w-3 h-3" strokeWidth={1.65} />
                  <span className="inline-emoji text-[11px]" aria-hidden="true">{isTheyOweMe ? '💰' : '💸'}</span>
                  <span>{isTheyOweMe ? translations.theyOweMe : translations.iOweThem}</span>
                </span>
              </div>
              {deadline && (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span data-numeric="true" className={`text-[10px] sm:text-[11px] font-numeric tabular-nums font-semibold ${deadline.textClass}`}>
                    {deadline.label}
                  </span>
                  <span data-numeric="true" className={`text-[9px] px-1.5 py-0.2 rounded-full border font-numeric font-bold ${deadline.badgeClass}`}>
                    {deadline.badge}
                  </span>
                </div>
              )}
            </div>
          </motion.button>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              data-testid={`loan-progress-ring-${loan.id}`}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${translations.settlementProgress}: ${progressPercent}%`}
              className="relative w-10 h-10 shrink-0 flex items-center justify-center"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90" aria-hidden="true">
                <circle
                  cx="20"
                  cy="20"
                  r={compactRadius}
                  fill="transparent"
                  stroke={ringTrackColor}
                  strokeWidth="3.5"
                />
                <motion.circle
                  cx="20"
                  cy="20"
                  r={compactRadius}
                  fill="transparent"
                  stroke={ringStrokeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={compactCircumference}
                  initial={{ strokeDashoffset: compactCircumference }}
                  animate={{ strokeDashoffset: compactOffset }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: ringGlowFilter }}
                />
              </svg>
              <span
                data-numeric="true"
                dir="ltr"
                className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold font-numeric tabular-nums ${
                  isSettled
                    ? 'text-emerald-400'
                    : isTheyOweMe
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {progressPercent}%
              </span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              data-testid={`loan-card-open-${loan.id}`}
              onClick={() => onEdit?.(loan)}
              aria-label={`Open details for ${loan.personName}`}
              className="text-end shrink-0 cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span
                data-numeric="true"
                dir="ltr"
                className={`font-numeric font-black text-sm sm:text-base flex items-center gap-1 justify-end tabular-nums ${
                  isSettled ? 'text-slate-400 line-through' : isTheyOweMe ? 'metallic-emerald' : 'metallic-rose'
                }`}
              >
                <span>{hasPartialPayment ? formattedSignedRemaining : formattedSignedTotal}</span>
              </span>
              {dualEquiv && formattedDualEquiv && (
                <span
                  data-testid={`loan-card-dual-${loan.id}`}
                  data-numeric="true"
                  dir="ltr"
                  className={`text-[10px] font-numeric tabular-nums font-medium block ${
                    isSettled
                      ? 'text-slate-500'
                      : isLight
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  ≈ {formattedDualEquiv}
                </span>
              )}
              {hasPartialPayment && (
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                  {translations.paidSoFar}:{' '}
                  <span data-numeric="true" dir="ltr" className="font-numeric tabular-nums inline-block">
                    {formattedPaid}
                  </span>
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(loan);
              }}
              title={translations.editLoan}
              aria-label={`${translations.editLoan} ${loan.personName}`}
              className={`p-1.5 sm:p-2 rounded-xl cursor-pointer transition-colors ${
                isLight
                  ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Edit3 className="w-4 h-4" strokeWidth={1.65} />
            </button>
          )}
          {canShowPaymentActions(loan) && onPayWithFib && (
            <button
              type="button"
              data-testid={`pay-with-fib-compact-${loan.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onPayWithFib(loan);
              }}
              title={language === 'ku' ? 'پارەدان بە FIB' : language === 'ar' ? 'الدفع عبر FIB' : language === 'tr' ? 'FIB ile Öde' : language === 'fr' ? 'Payer via FIB' : language === 'es' ? 'Pagar con FIB' : 'Pay with FIB'}
              aria-label={`Pay ${loan.personName} with FIB`}
              className={`px-2 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-bold ${
                isLight
                  ? 'text-emerald-800 hover:bg-emerald-100'
                  : 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/15'
              }`}
            >
              <FibBadgeSvg className="h-3.5 w-auto" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(loan.id);
            }}
            title={isSettled ? translations.markAsActive : translations.markAsSettled}
            aria-label={`${isSettled ? translations.markAsActive : translations.markAsSettled} ${loan.personName}`}
            className={`p-1.5 sm:p-2 rounded-xl cursor-pointer transition-colors ${
              isSettled
                ? 'text-amber-500 hover:bg-amber-500/15'
                : isLight
                ? 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/70'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-white/[0.08]'
            }`}
          >
            {isSettled ? (
              <RotateCcw className="w-4 h-4" strokeWidth={1.65} />
            ) : (
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.65} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(loan);
            }}
            title={translations.deleteLoan}
            aria-label={`${translations.deleteLoan} ${loan.personName}`}
            className={`p-1.5 sm:p-2 rounded-xl cursor-pointer transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-100'
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.65} />
          </button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      data-testid={`loan-card-${loan.id}`}
      initial={isNewlyAdded ? { opacity: 0, y: 12, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.85 }}
      style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
      className={`relative overflow-hidden border smooth-interactive group ${newlyCreatedClass} ${
        isSettled
          ? isLight
            ? 'bg-slate-100/80 border-slate-200 opacity-75 hover:opacity-100 rounded-3xl p-5 sm:p-6'
            : 'bg-white/[0.02] border-white/[0.05] opacity-70 hover:opacity-100 rounded-3xl p-5 sm:p-6'
          : isTheyOweMe
          ? isLight
            ? 'glass-card border-emerald-300/80 hover:border-emerald-500 rounded-3xl p-5 sm:p-6'
            : 'glass-card border-emerald-500/30 hover:border-emerald-400/60 shadow-xl shadow-emerald-950/20 rounded-3xl p-5 sm:p-6'
          : isVelvetPink
          ? 'glass-card border-[#FF2E93]/35 hover:border-[#FF65B5]/65 shadow-lg shadow-[#FF2E93]/15 rounded-2xl p-4 sm:p-4.5'
          : isLight
          ? 'glass-card border-rose-300/80 hover:border-rose-500 rounded-2xl p-4 sm:p-4.5'
          : 'glass-card border-rose-500/20 hover:border-rose-400/40 shadow-lg shadow-rose-950/15 rounded-2xl p-4 sm:p-4.5'
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`h-1 w-full mb-3.5 rounded-full ${
          isSettled
            ? 'bg-slate-400/40'
            : isTheyOweMe
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
            : isVelvetPink
            ? 'bg-gradient-to-r from-[#FF2E93] via-[#FF65B5] to-[#E8B4A0]'
            : 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600'
        }`}
      />

      <div>
        {/* Row 1: Clickable Counterparty Profile Header + Clickable Signed Amount */}
        <div className="flex items-start justify-between gap-3.5 mb-3.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            data-testid={`loan-card-profile-trigger-${loan.id}`}
            onClick={() => (hasProfileLink ? onOpenCounterpartyProfile?.(loan) : onEdit?.(loan))}
            aria-label={hasProfileLink ? `View profile for ${loan.personName}` : `Open debt details for ${loan.personName}`}
            className="flex items-center gap-3 min-w-0 flex-1 text-start cursor-pointer group/profile rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="relative shrink-0">
              <div
                className={`flex items-center justify-center overflow-hidden font-black tracking-wider border shadow-sm transition-transform duration-200 group-hover/profile:scale-[1.03] ${
                  isTheyOweMe ? 'w-12 h-12 rounded-2xl text-sm' : 'w-10 h-10 rounded-xl text-xs'
                } ${
                  isSettled
                    ? 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                    : isTheyOweMe
                    ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/15 border-emerald-400/50 text-emerald-400'
                    : 'bg-gradient-to-br from-rose-500/25 to-pink-500/15 border-rose-400/50 text-rose-400'
                }`}
              >
                {counterpartyAvatar ? (
                  <img
                    src={counterpartyAvatar}
                    alt={loan.personName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (loan.personName || '').replace(/^@+/, '').trim().slice(0, 2).toUpperCase() || '?'
                )}
              </div>
              <span
                className={`absolute -bottom-1.5 -end-1.5 text-[9px] border rounded-lg px-1.5 py-0.5 flex items-center gap-0.5 font-numeric font-bold shadow-sm ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : isVelvetPink
                    ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FCE7F3]'
                    : 'bg-slate-900/95 border-white/15 text-slate-200'
                }`}
                title={`${isTheyOweMe ? translations.theyOweMe : translations.iOweThem} • ${currencyItem.code}`}
              >
                <DirectionIcon glow={directionGlow} className="w-2.5 h-2.5" strokeWidth={2} />
                <span>{currencyItem.code}</span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h4
                  className={`font-black font-pricedown tracking-wide line-clamp-1 break-words ${
                    hasProfileLink ? 'group-hover/profile:underline underline-offset-2' : ''
                  } ${
                    isTheyOweMe ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  } ${isLight ? 'text-slate-900' : 'text-white'}`}
                  dir="auto"
                  title={loan.personName}
                >
                  {loan.personName}
                </h4>
                {loan.linkedUsername &&
                  (loan.personName || '').trim().toLowerCase() !== `@${loan.linkedUsername.toLowerCase()}` && (
                    <span
                      dir="ltr"
                      className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      @{loan.linkedUsername}
                    </span>
                  )}
                {isSettled && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.65} />
                    <span>{translations.statusSettled}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isTheyOweMe
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                      : 'bg-rose-400/10 text-rose-400 border-rose-400/30'
                  }`}
                >
                  <DirectionIcon glow={directionGlow} className="w-3 h-3" strokeWidth={1.65} />
                  <span className="inline-emoji text-xs" aria-hidden="true">{isTheyOweMe ? '💰' : '💸'}</span>
                  <span>{isTheyOweMe ? translations.theyOweMe : translations.iOweThem}</span>
                </span>
                {isOverdue && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      isLight
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" strokeWidth={1.65} />
                    <span>{translations.overdue}</span>
                  </span>
                )}
              </div>
            </div>
          </motion.button>

          {/* Signed Amount Display (Direct in Recorded Currency, Zero FX Subtitle) */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            data-testid={`loan-card-open-${loan.id}`}
            onClick={() => onEdit?.(loan)}
            aria-label={`Open debt details for ${loan.personName}`}
            className="text-end shrink-0 cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Wallet className="w-3 h-3 opacity-75" strokeWidth={1.65} />
                <span>{hasPartialPayment ? translations.remainingDebt : translations.totalDebt}</span>
              </div>
              <div
                data-testid={`loan-card-amount-${loan.id}`}
                data-numeric="true"
                dir="ltr"
                className={`font-black tracking-tight font-numeric flex items-center justify-end gap-1 tabular-nums ${
                  isTheyOweMe ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                } ${
                  isSettled
                    ? 'text-slate-400 line-through'
                    : isTheyOweMe
                    ? 'metallic-emerald'
                    : 'metallic-rose'
                }`}
              >
                <span>{hasPartialPayment ? formattedSignedRemaining : formattedSignedTotal}</span>
              </div>
              {dualEquiv && formattedDualEquiv && (
                <div
                  data-testid={`loan-card-dual-${loan.id}`}
                  data-numeric="true"
                  dir="ltr"
                  className={`text-[11px] font-numeric tabular-nums font-medium mt-0.5 flex items-center justify-end gap-1.5 ${
                    isSettled
                      ? 'text-slate-500'
                      : isLight
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  <span>≈ {formattedDualEquiv}</span>
                  {loanCurrency !== 'USD' && dualEquiv.usedRateUsdToIqd > 0 && (
                    <span className="opacity-75 text-[10px]">
                      @{dualEquiv.usedRateUsdToIqd.toLocaleString('en-US')}
                    </span>
                  )}
                </div>
              )}
              {hasPartialPayment && (
                <div className="text-[10px] sm:text-[11px] font-numeric tabular-nums mt-0.5 flex flex-col items-end gap-0.5">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-500'}>
                    {translations.originalDebt}: {formattedUnsignedDebt}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold border ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    {translations.paidSoFar}: {formattedPaid}
                  </span>
                </div>
            )}
          </motion.button>
        </div>

        {/* Clickable Details Area (Progress, Deadline, Notes) */}
        <button
          type="button"
          onClick={() => onEdit?.(loan)}
          aria-label={`Edit details for ${loan.personName}`}
          className="w-full text-start cursor-pointer block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-2xl"
        >
          {/* Circular Progress Visualizer & Settlement Status */}
          <div
            className={`my-3.5 p-3.5 rounded-2xl border flex items-center gap-3.5 ${
              isLight
                ? 'bg-slate-50/90 border-slate-200'
                : isVelvetPink
                ? 'bg-[#170D1B]/65 border-[#E8B4A0]/18'
                : 'bg-white/[0.03] border-white/[0.06]'
            }`}
          >
            <div
              data-testid={`loan-progress-ring-${loan.id}`}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${translations.settlementProgress}: ${progressPercent}%`}
              className="relative w-[58px] h-[58px] shrink-0 flex items-center justify-center"
            >
              <svg width="58" height="58" viewBox="0 0 58 58" className="-rotate-90" aria-hidden="true">
                <circle
                  cx="29"
                  cy="29"
                  r={spaciousRadius}
                  fill="transparent"
                  stroke={ringTrackColor}
                  strokeWidth="4.5"
                />
                <motion.circle
                  cx="29"
                  cy="29"
                  r={spaciousRadius}
                  fill="transparent"
                  stroke={ringStrokeColor}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={spaciousCircumference}
                  initial={{ strokeDashoffset: spaciousCircumference }}
                  animate={{ strokeDashoffset: spaciousOffset }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: ringGlowFilter }}
                />
              </svg>
              <span
                data-numeric="true"
                dir="ltr"
                className={`absolute inset-0 flex items-center justify-center text-xs font-black font-numeric tabular-nums ${
                  isSettled
                    ? 'text-emerald-400'
                    : isTheyOweMe
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {progressPercent}%
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 font-medium truncate text-slate-400">
                  <span className="truncate">{translations.settlementProgress}</span>
                </span>
                <span
                  className={`font-bold text-[11px] flex items-center gap-1 shrink-0 ${
                    isSettled
                      ? 'text-emerald-400'
                      : progressPercent > 0
                      ? isTheyOweMe
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isSettled ? (
                    <CheckCircle2 glow="they_owe" className="w-3.5 h-3.5" strokeWidth={1.65} />
                  ) : (
                    <Wallet glow={directionGlow} className="w-3.5 h-3.5" strokeWidth={1.65} />
                  )}
                  <span>{isSettled ? translations.statusSettled : translations.statusActive}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                <span className="whitespace-nowrap">
                  {translations.paidSoFar}:{' '}
                  <strong data-numeric="true" dir="ltr" className="font-numeric tabular-nums inline-block text-slate-200">
                    {formattedPaid}
                  </strong>
                </span>
                <span className="whitespace-nowrap">
                  {translations.remainingDebt}:{' '}
                  <strong
                    data-numeric="true"
                    dir="ltr"
                    className={`font-numeric tabular-nums inline-block ${
                      isTheyOweMe
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {formatCardDebt(remainingAmount, loanCurrency, language)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Due Date Deadline Strip */}
          {deadline && (
            <div className={`my-3 p-3 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${deadline.containerClass}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-white border border-slate-200' : 'bg-white/[0.06]'
                  } ${deadline.isUrgent ? (deadline.level === 'urgent' ? 'text-amber-500' : 'text-rose-500') : 'text-slate-400'}`}
                >
                  {deadline.isUrgent ? (
                    <AlertTriangle className="w-4 h-4" strokeWidth={1.65} />
                  ) : (
                    <Calendar className="w-4 h-4" strokeWidth={1.65} />
                  )}
                </div>
                <div className="min-w-0">
                  <span data-numeric="true" className={`text-xs font-numeric tabular-nums tracking-tight block truncate ${deadline.textClass}`}>
                    {deadline.label}
                  </span>
                </div>
              </div>

              <span data-numeric="true" className={`text-[10px] px-2.5 py-1 rounded-xl border font-numeric flex items-center gap-1 shrink-0 ${deadline.badgeClass}`}>
                <span>{deadline.badge}</span>
              </span>
            </div>
          )}

          {/* Optional Metadata Details */}
          {(loan.phone || loan.notes) && (
            <div className={`py-2.5 my-1 border-t flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-white/[0.06] text-slate-400'}`}>
              {loan.phone && (
                <div className="flex items-center gap-1.5 font-numeric tabular-nums">
                  <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                  <span dir="ltr">{loan.phone}</span>
                </div>
              )}
              {loan.notes && (
                <div className={`flex items-center gap-1.5 w-full ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" strokeWidth={1.65} />
                  <span className="truncate">{loan.notes}</span>
                </div>
              )}
            </div>
          )}
        </button>

        {/* Action Controls Toolbar */}
        <div className={`pt-3 flex items-center justify-between gap-2 border-t mt-1 flex-wrap ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {canShowPaymentActions(loan) && onPayWithFib && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                data-testid={`pay-with-fib-${loan.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPayWithFib(loan);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-[#062238]/90 text-emerald-300 border-emerald-400/40 hover:bg-[#08314F] hover:border-emerald-400/65'
                }`}
                title={language === 'ku' ? 'پارەدان بە بانکی عێراقی یەکەم (FIB)' : language === 'ar' ? 'السداد عبر مصرف العراق الأول (FIB)' : language === 'tr' ? 'First Iraqi Bank (FIB) ile Öde' : language === 'fr' ? 'Payer via First Iraqi Bank (FIB)' : language === 'es' ? 'Pagar con FIB (First Iraqi Bank)' : 'Pay with FIB (First Iraqi Bank)'}
                aria-label={`Pay with FIB for ${loan.personName}`}
              >
                <FibBadgeSvg className="h-3.5 w-auto shrink-0" />
                <span className="whitespace-nowrap">
                  {language === 'ku' ? 'پارەدان بە FIB' : language === 'ar' ? 'الدفع عبر FIB' : language === 'tr' ? 'FIB ile Öde' : language === 'fr' ? 'Payer via FIB' : language === 'es' ? 'Pagar con FIB' : 'Pay with FIB'}
                </span>
              </motion.button>
            )}
            <span data-numeric="true" className={`text-[11px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {translations.createdOn}: {loan.createdAt}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onDiscussInChat && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscussInChat(loan);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-white/[0.03] hover:bg-sky-500/15 text-sky-300 border-sky-400/25'
                }`}
                title={
                  language === 'ku'
                    ? 'گفتوگۆ لە چات'
                    : language === 'ar'
                    ? 'مناقشة في المحادثة'
                    : language === 'tr'
                    ? 'Sohbette Paylaş'
                    : language === 'fr'
                    ? 'Discuter par chat'
                    : language === 'es'
                    ? 'Comentar en Chat'
                    : 'Discuss in Friends Chat'
                }
                aria-label={`Discuss ${loan.personName} in Friends Chat`}
              >
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.65} />
              </motion.button>
            )}
            {onEdit && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(loan);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-amber-800 border-amber-300'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-amber-300 border-amber-400/25'
                }`}
                title={translations.editLoan}
                aria-label={`${translations.editLoan} ${loan.personName}`}
              >
                <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} strokeWidth={1.65} />
                <span className="hidden sm:inline">{translations.editLoan}</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(loan.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                isSettled
                  ? isLight
                    ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                    : 'bg-white/[0.04] text-slate-300 border-white/[0.1] hover:text-white'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25 hover:bg-emerald-400/20'
              }`}
              title={isSettled ? translations.markAsActive : translations.markAsSettled}
              aria-label={`${isSettled ? translations.markAsActive : translations.markAsSettled} ${loan.personName}`}
            >
              {isSettled ? (
                <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
              )}
              <span className="hidden sm:inline">
                {isSettled ? translations.markAsActive : translations.markAsSettled}
              </span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(loan);
              }}
              aria-label={`${translations.deleteLoan} ${loan.personName}`}
              className={`p-2 rounded-xl border border-transparent transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-100 hover:border-rose-300'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20'
              }`}
              title={translations.deleteLoan}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.65} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
