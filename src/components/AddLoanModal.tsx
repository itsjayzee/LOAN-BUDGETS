import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CurrencyCode,
  FriendChatThread,
  FriendRecord,
  Language,
  LoanType,
  ThemeMode,
  Translations,
} from '../types';
import {
  CURRENCIES,
  buildDebtPersonBinding,
  formatCardDebt,
  getTodayIsoDate,
  getUsdToIqdRate,
  isLightThemeMode,
  parseIsoDateLocal,
  resolveRecordDualEquivalent,
  roundCurrencyAmount,
  sanitizeDecimalAmountInput,
  toWesternNumerals,
} from '../utils/loanLogic';
import {
  X,
  Check,
  Phone,
  FileText,
  AlertTriangle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Archive,
  User,
  Wallet,
} from './OrganicIcons';
import { DatePickerModal } from './DatePickerModal';
import { UsernameSearchResults, useDebouncedUsernameSearch } from './UsernameSearchBox';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (data: {
    personName: string;
    linkedUsername?: string;
    amount: number;
    type: LoanType;
    currency: CurrencyCode;
    dueDate?: string;
    phone?: string;
    notes?: string;
    saveToArchive?: boolean;
  }) => void;
  translations: Translations;
  defaultCurrency?: CurrencyCode;
  language?: Language;
  initialSaveToArchive?: boolean;
  themeMode?: ThemeMode;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  excludeUid?: string | null;
  customRates?: Partial<Record<CurrencyCode, number>>;
  onOpenFxCalculator?: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onAddLoan,
  translations,
  defaultCurrency = 'USD',
  language = 'en',
  initialSaveToArchive = false,
  themeMode = 'obsidian_neon',
  friends = [],
  chatThreads = [],
  excludeUid = null,
  customRates,
}) => {
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  // Flexible default: Today's date without any forced 30-day default
  const getTodayDate = () => getTodayIsoDate();

  const [linkedUsername, setLinkedUsername] = useState('');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<LoanType>('they_owe_me');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [dueDate, setDueDate] = useState(getTodayDate());
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saveToArchive, setSaveToArchive] = useState(initialSaveToArchive);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPickedSearchMatch, setHasPickedSearchMatch] = useState(false);
  const submitTimerRef = useRef<number | null>(null);

  const activeSearchQuery = linkedUsername.trim() ? linkedUsername : personName;
  const searchState = useDebouncedUsernameSearch({
    query: activeSearchQuery,
    friends,
    chatThreads,
    excludeUid,
    enabled: isOpen && !hasPickedSearchMatch,
    minChars: 2,
    debounceMs: 300,
  });

  useEffect(() => {
    return () => {
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLinkedUsername('');
      setPersonName('');
      setAmount('');
      setCurrency(defaultCurrency);
      setDueDate(getTodayDate());
      setPhone('');
      setNotes('');
      setSaveToArchive(initialSaveToArchive);
      setError(null);
      setIsSubmitting(false);
      setHasPickedSearchMatch(false);
    }
  }, [isOpen, initialSaveToArchive, defaultCurrency]);

  useEffect(() => {
    if (!isOpen || isDatePickerOpen || isSubmitting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isDatePickerOpen, isSubmitting, onClose]);

  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es?: string) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? (es ?? en) : en;

  const handleTypeChange = (newType: LoanType) => {
    if (newType !== type) {
      setType(newType);
      setAnimKey((prev) => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const binding = buildDebtPersonBinding({
      linkedUsername,
      displayLabel: personName,
    });

    if (!binding.valid) {
      if (binding.reason === 'empty') {
        setError(
          pick(
            'Enter the recipient or debtor Full Name (or an optional @username).',
            'أدخل الاسم الكامل للشخص (أو @username اختيارياً).',
            'ناوی تەواوی کەسەکە بنووسە (یان @username بە دڵخوازانە).',
            'Kişinin Ad Soyadını (veya isteğe bağlı @kullanıcı_adını) girin.',
            'Saisissez le nom complet du contact (ou un @identifiant optionnel).',
            'Ingresa el nombre completo (o un @usuario opcional).'
          )
        );
      } else if (binding.reason === 'too_short') {
        setError(
          pick(
            'Optional @username must be at least 3 characters (letters, numbers, underscores), or leave it blank.',
            'اسم المستخدم الاختياري يجب أن لا يقل عن 3 أحرف، أو اتركه فارغاً.',
            'ئەگەر @username دەنووسێت دەبێت لانیکەم ٣ پیت بێت، یان بە بەتاڵی جێیبهێڵە.',
            'İsteğe bağlı kullanıcı adı en az 3 karakter olmalıdır veya boş bırakılabilir.',
            "Le @nom_utilisateur optionnel doit contenir au moins 3 caractères ou rester vide.",
            'El @usuario opcional debe tener al menos 3 caracteres o dejarse vacío.'
          )
        );
      } else {
        setError(
          pick(
            'Optional @username may only contain letters, numbers, and underscores (_), max 32 characters.',
            'اسم المستخدم الاختياري يسمح بالأحرف الإنجليزية والأرقام و(_) فقط بحد أقصى 32 حرفاً.',
            'تەنها پیت و ژمارە و (_) ڕێگەپێدراوە بۆ ناوی بەکارهێنەر (تا ٣٢ پیت).',
            'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir (en fazla 32).',
            "Seuls les lettres, chiffres et underscores (_) sont autorisés (32 max).",
            'El @usuario solo puede contener letras, números y guiones bajos (_).'
          )
        );
      }
      return;
    }

    const parsedAmount = roundCurrencyAmount(parseFloat(toWesternNumerals(amount)));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(translations.invalidAmountError || translations.requiredFieldError);
      return;
    }

    if (!saveToArchive && !dueDate) {
      setError(translations.dueDateRequired);
      return;
    }

    setIsSubmitting(true);
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      submitTimerRef.current = null;
      onAddLoan({
        personName: binding.personName,
        linkedUsername: binding.linkedUsername,
        amount: parsedAmount,
        type,
        currency,
        dueDate: saveToArchive ? undefined : dueDate,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        saveToArchive,
      });

      setLinkedUsername('');
      setPersonName('');
      setAmount('');
      setType('they_owe_me');
      setCurrency(defaultCurrency);
      setDueDate(getTodayDate());
      setPhone('');
      setNotes('');
      setSaveToArchive(initialSaveToArchive);
      setError(null);
      setIsSubmitting(false);
      onClose();
    }, 180);
  };

  const selectedCurrencyItem = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const activeUsdToIqd = getUsdToIqdRate(customRates);
  const parsedPreviewAmount = parseFloat(toWesternNumerals(amount));
  const addFxEquiv =
    Number.isFinite(parsedPreviewAmount) && parsedPreviewAmount > 0
      ? resolveRecordDualEquivalent(parsedPreviewAmount, currency, customRates)
      : null;

  // Calculate relative days for due date preview
  const getRelativeDaysNotice = (dateStr: string) => {
    if (!dateStr) return null;
    const dateOnly = dateStr.split(' ')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseIsoDateLocal(dateOnly);
    if (!target) return null;
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { isUrgent: true, text: pick('Due Today!', 'مستحق اليوم!', 'ئەمڕۆ بەسەردەچێت!', 'Bugün vade!', "Échéance aujourd'hui !", '¡Vence hoy!') };
    if (diffDays === 1) return { isUrgent: false, text: pick('Due tomorrow', 'مستحق غداً', 'سبەی بەسەردەچێت', 'Yarın vade', 'Échéance demain', 'Vence mañana') };
    if (diffDays > 1) {
      return {
        isUrgent: diffDays <= 3,
        text: pick(`In ${diffDays} days`, `خلال ${diffDays} يوماً`, `لە ماوەی ${diffDays} ڕۆژدا`, `${diffDays} gün içinde`, `Dans ${diffDays} jours`, `En ${diffDays} días`),
      };
    }
    return {
      isUrgent: true,
      text: pick(`${Math.abs(diffDays)}d overdue`, `متأخر منذ ${Math.abs(diffDays)} يوماً`, `دواکەوتووە بە ${Math.abs(diffDays)} ڕۆژ`, `${Math.abs(diffDays)} gün gecikmiş`, `${Math.abs(diffDays)} j de retard`, `Vencido hace ${Math.abs(diffDays)}d`),
    };
  };

  const relativeDueNotice = !saveToArchive ? getRelativeDaysNotice(dueDate) : null;

  const isTheyOweMe = type === 'they_owe_me';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="add-loan-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-loan-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 backdrop-blur-xl ${
              isLight ? 'bg-slate-900/45' : 'bg-black/85'
            }`}
          >
            <motion.div
              key="add-loan-card"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.85 }}
              style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
              className={`relative w-full max-w-lg rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col transition-colors duration-300 ${
                isLight
                  ? isTheyOweMe
                    ? isNordic
                      ? 'bg-[#F5FAFF] border-teal-500/40 text-slate-900 shadow-[0_20px_50px_-15px_rgba(15,118,110,0.2)]'
                      : 'bg-white border-emerald-500/40 text-slate-900 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.2)]'
                    : 'bg-white border-rose-500/40 text-slate-900 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.2)]'
                  : isVelvetPink
                  ? isTheyOweMe
                    ? 'bg-gradient-to-b from-emerald-500/[0.12] via-[#1F1224] to-[#170D1B] border-emerald-400/35 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)]'
                    : 'bg-gradient-to-b from-[#FF2E93]/[0.16] via-[#1F1224] to-[#170D1B] border-[#FF65B5]/40 shadow-[0_20px_50px_-12px_rgba(255,46,147,0.3)]'
                  : isTheyOweMe
                  ? 'bg-gradient-to-b from-emerald-500/[0.14] via-[#0D121F] to-[#0D121F] border-emerald-500/35 shadow-[0_16px_45px_-12px_rgba(16,185,129,0.25)]'
                  : 'bg-gradient-to-b from-rose-500/[0.14] via-[#0D121F] to-[#0D121F] border-rose-500/35 shadow-[0_16px_45px_-12px_rgba(244,63,94,0.25)]'
              }`}
            >
          {/* Top Header */}
          <div
            className={`flex items-center justify-between p-5 border-b shrink-0 ${
              isLight
                ? isNordic
                  ? 'border-sky-200 bg-[#E6F1FC]'
                  : 'border-slate-200 bg-slate-50'
                : isVelvetPink
                ? 'border-[#E8B4A0]/20 bg-[#170D1B]/85'
                : 'border-white/[0.07] bg-[#080B11]/75'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm transition-colors duration-300 ${
                  isTheyOweMe
                    ? isLight
                      ? 'bg-emerald-500/15 border-emerald-600/35 text-emerald-700'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : isLight
                    ? 'bg-rose-500/15 border-rose-600/35 text-rose-700'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/20 border-[#FF65B5]/45 text-[#FF65B5]'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}
              >
                {isTheyOweMe ? (
                  <ArrowDownLeft glow="they_owe" className="w-5 h-5" strokeWidth={1.65} />
                ) : (
                  <ArrowUpRight glow="i_owe" className="w-5 h-5" strokeWidth={1.65} />
                )}
              </div>
              <div>
                <h2
                  id="add-loan-title"
                  className={`text-base sm:text-lg font-bold font-pricedown tracking-wide flex items-center gap-2 flex-wrap ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  <span>{translations.addLoanModalTitle}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                      isTheyOweMe
                        ? isLight
                          ? 'bg-emerald-50 border-emerald-600/30 text-emerald-800'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : isLight
                        ? 'bg-rose-50 border-rose-600/30 text-rose-800'
                        : isVelvetPink
                        ? 'bg-[#FF2E93]/20 border-[#FF65B5]/40 text-[#FF85C5]'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="font-numeric font-black">{isTheyOweMe ? '+' : '-'}</span>
                    {isTheyOweMe ? (
                      <ArrowDownLeft glow="they_owe" className="w-3 h-3" strokeWidth={1.65} />
                    ) : (
                      <ArrowUpRight glow="i_owe" className="w-3 h-3" strokeWidth={1.65} />
                    )}
                    <span className="inline-emoji" aria-hidden="true">{isTheyOweMe ? '💰' : '💸'}</span>
                    <span>{isTheyOweMe ? translations.theyOweMe : translations.iOweThem}</span>
                  </span>
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {translations.addLoanModalSubtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`btn-premium smooth-interactive p-2 rounded-xl cursor-pointer active:scale-[0.98] ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" strokeWidth={1.65} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} autoComplete="off" className="p-5 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
            {/* 1. Mandatory Two Options Toggle */}
            <div>
              <label className={`block text-xs font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {translations.loanTypeLabel}
              </label>
              <div
                key={animKey}
                className="grid grid-cols-2 gap-3 animate-organic-enter"
              >
                {/* Option A: They Owe Me (+) */}
                <button
                  type="button"
                  onClick={() => handleTypeChange('they_owe_me')}
                  className={`btn-premium relative flex flex-col p-3.5 rounded-2xl border text-start transition-all cursor-pointer active:scale-[0.98] ${
                    isTheyOweMe
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-600/50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/15'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400'
                      : 'bg-[#080B11]/60 border-white/[0.06] text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                      <ArrowDownLeft glow="they_owe" className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} strokeWidth={1.65} />
                      <span className="inline-emoji" aria-hidden="true">💰</span>
                      <span>{translations.theyOweMe}</span>
                      <span className={`font-numeric font-black ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>(+)</span>
                    </div>
                    {isTheyOweMe && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] leading-tight ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {translations.theyOweMeDesc}
                  </span>
                </button>

                {/* Option B: I Owe Them (-) */}
                <button
                  type="button"
                  onClick={() => handleTypeChange('i_owe_them')}
                  className={`btn-premium smooth-interactive relative flex flex-col p-3.5 rounded-2xl border text-start cursor-pointer active:scale-[0.98] ${
                    !isTheyOweMe
                      ? isLight
                        ? 'bg-rose-50 border-rose-600/50 text-rose-900 ring-2 ring-rose-500/20 shadow-md'
                        : isVelvetPink
                        ? 'bg-[#FF2E93]/20 border-[#FF65B5]/60 text-[#FFD6EB] ring-2 ring-[#FF2E93]/30 shadow-lg shadow-[#FF2E93]/20'
                        : 'bg-rose-500/20 border-rose-500/60 text-rose-200 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/15'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400'
                      : isVelvetPink
                      ? 'bg-[#120B14]/70 border-[#E8B4A0]/15 text-slate-400 hover:border-[#FF65B5]/40'
                      : 'bg-[#080B11]/60 border-white/[0.06] text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                      <ArrowUpRight glow="i_owe" className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-700' : isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-400'}`} strokeWidth={1.65} />
                      <span className="inline-emoji" aria-hidden="true">💸</span>
                      <span>{translations.iOweThem}</span>
                      <span className={`font-numeric font-black ${isLight ? 'text-rose-700' : isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-300'}`}>(-)</span>
                    </div>
                    {!isTheyOweMe && (
                      <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center shadow ${isVelvetPink ? 'bg-[#FF2E93]' : 'bg-rose-500'}`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] leading-tight ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {translations.iOweThemDesc}
                  </span>
                </button>
              </div>
            </div>

            {/* Destination Toggle: Active Loan vs Add directly to Archive */}
            <div
              className={`p-2 rounded-2xl border flex items-center gap-1.5 ${
                isLight
                  ? isNordic
                    ? 'bg-[#E6F1FC] border-sky-200'
                    : 'bg-slate-100 border-slate-200'
                  : isVelvetPink
                  ? 'bg-[#120B14]/75 border-[#E8B4A0]/20'
                  : 'bg-[#080B11]/75 border-white/[0.06]'
              }`}
            >
              <button
                type="button"
                onClick={() => setSaveToArchive(false)}
                className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                  !saveToArchive
                    ? isLight
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pick('Active Loan', 'سجل نشط', 'قەرزی چالاک', 'Aktif Kayıt', 'Prêt actif', 'Préstamo Activo')}
              </button>
              <button
                type="button"
                onClick={() => setSaveToArchive(true)}
                className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                  saveToArchive
                    ? isLight
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-indigo-700'
                    : 'text-slate-400 hover:text-indigo-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5 shrink-0" strokeWidth={1.65} />
                <span>
                  {pick('Add to Archive', 'إضافة للأرشيف مباشرة', 'زیادکردن بۆ ئەرشیف', 'Arşive Ekle', 'Ajouter aux Archives', 'Añadir al Archivo')}
                </span>
              </button>
            </div>

            {/* 2. Contact Full Name (Primary) & Optional @username */}
            <div className="space-y-3">
              <div>
                <label htmlFor="add-person-name" className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {isTheyOweMe ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.65} />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.65} />
                  )}
                  <User className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
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
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-person-name"
                  data-testid="add-debt-display-label-input"
                  name="debt_display_label"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={personName}
                  onChange={(e) => {
                    setPersonName(e.target.value);
                    setHasPickedSearchMatch(false);
                    if (error) setError(null);
                  }}
                  placeholder={translations.namePlaceholder}
                  className={`w-full px-4 py-3 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none transition-all shadow-inner ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : isVelvetPink
                      ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white placeholder-pink-200/35'
                      : 'bg-[#080B11]/90 border-white/[0.08] text-white placeholder-slate-500'
                  }`}
                />
                <div className="mt-2">
                  <UsernameSearchResults
                    searchState={searchState}
                    language={language}
                    themeMode={themeMode}
                    actionLabel={pick('Select', 'اختيار', 'هەڵبژاردن', 'Seç', 'Choisir', 'Seleccionar')}
                    emptyHint={pick(
                      'No problem — just enter their Full Name to track this debt locally.',
                      'لا مشكلة — يكفي إدخال الاسم الكامل لحفظ الدين محلياً.',
                      'کێشە نییە — تەنها ناوی تەواوی بنووسە بۆ تۆمارکردنی قەرزەکە.',
                      'Sorun değil — bu borcu kaydetmek için Ad Soyad girmeniz yeterlidir.',
                      'Pas de souci — saisissez simplement son nom complet pour suivre ce prêt.',
                      'No pasa nada — ingresa su nombre completo para registrar esta deuda.'
                    )}
                    onSelectCandidate={(candidate) => {
                      setPersonName(candidate.displayName || (candidate.username ? `@${candidate.username}` : ''));
                      setLinkedUsername(candidate.username || '');
                      setHasPickedSearchMatch(true);
                      if (error) setError(null);
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="add-person-username" className={`block text-xs font-medium mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
                    id="add-person-username"
                    data-testid="add-debt-username-input"
                    name="debt_recipient_username"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={linkedUsername}
                    onChange={(e) => {
                      setLinkedUsername(e.target.value.replace(/^@+/, ''));
                      setHasPickedSearchMatch(false);
                      if (error) setError(null);
                    }}
                    placeholder={pick('Optional — e.g. lanya_2026', 'اختياري — مثال: lanya_2026', 'دڵخوازانە — نموونە lanya_2026', 'İsteğe bağlı — ör. lanya_2026', 'Optionnel — ex. lanya_2026', 'Opcional — ej. lanya_2026')}
                    className={`w-full ps-8 pe-4 py-2.5 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-sm font-mono outline-none transition-all shadow-inner ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        : isVelvetPink
                        ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white placeholder-pink-200/35'
                        : 'bg-[#080B11]/90 border-white/[0.08] text-white placeholder-slate-500'
                    }`}
                  />
                </div>
                <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {pick(
                    'Only add an @username if you want to link their cloud profile, FIB IBAN, or live chat.',
                    'أضف @username فقط إذا أردت ربط حسابه السحابي أو FIB أو المحادثة المباشرة.',
                    'تەنها کاتێک @username دابنێ کە دەتەوێت پرۆفایل یان چات یان FIB ببەستیتەوە.',
                    'Yalnızca bulut profili, FIB veya canlı sohbet bağlamak istiyorsanız @kullanıcı_adı ekleyin.',
                    'Ajoutez un @nom_utilisateur uniquement pour lier son profil cloud, FIB ou chat.',
                    'Agrega un @usuario solo si deseas vincular su perfil en la nube, FIB o chat.'
                  )}
                </p>
              </div>
            </div>

            {/* 3. Amount & Standard Currency Selector */}
            <div>
              <label htmlFor="add-amount" className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Wallet glow="accent" className={`w-3.5 h-3.5 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-500'}`} strokeWidth={1.65} />
                <span>{translations.amountLabel}</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="add-amount"
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    required
                    value={amount}
                    onChange={(e) => setAmount(sanitizeDecimalAmountInput(e.target.value))}
                    placeholder={translations.amountPlaceholder}
                    className={`w-full px-4 py-3 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none transition-all font-numeric tabular-nums shadow-inner ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        : isVelvetPink
                        ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white placeholder-pink-200/35'
                        : 'bg-[#080B11]/90 border-white/[0.08] text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                {/* Currency Dropdown */}
                <div className="relative min-w-[138px]">
                  <select
                    id="add-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className={`w-full px-3.5 py-3 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-semibold outline-none transition-all cursor-pointer shadow-inner ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : isVelvetPink
                        ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white'
                        : 'bg-[#080B11]/90 border-white/[0.08] text-white'
                    }`}
                  >
                    {CURRENCIES.map((c) => (
                      <option
                        key={c.code}
                        value={c.code}
                        className={isLight ? 'bg-white text-slate-900' : isVelvetPink ? 'bg-[#1F1224] text-white' : 'bg-[#0D121F] text-white'}
                      >
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {addFxEquiv ? (
                <div
                  data-testid="add-amount-fx-preview"
                  data-numeric="true"
                  dir="ltr"
                  className={`mt-2 flex items-center justify-between gap-2 text-xs font-numeric tabular-nums font-bold ${
                    isLight
                      ? 'text-emerald-700'
                      : isVelvetPink
                      ? 'text-[#FF85C5]'
                      : 'text-emerald-300'
                  }`}
                >
                  <span>
                    ≈ {formatCardDebt(addFxEquiv.convertedAmount, addFxEquiv.targetCurrency, language)}
                  </span>
                  <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    @ 1 USD = {activeUsdToIqd.toLocaleString('en-US')} IQD
                  </span>
                </div>
              ) : (
                <p className={`text-[11px] mt-1.5 flex items-center justify-between gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.65} />
                    <span>
                      {translations.currency}: {selectedCurrencyItem.code} —{' '}
                      {isKu
                        ? selectedCurrencyItem.nameKu || selectedCurrencyItem.nameEn
                        : isAr
                        ? selectedCurrencyItem.nameAr
                        : isTr
                        ? selectedCurrencyItem.nameTr || selectedCurrencyItem.nameEn
                        : isFr
                        ? selectedCurrencyItem.nameFr || selectedCurrencyItem.nameEn
                        : isEs
                        ? selectedCurrencyItem.nameEs || selectedCurrencyItem.nameEn
                        : selectedCurrencyItem.nameEn}
                    </span>
                  </span>
                  <span data-numeric="true" dir="ltr" className="text-[10px] font-numeric tabular-nums opacity-80 shrink-0">
                    $1 = {activeUsdToIqd.toLocaleString('en-US')} IQD
                  </span>
                </p>
              )}
            </div>

            {/* 4. Flexible Custom Due Date Trigger (Hidden when adding directly to Archive) */}
            {!saveToArchive && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="due-date-trigger" className={`block text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.65} />
                    <span>{translations.dueDateLabel}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {relativeDueNotice && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 font-numeric ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      {relativeDueNotice.isUrgent ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={1.65} />
                      ) : (
                        <Calendar className="w-3 h-3 shrink-0" strokeWidth={1.65} />
                      )}
                      <span>{relativeDueNotice.text}</span>
                    </span>
                  )}
                </div>

                <button
                  id="due-date-trigger"
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className={`btn-premium w-full px-4 py-3 rounded-2xl border text-start flex items-center justify-between transition-all cursor-pointer shadow-inner active:scale-[0.98] ${
                    isLight
                      ? 'bg-white border-slate-300 hover:border-emerald-500 text-slate-900'
                      : isVelvetPink
                      ? isTheyOweMe
                        ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 hover:border-emerald-500/50 text-white'
                        : 'bg-[#120B14]/88 border-[#E8B4A0]/22 hover:border-[#FF65B5]/60 text-white'
                      : isTheyOweMe
                      ? 'bg-[#080B11]/90 border-white/[0.08] hover:border-emerald-500/50 text-white'
                      : 'bg-[#080B11]/90 border-white/[0.08] hover:border-rose-500/50 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isTheyOweMe ? 'bg-emerald-500/15 text-emerald-500' : isVelvetPink ? 'bg-[#FF2E93]/18 text-[#FF65B5]' : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      <Calendar className="w-4 h-4" strokeWidth={1.65} />
                    </div>
                    <div>
                      <span className="text-sm font-numeric font-bold tracking-wide">
                        {dueDate ? dueDate : translations.selectDueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1.5 ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.65} />
                      <span>{pick('Choose Date', 'تعديل التاريخ والوقت', 'هەڵبژاردنی بەروار', 'Tarih Seç', 'Choisir la date', 'Elegir Fecha')}</span>
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* 5. Phone Number (Optional) */}
            <div>
              <label htmlFor="add-phone" className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{translations.phoneLabel}</span>
              </label>
              <input
                id="add-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={translations.phonePlaceholder}
                className={`w-full px-4 py-2.5 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none transition-all shadow-inner ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    : isVelvetPink
                    ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white placeholder-pink-200/35'
                    : 'bg-[#080B11]/90 border-white/[0.08] text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* 6. Notes / Purpose (Optional) */}
            <div>
              <label htmlFor="add-notes" className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{translations.notesLabel}</span>
              </label>
              <textarea
                id="add-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={translations.notesPlaceholder}
                className={`w-full px-4 py-2.5 rounded-2xl border focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none transition-all resize-none shadow-inner ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    : isVelvetPink
                    ? 'bg-[#120B14]/88 border-[#E8B4A0]/22 text-white placeholder-pink-200/35'
                    : 'bg-[#080B11]/90 border-white/[0.08] text-white placeholder-slate-500'
                }`}
              />
            </div>

            {error && (
              <div
                role="alert"
                data-testid="add-loan-error"
                className={`p-3.5 rounded-2xl text-xs font-semibold animate-organic-enter flex items-center gap-2 border ${
                  isLight
                    ? 'bg-rose-50 border-rose-500/40 text-rose-800'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.65} />
                <span>{error}</span>
              </div>
            )}

            {/* Footer buttons */}
            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-200' : isVelvetPink ? 'border-[#E8B4A0]/20' : 'border-white/[0.06]'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`btn-premium smooth-interactive px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium cursor-pointer active:scale-[0.98] ${
                  isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {translations.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-premium smooth-interactive flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg cursor-pointer active:scale-[0.98] ${
                  isTheyOweMe
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                    : isVelvetPink
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white shadow-[#FF2E93]/35'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-rose-500/25'
                }`}
              >
                <Check className="w-4 h-4" strokeWidth={2} />
                <span>{translations.saveLoan}</span>
              </button>
            </div>
          </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flexible Custom Date and Time Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate}
        onSelectDate={(newDate) => setDueDate(newDate)}
        loanType={type}
        language={language}
        themeMode={themeMode}
      />
    </>
  );
};
