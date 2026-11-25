import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotals,
  generateReminderMessage,
  cleanPhoneNumber,
  formatCurrency,
  formatCardDebt,
  generateAdvancedAiResponse,
  exportAppDataJson,
  importAppDataJson,
  defaultSettings,
  CURRENCIES,
  exportLoansToCsv,
  BACKGROUND_PRESETS,
  translations,
  computeMonthlyTrends,
  partitionActiveAndArchivedLoans,
  settleAndArchiveLoan,
  restoreArchivedLoan,
  applyPaymentUpdate,
  filterAndSortArchivedLoans,
} from './loanLogic';
import {
  formatPoliteDueMessage,
  formatBorrowerDueMessage,
  formatLenderMaturityMessage,
  formatOverdueFollowUpMessage,
  formatLoanAmountCurrency,
  resolveLoanParties,
} from './notificationService';
import { Loan } from '../types';

test('calculateTotals computes empty loans correctly', () => {
  const totals = calculateTotals([]);
  assert.equal(totals.totalTheyOwe, 0);
  assert.equal(totals.totalIOwe, 0);
  assert.equal(totals.netBalance, 0);
  assert.equal(totals.isMultiCurrency, false);
});

test('calculateTotals handles multi-currency loans and tracks per-currency breakdowns', () => {
  const loans: Loan[] = [
    {
      id: '1',
      personName: 'Ahmed (Baghdad)',
      amount: 1500000,
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-10-01',
    },
    {
      id: '2',
      personName: 'John (New York)',
      amount: 500,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-10-02',
    },
    {
      id: '3',
      personName: 'Pierre (Paris)',
      amount: 200,
      currency: 'EUR',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-10-03',
    },
  ];

  const totalsUsd = calculateTotals(loans, 'USD');
  assert.equal(totalsUsd.activeTheyOweCount, 2);
  assert.equal(totalsUsd.activeIOweCount, 1);
  assert.equal(totalsUsd.isMultiCurrency, true);
  assert.equal(totalsUsd.theyOweByCurrency.IQD, 1500000);
  assert.equal(totalsUsd.theyOweByCurrency.USD, 500);
  assert.equal(totalsUsd.iOweByCurrency.EUR, 200);
  assert.equal(totalsUsd.totalTheyOwe, 500); // Direct per-currency total in USD without FX distortion
  assert.equal(totalsUsd.totalIOwe, 0);

  const totalsIqd = calculateTotals(loans, 'IQD');
  assert.equal(totalsIqd.totalTheyOwe, 1500000);
  assert.equal(totalsIqd.netBalance, 1500000);
});

test('formatCardDebt formats exact debt cleanly without flag emoji clutter', () => {
  const formattedIqd = formatCardDebt(1500000, 'IQD', 'en');
  assert.ok(!formattedIqd.includes('🇮🇶'));
  assert.ok(formattedIqd.includes('1,500,000'));
  assert.ok(formattedIqd.includes('IQD'));

  const formattedUsd = formatCardDebt(1000, 'USD', 'en');
  assert.ok(!formattedUsd.includes('🇺🇸'));
  assert.ok(formattedUsd.includes('$1,000'));
});

test('generateReminderMessage uses the loan recorded currency cleanly without flag clutter', () => {
  const loan: Loan = {
    id: 'rem_1',
    personName: 'Hassan',
    amount: 1500000,
    currency: 'IQD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-10-01',
  };

  const msgEn = generateReminderMessage(loan, 'en', 'formal');
  assert.ok(!msgEn.includes('🇮🇶'));
  assert.ok(msgEn.includes('1,500,000'));
  assert.ok(msgEn.includes('IQD'));

  const msgAr = generateReminderMessage(loan, 'ar', 'friendly');
  assert.ok(!msgAr.includes('🇮🇶'));
  assert.ok(msgAr.includes('Hassan') || msgAr.includes('حسن'));
});

test('CURRENCIES array contains USD, IQD, EUR, TRY, IRR with correct flags', () => {
  const codes = CURRENCIES.map((c) => c.code);
  assert.ok(codes.includes('USD'));
  assert.ok(codes.includes('IQD'));
  assert.ok(codes.includes('EUR'));
  assert.ok(codes.includes('TRY'));
  assert.ok(codes.includes('IRR'));
});

test('generateAdvancedAiResponse produces debt repayment strategies with active balance awareness', () => {
  const loans: Loan[] = [
    {
      id: '1',
      personName: 'Store',
      amount: 250,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-10-01',
    },
  ];

  const resEn = generateAdvancedAiResponse({
    question: 'Suggest a debt payoff strategy for my active loans',
    language: 'en',
    loans,
  });
  assert.ok(resEn.text.includes('Snowball') || resEn.text.includes('debt'));

  const resAr = generateAdvancedAiResponse({
    question: 'اقترح خطة لسداد ديوني',
    language: 'ar',
    loans,
  });
  assert.ok(resAr.text.includes('كرة الثلج') || resAr.text.includes('ديون'));
});

test('generateAdvancedAiResponse handles attached receipts and provides 1-click suggested action', () => {
  const res = generateAdvancedAiResponse({
    question: 'Please log this bill',
    language: 'en',
    attachedFile: {
      name: 'dinner_invoice.pdf',
      type: 'application/pdf',
      base64: 'data:application/pdf;base64,AAAA',
    },
  });

  assert.ok(res.suggestedAction);
  assert.equal(res.suggestedAction?.type, 'add_loan');
  assert.equal(res.suggestedAction?.data.loanType, 'i_owe_them');
});

test('exportAppDataJson and importAppDataJson round-trip accurately', () => {
  const testLoans: Loan[] = [
    {
      id: 'test_1',
      personName: 'Test Person',
      amount: 99,
      currency: 'EUR',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-10-31',
    },
  ];

  const exported = exportAppDataJson(testLoans, defaultSettings);
  const imported = importAppDataJson(exported);

  assert.ok(imported);
  assert.equal(imported?.loans?.length, 1);
  assert.equal(imported?.loans?.[0].personName, 'Test Person');
  assert.equal(imported?.loans?.[0].currency, 'EUR');
  assert.equal(imported?.settings?.currency, 'USD');
});

test('calculateTotals calculates remaining balance directly per currency when loans have partial repayments (paidAmount)', () => {
  const loansWithRepayment: Loan[] = [
    {
      id: 'loan_partial_1',
      personName: 'Mustafa',
      amount: 1515000,
      paidAmount: 757500, // 50% paid back
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-01',
    },
    {
      id: 'loan_partial_2',
      personName: 'Ahmed',
      amount: 1000,
      paidAmount: 250, // 25% paid back
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-01',
    },
  ];

  const totalsUsd = calculateTotals(loansWithRepayment, 'USD');
  assert.equal(totalsUsd.totalTheyOwe, 0);
  assert.equal(totalsUsd.totalIOwe, 750);
  assert.equal(totalsUsd.netBalance, -750);
  assert.equal(totalsUsd.theyOweByCurrency['IQD'], 757500);
  assert.equal(totalsUsd.iOweByCurrency['USD'], 750);

  const totalsIqd = calculateTotals(loansWithRepayment, 'IQD');
  assert.equal(totalsIqd.totalTheyOwe, 757500);
  assert.equal(totalsIqd.totalIOwe, 0);
  assert.equal(totalsIqd.netBalance, 757500);
});

test('formatCurrency formats amount directly in activeCurrency without any FX distortion', () => {
  const iqdFormatted = formatCurrency(1000000, 'en', 'IQD');
  assert.equal(iqdFormatted, '1,000,000 IQD');

  const usdFormatted = formatCurrency(500, 'en', 'USD');
  assert.equal(usdFormatted, '$ 500.00');

  const singleIqdLoan: Loan[] = [
    {
      id: 'iqd_test',
      personName: 'Kareem',
      amount: 1515000,
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-01',
    },
  ];

  const inIQD = calculateTotals(singleIqdLoan, 'IQD');
  assert.equal(inIQD.totalTheyOwe, 1515000);
  assert.equal(formatCurrency(inIQD.totalTheyOwe, 'en', 'IQD'), '1,515,000 IQD');

  const inUSD = calculateTotals(singleIqdLoan, 'USD');
  assert.equal(inUSD.totalTheyOwe, 0);
  assert.equal(inUSD.theyOweByCurrency.IQD, 1515000);
});

