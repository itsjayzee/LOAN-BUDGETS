import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Edit3,
  Landmark,
  MessageSquare,
  Sparkles,
  User,
  Wallet,
  X,
} from './OrganicIcons';
import {
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  PublicUserProfile,
  ThemeMode,
  Translations,
} from '../types';
import {
  aggregateCounterpartyDebtProfile,
  formatFibIbanOrAccount,
  formatSignedCardDebt,
  getRemainingLoanBalance,
  isLightThemeMode,
  validateProfileFibAccount,
} from '../utils/loanLogic';
import { lookupUserByUsername } from '../firebase';

interface CounterpartyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLoan: Loan | null;
  allLoans: Loan[];
  friends: FriendRecord[];
  chatThreads: FriendChatThread[];
  language: Language;
  translations: Translations;
  themeMode?: ThemeMode;
  onChatNow: (loan: Loan) => void;
  onEditLoan?: (loan: Loan) => void;
}

const SPRING_TRANSITION = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
  mass: 0.85,
};

export const CounterpartyProfileModal: React.FC<CounterpartyProfileModalProps> = ({
  isOpen,
  onClose,
  targetLoan,
  allLoans,
  friends,
  chatThreads,
  language,
  translations,
  themeMode = 'obsidian_neon',
  onChatNow,
  onEditLoan,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isGold = themeMode === 'midnight_gold';
  const isVelvetPink = themeMode === 'velvet_pink';

  const [cloudProfile, setCloudProfile] = useState<PublicUserProfile | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [copiedFibIban, setCopiedFibIban] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const profile = useMemo(() => {
    if (!targetLoan) return null;
    return aggregateCounterpartyDebtProfile({
      loans: allLoans,
      fallbackLoan: targetLoan,
      friends,
      chatThreads,
    });
  }, [allLoans, targetLoan, friends, chatThreads]);

  useEffect(() => {
    if (!isOpen || !profile?.usernameLower || profile.usernameLower.length < 3) {
      setCloudProfile(null);
      setEnriching(false);
      return;
    }

    let cancelled = false;
    setEnriching(true);
    lookupUserByUsername(profile.usernameLower)
      .then((res) => {
        if (!cancelled) {
          setCloudProfile(res);
          setEnriching(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCloudProfile(null);
          setEnriching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, profile?.usernameLower]);

  useEffect(() => {
    if (!isOpen) return;
    setCopiedFibIban(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const resolvedDisplayName =
    cloudProfile?.displayName?.trim() ||
    profile?.displayName ||
    targetLoan?.personName ||
    'Contact';
  const resolvedAvatar = cloudProfile?.avatar || profile?.avatar;
  const resolvedBio = cloudProfile?.bio?.trim() || profile?.bio?.trim() || '';
  const resolvedUsername = cloudProfile?.username || profile?.username || '';
  const resolvedFibRaw = cloudProfile?.fibAccount || profile?.fibAccount || '';
  const resolvedFibCheck = validateProfileFibAccount(resolvedFibRaw);
  const resolvedFibNormalized = resolvedFibCheck.valid ? resolvedFibCheck.normalized : '';
  const resolvedFibFormatted = resolvedFibNormalized ? formatFibIbanOrAccount(resolvedFibNormalized) : '';

  const handleCopyCounterpartyIban = async () => {
    if (!resolvedFibNormalized) return;
    try {
      await navigator.clipboard.writeText(resolvedFibNormalized);
    } catch {
      const area = document.createElement('textarea');
      area.value = resolvedFibNormalized;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedFibIban(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopiedFibIban(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && targetLoan && profile && (
        <motion.div
          key="counterparty-profile-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="counterparty-profile-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl ${
            isLight ? 'bg-slate-900/45' : 'bg-black/80'
          }`}
        >
          <motion.div
            key="counterparty-profile-card"
            data-testid="counterparty-profile-overlay"
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={SPRING_TRANSITION}
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
            className={`relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col smooth-interactive ${
              isNordic
                ? 'bg-[#F5FAFF] border-sky-200 text-slate-900'
                : isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : isGold
                ? 'bg-[#081228] border-amber-400/25 text-slate-100'
                : isVelvetPink
                ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FFF5FA]'
                : 'bg-[#0D121F] border-white/[0.1] text-slate-100'
            }`}
          >
            {/* Accent Top Strip */}
            <div
              className={`h-1.5 w-full ${
                profile.currencySummaries[0]?.net !== undefined && profile.currencySummaries[0].net < 0
                  ? isVelvetPink
                    ? 'bg-gradient-to-r from-[#FF2E93] via-[#FF65B5] to-[#E8B4A0]'
                    : 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
              }`}
            />

            {/* Header */}
            <div
              className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${
                isLight ? 'border-slate-200/80' : isVelvetPink ? 'border-[#E8B4A0]/20 bg-[#170D1B]/75' : 'border-white/[0.07]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User
                  glow="accent"
                  className={`w-4 h-4 shrink-0 ${
                    isGold ? 'text-amber-400' : isVelvetPink ? 'text-[#FF65B5]' : isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                  strokeWidth={1.8}
                />
                <span
                  id="counterparty-profile-title"
                  className={`text-xs font-bold font-pricedown uppercase tracking-wider truncate ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {pick(
                    'Connected Profile',
                    'الملف الشخصي المرتبط',
                    'پرۆفایلی پەیوەندیدار',
                    'Bağlı Profil',
                    'Profil Connecté',
                    'Perfil Conectado'
                  )}
                </span>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                aria-label="Close"
                className={`p-2 rounded-xl cursor-pointer transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" strokeWidth={1.85} />
              </motion.button>
            </div>

            {/* Scrollable Profile Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
              {/* Identity Header: Avatar + Name + @username + Bio */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-lg shadow-lg ${
                      isGold
                        ? 'border-amber-400/45 bg-amber-500/15 text-amber-300'
                        : isLight
                        ? 'border-emerald-500/35 bg-emerald-50 text-emerald-800'
                        : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={resolvedDisplayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      resolvedDisplayName.replace(/^@+/, '').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  {(cloudProfile || profile.friendUid) && (
                    <span
                      title={pick('Verified @username', 'حساب موثق', 'هەژماری پشتڕاستکراو', 'Kayıtlı Kullanıcı', 'Compte vérifié', 'Usuario verificado')}
                      className={`absolute -bottom-1 -end-1 w-5 h-5 rounded-lg border flex items-center justify-center shadow ${
                        isLight
                          ? 'bg-emerald-600 border-white text-white'
                          : 'bg-emerald-500 border-[#0D121F] text-slate-950'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" strokeWidth={2.2} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3
                    data-testid="counterparty-profile-display-name"
                    dir="auto"
                    className={`text-lg font-black font-pricedown tracking-wide leading-snug truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {resolvedDisplayName}
                  </h3>

                  {resolvedUsername && (
                    <p
                      data-testid="counterparty-profile-username"
                      dir="ltr"
                      className={`text-xs font-mono font-bold truncate ${
                        isGold ? 'text-amber-400' : isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    >
                      @{resolvedUsername}
                    </p>
                  )}

                  <p
                    data-testid="counterparty-profile-bio"
                    dir="auto"
                    className={`text-xs leading-relaxed pt-1 ${
                      resolvedBio
                        ? isLight
                          ? 'text-slate-700'
                          : 'text-slate-300'
                        : isLight
                        ? 'text-slate-400 italic'
                        : 'text-slate-500 italic'
                    }`}
                  >
                    {enriching && !resolvedBio
                      ? pick('Syncing profile details...', 'جاري مزامنة الملف الشخصي...', 'هاوکاتکردنی زانیاری پرۆفایل...', 'Profil senkronize ediliyor...', 'Synchronisation...', 'Sincronizando perfil...')
                      : resolvedBio ||
                        pick(
                          'No bio added yet',
                          'لا توجد نبذة شخصية بعد',
                          'هێشتا هیچ بایۆیەک نەنووسراوە',
                          'Henüz biyografi eklenmemiş',
                          'Aucune biographie ajoutée',
                          'Sin biografía añadida'
                        )}
                  </p>
                </div>
              </div>

              {/* Verified First Iraqi Bank (FIB) Account / IBAN */}
              {resolvedFibFormatted && (
                <div
                  data-testid="counterparty-fib-iban-card"
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-[#062238]/75 border-emerald-400/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-emerald-800' : 'text-emerald-300'
                    }`}>
                      <Landmark className="w-3.5 h-3.5 shrink-0" />
                      <span>{pick('FIB IBAN / Account', 'آيبان مصرف FIB', 'IBANـی بانکی FIB', 'FIB IBAN', 'IBAN FIB', 'IBAN / Cuenta FIB')}</span>
                    </span>
                    <p
                      dir="ltr"
                      data-testid="counterparty-fib-iban-value"
                      className={`text-xs sm:text-sm font-mono font-bold tabular-nums truncate mt-0.5 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {resolvedFibFormatted}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="counterparty-copy-iban-btn"
                    onClick={handleCopyCounterpartyIban}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 shrink-0 cursor-pointer smooth-interactive ${
                      copiedFibIban
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : isLight
                        ? 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35 hover:bg-emerald-500/25'
                    }`}
                  >
                    {copiedFibIban ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>
                      {copiedFibIban
                        ? pick('Copied!', 'تم النسخ!', 'کۆپیکرا!', 'Kopyalandı!', 'Copié !', '¡Copiado!')
                        : pick('Copy IBAN', 'نسخ IBAN', 'کۆپی IBAN', 'IBAN Kopyala', 'Copier IBAN', 'Copiar IBAN')}
                    </span>
                  </button>
                </div>
              )}

              {/* Total Linked Active Debt Balance Card */}
              <div
                data-testid="counterparty-profile-balance-card"
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    <Wallet glow="accent" className="w-3.5 h-3.5" strokeWidth={1.7} />
                    <span>
                      {pick(
                        'Total Linked Active Balance',
                        'إجمالي الرصيد النشط المرتبط',
                        'کۆی باڵانسی چالاکی پەیوەندیدار',
                        'Toplam Bağlı Aktif Bakiye',
                        'Solde Actif Total Lié',
                        'Saldo Activo Total Vinculado'
                      )}
                    </span>
                  </span>
                  <span
                    data-numeric="true"
                    className={`text-[11px] font-numeric tabular-nums font-semibold ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {profile.activeCount}{' '}
                    {pick('active', 'نشط', 'چالاک', 'aktif', 'actif', 'activos')}
                    {profile.settledCount > 0 && (
                      <>
                        {' · '}
                        {profile.settledCount}{' '}
                        {pick('archived', 'مؤرشف', 'ئەرشیفکراو', 'arşivli', 'archivé', 'archivados')}
                      </>
                    )}
                  </span>
                </div>

                {profile.currencySummaries.length === 0 ? (
                  <p
                    className={`text-sm font-bold font-numeric tabular-nums ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {pick(
                      'All linked debts are settled',
                      'جميع الديون المرتبطة مسددة',
                      'هەموو قەرزەکان پاکتاوکراون',
                      'Tüm bağlı borçlar kapatıldı',
                      'Toutes les dettes liées sont réglées',
                      'Todas las deudas vinculadas están saldadas'
                    )}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.currencySummaries.map((summary) => {
                      const isPositiveNet = summary.net >= 0;
                      const direction = isPositiveNet ? 'they_owe_me' : 'i_owe_them';
                      return (
                        <div
                          key={summary.currency}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span
                            className={`text-xs font-semibold ${
                              isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {isPositiveNet
                              ? translations.theyOweMe
                              : translations.iOweThem}{' '}
                            ({summary.currency})
                          </span>
                          <span
                            data-testid={`counterparty-net-${summary.currency}`}
                            data-numeric="true"
                            dir="ltr"
                            className={`text-xl font-black font-numeric tabular-nums ${
                              isPositiveNet ? 'metallic-emerald' : 'metallic-rose'
                            }`}
                          >
                            {formatSignedCardDebt(
                              Math.abs(summary.net),
                              summary.currency,
                              language,
                              direction
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Linked Debts Breakdown */}
              {profile.activeLoans.length > 0 && (
                <div className="space-y-2">
                  <h4
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {pick(
                      'Active Records',
                      'السجلات النشطة',
                      'تۆمارە چالاکەکان',
                      'Aktif Kayıtlar',
                      'Prêts Actifs',
                      'Registros Activos'
                    )}
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto overscroll-contain pe-0.5">
                    {profile.activeLoans.map((item) => {
                      const rem = getRemainingLoanBalance(item);
                      const isPos = item.type === 'they_owe_me';
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (onEditLoan) {
                              onClose();
                              onEditLoan(item);
                            }
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-start transition-colors cursor-pointer ${
                            isLight
                              ? 'bg-slate-50/90 hover:bg-slate-100 border-slate-200'
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isPos ? (
                              <ArrowDownLeft
                                glow="they_owe"
                                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                                strokeWidth={1.85}
                              />
                            ) : (
                              <ArrowUpRight
                                glow="i_owe"
                                className={`w-3.5 h-3.5 shrink-0 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-500'}`}
                                strokeWidth={1.85}
                              />
                            )}
                            <span
                              className={`text-xs truncate ${
                                isLight ? 'text-slate-700' : 'text-slate-300'
                              }`}
                            >
                              {item.notes ||
                                (item.dueDate
                                  ? `${translations.dueOn}: ${item.dueDate}`
                                  : `${translations.createdOn}: ${item.createdAt}`)}
                            </span>
                          </div>
                          <span
                            data-numeric="true"
                            dir="ltr"
                            className={`text-xs font-bold font-numeric tabular-nums shrink-0 ${
                              isPos
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-emerald-300'
                                : isLight
                                ? 'text-rose-700'
                                : 'text-rose-300'
                            }`}
                          >
                            {formatSignedCardDebt(
                              rem,
                              item.currency || 'USD',
                              language,
                              item.type
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div
              className={`px-5 py-4 border-t flex items-center gap-2.5 shrink-0 ${
                isLight
                  ? 'border-slate-200 bg-slate-50/80'
                  : isVelvetPink
                  ? 'border-[#E8B4A0]/20 bg-[#170D1B]/85'
                  : 'border-white/[0.07] bg-[#080B11]/75'
              }`}
            >
              {onEditLoan && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onClose();
                    onEditLoan(targetLoan);
                  }}
                  className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer smooth-interactive ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : isVelvetPink
                      ? 'bg-[#120B14]/70 hover:bg-[#FF2E93]/15 text-slate-200 border-[#E8B4A0]/22'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{translations.editLoan}</span>
                </motion.button>
              )}

              <motion.button
                type="button"
                data-testid="profile-overlay-chat-now-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const chatTarget = profile.primaryLoan || targetLoan;
                  onClose();
                  onChatNow(chatTarget);
                }}
                className={`flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer smooth-interactive ${
                  isGold
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 shadow-amber-500/25'
                    : isNordic
                    ? 'bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white shadow-sky-500/25'
                    : isVelvetPink
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white shadow-[#FF2E93]/35'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                }`}
              >
                <MessageSquare glow="accent" className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>
                  {pick('Chat Now', 'محادثة الآن', 'ئێستا چات بکە', 'Şimdi Sohbet Et', 'Discuter maintenant', 'Chatear Ahora')}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
