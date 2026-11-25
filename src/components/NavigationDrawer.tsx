import React, { useEffect } from 'react';
import { Language, Translations, UserSettings, ThemeMode } from '../types';
import { isLightThemeMode, normalizeThemeMode, getUsdToIqdRate } from '../utils/loanLogic';
import {
  X,
  Archive,
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  Bot,
  BookOpen,
  Settings,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Palette,
  ShieldCheck,
  Bell,
  Cloud,
  UserCheck,
  User as UserIcon,
  Users,
  History,
} from './OrganicIcons';
import { CloudSyncStatus } from '../firebase';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  translations: Translations;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenAddModal: () => void;
  onOpenSettings: (tab?: 'general' | 'preferences' | 'ai' | 'guide' | 'history' | 'privacy') => void;
  onOpenTutorial: () => void;
  onOpenAiAssistant: () => void;
  onOpenNotificationCenter?: () => void;
  unreadNotifCount?: number;
  onFilterChange?: (filter: 'all' | 'they_owe_me' | 'i_owe_them') => void;
  onOpenArchive?: () => void;
  onOpenTransactions?: () => void;
  onOpenFriends?: () => void;
  friendsCount?: number;
  transactionsCount?: number;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onOpenFxCalculator?: () => void;
  authUserEmail?: string | null;
  cloudSyncStatus?: CloudSyncStatus;
  loansCount: {
    active: number;
    theyOwe: number;
    iOwe: number;
    archived: number;
  };
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  language,
  translations,
  settings,
  onUpdateSettings,
  onOpenAddModal,
  onOpenSettings,
  onOpenTutorial,
  onOpenAiAssistant,
  onOpenNotificationCenter,
  unreadNotifCount = 0,
  onFilterChange,
  onOpenArchive,
  onOpenTransactions,
  onOpenFriends,
  friendsCount = 0,
  transactionsCount = 0,
  onOpenAuth,
  onOpenProfile,
  onOpenFxCalculator,
  authUserEmail,
  cloudSyncStatus = 'local',
  loansCount,
}) => {
  const isRtl = language === 'ar' || language === 'ku';
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  // Close on Escape key press & prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    onClose();
    setTimeout(() => {
      callback();
    }, 180);
  };

  const activeTheme = normalizeThemeMode(settings.theme);
  const isLight = isLightThemeMode(activeTheme);
  const isNordic = activeTheme === 'nordic_frost';
  const isVelvetPink = activeTheme === 'velvet_pink';

  const themeOptions: {
    id: Extract<ThemeMode, 'obsidian_neon' | 'midnight_gold' | 'nordic_frost' | 'velvet_pink'>;
    labelEn: string;
    labelAr: string;
    labelKu: string;
    labelTr: string;
    labelFr: string;
    labelEs: string;
    color: string;
  }[] = [
    { id: 'obsidian_neon', labelEn: 'Obsidian Neon', labelAr: 'أوبسيديان نيون', labelKu: 'ئۆبسیدیان نیۆن', labelTr: 'Obsidian Neon', labelFr: 'Obsidienne', labelEs: 'Obsidian Neón', color: '#10B981' },
    { id: 'midnight_gold', labelEn: 'Midnight Slate', labelAr: 'أردوازي ليلي', labelKu: 'شەوی ئاڵتونی', labelTr: 'Gece Mavisi', labelFr: 'Ardoise Minuit', labelEs: 'Pizarra Medianoche', color: '#F59E0B' },
    { id: 'velvet_pink', labelEn: 'Velvet Pink', labelAr: 'مخملي وردي', labelKu: 'پەمەیی مەخمەلی', labelTr: 'Kadife Pembe', labelFr: 'Velours Rose', labelEs: 'Rosa Terciopelo', color: '#FF2E93' },
    { id: 'nordic_frost', labelEn: 'Nordic Frost', labelAr: 'نورديك أزرق', labelKu: 'نۆردیک', labelTr: 'Nordik Buz', labelFr: 'Givre Nordique', labelEs: 'Escarcha Nórdica', color: '#38BDF8' },
  ];

  const cardBgClass = isLight
    ? isNordic
      ? 'bg-white/85 border-sky-200/80 text-slate-900'
      : 'bg-slate-50 border-slate-200 text-slate-900'
    : isVelvetPink
    ? 'bg-[#1F1224]/75 border-[#E8B4A0]/20 text-[#FDF4FA]'
    : 'bg-white/[0.03] border-white/[0.08] text-slate-100';

  const actionRowClass = isLight
    ? isNordic
      ? 'bg-white/75 hover:bg-sky-50 border-sky-200/75 text-slate-800 hover:text-slate-950'
      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950'
    : isVelvetPink
    ? 'bg-[#1F1224]/70 hover:bg-[#2C1833] border-[#E8B4A0]/18 text-[#FCE7F3] hover:text-white'
    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.07] text-slate-200 hover:text-white';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={translations.navDrawerTitle}
    >
      {/* Blurred Backdrop Overlay */}
      <div
        className={`fixed inset-0 backdrop-blur-2xl transition-opacity duration-300 animate-in fade-in ${
          isLight ? 'bg-slate-900/40' : 'bg-[#04060A]/70'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 ${
          isRtl ? 'right-0' : 'left-0'
        } w-[88vw] max-w-sm sm:max-w-md backdrop-blur-3xl border-x shadow-[0_0_50px_rgba(0,0,0,0.45)] flex flex-col z-10 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] transform translate-x-0 ${
          isLight
            ? isNordic
              ? 'bg-[#F3F8FE]/97 text-slate-900 border-sky-200'
              : 'bg-white text-slate-900 border-slate-200'
            : isVelvetPink
            ? 'bg-[#120B14]/96 text-[#FDF4FA] border-[#E8B4A0]/20'
            : 'bg-[#0A0E18]/95 text-slate-100 border-white/[0.08]'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200/80 bg-[#EAF2FB]/80'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/15 bg-[#1F1224]/60'
              : 'border-white/[0.07] bg-white/[0.02]'
          }`}
        >
          <div>
            <h2 className={`text-base font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {translations.appName}
            </h2>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {translations.navDrawerSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={translations.closeDrawer}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer btn-premium ${
              isLight
                ? 'text-slate-600 hover:text-slate-950 bg-white hover:bg-slate-100 border-slate-200'
                : 'text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          {/* Cloud Account & Sync Card */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => handleAction(onOpenAuth)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-3 text-start transition-all cursor-pointer ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200'
                  : 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] border-emerald-500/25'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isLight
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {authUserEmail ? <UserCheck className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {authUserEmail ||
                      pick(
                        'Sign in with Google / Gmail',
                        'تسجيل الدخول عبر Google / Gmail',
                        'چوونەژوورەوە بە Google / Gmail',
                        'Google / Gmail ile Giriş Yap',
                        'Se connecter avec Google / Gmail',
                        'Iniciar sesión con Google / Gmail'
                      )}
                  </p>
                  <p className={`text-[10px] truncate ${isLight ? 'text-emerald-700' : 'text-emerald-300/90'}`}>
                    {authUserEmail
                      ? cloudSyncStatus === 'synced'
                        ? pick(
                            'Cloud backup active',
                            'النسخ الاحتياطي السحابي نشط',
                            'هەڵگرتنی هەوری چالاکە',
                            'Bulut yedekleme aktif',
                            'Sauvegarde cloud active',
                            'Copia de seguridad activa'
                          )
                        : `${pick('Sync status', 'حالة المزامنة', 'دۆخی هاوکاتکردن', 'Eşitleme durumu', 'Synchronisation', 'Estado de sincronización')}: ${cloudSyncStatus}`
                      : pick(
                          'Back up loans & settings across devices',
                          'اضغط لتفعيل النسخ الاحتياطي السحابي',
                          'بۆ پاراستنی داتاکانت لە هەوردا بچۆ ژوورەوە',
                          'Verilerinizi buluta yedekleyin',
                          'Sauvegardez vos prêts sur le cloud',
                          'Respalda préstamos y ajustes en la nube'
                        )}
                  </p>
                </div>
              </div>
              <ChevronIcon className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} />
            </button>
          )}

          {/* User Financial Snapshot & Profile Card */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${cardBgClass}`}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center shrink-0 font-bold text-xs ${
                    isLight
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  }`}
                >
                  {settings.profileAvatar ? (
                    <img
                      src={settings.profileAvatar}
                      alt={settings.profileName || 'Profile avatar'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : settings.profileName || settings.profileUsername ? (
                    <span>{(settings.profileName || settings.profileUsername || 'U').trim().slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className={`font-bold font-pricedown tracking-wide truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {settings.profileName ||
                      pick('Executive Portfolio', 'المحفظة المالية', 'جزدانەکەم', 'Portföyüm', 'Portefeuille', 'Portafolio')}
                  </span>
                  {settings.profileUsername && (
                    <span className={`text-[10px] font-mono truncate block ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      @{settings.profileUsername}
                    </span>
                  )}
                </div>
              </div>
              {onOpenProfile ? (
                <button
                  type="button"
                  data-testid="drawer-profile-btn"
                  onClick={() => handleAction(onOpenProfile)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border shrink-0 cursor-pointer ${
                    isLight
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-300 border-emerald-400/30'
                  }`}
                >
                  {isKu ? 'پرۆفایل' : isAr ? 'الملف' : isTr ? 'Profil' : isFr ? 'Profil' : isEs ? 'Editar Perfil' : 'Edit Profile'}
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span>
                    {authUserEmail
                      ? pick('Cloud Protected', 'محمي سحابياً', 'پارێزراو لە هەور', 'Bulut Korumalı', 'Protégé Cloud', 'Protegido en Nube')
                      : pick('Local Private', 'آمن ومحلي', 'پارێزراو لەم ئامێرە', 'Yerel ve Gizli', 'Local Privé', 'Privado Local')}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {translations.activeLoansCount}
                </p>
                <p data-numeric="true" className={`text-xl font-extrabold font-numeric mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {loansCount.active}
                </p>
              </div>
              <div className="text-end">
                <p className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isKu ? 'ئەرشیفکراوەکان' : isAr ? 'الأرشيف' : isTr ? 'Arşiv' : isFr ? 'Archives' : isEs ? 'Archivados' : 'Archived'}
                </p>
                <p data-numeric="true" className={`text-xl font-extrabold font-numeric mt-0.5 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                  {loansCount.archived}
                </p>
              </div>
            </div>

            {/* Quick Segmented Filter Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleAction(() => onFilterChange?.('they_owe_me'))}
                className={`p-2 rounded-xl border text-center transition-transform cursor-pointer active:scale-[0.98] ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border-emerald-500/25 text-emerald-300'
                }`}
              >
                <div data-numeric="true" className="font-extrabold font-numeric text-sm">+{loansCount.theyOwe}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400/90'}`}>
                  {pick('Receivable', 'تحصيل', 'لای ئەوان', 'Alacak', 'Créances', 'Por Cobrar')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onFilterChange?.('i_owe_them'))}
                className={`p-2 rounded-xl border text-center transition-transform cursor-pointer active:scale-[0.98] ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                    : 'bg-rose-500/[0.08] hover:bg-rose-500/[0.15] border-rose-500/25 text-rose-300'
                }`}
              >
                <div data-numeric="true" className="font-extrabold font-numeric text-sm">-{loansCount.iOwe}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-400/90'}`}>
                  {pick('Payable', 'التزام', 'قەرزەکانم', 'Borç', 'Dettes', 'Por Pagar')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onOpenArchive?.())}
                className={`p-2 rounded-xl border text-center transition-transform cursor-pointer active:scale-[0.98] ${
                  isLight
                    ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800'
                    : 'bg-indigo-500/[0.1] hover:bg-indigo-500/[0.2] border-indigo-400/30 text-indigo-300'
                }`}
              >
                <div data-numeric="true" className="font-extrabold font-numeric text-sm">{loansCount.archived}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-indigo-700' : 'text-indigo-300/90'}`}>
                  {isKu ? 'ئەرشیف' : isAr ? 'الأرشيف' : isTr ? 'Arşiv' : isFr ? 'Archive' : isEs ? 'Archivo' : 'Archive'}
                </div>
              </button>
            </div>
          </div>

          {/* Section: Primary Actions */}
          <div className="space-y-2">
            <p className={`text-[11px] font-bold uppercase tracking-wider px-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {pick('Primary Actions', 'العمليات السريعة', 'کردارە سەرەکییەکان', 'Hızlı İşlemler', 'Actions Principales', 'Acciones Principales')}
            </p>

            <button
              type="button"
              onClick={() => handleAction(() => onFilterChange?.('all'))}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold btn-premium group ${actionRowClass}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 group-hover:text-emerald-700'
                      : 'bg-white/[0.05] border-white/[0.08] text-slate-300 group-hover:text-emerald-400'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span>{translations.navDashboard}</span>
              </div>
              <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </button>

            {onOpenFriends && (
              <button
                type="button"
                data-testid="drawer-friends-btn"
                onClick={() => handleAction(onOpenFriends)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold btn-premium group ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                    : 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border-emerald-400/25 text-emerald-200 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                      isLight
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div>{isKu ? 'هاوڕێیان و چات' : isAr ? 'الأصدقاء والمحادثة' : isTr ? 'Arkadaşlar ve Sohbet' : isFr ? 'Amis & Chat' : isEs ? 'Amigos y Chat' : 'Friends & Chat'}</div>
                    <div className={`text-[10px] ${isLight ? 'text-emerald-700' : 'text-emerald-300/80'}`}>
                      {friendsCount} {isAr ? 'صديق' : isKu ? 'هاوڕێ' : isTr ? 'arkadaş' : isFr ? 'amis' : isEs ? 'amigos' : 'friends'}
                    </div>
                  </div>
                </div>
                <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} />
              </button>
            )}

            {onOpenTransactions && (
              <button
                type="button"
                onClick={() => handleAction(onOpenTransactions)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold btn-premium group ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900'
                    : 'bg-sky-500/[0.08] hover:bg-sky-500/[0.15] border-sky-400/25 text-sky-200 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                      isLight
                        ? 'bg-sky-100 border-sky-300 text-sky-700'
                        : 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                    }`}
                  >
                    <History className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div>{isKu ? 'تۆماری مامەڵەکان' : isAr ? 'سجل المعاملات' : isTr ? 'İşlem Defteri' : isFr ? 'Transactions' : isEs ? 'Transacciones' : 'Transactions'}</div>
                    <div className={`text-[10px] ${isLight ? 'text-sky-700' : 'text-sky-300/80'}`}>
                      {transactionsCount} {isAr ? 'حركة مسجلة' : isKu ? 'تۆمار' : isTr ? 'kayıt' : isFr ? 'écritures' : isEs ? 'registros' : 'entries'}
                    </div>
                  </div>
                </div>
                <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-sky-700' : 'text-sky-300'}`} />
              </button>
            )}

            {onOpenArchive && (
              <button
                type="button"
                onClick={() => handleAction(onOpenArchive)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold btn-premium group ${
                  isLight
                    ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                    : 'bg-indigo-500/[0.08] hover:bg-indigo-500/[0.15] border-indigo-400/25 text-indigo-200 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                      isLight
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div>{isKu ? 'ئەرشیف' : isAr ? 'الأرشيف' : isTr ? 'Arşiv' : isFr ? 'Archive' : isEs ? 'Archivo' : 'Archive'}</div>
                    <div className={`text-[10px] ${isLight ? 'text-indigo-700' : 'text-indigo-300/80'}`}>{loansCount.archived} {translations.statusSettled}</div>
                  </div>
                </div>
                <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction(onOpenAddModal)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all cursor-pointer text-xs font-bold shadow-lg shadow-emerald-500/20 btn-premium group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-700/30 flex items-center justify-center text-slate-950">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <span>{translations.navAddLoan}</span>
              </div>
              <ChevronIcon className="w-4 h-4 text-slate-950/70" />
            </button>
          </div>

          {/* Section: Intelligence & Tools */}
          <div className="space-y-2">
            <p className={`text-[11px] font-bold uppercase tracking-wider px-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {pick('Tools & Intelligence', 'الأدوات والمساعد الذكي', 'ئامرازەکان و یاریدەدەری زیرەک', 'Araçlar ve Akıllı Asistan', 'Outils & Intelligence', 'Herramientas e Inteligencia')}
            </p>

            {onOpenFxCalculator && (
              <button
                type="button"
                data-testid="drawer-fx-btn"
                onClick={() => handleAction(onOpenFxCalculator)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-medium btn-premium group ${actionRowClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${isVelvetPink ? 'bg-[#FF2E93]/15 border-[#FF65B5]/35 text-[#FF65B5]' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'}`}>
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      {pick('USD ↔ IQD Calculator', 'حاسبة الدولار والدينار', 'بژمێری دۆلار و دینار', 'USD ↔ IQD Hesaplayıcı', 'Calculatrice USD ↔ IQD', 'Calculadora USD ↔ IQD')}
                    </div>
                    <div data-numeric="true" dir="ltr" className={`text-[10px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      $1 = {Math.round(getUsdToIqdRate(settings.customRates)).toLocaleString('en-US')} IQD
                    </div>
                  </div>
                </div>
                <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </button>
            )}

            {onOpenNotificationCenter && (
              <button
                type="button"
                onClick={() => handleAction(onOpenNotificationCenter)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-medium btn-premium group ${actionRowClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <div className={`font-semibold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <span>{translations.notificationCenterTitle}</span>
                      {unreadNotifCount > 0 && (
                        <span data-numeric="true" className="font-numeric px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-bold text-[10px]">
                          {unreadNotifCount}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {pick('Due-date & overdue alerts', 'تنبيهات الاستحقاق والمتابعة', 'ئاگاداری کاتی دانەوە و دواکەوتن', 'Vade ve gecikme bildirimleri', 'Alertes d’échéance et suivi', 'Alertas de vencimiento y atrasos')}
                    </div>
                  </div>
                </div>
                <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction(onOpenAiAssistant)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-colors cursor-pointer text-xs font-medium group ${actionRowClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center text-emerald-500">
                  <Bot className="w-4 h-4 stroke-[1.65]" />
                </div>
                <div className="text-start">
                  <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{translations.navAiAssistant}</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick('Payoff strategies & receipts', 'مستشار سداد وقارئ الفواتير', 'ڕاوێژکاری دانەوە و خوێنەری پسوولە', 'Ödeme stratejileri ve makbuz', 'Stratégies & reçus', 'Estrategias de pago y recibos')}
                  </div>
                </div>
              </div>
              <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </button>

            <button
              type="button"
              onClick={() => handleAction(onOpenTutorial)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-medium btn-premium group ${actionRowClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/25 flex items-center justify-center text-purple-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{translations.navTutorial}</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick('Visual step-by-step walk-through', 'شرح مصور تفاعلي لكيفية الاستخدام', 'ڕێبەری هەنگاو بە هەنگاو', 'Adım adım kullanım rehberi', 'Guide visuel étape par étape', 'Guía visual paso a paso')}
                  </div>
                </div>
              </div>
              <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </button>

            <button
              type="button"
              onClick={() => handleAction(() => onOpenSettings('general'))}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-xs font-medium btn-premium group ${actionRowClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center text-emerald-500">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{translations.navExport}</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick('Official statements & Excel CSV', 'كشف حساب رسمي PDF أو جدول CSV', 'ڕاپۆرتی فەرمی PDF یان خشتەی CSV', 'Resmi ekstreler & Excel CSV', 'Relevés officiels & Excel CSV', 'Extractos oficiales y Excel CSV')}
                  </div>
                </div>
              </div>
              <ChevronIcon className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </button>
          </div>

          {/* Section: 5 Curated Themes & Palettes (No Language Selector here — Header Only) */}
          <div className={`p-4 rounded-3xl border space-y-3 ${cardBgClass}`}>
            <div className="flex items-center justify-between text-xs">
              <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <Palette glow="accent" className={`w-4 h-4 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-amber-500'}`} />
                <span>{translations.themeSectionTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAction(() => onOpenSettings('general'))}
                className={`text-[10px] hover:underline cursor-pointer font-semibold ${
                  isVelvetPink ? 'text-[#FF65B5]' : isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                {pick('Customize', 'تخصيص كامل', 'ڕێکخستن', 'Özelleştir', 'Personnaliser', 'Personalizar')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((th) => {
                const isSelected = activeTheme === th.id;
                const label = isKu
                  ? th.labelKu
                  : isAr
                  ? th.labelAr
                  : isTr
                  ? th.labelTr
                  : isFr
                  ? th.labelFr
                  : isEs
                  ? th.labelEs
                  : th.labelEn;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: th.id })}
                    className={`p-2.5 rounded-xl text-center border text-[11px] font-semibold smooth-interactive cursor-pointer btn-premium ${
                      isSelected
                        ? th.id === 'velvet_pink'
                          ? 'border-[#FF2E93] bg-[#FF2E93]/18 text-[#FFD6EB] ring-1 ring-[#FF65B5]/50 shadow-sm font-bold'
                          : th.id === 'midnight_gold'
                          ? 'border-amber-400 bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40 shadow-sm font-bold'
                          : th.id === 'nordic_frost'
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/45 shadow-sm font-bold'
                          : 'border-emerald-400 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm font-bold'
                        : isVelvetPink
                        ? 'border-[#E8B4A0]/18 text-pink-100/75 hover:border-[#E8B4A0]/40 bg-[#1F1224]/70'
                        : isNordic
                        ? 'border-sky-400/18 text-sky-100/75 hover:border-sky-400/40 bg-[#0D1A28]/75'
                        : 'border-white/[0.06] text-slate-400 hover:border-white/[0.15] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15" style={{ backgroundColor: th.color }} />
                      <span className="truncate">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          className={`p-5 border-t shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200/80 bg-[#EAF2FB]/80'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/15 bg-[#1F1224]/60'
              : 'border-white/[0.07] bg-white/[0.02]'
          }`}
        >
          <button
            type="button"
            onClick={() => handleAction(() => onOpenSettings('general'))}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer btn-premium ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                : isVelvetPink
                ? 'bg-[#1F1224] hover:bg-[#2C1833] text-white border-[#E8B4A0]/25'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/[0.1]'
            }`}
          >
            <Settings glow="accent" className={`w-4 h-4 ${isVelvetPink ? 'text-[#FF65B5]' : isLight ? 'text-slate-600' : 'text-slate-400'}`} />
            <span>{translations.navSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