test('generateAdvancedAiResponse answers specific person debt queries accurately', () => {
  const sampleLoans: Loan[] = [
    {
      id: 'm1',
      personName: 'Mustafa Al-Iraqi',
      amount: 1500000,
      paidAmount: 500000,
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-10-15',
    },
    {
      id: 'z1',
      personName: 'Zainab',
      amount: 400,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-10-20',
    },
  ];

  // Look up Mustafa in English
  const resMustafaEn = generateAdvancedAiResponse({
    question: 'How much does Mustafa owe me?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resMustafaEn.text.includes('Mustafa Al-Iraqi'));
  assert.ok(resMustafaEn.text.includes('1,000,000') || resMustafaEn.text.includes('Remaining'));

  // Look up Mustafa in Arabic
  const resMustafaAr = generateAdvancedAiResponse({
    question: 'شكد يطلبني مصطفى؟',
    language: 'ar',
    loans: sampleLoans,
  });
  assert.ok(resMustafaAr.text.includes('Mustafa Al-Iraqi') || resMustafaAr.text.includes('مصطفى'));
  assert.ok(resMustafaAr.text.includes('1,000,000') || resMustafaAr.text.includes('المتبقي'));

  // Who owes me query
  const resWhoOwes = generateAdvancedAiResponse({
    question: 'Who owes me money?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resWhoOwes.text.includes('Mustafa Al-Iraqi'));

  // Math query
  const resMath = generateAdvancedAiResponse({
    question: 'What is 25% of 1500000?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resMath.text.includes('375,000') || resMath.text.includes('375000'));

  // Installment plan query
  const resInstallment = generateAdvancedAiResponse({
    question: 'If I pay 200 a month for 1000 debt how long?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resInstallment.text.includes('5') || resInstallment.text.includes('month'));
});

test('formatPoliteDueMessage matches exact required elegant reminder template', () => {
  const message = formatPoliteDueMessage('Tariq', '$250.00');
  assert.equal(
    message,
    'Dear Tariq, this is a friendly reminder that your payment of $250.00 is due today. We appreciate your prompt attention to this matter.'
  );
});

test('exportLoansToCsv produces valid CSV with UTF-8 BOM and correct columns', () => {
  const sampleLoans: Loan[] = [
    {
      id: 'csv_1',
      personName: 'Omar Farooq',
      amount: 1000,
      paidAmount: 200,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      dueDate: '2026-11-10',
      createdAt: '2026-11-01',
      notes: 'Hardware purchase',
    },
  ];

  const csvContent = exportLoansToCsv(sampleLoans, 'en', 'all');
  // Must start with UTF-8 BOM for Excel
  assert.ok(csvContent.startsWith('\uFEFF'));
  assert.ok(csvContent.includes('Omar Farooq'));
  assert.ok(csvContent.includes('USD'));
  assert.ok(csvContent.includes('1000'));
  assert.ok(csvContent.includes('200'));
  assert.ok(csvContent.includes('800'));
  assert.ok(csvContent.includes('Hardware purchase'));
});

test('BACKGROUND_PRESETS contains valid presets and defaultSettings contains theme customization defaults', () => {
  assert.ok(Array.isArray(BACKGROUND_PRESETS));
  assert.ok(BACKGROUND_PRESETS.length >= 6);
  assert.ok(BACKGROUND_PRESETS.some((p: any) => p.id === 'mesh_grid'));
  assert.ok(BACKGROUND_PRESETS.some((p: any) => p.id === 'aurora'));
  assert.ok(BACKGROUND_PRESETS.some((p: any) => p.id === 'emerald_circuit'));

  // defaultSettings checks
  assert.strictEqual(defaultSettings.theme, 'obsidian_neon');
  assert.strictEqual(defaultSettings.customThemeColor, '#10b981');
  assert.strictEqual(defaultSettings.customBgImage, '');
  assert.strictEqual(defaultSettings.bgOpacity, 0.15);
  assert.strictEqual(defaultSettings.bgBlur, 0);

  // translations checks for navigation drawer & customizer
  assert.ok(translations.en.hamburgerMenu);
  assert.ok(translations.ar.hamburgerMenu);
  assert.ok(translations.en.themeSapphire);
  assert.ok(translations.ar.themeSapphire);
  assert.ok(translations.en.bgCustomizerTitle);
  assert.ok(translations.ar.bgCustomizerTitle);
});

test('translations contain required due date and deadline tracking keys', () => {
  // English keys
  assert.ok(translations.en.dueDateRequired);
  assert.ok(translations.en.selectDueDate);
  assert.ok(translations.en.dueToday);
  assert.ok(translations.en.dueInDays);
  assert.ok(translations.en.overdueByDays);
  assert.ok(translations.en.dueSoon);

  // Arabic keys
  assert.ok(translations.ar.dueDateRequired);
  assert.ok(translations.ar.selectDueDate);
  assert.ok(translations.ar.dueToday);
  assert.ok(translations.ar.dueInDays);
  assert.ok(translations.ar.overdueByDays);
  assert.ok(translations.ar.dueSoon);
});

test('handles flexible custom due dates (any year, past or future, with optional time)', () => {
  // 1. Far future date without 30-day constraint
  const futureDueDate = '2035-12-25';
  const [fDateOnly, fTimeOnly] = futureDueDate.split(' ');
  assert.equal(fDateOnly, '2035-12-25');
  assert.equal(fTimeOnly, undefined);

  // 2. Custom date with exact time
  const customDateTime = '2027-06-18 14:30';
  const [dtDateOnly, dtTimeOnly] = customDateTime.split(' ');
  assert.equal(dtDateOnly, '2027-06-18');
  assert.equal(dtTimeOnly, '14:30');

  // Verify display formatting helper
  const dateDisplay = dtTimeOnly ? `${dtDateOnly} (${dtTimeOnly})` : dtDateOnly;
  assert.equal(dateDisplay, '2027-06-18 (14:30)');

  // 3. Past overdue date
  const pastDueDate = '2020-01-01';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(pastDueDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  assert.ok(diffDays < 0, 'Past date should yield negative diffDays (overdue)');
});

test('resolves organic entrance animation classes without legacy glow or spring clutter', () => {
  const getCardAnimationClass = (isNewlyAdded: boolean, isTheyOweMe: boolean) => {
    return isNewlyAdded
      ? isTheyOweMe
        ? 'animate-organic-enter ring-1 ring-emerald-400/50'
        : 'animate-organic-enter ring-1 ring-rose-400/50'
      : '';
  };

  assert.equal(
    getCardAnimationClass(true, true),
    'animate-organic-enter ring-1 ring-emerald-400/50'
  );
  assert.equal(
    getCardAnimationClass(true, false),
    'animate-organic-enter ring-1 ring-rose-400/50'
  );
  assert.equal(getCardAnimationClass(false, true), '');
  assert.equal(getCardAnimationClass(false, false), '');
});

test('computeMonthlyTrends aggregates monthly borrowing, lending and repayments accurately', () => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sampleLoans: Loan[] = [
    {
      id: 'trend_1',
      personName: 'Alice',
      amount: 1000,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: `${currentMonthKey}-02`,
    },
    {
      id: 'trend_2',
      personName: 'Bob',
      amount: 400,
      paidAmount: 100,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: `${currentMonthKey}-05`,
    },
    {
      id: 'trend_3',
      personName: 'Charlie',
      amount: 500,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'settled',
      createdAt: `${currentMonthKey}-01`,
      settledAt: `${currentMonthKey}-04`,
    },
  ];

  const trends = computeMonthlyTrends(sampleLoans, 'USD', 6, 'en');

  assert.equal(trends.data.length, 6);

  const currentBucket = trends.data[trends.data.length - 1];
  assert.equal(currentBucket.monthKey, currentMonthKey);
  assert.equal(currentBucket.lentAmount, 1500);
  assert.equal(currentBucket.borrowedAmount, 400);
  assert.equal(currentBucket.repaidAmount, 600);
  assert.equal(currentBucket.netFlow, 1100);

  assert.equal(trends.summary.totalLent, 1500);
  assert.equal(trends.summary.totalBorrowed, 400);
  assert.equal(trends.summary.totalRepaid, 600);
  assert.equal(trends.summary.netMomentum, 1100);

  const trends12 = computeMonthlyTrends(sampleLoans, 'USD', 12, 'ar');
  assert.equal(trends12.data.length, 12);
  assert.ok(trends12.data[trends12.data.length - 1].shortLabel.length > 0);
});

test('streamlined notification formatters emit clean emoji-free templates', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;

  const usdAmount = formatLoanAmountCurrency(500, 'USD');
  const borrowerNotice = formatBorrowerDueMessage('John', usdAmount, 'Sarah');
  assert.equal(borrowerNotice.title, 'Payment Due Today');
  assert.equal(
    borrowerNotice.body,
    'Hi John, your payment of 500 USD to Sarah is due today.'
  );
  assert.equal(emojiRegex.test(borrowerNotice.fullMessage), false);

  const iqdAmount = formatLoanAmountCurrency(1500000, 'IQD');
  const lenderNotice = formatLenderMaturityMessage('Sarah', 'Ahmed', iqdAmount);
  assert.equal(lenderNotice.title, 'Collection Due Today');
  assert.equal(
    lenderNotice.body,
    "Hi Sarah, Ahmed's payment of 1,500,000 IQD is scheduled for today."
  );
  assert.equal(emojiRegex.test(lenderNotice.fullMessage), false);

  const eurAmount = formatLoanAmountCurrency(750, 'EUR');
  const overdueNotice = formatOverdueFollowUpMessage(eurAmount, 'Sarah', 'John');
  assert.equal(overdueNotice.title, 'Overdue Payment');
  assert.equal(
    overdueNotice.body,
    'The loan of 750 EUR between Sarah and John has passed its due date. Tap to review or settle.'
  );
  assert.equal(emojiRegex.test(overdueNotice.fullMessage), false);
});

test('resolveLoanParties identifies creditor and debtor correctly for both directions', () => {
  const theyOweLoan: Loan = {
    id: 'l1',
    personName: 'Tariq',
    amount: 100,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-01',
  };
  const parties1 = resolveLoanParties(theyOweLoan, 'Sarah');
  assert.equal(parties1.creditorName, 'Sarah');
  assert.equal(parties1.debtorName, 'Tariq');

  const iOweLoan: Loan = {
    id: 'l2',
    personName: 'Mustafa',
    amount: 200,
    currency: 'IQD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-01',
  };
  const parties2 = resolveLoanParties(iOweLoan, 'Sarah');
  assert.equal(parties2.creditorName, 'Mustafa');
  assert.equal(parties2.debtorName, 'Sarah');
});

test('Kurdish Sorani translations exist and cover key financial terms', () => {
  const ku = translations.ku;
  assert.ok(ku);
  assert.equal(ku.appName, 'بودجەی قەرز');
  assert.equal(ku.theyOweMe, 'قەرزەکانم لای ئەوان');
  assert.equal(ku.iOweThem, 'قەرزەکانم');
  assert.equal(ku.filterTheyOwe, 'لای ئەوان');
  assert.equal(ku.filterIOwe, 'قەرزەکانم');
  assert.equal(ku.netPosition, 'پوختەی باڵانس');
  assert.equal(ku.saveLoan, 'پاشەکەوتکردن');
  assert.equal(ku.statusSettled, 'پاکتاوکراو');
  assert.equal(ku.statusActive, 'چالاک');
  assert.equal(ku.overdue, 'دواکەوتوو');
});

test('computeMonthlyTrends uses Kurdish month names when language is ku', () => {
  const trendsKu = computeMonthlyTrends([], 'USD', 3, 'ku');
  assert.equal(trendsKu.data.length, 3);
  for (const pt of trendsKu.data) {
    assert.ok(typeof pt.shortLabel === 'string' && pt.shortLabel.length > 0);
    assert.ok(typeof pt.label === 'string' && pt.label.includes(pt.shortLabel));
  }
});

test('generateReminderMessage generates polite Kurdish Sorani message', () => {
  const loan: Loan = {
    id: 'ku_1',
    personName: 'ئاراس ئەحمەد',
    amount: 250000,
    currency: 'IQD',
    type: 'they_owe_me',
    status: 'active',
    dueDate: '2026-11-20',
    createdAt: '2026-11-01',
  };

  const msg = generateReminderMessage(loan, 'ku', 'formal');
  assert.ok(msg.includes('ئاراس ئەحمەد'));
  assert.ok(msg.includes('250,000 IQD'));
  assert.ok(msg.includes('2026-11-20'));
  assert.ok(msg.includes('بیرخستنەوەیەکی فەرمی'));
});

test('exportLoansToCsv outputs Kurdish headers when language is ku', () => {
  const loan: Loan = {
    id: 'ku_2',
    personName: 'شڤان',
    amount: 50,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-01',
  };

  const csv = exportLoansToCsv([loan], 'ku', 'all');
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('ناسنامە'));
  assert.ok(csv.includes('ناوی کەس'));
  assert.ok(csv.includes('جۆری قەرز'));
  assert.ok(csv.includes('قەرزەکانم لای ئەوان'));
});

test('CURRENCIES includes Kurdish localized names (nameKu)', () => {
  const iqd = CURRENCIES.find((c) => c.code === 'IQD');
  assert.equal(iqd?.nameKu, 'دیناری عێراقی');

  const usd = CURRENCIES.find((c) => c.code === 'USD');
  assert.equal(usd?.nameKu, 'دۆلاری ئەمریکی');

  const eur = CURRENCIES.find((c) => c.code === 'EUR');
  assert.equal(eur?.nameKu, 'یۆرۆی ئەوروپی');
});

test('Turkish (tr) translations exist and cover key financial terms', () => {
  const tr = translations.tr;
  assert.ok(tr);
  assert.equal(tr.appName, 'Kredi Bütçesi');
  assert.equal(tr.theyOweMe, 'Bana Borçlular');
  assert.equal(tr.iOweThem, 'Benim Borcum');
  assert.equal(tr.netPosition, 'Net Mali Durum');
  assert.equal(tr.saveLoan, 'Kaydet');
  assert.equal(tr.statusSettled, 'Ödendi');
  assert.equal(tr.statusActive, 'Aktif');
  assert.equal(tr.overdue, 'Gecikmiş');
});

test('French (fr) translations exist and cover key financial terms', () => {
  const fr = translations.fr;
  assert.ok(fr);
  assert.equal(fr.appName, 'Budget Prêts');
  assert.equal(fr.theyOweMe, 'Ils me doivent');
  assert.equal(fr.iOweThem, 'Je leur dois');
  assert.equal(fr.netPosition, 'Position Nette');
  assert.equal(fr.saveLoan, 'Enregistrer');
  assert.equal(fr.statusSettled, 'Réglé');
  assert.equal(fr.statusActive, 'Actif');
  assert.equal(fr.overdue, 'En retard');
});

test('computeMonthlyTrends uses Turkish and French month names when language is tr or fr', () => {
  const trendsTr = computeMonthlyTrends([], 'USD', 3, 'tr');
  assert.equal(trendsTr.data.length, 3);
  for (const pt of trendsTr.data) {
    assert.ok(typeof pt.shortLabel === 'string' && pt.shortLabel.length > 0);
  }

  const trendsFr = computeMonthlyTrends([], 'EUR', 3, 'fr');
  assert.equal(trendsFr.data.length, 3);
  for (const pt of trendsFr.data) {
    assert.ok(typeof pt.shortLabel === 'string' && pt.shortLabel.length > 0);
  }
});

test('generateReminderMessage generates polite Turkish and French reminders', () => {
  const loanTr: Loan = {
    id: 'tr_1',
    personName: 'Mehmet Yılmaz',
    amount: 1500,
    currency: 'TRY',
    type: 'they_owe_me',
    status: 'active',
    dueDate: '2026-11-25',
    createdAt: '2026-11-01',
  };

  const msgTr = generateReminderMessage(loanTr, 'tr', 'friendly');
  assert.ok(msgTr.includes('Mehmet Yılmaz'));
  assert.ok(msgTr.includes('TRY'));
  assert.ok(msgTr.includes('Selam'));

  const loanFr: Loan = {
    id: 'fr_1',
    personName: 'Jean Dupont',
    amount: 450,
    currency: 'EUR',
    type: 'they_owe_me',
    status: 'active',
    dueDate: '2026-11-28',
    createdAt: '2026-11-01',
  };

  const msgFr = generateReminderMessage(loanFr, 'fr', 'formal');
  assert.ok(msgFr.includes('Jean Dupont'));
  assert.ok(msgFr.includes('EUR'));
  assert.ok(msgFr.includes('Bonjour'));
});

test('exportLoansToCsv outputs Turkish and French headers correctly', () => {
  const sampleLoan: Loan = {
    id: 'exp_1',
    personName: 'Emre',
    amount: 200,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-01',
  };

  const csvTr = exportLoansToCsv([sampleLoan], 'tr', 'all');
  assert.ok(csvTr.startsWith('\uFEFF'));
  assert.ok(csvTr.includes('Kişi Adı'));
  assert.ok(csvTr.includes('Alacak (Bana Borçlular)'));

  const csvFr = exportLoansToCsv([sampleLoan], 'fr', 'all');
  assert.ok(csvFr.startsWith('\uFEFF'));
  assert.ok(csvFr.includes('Nom de la personne'));
  assert.ok(csvFr.includes('Créance (Ils me doivent)'));
});

test('CURRENCIES includes localized names for Turkish (nameTr) and French (nameFr)', () => {
  const tryCurr = CURRENCIES.find((c) => c.code === 'TRY');
  assert.equal(tryCurr?.nameTr, 'Türk Lirası');
  assert.equal(tryCurr?.nameFr, 'Livre turque');

  const eur = CURRENCIES.find((c) => c.code === 'EUR');
  assert.equal(eur?.nameTr, 'Euro');
  assert.equal(eur?.nameFr, 'Euro');

  const usd = CURRENCIES.find((c) => c.code === 'USD');
  assert.equal(usd?.nameTr, 'ABD Doları');
  assert.equal(usd?.nameFr, 'Dollar américain');
});

test('partitionActiveAndArchivedLoans automatically separates settled loans into archive without duplicates', () => {
  const active: Loan = {
    id: 'l_active',
    personName: 'Sara',
    amount: 500,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-01',
  };
  const settledInActive: Loan = {
    id: 'l_settled',
    personName: 'Omar',
    amount: 300,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'settled',
    createdAt: '2026-10-10',
    settledAt: '2026-11-10',
  };
  const existingArchived: Loan = {
    id: 'l_settled',
    personName: 'Omar',
    amount: 300,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'settled',
    createdAt: '2026-10-10',
    settledAt: '2026-11-10',
  };

  const { activeLoans, archivedLoans } = partitionActiveAndArchivedLoans(
    [active, settledInActive],
    [existingArchived],
    '2026-11-15'
  );
  assert.equal(activeLoans.length, 1);
  assert.equal(activeLoans[0].id, 'l_active');
  assert.equal(archivedLoans.length, 1);
  assert.equal(archivedLoans[0].paidAmount, 300);
});

test('applyPaymentUpdate clamps payments, triggers archive on full payoff, and preserves partial payments', () => {
  const loan: Loan = {
    id: 'pay_1',
    personName: 'Zara',
    amount: 500,
    paidAmount: 0,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-01',
  };

  const partial = applyPaymentUpdate(loan, { paidAmount: 200 }, '2026-11-15');
  assert.equal(partial.shouldArchive, false);
  assert.equal(partial.updatedLoan.status, 'active');
  assert.equal(partial.updatedLoan.paidAmount, 200);

  const full = applyPaymentUpdate(partial.updatedLoan, { paidAmount: 600 }, '2026-11-15');
  assert.equal(full.shouldArchive, true);
  assert.equal(full.updatedLoan.status, 'settled');
  assert.equal(full.updatedLoan.paidAmount, 500);
  assert.equal(full.updatedLoan.settledAt, '2026-11-15');

  const restored = restoreArchivedLoan(full.updatedLoan);
  assert.equal(restored.status, 'active');
  assert.equal(restored.paidAmount, 0);
  assert.equal(restored.settledAt, undefined);
});

test('filterAndSortArchivedLoans filters by query, type, and date range and sorts accurately', () => {
  const records: Loan[] = [
    {
      id: 'a1',
      personName: 'Alice',
      amount: 200,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'settled',
      createdAt: '2026-10-01',
      settledAt: '2026-10-15',
      notes: 'Coffee shop invoice',
    },
    {
      id: 'a2',
      personName: 'Bilal',
      amount: 1200,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'settled',
      createdAt: '2026-11-01',
      settledAt: '2026-11-12',
    },
    {
      id: 'a3',
      personName: 'Dara',
      amount: 600,
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'settled',
      createdAt: '2026-11-02',
      settledAt: '2026-11-05',
    },
  ];

  const byDateDesc = filterAndSortArchivedLoans(records, { sortBy: 'settled_desc' });
  assert.deepEqual(byDateDesc.map((r) => r.id), ['a2', 'a3', 'a1']);

  const byDateRange = filterAndSortArchivedLoans(records, {
    dateFrom: '2026-11-01',
    dateTo: '2026-11-10',
  });
  assert.deepEqual(byDateRange.map((r) => r.id), ['a3']);

  const byTypeAndQuery = filterAndSortArchivedLoans(records, {
    type: 'they_owe_me',
    query: 'invoice',
  });
  assert.deepEqual(byTypeAndQuery.map((r) => r.id), ['a1']);

  const byAmount = filterAndSortArchivedLoans(records, { sortBy: 'amount_desc' });
  assert.deepEqual(byAmount.map((r) => r.id), ['a2', 'a3', 'a1']);
});

test('mergeLocalAndCloudLoans merges guest loans into cloud without duplicates and preserves canonical cloud state', async () => {
  const { mergeLocalAndCloudLoans } = await import('./loanLogic');
  const localActive: Loan[] = [
    { id: 'local_only', personName: 'Nadia', amount: 120, currency: 'USD', type: 'they_owe_me', status: 'active', createdAt: '2026-11-10' },
    { id: 'shared_1', personName: 'Karim Old', amount: 500, currency: 'USD', type: 'i_owe_them', status: 'active', createdAt: '2026-11-01' },
  ];
  const localArchived: Loan[] = [
    { id: 'local_arch', personName: 'Zayd', amount: 350, currency: 'USD', type: 'they_owe_me', status: 'settled', createdAt: '2026-11-05', settledAt: '2026-11-14' },
  ];
  const cloudLoans: Loan[] = [
    { id: 'shared_1', personName: 'Karim Cloud Updated', amount: 500, paidAmount: 250, currency: 'USD', type: 'i_owe_them', status: 'active', createdAt: '2026-11-01' },
    { id: 'cloud_arch', personName: 'Hana', amount: 800, paidAmount: 800, currency: 'EUR', type: 'they_owe_me', status: 'settled', createdAt: '2026-10-01', settledAt: '2026-10-20' },
  ];

  const merged = mergeLocalAndCloudLoans(localActive, localArchived, cloudLoans, '2026-11-15');
  assert.deepEqual(merged.toUpload.map((l) => l.id).sort(), ['local_arch', 'local_only']);
  assert.equal(merged.activeLoans.length, 2);
  assert.equal(merged.archivedLoans.length, 2);
  const shared = merged.activeLoans.find((l) => l.id === 'shared_1');
  assert.equal(shared?.personName, 'Karim Cloud Updated');
  assert.equal(shared?.paidAmount, 250);
});

test('buildDueDateBannerState formats exact due-today count and text across languages', async () => {
  const { buildDueDateBannerState } = await import('./loanLogic');
  const sample: Loan[] = [
    { id: 'd1', personName: 'Ari', amount: 100, type: 'they_owe_me', status: 'active', dueDate: '2026-11-15', createdAt: '2026-11-01' },
    { id: 'd2', personName: 'Dina', amount: 250, type: 'i_owe_them', status: 'active', dueDate: '2026-11-15', createdAt: '2026-11-02' },
    { id: 'd3', personName: 'Settled One', amount: 90, type: 'they_owe_me', status: 'settled', dueDate: '2026-11-15', createdAt: '2026-11-02' },
    { id: 'd4', personName: 'Future One', amount: 90, type: 'they_owe_me', status: 'active', dueDate: '2026-11-20', createdAt: '2026-11-02' },
  ];

  const enBanner = buildDueDateBannerState(sample, 'en', '2026-11-15');
  assert.equal(enBanner.hasDueToday, true);
  assert.equal(enBanner.dueCount, 2);
  assert.equal(enBanner.headline, 'Payment Due Today: 2 deadline(s) require attention!');
  assert.equal(enBanner.peopleSummary, 'Ari, Dina');

  const emptyBanner = buildDueDateBannerState([sample[2], sample[3]], 'en', '2026-11-15');
  assert.equal(emptyBanner.hasDueToday, false);
  assert.equal(emptyBanner.dueCount, 0);
});

test('LANGUAGE_OPTIONS uses requested country flags, preserves Kurdish KD, and selects IBM Plex Sans family per language', async () => {
  const { LANGUAGE_OPTIONS, getFontFamilyForLanguage, normalizeThemeMode } = await import('./loanLogic');
  const byCode = new Map(LANGUAGE_OPTIONS.map((o) => [o.code, o]));

  assert.equal(byCode.get('en')?.shortCode, 'EN');
  assert.equal(byCode.get('en')?.flag, '🇺🇸');

  assert.equal(byCode.get('ar')?.flag, '🇸🇦');

  assert.equal(byCode.get('tr')?.shortCode, 'TR');
  assert.equal(byCode.get('tr')?.flag, '🇹🇷');

  assert.equal(byCode.get('fr')?.shortCode, 'FR');
  assert.equal(byCode.get('fr')?.flag, '🇫🇷');

  // Kurdish KD strictly preserved
  assert.equal(byCode.get('ku')?.shortCode, 'KD');
  assert.equal(byCode.get('ku')?.flag, '☀️');
  assert.equal(byCode.get('ku')?.nativeName, 'کوردی');
  assert.equal(byCode.get('ku')?.isRtl, true);

  assert.equal(getFontFamilyForLanguage('en'), 'IBM Plex Sans');
  assert.equal(getFontFamilyForLanguage('fr'), 'IBM Plex Sans');
  assert.equal(getFontFamilyForLanguage('tr'), 'IBM Plex Sans');
  assert.equal(getFontFamilyForLanguage('ar'), 'IBM Plex Sans Arabic');
  assert.equal(getFontFamilyForLanguage('ku'), 'IBM Plex Sans Arabic');

  assert.equal(normalizeThemeMode('obsidian_neon'), 'obsidian_neon');
  assert.equal(normalizeThemeMode('midnight_gold'), 'midnight_gold');
  assert.equal(normalizeThemeMode('sapphire'), 'midnight_gold');
  assert.equal(normalizeThemeMode('dark'), 'obsidian_neon');
});

test('detectPromptLanguage and generateAdvancedAiResponse reply in user prompt language across EN, AR, KU, TR, FR', async () => {
  const { detectPromptLanguage } = await import('./loanLogic');
  const sampleLoans: Loan[] = [
    {
      id: 'ai_1',
      personName: 'Mustafa',
      amount: 500,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-10',
    },
    {
      id: 'ai_2',
      personName: 'Zara',
      amount: 200,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-12',
    },
  ];

  // Kurdish prompt while UI is English
  assert.equal(detectPromptLanguage('سڵاو کێ قەرزداری منە؟', 'en'), 'ku');
  const resKu = generateAdvancedAiResponse({
    question: 'سڵاو',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(/[ێۆڕڵڤگچژپکە]/.test(resKu.text));

  // Turkish prompt while UI is English
  assert.equal(detectPromptLanguage('Merhaba, net bakiyem nedir?', 'en'), 'tr');
  const resTr = generateAdvancedAiResponse({
    question: 'Merhaba, kim bana borçlu?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resTr.text.includes('Mustafa') || resTr.text.toLowerCase().includes('borç'));

  // French prompt while UI is English
  assert.equal(detectPromptLanguage('Bonjour, combien je dois ?', 'en'), 'fr');
  const resFr = generateAdvancedAiResponse({
    question: 'Bonjour, combien je dois ?',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(resFr.text.includes('Zara') || resFr.text.toLowerCase().includes('solde') || resFr.text.toLowerCase().includes('devez'));

  // Arabic prompt while UI is English
  assert.equal(detectPromptLanguage('مرحبا، كم مجموع ديوني؟', 'en'), 'ar');
  const resAr = generateAdvancedAiResponse({
    question: 'مرحبا، من يطلبني؟',
    language: 'en',
    loans: sampleLoans,
  });
  assert.ok(/[\u0600-\u06FF]/.test(resAr.text));
});

test('Visa and Mastercard detection, validation, and settlement helpers work accurately', async () => {
  const { detectCardBrand, formatCardNumber, formatCardExpiry, validateMockCardPayment, settleLoanByCardPayment } =
    await import('./loanLogic');

  assert.equal(detectCardBrand('4111 1111 1111 1111'), 'visa');
  assert.equal(detectCardBrand('5500 0000 0000 0004'), 'mastercard');
  assert.equal(detectCardBrand('2225 0000 0000 0001'), 'mastercard');
  assert.equal(detectCardBrand('378282246310005'), 'unknown');

  assert.equal(formatCardNumber('4111111111111111'), '4111 1111 1111 1111');
  assert.equal(formatCardExpiry('1228'), '12/28');

  const refDate = new Date('2026-11-15');
  const invalidHolder = validateMockCardPayment(
    { cardholderName: '', cardNumber: '4111111111111111', expiry: '12/28', cvv: '123' },
    refDate
  );
  assert.equal(invalidHolder.valid, false);
  assert.equal(invalidHolder.errorField, 'cardholderName');

  const expiredCard = validateMockCardPayment(
    { cardholderName: 'Tariq Ali', cardNumber: '4111111111111111', expiry: '01/25', cvv: '123' },
    refDate
  );
  assert.equal(expiredCard.valid, false);
  assert.equal(expiredCard.errorField, 'expiry');

  const validVisa = validateMockCardPayment(
    { cardholderName: 'Tariq Ali', cardNumber: '4111 1111 1111 1111', expiry: '12/28', cvv: '123' },
    refDate
  );
  assert.equal(validVisa.valid, true);
  assert.equal(validVisa.brand, 'visa');
  assert.equal(validVisa.last4, '1111');

  const sampleLoan: Loan = {
    id: 'card_loan_1',
    personName: 'Tariq Ali',
    amount: 350,
    paidAmount: 50,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-01',
    notes: 'Laptop repair',
  };

  const settled = settleLoanByCardPayment(
    sampleLoan,
    { brand: 'visa', last4: '1111', cardholderName: 'Tariq Ali' },
    '2026-11-15'
  );
  assert.equal(settled.status, 'settled');
  assert.equal(settled.paidAmount, 350);
  assert.equal(settled.settledAt, '2026-11-15');
  assert.ok(settled.notes?.includes('Paid $300.00 via Visa •••• 1111'));
});

test('4 dark curated theme modes normalize properly and exclude Minimal Light', async () => {
  const { normalizeThemeMode, isLightThemeMode } = await import('./loanLogic');

  assert.equal(normalizeThemeMode('obsidian_neon'), 'obsidian_neon');
  assert.equal(normalizeThemeMode('midnight_gold'), 'midnight_gold');
  assert.equal(normalizeThemeMode('light'), 'obsidian_neon');
  assert.equal(normalizeThemeMode('nordic_frost'), 'nordic_frost');
  assert.equal(normalizeThemeMode('velvet_pink'), 'velvet_pink');
  assert.equal(normalizeThemeMode('emerald'), 'obsidian_neon');
  assert.equal(normalizeThemeMode('amethyst'), 'obsidian_neon');
  assert.equal(normalizeThemeMode(undefined), 'obsidian_neon');

  assert.equal(isLightThemeMode('obsidian_neon'), false);
  assert.equal(isLightThemeMode('midnight_gold'), false);
  assert.equal(isLightThemeMode('velvet_pink'), false);
  assert.equal(isLightThemeMode('light'), false);
  assert.equal(isLightThemeMode('nordic_frost'), false);
});

test('signed currency & card formatters prefix + for receivables and - for payables', async () => {
  const { getLoanDirectionSign, formatSignedCurrency, formatSignedCardDebt } = await import('./loanLogic');

  assert.equal(getLoanDirectionSign('they_owe_me'), '+');
  assert.equal(getLoanDirectionSign('i_owe_them'), '-');

  const signedUsdPlus = formatSignedCurrency(250, 'en', 'USD', 'they_owe_me');
  const signedUsdMinus = formatSignedCurrency(150, 'en', 'USD', 'i_owe_them');
  assert.ok(signedUsdPlus.startsWith('+ '));
  assert.ok(signedUsdPlus.includes('250'));
  assert.ok(signedUsdMinus.startsWith('- '));
  assert.ok(signedUsdMinus.includes('150'));

  const cardPlus = formatSignedCardDebt(325.5, 'USD', 'en', 'they_owe_me');
  const cardMinus = formatSignedCardDebt(89.25, 'EUR', 'en', 'i_owe_them');
  assert.ok(cardPlus.startsWith('+'));
  assert.ok(cardPlus.includes('325.50'));
  assert.ok(cardMinus.startsWith('-'));
  assert.ok(cardMinus.includes('89.25'));
});

test('transaction ledger helpers track creation, repayments, added money, settlements, merges, filtering, summaries & backup roundtrip', async () => {
  const {
    getRemainingLoanBalance,
    formatTransactionTimestamp,
    createTransactionEntry,
    deriveUpdateTransaction,
    mergeLocalAndCloudTransactions,
    filterTransactions,
    summarizeTransactions,
  } = await import('./loanLogic');

  const baseLoan: Loan = {
    id: 'tx_loan_1',
    personName: 'Layla',
    amount: 400,
    paidAmount: 100,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-10',
  };
  assert.equal(getRemainingLoanBalance(baseLoan), 300);

  const ts = formatTransactionTimestamp('2026-11-16T09:05:07.123Z');
  assert.match(ts, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

  const t0 = new Date('2026-11-16T10:00:00.000Z');
  const createdTx = createTransactionEntry({
    loan: baseLoan,
    action: 'created',
    amountChange: 400,
    balanceBefore: 0,
    balanceAfter: 400,
    now: t0,
    id: 'tx_created_1',
  });
  assert.equal(createdTx.action, 'created');
  assert.equal(createdTx.amountChange, 400);
  assert.equal(createdTx.balanceBefore, 0);
  assert.equal(createdTx.balanceAfter, 400);

  // Added money increases principal without increasing paidAmount
  const addedMoneyLoan: Loan = { ...baseLoan, amount: 550 };
  const addedTx = deriveUpdateTransaction(baseLoan, addedMoneyLoan, undefined, new Date('2026-11-16T11:00:00.000Z'));
  assert.equal(addedTx.action, 'added_money');
  assert.equal(addedTx.amountChange, 150);
  assert.equal(addedTx.balanceBefore, 300);
  assert.equal(addedTx.balanceAfter, 450);

  // Partial repayment increases paidAmount
  const repaidLoan: Loan = { ...addedMoneyLoan, paidAmount: 250 };
  const repaidTx = deriveUpdateTransaction(addedMoneyLoan, repaidLoan, undefined, new Date('2026-11-16T12:00:00.000Z'));
  assert.equal(repaidTx.action, 'repayment');
  assert.equal(repaidTx.amountChange, 150);
  assert.equal(repaidTx.balanceBefore, 450);
  assert.equal(repaidTx.balanceAfter, 300);

  // Full settlement transitions status active -> settled
  const settledLoan: Loan = { ...repaidLoan, paidAmount: 550, status: 'settled', settledAt: '2026-11-16' };
  const settledTx = deriveUpdateTransaction(repaidLoan, settledLoan, undefined, new Date('2026-11-16T13:00:00.000Z'));
  assert.equal(settledTx.action, 'settled');
  assert.equal(settledTx.amountChange, 300);
  assert.equal(settledTx.balanceBefore, 300);
  assert.equal(settledTx.balanceAfter, 0);

  // Restore transitions status settled -> active
  const restoredLoan: Loan = { ...settledLoan, paidAmount: 0, status: 'active', settledAt: undefined };
  const restoredTx = deriveUpdateTransaction(settledLoan, restoredLoan, undefined, new Date('2026-11-16T14:00:00.000Z'));
  assert.equal(restoredTx.action, 'restored');
  assert.equal(restoredTx.balanceBefore, 0);
  assert.equal(restoredTx.balanceAfter, 550);

  // Payable transaction for summary/filter checks
  const payableTx = createTransactionEntry({
    loan: {
      id: 'tx_loan_2',
      personName: 'Omar',
      amount: 200,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-16',
    },
    action: 'created',
    amountChange: 200,
    balanceBefore: 0,
    balanceAfter: 200,
    now: new Date('2026-11-16T15:00:00.000Z'),
    id: 'tx_payable_1',
  });

  const merged = mergeLocalAndCloudTransactions([createdTx, payableTx], [createdTx, repaidTx]);
  assert.deepEqual(merged.toUpload.map((t) => t.id), ['tx_payable_1']);
  assert.equal(merged.mergedTransactions.length, 3);
  assert.equal(merged.mergedTransactions[0].id, 'tx_payable_1');

  const onlyPayables = filterTransactions([createdTx, repaidTx, payableTx], { type: 'i_owe_them' });
  assert.deepEqual(onlyPayables.map((t) => t.id), ['tx_payable_1']);

  const searchRepayment = filterTransactions([createdTx, repaidTx, payableTx], { query: 'repayment' });
  assert.deepEqual(searchRepayment.map((t) => t.id), [repaidTx.id]);

  const summary = summarizeTransactions([createdTx, repaidTx, payableTx], 'USD');
  assert.equal(summary.totalReceivableVolume, 550);
  assert.equal(summary.totalPayableVolume, 200);
  assert.equal(summary.receivableEvents, 2);
  assert.equal(summary.payableEvents, 1);
  assert.equal(summary.totalCount, 3);

  // Export & re-import includes transactions cleanly
  const backupJson = exportAppDataJson([baseLoan], defaultSettings, [createdTx, payableTx]);
  const parsed = importAppDataJson(backupJson);
  assert.ok(parsed);
  assert.equal(parsed?.transactions?.length, 2);
  assert.equal(parsed?.transactions?.[0].id, 'tx_created_1');
});

test('Ai Budget natural-language ledger command parser updates balances automatically and archives on full payoff', async () => {
  const { parseNaturalLanguageLedgerCommand, generateAdvancedAiResponse } = await import('./loanLogic');
  const activeLoans: Loan[] = [
    {
      id: 'ali_iqd',
      personName: 'Ali',
      amount: 125000,
      paidAmount: 0,
      currency: 'IQD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-01',
    },
    {
      id: 'omar_usd',
      personName: 'Omar',
      amount: 100,
      paidAmount: 0,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-02',
    },
  ];

  // Partial repayment in same currency ("Ali gave me 50,000 IQD today toward his debt")
  const cmd1 = parseNaturalLanguageLedgerCommand(
    'Ali gave me 50,000 IQD today toward his debt',
    activeLoans,
    'en',
    'IQD',
    '2026-11-16'
  );
  assert.ok(cmd1);
  assert.equal(cmd1?.actionType, 'repayment');
  assert.equal(cmd1?.targetLoan.id, 'ali_iqd');
  assert.equal(cmd1?.balanceBefore, 125000);
  assert.equal(cmd1?.balanceAfter, 75000);
  assert.equal(cmd1?.shouldArchive, false);

  // Add money command ("Lent Ali 25,000 IQD more")
  const cmdAdd = parseNaturalLanguageLedgerCommand(
    'Lent Ali 25,000 IQD more',
    [cmd1!.updatedLoan, activeLoans[1]],
    'en',
    'IQD',
    '2026-11-16'
  );
  assert.ok(cmdAdd);
  assert.equal(cmdAdd?.actionType, 'added_money');
  assert.equal(cmdAdd?.updatedLoan.amount, 150000);
  assert.equal(cmdAdd?.balanceAfter, 100000);

  // Full payoff on Omar triggers auto-archive
  const cmdFull = parseNaturalLanguageLedgerCommand(
    'I paid Omar $100 back',
    activeLoans,
    'en',
    'USD',
    '2026-11-16'
  );
  assert.ok(cmdFull);
  assert.equal(cmdFull?.actionType, 'repayment');
  assert.equal(cmdFull?.targetLoan.id, 'omar_usd');
  assert.equal(cmdFull?.shouldArchive, true);
  assert.equal(cmdFull?.balanceAfter, 0);

  // generateAdvancedAiResponse returns ledgerCommand instead of a duplicate add_loan suggestion
  const aiRes = generateAdvancedAiResponse({
    question: 'Ali gave me 50,000 IQD today toward his debt',
    language: 'en',
    loans: activeLoans,
    activeCurrency: 'IQD',
  });
  assert.ok(aiRes.ledgerCommand);
  assert.equal(aiRes.suggestedAction, undefined);
  assert.ok(aiRes.text.includes('75,000 IQD'));
  assert.equal(/\p{Extended_Pictographic}/u.test(aiRes.text), false);
});

test('analyzePortfolioIntelligence and Ai Budget prioritization & multi-currency cash flow insights work cleanly without emojis', async () => {
  const { analyzePortfolioIntelligence } = await import('./loanLogic');
  const portfolio: Loan[] = [
    {
      id: 'p1',
      personName: 'Zara',
      amount: 100,
      paidAmount: 0,
      currency: 'USD',
      type: 'i_owe_them',
      dueDate: '2026-11-10', // overdue relative to 2026-11-16
      status: 'active',
      createdAt: '2026-10-20',
    },
    {
      id: 'p2',
      personName: 'Bilal',
      amount: 500,
      paidAmount: 0,
      currency: 'EUR',
      type: 'i_owe_them',
      dueDate: '2026-11-16', // due today
      status: 'active',
      createdAt: '2026-11-01',
    },
    {
      id: 'r1',
      personName: 'Karim',
      amount: 148500,
      paidAmount: 0,
      currency: 'IQD',
      type: 'they_owe_me',
      dueDate: '2026-11-18', // within 3 days
      status: 'active',
      createdAt: '2026-11-01',
    },
  ];

  const intel = analyzePortfolioIntelligence(portfolio, 'USD', '2026-11-16');
  assert.equal(intel.overdueLoans.length, 1);
  assert.equal(intel.dueTodayLoans.length, 1);
  assert.equal(intel.upcomingSoonLoans.length, 1);
  assert.equal(intel.payablesAvalanche[0].personName, 'Zara'); // overdue highest urgency
  assert.equal(intel.payablesSnowball[0].personName, 'Zara'); // smaller USD balance
  assert.equal(intel.currencyBreakdown.length, 3);

  const priorityEn = generateAdvancedAiResponse({
    question: 'Prioritize my overdue and active debts',
    language: 'ku', // even if UI is Kurdish, reply stays English
    loans: portfolio,
    activeCurrency: 'USD',
  });
  assert.ok(priorityEn.text.includes('Zara'));
  assert.ok(priorityEn.text.includes('Karim'));
  assert.equal(/\p{Extended_Pictographic}/u.test(priorityEn.text), false);

  const cashFlowTr = generateAdvancedAiResponse({
    question: 'Nakit akışı ve portföy özeti nedir?',
    language: 'en', // UI English, prompt Turkish -> reply Turkish
    loans: portfolio,
    activeCurrency: 'TRY',
  });
  assert.ok(cashFlowTr.text.includes('Nakit Akışı') || cashFlowTr.text.includes('Para Birimi'));
  assert.equal(/\p{Extended_Pictographic}/u.test(cashFlowTr.text), false);
});

test('validateProfileUsername, sanitizeProfileSettingsPatch, and calculateAvatarCropRect enforce profile rules cleanly', async () => {
  const {
    validateProfileUsername,
    sanitizeProfileSettingsPatch,
    calculateAvatarCropRect,
  } = await import('./loanLogic');

  assert.deepEqual(validateProfileUsername('   '), { valid: true, normalized: '' });
  assert.deepEqual(validateProfileUsername('user123'), { valid: true, normalized: 'user123' });
  assert.deepEqual(validateProfileUsername('@lanya_2026'), { valid: true, normalized: 'lanya_2026' });

  assert.equal(validateProfileUsername('ab').valid, false);
  assert.equal(validateProfileUsername('ab').reason, 'too_short');
  assert.equal(validateProfileUsername('bad-handle!').valid, false);
  assert.equal(validateProfileUsername('bad-handle!').reason, 'invalid_chars');
  assert.equal(validateProfileUsername('a'.repeat(33)).valid, false);
  assert.equal(validateProfileUsername('a'.repeat(33)).reason, 'too_long');

  const patch = sanitizeProfileSettingsPatch({
    profileName: '  Lanya Ahmed  ',
    profileUsername: '@lanya_2026!!',
    profileBio: '  ' + 'x'.repeat(350) + '  ',
    profileAvatar: 'data:image/jpeg;base64,/9j/test',
    profileJoinedAt: '2026-11-17',
  });
  assert.equal(patch.profileName, 'Lanya Ahmed');
  assert.equal(patch.profileUsername, 'lanya_2026');
  assert.equal(patch.profileBio?.length, 300);
  assert.equal(patch.profileAvatar, 'data:image/jpeg;base64,/9j/test');
  assert.equal(patch.profileJoinedAt, '2026-11-17');

  const rect1 = calculateAvatarCropRect(1200, 800, 1, 0, 0);
  assert.equal(rect1.sSize, 800);
  assert.equal(rect1.sx, 200);
  assert.equal(rect1.sy, 0);

  const rectZoomPan = calculateAvatarCropRect(1200, 800, 2, -2, 2);
  assert.equal(rectZoomPan.sSize, 400);
  assert.ok(rectZoomPan.sx >= 0 && rectZoomPan.sx + rectZoomPan.sSize <= 1200);
  assert.ok(rectZoomPan.sy >= 0 && rectZoomPan.sy + rectZoomPan.sSize <= 800);
});

test('addInAppNotification deduplicates alerts by (loanId, type) within the same day', async () => {
  const { addInAppNotification, getInAppNotifications, clearAllNotifications } = await import('./notificationService');
  const store = new Map<string, string>();
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
  (globalThis as any).window = { dispatchEvent: () => true };

  try {
    clearAllNotifications();
    const first = addInAppNotification({
      loanId: 'loan_dedupe_1',
      type: 'borrower_due',
      title: 'Payment Due Today',
      body: 'Due today',
      fullMessage: 'Payment Due Today: Due today',
      creditorName: 'Sarah',
      debtorName: 'You',
      amount: 100,
      currency: 'USD',
      dueDate: '2026-11-17',
    });
    const duplicate = addInAppNotification({
      loanId: 'loan_dedupe_1',
      type: 'borrower_due',
      title: 'Payment Due Today',
      body: 'Due today again',
      fullMessage: 'Payment Due Today: Due today again',
      creditorName: 'Sarah',
      debtorName: 'You',
      amount: 100,
      currency: 'USD',
      dueDate: '2026-11-17',
    });
    assert.equal(first.id, duplicate.id);
    assert.equal(getInAppNotifications().length, 1);

    // Different alert type (overdue_followup) for same loan is allowed once
    const overdue = addInAppNotification({
      loanId: 'loan_dedupe_1',
      type: 'overdue_followup',
      title: 'Overdue Payment',
      body: 'Overdue',
      fullMessage: 'Overdue Payment: Overdue',
      creditorName: 'Sarah',
      debtorName: 'You',
      amount: 100,
      currency: 'USD',
      dueDate: '2026-11-17',
    });
    assert.notEqual(overdue.id, first.id);
    assert.equal(getInAppNotifications().length, 2);
  } finally {
    if (prevWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = prevWindow;
    if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
    else (globalThis as any).localStorage = prevLocalStorage;
  }
});

test('Friends Directory & Chat helpers normalize @handles, generate symmetric chat IDs, validate messages, and filter friends', async () => {
  const {
    normalizeUsernameHandle,
    buildDirectChatId,
    validateFriendChatMessageText,
    formatLoanChatReferenceSummary,
    filterFriendsByQuery,
  } = await import('./loanLogic');

  // 1. Handle normalization
  assert.equal(normalizeUsernameHandle('  @Lanya_2026 '), 'lanya_2026');
  assert.equal(normalizeUsernameHandle('User_01'), 'user_01');
  assert.equal(normalizeUsernameHandle('ab'), '');
  assert.equal(normalizeUsernameHandle('bad handle!'), '');

  // 2. Symmetric 1-to-1 chat ID
  const chat1 = buildDirectChatId('uid_beta', 'uid_alpha');
  const chat2 = buildDirectChatId('uid_alpha', 'uid_beta');
  assert.equal(chat1, 'uid_alpha_uid_beta');
  assert.equal(chat1, chat2);
  assert.equal(buildDirectChatId('uid_same', 'uid_same'), '');

  // 3. Message validation
  assert.equal(validateFriendChatMessageText('   ').valid, false);
  const validMsg = validateFriendChatMessageText('  Sent $150 repayment!  ');
  assert.equal(validMsg.valid, true);
  assert.equal(validMsg.cleaned, 'Sent $150 repayment!');

  // 4. Loan reference summary
  const loanSummary = formatLoanChatReferenceSummary(
    {
      id: 'l_ref_1',
      personName: 'Zara',
      amount: 200,
      paidAmount: 50,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-16',
    },
    'en'
  );
  assert.ok(loanSummary.includes('Zara'));
  assert.ok(loanSummary.includes('+'));
  assert.ok(loanSummary.includes('150.00'));
  assert.ok(loanSummary.includes('Active'));

  // 5. Friends filtering
  const friends = [
    { ownerId: 'me', friendUid: 'u1', username: 'lanya_2026', displayName: 'Lanya K.', bio: 'Business partner' },
    { ownerId: 'me', friendUid: 'u2', username: 'tariq_ali', displayName: 'Tariq', bio: 'Design' },
  ];
  assert.equal(filterFriendsByQuery(friends, '@lanya').length, 1);
  assert.equal(filterFriendsByQuery(friends, 'tariq')[0].friendUid, 'u2');
  assert.equal(filterFriendsByQuery(friends, '').length, 2);
});

test('checkUsernameChangeEligibility enforces strict 7-day cooldown, allows non-username edits, and resets timestamp on valid change', async () => {
  const {
    USERNAME_CHANGE_COOLDOWN_MS,
    checkUsernameChangeEligibility,
    formatUsernameCooldownDate,
    sanitizeProfileSettingsPatch,
  } = await import('./loanLogic');

  const t0 = Date.parse('2026-11-18T10:00:00.000Z');

  // 1. First-time username creation succeeds and records lastUsernameChangeDate
  const firstClaim = checkUsernameChangeEligibility({
    currentUsername: '',
    nextUsername: 'lanya_2026',
    lastUsernameChangeDate: '',
    nowMs: t0,
  });
  assert.equal(firstClaim.allowed, true);
  assert.equal(firstClaim.changed, true);
  assert.equal(firstClaim.nextChangeDateIso, '2026-11-18T10:00:00.000Z');

  // 2. Editing profile fields WITHOUT changing username succeeds even during active 7-day cooldown
  const unchangedDuringCooldown = checkUsernameChangeEligibility({
    currentUsername: 'lanya_2026',
    nextUsername: '@LANYA_2026',
    lastUsernameChangeDate: firstClaim.nextChangeDateIso,
    nowMs: t0 + 60_000,
  });
  assert.equal(unchangedDuringCooldown.allowed, true);
  assert.equal(unchangedDuringCooldown.changed, false);
  assert.equal(unchangedDuringCooldown.nextChangeDateIso, firstClaim.nextChangeDateIso);

  // 3. Changing username within 7 days (e.g. 6 days 23 hours later) is blocked and returns exact unlock time
  const blockedAt6Days = checkUsernameChangeEligibility({
    currentUsername: 'lanya_2026',
    nextUsername: 'lanya_new',
    lastUsernameChangeDate: firstClaim.nextChangeDateIso,
    nowMs: t0 + USERNAME_CHANGE_COOLDOWN_MS - 3600_000,
  });
  assert.equal(blockedAt6Days.allowed, false);
  assert.equal(blockedAt6Days.changed, true);
  assert.equal(blockedAt6Days.availableAtMs, t0 + USERNAME_CHANGE_COOLDOWN_MS);
  assert.equal(blockedAt6Days.availableAtIso, '2026-11-25T10:00:00.000Z');
  assert.ok(formatUsernameCooldownDate(blockedAt6Days.availableAtIso!, 'en').includes('2026'));

  // 4. Changing username at >= 7 days is allowed and resets lastUsernameChangeDate
  const tAfter7Days = t0 + USERNAME_CHANGE_COOLDOWN_MS;
  const allowedAfter7Days = checkUsernameChangeEligibility({
    currentUsername: 'lanya_2026',
    nextUsername: 'lanya_new',
    lastUsernameChangeDate: firstClaim.nextChangeDateIso,
    nowMs: tAfter7Days,
  });
  assert.equal(allowedAfter7Days.allowed, true);
  assert.equal(allowedAfter7Days.changed, true);
  assert.equal(allowedAfter7Days.nextChangeDateIso, '2026-11-25T10:00:00.000Z');

  const patch = sanitizeProfileSettingsPatch({
    profileUsername: 'lanya_new',
    lastUsernameChangeDate: allowedAfter7Days.nextChangeDateIso,
  });
  assert.equal(patch.lastUsernameChangeDate, '2026-11-25T10:00:00.000Z');
});

test('sanitizeDecimalAmountInput, roundCurrencyAmount, and reconcileOptimisticAndCloudLoans prevent precision drift and sync races', async () => {
  const {
    roundCurrencyAmount,
    sanitizeDecimalAmountInput,
    reconcileOptimisticAndCloudLoans,
  } = await import('./loanLogic');

  assert.equal(roundCurrencyAmount(0.1 + 0.2), 0.3);
  assert.equal(roundCurrencyAmount(125.456), 125.46);
  assert.equal(sanitizeDecimalAmountInput('-123.456'), '123.45');
  assert.equal(sanitizeDecimalAmountInput('١٢٣.٤٥٦'), '123.45');
  assert.equal(sanitizeDecimalAmountInput('12..3.9'), '12.39');
  assert.equal(sanitizeDecimalAmountInput('abc-50'), '50');

  // Reconciling stale active cloud snapshot with local settled/archived mutation keeps settled record out of Active
  const staleCloudLoan: Loan = {
    id: 'loan_sync_1',
    personName: 'Rami',
    amount: 300,
    paidAmount: 0,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-10',
  };
  const optimisticSettled: Loan = {
    ...staleCloudLoan,
    paidAmount: 300,
    status: 'settled',
    settledAt: '2026-11-18',
  };

  const pendingUpserts = new Map<string, { loan: Loan; expiresAt: number }>([
    ['loan_sync_1', { loan: optimisticSettled, expiresAt: 2000 }],
  ]);
  const pendingDeletes = new Map<string, number>([['loan_deleted_1', 2000]]);

  const reconciled = reconcileOptimisticAndCloudLoans({
    cloudLoans: [
      staleCloudLoan,
      {
        id: 'loan_deleted_1',
        personName: 'Ghost',
        amount: 50,
        type: 'i_owe_them',
        status: 'active',
        createdAt: '2026-11-11',
      },
    ],
    pendingUpserts,
    pendingDeletes,
    nowMs: 1000,
  });

  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].id, 'loan_sync_1');
  assert.equal(reconciled[0].status, 'settled');
  assert.equal(pendingUpserts.has('loan_sync_1'), true);

  // Once cloud catches up to settled state, pending entry clears cleanly
  const reconciledAfterSync = reconcileOptimisticAndCloudLoans({
    cloudLoans: [optimisticSettled],
    pendingUpserts,
    pendingDeletes,
    nowMs: 1200,
  });
  assert.equal(reconciledAfterSync[0].status, 'settled');
  assert.equal(pendingUpserts.has('loan_sync_1'), false);
});

test('local username uniqueness registry blocks duplicates case-insensitively and releases old handles cleanly', async () => {
  const {
    isUsernameTakenInLocalStore,
    registerUsernameInLocalStore,
    readLocalUsernameRegistry,
  } = await import('./loanLogic');

  const backing = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
  };

  registerUsernameInLocalStore({
    nextUsername: '@Lanya_2026',
    ownerId: 'uid_lanya',
    storage: mockStorage,
  });

  // Another user trying to claim @lanya_2026 (different case) is blocked
  assert.equal(
    isUsernameTakenInLocalStore({
      username: 'lanya_2026',
      ownerId: 'uid_other',
      storage: mockStorage,
    }),
    true
  );

  // Same owner updating casing or bio keeps their own handle
  assert.equal(
    isUsernameTakenInLocalStore({
      username: '@Lanya_2026',
      ownerId: 'uid_lanya',
      storage: mockStorage,
    }),
    false
  );

  // Friend directory collision blocks claiming friend's handle locally too
  assert.equal(
    isUsernameTakenInLocalStore({
      username: 'tariq_99',
      ownerId: 'uid_lanya',
      friends: [
        { ownerId: 'uid_lanya', friendUid: 'uid_tariq', username: 'Tariq_99', displayName: 'Tariq' },
      ],
      storage: mockStorage,
    }),
    true
  );

  // Rotating handle releases previous handle cleanly
  registerUsernameInLocalStore({
    nextUsername: 'lanya_pro',
    previousUsername: 'lanya_2026',
    ownerId: 'uid_lanya',
    storage: mockStorage,
  });
  const reg = readLocalUsernameRegistry(mockStorage);
  assert.equal(reg['lanya_2026'], undefined);
  assert.equal(reg['lanya_pro'], 'uid_lanya');
});

test('resolveLiveChatLoanReference reflects real-time balance repayments and settlements without stale snapshot values', async () => {
  const { resolveLiveChatLoanReference } = await import('./loanLogic');

  const msg = {
    linkedLoanId: 'loan_chat_live_1',
    linkedLoanPerson: 'Zara',
    linkedLoanAmount: 500,
    linkedLoanCurrency: 'USD' as const,
    linkedLoanType: 'they_owe_me' as const,
    linkedLoanStatus: 'active' as const,
  };

  // Partial payment reduces remaining balance from 500 -> 200 live
  const partialLive = resolveLiveChatLoanReference(msg, [
    {
      id: 'loan_chat_live_1',
      personName: 'Zara',
      amount: 500,
      paidAmount: 300,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-10',
    },
  ]);
  assert.equal(partialLive?.amount, 200);
  assert.equal(partialLive?.status, 'active');
  assert.equal(partialLive?.isLiveUpdated, true);

  // Full settlement flips status badge live to settled
  const settledLive = resolveLiveChatLoanReference(msg, [
    {
      id: 'loan_chat_live_1',
      personName: 'Zara',
      amount: 500,
      paidAmount: 500,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'settled',
      createdAt: '2026-11-10',
      settledAt: '2026-11-18',
    },
  ]);
  assert.equal(settledLive?.status, 'settled');
  assert.equal(settledLive?.amount, 500);

  // Falls back cleanly when loan isn't present in local array
  const fallback = resolveLiveChatLoanReference(msg, []);
  assert.equal(fallback?.isLiveUpdated, false);
  assert.equal(fallback?.amount, 500);
});

test('ai_budget_auth localStorage session helpers persist login across reloads, resist corruption, and clear on logout', async () => {
  const {
    AI_BUDGET_AUTH_STORAGE_KEY,
    readStoredAuthSession,
    writeStoredAuthSession,
    clearStoredAuthSession,
  } = await import('./loanLogic');

  const backing = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
    removeItem: (k: string) => {
      backing.delete(k);
    },
  };

  // 1. Initial empty state
  const empty = readStoredAuthSession(mockStorage);
  assert.equal(empty.isAuthenticated, false);
  assert.equal(empty.user, null);

  // 2. Write session (preserves exact ai_budget_auth contract and defaults lastUsernameChangeDate)
  const saved = writeStoredAuthSession(
    {
      uid: 'uid_lanya_1',
      name: 'Lanya Azad',
      username: '@lanya_2026',
      email: 'lanya@example.com',
      avatar: 'data:image/png;base64,AAA',
    },
    mockStorage
  );
  assert.equal(saved.isAuthenticated, true);
  assert.equal(saved.user?.username, 'lanya_2026');
  assert.equal(typeof saved.user?.lastUsernameChangeDate, 'number');
  assert.ok(backing.has(AI_BUDGET_AUTH_STORAGE_KEY));

  // 3. Re-read simulates browser page reload
  const afterReload = readStoredAuthSession(mockStorage);
  assert.equal(afterReload.isAuthenticated, true);
  assert.equal(afterReload.user?.name, 'Lanya Azad');
  assert.equal(afterReload.user?.email, 'lanya@example.com');
  assert.equal(afterReload.user?.username, 'lanya_2026');
  assert.equal(afterReload.user?.avatar, 'data:image/png;base64,AAA');

  // 4. Explicit logout wipes ai_budget_auth cleanly
  clearStoredAuthSession(mockStorage);
  assert.equal(backing.has(AI_BUDGET_AUTH_STORAGE_KEY), false);
  const afterLogout = readStoredAuthSession(mockStorage);
  assert.equal(afterLogout.isAuthenticated, false);
  assert.equal(afterLogout.user, null);

  // 5. Malformed JSON in localStorage safely falls back without throwing
  mockStorage.setItem(AI_BUDGET_AUTH_STORAGE_KEY, '{broken_json');
  const corrupted = readStoredAuthSession(mockStorage);
  assert.equal(corrupted.isAuthenticated, false);
  assert.equal(corrupted.user, null);
});

test('exact username debt binding validates handles, defaults display labels, and preserves sign/amount on create & edit', async () => {
  const {
    sanitizeUsernameFieldInput,
    validateExactLinkedUsername,
    buildDebtPersonBinding,
    createTransactionEntry,
    filterTransactions,
  } = await import('./loanLogic');

  assert.equal(sanitizeUsernameFieldInput('@Lanya_2026! '), 'Lanya_2026');
  assert.equal(validateExactLinkedUsername('').reason, 'empty');
  assert.equal(validateExactLinkedUsername('ab').reason, 'too_short');
  assert.equal(validateExactLinkedUsername('bad name!').reason, 'invalid_chars');

  const valid = validateExactLinkedUsername('@lanya_2026');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalized, 'lanya_2026');

  // Omitting optional display label defaults cleanly to @username
  const bindingDefault = buildDebtPersonBinding({ linkedUsername: '@lanya_2026' });
  assert.equal(bindingDefault.valid, true);
  assert.equal(bindingDefault.linkedUsername, 'lanya_2026');
  assert.equal(bindingDefault.personName, '@lanya_2026');

  // Providing optional display label preserves both display label and exact linkedUsername
  const bindingCustom = buildDebtPersonBinding({
    linkedUsername: 'Lanya_2026',
    displayLabel: 'Lanya Azad',
  });
  assert.equal(bindingCustom.valid, true);
  assert.equal(bindingCustom.linkedUsername, 'Lanya_2026');
  assert.equal(bindingCustom.personName, 'Lanya Azad');

  const iOweLoan: Loan = {
    id: 'exact_1',
    personName: bindingCustom.personName,
    linkedUsername: bindingCustom.linkedUsername,
    amount: 250,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-18',
  };

  // Editing linkedUsername updates both loan and archived searchability
  const editRes = applyPaymentUpdate(
    iOweLoan,
    { linkedUsername: 'lanya_updated', personName: '@lanya_updated', type: 'they_owe_me' },
    '2026-11-18'
  );
  assert.equal(editRes.updatedLoan.linkedUsername, 'lanya_updated');
  assert.equal(editRes.updatedLoan.personName, '@lanya_updated');
  assert.equal(editRes.updatedLoan.type, 'they_owe_me');

  // Transaction ledger entry carries linkedUsername and can be searched by handle
  const tx = createTransactionEntry({
    loan: editRes.updatedLoan,
    action: 'edited',
    amountChange: 250,
    balanceBefore: 250,
    balanceAfter: 250,
    id: 'tx_exact_1',
  });
  assert.equal(tx.linkedUsername, 'lanya_updated');
  assert.equal(filterTransactions([tx], { query: 'lanya_updated' }).length, 1);

  const settledCopy: Loan = { ...editRes.updatedLoan, status: 'settled', settledAt: '2026-11-18' };
  assert.equal(filterAndSortArchivedLoans([settledCopy], { query: 'lanya_updated' }).length, 1);
});

test('strict exact-username chat resolution never fuzzy-matches display names', async () => {
  const {
    resolveExactLoanChatUsername,
    findFriendByExactUsername,
    filterLoansByExactUsername,
    resolveLiveChatLoanReference,
  } = await import('./loanLogic');

  const fuzzyOnlyLoan: Loan = {
    id: 'l_fuzzy',
    personName: 'Lanya K.',
    amount: 100,
    currency: 'USD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-18',
  };
  const exactBoundLoan: Loan = {
    id: 'l_exact',
    personName: 'Lanya K.',
    linkedUsername: 'Lanya_2026',
    amount: 320,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-18',
  };
  const atHandleLoan: Loan = {
    id: 'l_at',
    personName: '@tariq_99',
    amount: 75,
    currency: 'EUR',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-18',
  };

  assert.equal(resolveExactLoanChatUsername(fuzzyOnlyLoan), '');
  assert.equal(resolveExactLoanChatUsername(exactBoundLoan), 'lanya_2026');
  assert.equal(resolveExactLoanChatUsername(atHandleLoan), 'tariq_99');

  const friends = [
    { ownerId: 'me', friendUid: 'u1', username: 'lanya_2026', displayName: 'Lanya K.' },
    { ownerId: 'me', friendUid: 'u2', username: 'tariq_99', displayName: 'Tariq' },
  ];

  // Exact username matches case-insensitively; fuzzy display name never matches
  assert.equal(findFriendByExactUsername(friends, 'LANYA_2026')?.friendUid, 'u1');
  assert.equal(findFriendByExactUsername(friends, 'Lanya K.'), null);

  const filteredForLanya = filterLoansByExactUsername(
    [fuzzyOnlyLoan, exactBoundLoan, atHandleLoan],
    'lanya_2026'
  );
  assert.deepEqual(filteredForLanya.exactMatches.map((l) => l.id), ['l_exact']);
  assert.deepEqual(filteredForLanya.otherLoans.map((l) => l.id), ['l_fuzzy', 'l_at']);

  const liveRef = resolveLiveChatLoanReference(
    {
      linkedLoanId: 'l_exact',
      linkedLoanPerson: 'Lanya K.',
      linkedLoanUsername: 'Lanya_2026',
      linkedLoanAmount: 320,
      linkedLoanCurrency: 'USD',
      linkedLoanType: 'i_owe_them',
      linkedLoanStatus: 'active',
    },
    [exactBoundLoan]
  );
  assert.equal(liveRef?.linkedUsername, 'Lanya_2026');
});

test('aggregateCounterpartyDebtProfile sums multi-currency active balances and merges friend/chat profile metadata', async () => {
  const { aggregateCounterpartyDebtProfile } = await import('./loanLogic');

  const loans: Loan[] = [
    {
      id: 'cp_1',
      personName: 'Lanya K.',
      linkedUsername: 'lanya_2026',
      amount: 500,
      paidAmount: 100,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-01',
    },
    {
      id: 'cp_2',
      personName: '@LANYA_2026',
      linkedUsername: 'LANYA_2026',
      amount: 150,
      paidAmount: 0,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-05',
    },
    {
      id: 'cp_3',
      personName: 'Lanya',
      linkedUsername: 'lanya_2026',
      amount: 200,
      paidAmount: 0,
      currency: 'EUR',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-07',
    },
    {
      id: 'cp_settled',
      personName: 'Lanya K.',
      linkedUsername: 'lanya_2026',
      amount: 1000,
      paidAmount: 1000,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'settled',
      createdAt: '2026-10-01',
      settledAt: '2026-10-15',
    },
    {
      id: 'cp_other',
      personName: 'Tariq',
      linkedUsername: 'tariq_99',
      amount: 300,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-02',
    },
  ];

  const friends = [
    {
      ownerId: 'me',
      friendUid: 'uid_lanya',
      username: 'lanya_2026',
      displayName: 'Lanya Azad',
      avatar: 'https://example.com/lanya.png',
      bio: 'Architect & Studio Lead',
    },
  ];

  const profile = aggregateCounterpartyDebtProfile({
    loans,
    fallbackLoan: loans[1],
    friends,
  });

  assert.equal(profile.usernameLower, 'lanya_2026');
  assert.equal(profile.username, 'lanya_2026');
  assert.equal(profile.displayName, 'Lanya Azad');
  assert.equal(profile.avatar, 'https://example.com/lanya.png');
  assert.equal(profile.bio, 'Architect & Studio Lead');
  assert.equal(profile.friendUid, 'uid_lanya');
  assert.equal(profile.activeCount, 3);
  assert.equal(profile.settledCount, 1);

  const usd = profile.currencySummaries.find((c) => c.currency === 'USD');
  assert.equal(usd?.theyOwe, 400);
  assert.equal(usd?.iOwe, 150);
  assert.equal(usd?.net, 250);

  const eur = profile.currencySummaries.find((c) => c.currency === 'EUR');
  assert.equal(eur?.theyOwe, 0);
  assert.equal(eur?.iOwe, 200);
  assert.equal(eur?.net, -200);
});

test('searchKnownCounterparties ranks exact handle matches above prefixes and avoids duplicates or self', async () => {
  const { searchKnownCounterparties } = await import('./loanLogic');

  const friends = [
    { ownerId: 'me', friendUid: 'u1', username: 'lanya_design', displayName: 'Lanya Design' },
    { ownerId: 'me', friendUid: 'u2', username: 'lanya_2026', displayName: 'Lanya Azad' },
    { ownerId: 'me', friendUid: 'u_me', username: 'lanya_self', displayName: 'Self Account' },
  ];

  const threads = [
    {
      id: 'me_u3',
      participantA: 'me',
      participantB: 'u3',
      participantIds: ['me', 'u3'],
      participantProfiles: {
        u3: { username: 'ali_lanya', displayName: 'Ali', avatar: 'data:image/png;base64,BBB' },
        u2: { username: 'lanya_2026', displayName: 'Old Name' },
      },
    },
  ];

  const resExact = searchKnownCounterparties({
    query: '@Lanya_2026',
    friends,
    chatThreads: threads,
    excludeUid: 'u_me',
  });
  assert.equal(resExact.length, 1);
  assert.equal(resExact[0].usernameLower, 'lanya_2026');
  assert.equal(resExact[0].source, 'friend');

  const resPrefix = searchKnownCounterparties({
    query: 'lanya',
    friends,
    chatThreads: threads,
    excludeUid: 'u_me',
  });
  assert.deepEqual(
    resPrefix.map((r) => r.usernameLower),
    ['lanya_2026', 'lanya_design', 'ali_lanya']
  );

  assert.equal(searchKnownCounterparties({ query: '   ', friends, chatThreads: threads }).length, 0);
});

test('computeDebtProgressPercent accurately computes bounded 0..100 repayment percentage', async () => {
  const { computeDebtProgressPercent } = await import('./loanLogic');

  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: 0, status: 'active' }), 0);
  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: 250, status: 'active' }), 25);
  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: 500, status: 'active' }), 50);
  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: 1400, status: 'active' }), 100);
  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: -50, status: 'active' }), 0);
  assert.equal(computeDebtProgressPercent({ amount: 1000, paidAmount: 200, status: 'settled' }), 100);
  assert.equal(computeDebtProgressPercent({ amount: 0, paidAmount: 0, status: 'active' }), 0);
});

