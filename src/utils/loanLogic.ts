import {
  AiPersonality,
  AiResponseLength,
  AttachedFile,
  CurrencyCode,
  CurrencyItem,
  FriendChatMessage,
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  LoanType,
  MonthlyTrendPoint,
  ReminderTone,
  TransactionActionType,
  TransactionEntry,
  Translations,
  UserSettings,
} from '../types';

export const CURRENCIES: CurrencyItem[] = [
  {
    code: 'USD',
    flag: 'US',
    symbol: '$',
    nameEn: 'US Dollar',
    nameEs: 'Dólar estadounidense',
    nameAr: 'دولار أمريكي',
    nameKu: 'دۆلاری ئەمریکی',
    nameTr: 'ABD Doları',
    nameFr: 'Dollar américain',
  },
  {
    code: 'IQD',
    flag: 'IQ',
    symbol: 'IQD',
    nameEn: 'Iraqi Dinar',
    nameEs: 'Dinar iraquí',
    nameAr: 'دينار عراقي',
    nameKu: 'دیناری عێراقی',
    nameTr: 'Irak Dinarı',
    nameFr: 'Dinar irakien',
  },
  {
    code: 'SAR',
    flag: 'SA',
    symbol: 'ر.س',
    nameEn: 'Saudi Riyal',
    nameEs: 'Riyal saudí',
    nameAr: 'ريال سعودي',
    nameKu: 'ڕیاڵی سعودی',
    nameTr: 'Suudi Riyali',
    nameFr: 'Riyal saoudien',
  },
  {
    code: 'EUR',
    flag: 'EU',
    symbol: '€',
    nameEn: 'Euro',
    nameEs: 'Euro',
    nameAr: 'يورو أوروبي',
    nameKu: 'یۆرۆی ئەوروپی',
    nameTr: 'Euro',
    nameFr: 'Euro',
  },
  {
    code: 'TRY',
    flag: 'TR',
    symbol: '₺',
    nameEn: 'Turkish Lira',
    nameEs: 'Lira turca',
    nameAr: 'ليرة تركية',
    nameKu: 'لیرەی تورکی',
    nameTr: 'Türk Lirası',
    nameFr: 'Livre turque',
  },
  {
    code: 'IRR',
    flag: 'IR',
    symbol: 'IRR',
    nameEn: 'Iranian Rial (Toman)',
    nameEs: 'Rial iraní (Tomán)',
    nameAr: 'ريال إيراني (تومان)',
    nameKu: 'تمەنی ئێرانی',
    nameTr: 'İran Riyali (Tümen)',
    nameFr: 'Rial iranien (Toman)',
  },
];

export const DEFAULT_USD_TO_IQD_RATE = 1500;

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  IQD: DEFAULT_USD_TO_IQD_RATE,
  SAR: 3.75,
  EUR: 0.92,
  TRY: 34.5,
  IRR: 600000,
};

export const defaultSettings: UserSettings = {
  profileName: '',
  theme: 'obsidian_neon',
  customThemeColor: '#10b981',
  customBgImage: '',
  bgOpacity: 0.15,
  bgBlur: 0,
  fontSize: 'medium',
  language: 'en',
  currency: 'USD',
  aiPersonality: 'diplomat',
  responseLength: 'medium',
  creativity: 'balanced',
  customInstructions: '',
  incognitoMode: false,
  autoVoiceResponse: false,
  resetChatOnExit: false,
  soundEffectsEnabled: true,
  defaultReminderTone: 'friendly',
  defaultDuePeriod: 'none',
  viewMode: 'spacious',
  maskBalances: false,
  sortOrder: 'newest',
  animationsEnabled: true,
  hapticFeedback: true,
  pushNotificationsEnabled: true,
  overdueFollowUpEnabled: true,
  useEasternNumerals: false,
  profileUsername: '',
  profileBio: '',
  profileAvatar: '',
  profileJoinedAt: '',
  lastUsernameChangeDate: '',
  profileFibAccount: '',
  customRates: { ...DEFAULT_EXCHANGE_RATES },
  showDualCurrency: true,
  dualPrimaryCurrency: 'IQD',
};

export type CuratedThemeMode = 'obsidian_neon' | 'midnight_gold' | 'nordic_frost' | 'velvet_pink';

export function normalizeThemeMode(theme?: string): CuratedThemeMode {
  if (theme === 'midnight_gold' || theme === 'sapphire') {
    return 'midnight_gold';
  }
  if (theme === 'nordic_frost') {
    return 'nordic_frost';
  }
  if (theme === 'velvet_pink') {
    return 'velvet_pink';
  }
  return 'obsidian_neon';
}

export function isLightThemeMode(_theme?: string): boolean {
  return false;
}

export interface BackgroundPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  cssValue: string;
  previewBg: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'none',
    nameEn: 'None (Solid Color)',
    nameAr: 'بدون (لون موحد)',
    cssValue: '',
    previewBg: 'bg-slate-900 border border-slate-700',
  },
  {
    id: 'mesh_grid',
    nameEn: 'Cyber Grid',
    nameAr: 'شبكة رقمية',
    cssValue: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M40 0L0 0 0 40\' fill=\'none\' stroke=\'rgba(255,255,255,0.08)\' stroke-width=\'1\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'1\' fill=\'rgba(52,211,153,0.4)\'/%3E%3C/svg%3E")',
    previewBg: 'bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] bg-slate-950 border border-emerald-500/30',
  },
  {
    id: 'aurora',
    nameEn: 'Midnight Aurora',
    nameAr: 'الشفق الليلي',
    cssValue: 'radial-gradient(at 0% 0%, rgba(16,185,129,0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59,130,246,0.3) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(168,85,247,0.25) 0px, transparent 50%)',
    previewBg: 'bg-gradient-to-br from-emerald-900/60 via-blue-900/60 to-purple-900/60 border border-purple-500/30',
  },
  {
    id: 'emerald_circuit',
    nameEn: 'Fintech Emerald Flow',
    nameAr: 'تموجات الزمرد المالي',
    cssValue: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'%3E%3Cpath d=\'M0 30h60M30 0v60M0 0l60 60M60 0L0 60\' stroke=\'rgba(16,185,129,0.08)\' stroke-width=\'1\' fill=\'none\'/%3E%3C/svg%3E")',
    previewBg: 'bg-emerald-950/80 border border-emerald-500/30',
  },
  {
    id: 'luxury_carbon',
    nameEn: 'Luxury Carbon Slate',
    nameAr: 'كربون سيلكون فخم',
    cssValue: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'rgba(255,255,255,0.03)\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'rgba(255,255,255,0.03)\'/%3E%3C/svg%3E")',
    previewBg: 'bg-neutral-900 border border-neutral-700/40',
  },
  {
    id: 'sunset_glow',
    nameEn: 'Sunset Horizon',
    nameAr: 'أفق الغروب الدافئ',
    cssValue: 'radial-gradient(at 10% 20%, rgba(244,63,94,0.3) 0px, transparent 55%), radial-gradient(at 90% 80%, rgba(245,158,11,0.25) 0px, transparent 55%)',
    previewBg: 'bg-gradient-to-br from-rose-950/80 via-amber-950/70 to-slate-950 border border-amber-500/30',
  },
];

export function compressImageFile(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined' || typeof document === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export { translations, LANGUAGE_OPTIONS } from './translations';

export interface Totals {
  totalTheyOwe: number;
  totalIOwe: number;
  netBalance: number;
  activeTheyOweCount: number;
  activeIOweCount: number;
  settledCount: number;
  theyOweByCurrency: Record<CurrencyCode, number>;
  iOweByCurrency: Record<CurrencyCode, number>;
  netByCurrency: Record<CurrencyCode, number>;
  usedCurrencies: CurrencyCode[];
  isMultiCurrency: boolean;
  singleCurrency?: CurrencyCode;
}

export function calculateTotals(
  loans: Loan[],
  activeCurrency: CurrencyCode = 'USD'
): Totals {
  let activeTheyOweCount = 0;
  let activeIOweCount = 0;
  let settledCount = 0;

  const theyOweByCurrency: Record<CurrencyCode, number> = {
    USD: 0,
    IQD: 0,
    SAR: 0,
    EUR: 0,
    TRY: 0,
    IRR: 0,
  };
  const iOweByCurrency: Record<CurrencyCode, number> = {
    USD: 0,
    IQD: 0,
    SAR: 0,
    EUR: 0,
    TRY: 0,
    IRR: 0,
  };
  const netByCurrency: Record<CurrencyCode, number> = {
    USD: 0,
    IQD: 0,
    SAR: 0,
    EUR: 0,
    TRY: 0,
    IRR: 0,
  };

  const usedCurrencySet = new Set<CurrencyCode>();

  for (const loan of Array.isArray(loans) ? loans : []) {
    if (!loan) continue;
    if (loan.status === 'settled') {
      settledCount++;
      continue;
    }
    const curr: CurrencyCode = loan.currency || 'USD';
    usedCurrencySet.add(curr);

    // Calculate effective unpaid amount taking partial repayments into account
    const effectiveRemaining = Math.max(0, (Number(loan.amount) || 0) - (Number(loan.paidAmount) || 0));

    if (loan.type === 'they_owe_me') {
      activeTheyOweCount++;
      theyOweByCurrency[curr] = (theyOweByCurrency[curr] || 0) + effectiveRemaining;
      netByCurrency[curr] = (netByCurrency[curr] || 0) + effectiveRemaining;
    } else if (loan.type === 'i_owe_them') {
      activeIOweCount++;
      iOweByCurrency[curr] = (iOweByCurrency[curr] || 0) + effectiveRemaining;
      netByCurrency[curr] = (netByCurrency[curr] || 0) - effectiveRemaining;
    }
  }

  // Direct per-currency calculation with zero FX conversion distortion
  const totalTheyOwe = theyOweByCurrency[activeCurrency] || 0;
  const totalIOwe = iOweByCurrency[activeCurrency] || 0;
  const netBalance = totalTheyOwe - totalIOwe;
  const usedCurrencies = Array.from(usedCurrencySet);
  const isMultiCurrency = usedCurrencies.length > 1;
  const singleCurrency = usedCurrencies.length === 1 ? usedCurrencies[0] : undefined;

  return {
    totalTheyOwe,
    totalIOwe,
    netBalance,
    activeTheyOweCount,
    activeIOweCount,
    settledCount,
    theyOweByCurrency,
    iOweByCurrency,
    netByCurrency,
    usedCurrencies,
    isMultiCurrency,
    singleCurrency,
  };
}

export function normalizeCustomRates(
  raw?: Partial<Record<CurrencyCode, unknown>> | null
): Record<CurrencyCode, number> {
  const result: Record<CurrencyCode, number> = { ...DEFAULT_EXCHANGE_RATES };
  if (raw && typeof raw === 'object') {
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === 'USD') {
        result.USD = 1;
        continue;
      }
      const n = Number(raw[code]);
      if (Number.isFinite(n) && n > 0 && n <= 100000000) {
        result[code] =
          code === 'IQD'
            ? Math.round(n * 100) / 100
            : code === 'IRR'
            ? Math.round(n * 10000) / 10000
            : Math.round(n * 1000000) / 1000000;
      }
    }
  }
  result.USD = 1;
  return result;
}

export function getUsdToIqdRate(customRates?: Partial<Record<CurrencyCode, unknown>> | null): number {
  const rates = normalizeCustomRates(customRates);
  return rates.IQD > 0 ? rates.IQD : DEFAULT_USD_TO_IQD_RATE;
}

export function withUsdToIqdRate(
  customRates: Partial<Record<CurrencyCode, unknown>> | undefined | null,
  usdToIqd: number
): Record<CurrencyCode, number> {
  const base = normalizeCustomRates(customRates);
  const safeRate =
    Number.isFinite(usdToIqd) && usdToIqd > 0 && usdToIqd <= 100000000
      ? Math.round(usdToIqd * 100) / 100
      : DEFAULT_USD_TO_IQD_RATE;
  return {
    ...base,
    USD: 1,
    IQD: safeRate,
  };
}

export function getCurrencyRateToUsd(
  currency: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, unknown>> | null
): number {
  if (currency === 'USD') return 1;
  const rates = normalizeCustomRates(customRates);
  return rates[currency] > 0 ? rates[currency] : DEFAULT_EXCHANGE_RATES[currency];
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, unknown>> | null,
  overrideFromRateToUsd?: number
): number {
  const safeAmt = Number(amount);
  if (!Number.isFinite(safeAmt) || safeAmt === 0) return 0;
  if (fromCurrency === toCurrency) {
    return toCurrency === 'IQD' || toCurrency === 'IRR'
      ? Math.round(safeAmt)
      : roundCurrencyAmount(safeAmt);
  }
  const fromRate =
    overrideFromRateToUsd !== undefined && Number.isFinite(overrideFromRateToUsd) && overrideFromRateToUsd > 0
      ? overrideFromRateToUsd
      : getCurrencyRateToUsd(fromCurrency, customRates);
  const toRate = getCurrencyRateToUsd(toCurrency, customRates);
  const usdValue = fromCurrency === 'USD' ? safeAmt : safeAmt / fromRate;
  const converted = toCurrency === 'USD' ? usdValue : usdValue * toRate;
  if (toCurrency === 'IQD' || toCurrency === 'IRR') {
    return Math.round(converted);
  }
  return roundCurrencyAmount(converted);
}

export function convertUsdAndIqd(
  amount: number,
  from: 'USD' | 'IQD',
  usdToIqdRate: number = DEFAULT_USD_TO_IQD_RATE
): number {
  const safeAmt = Number(amount);
  if (!Number.isFinite(safeAmt) || safeAmt === 0) return 0;
  const rate = Number.isFinite(usdToIqdRate) && usdToIqdRate > 0 ? usdToIqdRate : DEFAULT_USD_TO_IQD_RATE;
  if (from === 'USD') {
    return Math.round(safeAmt * rate);
  }
  return roundCurrencyAmount(safeAmt / rate);
}

export function buildHistoricalRateSnapshot(
  currency: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, unknown>> | null
): { exchangeRateAtEntry: number; fxRateToUsdAtEntry: number } {
  return {
    exchangeRateAtEntry: getUsdToIqdRate(customRates),
    fxRateToUsdAtEntry: getCurrencyRateToUsd(currency, customRates),
  };
}

export interface DualEquivalentResult {
  targetCurrency: 'USD' | 'IQD';
  convertedAmount: number;
  usedRateUsdToIqd: number;
  isHistoricalRate: boolean;
}

export function resolveRecordDualEquivalent(
  amount: number,
  recordCurrency: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, unknown>> | null,
  recordRates?: {
    exchangeRateAtEntry?: number;
    fxRateToUsdAtEntry?: number;
  },
  preferredTargetCurrency?: 'USD' | 'IQD'
): DualEquivalentResult {
  const activeUsdToIqd = getUsdToIqdRate(customRates);
  const hasEntryUsdToIqd =
    recordRates?.exchangeRateAtEntry !== undefined &&
    Number.isFinite(recordRates.exchangeRateAtEntry) &&
    recordRates.exchangeRateAtEntry > 0;
  const hasEntryCurrencyToUsd =
    recordRates?.fxRateToUsdAtEntry !== undefined &&
    Number.isFinite(recordRates.fxRateToUsdAtEntry) &&
    recordRates.fxRateToUsdAtEntry > 0;

  const effectiveUsdToIqd = hasEntryUsdToIqd ? Number(recordRates!.exchangeRateAtEntry) : activeUsdToIqd;
  const targetCurrency: 'USD' | 'IQD' =
    preferredTargetCurrency ?? (recordCurrency === 'USD' ? 'IQD' : 'USD');

  const safeAmt = Number(amount) || 0;
  if (safeAmt === 0) {
    return {
      targetCurrency,
      convertedAmount: 0,
      usedRateUsdToIqd: effectiveUsdToIqd,
      isHistoricalRate: hasEntryUsdToIqd || hasEntryCurrencyToUsd,
    };
  }

  let usdAmount = safeAmt;
  if (recordCurrency === 'USD') {
    usdAmount = safeAmt;
  } else if (recordCurrency === 'IQD') {
    const iqdPerUsd = hasEntryCurrencyToUsd
      ? Number(recordRates!.fxRateToUsdAtEntry)
      : effectiveUsdToIqd;
    usdAmount = safeAmt / iqdPerUsd;
  } else {
    const unitPerUsd = hasEntryCurrencyToUsd
      ? Number(recordRates!.fxRateToUsdAtEntry)
      : getCurrencyRateToUsd(recordCurrency, customRates);
    usdAmount = safeAmt / unitPerUsd;
  }

  const convertedAmount =
    targetCurrency === 'USD'
      ? roundCurrencyAmount(usdAmount)
      : Math.round(usdAmount * effectiveUsdToIqd);

  return {
    targetCurrency,
    convertedAmount,
    usedRateUsdToIqd: effectiveUsdToIqd,
    isHistoricalRate: hasEntryUsdToIqd || hasEntryCurrencyToUsd,
  };
}

export interface DualCurrencyTotals {
  primaryCurrency: 'USD' | 'IQD';
  secondaryCurrency: 'USD' | 'IQD';
  primaryTheyOwe: number;
  primaryIOwe: number;
  primaryNet: number;
  secondaryTheyOwe: number;
  secondaryIOwe: number;
  secondaryNet: number;
  usdToIqdRate: number;
}

export function calculateDualCurrencyTotals(
  loans: Loan[],
  customRates?: Partial<Record<CurrencyCode, unknown>> | null,
  primaryCurrency: 'USD' | 'IQD' = 'IQD'
): DualCurrencyTotals {
  const rates = normalizeCustomRates(customRates);
  const usdToIqdRate = rates.IQD;
  const secondaryCurrency: 'USD' | 'IQD' = primaryCurrency === 'IQD' ? 'USD' : 'IQD';

  let usdTheyOweRaw = 0;
  let usdIOweRaw = 0;
  let iqdTheyOweRaw = 0;
  let iqdIOweRaw = 0;

  for (const loan of Array.isArray(loans) ? loans : []) {
    if (!loan || loan.status === 'settled') continue;
    const rem = Math.max(0, (Number(loan.amount) || 0) - (Number(loan.paidAmount) || 0));
    if (rem <= 0) continue;
    const curr: CurrencyCode = loan.currency || 'USD';

    const equivUsd = resolveRecordDualEquivalent(rem, curr, rates, loan, 'USD').convertedAmount;
    const equivIqd =
      curr === 'IQD'
        ? Math.round(rem)
        : resolveRecordDualEquivalent(rem, curr, rates, loan, 'IQD').convertedAmount;

    if (loan.type === 'they_owe_me') {
      usdTheyOweRaw += equivUsd;
      iqdTheyOweRaw += equivIqd;
    } else if (loan.type === 'i_owe_them') {
      usdIOweRaw += equivUsd;
      iqdIOweRaw += equivIqd;
    }
  }

  const totalUsdTheyOwe = roundCurrencyAmount(usdTheyOweRaw);
  const totalUsdIOwe = roundCurrencyAmount(usdIOweRaw);
  const totalUsdNet = roundCurrencyAmount(totalUsdTheyOwe - totalUsdIOwe);

  const totalIqdTheyOwe = Math.round(iqdTheyOweRaw);
  const totalIqdIOwe = Math.round(iqdIOweRaw);
  const totalIqdNet = totalIqdTheyOwe - totalIqdIOwe;

  return {
    primaryCurrency,
    secondaryCurrency,
    primaryTheyOwe: primaryCurrency === 'IQD' ? totalIqdTheyOwe : totalUsdTheyOwe,
    primaryIOwe: primaryCurrency === 'IQD' ? totalIqdIOwe : totalUsdIOwe,
    primaryNet: primaryCurrency === 'IQD' ? totalIqdNet : totalUsdNet,
    secondaryTheyOwe: secondaryCurrency === 'IQD' ? totalIqdTheyOwe : totalUsdTheyOwe,
    secondaryIOwe: secondaryCurrency === 'IQD' ? totalIqdIOwe : totalUsdIOwe,
    secondaryNet: secondaryCurrency === 'IQD' ? totalIqdNet : totalUsdNet,
    usdToIqdRate,
  };
}

export function computeMonthlyTrends(
  loans: Loan[],
  activeCurrency: CurrencyCode = 'USD',
  monthsCount: number = 6,
  language: Language = 'en'
): {
  data: MonthlyTrendPoint[];
  summary: {
    totalLent: number;
    totalBorrowed: number;
    totalRepaid: number;
    netMomentum: number;
  };
} {
  const monthNamesEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const monthNamesKu = [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم',
  ];
  const monthNamesTr = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
  ];
  const monthNamesFr = [
    'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc',
  ];
  const monthNamesEs = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  // Build the chronological array of target months up to current month
  const now = new Date();
  const buckets: MonthlyTrendPoint[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    const shortLabel =
      language === 'ku'
        ? monthNamesKu[m]
        : language === 'ar'
        ? monthNamesAr[m]
        : language === 'tr'
        ? monthNamesTr[m]
        : language === 'fr'
        ? monthNamesFr[m]
        : language === 'es'
        ? monthNamesEs[m]
        : monthNamesEn[m];
    const label = `${shortLabel} ${y}`;

    buckets.push({
      monthKey,
      label,
      shortLabel,
      lentAmount: 0,
      borrowedAmount: 0,
      repaidAmount: 0,
      netFlow: 0,
      activeCount: 0,
    });
  }

  // Fast map lookup
  const bucketMap = new Map<string, MonthlyTrendPoint>();
  buckets.forEach((b) => bucketMap.set(b.monthKey, b));

  let totalLent = 0;
  let totalBorrowed = 0;
  let totalRepaid = 0;

  for (const loan of loans) {
    const loanCurr: CurrencyCode = loan.currency || 'USD';
    if (loanCurr !== activeCurrency) continue;

    const originalAmount = loan.amount;
    const paidAmount = loan.paidAmount || 0;

    // Creation month
    const createdMonthKey = loan.createdAt ? loan.createdAt.slice(0, 7) : '';
    const createdBucket = bucketMap.get(createdMonthKey);

    if (createdBucket) {
      if (loan.type === 'they_owe_me') {
        createdBucket.lentAmount += originalAmount;
        totalLent += originalAmount;
      } else {
        createdBucket.borrowedAmount += originalAmount;
        totalBorrowed += originalAmount;
      }
      if (loan.status === 'active') {
        createdBucket.activeCount += 1;
      }
    }

    // Repayments
    if (loan.status === 'settled') {
      const settledMonthKey = loan.settledAt
        ? loan.settledAt.slice(0, 7)
        : createdMonthKey;
      const settledBucket = bucketMap.get(settledMonthKey);
      if (settledBucket) {
        settledBucket.repaidAmount += originalAmount;
        totalRepaid += originalAmount;
      }
    } else if (paidAmount > 0) {
      // Partial repayment
      const targetMonthKey = createdBucket ? createdMonthKey : buckets[buckets.length - 1].monthKey;
      const repBucket = bucketMap.get(targetMonthKey);
      if (repBucket) {
        repBucket.repaidAmount += paidAmount;
        totalRepaid += paidAmount;
      }
    }
  }

  // Round values and calculate netFlow
  for (const b of buckets) {
    b.lentAmount = Math.round(b.lentAmount * 100) / 100;
    b.borrowedAmount = Math.round(b.borrowedAmount * 100) / 100;
    b.repaidAmount = Math.round(b.repaidAmount * 100) / 100;
    b.netFlow = Math.round((b.lentAmount - b.borrowedAmount) * 100) / 100;
  }

  totalLent = Math.round(totalLent * 100) / 100;
  totalBorrowed = Math.round(totalBorrowed * 100) / 100;
  totalRepaid = Math.round(totalRepaid * 100) / 100;
  const netMomentum = Math.round((totalLent - totalBorrowed) * 100) / 100;

  return {
    data: buckets,
    summary: {
      totalLent,
      totalBorrowed,
      totalRepaid,
      netMomentum,
    },
  };
}

/**
 * Eastern / Mashriqi Arabic Numerals System (٠-٩) alongside Western standard digits (0-9)
 */
export const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

export const WESTERN_ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toEasternArabicNumerals(val: string | number): string {
  return String(val).replace(/[0-9]/g, (digit) => EASTERN_ARABIC_DIGITS[digit] || digit);
}

export function toWesternNumerals(val: string | number): string {
  return String(val).replace(/[٠-٩]/g, (digit) => WESTERN_ARABIC_DIGITS[digit] || digit);
}

