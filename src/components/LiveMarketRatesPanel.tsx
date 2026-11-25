import React from 'react';
import { CurrencyCode, Language, ThemeMode } from '../types';
import {
  IRAQ_MARKET_BASKETS,
  getIraqMarketRatesList,
} from '../utils/loanLogic';
import { ArrowLeftRight, Eye, EyeOff } from './OrganicIcons';

interface LiveMarketRatesPanelProps {
  customRates?: Partial<Record<CurrencyCode, number>>;
  language: Language;
  themeMode?: ThemeMode;
  onSaveRates?: (nextRates: Record<CurrencyCode, number>) => void;
  onOpenFxCalculator?: () => void;
  dualPrimaryCurrency?: 'USD' | 'IQD';
  onToggleDualPrimaryCurrency?: () => void;
  maskBalances?: boolean;
  onToggleMask?: () => void;
  onShowToast?: (msg: string) => void;
}

export const LiveMarketRatesPanel: React.FC<LiveMarketRatesPanelProps> = ({
  customRates,
  language,
  themeMode = 'obsidian_neon',
  onOpenFxCalculator,
  dualPrimaryCurrency = 'IQD',
  onToggleDualPrimaryCurrency,
  maskBalances = false,
  onToggleMask,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const isGoldTheme = themeMode === 'midnight_gold' || themeMode === 'sapphire';

  const marketItems = getIraqMarketRatesList(customRates);

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

  const getBasketName = (cfg: (typeof IRAQ_MARKET_BASKETS)[number]) =>
    isKu
      ? cfg.nameKu
      : isAr
      ? cfg.nameAr
      : isTr
      ? cfg.nameTr
      : isFr
      ? cfg.nameFr
      : isEs
      ? cfg.nameEs
      : cfg.nameEn;

  const panelSurfaceClass = isVelvetPink
    ? 'bg-[#1D1023]/90 border-[#E8B4A0]/22 text-[#FDF4FA]'
    : isGoldTheme
    ? 'bg-[#0F1626]/90 border-amber-400/20 text-slate-100'
    : isNordic
    ? 'bg-[#0B1624]/90 border-sky-400/22 text-[#E6F4FF]'
    : 'bg-[#0C121E]/90 border-white/[0.08] text-slate-100';

  const toolbarBtnClass = isVelvetPink
    ? 'text-pink-100/90 hover:text-white bg-[#281630]/85 hover:bg-[#351D40] border-[#E8B4A0]/20'
    : isNordic
    ? 'text-sky-100/90 hover:text-white bg-[#0F2032]/85 hover:bg-[#152B42] border-sky-400/22'
    : 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.09]';

  const showLabel = pick(
    'Show Amounts',
    'إظهار الأرصدة',
    'پیشاندانی بڕەکان',
    'Tutarları Göster',
    'Afficher les montants',
    'Mostrar montos'
  );
  const hideLabel = pick(
    'Privacy Mask',
    'إخفاء الأرصدة',
    'شاردنەوەی بڕەکان',
    'Gizlilik Maskesi',
    'Masquer les montants',
    'Ocultar montos'
  );

  return (
    <section
      data-testid="live-market-rates-panel"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-3xl border backdrop-blur-xl p-3.5 sm:p-4 transition-colors ${panelSurfaceClass}`}
    >
      {/* Clean Header: Simple "Market Prices" title + single "Change Rates" CTA */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2 className="text-sm sm:text-base font-bold font-pricedown tracking-wide truncate text-white">
          {pick(
            'Market Prices',
            'أسعار السوق',
            'نرخەکانی بازاڕ',
            'Piyasa Fiyatları',
            'Prix du Marché',
            'Precios de Mercado'
          )}
        </h2>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenFxCalculator && (
            <button
              type="button"
              data-testid="market-change-rates-btn"
              onClick={onOpenFxCalculator}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer active:scale-[0.98] ${
                isVelvetPink
                  ? 'bg-[#FF2E93]/18 hover:bg-[#FF2E93]/28 border-[#FF65B5]/40 text-[#FFD6EB]'
                  : isGoldTheme
                  ? 'bg-amber-500/18 hover:bg-amber-500/28 border-amber-400/40 text-amber-200'
                  : isNordic
                  ? 'bg-sky-500/18 hover:bg-sky-500/28 border-sky-400/40 text-sky-200'
                  : 'bg-emerald-500/18 hover:bg-emerald-500/28 border-emerald-400/40 text-emerald-200'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>
                {pick(
                  'Change Rates',
                  'تغيير الأسعار',
                  'گۆڕینی نرخەکان',
                  'Kurları Değiştir',
                  'Changer les taux',
                  'Cambiar Tasas'
                )}
              </span>
            </button>
          )}

          {onToggleDualPrimaryCurrency && (
            <button
              type="button"
              data-testid="dashboard-dual-primary-toggle"
              onClick={onToggleDualPrimaryCurrency}
              aria-label={`Switch summary display currency (current: ${dualPrimaryCurrency})`}
              className={`inline-flex items-center px-2.5 h-8 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer active:scale-[0.98] ${toolbarBtnClass}`}
            >
              <span data-numeric="true" dir="ltr" className="font-numeric tabular-nums">
                {dualPrimaryCurrency === 'IQD' ? 'IQD ⇄ USD' : 'USD ⇄ IQD'}
              </span>
            </button>
          )}

          {onToggleMask && (
            <button
              type="button"
              onClick={onToggleMask}
              aria-label={maskBalances ? showLabel : hideLabel}
              title={maskBalances ? showLabel : hideLabel}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer active:scale-[0.98] ${toolbarBtnClass}`}
            >
              {maskBalances ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.65} />
              ) : (
                <Eye className={`w-3.5 h-3.5 ${isNordic ? 'text-sky-400' : 'text-emerald-400'}`} strokeWidth={1.65} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 4 Clean Read-Only Market Rate Cards (USD $100, IRR 100k, EUR €100, TRY 100 in IQD) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {marketItems.map((item) => {
          const unitLabel = getBasketUnitLabel(item);
          const currName = getBasketName(item);

          return (
            <div
              key={item.code}
              data-testid={`market-rate-tile-${item.code}`}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                isVelvetPink
                  ? 'bg-[#120B14]/75 border-[#E8B4A0]/18'
                  : isNordic
                  ? 'bg-[#08111B]/80 border-sky-400/18'
                  : 'bg-[#080B11]/70 border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 w-full">
                <span
                  dir="ltr"
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border font-sans tracking-wider ${
                    isVelvetPink
                      ? 'bg-[#FF2E93]/15 border-[#FF65B5]/35 text-[#FFD6EB]'
                      : isGoldTheme
                      ? 'bg-amber-500/12 border-amber-400/30 text-amber-200'
                      : isNordic
                      ? 'bg-sky-500/15 border-sky-400/30 text-sky-200'
                      : 'bg-white/[0.06] border-white/[0.1] text-slate-200'
                  }`}
                >
                  {item.code}
                </span>

                <span className="truncate text-[10px] font-medium text-slate-400">
                  {currName}
                </span>
              </div>

              <div className="space-y-1">
                <div dir="ltr" className="text-[11px] font-semibold font-sans text-slate-300">
                  {unitLabel} =
                </div>
                <div
                  data-testid={`market-rate-price-${item.code}`}
                  data-numeric="true"
                  dir="ltr"
                  className={`text-xl sm:text-2xl leading-none font-pricedown font-numeric tabular-nums tracking-wide ${
                    isVelvetPink
                      ? 'text-[#FF85C5]'
                      : isGoldTheme
                      ? 'text-amber-300'
                      : isNordic
                      ? 'text-sky-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {item.iqdPrice.toLocaleString('en-US')} <span className="text-xs font-sans font-bold opacity-80">IQD</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