test('numeric formatters emit Western digits (0-9) in ar and ku for Valencia Art-Deco rendering', async () => {
  const { formatCardDebt, formatCurrency, formatLocalizedNumber, formatUsernameCooldownDate } = await import('./loanLogic');

  for (const lang of ['en', 'fr', 'tr', 'ar', 'ku'] as const) {
    const card = formatCardDebt(1250.5, 'USD', lang);
    const curr = formatCurrency(250000, lang, 'IQD');
    const num = formatLocalizedNumber(42.75, 2, lang);
    const cooldown = formatUsernameCooldownDate(Date.UTC(2026, 10, 25, 14, 30), lang);

    assert.match(card, /[0-9]/);
    assert.doesNotMatch(card, /[٠-٩]/);
    assert.match(curr, /[0-9]/);
    assert.doesNotMatch(curr, /[٠-٩]/);
    assert.match(num, /[0-9]/);
    assert.doesNotMatch(num, /[٠-٩]/);
    assert.doesNotMatch(cooldown, /[٠-٩]/);
  }
});

test('First Iraqi Bank (FIB) QuickPay QR & IBAN validation, formatting, and debt archival work accurately', async () => {
  const {
    formatFibIbanOrAccount,
    validateMockFibPayment,
    settleLoanByFibPayment,
    isFibPaymentNote,
  } = await import('./loanLogic');

  assert.equal(formatFibIbanOrAccount('iq98fira000010048291037'), 'IQ98 FIRA 0000 1004 8291 037');
  assert.equal(formatFibIbanOrAccount('1004-8291-03'), '1004 8291 03');

  const qrNotScanned = validateMockFibPayment({ method: 'qr', qrScanned: false, loanId: 'loan_9981' });
  assert.equal(qrNotScanned.valid, false);
  assert.equal(qrNotScanned.errorCode, 'fib_qr_not_scanned');

  const qrReady = validateMockFibPayment({ method: 'qr', qrScanned: true, loanId: 'loan_9981' });
  assert.equal(qrReady.valid, true);
  assert.equal(qrReady.reference, 'FIB-QP-9981');

  const invalidIban = validateMockFibPayment({ method: 'iban', accountOrIban: '12345' });
  assert.equal(invalidIban.valid, false);
  assert.equal(invalidIban.errorField, 'accountOrIban');

  const validIban = validateMockFibPayment({ method: 'iban', accountOrIban: 'IQ98 FIRA 0000 1004 8291 037' });
  assert.equal(validIban.valid, true);
  assert.equal(validIban.accountLast4, '1037');
  assert.equal(validIban.reference, 'FIB-IBAN-1037');

  const validNumericAcc = validateMockFibPayment({ method: 'iban', accountOrIban: '1004829103' });
  assert.equal(validNumericAcc.valid, true);
  assert.equal(validNumericAcc.accountLast4, '9103');

  const settledFib = settleLoanByFibPayment(
    {
      id: 'loan_fib_1',
      personName: 'Zara K.',
      linkedUsername: 'zara_k',
      amount: 75000,
      paidAmount: 25000,
      currency: 'IQD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-20',
      notes: 'Invoice #4',
    },
    { method: 'iban', reference: validIban.reference, accountLast4: validIban.accountLast4 },
    '2026-11-22'
  );

  assert.equal(settledFib.status, 'settled');
  assert.equal(settledFib.paidAmount, 75000);
  assert.equal(settledFib.settledAt, '2026-11-22');
  assert.ok(settledFib.notes?.includes('First Iraqi Bank (FIB •••• 1037)'));
  assert.equal(isFibPaymentNote(settledFib.notes), true);
  assert.equal(isFibPaymentNote('Paid via Visa •••• 1111'), false);
});

