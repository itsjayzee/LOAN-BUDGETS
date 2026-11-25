import React from 'react';
import { CurrencyCode, Language, Loan, ThemeMode, Translations } from '../types';
import {
  Totals,
  calculateDualCurrencyTotals,
  formatCardDebt,
  formatSignedCardDebt,
  formatSignedCurrency,
  isLightThemeMode,
} from '../utils/loanLogic';
import { ArrowDownLeft, ArrowUpRight } from './OrganicIcons';
import { LiveMarketRatesPanel } from './LiveMarketRatesPanel';

interface DashboardStatsProps {
  totals: Totals;
  loans?: Loan[];
  language: Language;
  translations: Translations;
  activeCurrency?: CurrencyCode;
  customRates?: Partial<Record<CurrencyCode, number>>;
  onUpdateCustomRates?: (nextRates: Record<CurrencyCode, number>) => void;
  showDualCurrency?: boolean;
  dualPrimaryCurrency?: 'USD' | 'IQD';
  onToggleDualPrimaryCurrency?: () => void;
  onOpenFxCalculator?: () => void;
  maskBalances?: boolean;
  onToggleMask?: () => void;
  onShowToast?: (msg: string) => void;
  themeMode?: ThemeMode;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totals,
  loans = [],
  language,
  translations,
  activeCurrency = 'USD',
  customRates,
  onUpdateCustomRates,
  showDualCurrency = true,
  dualPrimaryCurrency = 'IQD',
  onToggleDualPrimaryCurrency,
  onOpenFxCalculator,
  maskBalances = false,
  onToggleMask,
  onShowToast,
  themeMode = 'obsidian_neon',
}) => {
  const isLight = isLightThemeMode(themeMode);

  const activeTheyOweCurrencies = (Object.keys(totals.theyOweByCurrency) as CurrencyCode[]).filter(
    (code) => (totals.theyOweByCurrency[code] || 0) > 0
  );

  const activeIOweCurrencies = (Object.keys(totals.iOweByCurrency) as CurrencyCode[]).filter(
    (code) => (totals.iOweByCurrency[code] || 0) > 0
  );

  const dualTotals = calculateDualCurrencyTotals(loans, customRates, dualPrimaryCurrency);

  // Always keep primary portfolio summary currency synced with dualPrimaryCurrency (even when 0 loans)
  // when dual-currency summary mode is enabled.
  const useDualPortfolioSummary = showDualCurrency || Boolean(onToggleDualPrimaryCurrency);
  const primaryTheyOweCurrency: CurrencyCode = useDualPortfolioSummary
    ? dualTotals.primaryCurrency
    : (totals.theyOweByCurrency[activeCurrency] || 0) > 0
    ? activeCurrency
    : activeTheyOweCurrencies[0] || activeCurrency;
  const primaryTheyOweAmount = useDualPortfolioSummary
    ? dualTotals.primaryTheyOwe
    : totals.theyOweByCurrency[primaryTheyOweCurrency] || 0;

  const primaryIOweCurrency: CurrencyCode = useDualPortfolioSummary
    ? dualTotals.primaryCurrency
    : (totals.iOweByCurrency[activeCurrency] || 0) > 0
    ? activeCurrency
    : activeIOweCurrencies[0] || activeCurrency;
  const primaryIOweAmount = useDualPortfolioSummary
    ? dualTotals.primaryIOwe
    : totals.iOweByCurrency[primaryIOweCurrency] || 0;

  const displayVal = (val: number, curr: CurrencyCode, direction: 'they_owe_me' | 'i_owe_them') => {
    if (maskBalances) return '••••••••';
    return formatSignedCurrency(val, language, curr, direction);
  };

  const displayDualSubValue = (val: number, curr: 'USD' | 'IQD', direction: 'they_owe_me' | 'i_owe_them') => {
    if (maskBalances) return '••••••';
    const prefix = direction === 'they_owe_me' ? '+' : '-';
    return `≈ ${prefix}${formatCardDebt(Math.abs(val), curr, language)}`;
  };

  return (
    <div className="mb-6 space-y-4" data-testid="dashboard-stats">
      {/* Live Market Exchange Rates Panel (USD $100, IRR 100k, EUR €100, TRY 100 in IQD) */}
      <LiveMarketRatesPanel
        customRates={customRates}
        language={language}
        themeMode={themeMode}
        onSaveRates={(nextRates) => onUpdateCustomRates?.(nextRates)}
        onOpenFxCalculator={onOpenFxCalculator}
        dualPrimaryCurrency={dualPrimaryCurrency}
        onToggleDualPrimaryCurrency={onToggleDualPrimaryCurrency}
        maskBalances={maskBalances}
        onToggleMask={onToggleMask}
        onShowToast={onShowToast}
      />

      {/* 2 Focused Summary Cards: + They Owe Me & - I Owe Them (Dual-Currency Aggregated Display) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
        {/* 1. They Owe Me (+ To Collect) */}
        <div className="relative overflow-hidden rounded-3xl glass-glow-emerald p-6 sm:p-7 flex flex-col justify-between smooth-interactive hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                >
                  <ArrowDownLeft glow="they_owe" className="w-5 h-5" strokeWidth={1.65} />
                </div>
                <div>
                  <span
                    className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 font-pricedown text-emerald-400"
                  >
                    <span className="inline-emoji text-sm" aria-hidden="true">💰</span>
                    <span>{translations.theyOweMe}</span>
                  </span>
                  <span className={`text-[10px] sm:text-[11px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {translations.totalToCollect}
                  </span>
                </div>
              </div>

              <div
                className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border font-numeric tabular-nums flex items-center gap-1.5 bg-emerald-400/10 text-emerald-300 border-emerald-400/25"
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-400"></span>
                <span>{totals.activeTheyOweCount} {translations.activeLoansCount}</span>
              </div>
            </div>

            <div className="mt-3">
              <div
                data-testid="dashboard-total-they-owe"
                data-numeric="true"
                dir="ltr"
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-numeric metallic-emerald tabular-nums inline-block"
              >
                {displayVal(primaryTheyOweAmount, primaryTheyOweCurrency, 'they_owe_me')}
              </div>
              {showDualCurrency && (
                <div
                  data-testid="dashboard-dual-they-owe"
                  data-numeric="true"
                  dir="ltr"
                  className="mt-1 text-xs sm:text-sm font-numeric font-bold tabular-nums text-emerald-300/75"
                >
                  {displayDualSubValue(dualTotals.secondaryTheyOwe, dualTotals.secondaryCurrency, 'they_owe_me')}
                </div>
              )}
            </div>
          </div>

          {!maskBalances && activeTheyOweCurrencies.length > 0 && (
            <div className="mt-5 pt-3.5 border-t border-white/[0.08]">
              <div className="text-[10px] uppercase font-bold mb-2 flex items-center justify-between tracking-wider text-slate-400">
                <span>{translations.currencyBreakdownTitle}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeTheyOweCurrencies.map((code) => {
                  const amt = totals.theyOweByCurrency[code];
                  return (
                    <span
                      key={code}
                      data-numeric="true"
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-numeric tabular-nums font-bold shadow-xs bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                    >
                      <span>{formatSignedCardDebt(amt, code, language, 'they_owe_me')}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. I Owe Them (- To Pay) */}
        <div className="relative overflow-hidden rounded-3xl glass-glow-rose p-5 sm:p-6 flex flex-col justify-between smooth-interactive hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm bg-rose-500/15 border-rose-500/30 text-rose-400"
                >
                  <ArrowUpRight glow="i_owe" className="w-5 h-5" strokeWidth={1.65} />
                </div>
                <div>
                  <span
                    className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 font-pricedown text-rose-400"
                  >
                    <span className="inline-emoji text-sm" aria-hidden="true">💸</span>
                    <span>{translations.iOweThem}</span>
                  </span>
                  <span className={`text-[10px] sm:text-[11px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {translations.totalToPay}
                  </span>
                </div>
              </div>

              <div
                className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border font-numeric tabular-nums flex items-center gap-1.5 bg-rose-400/10 text-rose-300 border-rose-400/25"
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-rose-400"></span>
                <span>{totals.activeIOweCount} {translations.activeLoansCount}</span>
              </div>
            </div>

            <div className="mt-3">
              <div
                data-testid="dashboard-total-i-owe"
                data-numeric="true"
                dir="ltr"
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-numeric metallic-rose tabular-nums inline-block"
              >
                {displayVal(primaryIOweAmount, primaryIOweCurrency, 'i_owe_them')}
              </div>
              {showDualCurrency && (
                <div
                  data-testid="dashboard-dual-i-owe"
                  data-numeric="true"
                  dir="ltr"
                  className="mt-1 text-xs sm:text-sm font-numeric font-bold tabular-nums text-rose-300/75"
                >
                  {displayDualSubValue(dualTotals.secondaryIOwe, dualTotals.secondaryCurrency, 'i_owe_them')}
                </div>
              )}
            </div>
          </div>

          {!maskBalances && activeIOweCurrencies.length > 0 && (
            <div className="mt-5 pt-3.5 border-t border-white/[0.08]">
              <div className="text-[10px] uppercase font-bold mb-2 flex items-center justify-between tracking-wider text-slate-400">
                <span>{translations.currencyBreakdownTitle}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeIOweCurrencies.map((code) => {
                  const amt = totals.iOweByCurrency[code];
                  return (
                    <span
                      key={code}
                      data-numeric="true"
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-numeric tabular-nums font-bold shadow-xs bg-rose-950/50 border-rose-500/30 text-rose-300"
                    >
                      <span>{formatSignedCardDebt(amt, code, language, 'i_owe_them')}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

