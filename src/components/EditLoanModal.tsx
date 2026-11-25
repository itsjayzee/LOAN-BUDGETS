import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CurrencyCode,
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  LoanType,
  ThemeMode,
  Translations,
} from '../types';
import {
  CURRENCIES,
  applyPaymentUpdate,
  buildDebtPersonBinding,
  buildHistoricalRateSnapshot,
  canShowPaymentActions,
  formatCardDebt,
  formatSignedCardDebt,
  getRemainingLoanBalance,
  getTodayIsoDate,
  isLightThemeMode,
  resolveRecordDualEquivalent,
  roundCurrencyAmount,
  sanitizeDecimalAmountInput,
  toWesternNumerals,
  validateExactLinkedUsername,
} from '../utils/loanLogic';
import {
  X,
  Edit3,
  Check,
  Phone,
  FileText,
  User,
  Coins,
  PlusCircle,
  MinusCircle,
  Plus,
  CheckCircle2,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Calendar,
} from './OrganicIcons';
import { FibBadgeSvg } from './CardPaymentModal';
import { DatePickerModal } from './DatePickerModal';
import { UsernameSearchResults, useDebouncedUsernameSearch } from './UsernameSearchBox';

const CoinStack = Coins;

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onSaveLoan: (updatedLoan: Loan) => void;
  language: Language;
  translations: Translations;
  themeMode?: ThemeMode;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  excludeUid?: string | null;
  onPayWithCard?: (loan: Loan) => void;
  onPayWithFib?: (loan: Loan) => void;
  customRates?: Partial<Record<CurrencyCode, number>>;
  onOpenFxCalculator?: () => void;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  onSaveLoan,
  language,
  translations,
  themeMode = 'obsidian_neon',
  friends = [],
  chatThreads = [],
  excludeUid = null,
  onPayWithCard,
  onPayWithFib,
  customRates,
}) => {
  const [linkedUsername, setLinkedUsername] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [type, setType] = useState<LoanType>('they_owe_me');
  const [dueDate, setDueDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'settled'>('active');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [activeMode, setActiveMode] = useState<'repayment' | 'add_money' | 'details'>('repayment');
  const [remainingInput, setRemainingInput] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [addNotice, setAddNotice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasPickedSearchMatch, setHasPickedSearchMatch] = useState(false);
  const addNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addNoticeTimerRef.current !== null) {
        window.clearTimeout(addNoticeTimerRef.current);
      }
    };
  }, []);

  const searchState = useDebouncedUsernameSearch({
    query: linkedUsername.trim() ? linkedUsername : personName,
    friends,
    chatThreads,
    excludeUid,
    enabled: isOpen && activeMode === 'details' && !hasPickedSearchMatch,
    minChars: 2,
    debounceMs: 300,
  });

  useEffect(() => {
    if (isOpen && loan) {
      const fallbackHandle = loan.personName.trim().startsWith('@')
        ? loan.personName.trim().replace(/^@+/, '')
        : '';
      setLinkedUsername(loan.linkedUsername || fallbackHandle);
      setPersonName(loan.personName);
      setAmount(String(loan.amount));
      setPaidAmount(loan.paidAmount && loan.paidAmount > 0 ? String(loan.paidAmount) : '');
      setRemainingInput('');
      setCurrency(loan.currency || 'USD');
      setType(loan.type);
      setDueDate(loan.dueDate || '');
      setPhone(loan.phone || '');
      setNotes(loan.notes || '');
      setStatus(loan.status);
      setExtraAmount('');
      setExtraNote('');
      setAddNotice(false);
      setValidationError(null);
      setHasPickedSearchMatch(true);
      setActiveMode('repayment');
    }
  }, [loan, isOpen]);

  useEffect(() => {
    if (!isOpen || isDatePickerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isDatePickerOpen, onClose]);

  if (!isOpen || !loan) {
    return <AnimatePresence />;
  }

  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const parsedTotal = parseFloat(amount);
  const totalNum = !isNaN(parsedTotal) && parsedTotal > 0 ? roundCurrencyAmount(parsedTotal) : 0;
  const parsedPaid = parseFloat(paidAmount);
  const paidNum = !isNaN(parsedPaid)
    ? roundCurrencyAmount(Math.max(0, Math.min(totalNum || Infinity, parsedPaid)))
    : 0;
  const remainingNum = roundCurrencyAmount(Math.max(0, totalNum - paidNum));
  const progressRatio = totalNum > 0 ? Math.min(1, paidNum / totalNum) : 0;
  const isFullyPaid = totalNum > 0 && paidNum >= totalNum;

  const initialRemaining = loan.status === 'settled' ? 0 : getRemainingLoanBalance(loan);
  const pendingExtraVal = parseFloat(extraAmount);
  const previewRemaining =
    activeMode === 'add_money' && !isNaN(pendingExtraVal) && pendingExtraVal > 0
      ? roundCurrencyAmount(remainingNum + pendingExtraVal)
      : remainingNum;
  const deltaFromOriginal = roundCurrencyAmount(previewRemaining - initialRemaining);

  const recordRatesForDisplay = currency === (loan.currency || 'USD') ? loan : undefined;
  const heroDualEquiv = resolveRecordDualEquivalent(
    remainingNum,
    currency,
    customRates,
    recordRatesForDisplay
  );
  const paidDualEquiv =
    paidNum > 0
      ? resolveRecordDualEquivalent(paidNum, currency, customRates, recordRatesForDisplay)
      : null;
  const extraDualEquiv =
    !isNaN(pendingExtraVal) && pendingExtraVal > 0
      ? resolveRecordDualEquivalent(pendingExtraVal, currency, customRates, recordRatesForDisplay)
      : null;
  const totalDualEquiv =
    totalNum > 0
      ? resolveRecordDualEquivalent(totalNum, currency, customRates, recordRatesForDisplay)
      : null;

  // Add more money to total debt (with optional custom note)
  const buildExtraMoneyNote = (valToAdd: number, customNoteText: string): string => {
    const today = getTodayIsoDate();
    const cleanedNote = customNoteText.trim();
    return cleanedNote
      ? `[+${valToAdd.toLocaleString()} ${currency} (${cleanedNote}) on ${today}]`
      : `[+${valToAdd.toLocaleString()} ${currency} added on ${today}]`;
  };

  const handleApplyExtraMoney = () => {
    const valToAdd = roundCurrencyAmount(parseFloat(toWesternNumerals(extraAmount)));
    if (!valToAdd || isNaN(valToAdd) || valToAdd <= 0) return;

    const newTotal = roundCurrencyAmount(totalNum + valToAdd);
    setAmount(String(newTotal));
    const logEntry = buildExtraMoneyNote(valToAdd, extraNote);
    setNotes((prev) => (prev ? `${prev} • ${logEntry}` : logEntry));
    setExtraAmount('');
    setExtraNote('');
    setStatus('active');
    setValidationError(null);

    setAddNotice(true);
    if (addNoticeTimerRef.current !== null) {
      window.clearTimeout(addNoticeTimerRef.current);
    }
    addNoticeTimerRef.current = window.setTimeout(() => {
      setAddNotice(false);
      addNoticeTimerRef.current = null;
    }, 2500);
  };

  // Pure numeric repayment handlers (Strictly direct numeric entry, zero preset/percentage buttons)
  const handleSetExactPaid = (exact: number) => {
    const nextVal = roundCurrencyAmount(Math.max(0, Math.min(totalNum, exact)));
    setPaidAmount(nextVal > 0 ? String(nextVal) : '');
    setRemainingInput('');
    setStatus(nextVal >= totalNum && totalNum > 0 ? 'settled' : 'active');
    setValidationError(null);
  };

  const handleDirectPaidChange = (raw: string) => {
    const cleaned = sanitizeDecimalAmountInput(raw);
    setPaidAmount(cleaned);
    setRemainingInput('');
    const val = parseFloat(cleaned);
    if (!isNaN(val) && totalNum > 0) {
      setStatus(val >= totalNum ? 'settled' : 'active');
    } else if (cleaned === '' || val === 0) {
      setStatus('active');
    }
    setValidationError(null);
  };

  const handleRemainingInputChange = (raw: string) => {
    const cleaned = sanitizeDecimalAmountInput(raw);
    setRemainingInput(cleaned);
    if (cleaned === '') {
      const initialPaid = loan.paidAmount && loan.paidAmount > 0 ? String(loan.paidAmount) : '';
      setPaidAmount(initialPaid);
      setStatus(loan.status);
      setValidationError(null);
      return;
    }
    const desiredRem = parseFloat(cleaned);
    if (isNaN(desiredRem)) return;
    const clampedRem = Math.max(0, Math.min(totalNum, desiredRem));
    const derivedPaid = roundCurrencyAmount(Math.max(0, totalNum - clampedRem));
    setPaidAmount(derivedPaid > 0 ? String(derivedPaid) : '');
    setStatus(clampedRem === 0 && totalNum > 0 ? 'settled' : 'active');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const binding = buildDebtPersonBinding({
      linkedUsername,
      displayLabel: personName,
    });
    if (!binding.valid) {
      const userErr = validateExactLinkedUsername(linkedUsername, { required: false });
      setValidationError(
        userErr.reason === 'too_short'
          ? pick(
              'Optional @username must be at least 3 characters (letters, numbers, underscores), or leave it blank.',
              'اسم المستخدم الاختياري يجب أن لا يقل عن 3 أحرف، أو اتركه فارغاً.',
              'ئەگەر @username دەنووسێت دەبێت لانیکەم ٣ پیت بێت، یان بە بەتاڵی جێیبهێڵە.',
              'İsteğe bağlı kullanıcı adı en az 3 karakter olmalıdır.',
              "Le @nom_utilisateur optionnel doit contenir au moins 3 caractères.",
              'El @usuario opcional debe tener al menos 3 caracteres, o déjalo vacío.'
            )
          : !userErr.valid
          ? pick(
              'Username may only contain letters, numbers, and underscores (_), max 32 chars.',
              'يسمح فقط بالأحرف والأرقام و(_) بحد أقصى 32 حرفاً.',
              'تەنها پیت و ژمارە و (_) ڕێگەپێدراوە (تا ٣٢ پیت).',
              'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir.',
              "Seuls les lettres, chiffres et underscores (_) sont autorisés.",
              'El usuario solo puede contener letras, números y guiones bajos (_), máx. 32 caracteres.'
            )
          : pick(
              'Enter the contact Full Name (or an optional @username).',
              'أدخل الاسم الكامل (أو @username اختيارياً).',
              'ناوی تەواو بنووسە (یان @username بە دڵخوازانە).',
              'Ad Soyad veya isteğe bağlı @kullanıcı_adı girin.',
              'Saisissez le nom complet ou un @nom_utilisateur optionnel.',
              'Ingresa el nombre completo (o un @usuario opcional).'
            )
      );
      return;
    }

    const nextLinkedUsername = binding.linkedUsername;
    const prevAutoLabel = loan.linkedUsername ? `@${loan.linkedUsername}` : '';
    const rawTrimmed = personName.trim();
    const nextPersonName =
      !rawTrimmed || (nextLinkedUsername && prevAutoLabel && rawTrimmed.toLowerCase() === prevAutoLabel.toLowerCase())
        ? binding.personName
        : rawTrimmed;

    if (!nextPersonName) {
      setValidationError(translations.requiredFieldError);
      return;
    }

    // If user typed an Add More Money value and pressed Save directly, apply it seamlessly
    let effectiveTotal = totalNum;
    let effectiveNotes = notes.trim();
    let effectiveStatus = status;
    const unappliedExtra = parseFloat(toWesternNumerals(extraAmount));
    if (activeMode === 'add_money' && !isNaN(unappliedExtra) && unappliedExtra > 0) {
      effectiveTotal = roundCurrencyAmount(effectiveTotal + unappliedExtra);
      const logEntry = buildExtraMoneyNote(roundCurrencyAmount(unappliedExtra), extraNote);
      effectiveNotes = effectiveNotes ? `${effectiveNotes} • ${logEntry}` : logEntry;
      effectiveStatus = 'active';
    }

    if (effectiveTotal <= 0) {
      setValidationError(translations.invalidAmountError);
      return;
    }

    const effectivePaid = isNaN(parsedPaid) ? 0 : roundCurrencyAmount(Math.max(0, Math.min(effectiveTotal, parsedPaid)));
    const settledNow = effectiveTotal > 0 && effectivePaid >= effectiveTotal;
    const currencyChanged = currency !== (loan.currency || 'USD');
    const fxPatch =
      currencyChanged || !loan.exchangeRateAtEntry
        ? buildHistoricalRateSnapshot(currency, customRates)
        : {
            exchangeRateAtEntry: loan.exchangeRateAtEntry,
            fxRateToUsdAtEntry: loan.fxRateToUsdAtEntry,
          };

    const { updatedLoan } = applyPaymentUpdate(loan, {
      personName: nextPersonName,
      linkedUsername: nextLinkedUsername ?? '',
      amount: effectiveTotal,
      paidAmount: effectivePaid,
      currency,
      type,
      dueDate: dueDate || undefined,
      phone: phone.trim() || undefined,
      notes: effectiveNotes || undefined,
      status: settledNow ? 'settled' : effectiveStatus,
      ...fxPatch,
    });

    onSaveLoan(updatedLoan);
    onClose();
  };

  const selectedCurr = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const inputClass = isLight
    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
    : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500';

  return (
    <AnimatePresence>
      <motion.div
        key="edit-loan-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-loan-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl ${
          isLight ? 'bg-slate-900/45' : 'bg-black/75'
        }`}
      >
        <motion.div
          key="edit-loan-card"
          data-testid="edit-loan-modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.85 }}
          style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
          className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col smooth-interactive ${
            isLight
              ? isNordic
                ? 'bg-[#F4F8FD]/98 border-sky-200 text-slate-900'
                : 'bg-white border-slate-200 text-slate-900'
              : isVelvetPink
              ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FFF5FA]'
              : 'bg-[#0D121F] border-white/[0.1] text-slate-100'
          }`}
        >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/85'
              : 'border-white/[0.06] bg-[#080B11]/70'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm ${
                type === 'they_owe_me'
                  ? isLight
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : isLight
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/20 border-[#FF65B5]/45 text-[#FF65B5]'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
            >
              <Edit3 glow="accent" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="edit-loan-modal-title" className={`text-base sm:text-lg font-bold font-pricedown truncate tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {translations.editLoanModalTitle}
              </h2>
              <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {translations.editLoanModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          className={`flex border-b p-2 gap-1.5 shrink-0 ${
            isLight
              ? 'border-slate-200 bg-slate-100/70'
              : 'border-white/[0.06] bg-[#080B11]/50'
          }`}
        >
          <button
            type="button"
            data-testid="edit-mode-repayment"
            onClick={() => setActiveMode('repayment')}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeMode === 'repayment'
                ? isLight
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : isLight
                ? 'bg-transparent border-transparent text-slate-600 hover:text-slate-950 hover:bg-white'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <MinusCircle className={`w-4 h-4 shrink-0 ${activeMode === 'repayment' && isLight ? 'text-white' : 'text-emerald-500'}`} />
            <span className="truncate">{translations.logRepaymentTab}</span>
          </button>

          <button
            type="button"
            data-testid="edit-mode-add-money"
            onClick={() => setActiveMode('add_money')}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeMode === 'add_money'
                ? isLight
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : isLight
                ? 'bg-transparent border-transparent text-slate-600 hover:text-slate-950 hover:bg-white'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <PlusCircle className={`w-4 h-4 shrink-0 ${activeMode === 'add_money' && isLight ? 'text-slate-950' : 'text-amber-500'}`} />
            <span className="truncate">{translations.addMoreDebtTab}</span>
          </button>

          <button
            type="button"
            data-testid="edit-mode-details"
            onClick={() => setActiveMode('details')}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeMode === 'details'
                ? isLight
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-800 text-white border-slate-700 shadow-sm'
                : isLight
                ? 'bg-transparent border-transparent text-slate-600 hover:text-slate-950 hover:bg-white'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0 opacity-80" />
            <span className="truncate">{translations.editLoan}</span>
          </button>
        </div>

        {/* Scrollable Content Form + Pinned Save Footer */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
            {/* Refined Hero Balance Detail Card */}
            <div
              className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
                type === 'they_owe_me'
                  ? isLight
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 border-emerald-200'
                    : 'bg-gradient-to-br from-emerald-950/35 via-slate-900 to-slate-950 border-emerald-500/25'
                  : isLight
                  ? 'bg-gradient-to-br from-rose-50 via-white to-pink-50/50 border-rose-200'
                  : 'bg-gradient-to-br from-rose-950/35 via-slate-900 to-slate-950 border-rose-500/25'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {type === 'they_owe_me' ? (
                    <ArrowDownLeft glow="they_owe" className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={1.65} />
                  ) : (
                    <ArrowUpRight glow="i_owe" className={`w-4 h-4 shrink-0 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-500'}`} strokeWidth={1.65} />
                  )}
                  <div className="min-w-0">
                    <span className={`font-bold font-pricedown tracking-wide text-base truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {personName || loan.personName}
                    </span>
                    {linkedUsername.trim() && (
                      <span
                        data-testid="edit-hero-username"
                        className={`text-[11px] font-mono truncate block ${
                          type === 'they_owe_me'
                            ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                            : isLight ? 'text-rose-700' : 'text-rose-400'
                        }`}
                      >
                        @{linkedUsername.trim().replace(/^@+/, '')}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    type === 'they_owe_me'
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : isLight
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <span className="inline-emoji me-1" aria-hidden="true">{type === 'they_owe_me' ? '💰' : '💸'}</span>
                  {type === 'they_owe_me' ? translations.theyOweMe : translations.iOweThem}
                </span>
              </div>

              {/* Hero Tabular Remaining Numeral with + / - Signage */}
              <div className="text-center py-1">
                <span className={`text-[10px] uppercase tracking-wider font-bold block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {translations.remainingDebt}
                </span>
                <div
                  data-testid="edit-hero-remaining"
                  className={`text-3xl sm:text-4xl font-black font-numeric tabular-nums tracking-tight mt-0.5 ${
                    type === 'they_owe_me' ? 'metallic-emerald' : 'metallic-rose'
                  }`}
                >
                  {formatSignedCardDebt(remainingNum, currency, language, type)}
                </div>
                <div
                  data-testid="edit-hero-fx-preview"
                  data-numeric="true"
                  dir="ltr"
                  className={`text-xs font-numeric tabular-nums font-semibold mt-0.5 flex items-center justify-center gap-2 ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  <span>
                    ≈ {type === 'they_owe_me' ? '+' : '-'}
                    {formatCardDebt(heroDualEquiv.convertedAmount, heroDualEquiv.targetCurrency, language)}
                  </span>
                  <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    @ {heroDualEquiv.usedRateUsdToIqd.toLocaleString('en-US')} IQD/$
                  </span>
                </div>
              </div>

              {/* 3-Column Numeric Breakdown */}
              <div className={`grid grid-cols-3 gap-2 text-center pt-2 border-t text-xs ${isLight ? 'border-slate-200/80' : 'border-slate-800/80'}`}>
                <div className={`p-2 rounded-xl ${isLight ? 'bg-white/90 border border-slate-200/80' : 'bg-slate-900/80'}`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{translations.originalDebt}</span>
                  <span className={`font-numeric font-bold text-xs sm:text-sm tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatSignedCardDebt(totalNum, currency, language, type)}
                  </span>
                </div>
                <div className={`p-2 rounded-xl ${isLight ? 'bg-white/90 border border-slate-200/80' : 'bg-slate-900/80'}`}>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{translations.paidSoFar}</span>
                  <span className={`font-numeric font-bold text-xs sm:text-sm tabular-nums ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                    {formatCardDebt(paidNum, currency, language)}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    type === 'they_owe_me'
                      ? isLight
                        ? 'bg-emerald-100/70 border-emerald-300'
                        : 'bg-emerald-950/40 border-emerald-500/20'
                      : isLight
                      ? 'bg-rose-100/70 border-rose-300'
                      : 'bg-rose-950/40 border-rose-500/20'
                  }`}
                >
                  <span className={`text-[10px] block ${type === 'they_owe_me' ? (isLight ? 'text-emerald-800' : 'text-emerald-400') : isLight ? 'text-rose-800' : 'text-rose-400'}`}>
                    {translations.remainingDebt}
                  </span>
                  <span className={`font-numeric font-extrabold text-xs sm:text-sm tabular-nums ${type === 'they_owe_me' ? (isLight ? 'text-emerald-800' : 'text-emerald-300') : isLight ? 'text-rose-800' : 'text-rose-300'}`}>
                    {formatSignedCardDebt(remainingNum, currency, language, type)}
                  </span>
                </div>
              </div>

              {/* Visual Track Bar */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.round(progressRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Live Before -> Delta -> New Remaining Calculation Preview */}
            {Math.abs(deltaFromOriginal) > 0.001 && (
              <div
                data-testid="edit-live-preview"
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-numeric tabular-nums animate-organic-enter ${
                  isLight
                    ? 'bg-sky-50 border-sky-300 text-sky-950'
                    : 'bg-sky-500/10 border-sky-400/30 text-sky-200'
                }`}
              >
                <span className="font-semibold">
                  {pick('New Balance:', 'الرصيد الجديد:', 'بڕی نوێ:', 'Yeni Bakiye:', 'Nouveau Solde :', 'Nuevo saldo:')}
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="opacity-75">{formatSignedCardDebt(initialRemaining, currency, language, type)}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
                  <span>{formatSignedCardDebt(previewRemaining, currency, language, type)}</span>
                </div>
              </div>
            )}

            {/* MODE 1: LOG REPAYMENT / DIRECT NUMERIC PAYMENT ADJUSTMENT */}
            {activeMode === 'repayment' && (
              <div
                className={`p-4 rounded-2xl border space-y-3.5 animate-in fade-in ${
                  isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-950/85 border-emerald-500/25'
                }`}
              >
                {/* Direct Numeric Paid Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="edit-paid-amount" className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                      <CoinStack className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      <span>{translations.paidAmountLabel}</span>
                    </label>
                    <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {currency}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="edit-paid-amount"
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={paidAmount}
                      onChange={(e) => handleDirectPaidChange(e.target.value)}
                      placeholder={translations.amountPlaceholder}
                      className={`w-full min-h-[46px] ps-4 pe-16 py-2.5 rounded-xl border font-mono text-base font-bold outline-none tabular-nums focus:ring-2 focus:ring-emerald-500/20 ${
                        isLight
                          ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                          : 'bg-slate-900 border-slate-700 focus:border-emerald-500 text-white placeholder-slate-500'
                      }`}
                    />
                    <span className={`absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold pointer-events-none ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {currency}
                    </span>
                  </div>
                  {paidDualEquiv && (
                    <div
                      data-testid="edit-paid-fx-preview"
                      data-numeric="true"
                      dir="ltr"
                      className={`text-[11px] font-numeric tabular-nums font-semibold ${
                        isLight ? 'text-emerald-700' : 'text-emerald-300'
                      }`}
                    >
                      ≈ {formatCardDebt(paidDualEquiv.convertedAmount, paidDualEquiv.targetCurrency, language)} (@ {paidDualEquiv.usedRateUsdToIqd.toLocaleString('en-US')} IQD/$)
                    </div>
                  )}
                </div>

                {/* Direct Numeric Remaining Balance Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="edit-remaining-amount" className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {translations.remainingDebt}
                    </label>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      {pick('Direct remaining adjustment', 'تعديل المتبقي مباشرة', 'نوێکردنەوەی خێرای ماوە', 'Kalan tutar doğrudan düzeltme', 'Ajustement direct du solde', 'Ajuste directo del saldo')}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="edit-remaining-amount"
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={remainingInput}
                      placeholder={remainingNum > 0 ? String(remainingNum) : translations.amountPlaceholder}
                      onChange={(e) => handleRemainingInputChange(e.target.value)}
                      className={`w-full min-h-[44px] ps-4 pe-16 py-2 rounded-xl border font-mono text-sm font-semibold outline-none tabular-nums ${
                        isLight
                          ? 'bg-white border-slate-300 focus:border-emerald-600 text-emerald-800 placeholder-slate-400'
                          : 'bg-slate-900/70 border-slate-800 focus:border-emerald-500 text-emerald-300 placeholder-slate-500'
                      }`}
                    />
                    <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                      {currency}
                    </span>
                  </div>
                </div>

                {/* Settlement / Clear Controls (Zero Percentage or Quick-Add Presets) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSetExactPaid(totalNum)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer font-numeric"
                    title={`Pay full balance: ${totalNum.toLocaleString()}`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.65} />
                    <span className="truncate">
                      {isKu ? `دانەوەی تەواو (${totalNum.toLocaleString()})` : isAr ? `سداد كامل (${totalNum.toLocaleString()})` : isEs ? `Pagar todo (${totalNum.toLocaleString()})` : `Pay Full (${totalNum.toLocaleString()})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetExactPaid(0)}
                    className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all cursor-pointer font-numeric ${
                      isLight
                        ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Clear paid amount"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                    <span>{pick('Clear Paid', 'مسح الدفعة', 'سفرکردنەوە', 'Sıfırla', 'Réinitialiser', 'Limpiar')}</span>
                  </button>
                </div>

                {canShowPaymentActions({ type, status: loan.status }) && onPayWithFib && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      data-testid="edit-pay-with-fib-btn"
                      onClick={() => {
                        onClose();
                        onPayWithFib(loan);
                      }}
                      className={`w-full min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-[#062238]/90 hover:bg-[#093252] text-emerald-300 border-emerald-400/40'
                      }`}
                    >
                      <FibBadgeSvg className="h-3.5 w-auto shrink-0" />
                      <span className="whitespace-nowrap">
                        {pick('Pay with FIB', 'الدفع عبر FIB', 'پارەدان بە FIB', 'FIB ile Öde', 'Payer via FIB', 'Pagar con FIB')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: + ADD MORE MONEY / BORROW MORE (PURE NUMERIC + CUSTOM NOTES) */}
            {activeMode === 'add_money' && (
              <div
                className={`p-4 rounded-2xl border space-y-3.5 animate-in fade-in ${
                  isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                      isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>{translations.addMoreDebtTab}</h4>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{translations.addMoneyDesc}</p>
                  </div>
                </div>

                {addNotice && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                      isLight
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                    <span>{translations.amountAddedSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="edit-extra-amount" className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {translations.addAmountLabel}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="edit-extra-amount"
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        value={extraAmount}
                        onChange={(e) => setExtraAmount(sanitizeDecimalAmountInput(e.target.value))}
                        placeholder={translations.amountPlaceholder}
                        className={`w-full min-h-[44px] ps-4 pe-14 py-2.5 rounded-xl border font-mono text-sm outline-none tabular-nums ${
                          isLight
                            ? 'bg-white border-amber-400 focus:border-amber-600 text-slate-900 placeholder-slate-400'
                            : 'bg-slate-950 border-amber-500/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500'
                        }`}
                      />
                      <span className={`absolute end-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold pointer-events-none ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                        {currency}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid="apply-extra-money-btn"
                      onClick={handleApplyExtraMoney}
                      disabled={!extraAmount || parseFloat(extraAmount) <= 0}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {translations.addDebtBtn}
                    </button>
                  </div>
                  {extraDualEquiv && (
                    <div
                      data-testid="edit-extra-fx-preview"
                      data-numeric="true"
                      dir="ltr"
                      className={`text-[11px] font-numeric tabular-nums font-semibold ${
                        isLight ? 'text-amber-800' : 'text-amber-300'
                      }`}
                    >
                      + ≈ {formatCardDebt(extraDualEquiv.convertedAmount, extraDualEquiv.targetCurrency, language)} (@ {extraDualEquiv.usedRateUsdToIqd.toLocaleString('en-US')} IQD/$)
                    </div>
                  )}
                </div>

                {/* Custom Note for Adding Additional Money */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-extra-note" className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {pick(
                        'Custom Notes (Optional)',
                        'ملاحظة مخصصة (اختياري)',
                        'تێبینی تایبەت (دڵخوازانە)',
                        'Özel Notlar (İsteğe bağlı)',
                        'Notes personnalisées (Optionnel)',
                        'Notas personalizadas (Opcional)'
                      )}
                    </span>
                  </label>
                  <input
                    id="edit-extra-note"
                    type="text"
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder={pick(
                      'Reason for adding funds (e.g. extra lunch expense)...',
                      'سبب إضافة المبلغ (مثال: مصاريف إضافية)...',
                      'هۆکاری زیادکردنی پارە (نموونە: خەرجی زیادە)...',
                      'Ek tutar notu (ör. ek masraf)...',
                      'Raison de l\'ajout (ex. frais supplémentaires)...',
                      'Motivo del añadido (ej. gasto adicional)...'
                    )}
                    className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-xs outline-none ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {/* MODE 3: EDIT DETAILS & CORE INFORMATION */}
            {activeMode === 'details' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    {translations.loanTypeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setType('they_owe_me')}
                      className={`min-h-[46px] flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                        type === 'they_owe_me'
                          ? isLight
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <ArrowDownLeft glow="they_owe" className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={1.65} />
                      <span className="inline-emoji" aria-hidden="true">💰</span>
                      <span>+ {translations.theyOweMe}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('i_owe_them')}
                      className={`min-h-[46px] flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold smooth-interactive cursor-pointer active:scale-[0.98] ${
                        type === 'i_owe_them'
                          ? isLight
                            ? 'bg-rose-100 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                            : isVelvetPink
                            ? 'bg-[#FF2E93]/20 border-[#FF65B5] text-[#FFD6EB] ring-2 ring-[#FF2E93]/25 shadow-md'
                            : 'bg-rose-950/60 border-rose-500 text-rose-300 ring-2 ring-rose-500/20 shadow-md'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <ArrowUpRight glow="i_owe" className={`w-4 h-4 shrink-0 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-500'}`} strokeWidth={1.65} />
                      <span className="inline-emoji" aria-hidden="true">💸</span>
                      <span>- {translations.iOweThem}</span>
                    </button>
                  </div>
                </div>

                {/* Full Name / Contact (Primary) */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-person-name" className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {pick(
                        'Full Name / Contact',
                        'الاسم الكامل / جهة الاتصال',
                        'ناوی تەواو / کەسەکە',
                        'Ad Soyad / Kişi',
                        'Nom complet / Contact',
                        'Nombre completo / Contacto'
                      )}
                    </span>
                  </label>
                  <input
                    id="edit-person-name"
                    data-testid="edit-debt-display-label-input"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={personName}
                    onChange={(e) => {
                      setPersonName(e.target.value);
                      setHasPickedSearchMatch(false);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder={linkedUsername.trim() ? `@${linkedUsername.trim().replace(/^@+/, '')}` : translations.namePlaceholder}
                    className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm outline-none ${inputClass}`}
                  />
                  <UsernameSearchResults
                    searchState={searchState}
                    language={language}
                    themeMode={themeMode}
                    actionLabel={pick('Select', 'اختيار', 'هەڵبژاردن', 'Seç', 'Choisir', 'Seleccionar')}
                    emptyHint={pick(
                      'No problem — Full Name alone is valid.',
                      'لا مشكلة — يكفي الاسم الكامل.',
                      'کێشە نییە — تەنها ناوی تەواو بەسە.',
                      'Sorun değil — Ad Soyad tek başına yeterlidir.',
                      'Pas de souci — le nom complet suffit.',
                      'Sin problema — solo el nombre completo es válido.'
                    )}
                    onSelectCandidate={(candidate) => {
                      setPersonName(candidate.displayName || (candidate.username ? `@${candidate.username}` : ''));
                      setLinkedUsername(candidate.username || '');
                      setHasPickedSearchMatch(true);
                      if (validationError) setValidationError(null);
                    }}
                  />
                </div>

                {/* Optional Linked @username */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-person-username" className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    <span>
                      {pick(
                        'Link @username (Optional)',
                        'ربط اسم المستخدم @username (اختياري)',
                        'ناوی بەکارهێنەر @username (دڵخوازانە)',
                        '@kullanıcı_adı Bağla (İsteğe Bağlı)',
                        'Lier @nom_utilisateur (Optionnel)',
                        'Vincular @usuario (Opcional)'
                      )}
                    </span>
                  </label>
                  <div className="relative" dir="ltr">
                    <span
                      className={`absolute start-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold pointer-events-none ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      @
                    </span>
                    <input
                      id="edit-person-username"
                      data-testid="edit-debt-username-input"
                      name="edit_debt_recipient_username"
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={linkedUsername}
                      onChange={(e) => {
                        setLinkedUsername(e.target.value.replace(/^@+/, ''));
                        setHasPickedSearchMatch(false);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder={pick('Optional — e.g. lanya_2026', 'اختياري — مثال: lanya_2026', 'دڵخوازانە — نموونە lanya_2026', 'İsteğe bağlı — ör. lanya_2026', 'Optionnel — ex. lanya_2026', 'Opcional — ej. lanya_2026')}
                      className={`w-full min-h-[44px] ps-8 pe-4 py-2.5 rounded-xl border font-mono text-sm outline-none ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Total Debt Direct Input & Currency */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="edit-total-debt" className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>{translations.customDebtTotal} *</span>
                    </label>
                    <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {selectedCurr.code} — {isKu ? selectedCurr.nameKu : isAr ? selectedCurr.nameAr : isEs ? selectedCurr.nameEs : isTr ? selectedCurr.nameTr : isFr ? selectedCurr.nameFr : selectedCurr.nameEn}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="edit-total-debt"
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        value={amount}
                        onChange={(e) => setAmount(sanitizeDecimalAmountInput(e.target.value))}
                        placeholder={translations.amountPlaceholder}
                        className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border font-mono text-sm outline-none ${inputClass}`}
                      />
                    </div>

                    <select
                      aria-label={translations.currency}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500'
                      }`}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  {totalDualEquiv && (
                    <div className="pt-0.5">
                      <span
                        data-testid="edit-total-fx-preview"
                        data-numeric="true"
                        dir="ltr"
                        className={`text-[11px] font-numeric tabular-nums font-semibold ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        ≈ {formatCardDebt(totalDualEquiv.convertedAmount, totalDualEquiv.targetCurrency, language)} (@ {totalDualEquiv.usedRateUsdToIqd.toLocaleString('en-US')} IQD/$)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common fields: Due date, Phone, Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.65} />
                  <span>{translations.dueDateLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between font-numeric cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 hover:border-emerald-600 text-slate-900'
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500/50 text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.65} />
                    <span>{dueDate ? dueDate : translations.selectDueDate}</span>
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300'}`}>
                    {pick('Change', 'تعديل', 'گۆڕین', 'Değiştir', 'Modifier', 'Cambiar')}
                  </span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-phone" className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{translations.phoneLabel}</span>
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={translations.phonePlaceholder}
                  className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-xs outline-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-notes" className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{translations.notesLabel}</span>
              </label>
              <input
                id="edit-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={translations.notesPlaceholder}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-xs outline-none ${inputClass}`}
              />
            </div>

            {/* Status Override Toggle */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick('General Status:', 'حالة السداد العامة:', 'دۆخی گشتی دانەوە:', 'Genel Durum:', 'Statut général :', 'Estado general:')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    status === 'active'
                      ? isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {translations.statusActive}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('settled')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    status === 'settled'
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {translations.statusSettled}
                </button>
              </div>
            </div>
          </div>

          {validationError && (
            <div
              role="alert"
              data-testid="edit-loan-error"
              className="mx-4 sm:mx-5 mb-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs font-semibold shrink-0"
            >
              {validationError}
            </div>
          )}

          {/* Sticky Mobile-Friendly Action Footer */}
          <div
            className={`flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] ${
              isLight
                ? isNordic
                  ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                  : 'border-slate-200 bg-slate-50'
                : isVelvetPink
                ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
                : 'border-slate-800/80 bg-[#080B11]/90'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold smooth-interactive cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {translations.cancel}
            </button>
            <button
              type="submit"
              data-testid="edit-loan-save-btn"
              className={`min-h-[44px] flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 text-white shadow-lg smooth-interactive cursor-pointer ${
                isVelvetPink
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] shadow-[#FF2E93]/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{translations.saveChanges}</span>
            </button>
          </div>
        </form>
        </motion.div>

        <DatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          selectedDate={dueDate}
          onSelectDate={(newDate) => setDueDate(newDate)}
          loanType={type}
          language={language}
          themeMode={themeMode}
        />
      </motion.div>
    </AnimatePresence>
  );
};