test('buildLockedCheckoutPayoff binds exact remaining I Owe balance and propagates lockedAmount across FIB and Card settlements', async () => {
  const {
    buildLockedCheckoutPayoff,
    settleLoanByFibPayment,
    settleLoanByCardPayment,
    computeDebtProgressPercent,
  } = await import('./loanLogic');

  const partialIOweLoan: Loan = {
    id: 'loan_iowe_lock_1',
    personName: 'Karwan Botan',
    linkedUsername: 'karwan_99',
    amount: 1000,
    paidAmount: 250,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-20',
  };

  const iOwePayoff = buildLockedCheckoutPayoff(partialIOweLoan, 'en');
  assert.equal(iOwePayoff.isIOweLocked, true);
  assert.equal(iOwePayoff.originalAmount, 1000);
  assert.equal(iOwePayoff.paidBefore, 250);
  assert.equal(iOwePayoff.lockedExactAmount, 750);
  assert.equal(iOwePayoff.progressBefore, 25);
  assert.equal(iOwePayoff.progressAfter, 100);
  assert.equal(iOwePayoff.formattedUnsigned, '$750.00');
  assert.equal(iOwePayoff.formattedSigned, '-$750.00');

  // Verify Western digits in Kurdish & Arabic for Valencia numeric display
  for (const lang of ['en', 'fr', 'tr', 'ar', 'ku'] as const) {
    const localized = buildLockedCheckoutPayoff(partialIOweLoan, lang);
    assert.ok(localized.formattedUnsigned.includes('750.00'));
    assert.doesNotMatch(localized.formattedUnsigned, /[٠-٩]/);
  }

  // Receivable record computes exact remaining balance cleanly with isIOweLocked = false
  const receivablePayoff = buildLockedCheckoutPayoff(
    { ...partialIOweLoan, id: 'loan_they_1', type: 'they_owe_me', amount: 500, paidAmount: 100 },
    'en'
  );
  assert.equal(receivablePayoff.isIOweLocked, false);
  assert.equal(receivablePayoff.lockedExactAmount, 400);
  assert.equal(receivablePayoff.progressBefore, 20);
  assert.equal(receivablePayoff.formattedSigned, '+$400.00');

  // Propagating lockedAmount to FIB & Card settles to 100% and embeds exact paid figure
  const settledViaFib = settleLoanByFibPayment(
    partialIOweLoan,
    {
      method: 'qr',
      reference: 'FIB-QP-LOCK1',
      accountLast4: 'LOCK',
      lockedAmount: iOwePayoff.lockedExactAmount,
    },
    '2026-11-22'
  );
  assert.equal(settledViaFib.status, 'settled');
  assert.equal(settledViaFib.paidAmount, 1000);
  assert.equal(computeDebtProgressPercent(settledViaFib), 100);
  assert.ok(settledViaFib.notes?.includes('Paid $750.00 via First Iraqi Bank'));

  const settledViaCard = settleLoanByCardPayment(
    partialIOweLoan,
    {
      brand: 'mastercard',
      last4: '4444',
      cardholderName: 'Karwan Botan',
      lockedAmount: iOwePayoff.lockedExactAmount,
    },
    '2026-11-22'
  );
  assert.equal(settledViaCard.status, 'settled');
  assert.equal(settledViaCard.paidAmount, 1000);
  assert.equal(computeDebtProgressPercent(settledViaCard), 100);
  assert.ok(settledViaCard.notes?.includes('Paid $750.00 via Mastercard •••• 4444'));
});

