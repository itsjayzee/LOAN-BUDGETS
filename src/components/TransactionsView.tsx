import React, { useMemo, useState } from 'react';
import {
  CurrencyCode,
  Language,
  LoanType,
  ThemeMode,
  TransactionActionType,
  TransactionEntry,
  Translations,
} from '../types';
import {
  filterTransactions,
  formatCardDebt,
  formatSignedCardDebt,
  formatSignedCurrency,
  formatTransactionTimestamp,
  isFibPaymentNote,
  isLightThemeMode,
  resolveRecordDualEquivalent,
  summarizeTransactions,
} from '../utils/loanLogic';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  FileText,
  History,
  Landmark,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  Trash2,
  X,
} from './OrganicIcons';

interface TransactionsViewProps {
  transactions: TransactionEntry[];
  language: Language;
  translations: Translations;
  activeCurrency: CurrencyCode;
  maskBalances?: boolean;
  themeMode?: ThemeMode;
  customRates?: Partial<Record<CurrencyCode, number>>;
  showDualCurrency?: boolean;
  dualPrimaryCurrency?: 'USD' | 'IQD';
  onBackToActive: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  language,
  translations,
  activeCurrency,
  maskBalances = false,
  themeMode = 'obsidian_neon',
  customRates,
  showDualCurrency = true,
  dualPrimaryCurrency = 'IQD',
  onBackToActive,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LoanType>('all');

  const filtered = useMemo(
    () => filterTransactions(transactions, { query, type: typeFilter }),
    [transactions, query, typeFilter]
  );

  // Pick display currency strictly without FX conversion
  const displayCurrency: CurrencyCode = useMemo(() => {
    if (transactions.some((tx) => (tx.currency || 'USD') === activeCurrency)) {
      return activeCurrency;
    }
    return transactions[0]?.currency || activeCurrency;
  }, [transactions, activeCurrency]);

  const summary = useMemo(
    () => summarizeTransactions(transactions, displayCurrency),
    [transactions, displayCurrency]
  );

  const dualSummary = useMemo(() => {
    const secondaryCurr: 'USD' | 'IQD' = dualPrimaryCurrency === 'IQD' ? 'USD' : 'IQD';
    let receivablePrimary = 0;
    let receivableSecondary = 0;
    let payablePrimary = 0;
    let payableSecondary = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amountChange) || 0;
      if (amt <= 0) continue;
      const pVal =
        tx.currency === dualPrimaryCurrency
          ? amt
          : resolveRecordDualEquivalent(amt, tx.currency, customRates, tx, dualPrimaryCurrency).convertedAmount;
      const sVal =
        tx.currency === secondaryCurr
          ? amt
          : resolveRecordDualEquivalent(amt, tx.currency, customRates, tx, secondaryCurr).convertedAmount;
      if (tx.loanType === 'they_owe_me') {
        receivablePrimary += pVal;
        receivableSecondary += sVal;
      } else {
        payablePrimary += pVal;
        payableSecondary += sVal;
      }
    }