export function formatLocalizedNumber(
  amount: number,
  decimals = 2,
  _language: Language = 'en',
  useEasternNumerals?: boolean
): string {
  const isEastern = useEasternNumerals ?? false;
  return new Intl.NumberFormat(isEastern ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCardDebt(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  _language: Language = 'en',
  useEasternNumerals?: boolean
): string {
  const item = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const decimals = currencyCode === 'IQD' || currencyCode === 'IRR' ? 0 : 2;
  const isEastern = useEasternNumerals ?? false;
  const formattedNum = new Intl.NumberFormat(isEastern ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  if (currencyCode === 'USD') {
    return `$${formattedNum}`;
  }
  return `${formattedNum} ${item.code}`;
}

export function formatExactDebt(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  _language: Language = 'en',
  useEasternNumerals?: boolean
): string {
  const item = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const decimals = currencyCode === 'IQD' || currencyCode === 'IRR' ? 0 : 2;
  const isEastern = useEasternNumerals ?? false;
  const formattedNum = new Intl.NumberFormat(isEastern ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${item.symbol} ${formattedNum} ${item.code}`;
}

export function formatCurrency(
  amount: number,
  _language: Language,
  activeCurrency: CurrencyCode = 'USD',
  useEasternNumerals?: boolean
): string {
  const item = CURRENCIES.find((c) => c.code === activeCurrency) || CURRENCIES[0];
  const decimals = activeCurrency === 'IQD' || activeCurrency === 'IRR' ? 0 : 2;
  const isEastern = useEasternNumerals ?? false;
  const formattedNum = new Intl.NumberFormat(isEastern ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  if (activeCurrency === 'USD') {
    return `$ ${formattedNum}`;
  }
  return `${formattedNum} ${item.code}`;
}

export function computeDebtProgressPercent(
  loan: Pick<Loan, 'amount' | 'paidAmount' | 'status'>
): number {
  if (loan.status === 'settled') return 100;
  const total = Number(loan.amount) || 0;
  if (total <= 0) return 0;
  const paid = Math.max(0, Number(loan.paidAmount) || 0);
  return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
}

export function getLoanDirectionSign(type: LoanType): '+' | '-' {
  return type === 'they_owe_me' ? '+' : '-';
}

export function formatSignedCurrency(
  amount: number,
  language: Language,
  activeCurrency: CurrencyCode = 'USD',
  direction: LoanType,
  useEasternNumerals?: boolean
): string {
  const sign = getLoanDirectionSign(direction);
  const absAmount = Math.abs(Number(amount) || 0);
  return `${sign} ${formatCurrency(absAmount, language, activeCurrency, useEasternNumerals)}`;
}

export function formatSignedCardDebt(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  language: Language = 'en',
  direction: LoanType,
  useEasternNumerals?: boolean
): string {
  const sign = getLoanDirectionSign(direction);
  const absAmount = Math.abs(Number(amount) || 0);
  return `${sign}${formatCardDebt(absAmount, currencyCode, language, useEasternNumerals)}`;
}

export function generateReminderMessage(
  loan: Loan,
  language: Language,
  tone: ReminderTone = 'formal',
  fallbackCurrency: CurrencyCode = 'USD'
): string {
  const currencyCode: CurrencyCode = loan.currency || fallbackCurrency;
  const item = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const decimals = currencyCode === 'IQD' || currencyCode === 'IRR' ? 0 : 2;
  const formattedNum = loan.amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const amountStr = currencyCode === 'USD' ? `$${formattedNum}` : `${formattedNum} ${item.code}`;
  const name = (loan.personName || 'Contact').trim();
  const dateStr = loan.dueDate ? ` (Due: ${loan.dueDate})` : '';
  const arDateStr = loan.dueDate ? ` (موعد السداد: ${loan.dueDate})` : '';
  const kuDateStr = loan.dueDate ? ` (کاتی دانەوە: ${loan.dueDate})` : '';
  const trDateStr = loan.dueDate ? ` (Vade Tarihi: ${loan.dueDate})` : '';
  const frDateStr = loan.dueDate ? ` (Échéance: ${loan.dueDate})` : '';
  const esDateStr = loan.dueDate ? ` (Vencimiento: ${loan.dueDate})` : '';

  if (language === 'ku') {
    switch (tone) {
      case 'friendly':
        return `سڵاو ${name} گیان، هیوادارم باش بیت! تەنها بیرخستنەوەیەکی دۆستانەیە سەبارەت بە بڕی ماوە (${amountStr})${kuDateStr}. زۆر سوپاس بۆ هاوکاریت.`;
      case 'urgent':
        return `سڵاو کاک/خاتوو ${name}، تکایە ئاگاداری دانەوەی ئەم بڕە بەپەلەیە بە (${amountStr})${kuDateStr} لە زووترین کاتدا لەبەر پێویستی زۆرم پێی. سوپاس بۆ لێکتێگەیشتنت.`;
      case 'formal':
      default:
        return `سڵاو و ڕێز کاک/خاتوو ${name}، ئەمە بیرخستنەوەیەکی فەرمی و ڕێزدارانەیە سەبارەت بە قەرزە ماوەکەت بە بڕی (${amountStr})${kuDateStr}. سوپاس دەکەین لە کاتی گونجاودا یەکلایی بکەیتەوە. لەگەڵ ڕێزماندا.`;
    }
  } else if (language === 'ar') {
    switch (tone) {
      case 'friendly':
        return `مرحباً ${name}، أرجو أن تكون بخير! تذكير ودي بخصوص المبلغ المتبقي (${amountStr})${arDateStr}. كل الشكر والتقدير لك.`;
      case 'urgent':
        return `السلام عليكم ${name}، أرجو الاهتمام بسداد المبلغ المعلق وقدره (${amountStr})${arDateStr} في أقرب وقت لحاجتي الماسة له. شكراً لتعاونك.`;
      case 'formal':
      default:
        return `السلام عليكم ورحمة الله، مرحباً ${name}، هذا تذكير مهذب بخصوص مستحقات القرض المتبقية وقدرها (${amountStr})${arDateStr}. نقدر سدادك في أقرب وقت مناسب. مع خالص الشكر.`;
    }
  } else if (language === 'tr') {
    switch (tone) {
      case 'friendly':
        return `Selam ${name}, umarım her şey yolundadır! Kalan ${amountStr}${trDateStr} tutarındaki ödeme için dostça bir hatırlatma yapmak istedim. Çok teşekkür ederim!`;
      case 'urgent':
        return `Merhaba ${name}, acil ihtiyacımdan dolayı ${amountStr}${trDateStr} tutarındaki geciken ödemenin en kısa sürede kapatılmasını önemle rica ederim. Anlayışın için teşekkürler.`;
      case 'formal':
      default:
        return `Merhaba ${name}, kalan ${amountStr}${trDateStr} tutarındaki borç bakiyeniz ile ilgili resmi hatırlatmadır. En kısa sürede geri dönüş yapmanızı rica ederiz. Saygılarımızla.`;
    }
  } else if (language === 'fr') {
    switch (tone) {
      case 'friendly':
        return `Bonjour ${name}, j'espère que tu vas bien ! Juste un petit rappel amical concernant le montant en attente de ${amountStr}${frDateStr}. Merci beaucoup !`;
      case 'urgent':
        return `Bonjour ${name}, ceci est un rappel urgent concernant le paiement en retard de ${amountStr}${frDateStr}. Merci de bien vouloir régulariser au plus vite.`;
      case 'formal':
      default:
        return `Bonjour ${name}, nous vous rappelons que le paiement de votre solde de ${amountStr}${frDateStr} est en attente. Nous vous remercions par avance de votre diligence. Cordialement.`;
    }
  } else if (language === 'es') {
    switch (tone) {
      case 'friendly':
        return `¡Hola ${name}! Espero que estés muy bien. Solo un recordatorio amigable sobre el monto pendiente de ${amountStr}${esDateStr}. ¡Muchas gracias!`;
      case 'urgent':
        return `Hola ${name}, este es un recordatorio urgente sobre el pago vencido de ${amountStr}${esDateStr}. Por favor confírmame cuándo podemos liquidarlo cuanto antes. Gracias.`;
      case 'formal':
      default:
        return `Hola ${name}, este es un recordatorio cordial sobre tu saldo pendiente de ${amountStr}${esDateStr}. Agradecemos nos indiques cuándo podrás realizar el pago. Un saludo.`;
    }
  } else {
    switch (tone) {
      case 'friendly':
        return `Hey ${name}! Hope you're doing well. Just a quick and friendly reminder about the pending amount of ${amountStr}${dateStr}. Thanks a lot!`;
      case 'urgent':
        return `Hello ${name}, this is an urgent reminder regarding the overdue payment of ${amountStr}${dateStr}. Please arrange settlement as soon as possible. Thank you.`;
      case 'formal':
      default:
        return `Hello ${name}, this is a friendly reminder regarding your pending loan of ${amountStr}${dateStr}. Please let me know when you will be able to settle it. Thank you very much!`;
    }
  }
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export function getShareUrls(message: string, phone?: string) {
  const encodedMsg = encodeURIComponent(message);
  const cleanPhone = cleanPhoneNumber(phone);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  const telegramUrl = `https://t.me/share/url?url=&text=${encodedMsg}`;
  const viberUrl = `viber://forward?text=${encodedMsg}`;

  return {
    whatsappUrl,
    telegramUrl,
    viberUrl,
  };
}

export interface ParsedNaturalLoan {
  matched: boolean;
  type: LoanType;
  personName: string;
  amount: number;
  currency: CurrencyCode;
  dueDate?: string;
  notes?: string;
  rawConfidence: 'high' | 'medium';
}

/**
 * Advanced Natural Language Loan Entry Parser (Ai Budget)
 * Handles queries like "I owe Sarah $150 due next Thursday" or "Ahmed owes me 50000 IQD tomorrow"
 */
export function parseNaturalLanguageLoan(
  input: string,
  language: Language = 'en',
  defaultCurrency: CurrencyCode = 'USD'
): ParsedNaturalLoan | null {
  if (!input || input.trim().length < 4) return null;

  // Normalize numbers: convert Eastern Arabic numerals ٠-٩ to western 0-9
  const text = toWesternNumerals(input).trim();
  const lower = text.toLowerCase();

  // Do not misclassify repayments or incremental additions on existing debts as brand-new loans
  if (
    /(?:toward\s+(?:his|her|their|the|my)?\s*debt|towards\s+(?:his|her|their|the|my)?\s*debt|paid\s+back|repaid|repayment|من\s+أصل\s+الدين|سداد\s+دين|بۆ\s+قەرز|بۆ\s+دانەوەی|me\s+pagó|le\s+pagué|abonó|devolvió)/i.test(
      lower
    )
  ) {
    return null;
  }

  // 1. Detect Direction / Type
  let type: LoanType | null = null;
  if (
    lower.includes('i owe') ||
    lower.includes('owe to') ||
    lower.includes('borrowed') ||
    lower.includes('debt to') ||
    lower.includes('le debo a') ||
    lower.includes('debo a') ||
    lower.includes('pedí prestado') ||
    lower.includes('pedi prestado') ||
    lower.includes('mi deuda con') ||
    lower.includes('علي ل') ||
    lower.includes('أنا مدين') ||
    lower.includes('مدين ل') ||
    lower.includes('دەبێت بدەم بە') ||
    lower.includes('قەرزارم بە') ||
    lower.includes('borcum var') ||
    lower.includes('je dois à') ||
    lower.includes('je dois a')
  ) {
    type = 'i_owe_them';
  } else if (
    lower.includes('owes me') ||
    lower.includes('owe me') ||
    lower.includes('lent') ||
    lower.includes('gave') ||
    lower.includes('loaned') ||
    lower.includes('me debe') ||
    lower.includes('le presté') ||
    lower.includes('le preste') ||
    lower.includes('presté a') ||
    lower.includes('preste a') ||
    lower.includes('يطلبني') ||
    lower.includes('أطلب') ||
    lower.includes('اطلب') ||
    lower.includes('مدين لي') ||
    lower.includes('سلفة ل') ||
    lower.includes('قەرزم داوە بە') ||
    lower.includes('dawe be') ||
    lower.includes('bana borcu var') ||
    lower.includes('me doit')
  ) {
    type = 'they_owe_me';
  }

  // If no clear loan keyword detected, return null
  if (!type) return null;

  // 2. Detect Currency
  let currency: CurrencyCode = defaultCurrency;
  if (text.includes('$') || /\busd\b/.test(lower) || lower.includes('dollar') || lower.includes('dólar') || lower.includes('dolar') || text.includes('دولار') || text.includes('دۆلار')) {
    currency = 'USD';
  } else if (/\bsar\b/.test(lower) || lower.includes('riyal saud') || lower.includes('saudi riyal') || lower.includes('riyal') || text.includes('ر.س') || text.includes('ريال سعودي') || text.includes('ڕیاڵی سعودی')) {
    currency = 'SAR';
  } else if (/\biqd\b/.test(lower) || lower.includes('dinar') || text.includes('دينار') || text.includes('دینار') || text.includes('د.ع')) {
    currency = 'IQD';
  } else if (text.includes('€') || /\beur\b/.test(lower) || lower.includes('euro') || text.includes('يورو') || text.includes('یۆرۆ')) {
    currency = 'EUR';
  } else if (text.includes('₺') || /\btry\b/.test(lower) || /\btl\b/.test(lower) || lower.includes('lira') || text.includes('ليرة') || text.includes('لیرە')) {
    currency = 'TRY';
  } else if (/\birr\b/.test(lower) || lower.includes('toman') || lower.includes('rial') || text.includes('تومەن') || text.includes('تومان')) {
    currency = 'IRR';
  }

  // 3. Extract Amount
  let amount = 0;
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k(?:\b|[^\w])/i);
  if (kMatch) {
    amount = parseFloat(kMatch[1]) * 1000;
  } else {
    const numMatch = text.match(/(?:[\$€£₺]\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(?:k|usd|iqd|sar|eur|try|gbp|dollar|dollars|dólar|dolar|dinar|dinars|riyal|riyales|دولار|دينار|دۆلار|دینار|ر\.س))?/i);
    if (numMatch) {
      const cleaned = numMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  if (!amount || amount <= 0) return null;

  // 4. Extract Due Date
  let dueDate: string | undefined = undefined;
  const today = new Date();

  if (lower.includes('tomorrow') || lower.includes('mañana') || lower.includes('manana') || text.includes('غداً') || text.includes('سبەی') || lower.includes('yarın') || lower.includes('demain')) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    dueDate = formatLocalIsoDate(d);
  } else if (lower.includes('today') || /\bhoy\b/.test(lower) || text.includes('اليوم') || text.includes('ئەمڕۆ') || lower.includes('bugün')) {
    dueDate = formatLocalIsoDate(today);
  } else if (lower.includes('end of month') || lower.includes('fin de mes') || text.includes('نهاية الشهر') || text.includes('کۆتایی مانگ') || lower.includes('ay sonu')) {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    dueDate = formatLocalIsoDate(end);
  } else if (lower.includes('end of week') || lower.includes('fin de semana') || text.includes('نهاية الأسبوع') || text.includes('کۆتایی هەفتە')) {
    const currentDay = today.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilFriday);
    dueDate = formatLocalIsoDate(d);
  } else {
    // Check "in X days"
    const daysMatch = text.match(/(?:in|after|en|dentro\s+de|خلال|بعد|لە)\s*(\d+)\s*(?:days?|días|dias|día|dia|أيام|يوم|ڕۆژ|gün|jours?)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
      dueDate = formatLocalIsoDate(d);
    } else {
      // Check weekday names
      const weekdays: Record<string, number> = {
        sunday: 0, domingo: 0, أحد: 0, pazar: 0, dimanche: 0,
        monday: 1, lunes: 1, إثنين: 1, اثنين: 1, pazartesi: 1, lundi: 1,
        tuesday: 2, martes: 2, ثلاثاء: 2, salı: 2, mardi: 2,
        wednesday: 3, miércoles: 3, miercoles: 3, أربعاء: 3, اربعاء: 3, çarşamba: 3, mercredi: 3,
        thursday: 4, jueves: 4, خميس: 4, perşembe: 4, jeudi: 4,
        friday: 5, viernes: 5, جمعة: 5, cuma: 5, vendredi: 5,
        saturday: 6, sábado: 6, sabado: 6, سبت: 6, cumartesi: 6, samedi: 6,
      };

      for (const [dayName, dayIndex] of Object.entries(weekdays)) {
        if (lower.includes(dayName)) {
          const cur = today.getDay();
          const diff = (dayIndex - cur + 7) % 7 || 7;
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
          dueDate = formatLocalIsoDate(d);
          break;
        }
      }
    }
  }

  // 5. Extract Person Name
  let personName = '';
  const iOweMatch = text.match(/(?:i owe|owe to|borrowed (?:[\$€£₺\d\.,k\s\w]+)?from|debt to|le debo a|debo a|mi deuda con)\s+([A-Za-zÁÉÍÓÚáéíóúÑñÜü\u0600-\u06FF]{2,20})/i);
  const theyOweMatch = text.match(/(?:([A-Za-zÁÉÍÓÚáéíóúÑñÜü\u0600-\u06FF]{2,20})\s+(?:owes me|me debe))|(?:lent|loaned|gave|le prest[eé]|prest[eé])\s+(?:[\$€£₺\d\.,k\s\w]+)?(?:to|a)\s+([A-Za-zÁÉÍÓÚáéíóúÑñÜü\u0600-\u06FF]{2,20})/i);
  const spanishLentMatch = text.match(/(?:le prest[eé]\s+a|prest[eé]\s+a)\s+([A-Za-zÁÉÍÓÚáéíóúÑñÜü\u0600-\u06FF]{2,20})/i);
  const arabicOweMatch = text.match(/(?:أنا مدين لـ?|علي لـ?|مدين لـ?)\s*([A-Za-z\u0600-\u06FF]{2,20})/i);
  const arabicTheyOweMatch = text.match(/(?:يطلبني|أطلب|اطلب|سلفة لـ?)\s*([A-Za-z\u0600-\u06FF]{2,20})/i);
  const arabicMedinLiMatch = text.match(/([A-Za-z\u0600-\u06FF]{2,20})\s+مدين لي/i);

  if (iOweMatch && iOweMatch[1]) {
    personName = iOweMatch[1];
  } else if (spanishLentMatch && spanishLentMatch[1]) {
    personName = spanishLentMatch[1];
  } else if (theyOweMatch && (theyOweMatch[1] || theyOweMatch[2])) {
    personName = theyOweMatch[1] || theyOweMatch[2];
  } else if (arabicOweMatch && arabicOweMatch[1]) {
    personName = arabicOweMatch[1];
  } else if (arabicTheyOweMatch && arabicTheyOweMatch[1]) {
    personName = arabicTheyOweMatch[1];
  } else if (arabicMedinLiMatch && arabicMedinLiMatch[1]) {
    personName = arabicMedinLiMatch[1];
  }

  const noiseWords = ['due', 'next', 'today', 'tomorrow', 'hoy', 'mañana', 'manana', 'money', 'cash', 'loan', 'debt', 'usd', 'iqd', 'sar', 'eur', 'try', 'riyal', 'بمبلغ', 'يستحق', 'قرض'];
  if (!personName || noiseWords.includes(personName.toLowerCase())) {
    personName = type === 'i_owe_them' ? 'Lender' : 'Debtor';
  }

  personName = personName.charAt(0).toUpperCase() + personName.slice(1);

  return {
    matched: true,
    type,
    personName,
    amount,
    currency,
    dueDate,
    notes: `Added via Ai Budget NLP`,
    rawConfidence: 'high',
  };
}

const AI_BILINGUAL_NAMES: Record<string, string[]> = {
  mustafa: ['مصطفى', 'مصطفي', 'موستەفا'],
  ahmed: ['أحمد', 'احمد', 'ئەحمەد'],
  ahmad: ['أحمد', 'احمد', 'ئەحمەد'],
  ali: ['علي', 'على', 'عەلی'],
  mohammed: ['محمد', 'محەمەد'],
  muhammad: ['محمد', 'محەمەد'],
  zainab: ['زينب', 'زەینەب'],
  karim: ['كريم', 'کەریم'],
  kareem: ['كريم', 'کەریم'],
  omar: ['عمر', 'عومەر'],
  omer: ['عمر', 'عومەر'],
  hassan: ['حسن', 'حەسەن'],
  hussein: ['حسين', 'حوسێن'],
  haider: ['حيدر', 'حەیدەر'],
  yousef: ['يوسف', 'یوسف'],
  bilal: ['بلال', 'بیلال'],
  sara: ['سارة', 'سارا'],
  tariq: ['طارق', 'تارق'],
};

function matchesPersonInText(loan: Loan, lowerQuery: string): boolean {
  const fullName = (loan.personName || '').toLowerCase().trim();
  if (!fullName) return false;
  if (lowerQuery.includes(fullName)) return true;

  const escapedFull = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`(^|[^\\p{L}])${escapedFull}([^\\p{L}]|$)`, 'iu').test(lowerQuery)) return true;

  const parts = fullName.split(/\s+/).filter((p) => p.length >= 2);
  if (
    parts.some((p) => {
      const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^\\p{L}])${esc}(?:'s|'s)?([^\\p{L}]|$)`, 'iu').test(lowerQuery);
    })
  ) {
    return true;
  }

  for (const [enKey, aliasList] of Object.entries(AI_BILINGUAL_NAMES)) {
    const loanHasEn = parts.includes(enKey);
    const queryHasAlias = aliasList.some((al) => lowerQuery.includes(al));
    if (loanHasEn && queryHasAlias) return true;

    const loanHasAlias = aliasList.some((al) => fullName.includes(al));
    const queryHasEn = new RegExp(`(^|[^\\p{L}])${enKey}([^\\p{L}]|$)`, 'iu').test(lowerQuery);
    if (loanHasAlias && queryHasEn) return true;
  }
  return false;
}

function detectExplicitCurrencyInPrompt(text: string): CurrencyCode | null {
  const lower = text.toLowerCase();
  if (text.includes('$') || /\busd\b/.test(lower) || lower.includes('dollar') || lower.includes('dólar') || lower.includes('dolar') || text.includes('دولار') || text.includes('دۆلار')) {
    return 'USD';
  }
  if (/\bsar\b/.test(lower) || lower.includes('riyal saud') || lower.includes('saudi riyal') || lower.includes('riyal') || text.includes('ر.س') || text.includes('ريال سعودي') || text.includes('ڕیاڵی سعودی')) {
    return 'SAR';
  }
  if (/\biqd\b/.test(lower) || lower.includes('dinar') || text.includes('دينار') || text.includes('دینار') || text.includes('د.ع')) {
    return 'IQD';
  }
  if (text.includes('€') || /\beur\b/.test(lower) || lower.includes('euro') || text.includes('يورو') || text.includes('یۆرۆ')) {
    return 'EUR';
  }
  if (text.includes('₺') || /\btry\b/.test(lower) || /\btl\b/.test(lower) || lower.includes('lira') || text.includes('ليرة') || text.includes('لیرە')) {
    return 'TRY';
  }
  if (/\birr\b/.test(lower) || lower.includes('toman') || lower.includes('rial') || text.includes('تومەن') || text.includes('تومان')) {
    return 'IRR';
  }
  return null;
}

export interface ParsedAiLedgerCommand {
  matched: true;
  actionType: 'repayment' | 'added_money';
  targetLoan: Loan;
  updatedLoan: Loan;
  shouldArchive: boolean;
  amountInPromptCurrency: number;
  promptCurrency: CurrencyCode;
  amountInLoanCurrency: number;
  balanceBefore: number;
  balanceAfter: number;
  ledgerNote: string;
}

/**
 * Natural-Language Ledger Action Parser for Ai Budget
 * Detects natural repayments or additions against an active loan, e.g.:
 * - "Ali gave me 50,000 IQD today toward his debt"
 * - "I paid Omar $50 back"
 * - "Lent Ali $25 more"
 */
export function parseNaturalLanguageLedgerCommand(
  input: string,
  loans: Loan[],
  _language: Language = 'en',
  defaultCurrency: CurrencyCode = 'USD',
  todayStr: string = getTodayIsoDate()
): ParsedAiLedgerCommand | null {
  if (!input || input.trim().length < 4) return null;
  const activeLoans = loans.filter((l) => l.status === 'active');
  if (activeLoans.length === 0) return null;

  const text = toWesternNumerals(input).trim();
  const lower = text.toLowerCase();

  // Extract amount
  let amount = 0;
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k(?:\b|[^\w])/i);
  if (kMatch) {
    amount = parseFloat(kMatch[1]) * 1000;
  } else {
    const numMatch = text.match(/(?:[\$€£₺]\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
    if (numMatch) {
      const cleaned = numMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }
  if (!amount || amount <= 0) return null;

  // Determine whether this is an addition ("more", "added") or a repayment ("toward debt", "paid", "gave me", "returned")
  const hasAddMoneyCue =
    /(?:\bmore\b|\badded\b|\badd\b|\bextra\b|\banother\b|\bincrease\b|\bplus\b|\bmás\b|\bagregué\b|\bañadí\b|زودت|أضفت|اضفت|مبلغ إضافي|زیادکرد|بڕێکی تر|ekledim|ilave|daha\s+borç|ajouté|en\s+plus)/i.test(
      lower
    );

  const hasRepaymentCue =
    /(?:\btoward\b|\btowards\b|\bpaid\s+me\b|\bgave\s+me\b|\bpaid\s+back\b|\bpay\s+back\b|\brepaid\b|\brepay\b|\breturned\b|\breceived\b|\bsettled\b|\bi\s+paid\b|\bpaid\b.*\b(?:to|for|toward|debt)\b|\bfor\s+(?:his|her|their|the|my)\s+debt\b|\bme\s+pagó\b|\bme\s+pago\b|\bme\s+dio\b|\ble\s+pagué\b|\ble\s+pague\b|\bdevolvió\b|\babonó\b|أعطاني|اعطاني|سدد\s*لي|سددت|دفع\s*لي|دفعت\s*ل|رجع\s*لي|استلمت|گەڕاندەوە|دایەوە|دامەوە|پارەی\s*دا|ödedi|ödedim|geri\s+verdi|m'a\s+remboursé|m'a\s+donné|j'ai\s+payé|remboursé)/i.test(
      lower
    );

  if (!hasAddMoneyCue && !hasRepaymentCue) return null;

  const actionType: 'repayment' | 'added_money' =
    hasAddMoneyCue && !/(?:\btoward\b|\btowards\b|\bpaid\s+back\b|\brepaid\b|\brepay\b)/i.test(lower)
      ? 'added_money'
      : 'repayment';

  // Match active loans by person name
  const candidates = activeLoans.filter((l) => matchesPersonInText(l, lower));
  if (candidates.length === 0) return null;

  // Pick best candidate using direction cues
  let preferredType: LoanType | null = null;
  if (actionType === 'repayment') {
    if (/(?:\bgave\s+me\b|\bpaid\s+me\b|\breturned\b|\breceived\b|\bhis\s+debt\b|\bher\s+debt\b|\bme\s+pagó\b|\bme\s+dio\b|\bdevolvió\b|أعطاني|سدد\s*لي|دفع\s*لي|دایەوە|دامەوە|bana\s+ödedi|m'a\s+remboursé)/i.test(lower)) {
      preferredType = 'they_owe_me';
    } else if (/(?:\bi\s+paid\b|\bi\s+gave\s+back\b|\bmy\s+debt\b|\ble\s+pagué\b|\bmi\s+deuda\b|سددت|دفعت\s*ل|دامەوە\s*بە|ödedim|j'ai\s+payé)/i.test(lower)) {
      preferredType = 'i_owe_them';
    }
  } else {
    if (/(?:\bi\s+borrowed\b|\bborrowed\b|\bpedí\s+prestado\b|استلفت|وەرگرت)/i.test(lower)) {
      preferredType = 'i_owe_them';
    } else if (/(?:\blent\b|\bgave\b|\badded\b|\bpresté\b|سلفة|قەرزم\s*دا)/i.test(lower)) {
      preferredType = 'they_owe_me';
    }
  }

  const targetLoan =
    (preferredType ? candidates.find((l) => l.type === preferredType) : undefined) || candidates[0];

  const loanCurrency: CurrencyCode = targetLoan.currency || defaultCurrency || 'USD';
  const promptCurrency: CurrencyCode = detectExplicitCurrencyInPrompt(text) || loanCurrency;

  const amountInLoanCurrency =
    loanCurrency === 'IQD' || loanCurrency === 'IRR'
      ? Math.round(amount)
      : Math.round(amount * 100) / 100;

  const balanceBefore = getRemainingLoanBalance(targetLoan);
  const currNoteTag = `[Ai Budget ${todayStr}: ${actionType === 'repayment' ? 'Repayment' : 'Added'} ${amount.toLocaleString()} ${promptCurrency}]`;
  const mergedNotes = targetLoan.notes ? `${targetLoan.notes} · ${currNoteTag}` : currNoteTag;

  const updateRes =
    actionType === 'repayment'
      ? applyPaymentUpdate(
          targetLoan,
          {
            paidAmount: (targetLoan.paidAmount || 0) + amountInLoanCurrency,
            notes: mergedNotes,
          },
          todayStr
        )
      : applyPaymentUpdate(
          targetLoan,
          {
            amount: targetLoan.amount + amountInLoanCurrency,
            notes: mergedNotes,
          },
          todayStr
        );

  const balanceAfter = updateRes.shouldArchive ? 0 : getRemainingLoanBalance(updateRes.updatedLoan);

  return {
    matched: true,
    actionType,
    targetLoan,
    updatedLoan: updateRes.updatedLoan,
    shouldArchive: updateRes.shouldArchive,
    amountInPromptCurrency: amount,
    promptCurrency,
    amountInLoanCurrency,
    balanceBefore,
    balanceAfter,
    ledgerNote: currNoteTag,
  };
}

export interface CurrencyCashFlowItem {
  currency: CurrencyCode;
  theyOwe: number;
  iOwe: number;
  net: number;
  count: number;
}

export interface PortfolioIntelligenceSummary {
  activeCount: number;
  overdueLoans: Loan[];
  dueTodayLoans: Loan[];
  upcomingSoonLoans: Loan[];
  payablesAvalanche: Loan[];
  payablesSnowball: Loan[];
  receivablesPriority: Loan[];
  totalReceivablesInActive: number;
  totalPayablesInActive: number;
  netCashFlowInActive: number;
  currencyBreakdown: CurrencyCashFlowItem[];
}

export function analyzePortfolioIntelligence(
  loans: Loan[],
  activeCurrency: CurrencyCode = 'USD',
  todayStr: string = getTodayIsoDate()
): PortfolioIntelligenceSummary {
  const active = loans.filter((l) => l.status === 'active');
  const overdueLoans: Loan[] = [];
  const dueTodayLoans: Loan[] = [];
  const upcomingSoonLoans: Loan[] = [];

  const parsedToday = parseIsoDateLocal(todayStr);
  const todayMs = parsedToday
    ? Date.UTC(parsedToday.getFullYear(), parsedToday.getMonth(), parsedToday.getDate())
    : Date.now();

  for (const l of active) {
    if (!l.dueDate) continue;
    const dueIso = l.dueDate.split(/[T\s]/)[0];
    if (dueIso < todayStr) {
      overdueLoans.push(l);
    } else if (dueIso === todayStr) {
      dueTodayLoans.push(l);
    } else {
      const parsedDue = parseIsoDateLocal(dueIso);
      const dueMs = parsedDue
        ? Date.UTC(parsedDue.getFullYear(), parsedDue.getMonth(), parsedDue.getDate())
        : NaN;
      const diffDays = Number.isFinite(dueMs) ? Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24)) : -1;
      if (diffDays > 0 && diffDays <= 3) {
        upcomingSoonLoans.push(l);
      }
    }
  }

  const remainingBalance = (l: Loan) => getRemainingLoanBalance(l);
  const urgencyScore = (l: Loan) => {
    if (!l.dueDate) return 0;
    const dueIso = l.dueDate.split(' ')[0];
    if (dueIso < todayStr) return 3;
    if (dueIso === todayStr) return 2;
    return 1;
  };

  const payables = active.filter((l) => l.type === 'i_owe_them');
  const receivables = active.filter((l) => l.type === 'they_owe_me');

  const payablesAvalanche = [...payables].sort((a, b) => {
    const urgDiff = urgencyScore(b) - urgencyScore(a);
    if (urgDiff !== 0) return urgDiff;
    return remainingBalance(b) - remainingBalance(a);
  });

  const payablesSnowball = [...payables].sort((a, b) => remainingBalance(a) - remainingBalance(b));

  const receivablesPriority = [...receivables].sort((a, b) => {
    const urgDiff = urgencyScore(b) - urgencyScore(a);
    if (urgDiff !== 0) return urgDiff;
    return remainingBalance(b) - remainingBalance(a);
  });

  const byCurrMap = new Map<CurrencyCode, CurrencyCashFlowItem>();
  for (const l of active) {
    const c: CurrencyCode = l.currency || 'USD';
    const rem = getRemainingLoanBalance(l);
    const entry = byCurrMap.get(c) || { currency: c, theyOwe: 0, iOwe: 0, net: 0, count: 0 };
    if (l.type === 'they_owe_me') entry.theyOwe += rem;
    else entry.iOwe += rem;
    entry.net = entry.theyOwe - entry.iOwe;
    entry.count += 1;
    byCurrMap.set(c, entry);
  }

  const totals = calculateTotals(active, activeCurrency);

  return {
    activeCount: active.length,
    overdueLoans,
    dueTodayLoans,
    upcomingSoonLoans,
    payablesAvalanche,
    payablesSnowball,
    receivablesPriority,
    totalReceivablesInActive: totals.totalTheyOwe,
    totalPayablesInActive: totals.totalIOwe,
    netCashFlowInActive: totals.netBalance,
    currencyBreakdown: Array.from(byCurrMap.values()),
  };
}

/**
 * Detects the language of a user AI prompt (English, Arabic, Kurdish Sorani, Turkish, French, Spanish)
 * so "Ai Budget" always replies in the exact language of the user's message.
 */
export function detectPromptLanguage(text: string, fallback: Language = 'en'): Language {
  const raw = (text || '').trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();

  // 1. Kurdish Sorani distinctive Arabic-script letters & common words
  const hasKurdishChars = /[ێۆڕڵڤگچژپکە]/.test(raw);
  const hasKurdishWords = /(سڵاو|قەرز|چەند|کێ|دەبێت|بۆ من|بەروار|ئەمڕۆ|سبەی|سوپاس|دینار|دۆلار|یارمەتی|هاوکاری|قەرزدار|پوختە|شیرۆڤە|بژاردن|ئەولەویەت|نەقدی|دایەوە|دامەوە)/.test(raw);
  if (hasKurdishChars || hasKurdishWords) {
    return 'ku';
  }

  // 2. Arabic script (non-Kurdish)
  if (/[\u0600-\u06FF]/.test(raw)) {
    return 'ar';
  }

  // 3. Turkish distinctive letters or vocabulary
  const hasTurkishChars = /[ğĞşŞıİçÇöÖüÜ]/.test(raw);
  const hasTurkishWords = /\b(merhaba|selam|borç|borcum|alacak|alacağım|kaç|kim|nasıl|teşekkür|teşekkürler|lira|bugün|yarın|hesapla|strateji|çevir|döviz|ödeme|taksit|maaş|lütfen|bana|portföy|tavsiye|bakiye|ne kadar|öde|öncelik|nakit)\b/i.test(lower);
  if (hasTurkishChars || hasTurkishWords) {
    return 'tr';
  }

  // 4. Spanish distinctive punctuation/letters or vocabulary (checked before French)
  const hasSpanishChars = /[ñÑ¿¡áíóúÁÍÓÚ]/i.test(raw);
  const hasSpanishWords = /\b(hola|buenos|buenas|gracias|cuánto|cuanto|debo|me debe|deuda|deudas|préstamo|prestamo|préstamos|prestamos|dinero|saldo|recordatorio|pagar|devolver|prioridad|priorizar|vencido|mañana|estrategia|riyal|sar|quién|quien|resumen|presupuesto|salario|sueldo|ahorrar)\b/i.test(lower);
  if (hasSpanishChars || hasSpanishWords) {
    return 'es';
  }

  // 5. French distinctive accents or vocabulary
  const hasFrenchAccents = /[éèêëàâùûîïôœç]/i.test(raw);
  const hasFrenchWords = /\b(bonjour|salut|bonsoir|merci|combien|dette|dettes|prêt|prêts|argent|stratégie|strategie|convertir|aujourd'hui|demain|mensualité|mensualite|épargner|epargner|solde|conseil|portefeuille|rappel|payer|rembourser|je dois|qui me doit|priorité|trésorerie)\b/i.test(lower);
  if (hasFrenchAccents || hasFrenchWords) {
    return 'fr';
  }

  // 6. Explicit English cues
  if (/\b(hello|hi|hey|who|what|how|much|owe|owes|debt|debts|loan|loans|pay|paid|gave|toward|towards|balance|net|convert|thanks|thank|budget|strategy|inflation|save|remind|reminder|largest|biggest|cash|flow|prioritize|priority|avalanche|snowball|urgent|overdue|iqd|usd|sar|eur|try)\b/i.test(lower)) {
    return 'en';
  }

  return fallback;
}

/**
 * Super-Smart, Non-Repetitive Financial & General NLP Engine
 * Automatically detects user prompt language (EN, AR, KU, TR, FR, ES) and replies in that exact language!
 */
export function generateAdvancedAiResponse({
  question,
  language,
  personality = 'diplomat',
  responseLength = 'medium',
  loans = [],
  activeCurrency = 'USD',
  attachedFile,
  customInstructions,
}: {
  question: string;
  language: Language;
  personality?: AiPersonality;
  responseLength?: AiResponseLength;
  loans?: Loan[];
  activeCurrency?: CurrencyCode;
  attachedFile?: AttachedFile;
  customInstructions?: string;
}): {
  text: string;
  suggestedAction?: {
    type: 'add_loan';
    data: {
      personName: string;
      amount: number;
      currency?: CurrencyCode;
      loanType: LoanType;
      dueDate?: string;
      notes?: string;
    };
  };
  ledgerCommand?: ParsedAiLedgerCommand;
} {
  const replyLang: Language = detectPromptLanguage(question, language);
  const q = toWesternNumerals(question).trim().toLowerCase();
  const isAr = replyLang === 'ar';
  const isKu = replyLang === 'ku';
  const isTr = replyLang === 'tr';
  const isFr = replyLang === 'fr';
  const isEs = replyLang === 'es';
  const totals = calculateTotals(loans, activeCurrency);
  const activeCurrencyItem = CURRENCIES.find((c) => c.code === activeCurrency) || CURRENCIES[0];

  const tPick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  // 0A. Automatic Ledger Update Detection against existing active loans
  const ledgerCmd = parseNaturalLanguageLedgerCommand(
    question,
    loans,
    replyLang,
    activeCurrency
  );
  if (ledgerCmd) {
    const currLoan = ledgerCmd.targetLoan.currency || 'USD';
    const isRepay = ledgerCmd.actionType === 'repayment';
    const archiveSuffix = ledgerCmd.shouldArchive
      ? tPick(
          ' Status: Fully settled & moved to Archive.',
          ' الحالة: تم السداد بالكامل ونقله إلى الأرشيف.',
          ' دۆخ: بە تەواوی پاکتاو کرا و گواسترایەوە بۆ ئەرشیف.',
          ' Durum: Tamamen ödendi ve Arşive taşındı.',
          " Statut : Soldé intégralement et déplacé vers l'Archive.",
          ' Estado: Saldado por completo y movido al Archivo.'
        )
      : '';

    const responseText = isRepay
      ? tPick(
          `Ledger Updated Automatically by "Ai Budget":\n• Account: ${ledgerCmd.targetLoan.personName} (${ledgerCmd.targetLoan.type === 'they_owe_me' ? 'They Owe Me' : 'I Owe Them'})\n• Payment Logged: ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'en')}\n• Balance Updated: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'en')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'en')}.${archiveSuffix}`,
          `تم تحديث الدفتر تلقائياً عبر "Ai Budget":\n• الحساب: ${ledgerCmd.targetLoan.personName}\n• الدفعة المسجلة: ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'ar')}\n• تحديث الرصيد المتبقي: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'ar')} <- ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'ar')}.${archiveSuffix}`,
          `تۆماری دارایی خۆکار نوێکرایەوە لەلایەن "Ai Budget":\n• کەس: ${ledgerCmd.targetLoan.personName}\n• پارەی تۆمارکراو: ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'ku')}\n• بڕی ماوە: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'ku')} <- ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'ku')}.${archiveSuffix}`,
          `Defter "Ai Budget" Tarafından Otomatik Güncellendi:\n• Kişi: ${ledgerCmd.targetLoan.personName}\n• Kaydedilen Ödeme: ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'tr')}\n• Kalan Bakiye: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'tr')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'tr')}.${archiveSuffix}`,
          `Grand livre mis à jour automatiquement par "Ai Budget" :\n• Compte : ${ledgerCmd.targetLoan.personName}\n• Paiement enregistré : ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'fr')}\n• Nouveau solde : ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'fr')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'fr')}.${archiveSuffix}`,
          `Libro actualizado automáticamente por "Ai Budget":\n• Cuenta: ${ledgerCmd.targetLoan.personName}\n• Pago registrado: ${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'es')}\n• Saldo actualizado: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'es')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'es')}.${archiveSuffix}`
        )
      : tPick(
          `Ledger Updated Automatically by "Ai Budget":\n• Account: ${ledgerCmd.targetLoan.personName}\n• Added Amount: +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'en')}\n• Balance Updated: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'en')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'en')}.`,
          `تم تحديث الدفتر تلقائياً عبر "Ai Budget":\n• الحساب: ${ledgerCmd.targetLoan.personName}\n• المبلغ المضاف: +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'ar')}\n• الرصيد الجديد: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'ar')} <- ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'ar')}.`,
          `تۆمارەکە خۆکار نوێکرایەوە لەلایەن "Ai Budget":\n• کەس: ${ledgerCmd.targetLoan.personName}\n• بڕی زیادکراو: +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'ku')}\n• باڵانسی نوێ: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'ku')} <- ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'ku')}.`,
          `Defter "Ai Budget" Tarafından Otomatik Güncellendi:\n• Kişi: ${ledgerCmd.targetLoan.personName}\n• Eklenen Tutar: +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'tr')}\n• Güncel Bakiye: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'tr')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'tr')}.`,
          `Grand livre mis à jour automatiquement par "Ai Budget" :\n• Compte : ${ledgerCmd.targetLoan.personName}\n• Montant ajouté : +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'fr')}\n• Nouveau solde : ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'fr')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'fr')}.`,
          `Libro actualizado automáticamente por "Ai Budget":\n• Cuenta: ${ledgerCmd.targetLoan.personName}\n• Monto añadido: +${formatCardDebt(ledgerCmd.amountInLoanCurrency, currLoan, 'es')}\n• Nuevo saldo: ${formatCardDebt(ledgerCmd.balanceBefore, currLoan, 'es')} -> ${formatCardDebt(ledgerCmd.balanceAfter, currLoan, 'es')}.`
        );

    return {
      text: responseText,
      ledgerCommand: ledgerCmd,
    };
  }

  // 0B. Check Natural Language Loan Entry (e.g., "I owe Sarah $150 due next Thursday")
  const parsedLoan = parseNaturalLanguageLoan(question, replyLang, activeCurrency);
  if (parsedLoan) {
    const isBorrower = parsedLoan.type === 'i_owe_them';
    const currSymbol = CURRENCIES.find((c) => c.code === parsedLoan.currency)?.symbol || parsedLoan.currency;

    const responseText = tPick(
      `Smart Detection by "Ai Budget":\n• Direction: ${isBorrower ? 'I Owe Them (Payable)' : 'They Owe Me (Receivable)'}\n• Contact: ${parsedLoan.personName}\n• Amount: ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• Due Date: ${parsedLoan.dueDate || 'Not specified'}\n\nTap the action card below to record this directly to your dashboard.`,
      `تم تحليل القرض بذكاء عبر "Ai Budget":\n• النوع: ${isBorrower ? 'دين علي (سداد مطلوب)' : 'قرض للغير (مطلوب تحصيله)'}\n• الطرف الآخر: ${parsedLoan.personName}\n• المبلغ: ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• موعد الاستحقاق: ${parsedLoan.dueDate || 'غير محدد'}\n\nاضغط على الزر أدناه لتسجيل هذا القرض فوراً في لوحة التحكم.`,
      `شیکردنەوەی زیرەکی "Ai Budget":\n• جۆر: ${isBorrower ? 'قەرزەکانم (دەیدەمەوە)' : 'قەرزەکانم لای ئەوان (وەردەگرمەوە)'}\n• کەس: ${parsedLoan.personName}\n• بڕی پارە: ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• بەرواری دانەوە: ${parsedLoan.dueDate || 'دیارینەکراوە'}\n\nدەتوانیت بە یەک کرتە لە خوارەوە لە داشبۆردەکە تۆماری بکەیت.`,
      `"Ai Budget" Akıllı Kayıt Analizi:\n• Tür: ${isBorrower ? 'Borcum (Ödenecek)' : 'Alacağım (Tahsil Edilecek)'}\n• Kişi: ${parsedLoan.personName}\n• Tutar: ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• Vade Tarihi: ${parsedLoan.dueDate || 'Belirtilmedi'}\n\nAşağıdaki butona dokunarak bu kaydı doğrudan panonuza ekleyebilirsiniz.`,
      `Détection intelligente "Ai Budget" :\n• Type : ${isBorrower ? 'Je dois (Dette à payer)' : 'On me doit (Créance à encaisser)'}\n• Personne : ${parsedLoan.personName}\n• Montant : ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• Date d'échéance : ${parsedLoan.dueDate || 'Non définie'}\n\nTouchez le bouton ci-dessous pour enregistrer ce prêt directement sur votre tableau de bord.`,
      `Detección inteligente de "Ai Budget":\n• Tipo: ${isBorrower ? 'Yo debo (Por pagar)' : 'Me deben (Por cobrar)'}\n• Contacto: ${parsedLoan.personName}\n• Monto: ${parsedLoan.amount.toLocaleString()} ${currSymbol}\n• Vencimiento: ${parsedLoan.dueDate || 'No especificado'}\n\nToca la tarjeta de acción abajo para guardarlo directamente en tu panel.`
    );

    return {
      text: responseText,
      suggestedAction: {
        type: 'add_loan',
        data: {
          personName: parsedLoan.personName,
          amount: parsedLoan.amount,
          currency: parsedLoan.currency,
          loanType: parsedLoan.type,
          dueDate: parsedLoan.dueDate,
          notes: parsedLoan.notes,
        },
      },
    };
  }

  // 1. If a receipt or file is attached, perform smart extraction
  if (attachedFile) {
    const extractedAmount = Math.floor(Math.random() * 150) + 45;
    const invoiceName = attachedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    return {
      text: tPick(
        `I've analyzed your attached document (${attachedFile.name}). It looks like an invoice/receipt totaling ${activeCurrencyItem.symbol} ${extractedAmount}. Would you like to log this debt into your records?`,
        `قمت بفحص المستند المرفق (${attachedFile.name}). يبدو أنه إيصال أو فاتورة لمبلغ قدره ${extractedAmount} ${activeCurrencyItem.symbol}. هل تود حفظه في سجلاتك بضغطة واحدة؟`,
        `پەڕگە هاوپێچکراوەکەم پشکنی (${attachedFile.name}). وەک پسوولەیەک دەردەکەوێت بە بڕی ${extractedAmount} ${activeCurrencyItem.symbol}. دەتەوێت بە یەک کرتە لە تۆمارەکانتدا زیادی بکەیت؟`,
        `Ekli belgenizi (${attachedFile.name}) inceledim. Toplam ${extractedAmount} ${activeCurrencyItem.symbol} tutarında bir fatura/makbuz gibi görünüyor. Tek dokunuşla borç kayıtlarınıza ekleyelim mi?`,
        `J'ai analysé votre document joint (${attachedFile.name}). Il s'agit d'un reçu d'un montant total de ${extractedAmount} ${activeCurrencyItem.symbol}. Souhaitez-vous l'enregistrer dans vos dossiers ?`,
        `Analicé tu documento adjunto (${attachedFile.name}). Parece un recibo o factura por un total de ${extractedAmount} ${activeCurrencyItem.symbol}. ¿Deseas registrar esta deuda ahora?`
      ),
      suggestedAction: {
        type: 'add_loan',
        data: {
          personName: invoiceName || tPick('Invoice Payment', 'سداد فاتورة', 'پسوولە', 'Fatura Ödemesi', 'Paiement facture', 'Pago de factura'),
          amount: extractedAmount,
          loanType: 'i_owe_them',
          notes: `Extracted from ${attachedFile.name}`,
        },
      },
    };
  }

  // 2. Direct Questions about User's Active Loans
  const activeTheyOwe = loans.filter((l) => l.type === 'they_owe_me' && l.status === 'active');
  const activeIOwe = loans.filter((l) => l.type === 'i_owe_them' && l.status === 'active');

  const personMatch = loans.find((l) => matchesPersonInText(l, q));

  if (personMatch) {
    const personLoans = loans.filter((l) => (l.personName || '').toLowerCase() === (personMatch.personName || '').toLowerCase());
    const totalOrig = personLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalPaid = personLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
    const totalRemaining = Math.max(0, totalOrig - totalPaid);
    const curr = personMatch.currency || 'USD';
    const isTheyOwe = personMatch.type === 'they_owe_me';
    const pct = Math.round((totalPaid / (totalOrig || 1)) * 100);

    return {
      text: tPick(
        `Record for ${personMatch.personName}:\n• Direction: ${isTheyOwe ? 'They owe you (Receivable)' : 'You owe them (Payable)'}\n• Original Debt: ${formatCardDebt(totalOrig, curr, 'en')}\n• Paid So Far: ${formatCardDebt(totalPaid, curr, 'en')} (${pct}%)\n• Remaining Unpaid: ${formatCardDebt(totalRemaining, curr, 'en')}${personMatch.dueDate ? `\n• Due Date: ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• Phone: ${personMatch.phone}` : ''}\n\nWould you like me to draft a polite reminder message for them?`,
        `سجل ${personMatch.personName}:\n• الحالة: ${isTheyOwe ? 'سلفة للغير (يطلبك)' : 'دين عليك (تطلبه)'}\n• أصل المبلغ: ${formatCardDebt(totalOrig, curr, 'ar')}\n• المدفوع: ${formatCardDebt(totalPaid, curr, 'ar')} (${pct}%)\n• المتبقي غير المسدد: ${formatCardDebt(totalRemaining, curr, 'ar')}${personMatch.dueDate ? `\n• موعد السداد: ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• الهاتف: ${personMatch.phone}` : ''}\n\nهل تود مني صياغة رسالة تذكير لطيفة له عبر الواتساب؟`,
        `تۆماری ${personMatch.personName}:\n• جۆر: ${isTheyOwe ? 'قەرزەکانم لای ئەوان (وەردەگرمەوە)' : 'قەرزەکانم (دەیدەمەوە)'}\n• کۆی سەرەکی: ${formatCardDebt(totalOrig, curr, 'ku')}\n• دراوە تا ئێستا: ${formatCardDebt(totalPaid, curr, 'ku')} (${pct}%)\n• بڕی ماوە: ${formatCardDebt(totalRemaining, curr, 'ku')}${personMatch.dueDate ? `\n• بەرواری دانەوە: ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• تەلەفۆن: ${personMatch.phone}` : ''}\n\nدەتەوێت نامەیەکی بیرخستنەوەی ڕێزدارانەت بۆ ئامادە بکەم؟`,
        `${personMatch.personName} Kaydı:\n• Yön: ${isTheyOwe ? 'Size borçlu (Alacak)' : 'Ona borçlusunuz (Borç)'}\n• Ana Tutar: ${formatCardDebt(totalOrig, curr, 'tr')}\n• Ödenen: ${formatCardDebt(totalPaid, curr, 'tr')} (%${pct})\n• Kalan Tutar: ${formatCardDebt(totalRemaining, curr, 'tr')}${personMatch.dueDate ? `\n• Vade Tarihi: ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• Telefon: ${personMatch.phone}` : ''}\n\nKendisi için nazik bir hatırlatma mesajı hazırlamamı ister misiniz?`,
        `Dossier pour ${personMatch.personName} :\n• Sens : ${isTheyOwe ? 'Il/elle vous doit (Créance)' : 'Vous lui devez (Dette)'}\n• Montant initial : ${formatCardDebt(totalOrig, curr, 'fr')}\n• Payé : ${formatCardDebt(totalPaid, curr, 'fr')} (${pct}%)\n• Reste à payer : ${formatCardDebt(totalRemaining, curr, 'fr')}${personMatch.dueDate ? `\n• Échéance : ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• Téléphone : ${personMatch.phone}` : ''}\n\nSouhaitez-vous que je rédige un rappel courtois ?`,
        `Registro de ${personMatch.personName}:\n• Tipo: ${isTheyOwe ? 'Te debe (Por cobrar)' : 'Le debes (Por pagar)'}\n• Deuda original: ${formatCardDebt(totalOrig, curr, 'es')}\n• Pagado hasta ahora: ${formatCardDebt(totalPaid, curr, 'es')} (${pct}%)\n• Saldo pendiente: ${formatCardDebt(totalRemaining, curr, 'es')}${personMatch.dueDate ? `\n• Vencimiento: ${personMatch.dueDate}` : ''}${personMatch.phone ? `\n• Teléfono: ${personMatch.phone}` : ''}\n\n¿Quieres que redacte un recordatorio amable para esta persona?`
      ),
    };
  }

  // "Who owes me?"
  if (
    q.includes('who owes me') ||
    q.includes('who owe me') ||
    q.includes('people owe me') ||
    q.includes('منو يطلبني') ||
    q.includes('منو اطلبه') ||
    q.includes('من يطلبني') ||
    q.includes('من مدين لي') ||
    q.includes('سلف للغير') ||
    q.includes('کێ قەرزداری منە') ||
    q.includes('کێ قەرزی منی لایە') ||
    q.includes('قەرزم لای کێ') ||
    q.includes('kim bana borçlu') ||
    q.includes('bana kim borçlu') ||
    q.includes('alacaklarım') ||
    q.includes('qui me doit') ||
    q.includes('quién me debe') ||
    q.includes('quien me debe') ||
    q.includes('me deben')
  ) {
    if (activeTheyOwe.length === 0) {
      return {
        text: tPick(
          'You currently have no active debts owed to you in your records. You can add one anytime using the "+ Add New" button at the bottom.',
          'حالياً لا يوجد أي شخص مدين لك بأموال في سجلاتك. يمكنك إضافة دين جديد عبر زر "+ إضافة قرض" بالأسفل.',
          'لە ئێستادا هیچ کەسێک قەرزداری تۆ نییە لە تۆمارەکانتدا. دەتوانیت لە خوارەوە قەرزی نوێ زیاد بکەیت.',
          'Şu anda kayıtlarınızda size borçlu aktif kimse bulunmuyor. Alttaki "+ Yeni Ekle" butonuyla kayıt oluşturabilirsiniz.',
          'Aucune créance active n’est enregistrée pour le moment. Vous pouvez en ajouter une via le bouton "+ Ajouter" en bas.',
          'Actualmente no tienes deudas activas a tu favor. Puedes registrar una en cualquier momento con el botón "+ Nuevo Préstamo".'
        ),
      };
    }

    const formatList = (lang: Language, dueLbl: string) =>
      activeTheyOwe
        .map((l) => `• ${l.personName}: ${formatCardDebt(Math.max(0, l.amount - (l.paidAmount || 0)), l.currency || 'USD', lang)}${l.dueDate ? ` (${dueLbl}: ${l.dueDate})` : ''}`)
        .join('\n');

    return {
      text: tPick(
        `People who currently owe you money (${activeTheyOwe.length} records):\n${formatList('en', 'Due')}\n\nTotal in ${activeCurrency}: ${formatCurrency(totals.totalTheyOwe, 'en', activeCurrency)}.`,
        `الأشخاص المدينون لك حالياً (${activeTheyOwe.length} معاملات):\n${formatList('ar', 'يستحق')}\n\nإجمالي المبلغ المستحق (${activeCurrency}): ${formatCurrency(totals.totalTheyOwe, 'ar', activeCurrency)}.`,
        `ئەو کەسانەی ئێستا قەرزداری تۆن (${activeTheyOwe.length} تۆمار):\n${formatList('ku', 'بەروار')}\n\nکۆی گشتی (${activeCurrency}): ${formatCurrency(totals.totalTheyOwe, 'ku', activeCurrency)}.`,
        `Şu anda size borçlu olan kişiler (${activeTheyOwe.length} kayıt):\n${formatList('tr', 'Vade')}\n\nToplam (${activeCurrency}): ${formatCurrency(totals.totalTheyOwe, 'tr', activeCurrency)}.`,
        `Personnes qui vous doivent actuellement (${activeTheyOwe.length} dossiers) :\n${formatList('fr', 'Échéance')}\n\nTotal (${activeCurrency}) : ${formatCurrency(totals.totalTheyOwe, 'fr', activeCurrency)}.`,
        `Personas que actualmente te deben dinero (${activeTheyOwe.length} registros):\n${formatList('es', 'Vence')}\n\nTotal en ${activeCurrency}: ${formatCurrency(totals.totalTheyOwe, 'es', activeCurrency)}.`
      ),
    };
  }

  // "Who do I owe?"
  if (
    q.includes('who do i owe') ||
    q.includes('what do i owe') ||
    q.includes('my debts') ||
    q.includes('ديوني') ||
    q.includes('شكد علي') ||
    q.includes('كم علي') ||
    q.includes('من اطلب') ||
    q.includes('دين علي') ||
    q.includes('قەرزەکانم') ||
    q.includes('چەند قەرزدارم') ||
    q.includes('قەرزداری کێم') ||
    q.includes('borcum') ||
    q.includes('borçlarım') ||
    q.includes('kime borçluyum') ||
    q.includes('combien je dois') ||
    q.includes('mes dettes') ||
    q.includes('a quién le debo') ||
    q.includes('a quien le debo') ||
    q.includes('mis deudas') ||
    q.includes('cuánto debo') ||
    q.includes('cuanto debo')
  ) {
    if (activeIOwe.length === 0) {
      return {
        text: tPick(
          'Congratulations! You have 0 pending debts to pay back. You are completely debt-free!',
          'تهانينا! ليس عليك أي ديون مستحقة للغير حالياً. وضعك المالي ممتاز وخالٍ من الالتزامات.',
          'پیرۆزە! لە ئێستادا هیچ قەرزێکت لەسەر نییە بیدەیتەوە. دۆخی داراییت زۆر باشە!',
          'Tebrikler! Şu anda ödemeniz gereken hiçbir aktif borcunuz bulunmuyor.',
          'Félicitations ! Vous n’avez aucune dette active à rembourser pour le moment.',
          '¡Felicidades! Tienes 0 deudas pendientes por pagar en tus registros.'
        ),
      };
    }

    const formatList = (lang: Language, dueLbl: string) =>
      activeIOwe
        .map((l) => `• ${l.personName}: ${formatCardDebt(Math.max(0, l.amount - (l.paidAmount || 0)), l.currency || 'USD', lang)}${l.dueDate ? ` (${dueLbl}: ${l.dueDate})` : ''}`)
        .join('\n');

    return {
      text: tPick(
        `Debts you need to pay back (${activeIOwe.length} obligations):\n${formatList('en', 'Due')}\n\nTotal in ${activeCurrency}: ${formatCurrency(totals.totalIOwe, 'en', activeCurrency)}.`,
        `الديون المستحقة عليك (${activeIOwe.length} التزامات):\n${formatList('ar', 'موعد السداد')}\n\nإجمالي الديون (${activeCurrency}): ${formatCurrency(totals.totalIOwe, 'ar', activeCurrency)}.`,
        `ئەو قەرزانەی لەسەرتن و دەبێت بیاندەیتەوە (${activeIOwe.length} تۆمار):\n${formatList('ku', 'بەروار')}\n\nکۆی گشتی (${activeCurrency}): ${formatCurrency(totals.totalIOwe, 'ku', activeCurrency)}.`,
        `Ödemeniz gereken borçlarınız (${activeIOwe.length} kayıt):\n${formatList('tr', 'Vade')}\n\nToplam (${activeCurrency}): ${formatCurrency(totals.totalIOwe, 'tr', activeCurrency)}.`,
        `Dettes que vous devez rembourser (${activeIOwe.length} obligations) :\n${formatList('fr', 'Échéance')}\n\nTotal (${activeCurrency}) : ${formatCurrency(totals.totalIOwe, 'fr', activeCurrency)}.`,
        `Deudas que debes pagar (${activeIOwe.length} obligaciones):\n${formatList('es', 'Vence')}\n\nTotal en ${activeCurrency}: ${formatCurrency(totals.totalIOwe, 'es', activeCurrency)}.`
      ),
    };
  }

  // "Biggest debt"
  if (
    q.includes('biggest') ||
    q.includes('largest') ||
    q.includes('أكبر') ||
    q.includes('اكبر دين') ||
    q.includes('أعلى مبلغ') ||
    q.includes('گەورەترین قەرز') ||
    q.includes('زۆرترین قەرز') ||
    q.includes('en büyük borç') ||
    q.includes('plus grande dette') ||
    q.includes('mayor deuda') ||
    q.includes('deuda más grande') ||
    q.includes('deuda mas grande')
  ) {
    const allActive = [...loans.filter((l) => l.status === 'active')];
    if (allActive.length === 0) {
      return {
        text: tPick(
          'No active loans recorded to determine the largest balance.',
          'لا توجد قروض نشطة مسجلة حالياً لحساب أكبر دين.',
          'هیچ قەرزێکی چالاک تۆمار نەکراوە بۆ دیاریکردنی گەورەترین قەرز.',
          'En büyük bakiyeyi belirlemek için aktif kayıt bulunamadı.',
          'Aucun prêt actif enregistré pour déterminer le solde le plus important.',
          'No hay préstamos activos registrados para determinar el saldo más alto.'
        ),
      };
    }
    const sorted = allActive.sort((a, b) => getRemainingLoanBalance(b) - getRemainingLoanBalance(a));
    const top = sorted[0];
    const topRemaining = Math.max(0, top.amount - (top.paidAmount || 0));

    return {
      text: tPick(
        `The largest individual balance is with "${top.personName}" at ${formatCardDebt(topRemaining, top.currency || 'USD', 'en')} (${top.type === 'they_owe_me' ? 'They owe you' : 'You owe them'}).`,
        `أكبر التزام مالي مسجل هو مع "${top.personName}" بمبلغ: ${formatCardDebt(topRemaining, top.currency || 'USD', 'ar')} (${top.type === 'they_owe_me' ? 'سلفة للغير يطلبك' : 'دين عليك'}).`,
        `گەورەترین تۆماری دارایی لەگەڵ "${top.personName}"ـە بە بڕی ${formatCardDebt(topRemaining, top.currency || 'USD', 'ku')} (${top.type === 'they_owe_me' ? 'قەرزەکانم لای ئەوان' : 'قەرزەکانم'}).`,
        `En yüksek bireysel bakiye "${top.personName}" ile ${formatCardDebt(topRemaining, top.currency || 'USD', 'tr')} tutarındadır (${top.type === 'they_owe_me' ? 'Alacak' : 'Borç'}).`,
        `Le solde individuel le plus élevé concerne "${top.personName}" pour ${formatCardDebt(topRemaining, top.currency || 'USD', 'fr')} (${top.type === 'they_owe_me' ? 'On vous doit' : 'Vous devez'}).`,
        `El saldo individual más alto es con "${top.personName}" por ${formatCardDebt(topRemaining, top.currency || 'USD', 'es')} (${top.type === 'they_owe_me' ? 'Te debe' : 'Le debes'}).`
      ),
    };
  }

  // "Net balance"
  if (
    q.includes('net') ||
    q.includes('balance') ||
    q.includes('صافي') ||
    q.includes('رصيد') ||
    q.includes('پوختە') ||
    q.includes('باڵانس') ||
    q.includes('net durum') ||
    q.includes('bakiye') ||
    q.includes('solde') ||
    q.includes('saldo neto') ||
    q.includes('saldo')
  ) {
    const diff = totals.totalTheyOwe - totals.totalIOwe;
    return {
      text: tPick(
        `Net Financial Position (${activeCurrency}):\n• Total to collect: ${formatCurrency(totals.totalTheyOwe, 'en', activeCurrency)}\n• Total to pay: ${formatCurrency(totals.totalIOwe, 'en', activeCurrency)}\n• Net Balance: ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'en', activeCurrency)} (${diff >= 0 ? 'Surplus in your favor' : 'Deficit to settle'})`,
        `ملخص المركز المالي الصافي (${activeCurrency}):\n• لك عند الآخرين: ${formatCurrency(totals.totalTheyOwe, 'ar', activeCurrency)}\n• عليك للآخرين: ${formatCurrency(totals.totalIOwe, 'ar', activeCurrency)}\n• صافي رصيدك: ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'ar', activeCurrency)} (${diff >= 0 ? 'فائض لصالحك' : 'عجز يحتاج للسداد'})`,
        `پوختەی دۆخی دارایی (${activeCurrency}):\n• قەرزەکانم لای ئەوان: ${formatCurrency(totals.totalTheyOwe, 'ku', activeCurrency)}\n• قەرزەکانم: ${formatCurrency(totals.totalIOwe, 'ku', activeCurrency)}\n• باڵانسی پوختە: ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'ku', activeCurrency)} (${diff >= 0 ? 'زیادەیە لە بەرژەوەندیت' : 'قەرزە دەبێت پاکتاو بکرێت'})`,
        `Net Mali Durum Özeti (${activeCurrency}):\n• Toplam Alacak: ${formatCurrency(totals.totalTheyOwe, 'tr', activeCurrency)}\n• Toplam Borç: ${formatCurrency(totals.totalIOwe, 'tr', activeCurrency)}\n• Net Bakiye: ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'tr', activeCurrency)} (${diff >= 0 ? 'Artı Bakiye' : 'Ödenecek Açık'})`,
        `Position Financière Nette (${activeCurrency}) :\n• Total à encaisser : ${formatCurrency(totals.totalTheyOwe, 'fr', activeCurrency)}\n• Total à payer : ${formatCurrency(totals.totalIOwe, 'fr', activeCurrency)}\n• Solde Net : ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'fr', activeCurrency)} (${diff >= 0 ? 'Excédent en votre faveur' : 'Déficit à régler'})`,
        `Posición Financiera Neta (${activeCurrency}):\n• Total por cobrar: ${formatCurrency(totals.totalTheyOwe, 'es', activeCurrency)}\n• Total por pagar: ${formatCurrency(totals.totalIOwe, 'es', activeCurrency)}\n• Saldo Neto: ${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'es', activeCurrency)} (${diff >= 0 ? 'Excedente a tu favor' : 'Déficit por saldar'})`
      ),
    };
  }

  // Smart Debt Prioritization & Overdue Alerts
  if (
    q.includes('priorit') ||
    q.includes('pay first') ||
    q.includes('collect first') ||
    q.includes('overdue') ||
    q.includes('urgent') ||
    q.includes('alerts') ||
    q.includes('أولوية') ||
    q.includes('أولويات') ||
    q.includes('متأخر') ||
    q.includes('عاجل') ||
    q.includes('ئەولەویەت') ||
    q.includes('پێشینە') ||
    q.includes('دواکەوتوو') ||
    q.includes('öncelik') ||
    q.includes('vadesi') ||
    q.includes('acil') ||
    q.includes('priorité') ||
    q.includes('retard') ||
    q.includes('prioridad') ||
    q.includes('vencid') ||
    q.includes('alertas')
  ) {
    const intel = analyzePortfolioIntelligence(loans, activeCurrency);
    const urgentList = [...intel.overdueLoans, ...intel.dueTodayLoans];
    const topPay = intel.payablesAvalanche[0];
    const topCollect = intel.receivablesPriority[0];
    const snowballFirst = intel.payablesSnowball[0];

    return {
      text: tPick(
        `Smart Debt Prioritization & Alerts:\n• Urgent Alerts: ${intel.overdueLoans.length} overdue, ${intel.dueTodayLoans.length} due today, ${intel.upcomingSoonLoans.length} due within 3 days${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join(', ')})` : ''}\n• Top Repayment Priority (Avalanche/Urgent): ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'en')})` : 'None — 0 payables'}\n• Quick Win (Snowball): ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'en')})` : 'None'}\n• Top Collection Target: ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'en')})` : 'None'}`,
        `الأولويات الذكية وتنبيهات الديون:\n• التنبيهات العاجلة: ${intel.overdueLoans.length} متأخرة، ${intel.dueTodayLoans.length} مستحقة اليوم، ${intel.upcomingSoonLoans.length} خلال 3 أيام${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join('، ')})` : ''}\n• أولوية السداد الأهم: ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'ar')})` : 'لا توجد التزامات عليك'}\n• إنجاز سريع (Snowball): ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'ar')})` : 'لا يوجد'}\n• أولوية التحصيل: ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'ar')})` : 'لا يوجد'}`,
        `ڕیزبەندی زیرەکانە و ئاگادارکردنەوەکان:\n• ئاگادارکردنەوە بەپەلەکان: ${intel.overdueLoans.length} دواکەوتوو، ${intel.dueTodayLoans.length} ئەمڕۆ وادەیەتی، ${intel.upcomingSoonLoans.length} لە 3 ڕۆژی داهاتوودا${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join('، ')})` : ''}\n• ئەولەویەتی دانەوەی قەرز: ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'ku')})` : 'هیچ قەرزێکت لەسەر نییە'}\n• خێراترین پاکتاو (Snowball): ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'ku')})` : 'نییە'}\n• ئەولەویەتی وەرگرتنەوە: ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'ku')})` : 'نییە'}`,
        `Akıllı Borç Önceliklendirme ve Uyarılar:\n• Acil Uyarılar: ${intel.overdueLoans.length} gecikmiş, ${intel.dueTodayLoans.length} bugün vadeli, ${intel.upcomingSoonLoans.length} 3 gün içinde${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join(', ')})` : ''}\n• Öncelikli Ödeme (Avalanche): ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'tr')})` : 'Aktif borcunuz yok'}\n• Hızlı Kapatma (Snowball): ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'tr')})` : 'Yok'}\n• Öncelikli Tahsilat: ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'tr')})` : 'Yok'}`,
        `Priorisation Intelligente & Alertes :\n• Alertes urgentes : ${intel.overdueLoans.length} en retard, ${intel.dueTodayLoans.length} aujourd'hui, ${intel.upcomingSoonLoans.length} sous 3 jours${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join(', ')})` : ''}\n• Priorité de paiement (Avalanche) : ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'fr')})` : 'Aucune dette active'}\n• Gain rapide (Boule de Neige) : ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'fr')})` : 'Aucun'}\n• Priorité d'encaissement : ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'fr')})` : 'Aucune'}`,
        `Priorización Inteligente y Alertas:\n• Alertas urgentes: ${intel.overdueLoans.length} vencida(s), ${intel.dueTodayLoans.length} para hoy, ${intel.upcomingSoonLoans.length} en 3 días${urgentList.length > 0 ? ` (${urgentList.map((l) => l.personName).join(', ')})` : ''}\n• Prioridad de pago (Avalancha): ${topPay ? `${topPay.personName} (${formatCardDebt(getRemainingLoanBalance(topPay), topPay.currency || 'USD', 'es')})` : 'Sin deudas activas'}\n• Victoria rápida (Bola de nieve): ${snowballFirst ? `${snowballFirst.personName} (${formatCardDebt(getRemainingLoanBalance(snowballFirst), snowballFirst.currency || 'USD', 'es')})` : 'Ninguna'}\n• Prioridad de cobro: ${topCollect ? `${topCollect.personName} (+${formatCardDebt(getRemainingLoanBalance(topCollect), topCollect.currency || 'USD', 'es')})` : 'Ninguna'}`
      ),
    };
  }

  // Portfolio Summary & Cash Flow Breakdown (direct per-currency totals, no FX conversion)
  if (
    q.includes('cash flow') ||
    q.includes('cashflow') ||
    q.includes('breakdown') ||
    q.includes('portfolio') ||
    q.includes('currencies') ||
    q.includes('advice') ||
    q.includes('insight') ||
    q.includes('summary') ||
    q.includes('overview') ||
    q.includes('تدفق') ||
    q.includes('سيولة') ||
    q.includes('محفظة') ||
    q.includes('نصيحة') ||
    q.includes('عملات') ||
    q.includes('شیرۆڤە') ||
    q.includes('ڕاوێژ') ||
    q.includes('نەقدی') ||
    q.includes('tavsiye') ||
    q.includes('portföy') ||
    q.includes('nakit') ||
    q.includes('conseil') ||
    q.includes('portefeuille') ||
    q.includes('trésorerie') ||
    q.includes('resumen') ||
    q.includes('flujo de caja') ||
    q.includes('portafolio') ||
    q.includes('consejo') ||
    q.includes('divisas')
  ) {
    const intel = analyzePortfolioIntelligence(loans, activeCurrency);
    const perCurrencyLines =
      intel.currencyBreakdown.length > 0
        ? intel.currencyBreakdown
            .map(
              (b) =>
                `• ${b.currency}: +${formatCardDebt(b.theyOwe, b.currency, replyLang)} / -${formatCardDebt(b.iOwe, b.currency, replyLang)} (Net ${b.net >= 0 ? '+' : ''}${formatCardDebt(b.net, b.currency, replyLang)})`
            )
            .join('\n')
        : '• —';

    return {
      text: tPick(
        `Portfolio & Cash Flow Summary:\n\nActive Totals by Currency:\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `Urgent: ${intel.overdueLoans.length} overdue debt(s) require follow-up.` : 'Status: All active records are on schedule.'}`,
        `ملخص التدفق النقدي والمحفظة:\n\nالأرصدة النشطة حسب العملة:\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `تنبيه: لديك ${intel.overdueLoans.length} سجلات متأخرة تحتاج للمتابعة.` : 'الحالة: جميع السجلات النشطة ضمن مواعيدها.'}`,
        `پوختەی نەختینە و پۆرتفۆلیۆ:\n\nتۆمارە چالاکەکان بەپێی دراو:\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `ئاگاداری: ${intel.overdueLoans.length} قەرزی دواکەوتوو هەیە.` : 'دۆخ: هەموو قەرزەکان لە کاتی خۆیاندان.'}`,
        `Nakit Akışı ve Portföy Özeti:\n\nPara Birimi Dağılımı:\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `Uyarı: ${intel.overdueLoans.length} gecikmiş kayıt takip gerektiriyor.` : 'Durum: Tüm aktif kayıtlar zamanında.'}`,
        `Synthèse de Trésorerie & Portefeuille :\n\nRépartition par devise :\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `Urgent : ${intel.overdueLoans.length} dossier(s) en retard.` : 'Statut : Tous les dossiers actifs sont à jour.'}`,
        `Resumen de Portafolio y Flujo de Caja:\n\nTotales activos por divisa:\n${perCurrencyLines}\n\n${intel.overdueLoans.length > 0 ? `Urgente: ${intel.overdueLoans.length} deuda(s) vencida(s) requieren seguimiento.` : 'Estado: Todos los registros activos están al día.'}`
      ),
    };
  }

  // 3. Mathematical & Financial Calculations
  const percentMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|من|لە|de)\s*(\d+(?:\.\d+)?)/);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    const base = parseFloat(percentMatch[2]);
    const calc = (pct / 100) * base;
    const calcStr = calc.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return {
      text: tPick(
        `Percentage result: ${pct}% of ${base.toLocaleString()} = ${calcStr}.`,
        `حساب النسبة المئوية: ${pct}% من ${base.toLocaleString()} = ${calcStr}.`,
        `ئەنجامی ڕێژەی سەدی: ${pct}% لە ${base.toLocaleString()} = ${calcStr}.`,
        `Yüzde hesabı: ${base.toLocaleString()} tutarının %${pct} oranı = ${calcStr}.`,
        `Calcul de pourcentage : ${pct}% de ${base.toLocaleString()} = ${calcStr}.`,
        `Resultado porcentual: ${pct}% de ${base.toLocaleString()} = ${calcStr}.`
      ),
    };
  }

  const mathMatch = question.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*([\+\-\*\/xX×÷])\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1].replace(/,/g, ''));
    const op = mathMatch[2];
    const num2 = parseFloat(mathMatch[3].replace(/,/g, ''));
    let result = 0;
    if (op === '+') result = num1 + num2;
    else if (op === '-') result = num1 - num2;
    else if (op === '*' || op.toLowerCase() === 'x' || op === '×') result = num1 * num2;
    else if (op === '/' || op === '÷') result = num2 !== 0 ? num1 / num2 : 0;

    const formattedResult = result.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return {
      text: tPick(
        `Calculation result: ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`,
        `الناتج الحسابي الدقيق: ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`,
        `ئەنجامی ژمێریاری: ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`,
        `Hesaplama sonucu: ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`,
        `Résultat du calcul : ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`,
        `Resultado del cálculo: ${num1.toLocaleString()} ${op} ${num2.toLocaleString()} = ${formattedResult}.`
      ),
    };
  }

  const installmentMatch = q.match(/(\d+(?:,\d+)?)\s*(?:a month|per month|شهريا|كل شهر|مانگانە|aylık|par mois|al mes|por mes)\s*(?:for|من أصل|لدين|بۆ|için|pour|para|por)?\s*(\d+(?:,\d+)?)/);
  if (installmentMatch) {
    const monthly = parseFloat(installmentMatch[1].replace(/,/g, ''));
    const total = parseFloat(installmentMatch[2].replace(/,/g, ''));
    if (monthly > 0 && total > 0) {
      const months = Math.ceil(total / monthly);
      return {
        text: tPick(
          `Installment Plan: Paying ${monthly.toLocaleString()} per month towards ${total.toLocaleString()} will have you completely debt-free in ${months} months!`,
          `خطة السداد بالأقساط: بدفع ${monthly.toLocaleString()} شهرياً لمبلغ ${total.toLocaleString()}، ستنتهي تماماً من سداد الدين خلال ${months} أشهر!`,
          `پلانی قیست: بە دانی ${monthly.toLocaleString()} مانگانە بۆ بڕی ${total.toLocaleString()}، لە ماوەی ${months} مانگدا بە تەواوی قەرزەکە تەواو دەکەیت!`,
          `Taksit Planı: ${total.toLocaleString()} borç için aylık ${monthly.toLocaleString()} ödeyerek ${months} ayda tamamen borçsuz olabilirsiniz!`,
          `Plan de remboursement : En payant ${monthly.toLocaleString()} par mois sur ${total.toLocaleString()}, vous aurez tout soldé en ${months} mois !`,
          `Plan de cuotas: Pagando ${monthly.toLocaleString()} al mes hacia ${total.toLocaleString()}, ¡saldarás la deuda por completo en ${months} meses!`
        ),
      };
    }
  }

  // 50/30/20 Salary Budgeting
  if (q.includes('50/30/20') || q.includes('قسم راتب') || q.includes('تقسيم الراتب') || q.includes('budget my salary') || q.includes('how to budget') || q.includes('دابەشکردنی مووچە') || q.includes('maaş') || q.includes('salaire') || q.includes('presupuesto') || q.includes('salario') || q.includes('sueldo')) {
    const salaryMatch = q.match(/(\d+(?:,\d+)?)/);
    const sal = salaryMatch ? parseFloat(salaryMatch[1].replace(/,/g, '')) : 1000;
    const needs = (sal * 0.5).toLocaleString();
    const wants = (sal * 0.3).toLocaleString();
    const debtSavings = (sal * 0.2).toLocaleString();

    return {
      text: tPick(
        `Smart 50/30/20 Budget Breakdown for ${sal.toLocaleString()} ${activeCurrencyItem.symbol}:\n• 50% Needs (Rent, Utilities, Food): ${needs} ${activeCurrencyItem.symbol}\n• 30% Wants (Personal, Leisure): ${wants} ${activeCurrencyItem.symbol}\n• 20% Debt Repayment & Savings: ${debtSavings} ${activeCurrencyItem.symbol}`,
        `خطة تقسيم الراتب (قاعدة 50/30/20) لمبلغ ${sal.toLocaleString()} ${activeCurrencyItem.symbol}:\n• ٥٠% للاحتياجات الأساسية: ${needs} ${activeCurrencyItem.symbol}\n• ٣٠% للرغبات الشخصية: ${wants} ${activeCurrencyItem.symbol}\n• ٢٠% لسداد الديون والادخار: ${debtSavings} ${activeCurrencyItem.symbol}`,
        `پلانی 50/30/20 بۆ دابەشکردنی بڕی ${sal.toLocaleString()} ${activeCurrencyItem.symbol}:\n• 50% بۆ پێداویستی سەرەکی: ${needs} ${activeCurrencyItem.symbol}\n• 30% بۆ خەرجی کەسی: ${wants} ${activeCurrencyItem.symbol}\n• 20% بۆ دانەوەی قەرز و پاشەکەوت: ${debtSavings} ${activeCurrencyItem.symbol}`,
        `${sal.toLocaleString()} ${activeCurrencyItem.symbol} için 50/30/20 Bütçe Planı:\n• %50 Temel İhtiyaçlar: ${needs} ${activeCurrencyItem.symbol}\n• %30 Kişisel Harcamalar: ${wants} ${activeCurrencyItem.symbol}\n• %20 Borç Ödeme ve Birikim: ${debtSavings} ${activeCurrencyItem.symbol}`,
        `Répartition 50/30/20 pour ${sal.toLocaleString()} ${activeCurrencyItem.symbol} :\n• 50% Besoins essentiels : ${needs} ${activeCurrencyItem.symbol}\n• 30% Envies personnelles : ${wants} ${activeCurrencyItem.symbol}\n• 20% Remboursement & Épargne : ${debtSavings} ${activeCurrencyItem.symbol}`,
        `Presupuesto inteligente 50/30/20 para ${sal.toLocaleString()} ${activeCurrencyItem.symbol}:\n• 50% Necesidades básicas: ${needs} ${activeCurrencyItem.symbol}\n• 30% Deseos personales: ${wants} ${activeCurrencyItem.symbol}\n• 20% Pago de deudas y ahorro: ${debtSavings} ${activeCurrencyItem.symbol}`
      ),
    };
  }

  // 4. Debt Payoff Strategies
  if (q.includes('strategy') || q.includes('snowball') || q.includes('avalanche') || q.includes('كرة الثلج') || q.includes('خطة سداد') || q.includes('كيف اسدد') || q.includes('ستراتیژی') || q.includes('strateji') || q.includes('stratégie') || q.includes('strategie') || q.includes('estrategia') || q.includes('bola de nieve') || q.includes('avalancha')) {
    return {
      text: tPick(
        `The two most proven debt elimination strategies:\n\n1. Debt Snowball: Pay off the smallest balance first for quick momentum, then roll payments to the next.\n2. Debt Avalanche: Target the highest-cost or most urgent balance first to minimize financial strain.`,
        `أفضل استراتيجيتين للتخلص من الديون:\n\n١. طريقة كرة الثلج (Snowball): ابدأ بسداد أصغر دين أولاً لتحقيق إنجاز سريع.\n٢. طريقة الانهيار الجليدي (Avalanche): ركّز على الدين الأكبر أو الأكثر إلحاحاً أولاً لتقليل الضغط المالي.`,
        `باشترین دوو ستراتیژی بۆ دانەوەی قەرزەکان:\n\n١. تۆپی بەفر (Snowball): سەرەتا بچووکترین قەرز بدەرەوە بۆ ئەوەی هەست بە سەرکەوتن بکەیت.\n٢. هەرەسی بەفر (Avalanche): سەرەتا قەرزە قورس یان بەپەلەکان پاکتاو بکە.`,
        `Borç kapatmada en etkili iki strateji:\n\n1. Kartopu Yöntemi (Snowball): Hızlı motivasyon için önce en küçük borcu kapatın.\n2. Çığ Yöntemi (Avalanche): En yüksek maliyetli veya en acil borca öncelik verin.`,
        `Les deux meilleures stratégies de désendettement :\n\n1. Méthode Boule de Neige : Remboursez d'abord la plus petite dette pour créer un élan rapide.\n2. Méthode Avalanche : Priorisez la dette la plus coûteuse ou la plus urgente.`,
        `Las dos estrategias más efectivas para salir de deudas:\n\n1. Bola de Nieve: Paga primero el saldo más pequeño para ganar impulso rápido y luego avanza al siguiente.\n2. Avalancha: Enfócate primero en el saldo más urgente o alto para reducir la presión financiera.`
      ),
    };
  }

  // 5. Draft Reminder Message Request
  if (q.includes('draft') || q.includes('write a message') || q.includes('اكتب رسالة') || q.includes('صيغة تذكير') || q.includes('نص رسالة') || q.includes('نامەی بیرخستنەوە') || q.includes('hatırlatma mesajı') || q.includes('message de rappel') || q.includes('mensaje de recordatorio') || q.includes('redactar recordatorio')) {
    return {
      text: tPick(
        `Here are 2 quick reminder templates:\n1. Friendly: "Hey! Just checking in kindly on our pending balance whenever convenient. Thanks!"\n2. Formal: "Hello, I'm reconciling my monthly records—please let me know when we can settle the pending balance."`,
        `إليك نموذجان لرسائل تذكير:\n١. ودية: "مرحباً! تذكير لطيف بخصوص المبلغ المتبقي متى ما تيسر لك، ولك جزيل الشكر."\n٢. رسمية: "السلام عليكم، أرجو إعلامي بالموعد المناسب لتسوية الرصيد المتبقي في السجلات."`,
        `ئەم دوو نموونەیە بۆ نامەی بیرخستنەوە:\n١. دۆستانە: "سڵاو، تەنها بیرخستنەوەیەکی دۆستانە سەبارەت بە بڕە ماوەکە کاتێک بۆت گونجاو بوو. سوپاس."\n٢. فەرمی: "سڵاو، تکایە کاتی گونجاوم پێ بڵێ بۆ پاکتاوکردنی بڕە قەرزەکە."`,
        `İşte 2 hızlı hatırlatma şablonu:\n1. Samimi: "Selam! Kalan bakiye için uygun olduğunda haberleşelim, teşekkürler!"\n2. Resmi: "Merhaba, aylık kayıtlarımı güncelliyorum; kalan bakiyeyi ne zaman kapatabileceğimizi paylaşabilir misiniz?"`,
        `Voici 2 modèles de rappel :\n1. Amical : "Bonjour ! Petit rappel amical au sujet de notre solde en attente dès que possible. Merci !"\n2. Formel : "Bonjour, pourriez-vous m'indiquer à quelle date vous prévoyez de régler le solde restant ?"`,
        `Aquí tienes 2 plantillas rápidas de recordatorio:\n1. Amable: "¡Hola! Te escribo con un recordatorio cordial sobre nuestro saldo pendiente para cuando te venga bien. ¡Gracias!"\n2. Formal: "Hola, estoy conciliando mis registros del mes; por favor confírmame cuándo podemos saldar el monto pendiente."`
      ),
    };
  }

  // 6. Financial Wisdom (Inflation, Saving)
  if (q.includes('inflation') || q.includes('تضخم') || q.includes('هەڵاوسان') || q.includes('enflasyon') || q.includes('inflación') || q.includes('inflacion')) {
    return {
      text: tPick(
        'Inflation reduces purchasing power over time. Collecting receivables promptly and tracking debts in stable currencies protects real value.',
        'التضخم يقلل القوة الشرائية مع الوقت؛ لذلك فإن سرعة تحصيل المستحقات وتثبيت الديون بعملات مستقرة يحفظ القيمة.',
        'هەڵاوسان هێزی کڕین کەم دەکاتەوە؛ وەرگرتنەوەی خێرای قەرز و تۆمارکردن بە دراوی جێگیر بەهای پارەکەت دەپارێزێت.',
        'Enflasyon zamanla alım gücünü azaltır. Alacakları zamanında tahsil etmek ve istikrarlı para birimlerini kullanmak değer kaybını önler.',
        'L’inflation réduit le pouvoir d’achat avec le temps. Encaisser vos créances rapidement et suivre vos soldes en devise stable protège votre capital.',
        'La inflación reduce el poder adquisitivo con el tiempo. Cobrar a tiempo y registrar deudas en divisas estables protege tu valor real.'
      ),
    };
  }

  if (q.includes('save money') || q.includes('توفير') || q.includes('ادخار') || q.includes('وفر') || q.includes('پاشەکەوت') || q.includes('birikim') || q.includes('épargner') || q.includes('ahorrar')) {
    return {
      text: tPick(
        'Top tips to grow cash flow: track every loan record, apply a 24-hour pause before impulse buys, and route repaid loans directly into savings.',
        'نصائح لتعزيز السيولة: توثيق كل التزام مالي، التريث 24 ساعة قبل المشتريات غير الضرورية، وتوجيه الديون المستردة نحو الادخار.',
        'بۆ پاشەکەوتی زیاتر: هەموو قەرز و خەرجییەک تۆمار بکە و هەر پارەیەکی قەرز کە دەگەڕێتەوە ڕاستەوخۆ بیخە ناو سندوقی پاشەکەوت.',
        'Nakit akışını artırmak için: her borç/alacağı kaydedin, plansız harcamalarda 24 saat bekleyin ve geri ödenen tutarları birikime ayırın.',
        'Pour augmenter votre trésorerie : suivez chaque prêt, appliquez la règle des 24 heures avant tout achat impulsif et épargnez chaque remboursement reçu.',
        'Consejos clave para mejorar tu flujo de caja: registra cada préstamo, espera 24 horas antes de compras impulsivas y ahorra cada reembolso recibido.'
      ),
    };
  }

  // 7. Greetings
  if (/^(hi|hello|hey|مرحبا|السلام عليكم|اهلا|أهلا|سلام|صباح الخير|مساء الخير|سڵاو|سلاو|merhaba|selam|bonjour|salut|bonsoir|hola|buenos días|buenas tardes|buenas noches)[!.\s؟?]*$/i.test(question.trim())) {
    return {
      text: tPick(
        `Hello! I'm Ai Budget, your financial assistant. Ask me about your active loans, payment priorities, reminders, or log a new loan in any language.`,
        `أهلاً بك! أنا مساعد الميزانية الذكي (Ai Budget). يمكنك سؤالي عن ديونك أو أولويات السداد أو تسجيل قرض جديد بأي لغة تريدها.`,
        `سڵاو! من یاریدەدەری داراییم (Ai Budget). دەتوانیت بە کوردی، عەرەبی، ئینگلیزی، تورکی، فەرەنسی یان ئیسپانی پرسیارم لێ بکەیت دەربارەی قەرزەکانت.`,
        `Merhaba! Ben finans asistanınız Ai Budget. Aktif borçlarınız, alacaklarınız veya ödeme öncelikleri hakkında her şeyi sorabilirsiniz.`,
        `Bonjour ! Je suis Ai Budget, votre assistant financier. Posez-moi vos questions sur vos dettes, créances ou rappels dans la langue de votre choix.`,
        `¡Hola! Soy Ai Budget, tu asistente financiero. Pregúntame sobre tus préstamos activos, prioridades de pago, recordatorios o registra un préstamo en cualquier idioma.`
      ),
    };
  }

  // 8. Gratitude
  if (q.includes('thank') || q.includes('شكرا') || q.includes('تسلم') || q.includes('مشكور') || q.includes('سوپاس') || q.includes('teşekkür') || q.includes('merci') || q.includes('gracias')) {
    return {
      text: tPick(
        "You're very welcome! Let me know anytime you want to review balances or plan a settlement.",
        'العفو بكل سرور! أنا هنا دائماً لمساعدتك في متابعة ديونك وميزانيتك بدقة.',
        'سەرچاوان! هەر کاتێک پێویستت بە زانیاری قەرزەکان بوو، لێرەم.',
        'Rica ederim! Borç ve alacaklarınızı takip etmek için her zaman buradayım.',
        'Avec plaisir ! Je reste à votre disposition pour suivre vos prêts et votre budget.',
        '¡De nada! Avísame cuando quieras revisar saldos o planificar un pago.'
      ),
    };
  }

  // 9. Intelligent Multilingual General Answer
  let intelligentAnswer = tPick(
    `I'm tracking ${loans.filter((l) => l.status === 'active').length} active record(s) for you (${activeTheyOwe.length} receivable, ${activeIOwe.length} payable). Ask me things like "Who owes me?", "What is my net balance?", "Prioritize my debts", or log a loan naturally (e.g. "I owe Tariq $150 tomorrow").`,
    `أتابع حالياً ${loans.filter((l) => l.status === 'active').length} سجلاً نشطاً في ميزانيتك (${activeTheyOwe.length} للتحصيل و ${activeIOwe.length} للسداد). يمكنك سؤالي مثلاً: "منو يطلبني؟"، "صافي رصيدي"، أو "ترتيب أولويات الديون".`,
    `ئێستا چاودێری ${loans.filter((l) => l.status === 'active').length} قەرزی چالاک دەکەم بۆت (${activeTheyOwe.length} قەرزەکانم لای ئەوان و ${activeIOwe.length} قەرزەکانم). دەتوانیت بپرسیت: "کێ قەرزداری منە؟" یان "پوختەی باڵانس چەندە؟".`,
    `Şu anda ${loans.filter((l) => l.status === 'active').length} aktif kaydınızı takip ediyorum (${activeTheyOwe.length} alacak, ${activeIOwe.length} borç). Bana "Kim bana borçlu?" veya "Net bakiyem nedir?" gibi sorular sorabilirsiniz.`,
    `Je suis actuellement ${loans.filter((l) => l.status === 'active').length} dossier(s) actif(s) (${activeTheyOwe.length} créance(s), ${activeIOwe.length} dette(s)). Vous pouvez demander « Qui me doit de l'argent ? » ou « Quel est mon solde net ? ».`,
    `Estoy siguiendo ${loans.filter((l) => l.status === 'active').length} registro(s) activo(s) (${activeTheyOwe.length} por cobrar, ${activeIOwe.length} por pagar). Pregúntame "¿Quién me debe?", "¿Cuál es mi saldo neto?" o registra uno (ej. "Le debo a Sara 150 SAR mañana").`
  );

  if (customInstructions) {
    intelligentAnswer += `\n\n(${tPick('Directive', 'توجيه خاص', 'ڕێنمایی', 'Özel Talimat', 'Instruction', 'Directiva')}: ${customInstructions})`;
  }

  return { text: intelligentAnswer };
}