test('canShowPaymentActions restricts payout gateways strictly to active i_owe_them records', async () => {
  const { canShowPaymentActions } = await import('./loanLogic');

  assert.equal(canShowPaymentActions({ type: 'i_owe_them', status: 'active' }), true);
  assert.equal(canShowPaymentActions({ type: 'i_owe_them', status: 'settled' }), false);
  assert.equal(canShowPaymentActions({ type: 'they_owe_me', status: 'active' }), false);
  assert.equal(canShowPaymentActions({ type: 'they_owe_me', status: 'settled' }), false);
});

test('validateProfileFibAccount and sanitizeProfileSettingsPatch handle optional FIB IBAN & numeric accounts', async () => {
  const {
    validateProfileFibAccount,
    sanitizeProfileSettingsPatch,
  } = await import('./loanLogic');

  const emptyResult = validateProfileFibAccount('   ');
  assert.equal(emptyResult.valid, true);
  assert.equal(emptyResult.normalized, '');
  assert.equal(emptyResult.formatted, '');

  const spacedIban = validateProfileFibAccount('iq98 fira 0000 1004 8291 037');
  assert.equal(spacedIban.valid, true);
  assert.equal(spacedIban.normalized, 'IQ98FIRA000010048291037');
  assert.equal(spacedIban.formatted, 'IQ98 FIRA 0000 1004 8291 037');

  const numericClient = validateProfileFibAccount('1004-8291-037');
  assert.equal(numericClient.valid, true);
  assert.equal(numericClient.normalized, '10048291037');

  const invalidShort = validateProfileFibAccount('IQ98-BAD');
  assert.equal(invalidShort.valid, false);
  assert.equal(invalidShort.reason, 'invalid_format');

  const patch = sanitizeProfileSettingsPatch({
    profileName: 'Dara Barzani',
    profileFibAccount: ' iq98 fira 0000 1004 8291 037 ',
  });
  assert.equal(patch.profileFibAccount, 'IQ98FIRA000010048291037');

  const clearedPatch = sanitizeProfileSettingsPatch({
    profileFibAccount: '',
  });
  assert.equal(clearedPatch.profileFibAccount, '');
});

