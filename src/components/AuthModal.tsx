import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudOff,
  CheckCircle2,
  Mail,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  X,
  AlertCircle,
  User as UserIcon,
  UserCheck,
  Edit3,
  AtSign,
} from './OrganicIcons';
import { Language, ThemeMode } from '../types';
import { isLightThemeMode, PersistedAuthUser, validateProfileUsername } from '../utils/loanLogic';
import {
  CloudSyncStatus,
  signInWithGoogleAccount,
  signInWithEmailAccount,
  registerWithEmailAccount,
  resendVerificationEmail,
  signOutAccount,
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  user: User | null;
  isAuthenticated?: boolean;
  currentUser?: PersistedAuthUser | null;
  syncStatus: CloudSyncStatus;
  lastSyncedAt: string | null;
  onManualSync: () => Promise<void>;
  onLogout?: () => Promise<void> | void;
  onShowToast?: (msg: string) => void;
  onLoginSuccess?: (
    user: User,
    options?: { isNewAccount?: boolean; claimedUsername?: string; claimedDisplayName?: string }
  ) => void;
  onCheckUsernameAvailable?: (username: string) => Promise<boolean> | boolean;
  themeMode?: ThemeMode;
  profileName?: string;
  profileUsername?: string;
  profileBio?: string;
  profileAvatar?: string;
  onEditProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  isAuthenticated = false,
  currentUser = null,
  syncStatus,
  lastSyncedAt,
  onManualSync,
  onLogout,
  onShowToast,
  onLoginSuccess,
  onCheckUsernameAvailable,
  themeMode = 'obsidian_neon',
  profileName,
  profileUsername,
  profileBio,
  profileAvatar,
  onEditProfile,
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

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const [authMode, setAuthMode] = useState<'options' | 'email_signin' | 'email_signup'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [usernameTakenError, setUsernameTakenError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const takenUsernameMessage = pick(
    'This username is already taken. Please choose another.',
    'اسم المستخدم هذا مأخوذ بالفعل. يرجى اختيار اسم آخر.',
    'ئەم ناوی بەکارهێنەرە پێشتر گیراوە. تکایە ناوێکی تر هەڵبژێرە.',
    'Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seçin.',
    "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.",
    'Este nombre de usuario ya está en uso. Elige otro.'
  );

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);
    try {
      const signedUser = await signInWithGoogleAccount();
      onShowToast?.(
        isKu
          ? `بەخێربێیت ${signedUser.email || ''}! هاوکاتکردنی هەوری چالاککرا`
          : isAr
          ? `مرحباً ${signedUser.email || ''}! تم تفعيل المزامنة السحابية`
          : isTr
          ? `Hoş geldiniz ${signedUser.email || ''}! Bulut eşitleme aktif`
          : isFr
          ? `Bienvenue ${signedUser.email || ''} ! Synchronisation cloud activée`
          : isEs
          ? `¡Bienvenido ${signedUser.email || ''}! Sincronización en la nube activa`
          : `Signed in as ${signedUser.email || 'Google Account'} — Cloud sync active!`
      );
      if (onLoginSuccess) {
        onLoginSuccess(signedUser, { isNewAccount: false });
      } else {
        onClose();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg(
          pick(
            'Sign-in popup was closed before finishing.',
            'تم إغلاق نافذة تسجيل الدخول.',
            'پەنجەرەی چوونەژوورەوە داخرا پێش تەواوبوون.',
            'Giriş penceresi tamamlanmadan kapatıldı.',
            'La fenêtre de connexion a été fermée.',
            'La ventana de inicio de sesión se cerró antes de finalizar.'
          )
        );
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg(
          'This domain is not yet allowlisted in Firebase Console -> Authentication -> Settings -> Authorized domains.'
        );
      } else {
        setErrorMsg(err?.message || 'Unable to complete Google sign-in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setUsernameTakenError(null);

    if (!email.trim() || password.length < 6) {
      setErrorMsg(
        pick(
          'Please enter a valid email and a password of at least 6 characters.',
          'يرجى إدخال بريد إلكتروني صحيح وكلمة مرور لا تقل عن 6 أحرف.',
          'تکایە ئیمەیڵێکی دروست و وشەی نهێنی لانیکەم ٦ پیت بنووسە.',
          'Lütfen geçerli bir e-posta ve en az 6 karakterli şifre girin.',
          'Veuillez saisir un e-mail valide et un mot de passe d’au moins 6 caractères.',
          'Ingresa un correo válido y una contraseña de al menos 6 caracteres.'
        )
      );
      return;
    }

    if (authMode === 'email_signup') {
      const trimmedUsername = signupUsername.trim().replace(/^@+/, '');
      let claimedUsername: string | undefined;

      if (trimmedUsername.length > 0) {
        const validation = validateProfileUsername(trimmedUsername);
        if (!validation.valid || !validation.normalized) {
          setUsernameTakenError(
            validation.reason === 'too_short'
              ? pick(
                  'Username must be at least 3 characters (letters, numbers, underscores), or leave blank.',
                  'اسم المستخدم يجب أن لا يقل عن 3 أحرف (حروف وأرقام وشرطة سفلية)، أو اتركه فارغاً.',
                  'ناوی بەکارهێنەر دەبێت لانیکەم ٣ پیت بێت (پیت، ژمارە، _)، یان بە بەتاڵی جێیبهێڵە.',
                  'Kullanıcı adı en az 3 karakter olmalıdır veya boş bırakılabilir.',
                  "Le nom d'utilisateur doit comporter au moins 3 caractères ou rester vide.",
                  'El usuario debe tener al menos 3 caracteres (letras, números, _) o quedar vacío.'
                )
              : pick(
                  'Username supports only letters, numbers, and underscores (e.g., user123, lanya_2026).',
                  'اسم المستخدم يدعم الحروف والأرقام والشرطة السفلية فقط.',
                  'ناوی بەکارهێنەر تەنها پیت، ژمارە و _ وەردەگرێت.',
                  'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) destekler.',
                  'Uniquement lettres, chiffres et underscores (ex: user123).',
                  'Solo admite letras, números y guiones bajos (ej. user123).'
                )
          );
          return;
        }
        claimedUsername = validation.normalized;
      }

      setIsLoading(true);
      try {
        if (claimedUsername && onCheckUsernameAvailable) {
          const isAvailable = await onCheckUsernameAvailable(claimedUsername);
          if (!isAvailable) {
            setUsernameTakenError(takenUsernameMessage);
            setIsLoading(false);
            return;
          }
        }
        const createdUser = await registerWithEmailAccount(email, password);
        onShowToast?.(
          pick(
            'Account created! Verification link sent to your email.',
            'تم إنشاء الحساب! تم إرسال رابط التحقق إلى بريدك الإلكتروني.',
            'هەژمار دروستکرا! بەستەری پشتڕاستکردنەوە نێردرا بۆ ئیمەیڵەکەت.',
            'Hesap oluşturuldu! E-postanıza doğrulama bağlantısı gönderildi.',
            'Compte créé ! Un lien de vérification a été envoyé.',
            '¡Cuenta creada! Enlace de verificación enviado a tu correo.'
          )
        );
        const cleanDisplayName = signupDisplayName.trim().slice(0, 120);
        if (onLoginSuccess) {
          onLoginSuccess(createdUser, {
            isNewAccount: true,
            ...(claimedUsername ? { claimedUsername } : {}),
            ...(cleanDisplayName ? { claimedDisplayName: cleanDisplayName } : {}),
          });
        } else {
          onClose();
        }
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/operation-not-allowed') {
          setErrorMsg(
            'Email/Password sign-in is disabled in Firebase Console. Enable it under Authentication -> Sign-in method -> Email/Password, or use "Sign in with Google / Gmail".'
          );
        } else if (code === 'auth/email-already-in-use') {
          setErrorMsg(
            pick(
              'Email already registered. Please sign in instead.',
              'هذا البريد مسجل مسبقاً. قم بتسجيل الدخول.',
              'ئەم ئیمەیڵە پێشتر تۆمارکراوە. بچۆ ژوورەوە.',
              'Bu e-posta zaten kayıtlı. Giriş yapın.',
              'Cet e-mail est déjà enregistré. Connectez-vous.',
              'Este correo ya está registrado. Inicia sesión.'
            )
          );
        } else {
          setErrorMsg(err?.message || 'Registration failed.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const signedUser = await signInWithEmailAccount(email, password);
      onShowToast?.(
        pick(
          'Signed in successfully!',
          'تم تسجيل الدخول بنجاح!',
          'بەسەرکەوتوویی چوویتە ژوورەوە!',
          'Başarıyla giriş yapıldı!',
          'Connexion réussie !',
          '¡Sesión iniciada correctamente!'
        )
      );
      if (onLoginSuccess) {
        onLoginSuccess(signedUser, { isNewAccount: false });
      } else {
        onClose();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password sign-in is disabled in Firebase Console. Enable it under Authentication -> Sign-in method -> Email/Password, or use "Sign in with Google / Gmail".'
        );
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setErrorMsg(
          pick(
            'Invalid email or password.',
            'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            'ئیمەیڵ یان وشەی نهێنی هەڵەیە.',
            'Geçersiz e-posta veya şifre.',
            'E-mail ou mot de passe invalide.',
            'Correo o contraseña no válidos.'
          )
        );
      } else {
        setErrorMsg(err?.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasSession = Boolean(user || (isAuthenticated && currentUser));
  const sessionEmail = user?.email || currentUser?.email || '';
  const sessionDisplayName = profileName || user?.displayName || currentUser?.name || sessionEmail || 'Account';
  const sessionUsername = profileUsername || currentUser?.username || '';
  const sessionAvatar = profileAvatar || user?.photoURL || currentUser?.avatar || '';

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await signOutAccount();
        onClose();
      }
      onShowToast?.(
        pick(
          'Signed out. Switched to Guest / Local mode.',
          'تم تسجيل الخروج والعودة للوضع المحلي.',
          'چوویتە دەرەوە و گەڕایتەوە بۆ دۆخی ناوخۆیی.',
          'Çıkış yapıldı. Yerel moda geçildi.',
          'Déconnecté. Mode invité / local activé.',
          'Sesión cerrada. Modo invitado / local activado.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200 ${
        isLight ? 'bg-slate-900/45' : 'bg-black/85'
      }`}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col smooth-interactive ${
          isLight
            ? isNordic
              ? 'bg-[#F5FAFF] border-sky-200 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900'
            : isVelvetPink
            ? 'bg-[#1F1224] border-[#E8B4A0]/25 text-[#FFF5FA]'
            : 'bg-[#0B101B] border-white/[0.1] text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? isNordic
                ? 'border-sky-200 bg-[#E6F1FC]'
                : 'border-slate-200 bg-slate-50'
              : isVelvetPink
              ? 'border-[#E8B4A0]/20 bg-[#170D1B]/85'
              : 'border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {hasSession ? <Cloud glow="accent" className="w-5 h-5" /> : <ShieldCheck glow="accent" className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="auth-modal-title" className={`text-base sm:text-lg font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isKu
                  ? 'هەژمار و هاوکاتکردنی هەوری'
                  : isAr
                  ? 'الحساب والمزامنة السحابية'
                  : isTr
                  ? 'Hesap ve Bulut Eşitleme'
                  : isFr
                  ? 'Compte & Synchronisation Cloud'
                  : isEs
                  ? 'Cuenta y Sincronización'
                  : 'Account & Cloud Sync'}
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {hasSession
                  ? sessionEmail || sessionDisplayName || 'Signed-in Account'
                  : isAr
                  ? 'احفظ ديونك وأرشيفك وإعداداتك بأمان على السحابة'
                  : isKu
                  ? 'قەرز و ئەرشیف و ڕێکخستنەکانت لە هەوردا بپارێزە'
                  : isTr
                  ? 'Borçlarınızı, arşivinizi ve tercihlerinizi buluta yedekleyin'
                  : isFr
                  ? 'Sauvegardez vos prêts, archives et préférences'
                  : isEs
                  ? 'Respalda tus préstamos, archivo y preferencias'
                  : 'Back up your loans, archive & personal preferences'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              isLight ? 'bg-slate-200/70 hover:bg-slate-300/70 text-slate-600 hover:text-slate-900' : 'bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {errorMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                isLight ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-rose-500/15 border-rose-500/35 text-rose-200'
              }`}
            >
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
          )}

          {hasSession ? (
            <div className="space-y-4" data-testid="authenticated-account-panel">
              {/* Authenticated Account Profile Card */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight
                    ? isNordic
                      ? 'bg-[#EDF5FD] border-sky-200'
                      : 'bg-slate-50 border-slate-200'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full overflow-hidden border flex items-center justify-center text-sm font-bold shrink-0 ${
                        isLight
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                      }`}
                    >
                      {sessionAvatar ? (
                        <img
                          src={sessionAvatar}
                          alt={sessionDisplayName || 'Profile avatar'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (sessionDisplayName || sessionEmail || 'U').slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold font-pricedown tracking-wide truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {sessionDisplayName}
                      </p>
                      {sessionUsername && (
                        <p className={`text-[11px] font-semibold truncate ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          @{sessionUsername}
                        </p>
                      )}
                      {sessionEmail && (
                        <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{sessionEmail}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${
                      syncStatus === 'synced' || (!user && isAuthenticated)
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : syncStatus === 'syncing' || syncStatus === 'unverified'
                        ? isLight
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {syncStatus === 'synced'
                      ? pick('Synced', 'متزامن', 'هاوکاتکراو', 'Eşitlendi', 'Synchronisé', 'Sincronizado')
                      : syncStatus === 'syncing'
                      ? pick('Syncing...', 'جاري المزامنة...', 'هاوکاتکردن...', 'Eşitleniyor...', 'Synchro...', 'Sincronizando...')
                      : syncStatus === 'unverified'
                      ? pick('Verify Email', 'تأكيد البريد', 'پشتڕاستکردنەوەی ئیمەیڵ', 'E-postayı Doğrula', 'Vérifier l’e-mail', 'Verificar correo')
                      : !user && isAuthenticated
                      ? pick('Signed In', 'مسجل الدخول', 'لە ژوورەوەیە', 'Giriş Yapıldı', 'Connecté', 'Conectado')
                      : pick('Sync Issue', 'خطأ مزامنة', 'کێشەی هاوکاتکردن', 'Eşitleme Sorunu', 'Erreur synchro', 'Error de sinc.')}
                  </span>
                </div>

                {profileBio && (
                  <p className={`text-xs leading-relaxed pt-1 border-t ${isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-white/[0.06]'}`}>
                    {profileBio}
                  </p>
                )}

                {user && !user.emailVerified && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] space-y-2 ${
                      isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <p>
                      {pick(
                        'Please verify your email address to enable secure Firestore cloud backups.',
                        'يرجى تأكيد بريدك الإلكتروني لتفعيل النسخ الاحتياطي السحابي بأمان.',
                        'تکایە ئیمەیڵەکەت پشتڕاست بکەرەوە بۆ چالاککردنی هەڵگرتنی هەوری.',
                        'Güvenli bulut yedekleme için lütfen e-posta adresinizi doğrulayın.',
                        'Veuillez vérifier votre adresse e-mail pour activer la sauvegarde cloud.',
                        'Verifica tu correo para activar copias seguras en la nube.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await resendVerificationEmail();
                        setInfoMsg(
                          pick(
                            'Verification email re-sent. Check your inbox.',
                            'تمت إعادة إرسال رابط التحقق. تفقد بريدك.',
                            'بەستەری پشتڕاستکردنەوە نێردرایەوە. سەیری ئیمەیڵەکەت بکە.',
                            'Doğrulama e-postası tekrar gönderildi.',
                            'E-mail de vérification renvoyé.',
                            'Correo de verificación reenviado. Revisa tu bandeja.'
                          )
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] cursor-pointer"
                    >
                      {pick(
                        'Resend Verification Email',
                        'إعادة إرسال رابط التحقق',
                        'ناردنەوەی ئیمەیڵی پشتڕاستکردنەوە',
                        'Doğrulama E-postasını Tekrar Gönder',
                        'Renvoyer l’e-mail de vérification',
                        'Reenviar correo de verificación'
                      )}
                    </button>
                  </div>
                )}

                {lastSyncedAt && (
                  <p data-numeric="true" className={`text-[11px] font-numeric ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick('Last synced', 'آخر مزامنة', 'دوایین هاوکاتکردن', 'Son eşitleme', 'Dernière synchro', 'Última sinc.')}: {lastSyncedAt}
                  </p>
                )}
              </div>

              {onEditProfile && (
                <button
                  type="button"
                  data-testid="auth-edit-profile-btn"
                  onClick={() => {
                    onClose();
                    onEditProfile();
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm smooth-interactive active:scale-[0.98] cursor-pointer ${
                    isLight
                      ? isNordic
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                      : isVelvetPink
                      ? 'bg-[#FF2E93] hover:bg-[#FF65B5] text-white shadow-[#FF2E93]/25'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <Edit3 glow="accent" className="w-4 h-4 stroke-[1.65]" />
                  <span>
                    {isKu
                      ? 'دەستکاریکردنی پرۆفایل'
                      : isAr
                      ? 'تعديل الملف الشخصي'
                      : isTr
                      ? 'Profili Düzenle'
                      : isFr
                      ? 'Modifier le profil'
                      : isEs
                      ? 'Editar Perfil'
                      : 'Edit Profile'}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={!user || isLoading || syncStatus === 'syncing'}
                  className={`flex-1 min-h-[42px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer disabled:opacity-50 ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/35'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 stroke-[1.65] ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'مزامنة الآن' : isKu ? 'هاوکاتکردن' : isTr ? 'Şimdi Eşitle' : isFr ? 'Synchroniser' : isEs ? 'Sincronizar Ahora' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  data-testid="auth-signout-btn"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className={`min-h-[42px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <LogOut className="w-4 h-4 stroke-[1.65]" />
                  <span>{isAr ? 'تسجيل الخروج' : isKu ? 'چوونەدەرەوە' : isTr ? 'Çıkış Yap' : isFr ? 'Déconnexion' : isEs ? 'Cerrar Sesión' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Google / Gmail Sign-In Button */}
              <button
                type="button"
                data-testid="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full min-h-[48px] flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-950'
                }`}
              >
                <span className={`font-mono font-black text-base ${isLight ? 'text-emerald-400' : 'text-emerald-700'}`}>G</span>
                <span>
                  {isKu
                    ? 'چوونەژوورەوە بە Google / Gmail'
                    : isAr
                    ? 'تسجيل الدخول عبر Google / Gmail'
                    : isTr
                    ? 'Google / Gmail ile Giriş Yap'
                    : isFr
                    ? 'Se connecter avec Google / Gmail'
                    : isEs
                    ? 'Iniciar sesión con Google / Gmail'
                    : 'Sign in with Google / Gmail'}
                </span>
              </button>

              <div className="relative flex items-center justify-center py-1">
                <div className={`border-t w-full ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />
                <span
                  className={`px-3 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isLight
                      ? isNordic
                        ? 'bg-[#F5FAFF] text-slate-500'
                        : 'bg-white text-slate-500'
                      : isVelvetPink
                      ? 'bg-[#1F1224] text-[#E8B4A0]/70'
                      : 'bg-[#0B101B] text-slate-500'
                  }`}
                >
                  {pick('or', 'أو', 'یان', 'veya', 'ou', 'o')}
                </span>
                <div className={`border-t w-full ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />
              </div>

              {authMode === 'options' ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    data-testid="email-auth-toggle-btn"
                    onClick={() => {
                      setAuthMode('email_signin');
                      setErrorMsg(null);
                      setUsernameTakenError(null);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
                    }`}
                  >
                    <Mail className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                    <span>
                      {pick(
                        'Use Email & Password',
                        'المتابعة بالبريد الإلكتروني وكلمة المرور',
                        'چوونەژوورەوە بە ئیمەیڵ و وشەی نهێنی',
                        'E-posta ve Şifre ile Devam Et',
                        'Utiliser E-mail & Mot de passe',
                        'Usar Correo y Contraseña'
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer ${
                      isLight
                        ? 'bg-transparent hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        : 'bg-transparent hover:bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CloudOff className="w-4 h-4" />
                    <span>
                      {isKu
                        ? 'بەردەوامبوون وەک میوان (ئەم ئامێرە)'
                        : isAr
                        ? 'المتابعة كضيف (تخزين محلي على الجهاز)'
                        : isTr
                        ? 'Misafir Olarak Devam Et (Yerel)'
                        : isFr
                        ? 'Continuer en mode Invité (Local)'
                        : isEs
                        ? 'Continuar como Invitado (Local)'
                        : 'Continue as Guest (Local Device)'}
                    </span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {authMode === 'email_signup' && (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="signup-fullname"
                          className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                        >
                          {pick('Full Name (Optional)', 'الاسم الكامل (اختياري)', 'ناوی تەواو (دڵخوازانە)', 'Ad Soyad (İsteğe Bağlı)', 'Nom complet (Optionnel)', 'Nombre Completo (Opcional)')}
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="signup-fullname"
                            data-testid="signup-fullname-input"
                            type="text"
                            maxLength={120}
                            value={signupDisplayName}
                            onChange={(e) => setSignupDisplayName(e.target.value)}
                            placeholder={pick('Sara Ali', 'سارة علي', 'سارا عەلی', 'Sara Ali', 'Sara Ali', 'Sara Ali')}
                            className={`w-full min-h-[42px] ps-10 pe-3 py-2 rounded-xl border text-xs outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 focus:border-emerald-500 text-slate-900 placeholder-slate-400'
                                : 'bg-slate-950 border-white/[0.1] focus:border-emerald-500 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="signup-username"
                          className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                        >
                          {pick(
                            'Username (Optional)',
                            'اسم المستخدم (اختياري)',
                            'ناوی بەکارهێنەر (دڵخوازانە)',
                            'Kullanıcı Adı (İsteğe Bağlı)',
                            "Nom d'utilisateur (Optionnel)",
                            'Usuario (Opcional)'
                          )}
                        </label>
                        <div className="relative" dir="ltr">
                          <AtSign className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="signup-username"
                            data-testid="signup-username-input"
                            type="text"
                            maxLength={32}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={signupUsername}
                            onChange={(e) => {
                              setSignupUsername(e.target.value.replace(/^@+/, ''));
                              if (usernameTakenError) setUsernameTakenError(null);
                            }}
                            placeholder="lanya_2026"
                            className={`w-full min-h-[42px] ps-10 pe-3 py-2 rounded-xl border text-xs font-mono outline-none ${
                              usernameTakenError
                                ? 'border-rose-500 focus:border-rose-500'
                                : isLight
                                ? 'bg-white border-slate-300 focus:border-emerald-500 text-slate-900 placeholder-slate-400'
                                : 'bg-slate-950 border-white/[0.1] focus:border-emerald-500 text-white'
                            }`}
                          />
                        </div>
                        {usernameTakenError && (
                          <p
                            role="alert"
                            data-testid="signup-username-error"
                            className="text-[11px] font-semibold text-rose-500"
                          >
                            {usernameTakenError}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick('Email', 'البريد الإلكتروني', 'ئیمەیڵ', 'E-posta', 'E-mail', 'Correo')}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className={`w-full min-h-[42px] ps-10 pe-3 py-2 rounded-xl border focus:border-emerald-500 text-xs outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            : 'bg-slate-950 border-white/[0.1] text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick('Password', 'كلمة المرور', 'وشەی نهێنی', 'Şifre', 'Mot de passe', 'Contraseña')}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full min-h-[42px] ps-10 pe-3 py-2 rounded-xl border focus:border-emerald-500 text-xs outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            : 'bg-slate-950 border-white/[0.1] text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      data-testid="email-auth-submit-btn"
                      disabled={isLoading}
                      className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {authMode === 'email_signup'
                        ? pick('Create Account', 'إنشاء حساب', 'دروستکردنی هەژمار', 'Hesap Oluştur', 'Créer un compte', 'Crear Cuenta')
                        : pick('Sign In', 'تسجيل الدخول', 'چوونەژوورەوە', 'Giriş Yap', 'Se connecter', 'Iniciar Sesión')}
                    </button>
                    <button
                      type="button"
                      data-testid="switch-signup-mode-btn"
                      onClick={() => {
                        setErrorMsg(null);
                        setUsernameTakenError(null);
                        setAuthMode(authMode === 'email_signin' ? 'email_signup' : 'email_signin');
                      }}
                      className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                      }`}
                    >
                      {authMode === 'email_signin'
                        ? pick('Create Account', 'حساب جديد', 'هەژماری نوێ', 'Hesap Oluştur', 'Créer un compte', 'Crear Cuenta')
                        : pick('Have Account?', 'لديك حساب؟', 'هەژمارت هەیە؟', 'Hesabın var mı?', 'Déjà inscrit ?', '¿Ya tienes cuenta?')}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('options');
                      setErrorMsg(null);
                      setUsernameTakenError(null);
                    }}
                    className={`w-full text-center text-[11px] pt-1 cursor-pointer ${
                      isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pick('Back to all options', 'العودة لجميع الخيارات', 'گەڕانەوە بۆ بژاردەکان', 'Tüm seçeneklere dön', 'Retour aux options', 'Volver a todas las opciones')}
                  </button>
                </form>
              )}

              <div
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-[11px] ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                }`}
              >
                <UserCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>
                  {pick(
                    'Your existing local loans & preferences automatically merge into your cloud backup upon sign-in.',
                    'بياناتك الحالية ستُرفع وتُدمج تلقائياً فور تسجيل الدخول دون أي فقدان.',
                    'تۆمار و ڕێکخستنەکانی ئێستات ڕاستەوخۆ دەپارێزرێن و لە هەوردا هاوکات دەکرێن.',
                    'Mevcut yerel kayıtlarınız ve ayarlarınız giriş yaptığınızda otomatik olarak bulut yedeğinizle birleşir.',
                    'Vos dossiers et préférences locaux sont automatiquement fusionnés lors de la connexion.',
                    'Tus préstamos y ajustes locales se fusionan automáticamente en la nube al iniciar sesión.'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
