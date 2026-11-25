import React, { useState, useRef, useEffect } from 'react';
import { CurrencyCode, Language, ThemeMode, Translations } from '../types';
import { LANGUAGE_OPTIONS, isLightThemeMode, normalizeThemeMode } from '../utils/loanLogic';
import {
  Bell,
  Check,
  ChevronDown,
  X,
  Menu,
  Palette,
  Settings,
  User as UserIcon,
} from './OrganicIcons';
import { CloudSyncStatus } from '../firebase';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  translations: Translations;
  onOpenAddModal?: () => void;
  onOpenSettings: (tab?: string) => void;
  onOpenTutorial?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenDrawer?: () => void;
  onOpenNotificationCenter?: () => void;
  unreadNotifCount?: number;
  isAiOpen?: boolean;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  authUserEmail?: string | null;
  cloudSyncStatus?: CloudSyncStatus;
  themeMode?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  customRates?: Partial<Record<CurrencyCode, number>>;
  onOpenFxCalculator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  translations,
  onOpenSettings,
  onOpenDrawer,
  onOpenNotificationCenter,
  unreadNotifCount = 0,
  profileName,
  profileUsername,
  profileAvatar,
  onOpenProfile,
  themeMode = 'obsidian_neon',
  onThemeChange,
}) => {
  const isRtl = language === 'ar' || language === 'ku';
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const activeTheme = normalizeThemeMode(themeMode);
  const isLight = isLightThemeMode(activeTheme);
  const isNordic = activeTheme === 'nordic_frost';
  const isVelvetPink = activeTheme === 'velvet_pink';

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const desktopLangMenuRef = useRef<HTMLDivElement>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement>(null);
  const mobilePortalRef = useRef<HTMLDivElement>(null);
  const desktopThemeMenuRef = useRef<HTMLDivElement>(null);
  const mobileThemeMenuRef = useRef<HTMLDivElement>(null);
  const mobileThemePortalRef = useRef<HTMLDivElement>(null);

  // Close language / theme dropdowns on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        isLangMenuOpen &&
        !desktopLangMenuRef.current?.contains(target) &&
        !mobileLangMenuRef.current?.contains(target) &&
        !mobilePortalRef.current?.contains(target)
      ) {
        setIsLangMenuOpen(false);
      }
      if (
        isThemeMenuOpen &&
        !desktopThemeMenuRef.current?.contains(target) &&
        !mobileThemeMenuRef.current?.contains(target) &&
        !mobileThemePortalRef.current?.contains(target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangMenuOpen(false);
        setIsThemeMenuOpen(false);
      }
    };
    if (isLangMenuOpen || isThemeMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangMenuOpen, isThemeMenuOpen]);

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0];

  const themeOptions: {
    id: Extract<ThemeMode, 'obsidian_neon' | 'velvet_pink' | 'midnight_gold' | 'nordic_frost'>;
    label: string;
    dot: string;
  }[] = [
    {
      id: 'obsidian_neon',
      label: isKu ? 'ئۆبسیدیان نیۆن' : isAr ? 'أوبسيديان نيون' : isTr ? 'Obsidian Neon' : isFr ? 'Obsidienne Néon' : isEs ? 'Obsidiana Neón' : 'Obsidian Neon',
      dot: '#10B981',
    },
    {
      id: 'velvet_pink',
      label: isKu ? 'پەمەیی مەخمەلی' : isAr ? 'مخملي وردي' : isTr ? 'Kadife Pembe' : isFr ? 'Velours Rose' : isEs ? 'Rosa Terciopelo' : 'Velvet Pink',
      dot: '#FF2E93',
    },
    {
      id: 'midnight_gold',
      label: isKu ? 'شەوی ئاڵتونی' : isAr ? 'ليلي وذهبي' : isTr ? 'Gece Mavisi' : isFr ? 'Ardoise Minuit' : isEs ? 'Pizarra Medianoche' : 'Midnight Slate',
      dot: '#F59E0B',
    },
    {
      id: 'nordic_frost',
      label: isKu ? 'نۆردیک' : isAr ? 'نورديك أزرق' : isTr ? 'Nordik Buz' : isFr ? 'Givre Nordique' : isEs ? 'Escarcha Nórdica' : 'Nordic Frost',
      dot: '#38BDF8',
    },
  ];

  const activeThemeItem = themeOptions.find((th) => th.id === activeTheme) || themeOptions[0];

  const headerClass = isNordic
    ? 'border-sky-400/20 bg-[#08111B]/90'
    : isVelvetPink
    ? 'border-[#E8B4A0]/20 bg-[#120B14]/90'
    : 'border-white/[0.06] bg-[#080B11]/90';

  const iconBtnClass = isVelvetPink
    ? 'bg-[#1F1224]/85 hover:bg-[#2C1833] border-[#E8B4A0]/22 text-[#FCE7F3] hover:text-white'
    : isNordic
    ? 'bg-[#0F1E2E]/85 hover:bg-[#15283C] border-sky-400/20 text-[#E6F4FF] hover:text-white'
    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200 hover:text-white';

  const dropdownPanelClass = isVelvetPink
    ? 'bg-[#1F1224] border-[#E8B4A0]/25 shadow-[0_20px_50px_rgba(255,46,147,0.16)]'
    : isNordic
    ? 'bg-[#0C1826] border-sky-400/25 shadow-[0_20px_50px_rgba(56,189,248,0.14)]'
    : 'bg-[#0D121F] border-white/[0.14] shadow-2xl';

  const badgeRingClass = isNordic
    ? 'ring-[#08111B]'
    : isVelvetPink
    ? 'ring-[#120B14]'
    : 'ring-[#080B11]';

  return (
    <>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl transition-colors ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Desktop Clean Minimalist Single-Bar Header */}
          <div className="hidden sm:flex h-15 items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {onOpenDrawer && (
                <button
                  type="button"
                  onClick={onOpenDrawer}
                  aria-label={translations.hamburgerMenu || 'Navigation Menu'}
                  title={translations.hamburgerMenu || 'Menu'}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer active:scale-[0.98] shrink-0 smooth-interactive ${iconBtnClass}`}
                >
                  <Menu glow="accent" className="w-[18px] h-[18px] stroke-[1.65]" />
                </button>
              )}

              <span className={`text-lg font-bold font-pricedown tracking-wide truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {translations.appName}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* 1-Tap Quick Theme Picker */}
              {onThemeChange && (
                <div className="relative" ref={desktopThemeMenuRef}>
                  <button
                    type="button"
                    data-testid="header-theme-btn"
                    onClick={() => {
                      setIsLangMenuOpen(false);
                      setIsThemeMenuOpen((prev) => !prev);
                    }}
                    aria-label={translations.themeSectionTitle || 'Select Theme'}
                    title={translations.themeSectionTitle || 'Select Theme'}
                    aria-expanded={isThemeMenuOpen}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer active:scale-95 transition-colors ${iconBtnClass}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/25"
                      style={{ backgroundColor: activeThemeItem.dot }}
                      aria-hidden="true"
                    />
                    <Palette glow="accent" className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline text-[11px] font-medium">{activeThemeItem.label}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isThemeMenuOpen && (
                    <div
                      className={`absolute top-full mt-1.5 ${
                        isRtl ? 'left-0' : 'right-0'
                      } w-52 rounded-2xl border p-1.5 z-50 animate-in fade-in zoom-in-95 ${dropdownPanelClass}`}
                    >
                      <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 ${
                        isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-white/[0.06]'
                      }`}>
                        {translations.themeSectionTitle || 'Theme'}
                      </div>
                      {themeOptions.map((th) => {
                        const isSelected = activeTheme === th.id;
                        return (
                          <button
                            key={th.id}
                            type="button"
                            data-testid={`quick-theme-${th.id}`}
                            onClick={() => {
                              onThemeChange(th.id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? isVelvetPink
                                  ? 'bg-[#FF2E93]/20 text-[#FFD6EB] font-bold border border-[#FF65B5]/40'
                                  : isNordic
                                  ? 'bg-sky-500/20 text-sky-200 font-bold border border-sky-400/40'
                                  : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                                style={{ backgroundColor: th.dot }}
                              />
                              <span className="truncate">{th.label}</span>
                            </div>
                            {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-emerald-400'}`} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Language Selector */}
              <div className="relative" ref={desktopLangMenuRef}>
                <button
                  type="button"
                  data-testid="header-lang-btn"
                  onClick={() => {
                    setIsThemeMenuOpen(false);
                    setIsLangMenuOpen((prev) => !prev);
                  }}
                  aria-label="Select Interface Language"
                  title="Select Interface Language"
                  aria-expanded={isLangMenuOpen}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer active:scale-95 group transition-colors ${iconBtnClass}`}
                >
                  <span className="inline-emoji text-sm select-none">{currentLang.flag}</span>
                  <span className={`font-mono font-bold text-xs ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {currentLang.shortCode}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                  <div
                    className={`absolute top-full mt-1.5 ${
                      isRtl ? 'left-0' : 'right-0'
                    } w-56 rounded-2xl border p-1.5 z-50 animate-in fade-in zoom-in-95 ${dropdownPanelClass}`}
                  >
                    <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b mb-1 ${
                      isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-white/[0.06]'
                    }`}>
                      {isKu ? 'زمان' : isAr ? 'اللغة' : isTr ? 'Dil' : isFr ? 'Langue' : isEs ? 'Idioma' : 'Language'}
                    </div>
                    {LANGUAGE_OPTIONS.map((opt) => {
                      const isSelected = language === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            onLanguageChange(opt.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                                : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                              : isLight
                              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-emoji text-base">{opt.flag}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isLight
                                ? 'bg-slate-100 text-emerald-700 border-slate-200'
                                : 'bg-white/[0.08] text-emerald-400 border-white/[0.06]'
                            }`}>
                              {opt.shortCode}
                            </span>
                            <span className={opt.code === 'ku' ? 'font-kurdish' : ''}>
                              {opt.nativeName}
                            </span>
                          </div>
                          {isSelected && <Check className={`w-3.5 h-3.5 stroke-[2.2] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conditional Notification Bell (only shown when alerts exist to keep top bar minimal) */}
              {onOpenNotificationCenter && unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenNotificationCenter}
                  aria-label={translations.notificationCenterTitle}
                  title={translations.notificationCenterTitle}
                  className={`relative w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer active:scale-[0.98] group transition-colors ${iconBtnClass}`}
                >
                  <Bell
                    glow="accent"
                    className={`w-[18px] h-[18px] stroke-[1.65] transition-colors ${
                      isVelvetPink
                        ? 'text-[#F8D0E4] group-hover:text-[#FF65B5]'
                        : isLight
                        ? 'text-slate-700 group-hover:text-emerald-700'
                        : 'text-slate-300 group-hover:text-emerald-400'
                    }`}
                  />
                  <span className={`font-numeric absolute -top-1 -end-1 min-w-[17px] h-[17px] px-1 rounded-full ${isVelvetPink ? 'bg-[#FF2E93]' : 'bg-rose-500'} text-white font-bold text-[9px] flex items-center justify-center shadow-sm ring-2 ${badgeRingClass}`}>
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                </button>
              )}

              {/* User Profile Avatar */}
              {onOpenProfile && (
                <button
                  type="button"
                  data-testid="header-profile-btn"
                  onClick={onOpenProfile}
                  aria-label={profileName ? `Profile: ${profileName}` : 'Account & Profile Settings'}
                  title={profileName ? `${profileName}${profileUsername ? ` (@${profileUsername})` : ''}` : 'Profile Settings'}
                  className={`w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0 font-bold text-xs ${iconBtnClass}`}
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || 'Profile avatar'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : profileName || profileUsername ? (
                    <span>{(profileName || profileUsername || 'U').trim().slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Settings Button */}
              <button
                type="button"
                data-testid="header-settings-btn"
                onClick={() => onOpenSettings()}
                aria-label={translations.settingsTitle}
                title={translations.settingsTitle}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer active:scale-95 group transition-all ${iconBtnClass}`}
              >
                <Settings glow="accent" className="w-[18px] h-[18px] stroke-[1.7] group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>

          {/* Mobile Clean Single-Row Header */}
          <div className="sm:hidden flex items-center justify-between h-14 gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {onOpenDrawer && (
                <button
                  type="button"
                  onClick={onOpenDrawer}
                  aria-label={translations.hamburgerMenu || 'Navigation Menu'}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${iconBtnClass}`}
                >
                  <Menu glow="accent" className="w-4 h-4 stroke-[1.7]" />
                </button>
              )}

              <span className={`text-[15px] font-bold font-pricedown tracking-wide whitespace-nowrap truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {translations.appName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mobile 1-Tap Theme Button */}
              {onThemeChange && (
                <div className="relative" ref={mobileThemeMenuRef}>
                  <button
                    type="button"
                    data-testid="mobile-theme-btn"
                    onClick={() => {
                      setIsLangMenuOpen(false);
                      setIsThemeMenuOpen((prev) => !prev);
                    }}
                    aria-label={translations.themeSectionTitle || 'Select Theme'}
                    aria-expanded={isThemeMenuOpen}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center active:scale-95 cursor-pointer relative ${iconBtnClass}`}
                  >
                    <Palette glow="accent" className="w-3.5 h-3.5" />
                    <span
                      className="w-2 h-2 rounded-full absolute bottom-1 end-1 border border-black/20"
                      style={{ backgroundColor: activeThemeItem.dot }}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              )}

              {/* Mobile Language Selector */}
              <div className="relative" ref={mobileLangMenuRef}>
                <button
                  type="button"
                  data-testid="mobile-lang-btn"
                  onClick={() => {
                    setIsThemeMenuOpen(false);
                    setIsLangMenuOpen((prev) => !prev);
                  }}
                  aria-label="Select Language"
                  aria-expanded={isLangMenuOpen}
                  className={`flex items-center justify-center gap-1 px-2 h-8 min-w-[44px] rounded-xl text-[10px] font-bold border active:scale-[0.98] cursor-pointer ${iconBtnClass}`}
                >
                  <span className="inline-emoji text-xs">{currentLang.flag}</span>
                  <span className={`font-sans text-[10px] font-bold ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {currentLang.shortCode}
                  </span>
                </button>
              </div>

              {onOpenNotificationCenter && unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenNotificationCenter}
                  aria-label={translations.notificationCenterTitle}
                  className={`relative w-8 h-8 rounded-xl border flex items-center justify-center active:scale-[0.98] cursor-pointer ${iconBtnClass}`}
                >
                  <Bell glow="accent" className="w-3.5 h-3.5 stroke-[1.65]" />
                  <span className={`font-numeric absolute -top-1 -end-1 min-w-[15px] h-[15px] px-0.5 rounded-full ${isVelvetPink ? 'bg-[#FF2E93]' : 'bg-rose-500'} text-white font-bold text-[8px] flex items-center justify-center ring-1 ${badgeRingClass}`}>
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                </button>
              )}

              {/* Mobile Profile Avatar */}
              {onOpenProfile && (
                <button
                  type="button"
                  data-testid="mobile-profile-btn"
                  onClick={onOpenProfile}
                  aria-label={profileName ? `Profile: ${profileName}` : 'Profile Settings'}
                  className={`w-8 h-8 rounded-full border overflow-hidden flex items-center justify-center active:scale-95 cursor-pointer shrink-0 font-bold text-[10px] ${iconBtnClass}`}
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || 'Profile avatar'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : profileName || profileUsername ? (
                    <span>{(profileName || profileUsername || 'U').trim().slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Mobile Settings Button */}
              <button
                type="button"
                data-testid="mobile-settings-btn"
                onClick={() => onOpenSettings()}
                aria-label={translations.settingsTitle}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center active:scale-95 cursor-pointer ${iconBtnClass}`}
              >
                <Settings glow="accent" className="w-3.5 h-3.5 stroke-[1.7]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Theme Selector Overlay */}
      {isThemeMenuOpen && onThemeChange && (
        <div ref={mobileThemePortalRef} className="sm:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90]"
            onClick={() => setIsThemeMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Theme Options"
            className={`fixed inset-x-3 top-16 rounded-2xl border p-3 z-[100] animate-in fade-in zoom-in-95 ${dropdownPanelClass}`}
          >
            <div className={`flex items-center justify-between px-2.5 py-2 text-xs font-bold border-b mb-2 ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-slate-200 border-white/[0.08]'
            }`}>
              <span>{translations.themeSectionTitle || 'Theme'}</span>
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(false)}
                aria-label="Close Theme Menu"
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-white bg-white/[0.06]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {themeOptions.map((th) => {
                const isSelected = activeTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    role="menuitem"
                    data-testid={`mobile-quick-theme-${th.id}`}
                    onClick={() => {
                      onThemeChange(th.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 min-h-[44px] rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.99] transition-all ${
                      isSelected
                        ? isVelvetPink
                          ? 'bg-[#FF2E93]/20 text-[#FFD6EB] font-bold border border-[#FF65B5]/45'
                          : isNordic
                          ? 'bg-sky-500/20 text-sky-200 font-bold border border-sky-400/45'
                          : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                        : 'text-slate-200 hover:text-white bg-[#131A2B] hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: th.dot }} />
                      <span className="text-sm">{th.label}</span>
                    </div>
                    {isSelected && <Check className={`w-4 h-4 stroke-[2.5] ${isVelvetPink ? 'text-[#FF65B5]' : isNordic ? 'text-sky-400' : 'text-emerald-400'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Language Selector Overlay */}
      {isLangMenuOpen && (
        <div ref={mobilePortalRef} className="sm:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90]"
            onClick={() => setIsLangMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Language Options"
            className={`fixed inset-x-3 top-16 rounded-2xl border p-3 z-[100] animate-in fade-in zoom-in-95 ${dropdownPanelClass}`}
          >
            <div className={`flex items-center justify-between px-2.5 py-2 text-xs font-bold border-b mb-2 ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-slate-200 border-white/[0.08]'
            }`}>
              <span>{isKu ? 'زمانی ئەپڵیکەیشن' : isAr ? 'اختر اللغة' : isTr ? 'Dil Seçin' : isFr ? 'Choisir la langue' : isEs ? 'Seleccionar idioma' : 'Select Language'}</span>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(false)}
                aria-label="Close Language Menu"
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-white bg-white/[0.06]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onLanguageChange(opt.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 min-h-[46px] rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.99] transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                        : isLight
                        ? 'text-slate-800 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        : 'text-slate-200 hover:text-white bg-[#131A2B] hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-emoji text-xl">{opt.flag}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        isLight
                          ? 'bg-white text-emerald-700 border-slate-200'
                          : 'bg-white/[0.08] text-emerald-400 border-white/[0.08]'
                      }`}>
                        {opt.shortCode}
                      </span>
                      <span className={opt.code === 'ku' ? 'font-kurdish text-sm font-semibold' : 'text-sm'}>
                        {opt.nativeName}
                      </span>
                    </div>
                    {isSelected && <Check className={`w-4 h-4 stroke-[2.5] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
