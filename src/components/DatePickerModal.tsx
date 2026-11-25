import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Wallet,
  Check,
} from './OrganicIcons';
import { Language, LoanType, ThemeMode } from '../types';
import { formatLocalIsoDate, getTodayIsoDate, isLightThemeMode, parseIsoDateLocal } from '../utils/loanLogic';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  onSelectDate: (date: string) => void;
  loanType?: LoanType;
  language: Language;
  themeMode?: ThemeMode;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  loanType = 'they_owe_me',
  language,
  themeMode = 'obsidian_neon',
}) => {
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  // Parse existing date and optional time
  const [initialDatePart, initialTimePart] = (selectedDate || '').split(' ');
  const validInitialDate = (initialDatePart ? parseIsoDateLocal(initialDatePart) : null) || new Date();

  const [viewYear, setViewYear] = useState<number>(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(validInitialDate.getMonth());
  const [tempDate, setTempDate] = useState<string>(initialDatePart || getTodayIsoDate());
  const [includeTime, setIncludeTime] = useState<boolean>(Boolean(initialTimePart));
  const [tempTime, setTempTime] = useState<string>(initialTimePart || '12:00');
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const [datePart, timePart] = (selectedDate || '').split(' ');
    const parsed = (datePart ? parseIsoDateLocal(datePart) : null) || new Date();
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
    setTempDate(datePart || getTodayIsoDate());
    setIncludeTime(Boolean(timePart));
    setTempTime(timePart || '12:00');
    setIsYearPickerOpen(false);
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const todayStr = getTodayIsoDate();

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthNamesKu = [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ];
  const monthNamesTr = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayNamesEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekdayNamesAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const weekdayNamesKu = ['یەکشەم', 'دووشەم', 'سێشەم', 'چوارشەم', 'پێنجشەم', 'هەینی', 'شەممە'];
  const weekdayNamesTr = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  const weekdayNamesFr = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  const weekdayNamesEs = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const currentMonthName =
    isKu ? monthNamesKu[viewMonth] :
    isAr ? monthNamesAr[viewMonth] :
    isTr ? monthNamesTr[viewMonth] :
    isFr ? monthNamesFr[viewMonth] :
    isEs ? monthNamesEs[viewMonth] :
    monthNamesEn[viewMonth];

  const currentWeekdays =
    isKu ? weekdayNamesKu :
    isAr ? weekdayNamesAr :
    isTr ? weekdayNamesTr :
    isFr ? weekdayNamesFr :
    isEs ? weekdayNamesEs :
    weekdayNamesEn;

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: { day: number; currentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, currentMonth: false, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const m = viewMonth + 1;
    const dateStr = `${viewYear}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, currentMonth: true, dateStr });
  }

  // Next month leading days
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= (remainingCells >= 7 ? remainingCells - 7 : remainingCells); i++) {
    const m = viewMonth === 11 ? 1 : viewMonth + 2;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, currentMonth: false, dateStr });
  }

  // Quick preset shortcuts
  const applyPreset = (daysToAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    const dateStr = formatLocalIsoDate(target);
    setTempDate(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const applyEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dateStr = formatLocalIsoDate(end);
    setTempDate(dateStr);
    setViewYear(end.getFullYear());
    setViewMonth(end.getMonth());
  };

  const applyEndOfWeek = () => {
    const target = new Date();
    const currentDay = target.getDay(); // 0 Sunday, 5 Friday
    const daysUntilEnd = (5 - currentDay + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilEnd);
    const dateStr = formatLocalIsoDate(target);
    setTempDate(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const applyNextPayday = () => {
    const now = new Date();
    const curDate = now.getDate();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (curDate < 25) {
      target.setDate(25);
    } else {
      target.setMonth(target.getMonth() + 1);
      target.setDate(1);
    }
    const dateStr = formatLocalIsoDate(target);
    setTempDate(dateStr);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const handleDirectDateChange = (val: string) => {
    if (!val) return;
    setTempDate(val);
    const parsed = parseIsoDateLocal(val);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  };

  const handleConfirm = () => {
    const finalDate = includeTime && tempTime ? `${tempDate} ${tempTime}` : tempDate;
    onSelectDate(finalDate);
    onClose();
  };

  const isEmerald = loanType === 'they_owe_me';

  // Dynamic list of selectable years (range of 20 years around viewYear)
  const availableYears = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-picker-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-2xl animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/45' : 'bg-black/85'
      } ${isKu ? 'font-kurdish' : isAr ? 'font-arabic' : ''}`}
    >
      <div
        className={`relative w-full max-w-sm sm:max-w-md rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${
          isLight
            ? isNordic
              ? 'bg-[#F5FAFF] border-sky-200 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FDF4FA]'
            : 'bg-[#0D121F] border-white/[0.12] text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#E6F1FC]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
              : 'border-white/[0.08] bg-[#080B11]/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                isEmerald
                  ? isLight
                    ? 'bg-emerald-500/15 border-emerald-600/30 text-emerald-700'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : isLight
                  ? 'bg-rose-500/15 border-rose-600/30 text-rose-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/20 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              <Calendar className="w-5 h-5" strokeWidth={1.65} glow={isEmerald ? 'they_owe' : 'i_owe'} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="calendar-picker-title" className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {pick('Custom Due Date', 'موعد الاستحقاق المخصص', 'کاتی دیاریکراوی دانەوە', 'Özel Vade Tarihi', "Date d'échéance", 'Fecha de vencimiento')}
                </h3>
                {isEmerald ? (
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.65} glow="they_owe" />
                ) : (
                  <ArrowUpRight className={`w-3.5 h-3.5 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-rose-500'}`} strokeWidth={1.65} glow="i_owe" />
                )}
              </div>
              <p className={`text-[11px] font-numeric flex items-center gap-2 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={1.65} />
                  <span>{tempDate || todayStr}</span>
                </span>
                {includeTime && tempTime && (
                  <span className={`font-semibold inline-flex items-center gap-1 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                    <Clock className="w-3 h-3" strokeWidth={1.65} />
                    <span>{tempTime}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={pick('Close Calendar', 'إغلاق التقويم', 'داخستنی ڕۆژژمێر', 'Takvimi Kapat', 'Fermer le calendrier', 'Cerrar calendario')}
            className={`btn-premium p-2 rounded-xl transition-colors cursor-pointer active:scale-[0.98] ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-4 h-4" strokeWidth={1.65} />
          </button>
        </div>

        {/* Smart Presets Bar */}
        <div
          className={`p-3 border-b ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#EDF5FD]'
                : 'border-slate-200 bg-slate-50/70'
              : isVelvetPink
              ? 'border-[#E8B4A0]/15 bg-[#140B18]/70'
              : 'border-white/[0.06] bg-[#080B11]/50'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-75" strokeWidth={1.65} />
              <span>{pick('Tomorrow', 'غداً', 'سبەی', 'Yarın', 'Demain', 'Mañana')}</span>
            </button>

            <button
              type="button"
              onClick={applyEndOfWeek}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" strokeWidth={1.65} />
              <span>{pick('End of Week', 'نهاية الأسبوع', 'کۆتایی هەفتە', 'Hafta Sonu', 'Fin de semaine', 'Fin de semana')}</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(7)}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-75" strokeWidth={1.65} />
              <span>{pick('In 7 Days', 'خلال ٧ أيام', 'لە ٧ ڕۆژدا', '7 Gün İçinde', 'Dans 7 jours', 'En 7 días')}</span>
            </button>

            <button
              type="button"
              onClick={applyNextPayday}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:text-white'
              }`}
            >
              <Wallet className="w-3 h-3" strokeWidth={1.65} />
              <span>{pick('Next Payday', 'يوم الراتب', 'ڕۆژی مووچە', 'Maaş Günü', 'Jour de paie', 'Día de pago')}</span>
            </button>

            <button
              type="button"
              onClick={applyEndOfMonth}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-75" strokeWidth={1.65} />
              <span>{pick('End of Month', 'نهاية الشهر', 'کۆتایی مانگ', 'Ay Sonu', 'Fin du mois', 'Fin de mes')}</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(30)}
              className={`btn-premium px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1 active:scale-[0.98] ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 opacity-75" strokeWidth={1.65} />
              <span>{pick('In 30 Days', 'خلال ٣٠ يوماً', 'لە ٣٠ ڕۆژدا', '30 Gün İçinde', 'Dans 30 jours', 'En 30 días')}</span>
            </button>
          </div>
        </div>

        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            type="button"
            onClick={isRtl ? handleNextMonth : handlePrevMonth}
            aria-label="Previous Month"
            className={`btn-premium p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs sm:text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentMonthName}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                className={`btn-premium px-2 py-0.5 rounded-lg border text-xs font-bold font-numeric cursor-pointer flex items-center gap-1 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-slate-200'
                }`}
              >
                <span>{viewYear}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" strokeWidth={1.65} />
              </button>

              {isYearPickerOpen && (
                <div
                  className={`absolute top-full mt-1 start-1/2 -translate-x-1/2 z-30 w-28 max-h-48 overflow-y-auto rounded-xl border shadow-xl p-1 scrollbar-thin ${
                    isLight
                      ? isNordic
                        ? 'bg-[#F5FAFF] border-sky-200'
                        : 'bg-white border-slate-200'
                      : isVelvetPink
                      ? 'bg-[#1F1224] border-[#E8B4A0]/25'
                      : 'bg-[#080B11] border-white/[0.15]'
                  }`}
                >
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setIsYearPickerOpen(false);
                      }}
                      className={`w-full text-center px-2 py-1 rounded-lg text-xs font-semibold font-numeric transition-colors cursor-pointer ${
                        yr === viewYear
                          ? isEmerald
                            ? 'bg-emerald-500 text-white font-bold'
                            : 'bg-rose-500 text-white font-bold'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={isRtl ? handlePrevMonth : handleNextMonth}
            aria-label="Next Month"
            className={`btn-premium p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {currentWeekdays.map((wd, idx) => (
              <span key={idx} className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {wd}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              const isSelected = item.dateStr === tempDate;
              const isToday = item.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTempDate(item.dateStr)}
                  className={`btn-premium aspect-square rounded-xl text-xs font-semibold font-numeric flex items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? isEmerald
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold shadow-lg shadow-emerald-500/30 scale-105 z-10 ring-2 ring-emerald-400/50'
                        : 'bg-gradient-to-tr from-rose-500 to-pink-400 text-white font-extrabold shadow-lg shadow-rose-500/30 scale-105 z-10 ring-2 ring-rose-400/50'
                      : item.currentMonth
                      ? isLight
                        ? 'text-slate-800 hover:bg-slate-200/70 hover:text-slate-950'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      : isLight
                      ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.04]'
                  } ${isToday && !isSelected ? `border border-amber-500/60 font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}` : ''}`}
                >
                  <span>{item.day}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Exact Date Input & Time Picker */}
        <div
          className={`px-4 py-3 border-t space-y-2.5 ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#EDF5FD]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/15 bg-[#140B18]/75'
              : 'border-white/[0.06] bg-[#080B11]/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Calendar className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
              <span>{pick('Direct Date Input:', 'تحديد تاريخ مخصص:', 'دیاریکردنی بەرواری تایبەت:', 'Özel Tarih Girişi:', 'Date personnalisée :', 'Fecha directa:')}</span>
            </span>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => handleDirectDateChange(e.target.value)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-numeric focus:outline-none focus:border-emerald-500 cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white'
              }`}
            />
          </div>

          <div className={`flex items-center justify-between gap-2 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.04]'}`}>
            <label className={`flex items-center gap-2 cursor-pointer text-xs select-none ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <input
                type="checkbox"
                checked={includeTime}
                onChange={(e) => setIncludeTime(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-500 bg-white/10 border-slate-400 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
                <span>{pick('Exact Time (Optional)', 'تحديد وقت محدد (ساعة ودقيقة)', 'دیاریکردنی کاتی ورد (کاتژمێر و خولەک)', 'Saat ve Dakika (İsteğe bağlı)', 'Heure précise (Optionnelle)', 'Hora exacta (Opcional)')}</span>
              </span>
            </label>

            {includeTime && (
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className={`px-2.5 py-1 rounded-xl border border-amber-400/50 text-xs font-numeric focus:outline-none focus:border-amber-500 cursor-pointer ${
                  isLight ? 'bg-white text-amber-800' : 'bg-white/[0.05] text-amber-300'
                }`}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between p-3.5 border-t ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#E6F1FC]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
              : 'border-white/[0.08] bg-[#080B11]/80'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTempDate(todayStr);
              setViewYear(new Date().getFullYear());
              setViewMonth(new Date().getMonth());
            }}
            className={`btn-premium px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 opacity-75" strokeWidth={1.65} />
            <span>{pick('Today', 'اليوم', 'ئەمڕۆ', 'Bugün', "Aujourd'hui", 'Hoy')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`btn-premium px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer active:scale-[0.98] ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {pick('Cancel', 'إلغاء', 'پاشگەزبوونەوە', 'İptal', 'Annuler', 'Cancelar')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`btn-premium flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-[0.98] ${
                isEmerald
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25'
                  : isVelvetPink
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] text-white shadow-[#FF2E93]/30'
                  : 'bg-gradient-to-r from-rose-500 to-pink-400 text-white shadow-rose-500/25'
              }`}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span>{pick('Confirm Date', 'تأكيد الموعد', 'پەسەندکردنی بەروار', 'Tarihi Onayla', 'Confirmer la date', 'Confirmar fecha')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
