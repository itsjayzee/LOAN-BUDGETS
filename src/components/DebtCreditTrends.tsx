import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CurrencyCode, Language, Loan, ThemeMode, Translations } from '../types';
import { computeMonthlyTrends, formatCurrency, isLightThemeMode } from '../utils/loanLogic';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
} from './OrganicIcons';

interface DebtCreditTrendsProps {
  loans: Loan[];
  language: Language;
  translations: Translations;
  activeCurrency?: CurrencyCode;
  maskBalances?: boolean;
  themeMode?: ThemeMode;
}

export const DebtCreditTrends: React.FC<DebtCreditTrendsProps> = ({
  loans,
  language,
  translations,
  activeCurrency = 'USD',
  maskBalances = false,
  themeMode = 'obsidian_neon',
}) => {
  const [monthsRange, setMonthsRange] = useState<6 | 12>(6);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'all' | 'lent' | 'borrowed' | 'repaid'>('all');
  const [selectedChartCurrency, setSelectedChartCurrency] = useState<CurrencyCode | null>(null);

  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const borrowColor = isVelvetPink ? '#FF2E93' : '#F43F5E';

  const availableCurrencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    for (const l of loans) {
      set.add(l.currency || 'USD');
    }
    return Array.from(set);
  }, [loans]);

  const effectiveCurrency: CurrencyCode = useMemo(() => {
    if (selectedChartCurrency && availableCurrencies.includes(selectedChartCurrency)) {
      return selectedChartCurrency;
    }
    if (availableCurrencies.includes(activeCurrency)) {
      return activeCurrency;
    }
    return availableCurrencies[0] || activeCurrency;
  }, [selectedChartCurrency, availableCurrencies, activeCurrency]);

  const { data, summary } = useMemo(() => {
    return computeMonthlyTrends(loans, effectiveCurrency, monthsRange, language);
  }, [loans, effectiveCurrency, monthsRange, language]);

  const hasActivity = summary.totalLent > 0 || summary.totalBorrowed > 0 || summary.totalRepaid > 0;

  const gridStroke = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)';
  const axisTickColor = isLight ? '#475569' : '#94A3B8';
  const yAxisTickColor = isLight ? '#64748B' : '#64748B';
  const axisLineStroke = isLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.1)';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div
        className={`backdrop-blur-2xl border rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px] z-50 ${
          isLight
            ? isNordic
              ? 'bg-[#F5FAFF]/95 border-[#B9D3EC] text-slate-900'
              : 'bg-white/95 border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FDF4FA]'
            : 'bg-[#080B11]/95 border-white/15 text-slate-200'
        }`}
      >
        <div
          className={`font-bold border-b pb-1.5 flex items-center justify-between ${
            isLight ? 'text-slate-900 border-slate-200' : 'text-slate-200 border-white/[0.08]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
            <span>{label}</span>
          </span>
          <span className={`text-[10px] font-numeric ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {effectiveCurrency}
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {(activeMetric === 'all' || activeMetric === 'lent') && (
            <div className={`flex items-center justify-between gap-3 font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <span className="flex items-center gap-1">
                <ArrowDownLeft glow="they_owe" className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>{translations.lent}</span>
              </span>
              <span className="font-numeric tabular-nums font-bold">
                {maskBalances ? '••••••' : formatCurrency(payload.find((p: any) => p.dataKey === 'lentAmount')?.value || 0, language, effectiveCurrency)}
              </span>
            </div>
          )}

          {(activeMetric === 'all' || activeMetric === 'borrowed') && (
            <div className={`flex items-center justify-between gap-3 font-medium ${isVelvetPink ? 'text-[#FF65B5]' : isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              <span className="flex items-center gap-1">
                <ArrowUpRight glow="i_owe" className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>{translations.borrowed}</span>
              </span>
              <span className="font-numeric tabular-nums font-bold">
                {maskBalances ? '••••••' : formatCurrency(payload.find((p: any) => p.dataKey === 'borrowedAmount')?.value || 0, language, effectiveCurrency)}
              </span>
            </div>
          )}

          {(activeMetric === 'all' || activeMetric === 'repaid') && (
            <div className={`flex items-center justify-between gap-3 font-medium ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>{translations.repaid}</span>
              </span>
              <span className="font-numeric tabular-nums font-bold">
                {maskBalances ? '••••••' : formatCurrency(payload.find((p: any) => p.dataKey === 'repaidAmount')?.value || 0, language, effectiveCurrency)}
              </span>
            </div>
          )}

          {activeMetric === 'all' && (
            <div
              className={`pt-1.5 mt-1 border-t flex items-center justify-between gap-3 ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-white/[0.06] text-slate-300'
              }`}
            >
              <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{translations.netFlow}:</span>
              <span
                className={`font-numeric tabular-nums font-extrabold text-[11px] ${
                  (payload[0]?.payload?.netFlow || 0) >= 0
                    ? isLight ? 'text-emerald-700' : 'text-emerald-300'
                    : isLight ? 'text-rose-700' : 'text-rose-300'
                }`}
              >
                {maskBalances ? '••••••' : formatCurrency(payload[0]?.payload?.netFlow || 0, language, effectiveCurrency)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const switcherShellClass = isLight
    ? isNordic
      ? 'bg-white/80 border-[#C7DCF0]'
      : 'bg-slate-100 border-slate-200'
    : isVelvetPink
    ? 'bg-[#170D1B]/80 border-[#E8B4A0]/20'
    : 'bg-[#080B11]/70 border-white/[0.07]';

  const inactiveTabClass = isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white';
  const metricShellClass = isLight
    ? isNordic
      ? 'bg-white/80 border-[#D2E4F5]'
      : 'bg-slate-50 border-slate-200'
    : isVelvetPink
    ? 'bg-[#170D1B]/60 border-[#E8B4A0]/18'
    : 'bg-white/[0.02] border-white/[0.06]';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl glass-card border p-4 sm:p-6 smooth-interactive ${
        isLight ? '' : isVelvetPink ? 'border-[#E8B4A0]/22 shadow-2xl' : 'border-white/[0.08] shadow-2xl'
      }`}
    >
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 ${
              isVelvetPink
                ? 'bg-[#FF2E93]/18 border-[#FF65B5]/35 text-[#FF65B5]'
                : isLight
                ? isNordic
                  ? 'bg-sky-100 border-sky-200 text-sky-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <TrendingUp glow="accent" className="w-5 h-5" strokeWidth={1.65} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {translations.trendsTitle}
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg border font-numeric font-bold uppercase tracking-wider ${
                  isLight
                    ? isNordic
                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-white/[0.05] text-slate-300 border-white/[0.1]'
                }`}
              >
                {effectiveCurrency}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {translations.trendsSubtitle}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {availableCurrencies.length > 1 && (
            <div className={`flex items-center p-1 rounded-xl border text-xs ${switcherShellClass}`}>
              {availableCurrencies.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedChartCurrency(code)}
                  className={`px-2 py-1 rounded-lg font-numeric font-semibold transition-colors cursor-pointer ${
                    effectiveCurrency === code
                      ? isLight
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white/15 text-white'
                      : inactiveTabClass
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          )}

          {/* Months Range Switcher */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${switcherShellClass}`}>
            <button
              type="button"
              onClick={() => setMonthsRange(6)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                monthsRange === 6
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : inactiveTabClass
              }`}
            >
              {translations.last6Months}
            </button>
            <button
              type="button"
              onClick={() => setMonthsRange(12)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                monthsRange === 12
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : inactiveTabClass
              }`}
            >
              {translations.last12Months}
            </button>
          </div>

          {/* Chart Style Switcher (Area vs Bar) */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${switcherShellClass}`}>
            <button
              type="button"
              onClick={() => setChartType('area')}
              title={translations.areaChart}
              aria-label={translations.areaChart}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                chartType === 'area'
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/10 text-white shadow-sm border border-white/20'
                  : inactiveTabClass
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.65} />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title={translations.barChart}
              aria-label={translations.barChart}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                chartType === 'bar'
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/10 text-white shadow-sm border border-white/20'
                  : inactiveTabClass
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.65} />
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl border cursor-pointer transition-colors ${switcherShellClass} ${inactiveTabClass}`}
            title={isCollapsed ? 'Expand Trends Chart' : 'Collapse Trends Chart'}
            aria-label={isCollapsed ? 'Expand Trends Chart' : 'Collapse Trends Chart'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" strokeWidth={1.65} /> : <ChevronUp className="w-4 h-4" strokeWidth={1.65} />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'lent' ? 'all' : 'lent')}
              className={`p-3 rounded-2xl border text-start transition-colors active:scale-[0.98] cursor-pointer ${
                activeMetric === 'lent'
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-emerald-500/15 border-emerald-500/50 ring-2 ring-emerald-500/20'
                  : `${metricShellClass} hover:border-emerald-500/35`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <ArrowDownLeft glow="they_owe" className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.65} />
                  <span>{translations.totalLentPeriod}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div data-numeric="true" className={`font-numeric tabular-nums font-bold text-sm sm:text-base ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                {maskBalances ? '••••••' : formatCurrency(summary.totalLent, language, effectiveCurrency)}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'borrowed' ? 'all' : 'borrowed')}
              className={`p-3 rounded-2xl border text-start transition-colors active:scale-[0.98] cursor-pointer ${
                activeMetric === 'borrowed'
                  ? isVelvetPink
                    ? 'bg-[#FF2E93]/18 border-[#FF2E93]/60 ring-2 ring-[#FF65B5]/25'
                    : isLight
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-rose-500/15 border-rose-500/50 ring-2 ring-rose-500/20'
                  : `${metricShellClass} ${isVelvetPink ? 'hover:border-[#FF65B5]/45' : 'hover:border-rose-500/35'}`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <ArrowUpRight glow="i_owe" className={`w-3.5 h-3.5 ${isVelvetPink ? 'text-[#FF2E93]' : 'text-rose-500'}`} strokeWidth={1.65} />
                  <span>{translations.totalBorrowedPeriod}</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${isVelvetPink ? 'bg-[#FF2E93]' : 'bg-rose-500'}`} />
              </div>
              <div data-numeric="true" className={`font-numeric tabular-nums font-bold text-sm sm:text-base ${isVelvetPink ? 'text-[#FF65B5]' : isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                {maskBalances ? '••••••' : formatCurrency(summary.totalBorrowed, language, effectiveCurrency)}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'repaid' ? 'all' : 'repaid')}
              className={`p-3 rounded-2xl border text-start transition-colors active:scale-[0.98] cursor-pointer ${
                activeMetric === 'repaid'
                  ? isLight
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20'
                  : `${metricShellClass} hover:border-amber-500/35`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.65} />
                  <span>{translations.totalRepaidPeriod}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div data-numeric="true" className={`font-numeric tabular-nums font-bold text-sm sm:text-base ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                {maskBalances ? '••••••' : formatCurrency(summary.totalRepaid, language, effectiveCurrency)}
              </div>
            </button>

            <div className={`p-3 rounded-2xl border ${metricShellClass}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Wallet className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
                  <span>{translations.netFlow}</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${summary.netMomentum >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              <div
                data-numeric="true"
                className={`font-numeric tabular-nums font-bold text-sm sm:text-base ${
                  summary.netMomentum >= 0
                    ? isLight ? 'text-emerald-700' : 'text-emerald-300'
                    : isLight ? 'text-rose-700' : 'text-rose-300'
                }`}
              >
                {maskBalances ? '••••••' : formatCurrency(summary.netMomentum, language, effectiveCurrency)}
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="borrowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={borrowColor} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={borrowColor} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="repaidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                    axisLine={{ stroke: axisLineStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: yAxisTickColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {(activeMetric === 'all' || activeMetric === 'lent') && (
                    <Area
                      type="monotone"
                      dataKey="lentAmount"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#lentGrad)"
                      name={translations.lent}
                    />
                  )}

                  {(activeMetric === 'all' || activeMetric === 'borrowed') && (
                    <Area
                      type="monotone"
                      dataKey="borrowedAmount"
                      stroke={borrowColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#borrowGrad)"
                      name={translations.borrowed}
                    />
                  )}

                  {(activeMetric === 'all' || activeMetric === 'repaid') && (
                    <Area
                      type="monotone"
                      dataKey="repaidAmount"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#repaidGrad)"
                      name={translations.repaid}
                    />
                  )}
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: axisTickColor, fontSize: 11 }}
                    axisLine={{ stroke: axisLineStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: yAxisTickColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {(activeMetric === 'all' || activeMetric === 'lent') && (
                    <Bar dataKey="lentAmount" fill="#10B981" radius={[6, 6, 0, 0]} name={translations.lent} />
                  )}

                  {(activeMetric === 'all' || activeMetric === 'borrowed') && (
                    <Bar dataKey="borrowedAmount" fill={borrowColor} radius={[6, 6, 0, 0]} name={translations.borrowed} />
                  )}

                  {(activeMetric === 'all' || activeMetric === 'repaid') && (
                    <Bar dataKey="repaidAmount" fill="#F59E0B" radius={[6, 6, 0, 0]} name={translations.repaid} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend Filter Toggles */}
          <div className="flex items-center justify-center gap-4 pt-1 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'lent' ? 'all' : 'lent')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeMetric === 'lent' || activeMetric === 'all'
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'opacity-40 border-transparent text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{translations.lent}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'borrowed' ? 'all' : 'borrowed')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeMetric === 'borrowed' || activeMetric === 'all'
                  ? isVelvetPink
                    ? 'bg-[#FF2E93]/15 border-[#FF65B5]/40 text-[#FFD6EB]'
                    : isLight
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'opacity-40 border-transparent text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isVelvetPink ? 'bg-[#FF2E93]' : 'bg-rose-500'}`} />
              <span>{translations.borrowed}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric(activeMetric === 'repaid' ? 'all' : 'repaid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeMetric === 'repaid' || activeMetric === 'all'
                  ? isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'opacity-40 border-transparent text-slate-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{translations.repaid}</span>
            </button>
          </div>

          {!hasActivity && (
            <p className="text-center text-xs text-slate-500 italic pt-1">
              {translations.noActivityPeriod}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
