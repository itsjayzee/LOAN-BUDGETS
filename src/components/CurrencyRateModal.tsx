import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CurrencyCode, Language, ThemeMode, UserSettings } from '../types';
import {
  DEFAULT_EXCHANGE_RATES,
  IRAQ_MARKET_BASKETS,
  IraqMarketBasketCode,
  IraqMarketMeta,
  OFFICIAL_CBI_USD_TO_IQD_RATE,
  convertUsdAndIqd,
  fetchLiveUsdToIqdReferenceRate,
  getIqdBasketPrice,
  getIraqMarketRatesList,
  getUsdToIqdRate,
  inferIraqMarketHub,
  isLightThemeMode,
  normalizeCustomRates,
  readIraqMarketMeta,
  roundCurrencyAmount,
  sanitizeDecimalAmountInput,
  withIqdBasketPrice,
  writeIraqMarketMeta,
} from '../utils/loanLogic';
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  DollarSign,
  RefreshCw,
  X,
} from './OrganicIcons';

interface CurrencyRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  language: Language;
  themeMode?: ThemeMode;
  onShowToast?: (msg: string) => void;
}

const EMPTY_BASKET_INPUTS: Record<IraqMarketBasketCode, string> = {
  USD: '',
  IRR: '',
  EUR: '',
  TRY: '',
};