test('parseFibQrPayload extracts IBAN across formats while strictly preserving locked debt payoff', async () => {
  const { parseFibQrPayload, validateMockFibPayment } = await import('./loanLogic');

  // 1. fib://pay URI with mismatched QR amount -> lockedAmount MUST remain exact debt payoff (750)
  const uriParsed = parseFibQrPayload(
    'fib://pay?iban=IQ98FIRA000010048291037&amount=120&currency=USD&name=Lanya%20H.',
    750
  );
  assert.equal(uriParsed.valid, true);
  assert.equal(uriParsed.sourceFormat, 'fib_uri');
  assert.equal(uriParsed.normalizedAccount, 'IQ98FIRA000010048291037');
  assert.equal(uriParsed.formattedAccount, 'IQ98 FIRA 0000 1004 8291 037');
  assert.equal(uriParsed.recipientName, 'Lanya H.');
  assert.equal(uriParsed.qrEmbeddedAmount, 120);
  assert.equal(uriParsed.lockedAmount, 750);
  assert.equal(uriParsed.accountLast4, '1037');
  assert.equal(uriParsed.reference, 'FIB-QR-1037');

  // 2. JSON payload
  const jsonParsed = parseFibQrPayload(
    JSON.stringify({ iban: 'IQ77FIRA000022223333444', holder: 'Soran Ali', amount: 999 }),
    420.5
  );
  assert.equal(jsonParsed.valid, true);
  assert.equal(jsonParsed.sourceFormat, 'json');
  assert.equal(jsonParsed.normalizedAccount, 'IQ77FIRA000022223333444');
  assert.equal(jsonParsed.recipientName, 'Soran Ali');
  assert.equal(jsonParsed.lockedAmount, 420.5);

  // 3. Labeled text
  const textParsed = parseFibQrPayload('FIB Transfer\nIBAN: IQ12 FIRA 1111 2222 3333 987\nName: Aram K', 300);
  assert.equal(textParsed.valid, true);
  assert.equal(textParsed.sourceFormat, 'labeled_text');
  assert.equal(textParsed.normalizedAccount, 'IQ12FIRA111122223333987');
  assert.equal(textParsed.recipientName, 'Aram K');

  // 4. Raw spaced IQ IBAN
  const rawParsed = parseFibQrPayload('IQ98 FIRA 0000 1004 8291 037', 500);
  assert.equal(rawParsed.valid, true);
  assert.equal(rawParsed.sourceFormat, 'raw_iban');

  // 5. Invalid / empty payloads
  const emptyParsed = parseFibQrPayload('   ', 500);
  assert.equal(emptyParsed.valid, false);
  assert.equal(emptyParsed.reason, 'empty');

  const invalidParsed = parseFibQrPayload('not-a-valid-iban', 500);
  assert.equal(invalidParsed.valid, false);
  assert.equal(invalidParsed.reason, 'invalid_fib_qr');

  // 6. validateMockFibPayment respects extracted account in QR mode
  const qrCheck = validateMockFibPayment({
    method: 'qr',
    qrScanned: true,
    accountOrIban: uriParsed.normalizedAccount,
    loanId: 'loan_1234',
  });
  assert.equal(qrCheck.valid, true);
  assert.equal(qrCheck.accountLast4, '1037');
  assert.equal(qrCheck.reference, 'FIB-QR-1037');
});