    return {
      primaryCurrency: dualPrimaryCurrency,
      secondaryCurrency: secondaryCurr,
      receivablePrimary,
      receivableSecondary,
      payablePrimary,
      payableSecondary,
    };
  }, [transactions, customRates, dualPrimaryCurrency]);

  const getActionMeta = (action: TransactionActionType, notes?: string) => {
    switch (action) {
      case 'created':
        return {
          label: pick('Created', 'إنشاء قيد', 'تۆمارکردن', 'Oluşturuldu', 'Créé', 'Creado'),
          icon: PlusCircle,
          pillClass: isLight
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'added_money':
        return {
          label: pick('Added Money', 'زيادة مبلغ', 'زیادکردنی پارە', 'Tutar Eklendi', 'Montant ajouté', 'Monto añadido'),
          icon: Plus,
          pillClass: isLight
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'repayment':
        return {
          label: pick('Repayment', 'دفعة سداد', 'دانەوەی بڕێک', 'Kısmi Ödeme', 'Remboursement', 'Abono'),
          icon: ArrowDownLeft,
          pillClass: isLight
            ? 'bg-sky-100 text-sky-800 border-sky-300'
            : 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        };
      case 'settled':
        return {
          label: pick('Settled', 'تمت التسوية', 'پاکتاوکرا', 'Kapatıldı', 'Réglé', 'Saldado'),
          icon: CheckCircle2,
          pillClass: isLight
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
        };
      case 'card_payment':
        if (isFibPaymentNote(notes)) {
          return {
            label: pick('FIB Payment', 'دفع عبر FIB', 'پارەدانی FIB', 'FIB Ödemesi', 'Paiement FIB', 'Pago FIB'),
            icon: Landmark,
            pillClass: isLight
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-[#062238] text-emerald-300 border-emerald-400/40',
          };
        }
        return {
          label: pick('Card Payment', 'دفع بالبطاقة', 'پارەدانی کارت', 'Kart Ödemesi', 'Paiement carte', 'Pago con Tarjeta'),
          icon: CreditCard,
          pillClass: isLight
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/35',
        };
      case 'restored':
        return {
          label: pick('Restored', 'استعادة', 'گەڕێنرایەوە', 'Geri Alındı', 'Restauré', 'Restaurado'),
          icon: RotateCcw,
          pillClass: isLight
            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
            : 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
        };
      case 'deleted':
        return {
          label: pick('Deleted', 'حذف', 'سڕینەوە', 'Silindi', 'Supprimé', 'Eliminado'),
          icon: Trash2,
          pillClass: isLight
            ? 'bg-rose-100 text-rose-800 border-rose-300'
            : 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'edited':
      default:
        return {
          label: pick('Updated', 'تعديل', 'نوێکردنەوە', 'Güncellendi', 'Mis à jour', 'Actualizado'),
          icon: Edit3,
          pillClass: isLight
            ? 'bg-slate-200 text-slate-800 border-slate-300'
            : 'bg-white/[0.08] text-slate-200 border-white/[0.14]',
        };
    }
  };

  return (
    <section className="space-y-5 animate-organic-enter" data-testid="transactions-ledger-view">
      {/* Header Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl glass-card p-5 sm:p-6 smooth-interactive ${
          isLight
            ? isNordic
              ? 'border border-sky-200/90'
              : 'border border-slate-200'
            : isVelvetPink
            ? 'bg-[#1F1224]/85 border border-[#E8B4A0]/22'
            : 'border border-white/[0.1]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight
                  ? isNordic
                    ? 'bg-sky-100 border-sky-300 text-sky-700'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <History glow="accent" className="w-5 h-5" strokeWidth={1.65} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-black font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {pick('Transaction Ledger', 'سجل المعاملات', 'تۆماری مامەڵەکان', 'İşlem Defteri', 'Journal des Transactions', 'Libro de Transacciones')}
                </h2>
                <span
                  data-numeric="true"
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-numeric tabular-nums font-bold border ${
                    isLight
                      ? isNordic
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-white/[0.06] text-slate-200 border-white/[0.12]'
                  }`}
                >
                  {transactions.length}{' '}
                  {transactions.length === 1
                    ? pick('Entry', 'قيد', 'تۆمار', 'Kayıt', 'Écriture', 'Registro')
                    : pick('Entries', 'قيد', 'تۆمار', 'Kayıt', 'Écritures', 'Registros')}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick(
                  'Chronological audit log of every addition, repayment, card settlement, and balance adjustment with explicit + and − direction signage.',
                  'سجل زمني موثق لكل إضافة وسداد وتسوية مع إشارات (+) للتحصيل و(−) للالتزام.',
                  'تۆماری کاتبەندکراوی هەموو زیادکردن و دانەوەکان بە هێمای (+) و (−).',
                  'Her ekleme, ödeme ve kapatma işlemi için (+) alacak ve (−) borç işaretli kronolojik defter.',
                  'Journal chronologique de chaque ajout, remboursement et règlement avec signes (+) et (−).',
                  'Registro cronológico de cada adición, abono, pago con tarjeta y ajuste con signos explícitos + y −.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToActive}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 self-start sm:self-auto ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
            }`}
          >
            {pick('Back to Active', 'العودة للنشطة', 'گەڕانەوە بۆ چالاکەکان', 'Aktiflere Dön', 'Retour aux actifs', 'Volver a Activos')}
          </button>
        </div>

        {/* + Receivable vs - Payable Ledger Summary */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t ${isLight ? 'border-slate-200/80' : 'border-white/[0.07]'}`}>
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isLight
                ? 'bg-emerald-50/85 border-emerald-200'
                : 'bg-emerald-950/25 border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <ArrowDownLeft glow="they_owe" className="w-4 h-4" strokeWidth={1.65} />
              </div>
              <div>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  {pick('+ Receivable Activity', '+ نشاط التحصيل', '+ جوڵەی وەرگرتن', '+ Alacak Hareketi', '+ Activité Créances', '+ Actividad por Cobrar')}
                </span>
                <span data-numeric="true" className={`text-[10px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {summary.receivableEvents}{' '}
                  {summary.receivableEvents === 1
                    ? pick('event', 'حركة', 'جوڵە', 'işlem', 'opération', 'movimiento')
                    : pick('events', 'حركة', 'جوڵە', 'işlem', 'opérations', 'movimientos')}
                </span>
              </div>
            </div>
            <div className="text-end shrink-0">
              <div data-numeric="true" dir="ltr" className={`font-numeric font-black text-base sm:text-lg tabular-nums ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                {maskBalances
                  ? '••••••'
                  : showDualCurrency
                  ? `+${formatCardDebt(dualSummary.receivablePrimary, dualSummary.primaryCurrency, language)}`
                  : formatSignedCurrency(summary.totalReceivableVolume, language, displayCurrency, 'they_owe_me')}
              </div>
              {!maskBalances && showDualCurrency && (
                <div data-numeric="true" dir="ltr" className={`text-[11px] font-numeric tabular-nums font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  ≈ +{formatCardDebt(dualSummary.receivableSecondary, dualSummary.secondaryCurrency, language)}
                </div>
              )}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isLight
                ? 'bg-rose-50/85 border-rose-200'
                : isVelvetPink
                ? 'bg-[#FF2E93]/10 border-[#FF65B5]/30'
                : 'bg-rose-950/25 border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : isVelvetPink ? 'bg-[#FF2E93]/20 border-[#FF65B5]/40 text-[#FF65B5]' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <ArrowUpRight glow="i_owe" className="w-4 h-4" strokeWidth={1.65} />
              </div>
              <div>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-rose-800' : 'text-rose-300'}`}>
                  {pick('- Payable Activity', '- نشاط السداد', '- جوڵەی قەرزدانەوە', '- Borç Hareketi', '- Activité Dettes', '- Actividad por Pagar')}
                </span>
                <span data-numeric="true" className={`text-[10px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {summary.payableEvents}{' '}
                  {summary.payableEvents === 1
                    ? pick('event', 'حركة', 'جوڵە', 'işlem', 'opération', 'movimiento')
                    : pick('events', 'حركة', 'جوڵە', 'işlem', 'opérations', 'movimientos')}
                </span>
              </div>
            </div>
            <div className="text-end shrink-0">
              <div data-numeric="true" dir="ltr" className={`font-numeric font-black text-base sm:text-lg tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                {maskBalances
                  ? '••••••'
                  : showDualCurrency
                  ? `-${formatCardDebt(dualSummary.payablePrimary, dualSummary.primaryCurrency, language)}`
                  : formatSignedCurrency(summary.totalPayableVolume, language, displayCurrency, 'i_owe_them')}
              </div>
              {!maskBalances && showDualCurrency && (
                <div data-numeric="true" dir="ltr" className={`text-[11px] font-numeric tabular-nums font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  ≈ -{formatCardDebt(dualSummary.payableSecondary, dualSummary.secondaryCurrency, language)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border space-y-3 smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-white/80 backdrop-blur-xl border-sky-200/80'
              : 'bg-white border-slate-200 shadow-sm'
            : isVelvetPink
            ? 'bg-[#1F1224]/85 backdrop-blur-xl border-[#E8B4A0]/22'
            : 'bg-[#0D121F]/80 backdrop-blur-xl border-white/[0.08]'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`} strokeWidth={1.65} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pick('Search counterparty, currency, or notes...', 'ابحث بالاسم أو العملة أو الملاحظات...', 'گەڕان بەدوای ناو یان تێبینی...', 'Kişi, döviz veya not ara...', 'Rechercher nom, devise ou note...', 'Buscar persona, moneda o notas...')}
              aria-label="Search Transactions"
              className={`w-full min-h-[42px] ps-10 pe-9 py-2 rounded-xl border text-xs outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                  : 'bg-slate-950/90 border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-400/60'
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
              data-testid="tx-filter-all"
              onClick={() => setTypeFilter('all')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'all'
                  ? isLight
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white/[0.14] text-white border-white/25'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.06]'
              }`}
            >
              {translations.filterAll} ({transactions.length})
            </button>
            <button
              type="button"
              data-testid="tx-filter-they-owe"
              onClick={() => setTypeFilter('they_owe_me')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'they_owe_me'
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white/[0.03] text-slate-400 hover:text-emerald-300 border-white/[0.06]'
              }`}
            >
              + {translations.filterTheyOwe}
            </button>
            <button
              type="button"
              data-testid="tx-filter-i-owe"
              onClick={() => setTypeFilter('i_owe_them')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                typeFilter === 'i_owe_them'
                  ? isLight
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  : isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'bg-white/[0.03] text-slate-400 hover:text-rose-300 border-white/[0.06]'
              }`}
            >
              - {translations.filterIOwe}
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Entries */}
      {filtered.length === 0 ? (
        <div className={`p-10 sm:p-12 text-center rounded-3xl glass-card border space-y-3 ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/[0.04] border-white/[0.1] text-slate-300'
            }`}
          >
            <History className="w-6 h-6" strokeWidth={1.65} />
          </div>
          <h3 className={`text-sm sm:text-base font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {pick('No Transactions Recorded Yet', 'لا توجد معاملات مسجلة بعد', 'هیچ مامەڵەیەک تۆمار نەکراوە', 'Henüz İşlem Kaydı Yok', 'Aucune transaction enregistrée', 'Aún no hay transacciones registradas')}
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {pick(
              'Creating, updating, paying, settling, or archiving a loan automatically writes a timestamped entry here.',
              'عند إضافة أو تعديل أو سداد أي سجل ستظهر حركة موثقة بالوقت والتاريخ هنا تلقائياً.',
              'هەر کاتێک قەرزێک تۆمار یان نوێ بکەیتەوە، لێرەدا تۆمار دەکرێت.',
              'Bir borç veya alacak eklediğinizde, ödediğinizde ya da güncellediğinizde zaman damgalı kayıt burada görünür.',
              'Chaque création, modification, paiement ou règlement apparaît automatiquement ici avec horodatage.',
              'Al crear, actualizar, pagar, saldar o archivar un préstamo, se registra automáticamente una entrada aquí.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5" data-testid="transactions-ledger-list">
          {filtered.map((tx) => {
            const isThey = tx.loanType === 'they_owe_me';
            const meta = getActionMeta(tx.action, tx.notes);
            const ActionIcon = meta.icon;
            const formattedTs = formatTransactionTimestamp(tx.timestamp);

            return (
              <div
                key={tx.id}
                data-testid={`transaction-row-${tx.id}`}
                className={`rounded-2xl glass-card border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 smooth-interactive ${
                  isLight ? 'border-slate-200/90' : isVelvetPink ? 'bg-[#1F1224]/80 border-[#E8B4A0]/22' : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 text-sm font-black ${
                      isThey
                        ? isLight
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                        : isLight
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                    }`}
                  >
                    <span className="font-numeric text-base">{isThey ? '+' : '−'}</span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span dir="auto" className={`font-bold font-pricedown tracking-wide text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {tx.personName}
                      </span>
                      {tx.linkedUsername &&
                        (tx.personName || '').trim().toLowerCase() !== `@${tx.linkedUsername.toLowerCase()}` && (
                          <span
                            dir="ltr"
                            className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                          >
                            @{tx.linkedUsername}
                          </span>
                        )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.pillClass}`}>
                        <ActionIcon className="w-3 h-3" strokeWidth={1.65} />
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    <div data-numeric="true" className={`flex items-center gap-3 flex-wrap text-[11px] font-numeric tabular-nums ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" strokeWidth={1.65} />
                        <span>{formattedTs}</span>
                      </span>
                      <span>
                        {formatCardDebt(tx.balanceBefore, tx.currency, language)} → {formatCardDebt(tx.balanceAfter, tx.currency, language)}
                      </span>
                    </div>

                    {tx.notes && (
                      <div className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        <FileText className="w-3 h-3 shrink-0 opacity-70" strokeWidth={1.65} />
                        <span className="truncate max-w-md">{tx.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-end shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                  <div
                    data-numeric="true"
                    dir="ltr"
                    className={`font-numeric font-black text-base sm:text-lg tabular-nums ${
                      isThey
                        ? isLight
                          ? 'text-emerald-700'
                          : 'text-emerald-300'
                        : isLight
                        ? 'text-rose-700'
                        : 'text-rose-300'
                    }`}
                  >
                    {maskBalances
                      ? '••••••'
                      : formatSignedCardDebt(tx.amountChange, tx.currency, language, tx.loanType)}
                  </div>
                  {showDualCurrency && !maskBalances && tx.amountChange > 0 && (() => {
                    const txDual = resolveRecordDualEquivalent(tx.amountChange, tx.currency, customRates, tx);
                    return (
                      <div
                        data-testid={`tx-dual-${tx.id}`}
                        data-numeric="true"
                        dir="ltr"
                        className={`text-[10px] font-numeric tabular-nums font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        ≈ {isThey ? '+' : '-'}{formatCardDebt(txDual.convertedAmount, txDual.targetCurrency, language)}
                        {txDual.usedRateUsdToIqd > 0 ? ` · @${txDual.usedRateUsdToIqd.toLocaleString('en-US')}` : ''}
                      </div>
                    );
                  })()}
                  <span className={`text-[10px] font-numeric uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isThey ? translations.theyOweMe : translations.iOweThem} · {tx.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
