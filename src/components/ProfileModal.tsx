import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Clock,
  Cloud,
  Copy,
  Crop,
  Landmark,
  QrCode,
  RotateCw,
  Share,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
  ZoomIn,
} from './OrganicIcons';
import { RealFibQrCode } from './RealFibQrCode';
import { Language, ThemeMode, UserSettings } from '../types';
import {
  buildFibPaymentQrPayload,
  calculateAvatarCropRect,
  checkUsernameChangeEligibility,
  formatFibIbanOrAccount,
  formatUsernameCooldownDate,
  getTodayIsoDate,
  isLightThemeMode,
  normalizeThemeMode,
  sanitizeProfileSettingsPatch,
  validateProfileFibAccount,
  validateProfileUsername,
} from '../utils/loanLogic';
import { CloudSyncStatus } from '../firebase';

export interface ProfileSaveResult {
  blocked?: boolean;
  reason?: 'cooldown' | 'taken';
  availableAtIso?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (
    newSettings: Partial<UserSettings>
  ) => ProfileSaveResult | Promise<ProfileSaveResult | void> | void;
  language: Language;
  themeMode?: ThemeMode;
  authUserEmail?: string | null;
  cloudSyncStatus?: CloudSyncStatus;
  stats: {
    activeCount: number;
    archivedCount: number;
    transactionsCount: number;
  };
  onCheckUsernameAvailable?: (username: string) => Promise<boolean> | boolean;
  onOpenAuth?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  language,
  themeMode = 'obsidian_neon',
  authUserEmail = null,
  cloudSyncStatus = 'local',
  stats,
  onCheckUsernameAvailable,
  onOpenAuth,
  onShowToast,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const activeTheme = normalizeThemeMode(themeMode);
  const isLight = isLightThemeMode(activeTheme);
  const isNordic = activeTheme === 'nordic_frost';
  const isGold = activeTheme === 'midnight_gold';
  const isVelvetPink = activeTheme === 'velvet_pink';