test('resolveCounterpartyFibProfile prioritizes cloud profile -> friend -> chat thread snapshot & auth session preserves fibAccount', async () => {
  const {
    resolveCounterpartyFibProfile,
    writeStoredAuthSession,
    readStoredAuthSession,
    AI_BUDGET_AUTH_STORAGE_KEY,
  } = await import('./loanLogic');

  const sampleLoan: Loan = {
    id: 'loan_fib_resolve_1',
    personName: 'Lanya Hawler',
    linkedUsername: '@lanya_2026',
    amount: 1000,
    paidAmount: 250,
    currency: 'USD',
    type: 'i_owe_them',
    status: 'active',
    createdAt: '2026-11-20',
  };

  // Priority 1: Cloud profile overrides friend & thread
  const fromCloud = resolveCounterpartyFibProfile({
    loan: sampleLoan,
    cloudProfile: {
      username: 'lanya_2026',
      displayName: 'Lanya Cloud',
      fibAccount: 'IQ11FIRA000099998888777',
    },
    friends: [
      {
        ownerId: 'me',
        friendUid: 'u_lanya',
        username: 'lanya_2026',
        displayName: 'Lanya Friend',
        fibAccount: 'IQ22FIRA000011112222333',
        addedAtIso: '2026-11-20T00:00:00.000Z',
      },
    ],
  });
  assert.equal(fromCloud.hasFib, true);
  assert.equal(fromCloud.fibAccount, 'IQ11FIRA000099998888777');
  assert.equal(fromCloud.recipientName, 'Lanya Cloud');
  assert.ok(fromCloud.qrPayload.includes('account=IQ11FIRA000099998888777'));
  assert.ok(fromCloud.qrPayload.includes('amount=750'));
  assert.ok(fromCloud.qrPayload.includes('currency=USD'));

  // Priority 2: Friend record
  const fromFriend = resolveCounterpartyFibProfile({
    loan: sampleLoan,
    friends: [
      {
        ownerId: 'me',
        friendUid: 'u_lanya',
        username: 'lanya_2026',
        displayName: 'Lanya Friend',
        fibAccount: 'IQ22FIRA000011112222333',
        addedAtIso: '2026-11-20T00:00:00.000Z',
      },
    ],
  });
  assert.equal(fromFriend.hasFib, true);
  assert.equal(fromFriend.fibAccount, 'IQ22FIRA000011112222333');
  assert.equal(fromFriend.formattedFibAccount, 'IQ22 FIRA 0000 1111 2222 333');

  // Priority 3: Chat thread participant snapshot
  const fromThread = resolveCounterpartyFibProfile({
    loan: sampleLoan,
    chatThreads: [
      {
        id: 'chat_1',
        participantA: 'me',
        participantB: 'u_lanya',
        participantIds: ['me', 'u_lanya'],
        participantProfiles: {
          lanya_2026: {
            username: 'lanya_2026',
            displayName: 'Lanya Thread',
            fibAccount: 'IQ33FIRA000044445555666',
          },
        },
        lastMessageAtIso: '2026-11-20T00:00:00.000Z',
      },
    ],
  });
  assert.equal(fromThread.hasFib, true);
  assert.equal(fromThread.fibAccount, 'IQ33FIRA000044445555666');
  assert.equal(fromThread.recipientName, 'Lanya Thread');

  // Auth session round-trip preserves normalized fibAccount
  const mem: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => {
      mem[k] = v;
    },
  };
  writeStoredAuthSession(
    {
      name: 'Zara K',
      username: 'zara_k',
      email: 'zara@example.com',
      fibAccount: 'iq98 fira 0000 1004 8291 037',
    },
    mockStorage
  );
  assert.ok(mem[AI_BUDGET_AUTH_STORAGE_KEY]);
  const restored = readStoredAuthSession(mockStorage);
  assert.equal(restored.isAuthenticated, true);
  assert.equal(restored.user?.fibAccount, 'IQ98FIRA000010048291037');
});

test('optional @username support allows Full Name debt binding, clean search without handles, and dynamic FIB QR URIs', async () => {
  const {
    buildDebtPersonBinding,
    buildFibPaymentQrPayload,
    searchKnownCounterparties,
    aggregateCounterpartyDebtProfile,
  } = await import('./loanLogic');

  // 1. Debt creation with Full Name ONLY (no @username)
  const nameOnly = buildDebtPersonBinding({
    linkedUsername: '',
    displayLabel: 'Sara Ali',
  });
  assert.equal(nameOnly.valid, true);
  assert.equal(nameOnly.linkedUsername, '');
  assert.equal(nameOnly.personName, 'Sara Ali');

  // 2. Debt creation with BOTH empty fails cleanly
  const bothEmpty = buildDebtPersonBinding({
    linkedUsername: '',
    displayLabel: '   ',
  });
  assert.equal(bothEmpty.valid, false);
  assert.equal(bothEmpty.reason, 'empty');

  // 3. Invalid partial optional username still rejects malformed non-empty handle
  const badOptional = buildDebtPersonBinding({
    linkedUsername: 'ab',
    displayLabel: 'Sara Ali',
  });
  assert.equal(badOptional.valid, false);
  assert.equal(badOptional.reason, 'too_short');

  // 4. Friends & chat search matches contacts without @username by Full Name cleanly
  const matches = searchKnownCounterparties({
    query: 'sara',
    friends: [
      {
        ownerId: 'me',
        friendUid: 'u_sara_no_handle',
        username: '',
        displayName: 'Sara Ali',
        addedAtIso: '2026-11-22T00:00:00.000Z',
      },
      {
        ownerId: 'me',
        friendUid: 'u_karim',
        username: 'karim_hawler',
        displayName: 'Karim Omar',
        addedAtIso: '2026-11-22T00:00:00.000Z',
      },
    ],
  });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].displayName, 'Sara Ali');
  assert.equal(matches[0].username, '');

  // 5. Name-only counterparty profile aggregation emits zero blank @ placeholders
  const profile = aggregateCounterpartyDebtProfile({
    loans: [
      {
        id: 'name_only_1',
        personName: 'Sara Ali',
        amount: 300,
        currency: 'USD',
        type: 'i_owe_them',
        status: 'active',
        createdAt: '2026-11-22',
      },
    ],
    fallbackLoan: {
      id: 'name_only_1',
      personName: 'Sara Ali',
      amount: 300,
      currency: 'USD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-22',
    },
  });
  assert.equal(profile.displayName, 'Sara Ali');
  assert.equal(profile.username, '');
  assert.equal(profile.activeCount, 1);

  // 6. Real FIB QR URI builder formats locked checkout & profile-level payloads accurately
  assert.equal(
    buildFibPaymentQrPayload({
      fibAccount: 'iq98 fira 0000 1004 8291 037',
      amount: 450,
      currency: 'USD',
    }),
    'fib://pay?account=IQ98FIRA000010048291037&amount=450&currency=USD'
  );
  assert.equal(
    buildFibPaymentQrPayload({
      fibAccount: 'IQ98FIRA000010048291037',
    }),
    'fib://pay?account=IQ98FIRA000010048291037&currency=IQD'
  );
  assert.equal(
    buildFibPaymentQrPayload({
      fibAccount: 'bad',
    }),
    ''
  );
});

test('Spanish (es) localization, reminders, trends, due banners, CSV export, and AI responses work accurately', async () => {
  const {
    LANGUAGE_OPTIONS,
    getFontFamilyForLanguage,
    detectPromptLanguage,
    buildDueDateBannerState,
    parseNaturalLanguageLoan,
  } = await import('./loanLogic');

  const esOpt = LANGUAGE_OPTIONS.find((o) => o.code === 'es');
  assert.ok(esOpt);
  assert.equal(esOpt?.shortCode, 'ES');
  assert.equal(esOpt?.isRtl, false);
  assert.equal(LANGUAGE_OPTIONS.length, 6);
  assert.equal(getFontFamilyForLanguage('es'), 'IBM Plex Sans');

  assert.ok(translations.es);
  assert.equal(translations.es.theyOweMe, 'Me Deben');
  assert.equal(translations.es.iOweThem, 'Debo');
  assert.equal(translations.es.statusSettled, 'Saldado');

  const sampleLoan: Loan = {
    id: 'es_loan_1',
    personName: 'Carlos Mendoza',
    amount: 750,
    currency: 'SAR',
    type: 'they_owe_me',
    status: 'active',
    dueDate: '2026-11-23',
    createdAt: '2026-11-01',
  };

  const reminderEs = generateReminderMessage(sampleLoan, 'es', 'formal');
  assert.ok(reminderEs.includes('Carlos Mendoza'));
  assert.ok(reminderEs.includes('SAR'));

  const bannerEs = buildDueDateBannerState([sampleLoan], 'es', '2026-11-23');
  assert.equal(bannerEs.hasDueToday, true);
  assert.equal(bannerEs.dueCount, 1);
  assert.ok(bannerEs.headline.toLowerCase().includes('venc') || bannerEs.headline.includes('Carlos'));

  const trendsEs = computeMonthlyTrends([sampleLoan], 'SAR', 3, 'es');
  assert.equal(trendsEs.data.length, 3);
  assert.ok(trendsEs.data[0].shortLabel.length > 0);

  const csvEs = exportLoansToCsv([sampleLoan], 'es', 'all');
  assert.ok(csvEs.includes('Nombre de la Persona') || csvEs.includes('Me Deben'));

  assert.equal(detectPromptLanguage('Hola, ¿quién me debe dinero?', 'en'), 'es');
  const aiEs = generateAdvancedAiResponse({
    question: 'Hola, ¿quién me debe?',
    language: 'es',
    loans: [sampleLoan],
  });
  assert.ok(aiEs.text.includes('Carlos Mendoza'));

  const nlpSar = parseNaturalLanguageLoan('Carlos owes me 450 SAR', 'en');
  assert.equal(nlpSar?.currency, 'SAR');
  assert.equal(nlpSar?.amount, 450);
  assert.equal(nlpSar?.type, 'they_owe_me');

  const nlpEsSar = parseNaturalLanguageLoan('Le debo a Sara 150 SAR mañana', 'es');
  assert.equal(nlpEsSar?.currency, 'SAR');
  assert.equal(nlpEsSar?.amount, 150);
  assert.equal(nlpEsSar?.type, 'i_owe_them');
});

test('Saudi Riyal (SAR) currency formatting, totals, local date helpers, and FIB settlement work end-to-end', async () => {
  const {
    formatLocalIsoDate,
    parseIsoDateLocal,
    getTodayIsoDate,
    settleLoanByFibPayment,
    normalizeThemeMode,
    isLightThemeMode,
  } = await import('./loanLogic');

  const sar = CURRENCIES.find((c) => c.code === 'SAR');
  assert.ok(sar);
  assert.equal(sar?.symbol, 'ر.س');

  const sarCard = formatCardDebt(1250, 'SAR', 'en');
  assert.ok(sarCard.includes('1,250'));
  assert.ok(sarCard.includes('SAR'));

  const sarLoans: Loan[] = [
    {
      id: 'sar_1',
      personName: 'Fahad Al-Harbi',
      amount: 1200,
      paidAmount: 200,
      currency: 'SAR',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-10',
    },
  ];
  const totalsSar = calculateTotals(sarLoans, 'SAR');
  assert.equal(totalsSar.totalIOwe, 1000);
  assert.equal(totalsSar.iOweByCurrency.SAR, 1000);

  // Local date utilities avoid UTC off-by-one drift
  const todayIso = getTodayIsoDate();
  assert.match(todayIso, /^\d{4}-\d{2}-\d{2}$/);
  const parsed = parseIsoDateLocal('2026-11-23 14:30');
  assert.ok(parsed);
  assert.equal(formatLocalIsoDate(parsed!), '2026-11-23');
  assert.equal(parseIsoDateLocal('not-a-date'), null);

  // Velvet Pink & Nordic Frost normalization (dark-only palette)
  assert.equal(normalizeThemeMode('velvet_pink'), 'velvet_pink');
  assert.equal(normalizeThemeMode('nordic_frost'), 'nordic_frost');
  assert.equal(isLightThemeMode('velvet_pink'), false);
  assert.equal(isLightThemeMode('nordic_frost'), false);

  // Locked FIB payoff settles exact remaining SAR balance
  const settledFib = settleLoanByFibPayment(
    sarLoans[0],
    {
      accountLast4: '1037',
      reference: 'FIB-QR-1037',
      method: 'qr',
      lockedAmount: 1000,
    },
    '2026-11-23'
  );
  assert.equal(settledFib.status, 'settled');
  assert.equal(settledFib.paidAmount, 1200);
  assert.equal(settledFib.settledAt, '2026-11-23');
});