export const CurrencyRateModal: React.FC<CurrencyRateModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  language,
  themeMode = 'obsidian_neon',
  onShowToast,
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
  const isVelvetPink = themeMode === 'velvet_pink';
  const isGoldTheme = themeMode === 'midnight_gold';

  const [basketInputs, setBasketInputs] = useState<Record<IraqMarketBasketCode, string>>({
    ...EMPTY_BASKET_INPUTS,
  });
  const [usdInput, setUsdInput] = useState('');
  const [iqdInput, setIqdInput] = useState('');
  const [activeSide, setActiveSide] = useState<'usd' | 'iqd'>('usd');
  const [draftShowDual, setDraftShowDual] = useState(true);
  const [draftPrimary, setDraftPrimary] = useState<'USD' | 'IQD'>('IQD');
  const [showSecondary, setShowSecondary] = useState(false);
  const [sarInput, setSarInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [marketMeta, setMarketMeta] = useState<IraqMarketMeta>(() => readIraqMarketMeta());
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const handleRefreshLiveRate = async (opts: { silent?: boolean } = {}) => {
    setIsFetchingLive(true);
    try {
      const live = await fetchLiveUsdToIqdReferenceRate();
      const updated = writeIraqMarketMeta({
        officialUsdToIqd: live.officialUsdToIqd,
        fetchedAtIso: live.fetchedAtIso,
        sourceLabel: live.sourceLabel,
        isLiveSynced: live.ok,
      });
      setMarketMeta(updated);
      window.dispatchEvent(new Event('loan-budget-iraq-market-updated'));
      if (!opts.silent) {
        onShowToast?.(
          live.ok
            ? pick(
                `Live reference synced: $1 = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} IQD (Official)`,
                `تم تحديث السعر المرجعي: $1 = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} دينار`,
                `نرخی فەرمی نوێکرایەوە: $1 = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} دینار`,
                `Resmi referans kur güncellendi: $1 = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} IQD`,
                `Taux officiel synchronisé : 1 $ = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} IQD`,
                `Referencia oficial sincronizada: $1 = ${Math.round(live.officialUsdToIqd).toLocaleString('en-US')} IQD`
              )
            : pick(
                `Using CBI baseline reference ($1 = ${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} IQD)`,
                `اعتماد السعر المرجعي للبنك المركزي (${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} دينار)`,
                `بەکارهێنانی نرخی سەرەکی بانکی ناوەندی (${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} دینار)`,
                `CBI temel referansı kullanılıyor (${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} IQD)`,
                `Référence CBI de base active (${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} IQD)`,
                `Usando referencia base CBI (${OFFICIAL_CBI_USD_TO_IQD_RATE.toLocaleString('en-US')} IQD)`
              )
        );
      }
    } finally {
      setIsFetchingLive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setBasketInputs({ ...EMPTY_BASKET_INPUTS });
      setUsdInput('');
      setIqdInput('');
      setActiveSide('usd');
      setDraftShowDual(settings.showDualCurrency !== false);
      setDraftPrimary(settings.dualPrimaryCurrency === 'USD' ? 'USD' : 'IQD');
      setSarInput('');
      setErrorMsg(null);
      const storedMeta = readIraqMarketMeta();
      setMarketMeta(storedMeta);
      if (!storedMeta.isLiveSynced) {
        void handleRefreshLiveRate({ silent: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings.customRates, settings.showDualCurrency, settings.dualPrimaryCurrency]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const normalizedSavedRates = normalizeCustomRates(settings.customRates);
  const draftUsd100 = parseFloat(basketInputs.USD);
  const effectiveRate =
    Number.isFinite(draftUsd100) && draftUsd100 > 0
      ? Math.round((draftUsd100 / 100) * 100) / 100
      : getUsdToIqdRate(settings.customRates);

  const marketItems = getIraqMarketRatesList(settings.customRates);

  const getBasketUnitLabel = (cfg: (typeof IRAQ_MARKET_BASKETS)[number]) =>
    isKu
      ? cfg.unitLabelKu
      : isAr
      ? cfg.unitLabelAr
      : isTr
      ? cfg.unitLabelTr
      : isFr
      ? cfg.unitLabelFr
      : isEs
      ? cfg.unitLabelEs
      : cfg.unitLabelEn;

  const syncConverterForRate = (nextRate: number, sourceSide: 'usd' | 'iqd' = activeSide) => {
    if (sourceSide === 'usd') {
      const u = parseFloat(usdInput);
      if (Number.isFinite(u) && u >= 0 && usdInput.trim() !== '') {
        setIqdInput(u === 0 ? '0' : String(convertUsdAndIqd(u, 'USD', nextRate)));
      }
    } else {
      const q = parseFloat(iqdInput);
      if (Number.isFinite(q) && q >= 0 && iqdInput.trim() !== '') {
        setUsdInput(q === 0 ? '0' : String(convertUsdAndIqd(q, 'IQD', nextRate)));
      }
    }
  };

  const handleBasketInputChange = (code: IraqMarketBasketCode, raw: string) => {
    const cleaned = sanitizeDecimalAmountInput(raw);
    setBasketInputs((prev) => ({ ...prev, [code]: cleaned }));
    setErrorMsg(null);
    if (code === 'USD') {
      const val = parseFloat(cleaned);
      if (Number.isFinite(val) && val > 0) {
        syncConverterForRate(Math.round((val / 100) * 100) / 100);
      } else {
        syncConverterForRate(getUsdToIqdRate(settings.customRates));
      }
    }
  };

  const handleUsdInputChange = (raw: string) => {
    const cleaned = sanitizeDecimalAmountInput(raw);
    setActiveSide('usd');
    setUsdInput(cleaned);
    if (!cleaned) {
      setIqdInput('');
      return;
    }
    const val = parseFloat(cleaned);
    if (Number.isFinite(val) && val >= 0) {
      setIqdInput(val === 0 ? '0' : String(convertUsdAndIqd(val, 'USD', effectiveRate)));
    }
  };

  const handleIqdInputChange = (raw: string) => {
    const cleaned = sanitizeDecimalAmountInput(raw);
    setActiveSide('iqd');
    setIqdInput(cleaned);
    if (!cleaned) {
      setUsdInput('');
      return;
    }
    const val = parseFloat(cleaned);
    if (Number.isFinite(val) && val >= 0) {
      setUsdInput(val === 0 ? '0' : String(convertUsdAndIqd(val, 'IQD', effectiveRate)));
    }
  };

  const handleSwapFocus = () => {
    const nextSide = activeSide === 'usd' ? 'iqd' : 'usd';
    setActiveSide(nextSide);
    if (nextSide === 'iqd') {
      const u = parseFloat(usdInput);
      const q = parseFloat(iqdInput);
      if (Number.isFinite(q) && q > 0) {
        setUsdInput(String(convertUsdAndIqd(q, 'IQD', effectiveRate)));
      } else if (Number.isFinite(u) && u > 0) {
        setIqdInput(String(convertUsdAndIqd(u, 'USD', effectiveRate)));
      }
    } else {
      const u = parseFloat(usdInput);
      if (Number.isFinite(u) && u > 0) {
        setIqdInput(String(convertUsdAndIqd(u, 'USD', effectiveRate)));
      }
    }
  };

  const handleResetDefault = () => {
    const resetRates = { ...DEFAULT_EXCHANGE_RATES };
    onUpdateSettings({
      customRates: resetRates,
      showDualCurrency: true,
      dualPrimaryCurrency: 'IQD',
    });
    writeIraqMarketMeta({ marketHub: inferIraqMarketHub(resetRates.IQD) });
    window.dispatchEvent(new Event('loan-budget-iraq-market-updated'));
    setBasketInputs({ ...EMPTY_BASKET_INPUTS });
    setSarInput('');
    setUsdInput('');
    setIqdInput('');
    setDraftShowDual(true);
    setDraftPrimary('IQD');
    setErrorMsg(null);
    onShowToast?.(
      pick(
        'Market exchange rates restored to defaults.',
        'تمت استعادة أسعار الصرف الافتراضية.',
        'نرخەکانی گۆڕینەوە گەڕانەوە سەر بنەڕەت.',
        'Piyasa kurları varsayılana döndürüldü.',
        'Taux de change réinitialisés par défaut.',
        'Tasas de cambio restablecidas.'
      )
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let nextRates: Record<CurrencyCode, number> = normalizeCustomRates(settings.customRates);

    // Apply USD first so subsequent cross-currency IQD basket calculations use the updated IQD baseline
    const orderedCodes: IraqMarketBasketCode[] = ['USD', 'IRR', 'EUR', 'TRY'];
    for (const code of orderedCodes) {
      const raw = basketInputs[code].trim();
      if (!raw) continue;
      const parsed = parseFloat(raw);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000000000) {
        setErrorMsg(
          pick(
            `Enter a valid positive IQD price for ${code}.`,
            `أدخل سعراً صحيحاً بالدينار العراقي لـ ${code}.`,
            `نرخێکی دروست بە دینار بنووسە بۆ ${code}.`,
            `${code} için geçerli pozitif bir IQD fiyatı girin.`,
            `Saisissez un prix IQD valide pour ${code}.`,
            `Ingresa un precio positivo válido en IQD para ${code}.`
          )
        );
        return;
      }
      nextRates = withIqdBasketPrice(nextRates, code, parsed);
    }

    if (sarInput.trim()) {
      const parsedSar = parseFloat(sarInput.trim());
      if (!Number.isFinite(parsedSar) || parsedSar <= 0 || parsedSar > 100000000) {
        setErrorMsg(
          pick(
            'Enter a valid positive SAR rate.',
            'أدخل سعر صرف صحيح للريال السعودي.',
            'نرخێکی دروست بۆ ڕیاڵی سعودی بنووسە.',
            'Geçerli bir pozitif SAR kuru girin.',
            'Saisissez un taux SAR valide.',
            'Ingresa una tasa SAR positiva válida.'
          )
        );
        return;
      }
      nextRates = {
        ...nextRates,
        SAR: Math.round(parsedSar * 10000) / 10000,
      };
    }

    onUpdateSettings({
      customRates: nextRates,
      showDualCurrency: draftShowDual,
      dualPrimaryCurrency: draftPrimary,
    });

    const nextMeta = writeIraqMarketMeta({
      marketHub: inferIraqMarketHub(nextRates.IQD),
    });
    setMarketMeta(nextMeta);
    window.dispatchEvent(new Event('loan-budget-iraq-market-updated'));

    const formatted100Usd = getIqdBasketPrice('USD', nextRates).toLocaleString('en-US');
    onShowToast?.(
      pick(
        `Market rates saved · $100 USD = ${formatted100Usd} IQD`,
        `تم حفظ أسعار السوق · 100 دولار = ${formatted100Usd} دينار`,
        `نرخەکان پاشەکەوت کران · ١٠٠ دۆلار = ${formatted100Usd} دینار`,
        `Kurlar kaydedildi · $100 USD = ${formatted100Usd} IQD`,
        `Taux enregistrés · 100 $ USD = ${formatted100Usd} IQD`,
        `Tasas guardadas · $100 USD = ${formatted100Usd} IQD`
      )
    );
    onClose();
  };

  const formatted100Equiv = Math.round(effectiveRate * 100).toLocaleString('en-US');
  const formatted1Equiv = roundCurrencyAmount(effectiveRate).toLocaleString('en-US');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="currency-rate-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fx-calculator-title"
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
            key="currency-rate-panel"
            dir={isRtl ? 'rtl' : 'ltr'}
            data-testid="currency-rate-modal"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.85 }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
            className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col ${
              isLight
                ? isNordic
                  ? 'bg-[#F4F8FD]/98 border-sky-200 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-900'
                : isVelvetPink
                ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FDF4FA]'
                : 'bg-[#0D121F]/95 border-white/[0.1] text-slate-100'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
                isLight
                  ? isNordic
                    ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                    : 'border-slate-200 bg-slate-50'
                  : isVelvetPink
                  ? 'border-[#E8B4A0]/18 bg-[#170D1B]/90'
                  : 'border-white/[0.07] bg-[#080B11]/85'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isVelvetPink
                      ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                      : isGoldTheme
                      ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                      : isNordic
                      ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                      : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  }`}
                >
                  <ArrowLeftRight glow="accent" className="w-4.5 h-4.5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="fx-calculator-title"
                    className="text-sm sm:text-base font-bold tracking-tight truncate text-white"
                  >
                    {pick(
                      'Change Market Rates',
                      'تغيير أسعار السوق',
                      'گۆڕینی نرخەکانی بازاڕ',
                      'Piyasa Kurlarını Değiştir',
                      'Modifier les Taux du Marché',
                      'Cambiar Tasas de Mercado'
                    )}
                  </h2>
                  <p
                    data-numeric="true"
                    dir="ltr"
                    className={`text-[11px] font-pricedown font-numeric tabular-nums truncate ${
                      isVelvetPink
                        ? 'text-[#FF65B5]'
                        : isNordic
                        ? 'text-sky-300'
                        : isGoldTheme
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    $1 = {formatted1Equiv} IQD · $100 = {formatted100Equiv} IQD
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={pick('Close', 'إغلاق', 'داخستن', 'Kapat', 'Fermer', 'Cerrar')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-200/70 hover:bg-slate-300/80 text-slate-700'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:px-5 sm:py-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 scrollbar-thin">
                {/* 1. Live Bidirectional Converter (Starts 100% Empty) */}
                <section
                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isLight
                      ? isNordic
                        ? 'bg-white/95 border-sky-200'
                        : 'bg-slate-50 border-slate-200'
                      : isVelvetPink
                      ? 'bg-[#281630]/85 border-[#E8B4A0]/20'
                      : 'bg-slate-900/75 border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {pick(
                          'Quick Converter',
                          'المحول الفوري',
                          'گۆڕینەوەی خێرا',
                          'Hızlı Çevirici',
                          'Convertisseur Rapide',
                          'Conversor Rápido'
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      data-testid="fx-swap-btn"
                      onClick={handleSwapFocus}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-200'
                      }`}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>USD ⇄ IQD</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="fx-usd-input"
                        className={`block text-[11px] font-semibold mb-1 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        USD ($)
                      </label>
                      <div className="relative" dir="ltr">
                        <DollarSign
                          className={`w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                            isLight ? 'text-emerald-700' : 'text-emerald-400'
                          }`}
                        />
                        <input
                          id="fx-usd-input"
                          data-testid="fx-usd-input"
                          type="text"
                          inputMode="decimal"
                          value={usdInput}
                          onChange={(e) => handleUsdInputChange(e.target.value)}
                          placeholder={pick('Enter USD amount', 'أدخل المبلغ بالدولار', 'بڕی دۆلار بنووسە', 'USD tutarı girin', 'Montant USD', 'Monto USD')}
                          className={`w-full ps-8 pe-12 py-2.5 rounded-xl border text-sm font-pricedown font-numeric tabular-nums outline-none transition-all ${
                            activeSide === 'usd'
                              ? isVelvetPink
                                ? 'border-[#FF65B5] ring-2 ring-[#FF2E93]/20'
                                : 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : isLight
                              ? 'border-slate-300'
                              : 'border-white/[0.1]'
                          } ${
                            isLight
                              ? 'bg-white text-slate-900 placeholder-slate-400'
                              : isVelvetPink
                              ? 'bg-[#120B14]/85 text-white placeholder-pink-200/30'
                              : 'bg-[#080B11]/90 text-white placeholder-slate-500'
                          }`}
                        />
                        <span
                          className={`absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          USD
                        </span>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="fx-iqd-input"
                        className={`block text-[11px] font-semibold mb-1 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        IQD ({pick('Iraqi Dinar', 'دينار عراقي', 'دیناری عێراقی', 'Irak Dinarı', 'Dinar irakien', 'Dinar Iraquí')})
                      </label>
                      <div className="relative" dir="ltr">
                        <input
                          id="fx-iqd-input"
                          data-testid="fx-iqd-input"
                          type="text"
                          inputMode="decimal"
                          value={iqdInput}
                          onChange={(e) => handleIqdInputChange(e.target.value)}
                          placeholder={pick('Enter IQD amount', 'أدخل المبلغ بالدينار', 'بڕی دینار بنووسە', 'IQD tutarı girin', 'Montant IQD', 'Monto IQD')}
                          className={`w-full ps-3.5 pe-12 py-2.5 rounded-xl border text-sm font-pricedown font-numeric tabular-nums outline-none transition-all ${
                            activeSide === 'iqd'
                              ? isVelvetPink
                                ? 'border-[#FF65B5] ring-2 ring-[#FF2E93]/20'
                                : 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : isLight
                              ? 'border-slate-300'
                              : 'border-white/[0.1]'
                          } ${
                            isLight
                              ? 'bg-white text-slate-900 placeholder-slate-400'
                              : isVelvetPink
                              ? 'bg-[#120B14]/85 text-white placeholder-pink-200/30'
                              : 'bg-[#080B11]/90 text-white placeholder-slate-500'
                          }`}
                        />
                        <span
                          className={`absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          IQD
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Choose a Different Price for Major Iraq Market Currencies */}
                <section
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight
                      ? isNordic
                        ? 'bg-white/95 border-sky-200'
                        : 'bg-slate-50 border-slate-200'
                      : isVelvetPink
                      ? 'bg-[#281630]/85 border-[#E8B4A0]/20'
                      : 'bg-slate-900/75 border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`block text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {pick(
                        'Choose a Different Price (IQD)',
                        'اختر سعراً مخصصاً (دينار عراقي)',
                        'دیاریکردنی نرخی جیاواز (دینار)',
                        'Özel Piyasa Fiyatı Belirle (IQD)',
                        'Définir un Prix Personnalisé (IQD)',
                        'Elegir Precio Personalizado (IQD)'
                      )}
                    </span>

                    <button
                      type="button"
                      data-testid="fx-fetch-live-btn"
                      onClick={() => void handleRefreshLiveRate()}
                      disabled={isFetchingLive}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                          : isVelvetPink
                          ? 'bg-[#FF2E93]/18 hover:bg-[#FF2E93]/28 border-[#FF65B5]/40 text-[#FFD6EB]'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-200'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingLive ? 'animate-spin' : ''}`} />
                      <span>
                        {isFetchingLive
                          ? pick('Syncing...', 'جاري التحديث...', 'نوێکردنەوە...', 'Eşitleniyor...', 'Synchro...', 'Sincronizando...')
                          : pick('Sync Live Ref', 'تحديث المرجع', 'نوێکردنەوە', 'Canlı Referans', 'Synchro Live', 'Sincronizar')}
                      </span>
                    </button>
                  </div>

                  {/* Live CBI Ref Info Line */}
                  <div
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 flex-wrap ${
                      isLight
                        ? isNordic
                          ? 'bg-sky-50/75 border-sky-200'
                          : 'bg-white border-slate-200'
                        : isVelvetPink
                        ? 'bg-[#120B14]/70 border-[#E8B4A0]/20'
                        : 'bg-[#080B11]/80 border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          marketMeta.isLiveSynced ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {pick('CBI / Global Ref:', 'المرجع الرسمي:', 'نرخی فەرمی:', 'CBI Referans:', 'Réf. CBI :', 'Ref. CBI:')}
                      </span>
                    </div>
                    <span
                      data-testid="fx-official-rate-badge"
                      data-numeric="true"
                      dir="ltr"
                      className={`text-xs font-pricedown font-numeric tabular-nums ${
                        isLight ? 'text-emerald-700' : isVelvetPink ? 'text-[#FF85C5]' : 'text-emerald-300'
                      }`}
                    >
                      $1 = {Math.round(marketMeta.officialUsdToIqd).toLocaleString('en-US')} IQD
                    </span>
                  </div>

                  {/* 4 Major Currency IQD Inputs ($100 USD, 100k IRR, €100 EUR, 100 TRY) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {marketItems.map((item) => (
                      <div
                        key={item.code}
                        className={`p-2.5 rounded-xl border space-y-1.5 ${
                          isLight
                            ? 'bg-white border-slate-200'
                            : isVelvetPink
                            ? 'bg-[#120B14]/75 border-[#E8B4A0]/20'
                            : 'bg-[#080B11]/85 border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <label
                            htmlFor={`fx-basket-${item.code}`}
                            className={`text-[11px] font-bold truncate ${
                              isLight ? 'text-slate-700' : 'text-slate-200'
                            }`}
                          >
                            {getBasketUnitLabel(item)}
                          </label>
                          <span
                            data-numeric="true"
                            dir="ltr"
                            className={`text-xs font-pricedown font-numeric tabular-nums shrink-0 ${
                              isVelvetPink
                                ? 'text-[#FF85C5]'
                                : isGoldTheme
                                ? 'text-amber-300'
                                : isLight
                                ? 'text-emerald-700'
                                : 'text-emerald-300'
                            }`}
                          >
                            {item.iqdPrice.toLocaleString('en-US')} IQD
                          </span>
                        </div>
                        <div className="relative" dir="ltr">
                          <input
                            id={`fx-basket-${item.code}`}
                            data-testid={`fx-basket-input-${item.code}`}
                            type="text"
                            inputMode="decimal"
                            value={basketInputs[item.code]}
                            onChange={(e) => handleBasketInputChange(item.code, e.target.value)}
                            placeholder={pick(
                              'Enter custom IQD price',
                              'أدخل سعراً مخصصاً',
                              'نرخی تایبەت بنووسە',
                              'Özel IQD girin',
                              'Prix personnalisé',
                              'Precio personalizado'
                            )}
                            className={`w-full ps-3 pe-11 py-2 rounded-lg border text-sm font-pricedown font-numeric tabular-nums outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                                : isVelvetPink
                                ? 'bg-[#1F1224] border-[#E8B4A0]/25 focus:border-[#FF65B5] text-white placeholder-pink-200/35'
                                : 'bg-[#0D1322] border-white/[0.1] focus:border-emerald-500 text-white placeholder-slate-500'
                            }`}
                          />
                          <span
                            className={`absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            IQD
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Dual-Currency Display Preferences */}
                <section
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight
                      ? isNordic
                        ? 'bg-white/95 border-sky-200'
                        : 'bg-slate-50 border-slate-200'
                      : isVelvetPink
                      ? 'bg-[#281630]/85 border-[#E8B4A0]/20'
                      : 'bg-slate-900/75 border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {pick(
                          'Dual-Currency Balance Display',
                          'عرض الرصيد بالعملتين',
                          'پیشاندانی هاوتا بە هەردوو دراو',
                          'Çift Para Birimi Gösterimi',
                          'Affichage Double Devise',
                          'Visualización en Doble Moneda'
                        )}
                      </p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {pick(
                          'Show converted USD / IQD equivalent underneath cards & summaries',
                          'إظهار القيمة المعادلة أسفل البطاقات والملخصات',
                          'پیشاندانی نرخی هاوتا لە ژێر کارت و کۆی گشتی',
                          'Kart ve özetlerin altında USD / IQD karşılığını göster',
                          'Afficher l’équivalent USD / IQD sous les cartes',
                          'Mostrar equivalente USD / IQD debajo de tarjetas y resúmenes'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid="fx-toggle-dual-display"
                      onClick={() => setDraftShowDual((p) => !p)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                        draftShowDual
                          ? isVelvetPink
                            ? 'bg-[#FF2E93]/20 border-[#FF65B5] text-[#FFD6EB]'
                            : isLight
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : isLight
                          ? 'bg-slate-200 border-slate-300 text-slate-600'
                          : 'bg-white/[0.04] border-white/[0.1] text-slate-400'
                      }`}
                    >
                      {draftShowDual ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className={`flex items-center justify-between gap-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                    <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick(
                        'Primary Portfolio Summary:',
                        'عملة الملخص الرئيسية:',
                        'دراوی سەرەکی کۆی گشتی:',
                        'Ana Özet Para Birimi:',
                        'Devise principale du résumé :',
                        'Moneda principal del resumen:'
                      )}
                    </span>
                    <div className={`inline-flex rounded-xl border overflow-hidden ${isLight ? 'border-slate-300' : 'border-white/[0.1]'}`} dir="ltr">
                      <button
                        type="button"
                        data-testid="fx-primary-iqd"
                        onClick={() => setDraftPrimary('IQD')}
                        className={`px-3 py-1.5 text-[11px] font-numeric font-bold cursor-pointer transition-colors ${
                          draftPrimary === 'IQD'
                            ? isVelvetPink
                              ? 'bg-[#FF2E93] text-white'
                              : isLight
                              ? 'bg-slate-900 text-white'
                              : 'bg-emerald-500 text-slate-950'
                            : isLight
                            ? 'bg-white text-slate-600 hover:bg-slate-100'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        IQD
                      </button>
                      <button
                        type="button"
                        data-testid="fx-primary-usd"
                        onClick={() => setDraftPrimary('USD')}
                        className={`px-3 py-1.5 text-[11px] font-numeric font-bold cursor-pointer transition-colors ${
                          draftPrimary === 'USD'
                            ? isVelvetPink
                              ? 'bg-[#FF2E93] text-white'
                              : isLight
                              ? 'bg-slate-900 text-white'
                              : 'bg-emerald-500 text-slate-950'
                            : isLight
                            ? 'bg-white text-slate-600 hover:bg-slate-100'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </section>

                {/* 4. Collapsible Secondary Currency Rate (SAR) */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isLight
                      ? isNordic
                        ? 'border-sky-200 bg-white/90'
                        : 'border-slate-200 bg-slate-50/80'
                      : isVelvetPink
                      ? 'border-[#E8B4A0]/20 bg-[#281630]/60'
                      : 'border-white/[0.08] bg-white/[0.02]'
                  }`}
                >
                  <button
                    type="button"
                    data-testid="fx-secondary-toggle"
                    onClick={() => setShowSecondary((p) => !p)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold cursor-pointer ${
                      isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>
                      {pick(
                        'Saudi Riyal Rate (SAR per 1 USD)',
                        'سعر الريال السعودي (مقابل 1 دولار)',
                        'نرخی ڕیاڵی سعودی (بەرامبەر ١ دۆلار)',
                        'Suudi Riyali Kuru (1 USD)',
                        'Taux Riyal Saoudien (pour 1 USD)',
                        'Tasa Riyal Saudí (por 1 USD)'
                      )}
                    </span>
                    {showSecondary ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
                  </button>

                  {showSecondary && (
                    <div
                      className={`p-3.5 pt-3 border-t ${
                        isLight ? 'border-slate-200 bg-white' : 'border-white/[0.06] bg-black/20'
                      }`}
                    >
                      <label
                        htmlFor="fx-sec-SAR"
                        className={`block text-[10px] font-bold mb-1 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        1 USD = ({normalizedSavedRates.SAR} SAR)
                      </label>
                      <input
                        id="fx-sec-SAR"
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        value={sarInput}
                        placeholder={String(normalizedSavedRates.SAR)}
                        onChange={(e) => setSarInput(sanitizeDecimalAmountInput(e.target.value))}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs font-pricedown font-numeric tabular-nums outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                            : 'bg-slate-950 border-white/[0.1] text-white placeholder-slate-500'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <p className={`text-[10px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {pick(
                    'Existing loans, transactions, and archive records keep the exchange rate captured when they were created.',
                    'السجلات السابقة والمعاملات والأرشيف تحتفظ بسعر الصرف المسجل وقت إنشائها.',
                    'تۆمارە کۆنەکان و مامەڵەکان و ئەرشیف ئەو نرخەیان تێدا پارێزراو دەبێت کە لە کاتی تۆمارکردندا هەبووە.',
                    'Mevcut borçlar, işlemler ve arşiv kayıtları oluşturuldukları andaki kuru korur.',
                    'Les prêts existants, transactions et archives conservent le taux enregistré lors de leur création.',
                    'Los registros existentes, transacciones y archivos conservan la tasa registrada al crearse.'
                  )}
                </p>

                {errorMsg && (
                  <div
                    role="alert"
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      isLight
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-rose-500/15 border-rose-500/35 text-rose-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className={`flex items-center justify-between gap-2 px-5 py-3.5 border-t shrink-0 pb-[calc(0.9rem+env(safe-area-inset-bottom,0px))] ${
                  isLight
                    ? isNordic
                      ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                      : 'border-slate-200 bg-slate-50'
                    : isVelvetPink
                    ? 'border-[#E8B4A0]/18 bg-[#170D1B]/90'
                    : 'border-white/[0.07] bg-[#080B11]/85'
                }`}
              >
                <button
                  type="button"
                  data-testid="fx-reset-btn"
                  onClick={handleResetDefault}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-300'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{pick('Reset Defaults', 'إرجاع الافتراضي', 'گێڕانەوەی بنەڕەت', 'Varsayılanı Sıfırla', 'Réinitialiser', 'Restablecer')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      isLight ? 'text-slate-600 hover:bg-slate-200/70' : 'text-slate-400 hover:bg-white/[0.08]'
                    }`}
                  >
                    {pick('Cancel', 'إلغاء', 'پاشگەزبوونەوە', 'İptal', 'Annuler', 'Cancelar')}
                  </button>
                  <button
                    type="submit"
                    data-testid="fx-save-btn"
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98] ${
                      isVelvetPink
                        ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] text-white shadow-[#FF2E93]/30'
                        : isGoldTheme
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : isNordic
                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{pick('Save Rates', 'حفظ الأسعار', 'پاشەکەوتکردن', 'Kurları Kaydet', 'Enregistrer', 'Guardar Tasas')}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
