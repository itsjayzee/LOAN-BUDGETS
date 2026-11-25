import React, { useMemo, useState } from 'react';
import { CurrencyCode, Language, Loan, LoanType, ThemeMode, Translations } from '../types';
import {
  ArchiveSortOrder,
  filterAndSortArchivedLoans,
  formatCardDebt,
  formatSignedCardDebt,
  formatSignedCurrency,
  isLightThemeMode,
  resolveRecordDualEquivalent,
} from '../utils/loanLogic';
import {
  AlertTriangle,
  Archive,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from './OrganicIcons';

interface ArchiveDatabaseViewProps {
  archivedLoans: Loan[];
  language: Language;
  translations: Translations;
  activeCurrency: CurrencyCode;
  maskBalances?: boolean;
  themeMode?: ThemeMode;
  customRates?: Partial<Record<CurrencyCode, number>>;
  showDualCurrency?: boolean;
  dualPrimaryCurrency?: 'USD' | 'IQD';
  onRestoreLoan: (id: string) => void;
  onDeleteArchivedLoan: (loan: Loan) => void;
  onBackToActive: () => void;
  onOpenAddToArchive?: () => void;
  dueTodayCount?: number;
  dueTodayHeadline?: string;
  onJumpToDueAlerts?: () => void;
}

export const ArchiveDatabaseView: React.FC<ArchiveDatabaseViewProps> = ({
  archivedLoans,
  language,
  translations,
  activeCurrency,
  maskBalances = false,
  themeMode = 'obsidian_neon',
  customRates,
  showDualCurrency = true,
  dualPrimaryCurrency = 'IQD',
  onRestoreLoan,
  onDeleteArchivedLoan,
  onBackToActive,
  onOpenAddToArchive,
  dueTodayCount = 0,
  dueTodayHeadline,
  onJumpToDueAlerts,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LoanType>('all');
  const [sortBy, setSortBy] = useState<ArchiveSortOrder>('settled_desc');

  const filteredArchive = useMemo(
    () =>
      filterAndSortArchivedLoans(archivedLoans, {
        query,
        type: typeFilter,
        sortBy,
      }),
    [archivedLoans, query, typeFilter, sortBy]
  );

  const archiveStats = useMemo(() => {
    const collectedByCurr: Partial<Record<CurrencyCode, number>> = {};
    const paidByCurr: Partial<Record<CurrencyCode, number>> = {};
    const secondaryCurr: 'USD' | 'IQD' = dualPrimaryCurrency === 'IQD' ? 'USD' : 'IQD';
    let theyCount = 0;
    let iOweCount = 0;
    let collectedPrimary = 0;
    let collectedSecondary = 0;
    let paidPrimary = 0;
    let paidSecondary = 0;

    for (const loan of archivedLoans) {
      const curr = loan.currency || 'USD';
      const pVal =
        curr === dualPrimaryCurrency
          ? loan.amount
          : resolveRecordDualEquivalent(loan.amount, curr, customRates, loan, dualPrimaryCurrency).convertedAmount;
      const sVal =
        curr === secondaryCurr
          ? loan.amount
          : resolveRecordDualEquivalent(loan.amount, curr, customRates, loan, secondaryCurr).convertedAmount;
      if (loan.type === 'they_owe_me') {
        collectedByCurr[curr] = (collectedByCurr[curr] || 0) + loan.amount;
        collectedPrimary += pVal;
        collectedSecondary += sVal;
        theyCount++;
      } else {
        paidByCurr[curr] = (paidByCurr[curr] || 0) + loan.amount;
        paidPrimary += pVal;
        paidSecondary += sVal;
        iOweCount++;
      }
    }

    const collectedCurrencies = Object.keys(collectedByCurr) as CurrencyCode[];
    const paidCurrencies = Object.keys(paidByCurr) as CurrencyCode[];

    const primaryCollectedCurr: CurrencyCode = collectedByCurr[activeCurrency]
      ? activeCurrency
      : collectedCurrencies[0] || activeCurrency;
    const primaryPaidCurr: CurrencyCode = paidByCurr[activeCurrency]
      ? activeCurrency
      : paidCurrencies[0] || activeCurrency;

    return {
      collected: collectedByCurr[primaryCollectedCurr] || 0,
      primaryCollectedCurr,
      collectedByCurr,
      collectedCurrencies,
      paidOut: paidByCurr[primaryPaidCurr] || 0,
      primaryPaidCurr,
      paidByCurr,
      paidCurrencies,
      theyCount,
      iOweCount,
      dualPrimaryCurrency,
      dualSecondaryCurrency: secondaryCurr,
      collectedPrimary,
      collectedSecondary,
      paidPrimary,
      paidSecondary,
    };
  }, [archivedLoans, activeCurrency, customRates, dualPrimaryCurrency]);

  const labels = {
    title: isKu ? 'ئەرشیف' : isAr ? 'الأرشيف' : isTr ? 'Arşiv' : isFr ? 'Archives' : isEs ? 'Archivo' : 'Archive',
    subtitle: isKu
      ? 'هەموو قەرزە تەواوبوو و پاکتاوکراوەکان بە شێوەیەکی ئۆتۆماتیکی لێرەدا هەڵدەگیرێن.'
      : isAr
      ? 'جميع الديون المسددة بالكامل تُحفظ تلقائياً في الأرشيف المحلي.'
      : isTr
      ? 'Tamamen ödenen tüm borç kayıtları otomatik olarak bu yerel arşive taşınır.'
      : isFr
      ? 'Toutes les dettes entièrement réglées sont archivées automatiquement dans cette archive locale.'
      : isEs
      ? 'Todos los registros saldados se mueven automáticamente de tu vista diaria a este archivo local.'
      : 'All settled records automatically move out of your daily view into this secure local archive.',
    collectedHistory: isKu
      ? 'کۆی وەرگیراوە پاکتاوکراوەکان'
      : isAr
      ? 'إجمالي المحصّل تاريخياً'
      : isTr
      ? 'Tahsil Edilen Geçmiş'
      : isFr
      ? 'Total encaissé archivé'
      : isEs
      ? 'Cobrado Archivado'
      : 'Settled Collected',
    paidHistory: isKu
      ? 'کۆی دراوە پاکتاوکراوەکان'
      : isAr
      ? 'إجمالي المدفوع تاريخياً'
      : isTr
      ? 'Ödenen Geçmiş'
      : isFr
      ? 'Total remboursé archivé'
      : isEs
      ? 'Pagado Archivado'
      : 'Settled Paid Out',
    totalArchived: isKu
      ? 'تۆماری ئەرشیفکراو'
      : isAr
      ? 'سجل مؤرشف'
      : isTr
      ? 'Arşiv Kaydı'
      : isFr
      ? 'Enregistrements archivés'
      : isEs
      ? 'Registros Archivados'
      : 'Archived Records',
    restore: isKu
      ? 'گەڕاندنەوە بۆ چالاک'
      : isAr
      ? 'استعادة للنشطة'
      : isTr
      ? 'Aktife Geri Al'
      : isFr
      ? 'Restaurer'
      : isEs
      ? 'Restaurar a Activos'
      : 'Restore to Active',
    sortLatest: isKu ? 'نوێترین پاکتاوکراو' : isAr ? 'الأحدث تسوية' : isTr ? 'En Yeni Kapanan' : isFr ? 'Plus récents' : isEs ? 'Más recientes' : 'Latest Settled',
    sortOldest: isKu ? 'کۆنترین پاکتاوکراو' : isAr ? 'الأقدم تسوية' : isTr ? 'En Eski Kapanan' : isFr ? 'Plus anciens' : isEs ? 'Más antiguos' : 'Oldest Settled',
    sortAmount: isKu ? 'زۆرترین بڕ' : isAr ? 'الأعلى مبلغاً' : isTr ? 'En Yüksek Tutar' : isFr ? 'Montant décroissant' : isEs ? 'Mayor monto' : 'Highest Amount',
    sortName: isKu ? 'بەپێی ناو (A-Z)' : isAr ? 'حسب الاسم' : isTr ? 'İsme Göre (A-Z)' : isFr ? 'Nom (A-Z)' : isEs ? 'Nombre (A-Z)' : 'Name (A-Z)',
    emptyArchive: isKu
      ? 'هێشتا هیچ قەرزێکی پاکتاوکراو لە ئەرشیفدا نییە.'
      : isAr
      ? 'لا توجد سجلات مسددة في الأرشيف بعد.'
      : isTr
      ? 'Arşivde henüz kapanmış kayıt yok.'
      : isFr
      ? "Aucun enregistrement dans l'archive pour le moment."
      : isEs
      ? 'Aún no hay registros saldados en el archivo.'
      : 'No settled records in the archive yet.',
    emptyHint: isKu
      ? 'کاتێک هەر قەرزێک بە تەواوی دەدرێتەوە، بە شێوەیەکی خۆکار دەگوازرێتەوە بۆ ئێرە.'
      : isAr
      ? 'عند تسوية أي سجل بالكامل، سينتقل تلقائياً من القائمة النشطة إلى هنا.'
      : isTr
      ? 'Bir kaydı tamamen ödendi olarak işaretlediğinizde otomatik olarak buraya taşınır.'
      : isFr
      ? 'Dès qu’un prêt est soldé, il est déplacé automatiquement ici.'
      : isEs
      ? 'Cuando un préstamo se marca como saldado o se paga por completo, se mueve aquí automáticamente.'
      : 'When a loan is marked settled or paid in full, it automatically moves here.',
    backToActive: isKu ? 'گەڕانەوە بۆ قەرزە چالاکەکان' : isAr ? 'العودة للديون النشطة' : isTr ? 'Aktif Kayıtlara Dön' : isFr ? 'Retour aux prêts actifs' : isEs ? 'Volver a Préstamos Activos' : 'Back to Active Loans',
    addToArchiveBtn: isKu ? 'زیادکردن بۆ ئەرشیف' : isAr ? 'إضافة للأرشيف' : isTr ? 'Arşive Ekle' : isFr ? "Ajouter à l'archive" : isEs ? 'Añadir al Archivo' : 'Add to Archive',
  };

  return (
    <section className="space-y-5 animate-organic-enter" data-testid="archive-database-view">
      {/* Archive Banner */}
      <div className={`relative overflow-hidden rounded-3xl glass-card border p-5 sm:p-6 smooth-interactive ${isLight ? (isNordic ? 'border-sky-200/90' : 'border-slate-200') : isVelvetPink ? 'bg-[#1F1224]/85 border-[#E8B4A0]/22' : 'border-white/[0.1]'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'
              }`}
            >
              <Archive glow="accent" className="w-5 h-5" strokeWidth={1.65} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-black font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {labels.title}
                </h2>
                <span
                  data-numeric="true"
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-numeric tabular-nums font-bold border ${
                    isLight
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                  }`}
                >
                  {archivedLoans.length} {labels.totalArchived}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{labels.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onOpenAddToArchive && (
              <button
                type="button"
                onClick={onOpenAddToArchive}
                data-testid="add-to-archive-btn"
                className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>{labels.addToArchiveBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToActive}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
              }`}
            >
              {labels.backToActive}
            </button>
          </div>
        </div>

        {/* Historical Summary Strip (+ / - Signed Totals) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t ${isLight ? 'border-slate-200/80' : 'border-white/[0.07]'}`}>
          <div
            className={`p-3.5 rounded-2xl border space-y-2 ${
              isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/25 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <ArrowDownLeft glow="they_owe" className="w-4 h-4" strokeWidth={1.65} />
                </div>
                <div>
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    <span className="inline-emoji" aria-hidden="true">💰</span>
                    <span>{labels.collectedHistory}</span>
                  </span>
                  <span data-numeric="true" className={`text-[10px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {archiveStats.theyCount} {translations.statusSettled}
                  </span>
                </div>
              </div>
              <div className="text-end shrink-0">
                <div data-numeric="true" dir="ltr" className={`font-numeric font-black text-base sm:text-lg tabular-nums ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  {maskBalances
                    ? '••••••'
                    : showDualCurrency
                    ? `+${formatCardDebt(archiveStats.collectedPrimary, archiveStats.dualPrimaryCurrency, language)}`
                    : formatSignedCurrency(archiveStats.collected, language, archiveStats.primaryCollectedCurr, 'they_owe_me')}
                </div>
                {!maskBalances && showDualCurrency && (
                  <div data-numeric="true" dir="ltr" className={`text-[11px] font-numeric tabular-nums font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    ≈ +{formatCardDebt(archiveStats.collectedSecondary, archiveStats.dualSecondaryCurrency, language)}
                  </div>
                )}
              </div>
            </div>
            {!maskBalances && archiveStats.collectedCurrencies.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {archiveStats.collectedCurrencies.map((c) => (
                  <span key={c} data-numeric="true" className={`text-[10px] px-2 py-0.5 rounded-lg border font-numeric tabular-nums font-bold ${isLight ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'}`}>
                    {formatSignedCardDebt(archiveStats.collectedByCurr[c] || 0, c, language, 'they_owe_me')}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            className={`p-3.5 rounded-2xl border space-y-2 ${
              isLight ? 'bg-rose-50 border-rose-200' : isVelvetPink ? 'bg-[#FF2E93]/10 border-[#FF65B5]/30' : 'bg-rose-950/25 border-rose-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : isVelvetPink ? 'bg-[#FF2E93]/20 border-[#FF65B5]/40 text-[#FF65B5]' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <ArrowUpRight glow="i_owe" className="w-4 h-4" strokeWidth={1.65} />
                </div>
                <div>
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? 'text-rose-800' : 'text-rose-300'}`}>
                    <span className="inline-emoji" aria-hidden="true">💸</span>
                    <span>{labels.paidHistory}</span>
                  </span>
                  <span data-numeric="true" className={`text-[10px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {archiveStats.iOweCount} {translations.statusSettled}
                  </span>
                </div>
              </div>
              <div className="text-end shrink-0">
                <div data-numeric="true" dir="ltr" className={`font-numeric font-black text-base sm:text-lg tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                  {maskBalances
                    ? '••••••'
                    : showDualCurrency
                    ? `-${formatCardDebt(archiveStats.paidPrimary, archiveStats.dualPrimaryCurrency, language)}`
                    : formatSignedCurrency(archiveStats.paidOut, language, archiveStats.primaryPaidCurr, 'i_owe_them')}
                </div>
                {!maskBalances && showDualCurrency && (
                  <div data-numeric="true" dir="ltr" className={`text-[11px] font-numeric tabular-nums font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    ≈ -{formatCardDebt(archiveStats.paidSecondary, archiveStats.dualSecondaryCurrency, language)}
                  </div>
                )}
              </div>
            </div>
            {!maskBalances && archiveStats.paidCurrencies.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {archiveStats.paidCurrencies.map((c) => (
                  <span key={c} data-numeric="true" className={`text-[10px] px-2 py-0.5 rounded-lg border font-numeric tabular-nums font-bold ${isLight ? 'bg-white border-rose-200 text-rose-800' : 'bg-rose-950/60 border-rose-500/30 text-rose-200'}`}>
                    {formatSignedCardDebt(archiveStats.paidByCurr[c] || 0, c, language, 'i_owe_them')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contextual Active-Deadline Status Indicator */}
        <div
          data-testid="archive-due-indicator"
          className={`mt-3 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            dueTodayCount > 0
              ? isLight
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-amber-500/[0.08] border-amber-500/25 text-amber-200'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {dueTodayCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.65} />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" strokeWidth={1.65} />
            )}
            <span className="truncate font-medium">
              {dueTodayCount > 0
                ? dueTodayHeadline ||
                  (isKu
                    ? `ئەمڕۆ کاتی دانەوەیە: ${dueTodayCount} تۆمار پێویستی بە پێداچوونەوەیە.`
                    : isAr
                    ? `مستحق اليوم: ${dueTodayCount} سجل يحتاج إلى متابعة.`
                    : isTr
                    ? `Bugün Vadeli: ${dueTodayCount} kayıt dikkat gerektiriyor.`
                    : isFr
                    ? `Échéance aujourd'hui : ${dueTodayCount} dossier(s) à vérifier.`
                    : isEs
                    ? `Vence hoy: ${dueTodayCount} registro(s) requieren atención.`
                    : `Payment Due Today: ${dueTodayCount} deadline(s) require attention.`)
                : isKu
                ? `${archivedLoans.length} تۆماری پاکتاوکراو لە ئەرشیفدایە · ئەمڕۆ هیچ وادەیەکی چالاک نییە`
                : isAr
                ? `جميع السجلات المؤرشفة مكتملة (${archivedLoans.length}) · لا توجد مواعيد مستحقة اليوم في النشطة`
                : isTr
                ? `${archivedLoans.length} arşivlenmiş kayıt · Bugün vadesi dolan aktif borç yok`
                : isFr
                ? `${archivedLoans.length} dossier(s) archivé(s) · 0 échéance active aujourd'hui`
                : isEs
                ? `${archivedLoans.length} registro(s) archivado(s) · 0 vencimientos activos hoy`
                : `${archivedLoans.length} historical record(s) archived · 0 active deadlines due today`}
            </span>
          </div>
          {dueTodayCount > 0 && onJumpToDueAlerts && (
            <button
              type="button"
              onClick={onJumpToDueAlerts}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 cursor-pointer ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-200'
              }`}
            >
              {isKu ? 'بینینی چالاکەکان' : isAr ? 'مراجعة المواعيد' : isTr ? 'Aktifleri Gör' : isFr ? 'Voir actifs' : isEs ? 'Revisar Activos' : 'Review Active'}
            </button>
          )}
        </div>
      </div>

      {/* Search, Type Filter & Sort Controls */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border space-y-3 smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-white/80 backdrop-blur-xl border-sky-200/80'
              : 'bg-white border-slate-200 shadow-xs'
            : isVelvetPink
            ? 'bg-[#1F1224]/85 backdrop-blur-xl border-[#E8B4A0]/22'
            : 'bg-[#0D121F]/80 backdrop-blur-xl border-white/[0.08]'
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`} strokeWidth={1.65} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={translations.searchPlaceholder}
              aria-label="Search Archive"
              className={`w-full min-h-[42px] ps-10 pe-9 py-2 rounded-xl border text-xs outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                  : 'bg-slate-950/90 border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-400/60'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className={`absolute top-1/2 -translate-y-1/2 end-2.5 p-1 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.65} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'all'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.06]'
              }`}
            >
              {translations.filterAll} ({archivedLoans.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('they_owe_me')}
              className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'they_owe_me'
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white/[0.03] text-slate-400 hover:text-emerald-300 border-white/[0.06]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={1.65} />
              <span>{translations.filterTheyOwe}</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('i_owe_them')}
              className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'i_owe_them'
                  ? isLight
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  : isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-white/[0.03] text-slate-400 hover:text-rose-300 border-white/[0.06]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.65} />
              <span>{translations.filterIOwe}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.65} />
            <select
              aria-label="Sort Archived Loans"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ArchiveSortOrder)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-white/[0.1] text-slate-200'
              }`}
            >
              <option value="settled_desc">{labels.sortLatest}</option>
              <option value="settled_asc">{labels.sortOldest}</option>
              <option value="amount_desc">{labels.sortAmount}</option>
              <option value="name_asc">{labels.sortName}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archived Records List */}
      {filteredArchive.length === 0 ? (
        <div className={`px-8 pt-8 pb-16 sm:px-10 sm:pt-9 sm:pb-16 text-center rounded-3xl glass-card border space-y-3 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${isLight ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'}`}>
            <Archive className="w-6 h-6" strokeWidth={1.65} />
          </div>
          <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{labels.emptyArchive}</h3>
          <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{labels.emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredArchive.map((loan) => {
            const isTheyOweMe = loan.type === 'they_owe_me';
            const curr = loan.currency || 'USD';
            const DirectionIcon = isTheyOweMe ? ArrowDownLeft : ArrowUpRight;
            return (
              <div
                key={loan.id}
                className={`relative overflow-hidden rounded-3xl glass-card border p-4 sm:p-5 flex flex-col justify-between gap-3.5 smooth-interactive hover:border-indigo-400/50 ${
                  isLight ? 'border-slate-200' : isVelvetPink ? 'bg-[#1F1224]/80 border-[#E8B4A0]/22 hover:border-[#FF65B5]/50' : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        isTheyOweMe
                          ? isLight
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : isLight
                          ? 'bg-rose-100 border-rose-300 text-rose-700'
                          : isVelvetPink
                          ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <DirectionIcon glow={isTheyOweMe ? 'they_owe' : 'i_owe'} className="w-4.5 h-4.5" strokeWidth={1.65} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <h4 dir="auto" className={`font-bold font-pricedown tracking-wide text-sm sm:text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {loan.personName}
                        </h4>
                        {loan.linkedUsername &&
                          (loan.personName || '').trim().toLowerCase() !== `@${loan.linkedUsername.toLowerCase()}` && (
                            <span
                              dir="ltr"
                              className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                            >
                              @{loan.linkedUsername}
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isTheyOweMe
                              ? isLight
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25'
                              : isLight
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-rose-400/10 text-rose-300 border-rose-400/25'
                          }`}
                        >
                          <span className="inline-emoji me-1" aria-hidden="true">{isTheyOweMe ? '💰' : '💸'}</span>
                          {isTheyOweMe ? translations.theyOweMe : translations.iOweThem}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                            isLight
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.65} />
                          <span>{translations.statusSettled}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      data-testid={`archive-settled-ring-${loan.id}`}
                      aria-label="100%"
                      className="relative w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          strokeWidth="3"
                          className={isLight ? 'stroke-slate-200' : 'stroke-white/10'}
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={0}
                          className={
                            isVelvetPink
                              ? 'stroke-[#FF2E93]'
                              : isLight
                              ? 'stroke-emerald-600'
                              : 'stroke-emerald-400'
                          }
                        />
                      </svg>
                      <span
                        data-numeric="true"
                        className={`absolute inset-0 flex items-center justify-center font-numeric text-[9px] font-bold ${
                          isVelvetPink
                            ? 'text-pink-200'
                            : isLight
                            ? 'text-emerald-700'
                            : 'text-emerald-300'
                        }`}
                      >
                        100%
                      </span>
                    </div>

                    <div className="text-end shrink-0">
                      <div
                        data-numeric="true"
                        dir="ltr"
                        className={`font-numeric font-black text-base sm:text-lg tabular-nums ${
                          isTheyOweMe
                            ? isLight
                              ? 'text-emerald-700'
                              : 'text-emerald-300'
                            : isLight
                            ? 'text-rose-700'
                            : 'text-rose-300'
                        }`}
                      >
                        {maskBalances ? '••••••' : formatSignedCardDebt(loan.amount, curr, language, loan.type)}
                      </div>
                      {showDualCurrency && !maskBalances && loan.amount > 0 && (() => {
                        const archDual = resolveRecordDualEquivalent(loan.amount, curr, customRates, loan);
                        return (
                          <div
                            data-testid={`archive-dual-${loan.id}`}
                            data-numeric="true"
                            dir="ltr"
                            className={`text-[10px] font-numeric tabular-nums font-medium mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                          >
                            ≈ {isTheyOweMe ? '+' : '-'}{formatCardDebt(archDual.convertedAmount, archDual.targetCurrency, language)}
                            {archDual.usedRateUsdToIqd > 0 ? ` · @${archDual.usedRateUsdToIqd.toLocaleString('en-US')}` : ''}
                          </div>
                        );
                      })()}
                      <div className={`text-[10px] font-numeric mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {curr}
                      </div>
                    </div>
                  </div>
                </div>

                {(loan.phone || loan.notes) && (
                  <div
                    className={`p-2.5 rounded-2xl border space-y-1.5 text-[11px] ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                    }`}
                  >
                    {loan.phone && (
                      <div className={`flex items-center gap-1.5 font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Phone className="w-3 h-3 shrink-0" strokeWidth={1.65} />
                        <span dir="ltr">{loan.phone}</span>
                      </div>
                    )}
                    {loan.notes && (
                      <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        <FileText className="w-3 h-3 shrink-0 text-slate-500" strokeWidth={1.65} />
                        <span className="truncate">{loan.notes}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                  <button
                    type="button"
                    onClick={() => onRestoreLoan(loan.id)}
                    aria-label={`${labels.restore} ${loan.personName}`}
                    className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border-indigo-400/30'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.65} />
                    <span>{labels.restore}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteArchivedLoan(loan)}
                    aria-label={`${translations.deleteLoan} ${loan.personName}`}
                    className={`min-h-[40px] w-10 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                      isLight
                        ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-100 border-slate-200 hover:border-rose-300'
                        : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border-white/[0.06] hover:border-rose-500/30'
                    }`}
                    title={translations.deleteLoan}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.65} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