test('USD/IQD exchange rate helpers, dual-currency aggregation, and historical rate preservation', async () => {
  const {
    DEFAULT_USD_TO_IQD_RATE,
    DEFAULT_EXCHANGE_RATES,
    normalizeCustomRates,
    getUsdToIqdRate,
    withUsdToIqdRate,
    convertCurrencyAmount,
    convertUsdAndIqd,
    buildHistoricalRateSnapshot,
    resolveRecordDualEquivalent,
    calculateDualCurrencyTotals,
    createTransactionEntry,
    deriveUpdateTransaction,
  } = await import('./loanLogic');

  // Defaults
  assert.equal(DEFAULT_USD_TO_IQD_RATE, 1500);
  assert.equal(getUsdToIqdRate(undefined), 1500);
  assert.equal(defaultSettings.dualPrimaryCurrency, 'IQD');
  assert.equal(defaultSettings.showDualCurrency, true);
  assert.equal(defaultSettings.customRates?.IQD, 1500);

  // Bidirectional conversion ($100 <-> 150,000 IQD)
  assert.equal(convertUsdAndIqd(100, 'USD', 1500), 150000);
  assert.equal(convertUsdAndIqd(150000, 'IQD', 1500), 100);
  assert.equal(convertUsdAndIqd(100, 'USD', 1520), 152000);
  assert.equal(convertUsdAndIqd(152000, 'IQD', 1520), 100);

  // Sanitize invalid/negative rates safely back to defaults
  const sanitized = normalizeCustomRates({ USD: 99, IQD: -50, SAR: 0, EUR: 0.9 } as Record<string, number>);
  assert.equal(sanitized.USD, 1);
  assert.equal(sanitized.IQD, DEFAULT_EXCHANGE_RATES.IQD);
  assert.equal(sanitized.SAR, DEFAULT_EXCHANGE_RATES.SAR);
  assert.equal(sanitized.EUR, 0.9);

  // Updating USD -> IQD rate preserves other rates
  const updatedRates = withUsdToIqdRate({ ...DEFAULT_EXCHANGE_RATES, SAR: 3.76 }, 1540);
  assert.equal(updatedRates.IQD, 1540);
  assert.equal(updatedRates.SAR, 3.76);
  assert.equal(convertCurrencyAmount(100, 'USD', 'IQD', updatedRates), 154000);
  assert.equal(convertCurrencyAmount(376, 'SAR', 'USD', updatedRates), 100);

  // Entry-timestamp rate snapshot preservation across market rate changes
  const snap1500 = buildHistoricalRateSnapshot('IQD', DEFAULT_EXCHANGE_RATES);
  assert.equal(snap1500.exchangeRateAtEntry, 1500);
  assert.equal(snap1500.fxRateToUsdAtEntry, 1500);

  const historicalLoan: Loan = {
    id: 'fx_hist_1',
    personName: 'Zaid',
    amount: 150000,
    paidAmount: 0,
    currency: 'IQD',
    type: 'they_owe_me',
    status: 'active',
    createdAt: '2026-11-20',
    exchangeRateAtEntry: snap1500.exchangeRateAtEntry,
    fxRateToUsdAtEntry: snap1500.fxRateToUsdAtEntry,
  };
  const newMarketRates = withUsdToIqdRate(DEFAULT_EXCHANGE_RATES, 1600);
  const histEquiv = resolveRecordDualEquivalent(
    historicalLoan.amount,
    'IQD',
    newMarketRates,
    historicalLoan
  );
  assert.equal(histEquiv.targetCurrency, 'USD');
  assert.equal(histEquiv.convertedAmount, 100);
  assert.equal(histEquiv.usedRateUsdToIqd, 1500);
  assert.equal(histEquiv.isHistoricalRate, true);

  // Mixed USD + IQD + SAR portfolio dual-currency aggregation
  const portfolio: Loan[] = [
    historicalLoan, // +150,000 IQD (+$100 at entry rate 1500)
    {
      id: 'fx_usd_2',
      personName: 'Nadia',
      amount: 200,
      paidAmount: 50,
      currency: 'USD',
      type: 'they_owe_me',
      status: 'active',
      createdAt: '2026-11-21',
      exchangeRateAtEntry: 1500,
      fxRateToUsdAtEntry: 1,
    }, // +$150 (+225,000 IQD)
    {
      id: 'fx_iqd_3',
      personName: 'Mustafa',
      amount: 75000,
      paidAmount: 0,
      currency: 'IQD',
      type: 'i_owe_them',
      status: 'active',
      createdAt: '2026-11-22',
      exchangeRateAtEntry: 1500,
      fxRateToUsdAtEntry: 1500,
    }, // -75,000 IQD (-$50)
  ];

  const dualIqd = calculateDualCurrencyTotals(portfolio, newMarketRates, 'IQD');
  assert.equal(dualIqd.primaryCurrency, 'IQD');
  assert.equal(dualIqd.secondaryCurrency, 'USD');
  assert.equal(dualIqd.primaryTheyOwe, 375000);
  assert.equal(dualIqd.secondaryTheyOwe, 250);
  assert.equal(dualIqd.primaryIOwe, 75000);
  assert.equal(dualIqd.secondaryIOwe, 50);
  assert.equal(dualIqd.primaryNet, 300000);
  assert.equal(dualIqd.secondaryNet, 200);

  const dualUsd = calculateDualCurrencyTotals(portfolio, newMarketRates, 'USD');
  assert.equal(dualUsd.primaryCurrency, 'USD');
  assert.equal(dualUsd.primaryTheyOwe, 250);
  assert.equal(dualUsd.secondaryTheyOwe, 375000);

  // Transaction entries inherit historical rate snapshot when present, and omit undefined when absent
  const txWithRate = createTransactionEntry({
    loan: historicalLoan,
    action: 'created',
    amountChange: 150000,
    balanceBefore: 0,
    balanceAfter: 150000,
    now: new Date('2026-11-20T10:00:00.000Z'),
  });
  assert.equal(txWithRate.exchangeRateAtEntry, 1500);
  assert.equal(txWithRate.fxRateToUsdAtEntry, 1500);

  const updatedHist = applyPaymentUpdate(historicalLoan, { paidAmount: 75000 }, '2026-11-21');
  assert.equal(updatedHist.updatedLoan.exchangeRateAtEntry, 1500);
  const txRepay = deriveUpdateTransaction(historicalLoan, updatedHist.updatedLoan);
  assert.equal(txRepay.exchangeRateAtEntry, 1500);

  // Backup export/import preserves customRates, dualPrimaryCurrency, showDualCurrency, and historical rates
  const backup = exportAppDataJson(
    portfolio,
    { ...defaultSettings, customRates: newMarketRates, dualPrimaryCurrency: 'USD', showDualCurrency: false },
    [txWithRate]
  );
  const restored = importAppDataJson(backup);
  assert.equal(restored?.settings?.customRates?.IQD, 1600);
  assert.equal(restored?.settings?.dualPrimaryCurrency, 'USD');
  assert.equal(restored?.settings?.showDualCurrency, false);
  assert.equal(restored?.loans?.[0].exchangeRateAtEntry, 1500);
  assert.equal(restored?.transactions?.[0].exchangeRateAtEntry, 1500);
});

test('Iraq Market FX metadata, market hub inference, and parseQuickDebtInput work accurately', async () => {
  const {
    OFFICIAL_CBI_USD_TO_IQD_RATE,
    BAGHDAD_ERBIL_DEFAULT_MARKET_RATE,
    IRAQ_MARKET_HUB_PRESETS,
    inferIraqMarketHub,
    readIraqMarketMeta,
    writeIraqMarketMeta,
    parseQuickDebtInput,
  } = await import('./loanLogic');

  assert.equal(OFFICIAL_CBI_USD_TO_IQD_RATE, 1310);
  assert.equal(BAGHDAD_ERBIL_DEFAULT_MARKET_RATE, 1530);
  assert.ok(IRAQ_MARKET_HUB_PRESETS.some((p) => p.id === 'baghdad' && p.rate === 1530));
  assert.ok(IRAQ_MARKET_HUB_PRESETS.some((p) => p.id === 'erbil' && p.rate === 1530));
  assert.ok(IRAQ_MARKET_HUB_PRESETS.some((p) => p.id === 'cbi' && p.rate === 1310));
  assert.equal(inferIraqMarketHub(1530), 'baghdad');
  assert.equal(inferIraqMarketHub(1500), 'standard');
  assert.equal(inferIraqMarketHub(1310), 'cbi');
  assert.equal(inferIraqMarketHub(1545), 'custom');

  // Pure storage round-trip using an in-memory mock Storage
  const mem = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
  };
  const initialMeta = readIraqMarketMeta(mockStorage);
  assert.equal(initialMeta.officialUsdToIqd, 1310);
  assert.equal(initialMeta.isLiveSynced, false);

  const savedMeta = writeIraqMarketMeta(
    {
      officialUsdToIqd: 1312.5,
      fetchedAtIso: '2026-11-24T12:00:00.000Z',
      sourceLabel: 'CBI / Open ER Live Reference',
      marketHub: 'erbil',
      isLiveSynced: true,
    },
    mockStorage
  );
  assert.equal(savedMeta.officialUsdToIqd, 1312.5);
  assert.equal(savedMeta.marketHub, 'erbil');
  assert.equal(savedMeta.isLiveSynced, true);
  assert.equal(readIraqMarketMeta(mockStorage).officialUsdToIqd, 1312.5);

  // Quick note parser: natural shorthand entries
  const q1 = parseQuickDebtInput('Market groceries - 25,000 IQD', 'USD');
  assert.ok(q1);
  assert.equal(q1?.personName, 'Market groceries');
  assert.equal(q1?.amount, 25000);
  assert.equal(q1?.currency, 'IQD');

  const q2 = parseQuickDebtInput('Ahmed - $50 coffee', 'IQD');
  assert.ok(q2);
  assert.equal(q2?.personName, 'Ahmed');
  assert.equal(q2?.amount, 50);
  assert.equal(q2?.currency, 'USD');
  assert.equal(q2?.notes, 'coffee');

  const q3 = parseQuickDebtInput('Sara 150k IQD rent', 'USD');
  assert.ok(q3);
  assert.equal(q3?.personName, 'Sara');
  assert.equal(q3?.amount, 150000);
  assert.equal(q3?.currency, 'IQD');
  assert.equal(q3?.notes, 'rent');

  const q4 = parseQuickDebtInput('Ali ٢٥٠ SAR lunch', 'USD');
  assert.ok(q4);
  assert.equal(q4?.personName, 'Ali');
  assert.equal(q4?.amount, 250);
  assert.equal(q4?.currency, 'SAR');
  assert.equal(q4?.notes, 'lunch');

  assert.equal(parseQuickDebtInput('No amount here', 'IQD'), null);
});

test('Iraq Multi-Currency Market Baskets (USD $100, IRR 100k, EUR €100, TRY 100) and custom IQD pricing round-trip accurately', async () => {
  const {
    DEFAULT_EXCHANGE_RATES,
    IRAQ_MARKET_BASKETS,
    getIqdBasketPrice,
    withIqdBasketPrice,
    getIraqMarketRatesList,
    resolveRecordDualEquivalent,
    convertCurrencyAmount,
  } = await import('./loanLogic');

  assert.deepEqual(
    IRAQ_MARKET_BASKETS.map((b) => [b.code, b.basketUnit]),
    [
      ['USD', 100],
      ['IRR', 100000],
      ['EUR', 100],
      ['TRY', 100],
    ]
  );

  // Default basket IQD prices
  assert.equal(getIqdBasketPrice('USD', DEFAULT_EXCHANGE_RATES), 150000);
  assert.equal(getIqdBasketPrice('IRR', DEFAULT_EXCHANGE_RATES), 250);

  // Custom $100 USD = 153,500 IQD
  let rates = withIqdBasketPrice(DEFAULT_EXCHANGE_RATES, 'USD', 153500);
  assert.equal(rates.IQD, 1535);
  assert.equal(getIqdBasketPrice('USD', rates), 153500);

  // Custom 100,000 Toman/IRR = 2,500 IQD
  rates = withIqdBasketPrice(rates, 'IRR', 2500);
  assert.equal(getIqdBasketPrice('IRR', rates), 2500);

  // Custom €100 EUR = 168,000 IQD
  rates = withIqdBasketPrice(rates, 'EUR', 168000);
  assert.equal(getIqdBasketPrice('EUR', rates), 168000);

  // Custom 100 TRY = 4,500 IQD
  rates = withIqdBasketPrice(rates, 'TRY', 4500);
  assert.equal(getIqdBasketPrice('TRY', rates), 4500);

  // Invalid prices are safely ignored
  assert.deepEqual(withIqdBasketPrice(rates, 'EUR', -50), rates);
  assert.deepEqual(withIqdBasketPrice(rates, 'USD', 0), rates);

  // Market list reports all 4 currencies and marks overridden status
  const list = getIraqMarketRatesList(rates);
  assert.equal(list.length, 4);
  assert.equal(list.find((m) => m.code === 'USD')?.iqdPrice, 153500);
  assert.equal(list.find((m) => m.code === 'USD')?.isCustomOverridden, true);
  assert.equal(list.find((m) => m.code === 'IRR')?.iqdPrice, 2500);
  assert.equal(list.find((m) => m.code === 'EUR')?.iqdPrice, 168000);
  assert.equal(list.find((m) => m.code === 'TRY')?.iqdPrice, 4500);

  // Converted debt previews immediately reflect custom basket rates
  const usdDebtPreview = resolveRecordDualEquivalent(100, 'USD', rates);
  assert.equal(usdDebtPreview.targetCurrency, 'IQD');
  assert.equal(usdDebtPreview.convertedAmount, 153500);
  assert.equal(Math.round(convertCurrencyAmount(100, 'EUR', 'IQD', rates)), 168000);
});


