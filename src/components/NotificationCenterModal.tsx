import React, { useState, useEffect } from 'react';
import { InAppNotification, Translations, Language, Loan, ThemeMode } from '../types';
import {
  getInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from '../utils/notificationService';
import { buildDueDateBannerState, formatSignedCardDebt, isLightThemeMode } from '../utils/loanLogic';
import {
  Check,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
} from './OrganicIcons';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translations;
  language: Language;
  loans: Loan[];
  userProfileName?: string;
  onSelectLoanForEdit?: (loanId: string) => void;
  onShowToast?: (msg: string) => void;
  themeMode?: ThemeMode;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  translations,
  language,
  loans,
  onSelectLoanForEdit,
  onShowToast,
  themeMode = 'obsidian_neon',
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'overdue'>('all');
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const loadNotifications = () => {
    setNotifications(getInAppNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleUpdate = () => loadNotifications();
    window.addEventListener('loan_budget_notifications_updated', handleUpdate);
    return () => window.removeEventListener('loan_budget_notifications_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
    onShowToast?.(
      pick(
        'Marked all notifications as read',
        'تم تحديد كافة الإشعارات كمقروءة',
        'هەموو ئاگادارکردنەوەکان وەک خوێندراوە دیاریکران',
        'Tüm bildirimler okundu olarak işaretlendi',
        'Toutes les notifications marquées comme lues',
        'Todas las notificaciones marcadas como leídas'
      )
    );
  };

  const handleClearAll = () => {
    clearAllNotifications();
    loadNotifications();
    onShowToast?.(
      pick(
        'Cleared notification history',
        'تم مسح سجل الإشعارات',
        'تۆماری ئاگادارکردنەوەکان سڕایەوە',
        'Bildirim geçmişi temizlendi',
        'Historique des notifications effacé',
        'Historial de notificaciones borrado'
      )
    );
  };

  const handleItemClick = (notif: InAppNotification) => {
    markNotificationAsRead(notif.id);
    loadNotifications();
    if (onSelectLoanForEdit && notif.loanId) {
      onSelectLoanForEdit(notif.loanId);
      onClose();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dueCount = notifications.filter((n) => n.type === 'borrower_due' || n.type === 'lender_maturity').length;
  const overdueCount = notifications.filter((n) => n.type === 'overdue_followup').length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'due') return n.type === 'borrower_due' || n.type === 'lender_maturity';
    if (activeTab === 'overdue') return n.type === 'overdue_followup';
    return true;
  });

  const dueBanner = buildDueDateBannerState(loans, language);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/45' : 'bg-black/85'
      }`}
    >
      <div
        className={`relative w-full max-w-2xl rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-[#F5FAFF] border-[#B8D4EE] text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FFF5FA]'
            : 'bg-[#090D16]/95 border-white/10 text-white'
        }`}
      >
        {/* Top Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? isNordic
                ? 'border-[#D2E4F5] bg-[#EAF2FB]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
              : 'border-white/[0.08] bg-[#0B101D]/90'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`relative w-11 h-11 rounded-2xl border flex items-center justify-center shadow-sm ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Bell glow="accent" className="w-5 h-5 stroke-[1.65]" />
              {unreadCount > 0 && (
                <span
                  className={`font-numeric absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ${
                    isLight ? 'ring-white' : 'ring-[#0B101D]'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2
                id="notification-center-title"
                className={`text-base sm:text-lg font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}
              >
                {translations.notificationCenterTitle}
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {translations.dualPartyDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[1.65]" />
          </button>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div
          className={`px-5 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isLight
              ? isNordic
                ? 'border-[#D2E4F5] bg-[#EFF6FD]'
                : 'border-slate-200 bg-slate-50/70'
              : isVelvetPink
              ? 'border-[#E8B4A0]/18 bg-[#140B18]/85'
              : 'border-white/[0.06] bg-[#070A12]/80'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{translations.allNotifications}</span>
              <span className="font-numeric ms-1.5 text-[11px] opacity-80">({notifications.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('due')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'due'
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 stroke-[1.65]" />
              <span>{pick('Due Today', 'مستحق اليوم', 'ئەمڕۆ وادەیەتی', 'Bugün Vadeli', "Aujourd'hui", 'Vence Hoy')}</span>
              <span data-numeric="true" className="font-numeric text-[11px] opacity-80">({dueCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overdue'
                  ? isLight
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 stroke-[1.65]" />
              <span>{pick('Overdue', 'متأخر', 'دواکەوتوو', 'Gecikmiş', 'En retard', 'Vencido')}</span>
              <span data-numeric="true" className="font-numeric text-[11px] opacity-80">({overdueCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-300 hover:text-white'
                }`}
                title={translations.markAllRead}
              >
                <Check className={`w-3.5 h-3.5 stroke-[1.65] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span className="hidden sm:inline">{translations.markAllRead}</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                title={translations.clearAll}
                aria-label={translations.clearAll}
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.65]" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto overscroll-contain flex-1">
          {/* Priority Due-Today Summary Card */}
          {dueBanner.hasDueToday && (
            <div
              data-testid="notif-center-due-banner"
              className={`p-4 rounded-2xl border space-y-3 ${
                isLight
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-gradient-to-r from-amber-500/15 via-[#131926] to-amber-500/5 border-amber-500/35'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 stroke-[1.65]" />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                    {dueBanner.headline}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-amber-800' : 'text-amber-200/80'}`}>
                    {dueBanner.peopleSummary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-500/20">
                {dueBanner.dueTodayLoans.map((dl) => (
                  <button
                    key={dl.id}
                    type="button"
                    onClick={() => {
                      if (onSelectLoanForEdit) {
                        onSelectLoanForEdit(dl.id);
                        onClose();
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-amber-500/25 text-amber-200'
                    }`}
                  >
                    <span>{dl.personName}</span>
                    <span className={`font-numeric ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      {formatSignedCardDebt(dl.amount, dl.currency || 'USD', language, dl.type)}
                    </span>
                    <ExternalLink className="w-3 h-3 stroke-[1.65]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/[0.08] text-slate-400'
                }`}
              >
                <Bell className="w-6 h-6 stroke-[1.65]" />
              </div>
              <h3 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {translations.noNotificationsYet}
              </h3>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick(
                  'When an active loan reaches its due date or becomes overdue, a single actionable alert is logged here.',
                  'عندما يحين موعد استحقاق أي دين نشط أو يتأخر عن موعده، سيظهر هنا تنبيه واحد واضح.',
                  'کاتێک قەرزێکی چالاک کاتی دانەوەی دێت یان دوادەکەوێت، ئاگادارییەکی پوخت لێرەدا دەردەکەوێت.',
                  'Aktif bir kaydın vadesi geldiğinde veya geciktiğinde tek bir net uyarı burada görünür.',
                  'Lorsqu’un prêt actif arrive à échéance ou est en retard, une alerte unique apparaît ici.',
                  'Cuando un préstamo activo vence o se atrasa, aparece aquí una alerta única y clara.'
                )}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isBorrowerDue = item.type === 'borrower_due';
              const isOverdue = item.type === 'overdue_followup';

              const cardBorderClass = isLight
                ? isOverdue
                  ? 'border-rose-300 bg-rose-50/70'
                  : isBorrowerDue
                  ? 'border-amber-300 bg-amber-50/70'
                  : 'border-emerald-300 bg-emerald-50/70'
                : isOverdue
                ? 'border-rose-500/40 bg-gradient-to-r from-rose-500/[0.12] via-[#0D121F] to-[#0D121F]'
                : isBorrowerDue
                ? 'border-amber-500/35 bg-gradient-to-r from-amber-500/[0.1] via-[#0D121F] to-[#0D121F]'
                : 'border-emerald-500/35 bg-gradient-to-r from-emerald-500/[0.1] via-[#0D121F] to-[#0D121F]';

              return (
                <div
                  key={item.id}
                  className={`relative p-4 rounded-2xl border transition-colors duration-150 ${cardBorderClass} ${
                    !item.read ? (isLight ? 'ring-1 ring-emerald-400/50' : 'ring-1 ring-white/20') : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                          isOverdue
                            ? isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-rose-500/20 border-rose-500/35 text-rose-300'
                            : isBorrowerDue
                            ? isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/20 border-amber-500/35 text-amber-300'
                            : isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300'
                        }`}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[1.65]" />
                        ) : isBorrowerDue ? (
                          <ArrowUpRight glow="i_owe" className="w-3.5 h-3.5 stroke-[1.65]" />
                        ) : (
                          <ArrowDownLeft glow="they_owe" className="w-3.5 h-3.5 stroke-[1.65]" />
                        )}
                      </span>
                      <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        <span>{item.title}</span>
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                          isOverdue
                            ? isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isBorrowerDue
                            ? isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isOverdue
                          ? pick('Overdue', 'متأخر', 'دواکەوتوو', 'Gecikmiş', 'En retard', 'Vencido')
                          : isBorrowerDue
                          ? pick('Payable Due', 'سداد مستحق', 'کاتی دانەوەمە', 'Ödeme Vadesi', 'Dette due', 'Pago Vencido')
                          : pick('Receivable Due', 'تحصيل مستحق', 'کاتی وەرگرتنەوەیە', 'Tahsilat Vadesi', 'Créance due', 'Cobro Vencido')}
                      </span>
                    </div>

                    <span data-numeric="true" className="text-[11px] text-slate-500 shrink-0 font-numeric">
                      {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed mb-3 font-normal ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {item.body}
                  </p>

                  <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isLight ? 'border-slate-200/80' : 'border-white/[0.06]'}`}>
                    <div className={`flex items-center gap-2 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <Calendar className="w-3.5 h-3.5 stroke-[1.65] text-slate-500" />
                      <span data-numeric="true" className="font-numeric">
                        {item.dueDate
                          ? `${pick('Due', 'الاستحقاق', 'بەرواری دانەوە', 'Vade', 'Échéance', 'Vence')}: ${item.dueDate}`
                          : pick('Scheduled', 'مجدول', 'خشتەبەندکراو', 'Planlı', 'Planifié', 'Programado')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-transform active:scale-[0.98] cursor-pointer shadow-sm border ${
                        isOverdue
                          ? isLight
                            ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40'
                          : isLight
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40'
                      }`}
                    >
                      <span>{translations.tapToUpdateOrSettle}</span>
                      <ExternalLink className="w-3.5 h-3.5 stroke-[1.65]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