  const [displayName, setDisplayName] = useState(settings.profileName || '');
  const [username, setUsername] = useState(settings.profileUsername || '');
  const [bio, setBio] = useState(settings.profileBio || '');
  const [fibAccount, setFibAccount] = useState(
    settings.profileFibAccount ? formatFibIbanOrAccount(settings.profileFibAccount) : ''
  );
  const [avatarPreview, setAvatarPreview] = useState(settings.profileAvatar || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [fibError, setFibError] = useState<string | null>(null);
  const [cooldownWarning, setCooldownWarning] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedBadgeField, setCopiedBadgeField] = useState<'iban' | 'qr' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Interactive Avatar Cropper state
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1.15);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; basePanX: number; basePanY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    basePanX: 0,
    basePanY: 0,
  });

  const wasOpenRef = useRef(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  // Sync local form state only when modal transitions open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setDisplayName(settings.profileName || '');
      setUsername(settings.profileUsername || '');
      setBio(settings.profileBio || '');
      setFibAccount(settings.profileFibAccount ? formatFibIbanOrAccount(settings.profileFibAccount) : '');
      setAvatarPreview(settings.profileAvatar || '');
      setUsernameError(null);
      setFibError(null);
      setCooldownWarning(null);
      setStatusNotice(null);
      setIsSaving(false);
      setCropSourceUrl(null);
      setLoadedImage(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, settings.profileName, settings.profileUsername, settings.profileBio, settings.profileFibAccount, settings.profileAvatar]);

  // Load selected image into Image element for canvas cropping
  useEffect(() => {
    if (!cropSourceUrl) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setLoadedImage(img);
    };
    img.src = cropSourceUrl;
  }, [cropSourceUrl]);

  // Render live cropped preview inside 200x200 canvas
  const drawCroppedToCanvas = (canvas: HTMLCanvasElement, img: HTMLImageElement, outputSize: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = outputSize;
    canvas.height = outputSize;
    ctx.clearRect(0, 0, outputSize, outputSize);

    // Handle rotation around source center by drawing rotated source onto an intermediate canvas
    const rad = (cropRotation * Math.PI) / 180;
    const isQuarterTurn = cropRotation % 180 !== 0;
    const rotW = isQuarterTurn ? img.naturalHeight || img.height : img.naturalWidth || img.width;
    const rotH = isQuarterTurn ? img.naturalWidth || img.width : img.naturalHeight || img.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, rotW);
    tempCanvas.height = Math.max(1, rotH);
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.translate(rotW / 2, rotH / 2);
    tCtx.rotate(rad);
    tCtx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);

    const rect = calculateAvatarCropRect(rotW, rotH, cropZoom, cropPanX, cropPanY);
    ctx.drawImage(tempCanvas, rect.sx, rect.sy, rect.sSize, rect.sSize, 0, 0, outputSize, outputSize);
  };

  useEffect(() => {
    if (loadedImage && previewCanvasRef.current) {
      drawCroppedToCanvas(previewCanvasRef.current, loadedImage, 220);
    }
  });

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUsernameError(pick('Please select a valid image file.', 'يرجى اختيار ملف صورة صالح.', 'تکایە وێنەیەکی دروست هەڵبژێرە.', 'Geçerli bir resim seçin.', 'Veuillez sélectionner une image valide.', 'Por favor, selecciona un archivo de imagen válido.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        setCropSourceUrl(dataUrl);
        setCropZoom(1.15);
        setCropPanX(0);
        setCropPanY(0);
        setCropRotation(0);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyCrop = () => {
    if (!loadedImage) return;
    const exportCanvas = document.createElement('canvas');
    drawCroppedToCanvas(exportCanvas, loadedImage, 256);
    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.86);
    setAvatarPreview(dataUrl);
    setCropSourceUrl(null);
    setLoadedImage(null);
  };

  const formatCooldownMessage = (availableAtInput: string | number) => {
    const formattedDate = formatUsernameCooldownDate(availableAtInput, language);
    return pick(
      `Usernames can only be changed once every 7 days. Next change available on ${formattedDate}.`,
      `يمكن تغيير اسم المستخدم مرة واحدة كل ٧ أيام فقط. التغيير القادم متاح في ${formattedDate}.`,
      `ناوی بەکارهێنەر تەنها هەر ٧ ڕۆژ جارێک دەگۆڕدرێت. گۆڕینی داهاتوو لە ${formattedDate} بەردەست دەبێت.`,
      `Kullanıcı adı 7 günde bir değiştirilebilir. Bir sonraki değişiklik: ${formattedDate}.`,
      `Le nom d'utilisateur ne peut être modifié que tous les 7 jours. Prochain changement disponible le ${formattedDate}.`,
      `El nombre de usuario solo se puede cambiar cada 7 días. Próximo cambio disponible el ${formattedDate}.`
    );
  };

  // Detect active cooldown state for helper badge (using a synthetic sentinel probe)
  const cooldownStatus = settings.lastUsernameChangeDate
    ? checkUsernameChangeEligibility({
        currentUsername: settings.profileUsername || '__unset__',
        nextUsername: '__probe_check__',
        lastUsernameChangeDate: settings.lastUsernameChangeDate,
      })
    : null;
  const isUsernameInCooldown = Boolean(cooldownStatus && !cooldownStatus.allowed && cooldownStatus.availableAtIso);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const validation = validateProfileUsername(username);
    if (!validation.valid) {
      setCooldownWarning(null);
      if (validation.reason === 'too_short') {
        setUsernameError(
          pick(
            'Username must be at least 3 characters (letters, numbers, underscores).',
            'اسم المستخدم يجب أن لا يقل عن 3 أحرف (حروف وأرقام وشرطة سفلية).',
            'ناوی بەکارهێنەر دەبێت لانیکەم ٣ پیت بێت (پیت، ژمارە، _).',
            'Kullanıcı adı en az 3 karakter olmalıdır.',
            "Le nom d'utilisateur doit comporter au moins 3 caractères.",
            'El nombre de usuario debe tener al menos 3 caracteres (letras, números, guiones bajos).'
          )
        );
      } else {
        setUsernameError(
          pick(
            'Username supports only letters, numbers, and underscores (e.g., user123, lanya_2026).',
            'اسم المستخدم يدعم الحروف والأرقام والشرطة السفلية فقط (مثل user123).',
            'ناوی بەکارهێنەر تەنها پیت، ژمارە و _ وەردەگرێت (بۆ نموونە lanya_2026).',
            'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) destekler.',
            'Uniquement lettres, chiffres et underscores (ex: user123).',
            'Solo se admiten letras, números y guiones bajos (ej: user123, lanya_2026).'
          )
        );
      }
      return;
    }

    // Enforce 7-day username modification cooldown rule
    const eligibility = checkUsernameChangeEligibility({
      currentUsername: settings.profileUsername || '',
      nextUsername: validation.normalized,
      lastUsernameChangeDate: settings.lastUsernameChangeDate,
    });

    if (!eligibility.allowed && eligibility.availableAtIso) {
      setStatusNotice(null);
      setUsernameError(null);
      setCooldownWarning(formatCooldownMessage(eligibility.availableAtIso));
      return;
    }

    const fibValidation = validateProfileFibAccount(fibAccount);
    if (!fibValidation.valid) {
      setStatusNotice(null);
      setFibError(
        pick(
          'Enter a valid Iraqi FIB IBAN (e.g. IQ98 FIRA 0000 1004 8291 037) or 8–16 digit FIB account number, or leave blank.',
          'أدخل رقم IBAN صحيحاً لمصرف العراق الأول (مثل IQ98 FIRA...) أو رقم حساب من ٨ إلى ١٦ رقماً، أو اتركه فارغاً.',
          'ژمارەی IBANـی دروستی FIB (وەک IQ98 FIRA...) یان هەژماری ٨-١٦ ژمارە بنووسە، یان بە بەتاڵی جێیبهێڵە.',
          'Geçerli bir FIB IBAN (IQ...) veya 8-16 haneli hesap numarası girin ya da boş bırakın.',
          'Saisissez un IBAN FIB valide (IQ...) ou un numéro de compte à 8–16 chiffres, ou laissez vide.',
          'Ingresa un IBAN FIB válido (ej. IQ98 FIRA...) o un número de cuenta de 8–16 dígitos, o déjalo vacío.'
        )
      );
      return;
    }

    setUsernameError(null);
    setFibError(null);
    setCooldownWarning(null);
    setStatusNotice(null);
    const takenMsg = pick(
      'This username is already taken. Please choose another.',
      'اسم المستخدم هذا مأخوذ بالفعل. يرجى اختيار اسم آخر.',
      'ئەم ناوی بەکارهێنەرە پێشتر گیراوە. تکایە ناوێکی تر هەڵبژێرە.',
      'Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seçin.',
      "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.",
      'Este nombre de usuario ya está en uso. Por favor, elige otro.'
    );

    const joinedAt = settings.profileJoinedAt || getTodayIsoDate();
    const sanitizedPatch = sanitizeProfileSettingsPatch({
      profileName: displayName,
      profileUsername: validation.normalized,
      profileBio: bio,
      profileAvatar: avatarPreview,
      profileJoinedAt: joinedAt,
      profileFibAccount: fibValidation.normalized,
      ...(eligibility.changed && eligibility.nextChangeDateIso
        ? { lastUsernameChangeDate: eligibility.nextChangeDateIso }
        : {}),
    });

    setIsSaving(true);
    try {
      if (eligibility.changed && validation.normalized && onCheckUsernameAvailable) {
        const available = await onCheckUsernameAvailable(validation.normalized);
        if (!available) {
          setUsernameError(takenMsg);
          return;
        }
      }

      const saveResult = await onUpdateSettings(sanitizedPatch);
      if (saveResult && saveResult.blocked) {
        if (saveResult.reason === 'cooldown' && saveResult.availableAtIso) {
          setCooldownWarning(formatCooldownMessage(saveResult.availableAtIso));
        } else if (saveResult.reason === 'taken') {
          setUsernameError(takenMsg);
        }
        return;
      }

      const savedMsg = pick(
        'Profile updated successfully!',
        'تم تحديث الملف الشخصي بنجاح!',
        'پرۆفایل بەسەرکەوتوویی نوێکرایەوە!',
        'Profil başarıyla güncellendi!',
        'Profil mis à jour avec succès !',
        '¡Perfil actualizado con éxito!'
      );
      setStatusNotice(savedMsg);
      onShowToast?.(savedMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const liveFibValidation = validateProfileFibAccount(fibAccount);
  const liveFibQrPayload = liveFibValidation.valid && liveFibValidation.normalized
    ? buildFibPaymentQrPayload({ fibAccount: liveFibValidation.normalized, currency: 'IQD' })
    : '';

  const copyBadgeText = async (text: string, field: 'iban' | 'qr', toastText: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedBadgeField(field);
      onShowToast?.(toastText);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => setCopiedBadgeField((curr) => (curr === field ? null : curr)), 2000);
    } catch {
      // ignore clipboard denial in sandboxed browsers
    }
  };

  const handleShareProfileFibQr = async () => {
    if (!liveFibQrPayload) return;
    const shareTitle = displayName.trim()
      ? `${displayName.trim()} — First Iraqi Bank (FIB)`
      : 'First Iraqi Bank (FIB) Payment Details';
    const shareText = `${shareTitle}\nIBAN / Account: ${liveFibValidation.formatted}\nQR Link: ${liveFibQrPayload}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: liveFibQrPayload,
        });
        return;
      } catch {
        // user canceled or share unavailable; fall back to clipboard copy
      }
    }
    await copyBadgeText(
      shareText,
      'qr',
      pick(
        'FIB QR & IBAN copied to clipboard for sharing!',
        'تم نسخ رمز QR ورقم الآيبان للمشاركة!',
        'کۆدی QR و IBAN کۆپیکران بۆ هاوبەشکردن!',
        'FIB QR ve IBAN paylaşım için kopyalandı!',
        'QR FIB & IBAN copiés pour partage !',
        '¡QR FIB e IBAN copiados para compartir!'
      )
    );
  };

  const initials = (displayName || username || authUserEmail || 'U').trim().slice(0, 2).toUpperCase();
  const memberSince = settings.profileJoinedAt || getTodayIsoDate();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/45' : 'bg-black/80'
      }`}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        data-testid="profile-settings-view"
        className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-[#F4F8FD]/98 border-sky-200 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FFF5FA]'
            : 'bg-[#0D121F]/95 border-white/[0.1] text-slate-100'
        }`}
      >
        {/* Top Bar */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200/80 bg-[#EAF2FB]/90'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/85'
              : 'border-white/[0.07] bg-[#080B11]/85'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isGold
                  ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : isNordic
                  ? 'bg-sky-500/15 border-sky-400/40 text-sky-700'
                  : isLight
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <UserIcon glow="accent" className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className={`text-base font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {pick('Profile & Account', 'الملف الشخصي والحساب', 'پرۆفایل و هەژمار', 'Profil ve Hesap', 'Profil & Compte', 'Perfil y Cuenta')}
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick('Avatar, handle, bio & account overview', 'الصورة، الاسم، النبذة وتفاصيل الحساب', 'وێنە، ناوی بەکارهێنەر، بایۆ و زانیاری', 'Avatar, kullanıcı adı ve hesap bilgileri', 'Avatar, identifiant, bio et détails', 'Avatar, usuario, bio y resumen de cuenta')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={pick('Close Profile', 'إغلاق الملف الشخصي', 'داخستنی پرۆفایل', 'Profili Kapat', 'Fermer le profil', 'Cerrar perfil')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-200/70 hover:bg-slate-300/80 text-slate-700'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Form & Metadata Body */}
        <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 scrollbar-thin">

          {/* 1. Avatar Upload & Crop Studio */}
          <section className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center font-black text-lg tracking-wide shadow-md ${
                    isGold
                      ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                      : isNordic
                      ? 'border-sky-400 bg-sky-100 text-sky-900'
                      : isLight
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={displayName || 'Profile avatar'}
                      data-testid="profile-avatar-img"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span data-testid="profile-avatar-initials">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={pick('Upload avatar image', 'رفع صورة شخصية', 'هەڵبژاردنی وێنە', 'Fotoğraf yükle', 'Téléverser un avatar', 'Subir imagen de avatar')}
                  className={`absolute -bottom-1 -end-1 w-8 h-8 rounded-full border flex items-center justify-center shadow-md cursor-pointer smooth-interactive active:scale-95 ${
                    isGold
                      ? 'bg-amber-500 border-amber-200 text-slate-950'
                      : isVelvetPink
                      ? 'bg-[#FF2E93] border-[#E8B4A0]/60 text-white'
                      : isNordic
                      ? 'bg-sky-600 border-white text-white'
                      : 'bg-emerald-500 border-white/40 text-slate-950'
                  }`}
                >
                  <Camera glow="accent" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {pick('Profile Photo', 'الصورة الشخصية', 'وێنەی پرۆفایل', 'Profil Fotoğrafı', 'Photo de profil', 'Foto de perfil')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="profile-avatar-upload"
                    data-testid="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-slate-200'
                    }`}
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>{pick('Upload & Crop', 'رفع وقص الصورة', 'بارکردن و بڕین', 'Yükle ve Kırp', 'Importer & Recadrer', 'Subir y Recortar')}</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      data-testid="remove-avatar-btn"
                      onClick={() => setAvatarPreview('')}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                        isLight
                          ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 text-rose-300'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{pick('Remove', 'إزالة', 'لابردن', 'Kaldır', 'Supprimer', 'Eliminar')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Canvas Crop Studio (shown when user picks a file) */}
            {cropSourceUrl && (
              <div
                data-testid="avatar-cropper"
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#080C15] border-emerald-500/35'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-emerald-300'}`}>
                    <Crop className="w-3.5 h-3.5" />
                    <span>{pick('Drag to frame & zoom', 'اسحب لتحديد القص والتكبير', 'بیکێشە و زوومی بکە', 'Konumlandır ve yakınlaştır', 'Glissez pour recadrer', 'Arrastra para encuadrar y hacer zoom')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCropRotation((r) => (r + 90) % 360)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-white/[0.06] border-white/[0.1] text-slate-200 hover:bg-white/[0.12]'
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{pick('Rotate', 'تدوير', 'سوڕاندن', 'Döndür', 'Pivoter', 'Girar')}</span>
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative w-[220px] h-[220px] rounded-full overflow-hidden border-2 border-emerald-400 shadow-lg touch-none cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={(ev) => {
                      (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
                      dragStateRef.current = {
                        active: true,
                        startX: ev.clientX,
                        startY: ev.clientY,
                        basePanX: cropPanX,
                        basePanY: cropPanY,
                      };
                    }}
                    onPointerMove={(ev) => {
                      if (!dragStateRef.current.active) return;
                      const dx = (ev.clientX - dragStateRef.current.startX) / 90;
                      const dy = (ev.clientY - dragStateRef.current.startY) / 90;
                      setCropPanX(Math.max(-1, Math.min(1, dragStateRef.current.basePanX + dx)));
                      setCropPanY(Math.max(-1, Math.min(1, dragStateRef.current.basePanY + dy)));
                    }}
                    onPointerUp={() => {
                      dragStateRef.current.active = false;
                    }}
                  >
                    <canvas ref={previewCanvasRef} className="w-full h-full block" />
                  </div>

                  <div className="w-full flex items-center gap-2.5">
                    <ZoomIn className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      aria-label="Zoom avatar crop"
                      data-testid="avatar-zoom-slider"
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono tabular-nums w-10 text-end">{cropZoom.toFixed(1)}x</span>
                  </div>

                  <div className="w-full flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCropSourceUrl(null);
                        setLoadedImage(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      {pick('Cancel', 'إلغاء', 'پاشگەزبوونەوە', 'İptal', 'Annuler', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      data-testid="apply-crop-btn"
                      onClick={handleApplyCrop}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{pick('Apply Crop', 'اعتماد القص', 'چەسپاندنی بڕین', 'Kırpmayı Uygula', 'Appliquer', 'Aplicar recorte')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. Display Name & Custom Username */}
          <section className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="profile-display-name" className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {pick('Display Name', 'الاسم الظاهر', 'ناوی تەواو', 'Görünen Ad', 'Nom complet', 'Nombre visible')}
              </label>
              <input
                id="profile-display-name"
                data-testid="profile-display-name-input"
                type="text"
                maxLength={120}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={pick('Enter your full or preferred name', 'أدخل اسمك الكامل', 'ناوی خۆت بنووسە', 'Adınızı yazın', 'Votre nom', 'Ingresa tu nombre completo o preferido')}
                className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900/90 border-white/[0.1] focus:border-emerald-400 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="profile-username" className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {pick(
                    'Username (Optional)',
                    'اسم المستخدم (اختياري)',
                    'ناوی بەکارهێنەر (دڵخوازانە)',
                    'Kullanıcı Adı (İsteğe Bağlı)',
                    "Nom d'utilisateur (Optionnel)",
                    'Usuario (Opcional)'
                  )}
                </label>
                {isUsernameInCooldown && cooldownStatus?.availableAtIso && (
                  <span
                    data-testid="username-cooldown-badge"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold font-numeric ${
                      isLight
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {pick('Locked until', 'متاح في', 'بەردەست لە', 'Kilitli:', 'Dispo le', 'Bloqueado hasta')}{' '}
                      {formatUsernameCooldownDate(cooldownStatus.availableAtIso, language)}
                    </span>
                  </span>
                )}
              </div>
              <div className="relative" dir="ltr">
                <span className={`absolute start-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  @
                </span>
                <input
                  id="profile-username"
                  data-testid="profile-username-input"
                  type="text"
                  maxLength={32}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setUsername(nextVal);
                    if (usernameError) setUsernameError(null);
                    const nextCheck = checkUsernameChangeEligibility({
                      currentUsername: settings.profileUsername || '',
                      nextUsername: nextVal,
                      lastUsernameChangeDate: settings.lastUsernameChangeDate,
                    });
                    if (!nextCheck.allowed && nextCheck.availableAtIso) {
                      setCooldownWarning(formatCooldownMessage(nextCheck.availableAtIso));
                    } else if (cooldownWarning) {
                      setCooldownWarning(null);
                    }
                  }}
                  placeholder="lanya_2026"
                  className={`w-full min-h-[42px] ps-8 pe-3.5 py-2 rounded-xl border text-sm font-mono outline-none transition-colors ${
                    usernameError || cooldownWarning
                      ? 'border-amber-500 focus:border-amber-500'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900/90 border-white/[0.1] focus:border-emerald-400 text-white placeholder-slate-500'
                  }`}
                />
              </div>
              {cooldownWarning ? (
                <div
                  role="alert"
                  data-testid="username-cooldown-warning"
                  className={`px-3 py-2 rounded-xl border text-[11px] font-semibold flex items-start gap-2 animate-organic-enter ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-amber-500/15 border-amber-500/35 text-amber-200'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className="leading-snug font-numeric">{cooldownWarning}</span>
                </div>
              ) : usernameError ? (
                <p className="text-[11px] font-semibold text-rose-500" role="alert" data-testid="username-taken-error">
                  {usernameError}
                </p>
              ) : (
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {pick('Supports letters, numbers & underscores (changeable once every 7 days)', 'يدعم الحروف والأرقام والشرطة السفلية (يتغير كل ٧ أيام)', 'پیت، ژمارە و _ پشتگیری دەکرێت (٧ ڕۆژ جارێک دەگۆڕدرێت)', 'Harf, rakam ve alt çizgi (_) desteklenir (7 günde 1 kez)', 'Lettres, chiffres et underscores (modifiable tous les 7 jours)', 'Admite letras, números y guiones bajos (cambiable cada 7 días)')}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-bio" className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {pick('Bio & Details', 'النبذة التعريفية', 'دەربارە / بایۆ', 'Hakkında / Biyografi', 'Bio & Détails', 'Biografía y Detalles')}
                </label>
                <span className={`text-[11px] font-numeric tabular-nums ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {bio.length}/300
                </span>
              </div>
              <textarea
                id="profile-bio"
                data-testid="profile-bio-input"
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={pick(
                  'Share a brief note about your budget goals or business...',
                  'اكتب نبذة مختصرة عن أهدافك المالية أو عملك...',
                  'کورتەیەک لەسەر خۆت یان ئامانجە داراییەکانت بنووسە...',
                  'Finansal hedefleriniz hakkında kısa bir not...',
                  'Ajoutez une courte note sur vos objectifs...',
                  'Comparte una breve nota sobre tus metas financieras o negocio...'
                )}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed outline-none resize-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900/90 border-white/[0.1] focus:border-emerald-400 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Optional First Iraqi Bank (FIB) Account / IBAN Binding */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="profile-fib-account" className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Landmark className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span>
                    {pick(
                      'FIB Account / IBAN (Optional)',
                      'حساب FIB / الآيبان (اختياري)',
                      'هەژماری FIB / IBAN (دڵخوازانە)',
                      'FIB Hesabı / IBAN (İsteğe Bağlı)',
                      'Compte FIB / IBAN (Optionnel)',
                      'Cuenta FIB / IBAN (Opcional)'
                    )}
                  </span>
                </label>
                {fibAccount.trim() && validateProfileFibAccount(fibAccount).valid && (
                  <span
                    data-testid="profile-fib-valid-badge"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{pick('FIB Verified', 'حساب FIB موثق', 'FIB پشتڕاستکراوە', 'FIB Doğrulandı', 'FIB Vérifié', 'FIB Verificado')}</span>
                  </span>
                )}
              </div>
              <div className="relative" dir="ltr">
                <input
                  id="profile-fib-account"
                  data-testid="profile-fib-account-input"
                  dir="ltr"
                  type="text"
                  maxLength={34}
                  value={fibAccount}
                  onChange={(e) => {
                    setFibAccount(formatFibIbanOrAccount(e.target.value));
                    if (fibError) setFibError(null);
                  }}
                  placeholder="IQ98 FIRA 0000 1004 8291 037"
                  className={`w-full min-h-[42px] px-3.5 pe-14 py-2 rounded-xl border text-sm font-mono tabular-nums outline-none transition-colors ${
                    fibError
                      ? 'border-rose-500 focus:border-rose-500'
                      : isLight
                      ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
                      : 'bg-slate-900/90 border-white/[0.1] focus:border-emerald-400 text-white placeholder-slate-500'
                  }`}
                />
                {fibAccount.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setFibAccount('');
                      setFibError(null);
                    }}
                    className={`absolute end-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/[0.08]'
                    }`}
                  >
                    {pick('Clear', 'مسح', 'سڕینەوە', 'Temizle', 'Effacer', 'Borrar')}
                  </button>
                )}
              </div>
              {fibError ? (
                <p className="text-[11px] font-semibold text-rose-500" role="alert" data-testid="profile-fib-error">
                  {fibError}
                </p>
              ) : (
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {pick(
                    'Friends paying you via First Iraqi Bank see this IBAN & scannable QR automatically.',
                    'يظهر رقم الآيبان ورمز QR الخاص بك تلقائياً للأصدقاء عند السداد لك عبر FIB.',
                    'هاوڕێیان لە کاتی پارەداندا لە ڕێگەی FIB ڕاستەوخۆ کۆدی QR و IBANـەکەت دەبینن.',
                    'Size FIB ile ödeme yapan arkadaşlar IBAN ve QR kodunuzu otomatik görür.',
                    'Vos amis qui vous règlent via FIB voient automatiquement votre IBAN et QR code.',
                    'Quienes te paguen por First Iraqi Bank verán este IBAN y código QR automáticamente.'
                  )}
                </p>
              )}

              {/* Live Scannable My FIB QR Code Badge */}
              {liveFibQrPayload && (
                <div
                  data-testid="profile-fib-qr-card"
                  className={`mt-2.5 p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-3.5 smooth-interactive ${
                    isLight
                      ? 'bg-emerald-50/75 border-emerald-200'
                      : 'bg-[#061829]/85 border-emerald-400/30'
                  }`}
                >
                  <RealFibQrCode
                    value={liveFibQrPayload}
                    size={112}
                    testId="profile-fib-qr-svg"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-2 text-center sm:text-start w-full">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                          isLight ? 'text-emerald-800' : 'text-emerald-400'
                        }`}
                      >
                        <QrCode className="w-3 h-3" />
                        <span>
                          {pick(
                            'My FIB QR Code Badge',
                            'بطاقة رمز FIB QR الخاصة بي',
                            'کۆدی QRـی FIBـی من',
                            'FIB QR Kod Rozetim',
                            'Mon Badge QR FIB',
                            'Mi Insignia QR de FIB'
                          )}
                        </span>
                      </span>
                      <p
                        dir="ltr"
                        data-testid="profile-fib-qr-iban"
                        className={`text-xs font-mono font-bold tabular-nums truncate mt-0.5 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {liveFibValidation.formatted}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <button
                        type="button"
                        data-testid="profile-fib-copy-iban-btn"
                        onClick={() =>
                          copyBadgeText(
                            liveFibValidation.normalized,
                            'iban',
                            pick('IBAN copied!', 'تم نسخ الآيبان!', 'IBAN کۆپیکرا!', 'IBAN kopyalandı!', 'IBAN copié !', '¡IBAN copiado!')
                          )
                        }
                        className={`min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer smooth-interactive ${
                          copiedBadgeField === 'iban'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : isLight
                            ? 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-400/35'
                        }`}
                      >
                        {copiedBadgeField === 'iban' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>
                          {copiedBadgeField === 'iban'
                            ? pick('Copied', 'تم النسخ', 'کۆپیکرا', 'Kopyalandı', 'Copié', 'Copiado')
                            : pick('Copy IBAN', 'نسخ IBAN', 'کۆپی IBAN', 'IBAN Kopyala', 'Copier IBAN', 'Copiar IBAN')}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="profile-fib-copy-qr-btn"
                        onClick={() =>
                          copyBadgeText(
                            liveFibQrPayload,
                            'qr',
                            pick('FIB QR payload copied!', 'تم نسخ رابط QR!', 'بەستەری QR کۆپیکرا!', 'FIB QR bağlantısı kopyalandı!', 'Lien QR copié !', '¡Enlace QR FIB copiado!')
                          )
                        }
                        className={`min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer smooth-interactive ${
                          copiedBadgeField === 'qr'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : isLight
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border-white/15'
                        }`}
                      >
                        {copiedBadgeField === 'qr' ? <Check className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                        <span>{pick('Copy QR Link', 'نسخ رابط QR', 'کۆپی بەستەری QR', 'QR Bağlantısı', 'Copier Lien QR', 'Copiar enlace QR')}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="profile-fib-share-qr-btn"
                        onClick={handleShareProfileFibQr}
                        className={`min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer smooth-interactive ${
                          isLight
                            ? 'bg-[#062238] hover:bg-[#093252] text-emerald-300 border-[#062238]'
                            : 'bg-[#082B47] hover:bg-[#0B395E] text-emerald-300 border-emerald-400/35'
                        }`}
                      >
                        <Share className="w-3 h-3" />
                        <span>{pick('Share', 'مشاركة', 'هاوبەشکردن', 'Paylaş', 'Partager', 'Compartir')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. Clean Account Metadata Overview (Hairline dividers, tabular numerals) */}
          <section
            data-testid="profile-account-metadata"
            className={`pt-3 border-t space-y-2.5 text-xs ${
              isLight ? 'border-slate-200' : 'border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold uppercase tracking-wider text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick('Account Details', 'تفاصيل الحساب', 'وردەکارییەکانی هەژمار', 'Hesap Detayları', 'Détails du compte', 'Detalles de Cuenta')}
              </span>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className={`text-[11px] font-bold hover:underline cursor-pointer ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {authUserEmail
                    ? pick('Manage Cloud Auth', 'إدارة المزامنة', 'بەڕێوەبردنی هەژمار', 'Hesabı Yönet', 'Gérer le compte', 'Gestionar cuenta')
                    : pick('Connect Google / Gmail', 'ربط Google / Gmail', 'بەستنەوە بە Google', 'Google Bağla', 'Connecter Google', 'Conectar Google / Gmail')}
                </button>
              )}
            </div>

            <div className={`divide-y rounded-2xl border ${isLight ? 'divide-slate-200 border-slate-200 bg-slate-50/70' : 'divide-white/[0.06] border-white/[0.08] bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  {pick('Account Mode', 'وضع الحساب', 'جۆری هەژمار', 'Hesap Modu', 'Mode du compte', 'Modo de Cuenta')}
                </span>
                <span className={`font-semibold flex items-center gap-1.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {authUserEmail ? <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span className="truncate">{authUserEmail || pick('Guest / Local Storage', 'محلي على الجهاز', 'میوان (تۆماری ناوخۆیی)', 'Misafir (Yerel)', 'Invité (Local)', 'Invitado / Almacenamiento local')}</span>
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  {pick('Cloud Backup', 'الحالة السحابية', 'هاوکاتکردن', 'Bulut Durumu', 'Synchronisation', 'Copia en la Nube')}
                </span>
                <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {authUserEmail ? cloudSyncStatus : 'local'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  {pick('Member Since', 'تاريخ الإنشاء', 'بەرواری بەشداربوون', 'Üyelik Tarihi', 'Membre depuis', 'Miembro desde')}
                </span>
                <span className={`font-numeric tabular-nums font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {memberSince}
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  {pick('Tracked Portfolio', 'ملخص السجلات', 'تۆمارەکان', 'Kayıt Özeti', 'Portefeuille', 'Resumen de Cartera')}
                </span>
                <span className={`font-numeric tabular-nums font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {stats.activeCount} {pick('Active', 'نشط', 'چالاک', 'Aktif', 'Actifs', 'Activos')} · {stats.archivedCount} {pick('Archived', 'مؤرشف', 'ئەرشیف', 'Arşiv', 'Archivés', 'Archivados')} · {stats.transactionsCount} {pick('Tx', 'حركة', 'مامەڵە', 'İşlem', 'Tx', 'Mov')}
                </span>
              </div>
            </div>
          </section>

          {statusNotice && (
            <div
              role="status"
              data-testid="profile-saved-notice"
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Footer Save / Cancel */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-300'
              }`}
            >
              {pick('Close', 'إغلاق', 'داخستن', 'Kapat', 'Fermer', 'Cerrar')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              data-testid="save-profile-btn"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg smooth-interactive active:scale-95 disabled:opacity-60 ${
                isGold
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : isVelvetPink
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white shadow-[#FF2E93]/30'
                  : isNordic
                  ? 'bg-sky-600 hover:bg-sky-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {pick('Save Profile', 'حفظ الملف الشخصي', 'پاشەکەوتکردنی پرۆفایل', 'Profili Kaydet', 'Enregistrer', 'Guardar Perfil')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