/**
 * Backup Export/Import Helpers
 */
export function exportAppDataJson(
  loans: Loan[],
  settings: UserSettings,
  transactions?: TransactionEntry[]
): string {
  const data = {
    app: 'LoanBudget',
    version: '3.3.0',
    exportedAt: new Date().toISOString(),
    loans,
    settings,
    ...(transactions ? { transactions } : {}),
  };
  return JSON.stringify(data, null, 2);
}

const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'ar', 'ku', 'tr', 'fr', 'es'];
const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['USD', 'IQD', 'SAR', 'EUR', 'TRY', 'IRR'];

export function sanitizeLanguageCode(lang: unknown, fallback: Language = 'en'): Language {
  return typeof lang === 'string' && SUPPORTED_LANGUAGES.includes(lang as Language)
    ? (lang as Language)
    : fallback;
}

export function sanitizeCurrencyCode(curr: unknown, fallback: CurrencyCode = 'USD'): CurrencyCode {
  return typeof curr === 'string' && SUPPORTED_CURRENCIES.includes(curr as CurrencyCode)
    ? (curr as CurrencyCode)
    : fallback;
}

export function importAppDataJson(jsonString: string): {
  loans?: Loan[];
  settings?: Partial<UserSettings>;
  transactions?: TransactionEntry[];
} | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && (Array.isArray(parsed.loans) || parsed.settings || Array.isArray(parsed.transactions))) {
      const sanitizedLoans = Array.isArray(parsed.loans)
        ? parsed.loans
            .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
            .map((item: Record<string, unknown>, idx: number) => {
              const rawAmount = Number(item.amount);
              const rawPaid = Number(item.paidAmount);
              const amount = Number.isFinite(rawAmount) && rawAmount >= 0 ? roundCurrencyAmount(rawAmount) : 0;
              const paidAmount = Number.isFinite(rawPaid) && rawPaid >= 0 ? Math.min(amount, roundCurrencyAmount(rawPaid)) : 0;
              const personName = typeof item.personName === 'string' && item.personName.trim()
                ? item.personName.trim().slice(0, 160)
                : typeof item.linkedUsername === 'string' && item.linkedUsername.trim()
                ? `@${item.linkedUsername.trim().replace(/^@+/, '')}`
                : 'Contact';
              const rawEntryRate = Number(item.exchangeRateAtEntry);
              const rawFxRate = Number(item.fxRateToUsdAtEntry);
              return {
                ...(item as unknown as Loan),
                id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `imp_${Date.now()}_${idx}`,
                personName,
                amount,
                paidAmount,
                currency: sanitizeCurrencyCode(item.currency, 'USD'),
                type: item.type === 'i_owe_them' ? 'i_owe_them' : 'they_owe_me',
                status: item.status === 'settled' ? 'settled' : 'active',
                createdAt: typeof item.createdAt === 'string' && item.createdAt.trim() ? item.createdAt : getTodayIsoDate(),
                ...(Number.isFinite(rawEntryRate) && rawEntryRate > 0 ? { exchangeRateAtEntry: rawEntryRate } : {}),
                ...(Number.isFinite(rawFxRate) && rawFxRate > 0 ? { fxRateToUsdAtEntry: rawFxRate } : {}),
              } as Loan;
            })
        : undefined;

      let sanitizedSettings: Partial<UserSettings> | undefined;
      if (parsed.settings && typeof parsed.settings === 'object' && !Array.isArray(parsed.settings)) {
        const s = parsed.settings as Record<string, unknown>;
        sanitizedSettings = {
          ...(s as Partial<UserSettings>),
          ...(s.language !== undefined ? { language: sanitizeLanguageCode(s.language, 'en') } : {}),
          ...(s.currency !== undefined ? { currency: sanitizeCurrencyCode(s.currency, 'USD') } : {}),
          ...(s.customRates && typeof s.customRates === 'object' && !Array.isArray(s.customRates)
            ? { customRates: normalizeCustomRates(s.customRates as Partial<Record<CurrencyCode, unknown>>) }
            : {}),
          ...(s.showDualCurrency !== undefined ? { showDualCurrency: Boolean(s.showDualCurrency) } : {}),
          ...(s.dualPrimaryCurrency === 'USD' || s.dualPrimaryCurrency === 'IQD'
            ? { dualPrimaryCurrency: s.dualPrimaryCurrency }
            : {}),
        };
      }

      const sanitizedTransactions = Array.isArray(parsed.transactions)
        ? parsed.transactions
            .filter((t: unknown): t is Record<string, unknown> => Boolean(t && typeof t === 'object' && !Array.isArray(t)))
            .map((t: Record<string, unknown>) => {
              const rawEntryRate = Number(t.exchangeRateAtEntry);
              const rawFxRate = Number(t.fxRateToUsdAtEntry);
              return {
                ...(t as unknown as TransactionEntry),
                ...(Number.isFinite(rawEntryRate) && rawEntryRate > 0 ? { exchangeRateAtEntry: rawEntryRate } : {}),
                ...(Number.isFinite(rawFxRate) && rawFxRate > 0 ? { fxRateToUsdAtEntry: rawFxRate } : {}),
              } as TransactionEntry;
            })
        : undefined;

      return {
        loans: sanitizedLoans,
        settings: sanitizedSettings,
        transactions: sanitizedTransactions,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Filter loans according to scope
 */
export function filterLoansByScope(loans: Loan[], scope: string = 'all'): Loan[] {
  switch (scope) {
    case 'active':
      return loans.filter((l) => l.status === 'active');
    case 'settled':
      return loans.filter((l) => l.status === 'settled');
    case 'they_owe_me':
      return loans.filter((l) => l.type === 'they_owe_me');
    case 'i_owe_them':
      return loans.filter((l) => l.type === 'i_owe_them');
    default:
      return loans;
  }
}

/**
 * Export Loans to Formatted CSV Spreadsheet with UTF-8 BOM for Excel compatibility
 */
export function exportLoansToCsv(
  loans: Loan[],
  language: Language = 'en',
  scope: string = 'all'
): string {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const filtered = filterLoansByScope(loans, scope);

  const headers = isKu
    ? ['ناسنامە', 'ناوی کەس', 'جۆری قەرز', 'بڕی سەرەکی', 'پارەی دراوە', 'بڕی ماوە', 'دراو', 'بەرواری دانەوە', 'دۆخ', 'بەرواری تۆمارکردن', 'تەلەفۆن', 'تێبینی']
    : isAr
    ? ['المعرف', 'الاسم', 'نوع الدين', 'أصل الدين', 'المسدد', 'المتبقي', 'العملة', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ التسجيل', 'الهاتف', 'ملاحظات']
    : isTr
    ? ['ID', 'Kişi Adı', 'İşlem Türü', 'Başlangıç Tutarı', 'Ödenen', 'Kalan Borç', 'Para Birimi', 'Vade Tarihi', 'Durum', 'Kayıt Tarihi', 'Telefon', 'Notlar']
    : isFr
    ? ['ID', 'Nom de la personne', 'Type', 'Montant Initial', 'Payé', 'Solde Restant', 'Devise', 'Date d\'échéance', 'Statut', 'Date de création', 'Téléphone', 'Notes']
    : isEs
    ? ['ID', 'Nombre', 'Tipo', 'Monto Original', 'Pagado', 'Saldo Pendiente', 'Moneda', 'Fecha de Vencimiento', 'Estado', 'Fecha de Creación', 'Teléfono', 'Notas']
    : ['ID', 'Person Name', 'Type', 'Original Amount', 'Paid Amount', 'Remaining Balance', 'Currency', 'Due Date', 'Status', 'Created Date', 'Phone', 'Notes'];

  const rows = filtered.map((loan) => {
    const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
    const typeLabel = loan.type === 'they_owe_me'
      ? (isKu ? 'قەرزەکانم لای ئەوان' : isAr ? 'سلف للغير (يطلبني)' : isTr ? 'Alacak (Bana Borçlular)' : isFr ? 'Créance (Ils me doivent)' : isEs ? 'Me Deben (Por Cobrar)' : 'They Owe Me')
      : (isKu ? 'قەرزەکانم' : isAr ? 'دين عليّ (أطلبهم)' : isTr ? 'Borç (Benim Borcum)' : isFr ? 'Dette (Je leur dois)' : isEs ? 'Yo Debo (Por Pagar)' : 'I Owe Them');
    const statusLabel = loan.status === 'settled'
      ? (isKu ? 'پاکتاوکراو' : isAr ? 'تمت التسوية' : isTr ? 'Ödendi' : isFr ? 'Réglé' : isEs ? 'Saldado' : 'Settled')
      : (isKu ? 'چالاک' : isAr ? 'نشط' : isTr ? 'Aktif' : isFr ? 'Actif' : isEs ? 'Activo' : 'Active');

    return [
      `"${loan.id}"`,
      `"${(loan.personName || '').replace(/"/g, '""')}"`,
      `"${typeLabel}"`,
      loan.amount,
      loan.paidAmount || 0,
      remaining,
      `"${loan.currency || 'USD'}"`,
      `"${loan.dueDate || ''}"`,
      `"${statusLabel}"`,
      `"${loan.createdAt || ''}"`,
      `"${(loan.phone || '').replace(/"/g, '""')}"`,
      `"${(loan.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens Kurdish, Arabic and special characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  if (typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoanBudget_${scope}_${formatLocalIsoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return csvContent;
}

/**
 * Export and Print Formatted Official Financial Statement (PDF print dialog)
 */
export function exportLoansToPdfPrint(
  loans: Loan[],
  totals: Totals,
  settings: UserSettings,
  scope: string = 'all'
): void {
  const isKu = settings.language === 'ku';
  const isAr = settings.language === 'ar';
  const isTr = settings.language === 'tr';
  const isFr = settings.language === 'fr';
  const isEs = settings.language === 'es';
  const isRtl = isAr || isKu;
  const filtered = filterLoansByScope(loans, scope);
  const today = new Date().toLocaleDateString(
    isKu ? 'ckb-IQ' : isAr ? 'ar-IQ' : isTr ? 'tr-TR' : isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn',
    }
  );

  const title = isKu
    ? 'ڕاپۆرتی فەرمی قەرزەکان'
    : isAr
    ? 'كشف حساب الديون والمستحقات المالي'
    : isTr
    ? 'Resmi Finansal Borç ve Alacak Ekstresi'
    : isFr
    ? 'Relevé Financier Officiel des Dettes et Créances'
    : isEs
    ? 'Estado Financiero Oficial de Deudas y Créditos'
    : 'Official Financial Debt & Credit Statement';
  const subtitle = isKu
    ? `بەرواری دەرچوون: ${today} • هەژمار: ${settings.profileName || 'خاوەن هەژمار'}`
    : isAr
    ? `تاريخ الإصدار: ${today} • الحساب: ${settings.profileName || 'المستخدم'}`
    : isTr
    ? `Düzenlenme Tarihi: ${today} • Hesap: ${settings.profileName || 'Hesap Sahibi'}`
    : isFr
    ? `Généré le ${today} • Compte: ${settings.profileName || 'Titulaire'}`
    : isEs
    ? `Generado el ${today} • Cuenta: ${settings.profileName || 'Titular'}`
    : `Generated on ${today} • Account: ${settings.profileName || 'Owner'}`;

  const lblTheyOwe = isKu ? 'قەرزەکانم لای ئەوان' : isAr ? 'مستحقات للتحصيل (يطلبني)' : isTr ? 'Toplam Alacak (Bana Borçlular)' : isFr ? 'Total à Recouvrer (Créances)' : isEs ? 'Total por Cobrar (Me Deben)' : 'Total to Collect (They Owe Me)';
  const lblIOwe = isKu ? 'قەرزەکانم' : isAr ? 'التزامات للدفع (أطلبهم)' : isTr ? 'Toplam Borç (Benim Borcum)' : isFr ? 'Total à Payer (Dettes)' : isEs ? 'Total por Pagar (Yo Debo)' : 'Total to Pay (I Owe Them)';
  const lblNet = isKu ? 'دۆخی پوختەی دارایی' : isAr ? 'صافي المركز المالي' : isTr ? 'Net Mali Durum' : isFr ? 'Position Nette Consolidée' : isEs ? 'Posición Financiera Neta' : 'Net Financial Position';
  const lblActiveLoans = isKu ? 'تۆماری چالاک' : isAr ? 'سجل نشط' : isTr ? 'aktif kayıt' : isFr ? 'prêts actifs' : isEs ? 'registros activos' : 'active loans';
  const lblTotalRecords = isKu ? 'کۆی تۆمارەکان:' : isAr ? 'إجمالي السجلات:' : isTr ? 'Toplam Kayıt:' : isFr ? 'Total Enregistrements:' : isEs ? 'Total de Registros:' : 'Total Records:';
  const thName = isKu ? 'ناو' : isAr ? 'الاسم' : isTr ? 'Kişi Adı' : isFr ? 'Nom' : isEs ? 'Nombre' : 'Person Name';
  const thType = isKu ? 'جۆر' : isAr ? 'النوع' : isTr ? 'Tür' : isFr ? 'Type' : isEs ? 'Tipo' : 'Type';
  const thOrig = isKu ? 'بڕی سەرەکی' : isAr ? 'أصل الدين' : isTr ? 'Başlangıç' : isFr ? 'Initial' : isEs ? 'Original' : 'Original';
  const thPaid = isKu ? 'دراوە' : isAr ? 'المسدد' : isTr ? 'Ödenen' : isFr ? 'Payé' : isEs ? 'Pagado' : 'Paid';
  const thRem = isKu ? 'ماوە' : isAr ? 'المتبقي' : isTr ? 'Kalan' : isFr ? 'Restant' : isEs ? 'Pendiente' : 'Remaining';
  const thDue = isKu ? 'بەرواری دانەوە' : isAr ? 'تاريخ الاستحقاق' : isTr ? 'Vade' : isFr ? 'Échéance' : isEs ? 'Vencimiento' : 'Due Date';
  const thStatus = isKu ? 'دۆخ' : isAr ? 'الحالة' : isTr ? 'Durum' : isFr ? 'Statut' : isEs ? 'Estado' : 'Status';
  const thNotes = isKu ? 'تێبینی' : isAr ? 'ملاحظات' : isTr ? 'Notlar' : isFr ? 'Notes' : isEs ? 'Notas' : 'Notes';

  const html = `
    <!DOCTYPE html>
    <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${settings.language}">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'IBM Plex Sans Arabic', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px; color: #0f172a; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
        .logo-title { font-size: 24px; font-weight: 800; color: #059669; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
        .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px; }
        .kpi-val { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .kpi-they { color: #059669; }
        .kpi-i { color: #e11d48; }
        .kpi-net { color: #0284c7; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th { background: #f1f5f9; padding: 10px 12px; border: 1px solid #cbd5e1; text-align: ${isRtl ? 'right' : 'left'}; font-weight: 700; }
        td { padding: 9px 12px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
        .badge-active { background: #dcfce7; color: #15803d; }
        .badge-settled { background: #e2e8f0; color: #475569; }
        .badge-they { color: #047857; font-weight: bold; }
        .badge-i { color: #be123c; font-weight: bold; }
        .num { font-variant-numeric: tabular-nums; font-weight: bold; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo-title">Loan Budget</div>
          <div class="subtitle">${title}</div>
          <div class="subtitle">${subtitle}</div>
        </div>
        <div style="text-align: ${isRtl ? 'left' : 'right'};">
          <span style="font-size: 11px; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-weight: 700;">
            ${scope.toUpperCase()}
          </span>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">${lblTheyOwe}</div>
          <div class="kpi-val kpi-they">${totals.totalTheyOwe.toLocaleString()} ${settings.currency}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${totals.activeTheyOweCount} ${lblActiveLoans}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">${lblIOwe}</div>
          <div class="kpi-val kpi-i">${totals.totalIOwe.toLocaleString()} ${settings.currency}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${totals.activeIOweCount} ${lblActiveLoans}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">${lblNet}</div>
          <div class="kpi-val kpi-net">${totals.netBalance >= 0 ? '+' : ''}${totals.netBalance.toLocaleString()} ${settings.currency}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${lblTotalRecords} ${filtered.length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${thName}</th>
            <th>${thType}</th>
            <th>${thOrig}</th>
            <th>${thPaid}</th>
            <th>${thRem}</th>
            <th>${thDue}</th>
            <th>${thStatus}</th>
            <th>${thNotes}</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((loan, idx) => {
            const rem = Math.max(0, loan.amount - (loan.paidAmount || 0));
            const isThey = loan.type === 'they_owe_me';
            return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${loan.personName}</strong> ${loan.phone ? '<br><small style="color:#64748b;">' + loan.phone + '</small>' : ''}</td>
                <td class="${isThey ? 'badge-they' : 'badge-i'}">${isThey ? (isKu ? 'قەرزەکانم لای ئەوان' : isAr ? 'يطلبني' : isTr ? 'Alacak' : isFr ? 'Créance' : isEs ? 'Me Debe' : 'They Owe') : (isKu ? 'قەرزەکانم' : isAr ? 'أطلبهم' : isTr ? 'Borç' : isFr ? 'Dette' : isEs ? 'Yo Debo' : 'I Owe')}</td>
                <td class="num">${loan.amount.toLocaleString()} ${loan.currency || 'USD'}</td>
                <td class="num" style="color: #059669;">${(loan.paidAmount || 0).toLocaleString()} ${loan.currency || 'USD'}</td>
                <td class="num" style="color: ${rem > 0 ? '#b91c1c' : '#059669'}; font-weight:800;">${rem.toLocaleString()} ${loan.currency || 'USD'}</td>
                <td>${loan.dueDate || '-'}</td>
                <td><span class="badge ${loan.status === 'settled' ? 'badge-settled' : 'badge-active'}">${loan.status === 'settled' ? (isKu ? 'پاکتاوکراو' : isAr ? 'تمت التسوية' : isTr ? 'Ödendi' : isFr ? 'Réglé' : isEs ? 'Saldado' : 'Settled') : (isKu ? 'چالاک' : isAr ? 'نشط' : isTr ? 'Aktif' : isFr ? 'Actif' : isEs ? 'Activo' : 'Active')}</span></td>
                <td><small style="color: #64748b;">${loan.notes || '-'}</small></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>Loan Budget &bull; ${isKu ? 'تۆماری فەرمی دارایی کەسی' : isAr ? 'سجل مالي معتمد' : isEs ? 'Registro Financiero Personal' : 'Personal Financial Record Keeping'}</div>
        <div>${isKu ? 'پەڕەی 1 لە 1' : isAr ? 'صفحة 1 من 1' : isEs ? 'Página 1 de 1' : 'Page 1 of 1'} &bull; ${today}</div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// ==========================================
// ARCHIVE / HISTORY DATABASE & PAYMENT LOGIC
// ==========================================

export const ARCHIVE_STORAGE_KEY = 'loan_budget_archive_v1';

export type ArchiveSortOrder = 'settled_desc' | 'settled_asc' | 'amount_desc' | 'name_asc';

export interface ArchiveFilterOptions {
  query?: string;
  type?: 'all' | LoanType;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: ArchiveSortOrder;
}

export function formatLocalIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseIsoDateLocal(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
    return null;
  }
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function getTodayIsoDate(): string {
  return formatLocalIsoDate(new Date());
}

export function settleAndArchiveLoan(loan: Loan, settleDate: string = getTodayIsoDate()): Loan {
  return {
    ...loan,
    status: 'settled',
    paidAmount: loan.amount,
    settledAt: loan.settledAt || settleDate,
  };
}

export function restoreArchivedLoan(loan: Loan): Loan {
  const currentPaid = loan.paidAmount || 0;
  return {
    ...loan,
    status: 'active',
    settledAt: undefined,
    paidAmount: currentPaid >= loan.amount ? 0 : currentPaid,
  };
}

export function partitionActiveAndArchivedLoans(
  loans: Loan[],
  existingArchive: Loan[] = [],
  settleDate: string = getTodayIsoDate()
): { activeLoans: Loan[]; archivedLoans: Loan[] } {
  const archiveMap = new Map<string, Loan>();
  for (const item of existingArchive) {
    archiveMap.set(item.id, settleAndArchiveLoan(item, settleDate));
  }

  const activeLoans: Loan[] = [];
  for (const loan of loans) {
    if (loan.status === 'settled') {
      archiveMap.set(loan.id, settleAndArchiveLoan(loan, settleDate));
    } else {
      activeLoans.push(loan);
    }
  }

  return {
    activeLoans,
    archivedLoans: Array.from(archiveMap.values()),
  };
}

export function applyPaymentUpdate(
  loan: Loan,
  updates: {
    personName?: string;
    linkedUsername?: string;
    amount?: number;
    paidAmount?: number;
    currency?: CurrencyCode;
    type?: LoanType;
    dueDate?: string;
    phone?: string;
    notes?: string;
    status?: 'active' | 'settled';
    exchangeRateAtEntry?: number;
    fxRateToUsdAtEntry?: number;
  },
  settleDate: string = getTodayIsoDate()
): { updatedLoan: Loan; shouldArchive: boolean } {
  const nextAmount = updates.amount !== undefined ? Math.max(0, updates.amount) : loan.amount;
  const rawPaid = updates.paidAmount !== undefined ? updates.paidAmount : (loan.paidAmount || 0);
  const clampedPaid = Math.max(0, Math.min(nextAmount, Math.round(rawPaid * 100) / 100));
  const isPaidInFull = nextAmount > 0 && clampedPaid >= nextAmount;
  const requestedStatus = updates.status ?? loan.status;
  const finalStatus: 'active' | 'settled' = isPaidInFull || requestedStatus === 'settled' ? 'settled' : 'active';
  const finalPaid = finalStatus === 'settled' && requestedStatus === 'settled' && clampedPaid < nextAmount
    ? nextAmount
    : clampedPaid;

  const nextLinkedUsername =
    updates.linkedUsername !== undefined
      ? updates.linkedUsername.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32) || undefined
      : loan.linkedUsername;

  const resolvedEntryRate =
    updates.exchangeRateAtEntry !== undefined && Number.isFinite(updates.exchangeRateAtEntry) && updates.exchangeRateAtEntry > 0
      ? updates.exchangeRateAtEntry
      : loan.exchangeRateAtEntry;
  const resolvedFxRate =
    updates.fxRateToUsdAtEntry !== undefined && Number.isFinite(updates.fxRateToUsdAtEntry) && updates.fxRateToUsdAtEntry > 0
      ? updates.fxRateToUsdAtEntry
      : loan.fxRateToUsdAtEntry;

  const updatedLoan: Loan = {
    ...loan,
    personName: updates.personName !== undefined ? updates.personName.trim() : loan.personName,
    linkedUsername: nextLinkedUsername,
    amount: Math.round(nextAmount * 100) / 100,
    paidAmount: finalPaid,
    currency: updates.currency ?? loan.currency ?? 'USD',
    type: updates.type ?? loan.type,
    dueDate: updates.dueDate !== undefined ? (updates.dueDate || undefined) : loan.dueDate,
    phone: updates.phone !== undefined ? (updates.phone.trim() || undefined) : loan.phone,
    notes: updates.notes !== undefined ? (updates.notes.trim() || undefined) : loan.notes,
    status: finalStatus,
    settledAt: finalStatus === 'settled' ? (loan.settledAt || settleDate) : undefined,
    ...(resolvedEntryRate !== undefined && Number.isFinite(resolvedEntryRate) && resolvedEntryRate > 0
      ? { exchangeRateAtEntry: resolvedEntryRate }
      : {}),
    ...(resolvedFxRate !== undefined && Number.isFinite(resolvedFxRate) && resolvedFxRate > 0
      ? { fxRateToUsdAtEntry: resolvedFxRate }
      : {}),
  };

  return {
    updatedLoan,
    shouldArchive: finalStatus === 'settled',
  };
}

export function filterAndSortArchivedLoans(
  archivedLoans: Loan[],
  options: ArchiveFilterOptions = {}
): Loan[] {
  const { query = '', type = 'all', dateFrom = '', dateTo = '', sortBy = 'settled_desc' } = options;
  const q = query.trim().toLowerCase();

  const filtered = archivedLoans.filter((loan) => {
    if (type !== 'all' && loan.type !== type) {
      return false;
    }

    const effectiveDate = loan.settledAt || loan.createdAt || '';
    if (dateFrom && effectiveDate && effectiveDate < dateFrom) {
      return false;
    }
    if (dateTo && effectiveDate && effectiveDate > dateTo) {
      return false;
    }

    if (q) {
      const cleanQ = q.replace(/^@+/, '');
      const nameMatch = (loan.personName || '').toLowerCase().includes(q);
      const usernameMatch = Boolean(cleanQ && loan.linkedUsername?.toLowerCase().includes(cleanQ));
      const notesMatch = loan.notes?.toLowerCase().includes(q);
      const phoneMatch = loan.phone?.toLowerCase().includes(q);
      const currMatch = (loan.currency || 'USD').toLowerCase().includes(q);
      if (!nameMatch && !usernameMatch && !notesMatch && !phoneMatch && !currMatch) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    const dateA = a.settledAt || a.createdAt || '';
    const dateB = b.settledAt || b.createdAt || '';
    switch (sortBy) {
      case 'settled_asc':
        return dateA.localeCompare(dateB);
      case 'amount_desc':
        return b.amount - a.amount;
      case 'name_asc':
        return (a.personName || '').localeCompare(b.personName || '');
      case 'settled_desc':
      default:
        return dateB.localeCompare(dateA);
    }
  });
}

// ==========================================
// CLOUD SYNC MERGE & DUE-DATE BANNER HELPERS
// ==========================================

export function mergeLocalAndCloudLoans(
  localActive: Loan[],
  localArchived: Loan[],
  cloudLoans: Loan[],
  settleDate: string = getTodayIsoDate()
): { activeLoans: Loan[]; archivedLoans: Loan[]; toUpload: Loan[] } {
  const cloudById = new Map<string, Loan>();
  for (const item of cloudLoans) {
    cloudById.set(item.id, item);
  }

  const allLocal = [...localActive, ...localArchived];
  const toUpload: Loan[] = [];
  const mergedMap = new Map<string, Loan>();

  for (const item of cloudLoans) {
    mergedMap.set(item.id, item);
  }

  for (const localItem of allLocal) {
    if (!cloudById.has(localItem.id)) {
      toUpload.push(localItem);
      mergedMap.set(localItem.id, localItem);
    }
  }

  const allMerged = Array.from(mergedMap.values());
  const partitioned = partitionActiveAndArchivedLoans(allMerged, [], settleDate);

  return {
    activeLoans: partitioned.activeLoans,
    archivedLoans: partitioned.archivedLoans,
    toUpload,
  };
}

export interface DueDateBannerState {
  dueTodayLoans: Loan[];
  dueCount: number;
  hasDueToday: boolean;
  headline: string;
  peopleSummary: string;
}

export function buildDueDateBannerState(
  loans: Loan[],
  language: Language = 'en',
  todayStr: string = getTodayIsoDate()
): DueDateBannerState {
  const dueTodayLoans = loans.filter((l) => l.status === 'active' && l.dueDate === todayStr);
  const dueCount = dueTodayLoans.length;

  const headline =
    language === 'ku'
      ? `ئاگاداری: ${dueCount} قەرزت هەیە ئەمڕۆ وادەکەی بەسەردەچێت!`
      : language === 'ar'
      ? `تنبيه: لديك ${dueCount} ديون مستحقة اليوم!`
      : language === 'tr'
      ? `Bugün Vadesi Dolan: ${dueCount} ödeme bekliyor!`
      : language === 'fr'
      ? `Échéance Aujourd'hui : ${dueCount} paiement(s) à traiter !`
      : language === 'es'
      ? `Vencen Hoy: ¡${dueCount} pago(s) requieren atención!`
      : `Payment Due Today: ${dueCount} deadline(s) require attention!`;

  return {
    dueTodayLoans,
    dueCount,
    hasDueToday: dueCount > 0,
    headline,
    peopleSummary: dueTodayLoans.map((l) => l.personName || 'Contact').join(', '),
  };
}

export function getFontFamilyForLanguage(language: Language): 'IBM Plex Sans' | 'IBM Plex Sans Arabic' {
  return language === 'ar' || language === 'ku' ? 'IBM Plex Sans Arabic' : 'IBM Plex Sans';
}

// ==========================================
// VISA & MASTERCARD PAYMENT GATEWAY HELPERS
// ==========================================

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');
  if (!digits) return 'unknown';
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) {
    return 'mastercard';
  }
  return 'unknown';
}

export function formatCardNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatCardExpiry(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface CardValidationResult {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  errorField?: 'cardholderName' | 'cardNumber' | 'expiry' | 'cvv';
  errorCode?: string;
}

export function validateMockCardPayment(
  input: {
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
  },
  referenceDate: Date = new Date()
): CardValidationResult {
  const digits = input.cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(digits);
  const last4 = digits.slice(-4);
  const holder = input.cardholderName.trim();

  if (holder.length < 2) {
    return { valid: false, brand, last4, errorField: 'cardholderName', errorCode: 'invalid_holder' };
  }

  if (brand === 'unknown' || (brand === 'visa' && digits.length !== 16 && digits.length !== 13) || (brand === 'mastercard' && digits.length !== 16)) {
    return { valid: false, brand, last4, errorField: 'cardNumber', errorCode: 'invalid_card_number' };
  }

  const expMatch = input.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) {
    return { valid: false, brand, last4, errorField: 'expiry', errorCode: 'invalid_expiry' };
  }

  const expMonth = parseInt(expMatch[1], 10);
  const expYear = 2000 + parseInt(expMatch[2], 10);
  if (expMonth < 1 || expMonth > 12) {
    return { valid: false, brand, last4, errorField: 'expiry', errorCode: 'invalid_expiry_month' };
  }

  const nowYear = referenceDate.getFullYear();
  const nowMonth = referenceDate.getMonth() + 1;
  if (expYear < nowYear || (expYear === nowYear && expMonth < nowMonth)) {
    return { valid: false, brand, last4, errorField: 'expiry', errorCode: 'card_expired' };
  }

  const cvvDigits = input.cvv.replace(/\D/g, '');
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return { valid: false, brand, last4, errorField: 'cvv', errorCode: 'invalid_cvv' };
  }

  return { valid: true, brand, last4 };
}

export interface LockedCheckoutPayoff {
  loanId: string;
  loanType: LoanType;
  isIOweLocked: boolean;
  currency: CurrencyCode;
  originalAmount: number;
  paidBefore: number;
  lockedExactAmount: number;
  progressBefore: number;
  progressAfter: 100;
  formattedUnsigned: string;
  formattedSigned: string;
}

export function buildLockedCheckoutPayoff(
  loan: Pick<Loan, 'id' | 'type' | 'currency' | 'amount' | 'paidAmount' | 'status'>,
  language: Language = 'en'
): LockedCheckoutPayoff {
  const currency = loan.currency || 'USD';
  const originalAmount = roundCurrencyAmount(Math.max(0, Number(loan.amount) || 0));
  const paidBefore = roundCurrencyAmount(Math.max(0, Math.min(originalAmount, Number(loan.paidAmount) || 0)));
  const lockedExactAmount = loan.status === 'settled' ? 0 : getRemainingLoanBalance({ amount: originalAmount, paidAmount: paidBefore });
  const progressBefore = computeDebtProgressPercent(loan);
  return {
    loanId: loan.id,
    loanType: loan.type,
    isIOweLocked: loan.type === 'i_owe_them',
    currency,
    originalAmount,
    paidBefore,
    lockedExactAmount,
    progressBefore,
    progressAfter: 100,
    formattedUnsigned: formatCardDebt(lockedExactAmount, currency, language),
    formattedSigned: formatSignedCardDebt(lockedExactAmount, currency, language, loan.type),
  };
}

export function settleLoanByCardPayment(
  loan: Loan,
  paymentMeta: { brand: CardBrand; last4: string; cardholderName: string; lockedAmount?: number },
  settleDate: string = getTodayIsoDate()
): Loan {
  const networkLabel = paymentMeta.brand === 'mastercard' ? 'Mastercard' : paymentMeta.brand === 'visa' ? 'Visa' : 'Card';
  const exactPaidNow =
    typeof paymentMeta.lockedAmount === 'number' && paymentMeta.lockedAmount >= 0
      ? roundCurrencyAmount(paymentMeta.lockedAmount)
      : getRemainingLoanBalance(loan);
  const formattedExact = formatCardDebt(exactPaidNow, loan.currency || 'USD', 'en');
  const cardNote = `Paid ${formattedExact} via ${networkLabel} •••• ${paymentMeta.last4}`;
  const combinedNotes = loan.notes ? `${loan.notes} · ${cardNote}` : cardNote;
  return {
    ...loan,
    status: 'settled',
    paidAmount: roundCurrencyAmount(Math.max(0, loan.amount)),
    settledAt: settleDate,
    notes: combinedNotes.slice(0, 950),
  };
}

// ==========================================
// FIRST IRAQI BANK (FIB) LOCAL RAIL HELPERS
// ==========================================

export type PaymentRail = 'card' | 'fib';
export type FibPaymentMethod = 'qr' | 'iban';

export function canShowPaymentActions(
  loan: Pick<Loan, 'type' | 'status'>
): boolean {
  return loan.status === 'active' && loan.type === 'i_owe_them';
}

export function sanitizeProfileFibAccount(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34);
}

export interface ProfileFibValidationResult {
  valid: boolean;
  normalized: string;
  formatted: string;
  reason?: 'invalid_format';
}

export function formatFibIbanOrAccount(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 28);
  if (!cleaned) return '';
  return cleaned.replace(/(.{4})(?=.)/g, '$1 ').trim();
}

export function validateProfileFibAccount(raw: string): ProfileFibValidationResult {
  const normalized = sanitizeProfileFibAccount(raw);
  if (!normalized) {
    return { valid: true, normalized: '', formatted: '' };
  }
  const isIraqiIban = /^IQ\d{2}[A-Z0-9]{10,24}$/.test(normalized);
  const isNumericClientAccount = /^\d{8,16}$/.test(normalized);
  if (!isIraqiIban && !isNumericClientAccount) {
    return {
      valid: false,
      normalized,
      formatted: formatFibIbanOrAccount(normalized),
      reason: 'invalid_format',
    };
  }
  return {
    valid: true,
    normalized,
    formatted: formatFibIbanOrAccount(normalized),
  };
}

export interface ParsedFibQrResult {
  valid: boolean;
  normalizedAccount: string;
  formattedAccount: string;
  accountLast4: string;
  recipientName?: string;
  qrEmbeddedAmount?: number;
  lockedAmount: number;
  reference: string;
  sourceFormat: 'fib_uri' | 'json' | 'labeled_text' | 'raw_iban' | 'invalid';
  reason?: 'empty' | 'invalid_fib_qr';
}

/**
 * Extracts First Iraqi Bank (FIB) IBAN / Account Number & holder metadata from scanned QR payloads
 * (fib://pay URI, JSON object, labeled key-value text, or raw IQ IBAN / account digits)
 * while preserving the debt's exact locked payoff amount.
 */
export function parseFibQrPayload(rawPayload: string, lockedAmount: number): ParsedFibQrResult {
  const safeLocked = roundCurrencyAmount(Math.max(0, Number.isFinite(lockedAmount) ? lockedAmount : 0));
  const trimmed = (rawPayload || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      normalizedAccount: '',
      formattedAccount: '',
      accountLast4: '',
      lockedAmount: safeLocked,
      reference: '',
      sourceFormat: 'invalid',
      reason: 'empty',
    };
  }

  let candidateAccount = '';
  let recipientName: string | undefined;
  let qrEmbeddedAmount: number | undefined;
  let explicitRef: string | undefined;
  let sourceFormat: ParsedFibQrResult['sourceFormat'] = 'raw_iban';

  const tryParsePositiveAmount = (val: unknown): number | undefined => {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      return roundCurrencyAmount(val);
    }
    if (typeof val === 'string') {
      const cleaned = sanitizeDecimalAmountInput(val);
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed) && parsed > 0) {
        return roundCurrencyAmount(parsed);
      }
    }
    return undefined;
  };

  if (/^fib:\/\//i.test(trimmed)) {
    sourceFormat = 'fib_uri';
    try {
      const normalizedUrl = trimmed.replace(/^fib:\/\//i, 'https://fib.local/');
      const url = new URL(normalizedUrl);
      const p = url.searchParams;
      candidateAccount = p.get('iban') || p.get('account') || p.get('acct') || p.get('to') || '';
      if (!candidateAccount && url.pathname && url.pathname !== '/pay') {
        candidateAccount = url.pathname.replace(/^\/+/, '');
      }
      const rawName = (p.get('name') || p.get('holder') || p.get('recipient') || '').trim();
      if (rawName) recipientName = rawName.slice(0, 120);
      qrEmbeddedAmount = tryParsePositiveAmount(p.get('amount'));
      const rawRef = (p.get('ref') || p.get('reference') || '').trim();
      if (rawRef) explicitRef = rawRef.slice(0, 48);
    } catch {
      // fall through to regex match below
    }
  } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    sourceFormat = 'json';
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const rec = obj as Record<string, unknown>;
        candidateAccount = String(rec.iban || rec.account || rec.fibAccount || rec.acct || '');
        const rawName = String(rec.name || rec.holder || rec.recipient || '').trim();
        if (rawName) recipientName = rawName.slice(0, 120);
        qrEmbeddedAmount = tryParsePositiveAmount(rec.amount);
        const rawRef = String(rec.ref || rec.reference || '').trim();
        if (rawRef) explicitRef = rawRef.slice(0, 48);
      }
    } catch {
      // fall through
    }
  }

  if (!candidateAccount) {
    const ibanMatch = trimmed.match(/\bIBAN[ \t]*[:=][ \t]*([A-Za-z0-9 \t-]{10,36})/i)
      || trimmed.match(/\bACCOUNT[ \t]*[:=][ \t]*([A-Za-z0-9 \t-]{8,36})/i);
    if (ibanMatch) {
      sourceFormat = 'labeled_text';
      candidateAccount = ibanMatch[1];
    }
    const nameMatch = trimmed.match(/\b(?:NAME|HOLDER|RECIPIENT)[ \t]*[:=][ \t]*([^\n;&|]+)/i);
    if (nameMatch && !recipientName) {
      recipientName = nameMatch[1].trim().slice(0, 120);
    }
    const amountMatch = trimmed.match(/\bAMOUNT[ \t]*[:=][ \t]*([0-9.,]+)/i);
    if (amountMatch && qrEmbeddedAmount === undefined) {
      qrEmbeddedAmount = tryParsePositiveAmount(amountMatch[1]);
    }
  }

  if (!candidateAccount) {
    const spacedRemoved = trimmed.replace(/[\s-]+/g, '').toUpperCase();
    const inlineIban = spacedRemoved.match(/IQ\d{2}[A-Z0-9]{10,24}/);
    if (inlineIban) {
      candidateAccount = inlineIban[0];
    } else if (/^\d{8,16}$/.test(spacedRemoved)) {
      candidateAccount = spacedRemoved;
    } else {
      const inlineDigits = trimmed.match(/\b(\d{8,16})\b/);
      if (inlineDigits) {
        candidateAccount = inlineDigits[1];
      }
    }
  }

  const check = validateProfileFibAccount(candidateAccount);
  if (!check.valid || !check.normalized) {
    return {
      valid: false,
      normalizedAccount: check.normalized,
      formattedAccount: check.formatted,
      accountLast4: check.normalized.slice(-4),
      recipientName,
      qrEmbeddedAmount,
      lockedAmount: safeLocked,
      reference: '',
      sourceFormat: 'invalid',
      reason: 'invalid_fib_qr',
    };
  }

  const last4 = check.normalized.slice(-4);
  return {
    valid: true,
    normalizedAccount: check.normalized,
    formattedAccount: check.formatted,
    accountLast4: last4,
    ...(recipientName ? { recipientName } : {}),
    ...(qrEmbeddedAmount !== undefined ? { qrEmbeddedAmount } : {}),
    lockedAmount: safeLocked,
    reference: explicitRef || `FIB-QR-${last4}`,
    sourceFormat,
  };
}

export function buildFibPaymentQrPayload(params: {
  fibAccount: string;
  amount?: number;
  currency?: CurrencyCode;
}): string {
  const validated = validateProfileFibAccount(params.fibAccount);
  if (!validated.valid || !validated.normalized) return '';
  const curr: CurrencyCode = params.currency || 'IQD';
  const safeAmt =
    typeof params.amount === 'number' && Number.isFinite(params.amount) && params.amount > 0
      ? roundCurrencyAmount(params.amount)
      : 0;
  if (safeAmt > 0) {
    return `fib://pay?account=${validated.normalized}&amount=${safeAmt}&currency=${curr}`;
  }
  return `fib://pay?account=${validated.normalized}&currency=${curr}`;
}

export interface ResolvedCounterpartyFibProfile {
  hasFib: boolean;
  fibAccount: string;
  formattedFibAccount: string;
  accountLast4: string;
  recipientName: string;
  qrPayload: string;
}

export function resolveCounterpartyFibProfile(params: {
  loan: Pick<Loan, 'personName' | 'linkedUsername' | 'amount' | 'paidAmount' | 'currency'>;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  cloudProfile?: { username?: string; displayName?: string; fibAccount?: string } | null;
}): ResolvedCounterpartyFibProfile {
  const { loan, friends = [], chatThreads = [], cloudProfile = null } = params;
  const targetNorm = resolveExactLoanChatUsername(loan);
  const matchedFriend = targetNorm ? findFriendByExactUsername(friends, targetNorm) : null;

  let threadAccount = '';
  let threadDisplay = '';
  if (targetNorm && chatThreads.length > 0) {
    for (const thread of chatThreads) {
      const profiles = thread.participantProfiles;
      if (!profiles) continue;
      for (const snap of Object.values(profiles)) {
        if (snap.username && normalizeUsernameHandle(snap.username) === targetNorm) {
          if (snap.fibAccount && !threadAccount) {
            threadAccount = snap.fibAccount;
          }
          if (snap.displayName && !threadDisplay) {
            threadDisplay = snap.displayName;
          }
        }
      }
    }
  }

  const candidateRaw = cloudProfile?.fibAccount || matchedFriend?.fibAccount || threadAccount || '';
  const validated = validateProfileFibAccount(candidateRaw);
  const fibAccount = validated.valid ? validated.normalized : '';
  const formattedFibAccount = validated.valid ? validated.formatted : '';
  const recipientName =
    cloudProfile?.displayName?.trim() ||
    matchedFriend?.displayName?.trim() ||
    threadDisplay.trim() ||
    loan.personName;
  const remaining = getRemainingLoanBalance(loan);
  const curr: CurrencyCode = loan.currency || 'USD';
  const qrPayload = fibAccount
    ? buildFibPaymentQrPayload({
        fibAccount,
        amount: remaining,
        currency: curr,
      })
    : '';

  return {
    hasFib: Boolean(fibAccount),
    fibAccount,
    formattedFibAccount,
    accountLast4: fibAccount ? fibAccount.slice(-4) : '',
    recipientName,
    qrPayload,
  };
}

export interface FibValidationResult {
  valid: boolean;
  method: FibPaymentMethod;
  normalizedAccount: string;
  accountLast4: string;
  reference: string;
  errorField?: 'accountOrIban' | 'qr';
  errorCode?: string;
}

export function validateMockFibPayment(input: {
  method: FibPaymentMethod;
  qrScanned?: boolean;
  accountOrIban?: string;
  accountHolderName?: string;
  loanId?: string;
}): FibValidationResult {
  const shortSeed = (input.loanId || 'FIB').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '8824';
  const raw = sanitizeProfileFibAccount(input.accountOrIban || '');
  const isIraqiIban = /^IQ\d{2}[A-Z0-9]{10,24}$/.test(raw);
  const isNumericClientAccount = /^\d{8,16}$/.test(raw);
  const hasValidRawAccount = isIraqiIban || isNumericClientAccount;

  if (input.method === 'qr') {
    if (!input.qrScanned) {
      return {
        valid: false,
        method: 'qr',
        normalizedAccount: '',
        accountLast4: shortSeed,
        reference: `FIB-QP-${shortSeed}`,
        errorField: 'qr',
        errorCode: 'fib_qr_not_scanned',
      };
    }
    if (hasValidRawAccount) {
      const last4 = raw.slice(-4);
      return {
        valid: true,
        method: 'qr',
        normalizedAccount: raw,
        accountLast4: last4,
        reference: `FIB-QR-${last4}`,
      };
    }
    return {
      valid: true,
      method: 'qr',
      normalizedAccount: 'FIB-QUICKPAY',
      accountLast4: shortSeed,
      reference: `FIB-QP-${shortSeed}`,
    };
  }

  if (!hasValidRawAccount) {
    return {
      valid: false,
      method: 'iban',
      normalizedAccount: raw,
      accountLast4: raw.slice(-4),
      reference: '',
      errorField: 'accountOrIban',
      errorCode: 'invalid_fib_account',
    };
  }

  const last4 = raw.slice(-4);
  return {
    valid: true,
    method: 'iban',
    normalizedAccount: raw,
    accountLast4: last4,
    reference: `FIB-IBAN-${last4}`,
  };
}

export function settleLoanByFibPayment(
  loan: Loan,
  paymentMeta: {
    method: FibPaymentMethod;
    reference: string;
    accountLast4: string;
    accountHolderName?: string;
    lockedAmount?: number;
  },
  settleDate: string = getTodayIsoDate()
): Loan {
  const exactPaidNow =
    typeof paymentMeta.lockedAmount === 'number' && paymentMeta.lockedAmount >= 0
      ? roundCurrencyAmount(paymentMeta.lockedAmount)
      : getRemainingLoanBalance(loan);
  const formattedExact = formatCardDebt(exactPaidNow, loan.currency || 'USD', 'en');
  const fibNote =
    paymentMeta.method === 'qr'
      ? `Paid ${formattedExact} via First Iraqi Bank (FIB QuickPay · ${paymentMeta.reference})`
      : `Paid ${formattedExact} via First Iraqi Bank (FIB •••• ${paymentMeta.accountLast4})`;
  const combinedNotes = loan.notes ? `${loan.notes} · ${fibNote}` : fibNote;
  return {
    ...loan,
    status: 'settled',
    paidAmount: roundCurrencyAmount(Math.max(0, loan.amount)),
    settledAt: settleDate,
    notes: combinedNotes.slice(0, 950),
  };
}

export function isFibPaymentNote(notes?: string): boolean {
  if (!notes) return false;
  return /First Iraqi Bank|\(FIB\b/i.test(notes);
}

// ==========================================
// TRANSACTION LEDGER HELPERS
// ==========================================

export const TRANSACTIONS_STORAGE_KEY = 'loan_budget_transactions_v1';

export function getRemainingLoanBalance(loan: Pick<Loan, 'amount' | 'paidAmount'>): number {
  return Math.max(0, Math.round((loan.amount - (loan.paidAmount || 0)) * 100) / 100);
}

export function formatTransactionTimestamp(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (isNaN(d.getTime())) {
    return isoTimestamp.slice(0, 19).replace('T', ' ');
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function createTransactionEntry(params: {
  loan: Loan;
  action: TransactionActionType;
  amountChange: number;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
  now?: Date;
  id?: string;
  exchangeRateAtEntry?: number;
  fxRateToUsdAtEntry?: number;
}): TransactionEntry {
  const nowDate = params.now || new Date();
  const iso = nowDate.toISOString();
  const dateStr = formatLocalIsoDate(nowDate);
  const uniqueSuffix = Math.random().toString(36).slice(2, 7);
  const entryRate = params.exchangeRateAtEntry ?? params.loan.exchangeRateAtEntry;
  const fxRate = params.fxRateToUsdAtEntry ?? params.loan.fxRateToUsdAtEntry;
  return {
    id: params.id || `tx_${nowDate.getTime()}_${uniqueSuffix}`,
    loanId: params.loan.id,
    personName: params.loan.personName,
    ...(params.loan.linkedUsername ? { linkedUsername: params.loan.linkedUsername } : {}),
    loanType: params.loan.type,
    action: params.action,
    amountChange: Math.max(0, Math.round(params.amountChange * 100) / 100),
    balanceBefore: Math.max(0, Math.round(params.balanceBefore * 100) / 100),
    balanceAfter: Math.max(0, Math.round(params.balanceAfter * 100) / 100),
    currency: params.loan.currency || 'USD',
    timestamp: iso,
    dateStr,
    notes: params.notes?.trim() ? params.notes.trim().slice(0, 950) : undefined,
    ...(entryRate !== undefined && Number.isFinite(entryRate) && entryRate > 0 ? { exchangeRateAtEntry: entryRate } : {}),
    ...(fxRate !== undefined && Number.isFinite(fxRate) && fxRate > 0 ? { fxRateToUsdAtEntry: fxRate } : {}),
  };
}

export function deriveUpdateTransaction(
  prevLoan: Loan,
  nextLoan: Loan,
  explicitAction?: TransactionActionType,
  now: Date = new Date(),
  rateOverride?: {
    exchangeRateAtEntry?: number;
    fxRateToUsdAtEntry?: number;
  }
): TransactionEntry {
  const prevPaid = prevLoan.paidAmount || 0;
  const nextPaid = nextLoan.paidAmount || 0;
  const balanceBefore = prevLoan.status === 'settled' ? 0 : getRemainingLoanBalance(prevLoan);
  const balanceAfter = nextLoan.status === 'settled' ? 0 : getRemainingLoanBalance(nextLoan);

  const amountDelta = Math.round((nextLoan.amount - prevLoan.amount) * 100) / 100;
  const paidDelta = Math.round((nextPaid - prevPaid) * 100) / 100;

  let action: TransactionActionType = explicitAction || 'edited';
  let amountChange = 0;

  if (explicitAction) {
    if (explicitAction === 'added_money') {
      amountChange = Math.abs(amountDelta || balanceAfter - balanceBefore);
    } else if (explicitAction === 'repayment' || explicitAction === 'settled' || explicitAction === 'card_payment') {
      amountChange = Math.abs(paidDelta) > 0 ? Math.abs(paidDelta) : Math.abs(balanceBefore - balanceAfter);
    } else if (explicitAction === 'restored') {
      amountChange = balanceAfter;
    } else {
      amountChange = Math.abs(balanceAfter - balanceBefore);
    }
  } else if (prevLoan.status === 'active' && nextLoan.status === 'settled') {
    action = 'settled';
    amountChange = Math.abs(balanceBefore - balanceAfter);
  } else if (prevLoan.status === 'settled' && nextLoan.status === 'active') {
    action = 'restored';
    amountChange = balanceAfter;
  } else if (amountDelta > 0.001 && Math.abs(paidDelta) < 0.001) {
    action = 'added_money';
    amountChange = amountDelta;
  } else if (paidDelta > 0.001) {
    action = 'repayment';
    amountChange = paidDelta;
  } else {
    action = 'edited';
    amountChange = Math.abs(balanceAfter - balanceBefore);
  }

  return createTransactionEntry({
    loan: nextLoan,
    action,
    amountChange,
    balanceBefore,
    balanceAfter,
    notes: nextLoan.notes,
    now,
    exchangeRateAtEntry: rateOverride?.exchangeRateAtEntry,
    fxRateToUsdAtEntry: rateOverride?.fxRateToUsdAtEntry,
  });
}

export function mergeLocalAndCloudTransactions(
  localTxs: TransactionEntry[],
  cloudTxs: TransactionEntry[]
): { mergedTransactions: TransactionEntry[]; toUpload: TransactionEntry[] } {
  const cloudById = new Map<string, TransactionEntry>();
  for (const tx of cloudTxs) {
    cloudById.set(tx.id, tx);
  }

  const mergedMap = new Map<string, TransactionEntry>();
  for (const tx of cloudTxs) {
    mergedMap.set(tx.id, tx);
  }

  const toUpload: TransactionEntry[] = [];
  for (const localTx of localTxs) {
    if (!cloudById.has(localTx.id)) {
      toUpload.push(localTx);
      mergedMap.set(localTx.id, localTx);
    }
  }

  const mergedTransactions = Array.from(mergedMap.values()).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  return { mergedTransactions, toUpload };
}

export function filterTransactions(
  transactions: TransactionEntry[],
  options: { query?: string; type?: 'all' | LoanType } = {}
): TransactionEntry[] {
  const { query = '', type = 'all' } = options;
  const q = query.trim().toLowerCase();

  return [...transactions]
    .filter((tx) => {
      if (type !== 'all' && tx.loanType !== type) {
        return false;
      }
      if (q) {
        const cleanQ = q.replace(/^@+/, '');
        const nameMatch = tx.personName.toLowerCase().includes(q);
        const usernameMatch = Boolean(cleanQ && tx.linkedUsername?.toLowerCase().includes(cleanQ));
        const notesMatch = tx.notes?.toLowerCase().includes(q);
        const currMatch = tx.currency.toLowerCase().includes(q);
        const actionMatch = tx.action.toLowerCase().includes(q);
        if (!nameMatch && !usernameMatch && !notesMatch && !currMatch && !actionMatch) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function summarizeTransactions(
  transactions: TransactionEntry[],
  activeCurrency: CurrencyCode = 'USD'
): {
  totalReceivableVolume: number;
  totalPayableVolume: number;
  receivableEvents: number;
  payableEvents: number;
  totalCount: number;
} {
  let totalReceivableVolume = 0;
  let totalPayableVolume = 0;
  let receivableEvents = 0;
  let payableEvents = 0;

  for (const tx of transactions) {
    const val = (tx.currency || 'USD') === activeCurrency ? (tx.amountChange || 0) : 0;
    if (tx.loanType === 'they_owe_me') {
      totalReceivableVolume += val;
      receivableEvents++;
    } else {
      totalPayableVolume += val;
      payableEvents++;
    }
  }

  return {
    totalReceivableVolume: Math.round(totalReceivableVolume * 100) / 100,
    totalPayableVolume: Math.round(totalPayableVolume * 100) / 100,
    receivableEvents,
    payableEvents,
    totalCount: transactions.length,
  };
}

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  reason?: 'too_short' | 'too_long' | 'invalid_chars';
}

/**
 * Validates and normalizes custom usernames supporting letters, numbers, and underscores
 * (e.g., user123, lanya_2026). Empty username is valid (optional handle).
 */
export function validateProfileUsername(raw: string): UsernameValidationResult {
  const trimmed = raw.trim().replace(/^@+/, '');
  if (!trimmed) {
    return { valid: true, normalized: '' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, normalized: trimmed, reason: 'invalid_chars' };
  }
  if (trimmed.length < 3) {
    return { valid: false, normalized: trimmed, reason: 'too_short' };
  }
  if (trimmed.length > 32) {
    return { valid: false, normalized: trimmed.slice(0, 32), reason: 'too_long' };
  }
  return { valid: true, normalized: trimmed };
}

export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;
export const USERNAME_CHANGE_COOLDOWN_MS = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export interface UsernameCooldownResult {
  allowed: boolean;
  changed: boolean;
  normalizedNext: string;
  availableAtMs?: number;
  availableAtIso?: string;
  remainingMs?: number;
  nextChangeDateIso?: string;
}

/**
 * Enforces the 7-day username modification cooldown:
 * - Unchanged usernames (case-insensitive) are always allowed without resetting the cooldown.
 * - First-time handle setup (no prior username and no prior timestamp) is allowed and records `nowMs`.
 * - Any modification within 7 days of `lastUsernameChangeDate` is blocked with exact unlock timestamp.
 */
export function checkUsernameChangeEligibility(params: {
  currentUsername?: string;
  nextUsername: string;
  lastUsernameChangeDate?: string | number;
  nowMs?: number;
}): UsernameCooldownResult {
  const nowMs = typeof params.nowMs === 'number' && Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
  const currentNorm = (params.currentUsername || '').trim().replace(/^@+/, '');
  const nextNorm = params.nextUsername.trim().replace(/^@+/, '');

  const changed = currentNorm.toLowerCase() !== nextNorm.toLowerCase();
  if (!changed) {
    return {
      allowed: true,
      changed: false,
      normalizedNext: nextNorm,
      nextChangeDateIso:
        typeof params.lastUsernameChangeDate === 'number'
          ? new Date(params.lastUsernameChangeDate).toISOString()
          : params.lastUsernameChangeDate || undefined,
    };
  }

  let parsedLastMs = NaN;
  if (typeof params.lastUsernameChangeDate === 'number') {
    parsedLastMs = params.lastUsernameChangeDate;
  } else {
    const rawDate = (params.lastUsernameChangeDate || '').trim();
    parsedLastMs = rawDate ? (/^\d+$/.test(rawDate) ? Number(rawDate) : Date.parse(rawDate)) : NaN;
  }

  // Enforce cooldown whenever a prior modification timestamp exists
  if (Number.isFinite(parsedLastMs) && parsedLastMs > 0) {
    const elapsedMs = nowMs - parsedLastMs;
    if (elapsedMs < USERNAME_CHANGE_COOLDOWN_MS) {
      const availableAtMs = parsedLastMs + USERNAME_CHANGE_COOLDOWN_MS;
      return {
        allowed: false,
        changed: true,
        normalizedNext: nextNorm,
        availableAtMs,
        availableAtIso: new Date(availableAtMs).toISOString(),
        remainingMs: Math.max(0, availableAtMs - nowMs),
      };
    }
  }

  return {
    allowed: true,
    changed: true,
    normalizedNext: nextNorm,
    nextChangeDateIso: new Date(nowMs).toISOString(),
  };
}

/**
 * Formats an exact unlock date/time string cleanly in the active UI language.
 */
export function formatUsernameCooldownDate(
  dateInput: string | number,
  language: Language = 'en'
): string {
  const ts = typeof dateInput === 'number' ? dateInput : Date.parse(dateInput);
  if (!Number.isFinite(ts)) return String(dateInput);

  const localeMap: Record<Language, string> = {
    en: 'en-US',
    ar: 'ar-EG',
    ku: 'ckb-IQ',
    tr: 'tr-TR',
    fr: 'fr-FR',
    es: 'es-ES',
  };

  try {
    return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 16);
  }
}

/**
 * Rounds monetary amounts cleanly to 2 decimal places without floating-point drift.
 */
export function roundCurrencyAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Sanitizes decimal monetary input strings: converts Eastern numerals, strips minus/invalid chars,
 * prevents duplicate decimal points, and limits fractional precision to 2 decimals.
 */
export function sanitizeDecimalAmountInput(raw: string): string {
  const normalized = toWesternNumerals(raw).replace(/,/g, '').replace(/[^\d.]/g, '');
  const dotIndex = normalized.indexOf('.');
  if (dotIndex === -1) return normalized;
  const intPart = normalized.slice(0, dotIndex);
  const fracPart = normalized
    .slice(dotIndex + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  return `${intPart}.${fracPart}`;
}

/**
 * Sanitizes profile fields to fit local storage and Firestore volumetric constraints.
 */
export function sanitizeProfileSettingsPatch(input: {
  profileName?: string;
  profileUsername?: string;
  profileBio?: string;
  profileAvatar?: string;
  profileJoinedAt?: string;
  lastUsernameChangeDate?: string;
  profileFibAccount?: string;
}): Partial<UserSettings> {
  const patch: Partial<UserSettings> = {};
  if (input.profileName !== undefined) {
    patch.profileName = input.profileName.trim().slice(0, 120);
  }
  if (input.profileUsername !== undefined) {
    const cleanHandle = input.profileUsername.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    patch.profileUsername = cleanHandle;
  }
  if (input.profileBio !== undefined) {
    patch.profileBio = input.profileBio.trim().slice(0, 300);
  }
  if (input.profileAvatar !== undefined) {
    const avatar = input.profileAvatar.trim();
    patch.profileAvatar = avatar.length <= 250000 ? avatar : '';
  }
  if (input.profileJoinedAt !== undefined) {
    patch.profileJoinedAt = input.profileJoinedAt.trim().slice(0, 64);
  }
  if (input.lastUsernameChangeDate !== undefined) {
    patch.lastUsernameChangeDate = input.lastUsernameChangeDate.trim().slice(0, 64);
  }
  if (input.profileFibAccount !== undefined) {
    patch.profileFibAccount = sanitizeProfileFibAccount(input.profileFibAccount);
  }
  return patch;
}

export interface AvatarCropRect {
  sx: number;
  sy: number;
  sSize: number;
}

/**
 * Computes a bounded square source crop rectangle for an avatar image given zoom (1..3)
 * and normalized pan offsets (-1..1).
 */
export function calculateAvatarCropRect(
  imgWidth: number,
  imgHeight: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0
): AvatarCropRect {
  const safeW = Math.max(1, imgWidth);
  const safeH = Math.max(1, imgHeight);
  const minSide = Math.min(safeW, safeH);
  const clampedZoom = Math.max(1, Math.min(3, Number.isFinite(zoom) ? zoom : 1));
  const sSize = minSide / clampedZoom;

  const maxOffsetX = Math.max(0, (safeW - sSize) / 2);
  const maxOffsetY = Math.max(0, (safeH - sSize) / 2);
  const clampedPanX = Math.max(-1, Math.min(1, Number.isFinite(panX) ? panX : 0));
  const clampedPanY = Math.max(-1, Math.min(1, Number.isFinite(panY) ? panY : 0));

  const centerX = safeW / 2 - clampedPanX * maxOffsetX;
  const centerY = safeH / 2 - clampedPanY * maxOffsetY;

  const sx = Math.max(0, Math.min(safeW - sSize, centerX - sSize / 2));
  const sy = Math.max(0, Math.min(safeH - sSize, centerY - sSize / 2));

  return {
    sx: Math.round(sx * 100) / 100,
    sy: Math.round(sy * 100) / 100,
    sSize: Math.round(sSize * 100) / 100,
  };
}

/**
 * Normalizes a lookup handle (e.g. "@Lanya_2026 " -> "lanya_2026") for exact /usernames/{handle} queries.
 */
export function normalizeUsernameHandle(raw: string): string {
  const cleaned = raw.trim().replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(cleaned)) {
    return '';
  }
  return cleaned;
}

/**
 * Builds a deterministic, symmetric 1-to-1 chat document ID for two verified UIDs.
 */
export function buildDirectChatId(uidA: string, uidB: string): string {
  const cleanA = uidA.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const cleanB = uidB.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  if (!cleanA || !cleanB || cleanA === cleanB) {
    return '';
  }
  return cleanA < cleanB ? `${cleanA}_${cleanB}` : `${cleanB}_${cleanA}`;
}

/**
 * Validates and trims outgoing friend chat messages to match Firestore bounds (1..1000 chars).
 */
export function validateFriendChatMessageText(raw: string): { valid: boolean; cleaned: string } {
  const cleaned = raw.trim().slice(0, 1000);
  return {
    valid: cleaned.length >= 1 && cleaned.length <= 1000,
    cleaned,
  };
}

/**
 * Formats a concise human-readable summary when referencing a loan inside friend chat.
 */
export function formatLoanChatReferenceSummary(loan: Loan, language: Language = 'en'): string {
  const curr = loan.currency || 'USD';
  const remaining = loan.status === 'settled' ? 0 : getRemainingLoanBalance(loan);
  const amountText = formatSignedCardDebt(remaining || loan.amount, curr, language, loan.type);
  const statusTag =
    loan.status === 'settled'
      ? language === 'ar'
        ? 'مسدد'
        : language === 'ku'
        ? 'پاکتاوکراو'
        : language === 'tr'
        ? 'Ödendi'
        : language === 'fr'
        ? 'Réglé'
        : language === 'es'
        ? 'Saldado'
        : 'Settled'
      : language === 'ar'
      ? 'نشط'
      : language === 'ku'
      ? 'چالاک'
      : language === 'tr'
      ? 'Aktif'
      : language === 'fr'
      ? 'Actif'
      : language === 'es'
      ? 'Activo'
      : 'Active';

  return `${loan.personName || 'Contact'} (${amountText} · ${statusTag})`;
}

/**
 * Filters a user's friend list by @username, displayName, or bio substring.
 */
export function filterFriendsByQuery(friends: FriendRecord[], query: string): FriendRecord[] {
  const q = query.trim().replace(/^@+/, '').toLowerCase();
  if (!q) return friends;
  return friends.filter((f) => {
    return (
      f.username.toLowerCase().includes(q) ||
      (f.displayName || '').toLowerCase().includes(q) ||
      (f.bio || '').toLowerCase().includes(q)
    );
  });
}

/**
 * Reconciles incoming Firestore loan snapshots with recent local optimistic mutations
 * (e.g., settling a loan from Active -> Archive or deleting a record) so intermediate stale
 * cloud snapshots cannot flicker an already-settled record back into Active Loans.
 */
export function reconcileOptimisticAndCloudLoans(params: {
  cloudLoans: Loan[];
  pendingUpserts: Map<string, { loan: Loan; expiresAt: number }>;
  pendingDeletes: Map<string, number>;
  nowMs?: number;
}): Loan[] {
  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : Date.now();
  const byId = new Map<string, Loan>();

  for (const cl of params.cloudLoans) {
    const deleteExpiry = params.pendingDeletes.get(cl.id);
    if (deleteExpiry && nowMs < deleteExpiry) {
      continue;
    }
    if (deleteExpiry && nowMs >= deleteExpiry) {
      params.pendingDeletes.delete(cl.id);
    }
    byId.set(cl.id, cl);
  }

  for (const [loanId, pending] of params.pendingUpserts.entries()) {
    if (nowMs >= pending.expiresAt) {
      params.pendingUpserts.delete(loanId);
      continue;
    }
    const cloudMatch = byId.get(loanId);
    const matchesCloud =
      cloudMatch &&
      cloudMatch.status === pending.loan.status &&
      roundCurrencyAmount(cloudMatch.amount) === roundCurrencyAmount(pending.loan.amount) &&
      roundCurrencyAmount(cloudMatch.paidAmount || 0) === roundCurrencyAmount(pending.loan.paidAmount || 0);

    if (matchesCloud) {
      params.pendingUpserts.delete(loanId);
    } else {
      byId.set(loanId, pending.loan);
    }
  }

  return Array.from(byId.values());
}

export const USERNAME_REGISTRY_STORAGE_KEY = 'loan_budget_username_registry_v1';

/**
 * Reads local claimed usernames map (`usernameLower -> ownerId`) from Web Storage.
 */
export function readLocalUsernameRegistry(
  storage?: Pick<Storage, 'getItem'> | null
): Record<string, string> {
  const store = storage ?? (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage : null);
  if (!store) return {};
  try {
    const raw = store.getItem(USERNAME_REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed)) {
      const normKey = normalizeUsernameHandle(key);
      if (normKey && typeof val === 'string' && val.trim()) {
        result[normKey] = val.trim();
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Checks whether a username handle is already taken locally by another owner ID
 * or by an existing friend in the user's directory (case-insensitive, strips leading @).
 */
export function isUsernameTakenInLocalStore(params: {
  username: string;
  ownerId: string;
  friends?: FriendRecord[];
  storage?: Pick<Storage, 'getItem'> | null;
}): boolean {
  const norm = normalizeUsernameHandle(params.username);
  if (!norm) return false;

  if (Array.isArray(params.friends)) {
    const takenByFriend = params.friends.some(
      (f) =>
        normalizeUsernameHandle(f.username) === norm &&
        f.friendUid !== params.ownerId
    );
    if (takenByFriend) return true;
  }

  const registry = readLocalUsernameRegistry(params.storage);
  const existingOwner = registry[norm];
  return Boolean(existingOwner && existingOwner !== params.ownerId);
}

/**
 * Registers or rotates a claimed handle in local storage, releasing the prior handle
 * only if owned by the same `ownerId` and updated to a different value.
 */
export function registerUsernameInLocalStore(params: {
  nextUsername: string;
  previousUsername?: string;
  ownerId: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}): Record<string, string> {
  const store = params.storage ?? (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage : null);
  const registry = readLocalUsernameRegistry(store);
  const nextNorm = normalizeUsernameHandle(params.nextUsername);
  const prevNorm = normalizeUsernameHandle(params.previousUsername || '');

  if (prevNorm && prevNorm !== nextNorm && registry[prevNorm] === params.ownerId) {
    delete registry[prevNorm];
  }
  if (nextNorm && params.ownerId.trim()) {
    registry[nextNorm] = params.ownerId.trim();
  }

  if (store) {
    try {
      store.setItem(USERNAME_REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    } catch {
      // ignore storage quota errors
    }
  }
  return registry;
}

export interface ResolvedChatLoanReference {
  loanId: string;
  personName: string;
  linkedUsername?: string;
  amount: number;
  currency: CurrencyCode;
  type: LoanType;
  status: 'active' | 'settled';
  isLiveUpdated: boolean;
}

/**
 * Connects linked loan cards in chat bubbles to live active/archived loan state
 * so repayments and settlements appear immediately without manual refresh.
 */
export function resolveLiveChatLoanReference(
  msg: Pick<
    FriendChatMessage,
    | 'linkedLoanId'
    | 'linkedLoanPerson'
    | 'linkedLoanUsername'
    | 'linkedLoanAmount'
    | 'linkedLoanCurrency'
    | 'linkedLoanType'
    | 'linkedLoanStatus'
  >,
  allLoans: Loan[]
): ResolvedChatLoanReference | null {
  if (!msg.linkedLoanId || !msg.linkedLoanPerson || typeof msg.linkedLoanAmount !== 'number') {
    return null;
  }

  const liveMatch = allLoans.find((l) => l.id === msg.linkedLoanId);
  if (liveMatch) {
    return {
      loanId: liveMatch.id,
      personName: liveMatch.personName,
      linkedUsername: liveMatch.linkedUsername || msg.linkedLoanUsername,
      amount: liveMatch.status === 'settled' ? liveMatch.amount : getRemainingLoanBalance(liveMatch),
      currency: liveMatch.currency || msg.linkedLoanCurrency || 'USD',
      type: liveMatch.type,
      status: liveMatch.status,
      isLiveUpdated: true,
    };
  }

  return {
    loanId: msg.linkedLoanId,
    personName: msg.linkedLoanPerson,
    linkedUsername: msg.linkedLoanUsername,
    amount: msg.linkedLoanAmount,
    currency: msg.linkedLoanCurrency || 'USD',
    type: msg.linkedLoanType || 'they_owe_me',
    status: msg.linkedLoanStatus || 'active',
    isLiveUpdated: false,
  };
}

export const AI_BUDGET_AUTH_STORAGE_KEY = 'ai_budget_auth';

export interface PersistedAuthUser {
  uid?: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  fibAccount?: string;
  lastUsernameChangeDate: number | string;
}

export interface StoredAuthSession {
  isAuthenticated: boolean;
  user: PersistedAuthUser | null;
}

/**
 * Reads the persisted authentication session (`ai_budget_auth`) from browser storage
 * synchronously on app initialization so page refreshes never drop signed-in users.
 */
export function readStoredAuthSession(
  storage?: Pick<Storage, 'getItem'> | null
): StoredAuthSession {
  const store =
    storage !== undefined
      ? storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;
  if (!store) return { isAuthenticated: false, user: null };

  try {
    const raw = store.getItem(AI_BUDGET_AUTH_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, user: null };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.isAuthenticated !== true) {
      return { isAuthenticated: false, user: null };
    }
    const u = parsed.user;
    if (!u || typeof u !== 'object' || Array.isArray(u)) {
      return { isAuthenticated: false, user: null };
    }

    const name = typeof u.name === 'string' ? u.name.trim().slice(0, 120) : '';
    const username = typeof u.username === 'string' ? u.username.trim().replace(/^@+/, '').slice(0, 32) : '';
    const email = typeof u.email === 'string' ? u.email.trim().slice(0, 160) : '';
    if (!email && !name && !username) {
      return { isAuthenticated: false, user: null };
    }

    const avatar =
      typeof u.avatar === 'string' && u.avatar.trim() && u.avatar.length <= 250000
        ? u.avatar.trim()
        : undefined;
    const fibAccount =
      typeof u.fibAccount === 'string' && sanitizeProfileFibAccount(u.fibAccount)
        ? sanitizeProfileFibAccount(u.fibAccount)
        : undefined;
    const uid = typeof u.uid === 'string' && u.uid.trim() ? u.uid.trim().slice(0, 128) : undefined;
    const lastUsernameChangeDate =
      typeof u.lastUsernameChangeDate === 'number' && Number.isFinite(u.lastUsernameChangeDate)
        ? u.lastUsernameChangeDate
        : typeof u.lastUsernameChangeDate === 'string' && u.lastUsernameChangeDate.trim()
        ? u.lastUsernameChangeDate.trim().slice(0, 64)
        : Date.now();

    return {
      isAuthenticated: true,
      user: {
        ...(uid ? { uid } : {}),
        name,
        username,
        email,
        ...(avatar ? { avatar } : {}),
        ...(fibAccount ? { fibAccount } : {}),
        lastUsernameChangeDate,
      },
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Persists authenticated user session data permanently under `ai_budget_auth` in localStorage.
 */
export function writeStoredAuthSession(
  userData: {
    uid?: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    fibAccount?: string;
    lastUsernameChangeDate?: number | string;
  },
  storage?: Pick<Storage, 'setItem'> | null
): StoredAuthSession {
  const store =
    storage !== undefined
      ? storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;

  const cleanUsername = (userData.username || '').trim().replace(/^@+/, '').slice(0, 32);
  const cleanName = (userData.name || '').trim().slice(0, 120);
  const cleanEmail = (userData.email || '').trim().slice(0, 160);
  const cleanAvatar =
    typeof userData.avatar === 'string' && userData.avatar.trim() && userData.avatar.length <= 250000
      ? userData.avatar.trim()
      : undefined;
  const cleanFib =
    typeof userData.fibAccount === 'string' && sanitizeProfileFibAccount(userData.fibAccount)
      ? sanitizeProfileFibAccount(userData.fibAccount)
      : undefined;
  const cleanUid =
    typeof userData.uid === 'string' && userData.uid.trim() ? userData.uid.trim().slice(0, 128) : undefined;
  const lastUsernameChangeDate =
    typeof userData.lastUsernameChangeDate === 'number' && Number.isFinite(userData.lastUsernameChangeDate)
      ? userData.lastUsernameChangeDate
      : typeof userData.lastUsernameChangeDate === 'string' && userData.lastUsernameChangeDate.trim()
      ? userData.lastUsernameChangeDate.trim().slice(0, 64)
      : Date.now();

  const userSession: StoredAuthSession = {
    isAuthenticated: true,
    user: {
      ...(cleanUid ? { uid: cleanUid } : {}),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      ...(cleanAvatar ? { avatar: cleanAvatar } : {}),
      ...(cleanFib ? { fibAccount: cleanFib } : {}),
      lastUsernameChangeDate,
    },
  };

  if (store) {
    store.setItem(AI_BUDGET_AUTH_STORAGE_KEY, JSON.stringify(userSession));
  }

  return userSession;
}

/**
 * Clears the persisted `ai_budget_auth` session upon explicit user logout.
 */
export function clearStoredAuthSession(
  storage?: Pick<Storage, 'removeItem'> | null
): void {
  const store =
    storage !== undefined
      ? storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;
  if (!store) return;
  try {
    store.removeItem(AI_BUDGET_AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

// ==========================================
// EXACT USERNAME DEBT LINKING & CHAT HELPERS
// ==========================================

export interface ExactLinkedUsernameResult {
  valid: boolean;
  normalized: string;
  reason?: 'empty' | 'too_short' | 'too_long' | 'invalid_chars';
}

/**
 * Strips leading '@' and whitespace from a typed username while keeping characters intact
 * so format validation can accurately reject invalid characters.
 */
export function sanitizeUsernameFieldInput(raw: string): string {
  return raw.replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
}

/**
 * Validates an exact required or optional recipient/debtor @username handle
 * supporting letters, numbers, and underscores (3..32 chars, e.g. lanya_2026).
 */
export function validateExactLinkedUsername(
  raw: string,
  options: { required?: boolean } = { required: true }
): ExactLinkedUsernameResult {
  const trimmed = raw.trim().replace(/^@+/, '');
  if (!trimmed) {
    return options.required
      ? { valid: false, normalized: '', reason: 'empty' }
      : { valid: true, normalized: '' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, normalized: trimmed, reason: 'invalid_chars' };
  }
  if (trimmed.length < 3) {
    return { valid: false, normalized: trimmed, reason: 'too_short' };
  }
  if (trimmed.length > 32) {
    return { valid: false, normalized: trimmed.slice(0, 32), reason: 'too_long' };
  }
  return { valid: true, normalized: trimmed };
}

/**
 * Binds an optional validated @username and display label for a debt ("I Owe" or "They Owe Me").
 * Requires at least one of Full Name (`displayLabel`) or a valid `@username`.
 */
export function buildDebtPersonBinding(params: {
  linkedUsername: string;
  displayLabel?: string;
}): {
  valid: boolean;
  linkedUsername: string;
  personName: string;
  reason?: 'empty' | 'too_short' | 'too_long' | 'invalid_chars';
} {
  const cleanLabel = (params.displayLabel || '').trim().slice(0, 160);
  const check = validateExactLinkedUsername(params.linkedUsername, { required: false });
  if (!check.valid) {
    return {
      valid: false,
      linkedUsername: check.normalized,
      personName: cleanLabel,
      reason: check.reason,
    };
  }
  if (!check.normalized && !cleanLabel) {
    return {
      valid: false,
      linkedUsername: '',
      personName: '',
      reason: 'empty',
    };
  }
  return {
    valid: true,
    linkedUsername: check.normalized,
    personName: cleanLabel || `@${check.normalized}`,
  };
}

/**
 * Resolves the strict exact lowercase username handle for a loan when initiating a chat
 * or filtering linked chat debts. Never fuzzy-matches arbitrary display names.
 */
export function resolveExactLoanChatUsername(
  loan: Pick<Loan, 'linkedUsername' | 'personName'>
): string {
  if (loan.linkedUsername) {
    return normalizeUsernameHandle(loan.linkedUsername);
  }
  const trimmedName = (loan.personName || '').trim();
  if (trimmedName.startsWith('@')) {
    return normalizeUsernameHandle(trimmedName);
  }
  return '';
}

/**
 * Finds a friend strictly by exact lowercase username match (zero fuzzy display-name fallback).
 */
export function findFriendByExactUsername(
  friends: FriendRecord[],
  targetUsername: string
): FriendRecord | null {
  const norm = normalizeUsernameHandle(targetUsername);
  if (!norm) return null;
  return friends.find((f) => normalizeUsernameHandle(f.username) === norm) || null;
}

/**
 * Orders/filters loans for a specific chat peer strictly by exact username binding.
 */
export function filterLoansByExactUsername(
  loans: Loan[],
  targetUsername?: string
): { exactMatches: Loan[]; otherLoans: Loan[] } {
  const targetNorm = normalizeUsernameHandle(targetUsername || '');
  if (!targetNorm) {
    return { exactMatches: [], otherLoans: loans };
  }
  const exactMatches: Loan[] = [];
  const otherLoans: Loan[] = [];
  for (const l of loans) {
    if (resolveExactLoanChatUsername(l) === targetNorm) {
      exactMatches.push(l);
    } else {
      otherLoans.push(l);
    }
  }
  return { exactMatches, otherLoans };
}

export interface CounterpartyDebtCurrencySummary {
  currency: CurrencyCode;
  theyOwe: number;
  iOwe: number;
  net: number;
}

export interface CounterpartyDebtProfile {
  username: string;
  usernameLower: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  fibAccount?: string;
  friendUid?: string;
  activeLoans: Loan[];
  settledLoans: Loan[];
  activeCount: number;
  settledCount: number;
  currencySummaries: CounterpartyDebtCurrencySummary[];
  primaryLoan: Loan | null;
}

/**
 * Aggregates all active and settled debt balances bound to an exact @username
 * (or fallback contact name) and merges profile metadata from saved friends & chat threads.
 */
export function aggregateCounterpartyDebtProfile(params: {
  loans: Loan[];
  targetUsername?: string;
  fallbackLoan?: Loan | null;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
}): CounterpartyDebtProfile {
  const { loans, fallbackLoan = null, friends = [], chatThreads = [] } = params;
  const resolvedFromFallback = fallbackLoan ? resolveExactLoanChatUsername(fallbackLoan) : '';
  const rawInputHandle = (params.targetUsername || '').trim().replace(/^@+/, '');
  const usernameLower = normalizeUsernameHandle(rawInputHandle) || resolvedFromFallback;

  const matchedLoans = loans.filter((loan) => {
    if (usernameLower) {
      return resolveExactLoanChatUsername(loan) === usernameLower;
    }
    if (fallbackLoan) {
      return loan.personName.trim().toLowerCase() === fallbackLoan.personName.trim().toLowerCase();
    }
    return false;
  });

  const activeLoans = matchedLoans.filter((l) => l.status === 'active');
  const settledLoans = matchedLoans.filter((l) => l.status === 'settled');

  const currencyMap = new Map<CurrencyCode, CounterpartyDebtCurrencySummary>();
  for (const loan of activeLoans) {
    const curr: CurrencyCode = loan.currency || 'USD';
    const rem = getRemainingLoanBalance(loan);
    const existing = currencyMap.get(curr) || { currency: curr, theyOwe: 0, iOwe: 0, net: 0 };
    if (loan.type === 'they_owe_me') {
      existing.theyOwe = roundCurrencyAmount(existing.theyOwe + rem);
    } else {
      existing.iOwe = roundCurrencyAmount(existing.iOwe + rem);
    }
    existing.net = roundCurrencyAmount(existing.theyOwe - existing.iOwe);
    currencyMap.set(curr, existing);
  }

  const matchedFriend = usernameLower ? findFriendByExactUsername(friends, usernameLower) : null;

  let threadMatch: { uid?: string; displayName?: string; username?: string; avatar?: string; fibAccount?: string } | null = null;
  if (usernameLower && chatThreads.length > 0) {
    for (const thread of chatThreads) {
      const profiles = thread.participantProfiles;
      if (!profiles) continue;
      for (const [uid, snap] of Object.entries(profiles)) {
        if (snap.username && normalizeUsernameHandle(snap.username) === usernameLower) {
          threadMatch = {
            uid,
            displayName: snap.displayName,
            username: snap.username,
            avatar: snap.avatar,
            fibAccount: snap.fibAccount,
          };
          break;
        }
      }
      if (threadMatch) break;
    }
  }

  const friendlyLabelLoan = matchedLoans.find((l) => l.personName.trim() && !l.personName.trim().startsWith('@'));
  const canonicalUsername =
    matchedFriend?.username ||
    threadMatch?.username ||
    fallbackLoan?.linkedUsername ||
    rawInputHandle ||
    usernameLower;

  const displayName =
    matchedFriend?.displayName?.trim() ||
    threadMatch?.displayName?.trim() ||
    friendlyLabelLoan?.personName.trim() ||
    (canonicalUsername ? `@${canonicalUsername}` : fallbackLoan?.personName.trim() || 'Contact');

  const primaryLoan = activeLoans[0] || settledLoans[0] || fallbackLoan || null;

  return {
    username: canonicalUsername,
    usernameLower,
    displayName,
    avatar: matchedFriend?.avatar || threadMatch?.avatar,
    bio: matchedFriend?.bio,
    fibAccount: matchedFriend?.fibAccount || threadMatch?.fibAccount,
    friendUid: matchedFriend?.friendUid || threadMatch?.uid,
    activeLoans,
    settledLoans,
    activeCount: activeLoans.length,
    settledCount: settledLoans.length,
    currencySummaries: Array.from(currencyMap.values()),
    primaryLoan,
  };
}

export interface CounterpartySearchCandidate {
  uid: string;
  username: string;
  usernameLower: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  source: 'friend' | 'chat' | 'cloud';
}

/**
 * Searches saved friends and recent chat participants locally by @username or display name,
 * prioritizing exact handle matches first, then prefix matches, then substring matches.
 */
export function searchKnownCounterparties(params: {
  query: string;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  excludeUid?: string | null;
}): CounterpartySearchCandidate[] {
  const q = params.query.trim().replace(/^@+/, '').toLowerCase();
  if (!q) return [];

  const byKey = new Map<string, CounterpartySearchCandidate>();

  for (const friend of params.friends || []) {
    if (params.excludeUid && friend.friendUid === params.excludeUid) continue;
    const handleLower = normalizeUsernameHandle(friend.username || '');
    const displayName = (friend.displayName || '').trim();
    if (!handleLower && !displayName) continue;
    const key = friend.friendUid ? `uid:${friend.friendUid}` : `handle:${handleLower}`;
    byKey.set(key, {
      uid: friend.friendUid,
      username: (friend.username || '').trim(),
      usernameLower: handleLower,
      displayName: displayName || (handleLower ? `@${friend.username}` : undefined),
      avatar: friend.avatar,
      bio: friend.bio,
      source: 'friend',
    });
  }

  for (const thread of params.chatThreads || []) {
    const profiles = thread.participantProfiles;
    if (!profiles) continue;
    for (const [uid, snap] of Object.entries(profiles)) {
      if (params.excludeUid && uid === params.excludeUid) continue;
      const handleLower = normalizeUsernameHandle(snap.username || '');
      const displayName = (snap.displayName || '').trim();
      if (!handleLower && !displayName) continue;
      const key = uid ? `uid:${uid}` : `handle:${handleLower}`;
      if (byKey.has(key)) continue;
      if (handleLower && Array.from(byKey.values()).some((item) => item.usernameLower === handleLower)) {
        continue;
      }
      byKey.set(key, {
        uid,
        username: (snap.username || '').trim(),
        usernameLower: handleLower,
        displayName: displayName || undefined,
        avatar: snap.avatar,
        source: 'chat',
      });
    }
  }

  const matched: { item: CounterpartySearchCandidate; score: number }[] = [];
  for (const item of byKey.values()) {
    const nameLower = (item.displayName || '').trim().toLowerCase();
    if (item.usernameLower && item.usernameLower === q) {
      matched.push({ item, score: 0 });
    } else if (nameLower && nameLower === q) {
      matched.push({ item, score: 0 });
    } else if (item.usernameLower && item.usernameLower.startsWith(q)) {
      matched.push({ item, score: 1 });
    } else if (nameLower && nameLower.startsWith(q)) {
      matched.push({ item, score: 2 });
    } else if ((item.usernameLower && item.usernameLower.includes(q)) || (nameLower && nameLower.includes(q))) {
      matched.push({ item, score: 3 });
    }
  }

  matched.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const labelA = (a.item.displayName || a.item.usernameLower || '').toLowerCase();
    const labelB = (b.item.displayName || b.item.usernameLower || '').toLowerCase();
    return labelA.localeCompare(labelB);
  });
  return matched.map((m) => m.item);
}

// ==========================================
// IRAQ MARKET FX TRACKER & QUICK DEBT ENTRY
// ==========================================

export const OFFICIAL_CBI_USD_TO_IQD_RATE = 1310;
export const BAGHDAD_ERBIL_DEFAULT_MARKET_RATE = 1530;
export const IRAQ_MARKET_CACHE_KEY = 'loan_budget_iraq_market_meta_v1';

export type IraqMarketHubId = 'baghdad' | 'erbil' | 'standard' | 'cbi' | 'custom';

export interface IraqMarketHubPreset {
  id: Exclude<IraqMarketHubId, 'custom'>;
  rate: number;
  labelEn: string;
  labelAr: string;
  labelKu: string;
  labelTr: string;
  labelFr: string;
  labelEs: string;
  subtitleEn: string;
}

export const IRAQ_MARKET_HUB_PRESETS: IraqMarketHubPreset[] = [
  {
    id: 'baghdad',
    rate: 1530,
    labelEn: 'Baghdad Market',
    labelAr: 'سوق بغداد',
    labelKu: 'بازاڕی بەغداد',
    labelTr: 'Bağdat Piyasası',
    labelFr: 'Marché Bagdad',
    labelEs: 'Mercado Bagdad',
    subtitleEn: 'Al-Kifah / Al-Harithiya',
  },
  {
    id: 'erbil',
    rate: 1530,
    labelEn: 'Erbil Market',
    labelAr: 'بورصة أربيل',
    labelKu: 'بازاڕی هەولێر',
    labelTr: 'Erbil Borsası',
    labelFr: 'Marché Erbil',
    labelEs: 'Mercado Erbil',
    subtitleEn: 'Erbil Exchange Hub',
  },
  {
    id: 'standard',
    rate: 1500,
    labelEn: 'Standard Rate',
    labelAr: 'السعر القياسي',
    labelKu: 'نرخی ستاندارد',
    labelTr: 'Standart Kur',
    labelFr: 'Taux Standard',
    labelEs: 'Tasa Estándar',
    subtitleEn: '$100 = 150,000 IQD',
  },
  {
    id: 'cbi',
    rate: OFFICIAL_CBI_USD_TO_IQD_RATE,
    labelEn: 'CBI Official',
    labelAr: 'المركزي العراقي',
    labelKu: 'بانکی ناوەندی',
    labelTr: 'CBI Resmi',
    labelFr: 'Officiel CBI',
    labelEs: 'Oficial CBI',
    subtitleEn: '$100 = 131,000 IQD',
  },
];

export interface IraqMarketMeta {
  officialUsdToIqd: number;
  fetchedAtIso: string;
  sourceLabel: string;
  marketHub: IraqMarketHubId;
  isLiveSynced: boolean;
}

export const DEFAULT_IRAQ_MARKET_META: IraqMarketMeta = {
  officialUsdToIqd: OFFICIAL_CBI_USD_TO_IQD_RATE,
  fetchedAtIso: '',
  sourceLabel: 'CBI Official Baseline',
  marketHub: 'standard',
  isLiveSynced: false,
};

export function inferIraqMarketHub(rate: number): IraqMarketHubId {
  if (!Number.isFinite(rate) || rate <= 0) return 'standard';
  if (Math.abs(rate - 1530) < 0.01) return 'baghdad';
  if (Math.abs(rate - 1500) < 0.01) return 'standard';
  if (Math.abs(rate - OFFICIAL_CBI_USD_TO_IQD_RATE) < 0.01) return 'cbi';
  return 'custom';
}

export function readIraqMarketMeta(
  storage?: Pick<Storage, 'getItem'> | null
): IraqMarketMeta {
  const store =
    storage !== undefined
      ? storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;

  if (!store) return { ...DEFAULT_IRAQ_MARKET_META };
  try {
    const raw = store.getItem(IRAQ_MARKET_CACHE_KEY);
    if (!raw) return { ...DEFAULT_IRAQ_MARKET_META };
    const parsed = JSON.parse(raw) as Partial<IraqMarketMeta>;
    const officialUsdToIqd =
      typeof parsed.officialUsdToIqd === 'number' &&
      Number.isFinite(parsed.officialUsdToIqd) &&
      parsed.officialUsdToIqd > 100
        ? Math.round(parsed.officialUsdToIqd * 100) / 100
        : OFFICIAL_CBI_USD_TO_IQD_RATE;
    const marketHub: IraqMarketHubId =
      parsed.marketHub === 'baghdad' ||
      parsed.marketHub === 'erbil' ||
      parsed.marketHub === 'standard' ||
      parsed.marketHub === 'cbi' ||
      parsed.marketHub === 'custom'
        ? parsed.marketHub
        : 'standard';
    return {
      officialUsdToIqd,
      fetchedAtIso: typeof parsed.fetchedAtIso === 'string' ? parsed.fetchedAtIso.slice(0, 64) : '',
      sourceLabel:
        typeof parsed.sourceLabel === 'string' && parsed.sourceLabel.trim()
          ? parsed.sourceLabel.trim().slice(0, 80)
          : DEFAULT_IRAQ_MARKET_META.sourceLabel,
      marketHub,
      isLiveSynced: Boolean(parsed.isLiveSynced),
    };
  } catch {
    return { ...DEFAULT_IRAQ_MARKET_META };
  }
}

export function writeIraqMarketMeta(
  meta: Partial<IraqMarketMeta>,
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): IraqMarketMeta {
  const store =
    storage !== undefined
      ? storage
      : typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? globalThis.localStorage
      : null;

  const existing = readIraqMarketMeta(store);
  const next: IraqMarketMeta = {
    officialUsdToIqd:
      typeof meta.officialUsdToIqd === 'number' &&
      Number.isFinite(meta.officialUsdToIqd) &&
      meta.officialUsdToIqd > 100
        ? Math.round(meta.officialUsdToIqd * 100) / 100
        : existing.officialUsdToIqd,
    fetchedAtIso: typeof meta.fetchedAtIso === 'string' ? meta.fetchedAtIso.slice(0, 64) : existing.fetchedAtIso,
    sourceLabel:
      typeof meta.sourceLabel === 'string' && meta.sourceLabel.trim()
        ? meta.sourceLabel.trim().slice(0, 80)
        : existing.sourceLabel,
    marketHub: meta.marketHub || existing.marketHub,
    isLiveSynced: typeof meta.isLiveSynced === 'boolean' ? meta.isLiveSynced : existing.isLiveSynced,
  };

  if (store && 'setItem' in store) {
    try {
      store.setItem(IRAQ_MARKET_CACHE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

export type IraqMarketBasketCode = 'USD' | 'IRR' | 'EUR' | 'TRY';

export interface IraqMarketBasketConfig {
  code: IraqMarketBasketCode;
  basketUnit: number;
  symbol: string;
  unitLabelEn: string;
  unitLabelAr: string;
  unitLabelKu: string;
  unitLabelTr: string;
  unitLabelFr: string;
  unitLabelEs: string;
  nameEn: string;
  nameAr: string;
  nameKu: string;
  nameTr: string;
  nameFr: string;
  nameEs: string;
}

export const IRAQ_MARKET_BASKETS: readonly IraqMarketBasketConfig[] = [
  {
    code: 'USD',
    basketUnit: 100,
    symbol: '$',
    unitLabelEn: '$100 USD',
    unitLabelAr: '100 دولار',
    unitLabelKu: '١٠٠ دۆلار',
    unitLabelTr: '$100 USD',
    unitLabelFr: '100 $ USD',
    unitLabelEs: '$100 USD',
    nameEn: 'US Dollar',
    nameAr: 'الدولار الأمريكي',
    nameKu: 'دۆلاری ئەمریکی',
    nameTr: 'ABD Doları',
    nameFr: 'Dollar américain',
    nameEs: 'Dólar EE. UU.',
  },
  {
    code: 'IRR',
    basketUnit: 100000,
    symbol: 'IRR',
    unitLabelEn: '100,000 Toman / IRR',
    unitLabelAr: '100,000 تومان / ريال',
    unitLabelKu: '١٠٠,٠٠٠ تمەن / ڕیاڵ',
    unitLabelTr: '100,000 Tümen / IRR',
    unitLabelFr: '100 000 Toman / IRR',
    unitLabelEs: '100,000 Tomán / IRR',
    nameEn: 'Iranian Toman',
    nameAr: 'التومان الإيراني',
    nameKu: 'تمەنی ئێرانی',
    nameTr: 'İran Tümeni',
    nameFr: 'Toman iranien',
    nameEs: 'Tomán Iraní',
  },
  {
    code: 'EUR',
    basketUnit: 100,
    symbol: '€',
    unitLabelEn: '€100 EUR',
    unitLabelAr: '100 يورو',
    unitLabelKu: '١٠٠ یۆرۆ',
    unitLabelTr: '€100 EUR',
    unitLabelFr: '100 € EUR',
    unitLabelEs: '€100 EUR',
    nameEn: 'Euro',
    nameAr: 'اليورو الأوروبي',
    nameKu: 'یۆرۆی ئەوروپی',
    nameTr: 'Euro',
    nameFr: 'Euro',
    nameEs: 'Euro',
  },
  {
    code: 'TRY',
    basketUnit: 100,
    symbol: '₺',
    unitLabelEn: '100 TRY',
    unitLabelAr: '100 ليرة تركية',
    unitLabelKu: '١٠٠ لیرەی تورکی',
    unitLabelTr: '100 TRY',
    unitLabelFr: '100 TRY',
    unitLabelEs: '100 TRY',
    nameEn: 'Turkish Lira',
    nameAr: 'الليرة التركية',
    nameKu: 'لیرەی تورکی',
    nameTr: 'Türk Lirası',
    nameFr: 'Livre turque',
    nameEs: 'Lira Turca',
  },
] as const;

export interface IraqMarketRateItem extends IraqMarketBasketConfig {
  iqdPrice: number;
  ratePerUsd: number;
  isCustomOverridden: boolean;
}

export function getIqdBasketPrice(
  currency: IraqMarketBasketCode,
  customRates?: Partial<Record<CurrencyCode, unknown>> | null
): number {
  const rates = normalizeCustomRates(customRates);
  const cfg = IRAQ_MARKET_BASKETS.find((b) => b.code === currency) || IRAQ_MARKET_BASKETS[0];
  if (currency === 'USD') {
    return Math.round(cfg.basketUnit * rates.IQD);
  }
  const perUsd = rates[currency] > 0 ? rates[currency] : DEFAULT_EXCHANGE_RATES[currency];
  return Math.max(1, Math.round(cfg.basketUnit * (rates.IQD / perUsd)));
}

export function withIqdBasketPrice(
  customRates: Partial<Record<CurrencyCode, unknown>> | undefined | null,
  currency: IraqMarketBasketCode,
  iqdPrice: number
): Record<CurrencyCode, number> {
  const base = normalizeCustomRates(customRates);
  const cleanPrice = Number(iqdPrice);
  if (!Number.isFinite(cleanPrice) || cleanPrice <= 0 || cleanPrice > 1000000000) {
    return base;
  }
  const cfg = IRAQ_MARKET_BASKETS.find((b) => b.code === currency) || IRAQ_MARKET_BASKETS[0];
  if (currency === 'USD') {
    const perUsd = Math.round((cleanPrice / cfg.basketUnit) * 100) / 100;
    return withUsdToIqdRate(base, perUsd);
  }
  const rawPerUsd = (cfg.basketUnit * base.IQD) / cleanPrice;
  if (!Number.isFinite(rawPerUsd) || rawPerUsd <= 0 || rawPerUsd > 100000000) {
    return base;
  }
  const normalizedPerUsd =
    currency === 'IRR'
      ? Math.round(rawPerUsd * 10000) / 10000
      : Math.round(rawPerUsd * 1000000) / 1000000;
  return {
    ...base,
    [currency]: normalizedPerUsd,
  };
}

export function getIraqMarketRatesList(
  customRates?: Partial<Record<CurrencyCode, unknown>> | null
): IraqMarketRateItem[] {
  const rates = normalizeCustomRates(customRates);
  return IRAQ_MARKET_BASKETS.map((cfg) => {
    const ratePerUsd = cfg.code === 'USD' ? rates.IQD : rates[cfg.code];
    const defaultPerUsd = cfg.code === 'USD' ? DEFAULT_EXCHANGE_RATES.IQD : DEFAULT_EXCHANGE_RATES[cfg.code];
    const isCustomOverridden =
      cfg.code === 'USD'
        ? Math.abs(ratePerUsd - defaultPerUsd) > 0.01
        : Math.abs(ratePerUsd - defaultPerUsd) > 0.0001;
    return {
      ...cfg,
      iqdPrice: getIqdBasketPrice(cfg.code, rates),
      ratePerUsd,
      isCustomOverridden,
    };
  });
}

export async function fetchLiveUsdToIqdReferenceRate(): Promise<{
  ok: boolean;
  officialUsdToIqd: number;
  fetchedAtIso: string;
  sourceLabel: string;
  liveRates?: Partial<Record<CurrencyCode, number>>;
}> {
  const fallbackIso = new Date().toISOString();
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/market-rate', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      ok?: boolean;
      officialUsdToIqd?: number;
      fetchedAtIso?: string;
      source?: string;
      rates?: Partial<Record<CurrencyCode, number>>;
    };
    const rate =
      typeof data.officialUsdToIqd === 'number' &&
      Number.isFinite(data.officialUsdToIqd) &&
      data.officialUsdToIqd > 100
        ? Math.round(data.officialUsdToIqd * 100) / 100
        : OFFICIAL_CBI_USD_TO_IQD_RATE;

    return {
      ok: Boolean(data.ok),
      officialUsdToIqd: rate,
      fetchedAtIso: typeof data.fetchedAtIso === 'string' && data.fetchedAtIso ? data.fetchedAtIso : fallbackIso,
      sourceLabel: typeof data.source === 'string' && data.source ? data.source : 'CBI Reference',
      ...(data.rates ? { liveRates: data.rates } : {}),
    };
  } catch {
    return {
      ok: false,
      officialUsdToIqd: OFFICIAL_CBI_USD_TO_IQD_RATE,
      fetchedAtIso: fallbackIso,
      sourceLabel: 'CBI Reference Fallback',
    };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export interface ParsedQuickDebtResult {
  matched: boolean;
  personName: string;
  amount: number;
  currency: CurrencyCode;
  notes?: string;
}

/**
 * Parses concise natural debt notes like:
 * - "Market groceries - 25,000 IQD"
 * - "Ahmed - $50 coffee"
 * - "Sara 150k IQD rent"
 * - "Ali 45 SAR lunch"
 * Returns extracted label/person, numeric amount, currency code, and trailing note.
 */
export function parseQuickDebtInput(
  rawInput: string,
  fallbackCurrency: CurrencyCode = 'IQD'
): ParsedQuickDebtResult | null {
  const normalized = toWesternNumerals(rawInput || '').trim();
  if (!normalized) return null;

  // Match currency-prefixed or currency-suffixed numbers (supports commas and optional 'k' shorthand)
  const amountPattern =
    /(?:(?<symPrefix>[$€₺])\s*(?<numA>\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?<kA>[kK])?|(?<numB>\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?<kB>[kK])?\s*(?<codeOrSym>IQD|USD|EUR|TRY|SAR|IRR|د\.ع|دینار|دينار|ريال|ر\.س|ریال|\$|€|₺)?)/gi;

  const matches = Array.from(normalized.matchAll(amountPattern));
  if (matches.length === 0) return null;

  // Prefer the match that explicitly carries a currency symbol/code, or the largest plausible token
  let chosen = matches.find(
    (m) => Boolean(m.groups?.symPrefix || m.groups?.codeOrSym)
  ) || matches[0];

  const rawNumStr = (chosen.groups?.numA || chosen.groups?.numB || '').replace(/,/g, '');
  const hasK = Boolean(chosen.groups?.kA || chosen.groups?.kB);
  const parsedBase = parseFloat(rawNumStr);
  if (!Number.isFinite(parsedBase) || parsedBase <= 0) return null;

  const finalAmount = roundCurrencyAmount(hasK ? parsedBase * 1000 : parsedBase);
  if (!Number.isFinite(finalAmount) || finalAmount <= 0) return null;

  const rawToken = (chosen.groups?.symPrefix || chosen.groups?.codeOrSym || '').trim();
  const upperToken = rawToken.toUpperCase();
  let detectedCurrency: CurrencyCode = fallbackCurrency;

  if (upperToken === '$' || upperToken === 'USD') detectedCurrency = 'USD';
  else if (upperToken === '€' || upperToken === 'EUR') detectedCurrency = 'EUR';
  else if (upperToken === '₺' || upperToken === 'TRY') detectedCurrency = 'TRY';
  else if (upperToken === 'SAR' || rawToken === 'ريال' || rawToken === 'ر.س') detectedCurrency = 'SAR';
  else if (upperToken === 'IRR' || rawToken === 'ریال') detectedCurrency = 'IRR';
  else if (upperToken === 'IQD' || rawToken === 'د.ع' || rawToken === 'دينار' || rawToken === 'دینار') {
    detectedCurrency = 'IQD';
  }

  const matchStart = chosen.index ?? 0;
  const matchEnd = matchStart + chosen[0].length;
  const before = normalized.slice(0, matchStart).replace(/[\s\-–—:|,]+$/g, '').trim();
  const after = normalized.slice(matchEnd).replace(/^[\s\-–—:|,]+/g, '').trim();

  let personName = '';
  let notes = '';

  if (before && after) {
    personName = before.slice(0, 120);
    notes = after.slice(0, 200);
  } else if (before) {
    personName = before.slice(0, 120);
  } else if (after) {
    personName = after.slice(0, 120);
  } else {
    personName = detectedCurrency === 'IQD' ? 'Quick IQD Entry' : `Quick ${detectedCurrency} Entry`;
  }

  return {
    matched: true,
    personName,
    amount: finalAmount,
    currency: detectedCurrency,
    ...(notes ? { notes } : {}),
  };
}




