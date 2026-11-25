import React, { useEffect, useRef, useState } from 'react';
import {
  ChatSession,
  Language,
  ThemeMode,
  Translations,
  UserSettings,
} from '../types';
import {
  calculateTotals,
  exportAppDataJson,
  exportLoansToCsv,
  exportLoansToPdfPrint,
  getTodayIsoDate,
  importAppDataJson,
  isLightThemeMode,
  normalizeThemeMode,
} from '../utils/loanLogic';
import {
  AlertOctagon,
  ArrowLeftRight,
  Bell,
  Check,
  Cloud,
  Download,
  FileSpreadsheet,
  Palette,
  Printer,
  RefreshCw,
  Settings,
  Upload,
  UserCheck,
  User as UserIcon,
  Volume2,
  X,
} from './OrganicIcons';
import { CloudSyncStatus } from '../firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  chatSessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  onClearAllData: () => void;
  onImportBackup: (data: { loans?: any[]; settings?: Partial<UserSettings>; transactions?: any[] }) => void;
  allLoans: any[];
  allTransactions?: any[];
  translations: Translations;
  onOpenAiAssistant?: () => void;
  onOpenTutorial?: () => void;
  onOpenAddModal?: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onOpenFxCalculator?: () => void;
  authUserEmail?: string | null;
  cloudSyncStatus?: CloudSyncStatus;
  onManualSync?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllData,
  onImportBackup,
  allLoans,
  allTransactions,
  translations,
  onOpenAuth,
  onOpenProfile,
  onOpenFxCalculator,
  authUserEmail,
  cloudSyncStatus = 'local',
  onManualSync,
}) => {
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const lang: Language = settings.language;
  const isKu = lang === 'ku';
  const isAr = lang === 'ar';
  const isTr = lang === 'tr';
  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const isRtl = isKu || isAr;

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es?: string) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? (es ?? en) : en;

  const activeTheme = normalizeThemeMode(settings.theme);
  const isGoldTheme = activeTheme === 'midnight_gold';
  const isVelvetPink = activeTheme === 'velvet_pink';
  const isLight = isLightThemeMode(activeTheme);
  const isNordic = activeTheme === 'nordic_frost';

  const flashNotice = (text: string, type: 'success' | 'error' = 'success') => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setStatusNotice({ text, type });
    noticeTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
      noticeTimerRef.current = null;
    }, 2400);
  };

  const handleExportBackup = () => {
    const jsonStr = exportAppDataJson(allLoans, settings, allTransactions);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoanBudget_Backup_${getTodayIsoDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imported = importAppDataJson(event.target?.result as string);
      if (imported) {
        onImportBackup(imported);
        flashNotice(translations.settingsSaved);
      } else {
        flashNotice(
          pick(
            'Invalid backup JSON file.',
            'ملف النسخة الاحتياطية غير صالح.',
            'پەڕگەی یەدەگ دروست نییە.',
            'Geçersiz yedek JSON dosyası.',
            'Fichier JSON de sauvegarde invalide.',
            'Archivo JSON de respaldo no válido.'
          ),
          'error'
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const themeCards: {
    id: Extract<ThemeMode, 'obsidian_neon' | 'velvet_pink' | 'midnight_gold' | 'nordic_frost'>;
    title: string;
    swatches: [string, string, string];
  }[] = [
    {
      id: 'obsidian_neon',
      title: pick('Obsidian Neon', 'أوبسيديان نيون', 'ئۆبسیدیان نیۆن', 'Obsidian Neon', 'Obsidienne Néon', 'Obsidiana Neón'),
      swatches: ['#07090E', '#10B981', '#F43F5E'],
    },
    {
      id: 'velvet_pink',
      title: pick('Velvet Pink', 'مخملي وردي', 'پەمەیی مەخمەلی', 'Kadife Pembe', 'Velours Rose', 'Rosa Terciopelo'),
      swatches: ['#120B14', '#FF2E93', '#E8B4A0'],
    },
    {
      id: 'midnight_gold',
      title: pick('Midnight Slate', 'أردوازي ليلي', 'شەوی ئاڵتونی', 'Gece Mavisi', 'Ardoise Minuit', 'Pizarra Medianoche'),
      swatches: ['#060D1E', '#F59E0B', '#38BDF8'],
    },
    {
      id: 'nordic_frost',
      title: pick('Nordic Frost', 'نورديك أزرق', 'نۆردیک', 'Nordik Buz', 'Givre Nordique', 'Escarcha Nórdica'),
      swatches: ['#08111B', '#38BDF8', '#7DD3FC'],
    },
  ];

  const getThemeSelectedClasses = (id: string) => {
    if (id === 'velvet_pink') {
      return 'bg-[#FF2E93]/18 border-[#FF2E93] text-[#FFD6EB] ring-1 ring-[#FF65B5]/60';
    }
    if (id === 'midnight_gold') {
      return 'bg-amber-500/18 border-amber-400 text-amber-100 ring-1 ring-amber-400/50';
    }
    if (id === 'nordic_frost') {
      return 'bg-sky-500/20 border-sky-400 text-sky-100 ring-1 ring-sky-400/50';
    }
    return 'bg-emerald-500/18 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400/50';
  };

  const sectionBoxClass = isVelvetPink
    ? 'bg-[#281630]/85 border-[#E8B4A0]/20'
    : isNordic
    ? 'bg-[#0E1C2B]/85 border-sky-400/20'
    : 'bg-slate-900/75 border-white/[0.08]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dashboard-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/45' : 'bg-black/80'
      }`}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        data-testid="settings-modal-panel"
        className={`relative w-full max-w-md rounded-t-3xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[88dvh] flex flex-col smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-[#F4F8FD]/98 border-sky-200 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FDF4FA]'
            : 'bg-[#0D121F]/95 border-white/[0.1] text-slate-100'
        }`}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/18 bg-[#170D1B]/90'
              : 'border-white/[0.07] bg-[#080B11]/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isVelvetPink
                  ? 'bg-[#FF2E93]/15 border-[#FF65B5]/35'
                  : isGoldTheme
                  ? 'bg-amber-500/15 border-amber-400/35'
                  : isNordic
                  ? 'bg-sky-500/15 border-sky-400/35'
                  : 'bg-emerald-500/15 border-emerald-500/30'
              }`}
            >
              <Settings
                glow="accent"
                className={`w-4 h-4 ${
                  isVelvetPink
                    ? 'text-[#FF65B5]'
                    : isGoldTheme
                    ? 'text-amber-300'
                    : isNordic
                    ? 'text-sky-400'
                    : 'text-emerald-400'
                }`}
              />
            </div>
            <h2 id="settings-dashboard-title" className={`text-base font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {translations.settingsTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={pick('Close Settings', 'إغلاق الإعدادات', 'داخستنی ڕێکخستنەکان', 'Ayarları Kapat', 'Fermer les paramètres', 'Cerrar ajustes')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-200/70 hover:bg-slate-300/80 text-slate-700'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean, Uncluttered Flat Settings Body (No Default Currency, No Nested Accordions) */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 scrollbar-thin">
          {statusNotice && (
            <div
              role="status"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                statusNotice.type === 'error'
                  ? isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-rose-500/15 border-rose-500/35 text-rose-200'
                  : isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusNotice.text}</span>
            </div>
          )}

          {/* 1. 1-Tap 4-Theme Selector */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Palette glow="accent" className={`w-3.5 h-3.5 ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-amber-400'}`} />
              <span>{pick('Theme', 'المظهر', 'ڕووکار', 'Tema', 'Thème', 'Tema')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {themeCards.map((themeItem) => {
                const isSelected = activeTheme === themeItem.id;
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    data-testid={`settings-theme-${themeItem.id}`}
                    onClick={() => {
                      onUpdateSettings({ theme: themeItem.id });
                      flashNotice(translations.settingsSaved);
                    }}
                    className={`px-3 py-2.5 rounded-2xl border text-start smooth-interactive active:scale-[0.98] cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? getThemeSelectedClasses(themeItem.id)
                        : isVelvetPink
                        ? 'bg-[#281630]/80 border-[#E8B4A0]/18 text-pink-100/85 hover:border-[#E8B4A0]/45'
                        : isNordic
                        ? 'bg-[#0C1826]/85 border-sky-400/18 text-sky-100/85 hover:border-sky-400/45'
                        : 'bg-slate-900/80 border-white/[0.08] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center -space-x-1 shrink-0">
                        {themeItem.swatches.slice(0, 2).map((hex) => (
                          <span
                            key={hex}
                            className="w-3 h-3 rounded-full border border-white/25"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold truncate text-white">
                        {themeItem.title}
                      </span>
                    </div>
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 ${
                          themeItem.id === 'velvet_pink'
                            ? 'text-[#FF65B5]'
                            : themeItem.id === 'midnight_gold'
                            ? 'text-amber-400'
                            : themeItem.id === 'nordic_frost'
                            ? 'text-sky-400'
                            : 'text-emerald-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Profile & Cloud Sync Row */}
          <section className={`p-3 rounded-2xl border space-y-2.5 smooth-interactive ${sectionBoxClass}`}>
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center shrink-0 font-bold text-xs ${
                    isVelvetPink
                      ? 'bg-[#FF2E93]/18 border-[#FF65B5]/45 text-[#FFD6EB]'
                      : isGoldTheme
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                      : isNordic
                      ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                      : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
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
                  <p className="text-xs font-bold font-pricedown tracking-wide truncate text-white">
                    {settings.profileName || pick('Profile', 'الملف الشخصي', 'پرۆفایل', 'Profil', 'Profil', 'Perfil')}
                  </p>
                  <p className={`text-[11px] font-mono truncate ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {settings.profileUsername ? `@${settings.profileUsername}` : pick('Optional @username', 'اسم مستخدم اختياري', 'ناوی دڵخوازانە', 'İsteğe bağlı @kullanıcı', '@identifiant optionnel', '@usuario opcional')}
                  </p>
                </div>
              </div>

              {onOpenProfile && (
                <button
                  type="button"
                  data-testid="open-profile-settings-btn"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 smooth-interactive ${
                    isVelvetPink
                      ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] text-white'
                      : isGoldTheme
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : isNordic
                      ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {pick('Edit Profile', 'تعديل', 'دەستکاری', 'Düzenle', 'Modifier', 'Editar')}
                </button>
              )}
            </div>

            {onOpenAuth && (
              <div className={`pt-2 border-t flex items-center justify-between gap-2 ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {authUserEmail ? (
                    <UserCheck glow="accent" className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Cloud glow="accent" className={`w-4 h-4 shrink-0 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-400'}`} />
                  )}
                  <span className={`text-[11px] truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {authUserEmail ? `${authUserEmail} (${cloudSyncStatus})` : pick('Cloud Sync (Google)', 'مزامنة سحابية', 'هاوکاتکردنی هەور', 'Bulut Eşitleme', 'Synchro Cloud', 'Nube (Google)')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {authUserEmail && onManualSync && (
                    <button
                      type="button"
                      onClick={onManualSync}
                      aria-label="Sync Now"
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        isLight ? 'bg-slate-200 hover:bg-slate-300 text-emerald-700' : 'bg-white/[0.06] hover:bg-white/[0.12] text-emerald-300'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.12] text-slate-200'
                    }`}
                  >
                    {authUserEmail
                      ? pick('Manage', 'إدارة', 'بەڕێوەبردن', 'Yönet', 'Gérer', 'Gestionar')
                      : pick('Sign in', 'دخول', 'چوونەژوورەوە', 'Giriş', 'Connexion', 'Entrar')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 3. Flat Compact Display & Alert Toggles */}
          <section className={`p-3 rounded-2xl border space-y-2.5 smooth-interactive ${sectionBoxClass}`}>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                data-testid="settings-dual-currency-toggle"
                onClick={() => {
                  onUpdateSettings({ showDualCurrency: settings.showDualCurrency === false });
                  flashNotice(translations.settingsSaved);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                  settings.showDualCurrency !== false
                    ? isVelvetPink
                      ? 'bg-[#FF2E93]/18 border-[#FF65B5]/45 text-[#FFD6EB]'
                      : isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>{pick('Dual Currency:', 'العملتين:', 'دوو دراو:', 'Çift Kur:', 'Double devise :', 'Doble moneda:')}</span>
                <span className="font-bold">{settings.showDualCurrency !== false ? 'ON' : 'OFF'}</span>
              </button>

              <div className={`inline-flex rounded-xl border overflow-hidden ${isLight ? 'border-slate-300' : 'border-white/[0.1]'}`} dir="ltr">
                <button
                  type="button"
                  data-testid="settings-dual-primary-iqd"
                  onClick={() => {
                    onUpdateSettings({ dualPrimaryCurrency: 'IQD' });
                    flashNotice(translations.settingsSaved);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-numeric font-bold cursor-pointer ${
                    (settings.dualPrimaryCurrency || 'IQD') === 'IQD'
                      ? isVelvetPink
                        ? 'bg-[#FF2E93] text-white'
                        : isLight
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-500 text-slate-950'
                      : isLight
                      ? 'bg-white text-slate-600'
                      : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  IQD
                </button>
                <button
                  type="button"
                  data-testid="settings-dual-primary-usd"
                  onClick={() => {
                    onUpdateSettings({ dualPrimaryCurrency: 'USD' });
                    flashNotice(translations.settingsSaved);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-numeric font-bold cursor-pointer ${
                    settings.dualPrimaryCurrency === 'USD'
                      ? isVelvetPink
                        ? 'bg-[#FF2E93] text-white'
                        : isLight
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-500 text-slate-950'
                      : isLight
                      ? 'bg-white text-slate-600'
                      : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  settings.soundEffectsEnabled
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isVelvetPink
                      ? 'bg-[#FF2E93]/18 border-[#FF65B5]/45 text-[#FFD6EB]'
                      : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{pick('Sounds', 'الأصوات', 'دەنگ', 'Sesler', 'Sons', 'Sonidos')}</span>
                </span>
                <span>{settings.soundEffectsEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ pushNotificationsEnabled: !settings.pushNotificationsEnabled })}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  settings.pushNotificationsEnabled
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isVelvetPink
                      ? 'bg-[#FF2E93]/18 border-[#FF65B5]/45 text-[#FFD6EB]'
                      : 'bg-emerald-500/12 border-emerald-500/35 text-emerald-200'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>{pick('Alerts', 'التنبيهات', 'ئاگاداری', 'Uyarılar', 'Alertes', 'Alertas')}</span>
                </span>
                <span>{settings.pushNotificationsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {onOpenFxCalculator && (
              <button
                type="button"
                data-testid="settings-open-fx-btn"
                onClick={() => {
                  onClose();
                  onOpenFxCalculator();
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border flex items-center justify-center gap-1.5 transition-colors ${
                  isVelvetPink
                    ? 'bg-[#FF2E93]/14 border-[#FF65B5]/35 text-[#FFD6EB] hover:bg-[#FF2E93]/24'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-emerald-300'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{pick('FX Converter', 'حاسبة الصرف', 'گۆڕینەوەی دراو', 'Döviz Çevirici', 'Convertisseur FX', 'Conversor FX')}</span>
              </button>
            )}
          </section>

          {/* 4. Flat Export, Import & Reset */}
          <section className={`p-3 rounded-2xl border space-y-2.5 smooth-interactive ${sectionBoxClass}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => exportLoansToCsv(allLoans, settings.language)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-emerald-300'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 stroke-[1.65]" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportLoansToPdfPrint(allLoans, calculateTotals(allLoans, settings.currency), settings)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-sky-300'
                }`}
              >
                <Printer className="w-3.5 h-3.5 stroke-[1.65]" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{pick('Import', 'استيراد', 'هێنان', 'İçe Aktar', 'Importer', 'Importar')}</span>
              </button>
            </div>

            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className={`text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    isLight ? 'text-rose-700 hover:text-rose-800' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{pick('Clear All Data', 'مسح كافة السجلات', 'سڕینەوەی هەموو داتاکان', 'Tüm Verileri Sil', 'Effacer toutes les données', 'Borrar Todos los Datos')}</span>
                </button>
              ) : (
                <div
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                    isLight ? 'bg-rose-50 border-rose-300' : 'bg-rose-950/50 border-rose-500/35'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isLight ? 'text-rose-900' : 'text-rose-200'}`}>
                    {pick('Delete everything?', 'هل أنت متأكد؟', 'دڵنیایت؟', 'Emin misiniz?', 'Tout supprimer ?', '¿Eliminar todo?')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllData();
                        setShowClearConfirm(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white cursor-pointer"
                    >
                      {pick('Delete', 'مسح', 'سڕینەوە', 'Sil', 'Supprimer', 'Eliminar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {translations.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
