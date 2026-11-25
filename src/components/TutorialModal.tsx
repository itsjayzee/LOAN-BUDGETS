import React, { useState } from 'react';
import { Language, ThemeMode, Translations } from '../types';
import { isLightThemeMode } from '../utils/loanLogic';
import {
  X,
  DollarSign,
  Archive,
  Calendar,
  Bell,
  Bot,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
} from './OrganicIcons';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  translations: Translations;
  themeMode?: ThemeMode;
  onOpenAddLoan?: () => void;
  onOpenAiGuide?: () => void;
  onOpenAiAssistant?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  language,
  translations,
  themeMode = 'obsidian_neon',
  onOpenAddLoan,
  onOpenAiGuide,
  onOpenAiAssistant,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';

  if (!isOpen) return null;

  const isAr = language === 'ar';
  const isKu = language === 'ku';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isAr || isKu;
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;
  const openAiHandler = onOpenAiGuide || onOpenAiAssistant;

  const steps = [
    {
      icon: DollarSign,
      title: pick(
        '1. Direct Multi-Currency Debt Recording',
        '١. تسجيل الديون بالعملات المتعددة مباشرة',
        '1. تۆمارکردنی ڕاستەوخۆی قەرز بە دراوی جیاواز',
        '1. Doğrudan Çoklu Para Birimi Kaydı',
        '1. Enregistrement Direct Multi-Devises',
        '1. Registro Directo Multidivisa'
      ),
      badge: 'USD, IQD, SAR, TRY, EUR, IRR',
      summary: pick(
        'Record every loan directly in its exact lending currency (IQD, USD, SAR, TRY, EUR, IRR) with zero conversion clutter.',
        'سجّل كل دين بعملته الفعلية مباشرة دون تشويه أو تحويل معقد للأسعار.',
        'هەر قەرزێک ڕاستەوخۆ بە دراوی خۆی تۆمار بکە (IQD, USD, SAR, TRY, EUR, IRR) بەبێ ئاڵۆزی گۆڕینەوە.',
        'Her borcu veya alacağı karmaşık kur hesapları olmadan doğrudan kendi para biriminde (IQD, USD, SAR, TRY, EUR, IRR) kaydedin.',
        'Enregistrez chaque prêt directement dans sa devise exacte sans conversion complexe.',
        'Registra cada préstamo directamente en su moneda exacta (IQD, USD, SAR, TRY, EUR, IRR) sin conversiones confusas.'
      ),
      details: [
        pick(
          'Select the exact currency with 1-tap selection directly on the add or edit loan form.',
          'اختر العملة مباشرة بنقرة واحدة عند إضافة أو تعديل أي سجل.',
          'لە کاتی تۆمارکردنی قەرزدا دراوی دڵخوازت بە یەک کرتە لەسەر فۆڕمەکە هەڵبژێرە.',
          'Kayıt eklerken veya düzenlerken para birimini tek dokunuşla form üzerinden seçin.',
          'Sélectionnez la devise exacte en un clic directement sur le formulaire.',
          'Selecciona la moneda exacta con un toque directamente al crear o editar.'
        ),
        pick(
          'Each card displays the exact balance in its native currency with + or - signage.',
          'تظهر كل بطاقة المبلغ الدقيق بعملته الأصلية مع إشارة (+) أو (-).',
          'هەر کارتێک بڕە پارەکە بە دراوی خۆی پیشان دەدات لەگەڵ نیشانەی (+) یان (-).',
          'Her kart, bakiyeyi kendi para biriminde (+) veya (-) işaretiyle net gösterir.',
          'Chaque carte affiche le solde exact dans sa devise avec le signe + ou -.',
          'Cada tarjeta muestra el saldo exacto en su moneda con signo + o -.'
        ),
        pick(
          'Dashboard totals and trends summarize each currency cleanly and accurately.',
          'تتجمع الإحصائيات والرسوم البيانية لكل عملة بوضوح وشفافية.',
          'کۆی گشتی و هێڵکارییەکانی داشبۆرد هەر دراوێک بە جیا و بە ڕوونی پیشان دەدەن.',
          'Pano toplamları ve grafikler her para birimini ayrı ve net şekilde özetler.',
          'Les totaux et graphiques résument chaque devise avec clarté.',
          'Los totales y tendencias resumen cada moneda de forma clara y precisa.'
        ),
      ],
      actionLabel: pick('Add Debt Record', 'إضافة سجل دين', 'تۆمارکردنی قەرز', 'Kayıt Ekle', 'Ajouter un prêt', 'Agregar Registro'),
      actionHandler: onOpenAddLoan,
    },
    {
      icon: Archive,
      title: pick(
        '2. Archive, Transaction Ledger & 6 Languages',
        '٢. الأرشيف وسجل المعاملات واللغات الست',
        '2. ئەرشیف، تۆماری مامەڵەکان و ٦ زمان',
        '2. Arşiv, İşlem Defteri ve 6 Dil',
        '2. Archives, Journal & 6 Langues',
        '2. Archivo, Libro de Movimientos y 6 Idiomas'
      ),
      badge: 'EN, AR, KD, TR, FR, ES',
      summary: pick(
        'Settled records move automatically into your Archive while every repayment is logged in the Transaction Ledger.',
        'تنتقل الديون المسددة تلقائياً إلى الأرشيف مع توثيق كل حركة في سجل المعاملات.',
        'قەرزە پاکتاوکراوەکان خۆکار دەچنە ناو ئەرشیف و هەموو دانەوەیەک لە تۆماری مامەڵەکاندا هەڵدەگیرێت.',
        'Kapanan kayıtlar otomatik olarak Arşive taşınır ve tüm ödemeler İşlem Defterine kaydedilir.',
        'Les prêts réglés rejoignent l’Archive et chaque paiement est consigné dans le Journal.',
        'Los registros saldados pasan automáticamente al Archivo mientras cada abono se guarda en Transacciones.'
      ),
      details: [
        pick(
          'Instant language switching across 6 languages directly from the top header bar.',
          'تبديل فوري بين ٦ لغات (العربية، الكردية، الإنجليزية، التركية، الفرنسية، الإسبانية) من الشريط العلوي.',
          'گۆڕینی خێرا لە نێوان ٦ زماندا (کوردی، عەرەبی، ئینگلیزی، تورکی، فەرەنسی، ئیسپانی) لە سەرەوە.',
          'Üst çubuktan 6 dil arasında anında geçiş yapın.',
          'Changement instantané entre 6 langues depuis la barre supérieure.',
          'Cambio instantáneo entre 6 idiomas (EN, AR, KD, TR, FR, ES) desde la barra superior.'
        ),
        pick(
          'Track partial repayments, additional funds, and Visa, Mastercard, or FIB settlements.',
          'دعم السداد الجزئي وإضافة مبالغ جديدة والسداد الدقيق عبر FIB وVisa وMastercard.',
          'تۆمارکردنی دانەوەی بەشەکی، زیادکردنی بڕی قەرز و پارەدان بە FIB و کارت بە شێوەی خێرا.',
          'Kısmi ödemeleri, ek tutarları ve FIB, Visa veya Mastercard ile kapatmaları takip edin.',
          'Suivez les remboursements partiels, ajouts et règlements par carte ou FIB.',
          'Registra pagos parciales, aumentos y liquidaciones por FIB, Visa o Mastercard.'
        ),
        pick(
          'Restore any settled record from Archive back to Active Loans in one tap.',
          'إمكانية استعادة أي سجل من الأرشيف إلى القائمة النشطة بنقرة واحدة.',
          'دەتوانیت هەر تۆمارێک لە ئەرشیفەوە بە یەک کرتە بگەڕێنیتەوە بۆ قەرزە چالاکەکان.',
          'Arşivdeki herhangi bir kaydı tek dokunuşla Aktif Kayıtlara geri alın.',
          'Restaurez tout dossier archivé vers les Prêts Actifs en un clic.',
          'Restaura cualquier registro saldado desde el Archivo a Préstamos Activos en un toque.'
        ),
      ],
      actionLabel: pick('Create Entry', 'إضافة سجل جديد', 'تۆماری نوێ', 'Yeni Kayıt', 'Nouveau dossier', 'Crear Registro'),
      actionHandler: onOpenAddLoan,
    },
    {
      icon: Calendar,
      title: pick(
        '3. Due Dates & Streamlined Alerts',
        '٣. مواعيد الاستحقاق والتنبيهات المنظمة',
        '3. بەرواری دانەوە و ئاگادارکردنەوەکان',
        '3. Vade Tarihleri ve Düzenli Uyarılar',
        '3. Échéances & Alertes Ciblées',
        '3. Vencimientos y Alertas Claras'
      ),
      badge: pick('Due Date Tracking', 'تنبيه استحقاق ذكي', 'چاودێری کاتی دانەوە', 'Vade Takibi', 'Suivi des échéances', 'Control de Vencimientos'),
      summary: pick(
        'Set exact due dates using the clean calendar picker with a single actionable alert per critical loan.',
        'تحديد موعد استحقاق مخصص لكل دين مع منتقي تقويم أنيق وتنبيهات واضحة بدون إزعاج.',
        'بەرواری دانەوە بۆ هەر قەرزێک دیاری بکە لەگەڵ ئاگادارکردنەوەیەکی ڕوون و بێ دووبارەبوونەوە.',
        'Takvim seçici ile net vade tarihleri belirleyin ve her kritik kayıt için tek bir uyarı alın.',
        'Définissez des échéances précises avec une alerte claire et sans doublon.',
        'Define fechas límite exactas con el selector de calendario y una alerta clara por préstamo crítico.'
      ),
      details: [
        pick(
          'Fast deadline presets (+7d, End of Month, Payday) with optional exact time.',
          'اختيارات سريعة للموعد (+٧ أيام، نهاية الشهر، يوم الراتب) مع وقت اختياري.',
          'هەڵبژاردنی خێرا بۆ بەروار (+٧ ڕۆژ، کۆتایی مانگ، ڕۆژی مووچە) لەگەڵ کاتی دیاریکراو.',
          'Hızlı vade kısayolları (+7 gün, Ay Sonu, Maaş Günü) ve isteğe bağlı saat seçimi.',
          'Raccourcis rapides (+7 j, Fin du mois, Jour de paie) avec heure optionnelle.',
          'Atajos rápidos (+7d, Fin de mes, Día de pago) con hora opcional.'
        ),
        pick(
          'Focused due-today alert banner anchored at the top of the Active Loans dashboard.',
          'شريط تنبيه موحد أعلى لوحة الديون النشطة للديون المستحقة اليوم.',
          'لە سەرەوەی داشبۆرد ئەو قەرزانە پیشان دەدرێن کە ئەمڕۆ وادەی دانەوەیانە.',
          'Bugün vadesi dolan kayıtlar için Aktif Kayıtlar panelinin üstünde odaklanmış uyarı çubuğu.',
          'Bandeau d’alerte dédié en haut du tableau de bord pour les échéances du jour.',
          'Aviso enfocado de vencimientos de hoy en la parte superior del panel activo.'
        ),
        pick(
          'One deduplicated alert per loan in the Notification Center—tap to open and edit.',
          'تنبيه واحد مجمّع بدون تكرار في مركز الإشعارات، واضغط للانتقال مباشرة للتعديل.',
          'تەنها یەک ئاگاداری پوخت بۆ هەر قەرزێک لە ناوەندی ئاگادارکردنەوەکاندا.',
          'Bildirim Merkezinde her borç için tek bir özet uyarı; düzenlemek için dokunun.',
          'Une alerte unique par prêt dans le Centre de notifications — touchez pour modifier.',
          'Una alerta única por préstamo en el Centro de Notificaciones; toca para editar.'
        ),
      ],
      actionLabel: pick('Add Loan Record', 'إضافة دين جديد', 'زیادکردنی قەرز', 'Borç Ekle', 'Ajouter un prêt', 'Agregar Préstamo'),
      actionHandler: onOpenAddLoan,
    },
    {
      icon: Bell,
      title: pick(
        '4. Cloud Account Sync & Custom Profile',
        '٤. حسابك السحابي وملفك الشخصي',
        '4. هەژماری هەوری و پرۆفایلی تایبەت',
        '4. Bulut Hesabı ve Özel Profil',
        '4. Compte Cloud & Profil Personnalisé',
        '4. Cuenta en la Nube y Perfil'
      ),
      badge: 'Google / Email Sync',
      summary: pick(
        'Sign in with Google or email to back up your loans, archive, and preferences across devices.',
        'سجّل الدخول بحساب جوجل لمزامنة ديونك وإعداداتك تلقائياً وتخصيص ملفك الشخصي.',
        'بە Google یان ئیمەیڵ بچۆ ژوورەوە بۆ هەڵگرتنی قەرز و ئەرشیف و پرۆفایلەکەت لە هەوردا.',
        'Kayıtlarınızı ve ayarlarınızı cihazlar arasında eşitlemek için Google veya e-posta ile giriş yapın.',
        'Connectez-vous via Google ou e-mail pour synchroniser vos dossiers sur le cloud.',
        'Inicia sesión con Google o correo para respaldar tus préstamos, archivo y preferencias.'
      ),
      details: [
        pick(
          'Customize your avatar with inline cropping, display name, optional username, FIB IBAN, and bio.',
          'تخصيص الصورة الشخصية مع القص، الاسم، اسم المستخدم الاختياري، IBAN مصرف FIB والنبذة.',
          'دانان و بڕینی وێنەی پرۆفایل، ناو، ناوی بەکارهێنەری دڵخوازانە، FIB IBAN و زانیاری کەسی.',
          'Profil fotoğrafınızı kırpın, adınızı, isteğe bağlı kullanıcı adınızı, FIB IBAN bilginizi düzenleyin.',
          'Personnalisez votre avatar, nom, identifiant optionnel, IBAN FIB et bio.',
          'Personaliza tu avatar con recorte, nombre, usuario opcional, IBAN FIB y biografía.'
        ),
        pick(
          'Switch cleanly between 5 curated themes inside the Settings drawer.',
          'خمس ثيمات مصممة بعناية مع تبديل مرن من قائمة الإعدادات.',
          'گۆڕینی خێرا لە نێوان ٥ ڕووکاری ناوازەدا لە بەشی ڕێکخستنەکان.',
          'Ayarlar çekmecesinden özenle tasarlanmış 5 tema arasında geçiş yapın.',
          'Passez facilement entre 5 thèmes soignés dans les Réglages.',
          'Cambia fácilmente entre 5 temas elegantes desde Ajustes o el menú lateral.'
        ),
        pick(
          'Export portable JSON backups or CSV ledgers at any time.',
          'نسخ احتياطي واستيراد فوري بصيغة JSON وتصدير CSV في أي وقت.',
          'دەرهێنانی خشتەی CSV و چاپکردنی ڕاپۆرتی PDF یان پاراستنی JSON لە هەر کاتێکدا.',
          'İstediğiniz zaman taşınabilir JSON yedekleri veya CSV tabloları dışa aktarın.',
          'Exportez vos sauvegardes JSON ou tableaux CSV à tout moment.',
          'Exporta copias JSON portables o tablas CSV en cualquier momento.'
        ),
      ],
    },
    {
      icon: Bot,
      title: pick(
        '5. Ai Budget & Receipt Scanner',
        '٥. Ai Budget وقارئ الفواتير',
        '5. Ai Budget و خوێنەری پسوولە',
        '5. Ai Budget ve Fatura Tarayıcı',
        '5. Ai Budget & Lecteur de Reçus',
        '5. Ai Budget y Escáner de Recibos'
      ),
      badge: 'Multilingual AI',
      summary: pick(
        'A multilingual assistant that answers financial questions, updates your ledger via natural language, and reads bills.',
        'مساعد مالي متعدد اللغات يجيب عن استفساراتك، يحدث الدفتر بالأوامر النصية، ويحلل الفواتير.',
        'یاریدەدەرێکی زیرەکی فرەزمانە کە وەڵامی پرسیارە داراییەکانت دەداتەوە و وێنەی پسوولەکان دەخوێنێتەوە.',
        'Finansal sorularınızı yanıtlayan, doğal dille defterinizi güncelleyen ve faturaları okuyan akıllı asistan.',
        'Un assistant multilingue qui répond à vos questions financières et analyse vos reçus.',
        'Un asistente multilingüe que responde dudas financieras, actualiza tu libro y analiza recibos.'
      ),
      details: [
        pick(
          'Detects the language of your prompt and replies naturally in the same language across all 6 languages.',
          'يفهم الأسئلة باللغات الست ويجيب بنفس لغة سؤالك تلقائياً.',
          'بە هەر ٦ زمانەکە پرسیارەکانت تێدەگات و بە هەمان زمان وەڵامت دەداتەوە.',
          'Sorunuzun dilini 6 dil arasında algılar ve aynı dilde doğal şekilde yanıtlar.',
          'Détecte votre langue parmi les 6 langues et répond naturellement.',
          'Detecta tu idioma entre los 6 idiomas y responde de forma natural en el mismo.'
        ),
        pick(
          'Attach receipts or invoices to extract loan details and save in one tap.',
          'أرفق صورة فاتورة لاستخراج تفاصيل الدين وإضافته بنقرة واحدة.',
          'وێنەی پسوولەیەک هاوپێچ بکە بۆ خوێندنەوەی بڕە پارە و تۆمارکردنی بە یەک کرتە.',
          'Borç detaylarını çıkarıp tek dokunuşla kaydetmek için makbuz veya fatura ekleyin.',
          'Joignez un reçu pour extraire les détails et enregistrer en un clic.',
          'Adjunta recibos o facturas para extraer datos y guardarlos en un toque.'
        ),
        pick(
          'Clear or start fresh sessions anytime via the top toolbar controls.',
          'زر مسح المحادثة لتنظيف الجلسة أو بدء جلسة جديدة في أي وقت.',
          'دەتوانیت لە هەر کاتێکدا وتووێژێکی نوێ دەستپێبکەیت یان مێژووەکە بسڕیتەوە.',
          'Üst araç çubuğundan istediğiniz zaman sohbeti temizleyin veya yeni oturum başlatın.',
          'Effacez ou démarrez une nouvelle session à tout moment depuis la barre supérieure.',
          'Limpia o inicia una sesión nueva en cualquier momento desde la barra superior.'
        ),
      ],
      actionLabel: pick('Open Ai Budget', 'فتح Ai Budget', 'کردنەوەی Ai Budget', 'Ai Budget Aç', 'Ouvrir Ai Budget', 'Abrir Ai Budget'),
      actionHandler: openAiHandler,
    },
  ];

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-organic-enter ${
        isLight ? 'bg-slate-900/45' : 'bg-black/80'
      }`}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight
            ? isNordic
              ? 'bg-[#F5FAFF] border-sky-200 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FDF4FA]'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Minimalist Clean Header */}
        <div
          className={`relative w-full p-5 sm:p-6 shrink-0 border-b ${
            isLight
              ? isNordic
                ? 'bg-gradient-to-br from-[#EAF2FB] to-[#F5FAFF] border-sky-200'
                : 'bg-gradient-to-br from-slate-50 to-white border-slate-200'
              : isVelvetPink
              ? 'bg-gradient-to-br from-[#170D1B] via-[#1F1224] to-[#2A1530] border-[#E8B4A0]/20'
              : 'bg-gradient-to-br from-slate-950 via-[#0D1424] to-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/20 border-[#FF65B5]/35 text-[#FF65B5]'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <BookOpen className="w-5 h-5" strokeWidth={1.65} glow="accent" />
              </div>
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold mb-1 ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.65} />
                  <span>{pick('Interactive App Guide', 'دليل الاستخدام الشامل', 'ڕێبەری بەکارهێنان', 'Etkileşimli Rehber', 'Guide Interactif', 'Guía Interactiva')}</span>
                </span>
                <h2
                  id="tutorial-modal-title"
                  className={`text-lg sm:text-xl font-extrabold truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {translations.tutorialTitle}
                </h2>
                <p className={`text-xs line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {translations.tutorialSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 active:scale-[0.98] ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-4 h-4" strokeWidth={1.65} />
            </button>
          </div>
        </div>

        {/* Step Carousel Navigation Tabs */}
        <div
          className={`flex border-b overflow-x-auto shrink-0 p-2 gap-1.5 ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#E6F1FC]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#140B18]/75'
              : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          {steps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`smooth-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                activeStep === idx
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/25 text-[#FF9ED0] border border-[#FF65B5]/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className="font-numeric">{idx + 1}.</span>
              <span>{s.title.split('.')[1] || s.title}</span>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/20 border-[#FF65B5]/35 text-[#FF65B5]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <StepIcon className="w-6 h-6" strokeWidth={1.65} glow="accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {current.title}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-slate-100 text-emerald-700 border-slate-300'
                      : isVelvetPink
                      ? 'bg-[#140B18] text-[#FF9ED0] border-[#E8B4A0]/25'
                      : 'bg-slate-800 text-emerald-400 border-slate-700'
                  }`}
                >
                  {current.badge}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : isVelvetPink ? 'text-[#E8C5D8]' : 'text-slate-300'}`}>
                {current.summary}
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isLight
                ? isNordic
                  ? 'bg-[#EDF5FD] border-sky-200'
                  : 'bg-slate-50 border-slate-200'
                : isVelvetPink
                ? 'bg-[#140B18]/75 border-[#E8B4A0]/20'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {pick('Key Highlights & Tips:', 'أهم المزايا والخطوات:', 'خاڵە گرنگەکان:', 'Öne Çıkan Özellikler:', 'Points Clés & Astuces :', 'Puntos Clave y Consejos:')}
            </h4>
            <ul className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {current.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-400'}`} strokeWidth={1.65} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#E6F1FC]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.65} /> : <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.65} />}
              <span>{pick('Previous', 'السابق', 'پێشوو', 'Önceki', 'Précédent', 'Anterior')}</span>
            </button>
            <span data-numeric="true" className="text-xs font-numeric text-slate-500">
              {activeStep + 1} / {steps.length}
            </span>
            <button
              type="button"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{pick('Next', 'التالي', 'دواتر', 'Sonraki', 'Suivant', 'Siguiente')}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.65} /> : <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.65} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {current.actionHandler && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  current.actionHandler?.();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                {current.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {pick('Got it', 'إغلاق الدليل', 'تێگەیشتم', 'Anladım', 'Compris', 'Entendido')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
