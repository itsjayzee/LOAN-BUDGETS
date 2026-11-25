import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CurrencyCode,
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  PublicUserProfile,
  ThemeMode,
} from '../types';
import {
  CardBrand,
  FibPaymentMethod,
  LockedCheckoutPayoff,
  PaymentRail,
  buildFibPaymentQrPayload,
  buildLockedCheckoutPayoff,
  canShowPaymentActions,
  detectCardBrand,
  formatCardDebt,
  formatCardExpiry,
  formatCardNumber,
  formatFibIbanOrAccount,
  isLightThemeMode,
  parseFibQrPayload,
  resolveCounterpartyFibProfile,
  resolveExactLoanChatUsername,
  resolveRecordDualEquivalent,
  validateMockCardPayment,
  validateMockFibPayment,
  validateProfileFibAccount,
} from '../utils/loanLogic';
import { lookupUserByUsername } from '../firebase';
import { RealFibQrCode } from './RealFibQrCode';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  X,
} from './OrganicIcons';

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  language: Language;
  activeCurrency: CurrencyCode;
  themeMode?: ThemeMode;
  initialRail?: PaymentRail;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  counterpartyCloudProfile?: PublicUserProfile | null;
  customRates?: Partial<Record<CurrencyCode, number>>;
  showDualCurrency?: boolean;
  onPreSettleRing?: (loan: Loan) => void;
  onConfirmCardPayment: (
    loan: Loan,
    paymentMeta: { brand: CardBrand; last4: string; cardholderName: string; lockedAmount: number }
  ) => void;
  onConfirmFibPayment?: (
    loan: Loan,
    paymentMeta: {
      method: FibPaymentMethod;
      reference: string;
      accountLast4: string;
      accountHolderName: string;
      lockedAmount: number;
    }
  ) => void;
}

export const VisaBadgeSvg: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 48 16" className={className} aria-label="Visa" role="img">
    <text
      x="1"
      y="13"
      fill="currentColor"
      fontFamily="'IBM Plex Sans', Arial, sans-serif"
      fontWeight="900"
      fontStyle="italic"
      fontSize="14"
      letterSpacing="-0.5"
    >
      VISA
    </text>
  </svg>
);

export const MastercardBadgeSvg: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 36 22" className={className} aria-label="Mastercard" role="img">
    <circle cx="13" cy="11" r="8.5" fill="#EB001B" fillOpacity="0.92" />
    <circle cx="23" cy="11" r="8.5" fill="#F79E1B" fillOpacity="0.92" />
    <path d="M18 4.2a8.48 8.48 0 0 0 0 13.6 8.48 8.48 0 0 0 0-13.6Z" fill="#FF5F00" />
  </svg>
);

export const FibBadgeSvg: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 58 20" className={className} aria-label="First Iraqi Bank (FIB)" role="img">
    <rect x="1" y="2" width="16" height="16" rx="4.5" fill="#062238" stroke="#10B981" strokeWidth="1.4" />
    <path d="M5.5 13.5 9 6.2l3.5 7.3" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="9" cy="11.6" r="1.2" fill="#34D399" />
    <text
      x="22"
      y="14.2"
      fill="currentColor"
      fontFamily="'IBM Plex Sans', Arial, sans-serif"
      fontWeight="900"
      fontSize="12.5"
      letterSpacing="0.8"
    >
      FIB
    </text>
  </svg>
);

export const CardPaymentModal: React.FC<CardPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  language,
  themeMode = 'obsidian_neon',
  initialRail = 'card',
  friends = [],
  chatThreads = [],
  counterpartyCloudProfile = null,
  customRates,
  showDualCurrency = true,
  onPreSettleRing,
  onConfirmCardPayment,
  onConfirmFibPayment,
}) => {
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const isGold = themeMode === 'midnight_gold';

  const [activeRail, setActiveRail] = useState<PaymentRail>(initialRail);

  // Card states
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // FIB states
  const [fibMethod, setFibMethod] = useState<FibPaymentMethod>('qr');
  const [fibQrScanned, setFibQrScanned] = useState(false);
  const [fibAccountInput, setFibAccountInput] = useState('');
  const [fibHolderName, setFibHolderName] = useState('');
  const [fetchedCloudProfile, setFetchedCloudProfile] = useState<PublicUserProfile | null>(null);
  const [copiedIban, setCopiedIban] = useState(false);

  // Interactive FIB QR Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCameraActive, setScannerCameraActive] = useState(false);
  const [scannerStatusMsg, setScannerStatusMsg] = useState<string | null>(null);
  const [scannerPayloadInput, setScannerPayloadInput] = useState('');
  const formScrollRef = useRef<HTMLFormElement | null>(null);
  const [extractedQrInfo, setExtractedQrInfo] = useState<{
    normalizedAccount: string;
    formattedAccount: string;
    accountLast4: string;
    recipientName?: string;
    reference: string;
  } | null>(null);

  // Locked payoff snapshot bound strictly to the opened loan so live updates/pre-settle never alter display mid-checkout
  const [lockedSnapshot, setLockedSnapshot] = useState<LockedCheckoutPayoff | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutPhase, setCheckoutPhase] = useState<'idle' | 'verifying' | 'settled_100'>('idle');
  const timersRef = useRef<number[]>([]);
  const copiedTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const clearTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = null;
    }
  };

  const stopCameraScanner = useCallback(() => {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen && loan) {
      clearTimers();
      stopCameraScanner();
      setActiveRail(initialRail);
      setCardholderName('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setFibMethod('qr');
      setFibQrScanned(false);
      setFibAccountInput('');
      setFibHolderName('');
      setCopiedIban(false);
      setIsScannerOpen(false);
      setScannerStatusMsg(null);
      setScannerPayloadInput('');
      setExtractedQrInfo(null);
      setLockedSnapshot(buildLockedCheckoutPayoff(loan, language));
      setErrorField(null);
      setErrorMsg(null);
      setCheckoutPhase('idle');
    } else {
      stopCameraScanner();
    }
    return () => {
      clearTimers();
      stopCameraScanner();
    };
  }, [isOpen, loan?.id, initialRail, language, stopCameraScanner]);

  const linkedHandleLower = useMemo(
    () => (loan ? resolveExactLoanChatUsername(loan) : ''),
    [loan]
  );

  // Live counterparty lookup from Firestore /usernames/{handle} when linked to an @username
  useEffect(() => {
    if (!isOpen || !linkedHandleLower || linkedHandleLower.length < 3 || counterpartyCloudProfile) {
      setFetchedCloudProfile(null);
      return;
    }
    let cancelled = false;
    lookupUserByUsername(linkedHandleLower)
      .then((res) => {
        if (!cancelled) {
          setFetchedCloudProfile(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedCloudProfile(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, linkedHandleLower, counterpartyCloudProfile]);

  const resolvedCounterpartyFib = useMemo(() => {
    if (!loan) {
      return {
        hasFib: false,
        fibAccount: '',
        formattedFibAccount: '',
        accountLast4: '',
        recipientName: '',
        qrPayload: '',
      };
    }
    return resolveCounterpartyFibProfile({
      loan,
      friends,
      chatThreads,
      cloudProfile: counterpartyCloudProfile || fetchedCloudProfile,
    });
  }, [loan, friends, chatThreads, counterpartyCloudProfile, fetchedCloudProfile]);

  // Auto-populate counterparty FIB IBAN & holder name if available when opening or resolving lookup
  useEffect(() => {
    if (!isOpen || !loan || !resolvedCounterpartyFib.hasFib) return;
    setFibAccountInput((prev) => (prev.trim() ? prev : resolvedCounterpartyFib.formattedFibAccount));
    setFibHolderName((prev) => (prev.trim() ? prev : resolvedCounterpartyFib.recipientName));
  }, [isOpen, loan?.id, resolvedCounterpartyFib.hasFib, resolvedCounterpartyFib.formattedFibAccount, resolvedCounterpartyFib.recipientName]);

  const isProcessing = checkoutPhase !== 'idle';

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isProcessing) return;
      if (isScannerOpen) {
        stopCameraScanner();
        setIsScannerOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isProcessing, isScannerOpen, stopCameraScanner, onClose]);

  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const isRtl = isKu || isAr;

  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  if (!isOpen || !loan) {
    return <AnimatePresence />;
  }

  const isPaymentPermitted = canShowPaymentActions(loan);
  const payoff = lockedSnapshot && lockedSnapshot.loanId === loan.id
    ? lockedSnapshot
    : buildLockedCheckoutPayoff(loan, language);

  const lockedExactAmount = payoff.lockedExactAmount;
  const formattedDue = payoff.formattedSigned;
  const formattedUnsigned = payoff.formattedUnsigned;
  const loanCurrency = payoff.currency;
  const brand = detectCardBrand(cardNumber);
  const manualFibValidation = validateProfileFibAccount(fibAccountInput);
  const activeQrFibAccount =
    extractedQrInfo?.normalizedAccount ||
    resolvedCounterpartyFib.fibAccount ||
    (manualFibValidation.valid && manualFibValidation.normalized ? manualFibValidation.normalized : '') ||
    'IQ98FIRA000010048291037';
  const formattedQrFibAccount = formatFibIbanOrAccount(activeQrFibAccount);
  const fibQrPayload = buildFibPaymentQrPayload({
    fibAccount: activeQrFibAccount,
    amount: lockedExactAmount,
    currency: loanCurrency,
  });
  const fibQuickRef = extractedQrInfo?.reference || `FIB-QP-${(loan.id.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '8824')}`;

  // Ring geometry for checkout preview / 100% completion animation
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const displayRingPercent = checkoutPhase === 'settled_100' ? 100 : payoff.progressBefore;
  const ringOffset = ringCircumference * (1 - displayRingPercent / 100);

  const getErrorText = (code?: string) => {
    switch (code) {
      case 'invalid_holder':
        return pick(
          'Please enter cardholder full name.',
          'يرجى إدخال اسم حامل البطاقة.',
          'تکایە ناوی خاوەنی کارت بنووسە.',
          'Lütfen kart sahibinin adını girin.',
          'Veuillez saisir le nom du titulaire.',
          'Ingresa el nombre completo del titular de la tarjeta.'
        );
      case 'invalid_card_number':
        return pick(
          'Enter a valid Visa (starts with 4) or Mastercard (starts with 5 / 2221-2720) 16-digit number.',
          'أدخل رقم بطاقة Visa أو Mastercard صحيحاً مكوناً من ١٦ رقماً.',
          'ژمارەی کارتی Visa یان Mastercard بە دروستی (١٦ ژمارە) بنووسە.',
          'Geçerli bir 16 haneli Visa veya Mastercard numarası girin.',
          'Entrez un numéro Visa ou Mastercard valide à 16 chiffres.',
          'Ingresa un número Visa (inicia con 4) o Mastercard válido de 16 dígitos.'
        );
      case 'invalid_expiry':
      case 'invalid_expiry_month':
      case 'card_expired':
        return pick(
          'Enter a valid future expiry date (MM/YY).',
          'أدخل تاريخ انتهاء صالح (MM/YY).',
          'بەرواری بەسەرچوونی دروست (MM/YY) بنووسە.',
          'Geçerli bir son kullanma tarihi (AA/YY) girin.',
          'Entrez une date d\'expiration valide (MM/AA).',
          'Ingresa una fecha de vencimiento futura válida (MM/AA).'
        );
      case 'invalid_fib_account':
        return pick(
          'Enter a valid First Iraqi Bank IBAN (e.g. IQ98 FIRA ...) or 8–16 digit FIB Account Number.',
          'أدخل رقم IBAN صحيحاً لمصرف العراق الأول (مثل IQ98 FIRA...) أو رقم حساب مكون من ٨ إلى ١٦ رقماً.',
          'ژمارەی IBAN یان ژمارەی هەژماری بانکی عێراقی یەکەم (FIB) بە دروستی بنووسە (لانیکەم ٨ ژمارە).',
          'Geçerli bir First Iraqi Bank IBAN (IQ...) veya 8-16 haneli hesap numarası girin.',
          'Saisissez un IBAN FIB valide (IQ...) ou un numéro de compte à 8–16 chiffres.',
          'Ingresa un IBAN válido de First Iraqi Bank (ej. IQ98 FIRA...) o cuenta FIB de 8-16 dígitos.'
        );
      case 'invalid_fib_qr':
        return pick(
          'Could not extract a valid FIB IBAN or account number from that QR payload.',
          'تعذر استخراج رقم IBAN أو حساب FIB صالح من رمز QR.',
          'نەتوانرا ژمارەی IBAN یان هەژماری FIB لەم کۆدی QRـە دەربهێنرێت.',
          'Bu QR kodundan geçerli bir FIB IBAN veya hesap numarası çıkarılamadı.',
          'Impossible d’extraire un IBAN ou compte FIB valide depuis ce QR.',
          'No se pudo extraer un IBAN o cuenta FIB válida de ese código QR.'
        );
      case 'they_owe_me_blocked':
        return pick(
          'Incoming receivables ("They Owe Me") are collected manually via Edit Record rather than paid out.',
          'ديون "لي عندهم" يتم تحصيلها يدوياً عبر تعديل السجل ولا يتم دفعها عبر البوابة.',
          'قەرزەکانی "لای ئەوان" تەنها بە دەست وەردەگیرێنەوە لە ڕێگەی دەستکاریکردن.',
          '"Alacağım" kayıtları manuel olarak tahsil edilir, ödeme ağ geçidinden ödenmez.',
          'Les créances « On me doit » sont encaissées manuellement via Modifier.',
          'Las cuentas por cobrar («Me Deben») se registran manualmente en Editar registro.'
        );
      case 'invalid_cvv':
      default:
        return pick(
          'Enter a valid 3 or 4 digit security code (CVV).',
          'أدخل رمز الأمان CVV المكون من ٣ أو ٤ أرقام.',
          'کۆدی پاراستنی CVV (٣ یان ٤ ژمارە) بنووسە.',
          'Geçerli 3 veya 4 haneli güvenlik kodunu (CVV) girin.',
          'Entrez un code de sécurité CVV valide à 3 ou 4 chiffres.',
          'Ingresa un código de seguridad (CVV) válido de 3 o 4 dígitos.'
        );
    }
  };

  const copyTextValue = async (rawValue: string) => {
    try {
      await navigator.clipboard.writeText(rawValue);
    } catch {
      const area = document.createElement('textarea');
      area.value = rawValue;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedIban(true);
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopiedIban(false);
      copiedTimerRef.current = null;
    }, 2000);
  };

  const handleCopyVerifiedIban = async () => {
    const targetAccount = resolvedCounterpartyFib.fibAccount || activeQrFibAccount;
    if (!targetAccount) return;
    await copyTextValue(targetAccount);
  };

  const handleApplyScannedQrPayload = (rawPayload: string) => {
    const parsed = parseFibQrPayload(rawPayload, lockedExactAmount);
    if (!parsed.valid) {
      setErrorField('qr');
      setErrorMsg(getErrorText('invalid_fib_qr'));
      return;
    }

    setFibAccountInput(parsed.formattedAccount);
    if (parsed.recipientName) {
      setFibHolderName(parsed.recipientName);
    }
    setFibQrScanned(true);
    setExtractedQrInfo({
      normalizedAccount: parsed.normalizedAccount,
      formattedAccount: parsed.formattedAccount,
      accountLast4: parsed.accountLast4,
      recipientName: parsed.recipientName,
      reference: parsed.reference,
    });
    setScannerPayloadInput(rawPayload);
    setErrorField(null);
    setErrorMsg(null);
    stopCameraScanner();
    setIsScannerOpen(false);
    formScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQrScanner = async () => {
    setErrorField(null);
    setErrorMsg(null);
    setIsScannerOpen(true);
    setScannerStatusMsg(
      pick(
        'Align an FIB QuickPay QR in the camera frame or paste / capture QR data below.',
        'وجّه الكاميرا نحو رمز FIB QuickPay أو التقط/الصق بيانات QR أدناه.',
        'کۆدی QRـی FIB بخەرە ناو چوارچێوەکە یان زانیاری QR لە خوارەوە دەربهێنە.',
        'FIB QuickPay QR kodunu çerçeveye hizalayın veya aşağıdan yakalayın.',
        'Alignez un QR FIB QuickPay dans le cadre ou extrayez-le ci-dessous.',
        'Alinea un QR de FIB QuickPay en el marco o pega/captura el código abajo.'
      )
    );

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      cameraStreamRef.current = stream;
      setScannerCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const BarcodeDetectorCtor = (window as unknown as {
        BarcodeDetector?: new (opts?: { formats?: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
        };
      }).BarcodeDetector;

      if (BarcodeDetectorCtor && videoRef.current) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            const rawVal = barcodes.find((b) => b.rawValue)?.rawValue;
            if (rawVal) {
              handleApplyScannedQrPayload(rawVal);
            }
          } catch {
            // ignore transient frame decode errors
          }
        }, 350);
      }
    } catch {
      setScannerCameraActive(false);
      setScannerStatusMsg(
        pick(
          'Camera permission unavailable — use 1-tap QR Capture or paste the FIB QR payload below.',
          'الكاميرا غير متاحة — استخدم الالتقاط الفوري أو الصق رمز FIB أدناه.',
          'کامێرا بەردەست نییە — دەتوانیت ڕاستەوخۆ QR بخوێنیتەوە یان لە خوارەوە دایبنێیت.',
          'Kamera kullanılamıyor — tek dokunuşla yakalayın veya QR verisini yapıştırın.',
          'Caméra indisponible — utilisez la capture rapide ou collez le payload QR.',
          'Cámara no disponible — usa la captura rápida o pega el QR de FIB abajo.'
        )
      );
    }
  };

  const runSettlementSequence = (onComplete: () => void) => {
    clearTimers();
    stopCameraScanner();
    setCheckoutPhase('verifying');
    onPreSettleRing?.(loan);

    const t1 = window.setTimeout(() => {
      setCheckoutPhase('settled_100');
    }, 460);

    const t2 = window.setTimeout(() => {
      onComplete();
      setCheckoutPhase('idle');
      onClose();
    }, 840);

    timersRef.current.push(t1, t2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!isPaymentPermitted) {
      setErrorField('direction');
      setErrorMsg(getErrorText('they_owe_me_blocked'));
      return;
    }

    if (activeRail === 'fib') {
      const fibValidation = validateMockFibPayment({
        method: fibMethod,
        qrScanned: fibMethod === 'qr' ? true : fibQrScanned,
        accountOrIban: fibAccountInput,
        accountHolderName: fibHolderName,
        loanId: loan.id,
      });

      if (!fibValidation.valid) {
        setErrorField(fibValidation.errorField || 'accountOrIban');
        setErrorMsg(getErrorText(fibValidation.errorCode));
        return;
      }

      setErrorField(null);
      setErrorMsg(null);
      runSettlementSequence(() => {
        if (onConfirmFibPayment) {
          onConfirmFibPayment(loan, {
            method: fibValidation.method,
            reference: extractedQrInfo?.reference || fibValidation.reference,
            accountLast4: fibValidation.accountLast4,
            accountHolderName: fibHolderName.trim() || resolvedCounterpartyFib.recipientName || loan.personName,
            lockedAmount: lockedExactAmount,
          });
        } else {
          onConfirmCardPayment(loan, {
            brand: 'visa',
            last4: fibValidation.accountLast4,
            cardholderName: fibHolderName.trim() || 'First Iraqi Bank (FIB)',
            lockedAmount: lockedExactAmount,
          });
        }
      });
      return;
    }

    const validation = validateMockCardPayment({
      cardholderName,
      cardNumber,
      expiry,
      cvv,
    });

    if (!validation.valid) {
      setErrorField(validation.errorField || null);
      setErrorMsg(getErrorText(validation.errorCode));
      return;
    }

    setErrorField(null);
    setErrorMsg(null);
    runSettlementSequence(() => {
      onConfirmCardPayment(loan, {
        brand: validation.brand,
        last4: validation.last4,
        cardholderName: cardholderName.trim(),
        lockedAmount: lockedExactAmount,
      });
    });
  };

  const fillDemoCard = (demoType: 'visa' | 'mastercard') => {
    setErrorField(null);
    setErrorMsg(null);
    if (demoType === 'visa') {
      setCardholderName(loan.personName || 'Tariq Ali');
      setCardNumber('4111 1111 1111 1111');
      setExpiry('12/28');
      setCvv('123');
    } else {
      setCardholderName(loan.personName || 'Sara Hassan');
      setCardNumber('5500 0000 0000 0004');
      setExpiry('08/29');
      setCvv('456');
    }
  };

  const fillDemoFibAccount = () => {
    setErrorField(null);
    setErrorMsg(null);
    setFibMethod('iban');
    setFibAccountInput(resolvedCounterpartyFib.formattedFibAccount || 'IQ98 FIRA 0000 1004 8291 037');
    setFibHolderName(resolvedCounterpartyFib.recipientName || loan.personName || 'First Iraqi Bank Client');
  };

  const isFib = activeRail === 'fib';
  const inputSurface = isLight
    ? 'bg-white text-slate-900 placeholder-slate-400'
    : isVelvetPink
    ? 'bg-[#120B14]/90 text-white placeholder-slate-500'
    : isFib
    ? 'bg-[#041422]/92 text-white placeholder-slate-500'
    : 'bg-[#081020]/92 text-white placeholder-slate-500';

  return (
    <AnimatePresence>
      <motion.div
        key="payment-checkout-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-payment-gateway-title"
        data-testid="payment-checkout-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) onClose();
        }}
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md ${
          isLight ? 'bg-slate-900/45' : 'bg-black/80'
        }`}
      >
        <motion.div
          key="payment-checkout-panel"
          dir={isRtl ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: 'transform, opacity', transform: 'translate3d(0, 0, 0)' }}
          className={`relative w-full max-w-md rounded-t-3xl sm:rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col smooth-interactive ${
            isLight
              ? isNordic
                ? 'bg-[#F5FAFF]/98 border-sky-200 text-slate-900 shadow-sky-900/15'
                : 'bg-white border-slate-200/95 text-slate-900 shadow-slate-900/15'
              : isVelvetPink
              ? 'bg-[#1F1224]/96 border-[#E8B4A0]/28 text-[#FFF5FA] shadow-[0_24px_60px_-14px_rgba(255,46,147,0.28)]'
              : isGold
              ? 'bg-[#0A1328]/96 border-amber-400/25 text-slate-100 shadow-[0_24px_60px_-14px_rgba(245,158,11,0.22)]'
              : isFib
              ? 'bg-[#071828]/96 border-emerald-400/30 text-slate-100 shadow-[0_24px_60px_-14px_rgba(16,185,129,0.25)]'
              : 'bg-[#0A1124]/96 border-white/[0.12] text-slate-100 shadow-black/70'
          }`}
        >
          {/* Soft Ambient Rail Glow */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -top-20 inset-x-12 h-32 rounded-full blur-3xl opacity-45 transition-colors duration-300 ${
              isFib
                ? 'bg-emerald-500/30'
                : brand === 'visa'
                ? 'bg-sky-500/28'
                : brand === 'mastercard'
                ? 'bg-amber-500/28'
                : isVelvetPink
                ? 'bg-[#FF2E93]/28'
                : 'bg-amber-500/20'
            }`}
          />

          {/* Header */}
          <div
            className={`relative z-10 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b shrink-0 ${
              isLight
                ? isNordic
                  ? 'border-sky-200/80 bg-[#E6F1FC]/90'
                  : isFib
                  ? 'border-emerald-200/80 bg-emerald-50/75'
                  : 'border-slate-200/85 bg-slate-50/90'
                : isVelvetPink
                ? 'border-[#E8B4A0]/20 bg-[#170D1B]/88'
                : isFib
                ? 'border-emerald-400/20 bg-[#041422]/90'
                : 'border-white/[0.08] bg-[#060B18]/85'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  isFib
                    ? isLight
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-[#062238] border-emerald-400/45 text-emerald-400 shadow-sm shadow-emerald-500/20'
                    : isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/18 border-[#FF65B5]/45 text-[#FF65B5]'
                    : 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                }`}
              >
                {isFib ? (
                  <Landmark glow="they_owe" className="w-4.5 h-4.5" />
                ) : (
                  <CreditCard glow="accent" className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="min-w-0">
                <h2 id="card-payment-gateway-title" className={`text-sm sm:text-base font-bold font-pricedown tracking-wide truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isFib
                    ? pick(
                        'First Iraqi Bank (FIB) Checkout',
                        'بوابة الدفع — مصرف العراق الأول (FIB)',
                        'پارەدانی بانکی عێراقی یەکەم (FIB)',
                        'First Iraqi Bank (FIB) Ödeme',
                        'Paiement First Iraqi Bank (FIB)',
                        'Pago con First Iraqi Bank (FIB)'
                      )
                    : pick(
                        'Card Settlement Gateway',
                        'بوابة السداد بالبطاقة البنكية',
                        'دەروازەی پارەدانی کارت',
                        'Kart ile Ödeme Geçidi',
                        'Passerelle de Paiement Carte',
                        'Pasarela de Pago con Tarjeta'
                      )}
                </h2>
                <p className={`text-[11px] flex items-center gap-1.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Lock className={`w-3 h-3 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span className="truncate">
                    {isFib
                      ? pick(
                          'Iraq Local Rail · QuickPay QR & IBAN',
                          'شبكة الدفع العراقية · QuickPay و IBAN',
                          'سیستەمی پارەدانی عێراق · QuickPay و IBAN',
                          'Yerel Irak Ağı · QuickPay ve IBAN',
                          'Réseau local Irak · QuickPay & IBAN',
                          'Red local Irak · QuickPay QR e IBAN'
                        )
                      : pick(
                          'Encrypted Visa & Mastercard Settlement',
                          'سداد مشفر ببطاقات Visa و Mastercard',
                          'پارەدانی پارێزراوی Visa و Mastercard',
                          'Güvenli Visa & Mastercard Ödemesi',
                          'Règlement sécurisé Visa & Mastercard',
                          'Liquidación cifrada Visa y Mastercard'
                        )}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              aria-label={pick('Close payment gateway', 'إغلاق بوابة الدفع', 'داخستن', 'Kapat', 'Fermer', 'Cerrar pasarela de pago')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 smooth-interactive ${
                isLight ? 'bg-slate-200/75 hover:bg-slate-300/75 text-slate-600 hover:text-slate-900' : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Payment Rail Switcher: Visa/Mastercard vs First Iraqi Bank (FIB) */}
          <div className="relative z-10 px-4 sm:px-5 pt-2.5 sm:pt-3 shrink-0">
            <div
              className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
                isLight
                  ? 'bg-slate-100/90 border-slate-200/90'
                  : isVelvetPink
                  ? 'bg-[#120B14]/88 border-[#E8B4A0]/22'
                  : 'bg-[#040E1A]/88 border-white/[0.08]'
              }`}
            >
              <button
                type="button"
                disabled={isProcessing}
                data-testid="payment-rail-card"
                onClick={() => {
                  setActiveRail('card');
                  setErrorField(null);
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 smooth-interactive cursor-pointer ${
                  activeRail === 'card'
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : isVelvetPink
                      ? 'bg-[#FF2E93]/22 text-[#FFD6EB] border border-[#FF65B5]/50 shadow-sm'
                      : 'bg-amber-500/20 text-amber-200 border border-amber-400/45 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 border border-transparent'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate whitespace-nowrap">Visa / Mastercard</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                data-testid="payment-rail-fib"
                onClick={() => {
                  setActiveRail('fib');
                  setErrorField(null);
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 smooth-interactive cursor-pointer ${
                  activeRail === 'fib'
                    ? isLight
                      ? 'bg-[#062238] text-emerald-300 shadow-sm border border-emerald-500/50'
                      : 'bg-gradient-to-r from-[#062238] to-[#083830] text-emerald-300 border border-emerald-400/50 shadow-sm shadow-emerald-500/20'
                    : isLight
                    ? 'text-slate-600 hover:text-emerald-800 border border-transparent'
                    : 'text-slate-400 hover:text-emerald-300 border border-transparent'
                }`}
              >
                <FibBadgeSvg className="h-3.5 w-auto shrink-0" />
                <span className="truncate whitespace-nowrap">
                  {pick('Pay with FIB', 'الدفع عبر FIB', 'FIB', 'FIB ile Öde', 'FIB', 'Pagar con FIB')}
                </span>
              </button>
            </div>
          </div>

          <form ref={formScrollRef} onSubmit={handleSubmit} className="relative z-10 p-4 sm:p-5 pt-2.5 sm:pt-3 space-y-2.5 sm:space-y-3 overflow-y-auto overscroll-contain scrollbar-thin">
            {/* Exact Locked Balance Strip (Uneditable & Bound to Debt Record) */}
            <div
              data-testid="checkout-locked-amount-bar"
              className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                payoff.isIOweLocked
                  ? isLight
                    ? 'bg-rose-50/85 border-rose-200/90'
                    : isVelvetPink
                    ? 'bg-[#FF2E93]/12 border-[#FF65B5]/35'
                    : 'bg-rose-500/[0.09] border-rose-400/28'
                  : isLight
                  ? 'bg-emerald-50/85 border-emerald-200/90'
                  : 'bg-emerald-500/[0.09] border-emerald-400/28'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Compact Circular Progress Ring Preview */}
                <div
                  data-testid="checkout-progress-preview"
                  className="relative w-11 h-11 shrink-0 flex items-center justify-center"
                >
                  <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90" aria-hidden="true">
                    <circle
                      cx="22"
                      cy="22"
                      r={ringRadius}
                      fill="transparent"
                      stroke={isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="3.5"
                    />
                    <motion.circle
                      cx="22"
                      cy="22"
                      r={ringRadius}
                      fill="transparent"
                      stroke={
                        checkoutPhase === 'settled_100'
                          ? '#10B981'
                          : payoff.isIOweLocked
                          ? isVelvetPink
                            ? '#FF2E93'
                            : '#F43F5E'
                          : '#10B981'
                      }
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <span
                    data-numeric="true"
                    className={`absolute text-[10px] font-numeric font-bold tabular-nums ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {displayRingPercent}%
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Lock
                      className={`w-3.5 h-3.5 shrink-0 ${
                        payoff.isIOweLocked
                          ? isVelvetPink
                            ? 'text-[#FF65B5]'
                            : isLight
                            ? 'text-rose-700'
                            : 'text-rose-400'
                          : isLight
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold truncate ${
                        payoff.isIOweLocked
                          ? isLight
                            ? 'text-rose-800'
                            : isVelvetPink
                            ? 'text-[#FFD6EB]'
                            : 'text-rose-200'
                          : isLight
                          ? 'text-emerald-800'
                          : 'text-emerald-200'
                      }`}
                    >
                      {payoff.isIOweLocked
                        ? pick(
                            "Locked 'I Owe' Payoff",
                            'مبلغ الدفع المقفل المستحق عليك',
                            'بڕی قەرزی دیاریکراو (سەرنەگۆڕ)',
                            'Kilitli Borç Tutarı',
                            'Montant exact verrouillé',
                            "Saldo exacto bloqueado ('Debo')"
                          )
                        : pick(
                            'Exact Settlement Amount',
                            'مبلغ التسوية المحدد',
                            'بڕی پاکتاوکردنی دیاریکراو',
                            'Kesin Ödeme Tutarı',
                            'Montant exact à régler',
                            'Monto exacto a liquidar'
                          )}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="font-pricedown tracking-wide">{loan.personName}</span>
                    {loan.linkedUsername ? ` · @${loan.linkedUsername.replace(/^@+/, '')}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-end shrink-0">
                <div
                  data-testid="checkout-locked-amount-value"
                  data-numeric="true"
                  dir="ltr"
                  className={`text-lg sm:text-xl font-black font-numeric tabular-nums tracking-tight ${
                    payoff.isIOweLocked
                      ? isLight
                        ? 'text-rose-700'
                        : isVelvetPink
                        ? 'text-[#FF65B5]'
                        : 'text-rose-300'
                      : isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-300'
                  }`}
                >
                  {formattedUnsigned}
                </div>
                {showDualCurrency && payoff.lockedExactAmount > 0 && (() => {
                  const lockedDual = resolveRecordDualEquivalent(
                    payoff.lockedExactAmount,
                    loanCurrency,
                    customRates,
                    loan
                  );
                  return (
                    <span
                      data-testid="checkout-locked-amount-fx"
                      data-numeric="true"
                      dir="ltr"
                      className={`text-[11px] font-numeric tabular-nums font-semibold block ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      ≈ {formatCardDebt(lockedDual.convertedAmount, lockedDual.targetCurrency, language)}
                      {loanCurrency !== 'USD' && lockedDual.usedRateUsdToIqd > 0
                        ? ` · @${lockedDual.usedRateUsdToIqd.toLocaleString('en-US')}`
                        : ''}
                    </span>
                  );
                })()}
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {loanCurrency} · {pick('Exact & Locked', 'مقفل بدقة', 'جێگیرکراو', 'Sabit', 'Verrouillé', 'Exacto y bloqueado')}
                </span>
              </div>
            </div>

            {!isPaymentPermitted && (
              <div
                role="alert"
                data-testid="checkout-they-owe-blocked-notice"
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{getErrorText('they_owe_me_blocked')}</span>
              </div>
            )}

            {isFib ? (
              <>
                {/* Authentic First Iraqi Bank Glassmorphic Rail Card */}
                <div
                  data-testid="fib-glassmorphic-card"
                  className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-emerald-400/40 bg-gradient-to-br from-[#06182C]/98 via-[#08283B]/95 to-[#042A21]/98 shadow-xl shadow-emerald-950/40 text-white"
                >
                  <div className="pointer-events-none absolute -top-12 -end-10 w-44 h-44 rounded-full bg-emerald-400/[0.16] blur-2xl" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />

                  <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="px-2 py-1 rounded-xl bg-[#041422]/85 border border-emerald-400/40 text-emerald-300 shadow-sm shrink-0">
                        <FibBadgeSvg className="h-3.5 w-auto" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold tracking-wide text-emerald-300 block truncate">
                          FIRST IRAQI BANK
                        </span>
                        <span className="text-[10px] text-slate-300/80 block truncate">
                          {pick('Instant Digital Settlement', 'تسوية رقمية فورية', 'پاکتاوکردنی خێرای دیجیتاڵی', 'Anlık Dijital Ödeme', 'Règlement Numérique Instantané', 'Pago digital instantáneo')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-xl bg-emerald-500/18 border border-emerald-400/35 text-emerald-200 shrink-0">
                      {fibMethod === 'qr' ? 'QuickPay QR' : 'IBAN / Account'}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between gap-3 pt-2 border-t border-white/[0.14]">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-300/75 block">
                        {pick('Recipient / Debt', 'المستفيد / السجل', 'بەرامبەر / قەرز', 'Alıcı / Kayıt', 'Bénéficiaire', 'Destinatario / Deuda')}
                      </span>
                      <p dir="auto" className="text-sm font-bold font-pricedown tracking-wide text-white truncate">
                        {resolvedCounterpartyFib.recipientName || loan.personName}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="text-[10px] text-slate-300/75 block">
                        {pick('Locked Total', 'المبلغ المقفل', 'بڕی جێگیر', 'Kilitli Tutar', 'Total verrouillé', 'Total bloqueado')}
                      </span>
                      <span data-numeric="true" dir="ltr" className="text-lg sm:text-xl font-black font-numeric text-emerald-300 tabular-nums">
                        {formattedDue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified or Extracted Counterparty FIB Account Card with 1-Tap Copy IBAN */}
                {(resolvedCounterpartyFib.hasFib || Boolean(extractedQrInfo)) && (
                  <div
                    data-testid="fib-verified-recipient-card"
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-emerald-50/90 border-emerald-200'
                        : 'bg-[#041422]/85 border-emerald-400/30'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isLight ? 'text-emerald-800' : 'text-emerald-300'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {extractedQrInfo
                            ? pick(
                                'Scanned FIB Recipient IBAN',
                                'آيبان FIB المستخرج من QR',
                                'IBANـی خوێنراوەی FIB',
                                'Taranan FIB Alıcı IBAN',
                                'IBAN FIB scanné du bénéficiaire',
                                'IBAN FIB escaneado del destinatario'
                              )
                            : pick(
                                'Verified Recipient FIB IBAN',
                                'آيبان FIB الموثق للمستفيد',
                                'IBANـی دڵنیاکراوی FIB',
                                'Doğrulanmış Alıcı FIB IBAN',
                                'IBAN FIB vérifié du bénéficiaire',
                                'IBAN FIB verificado del destinatario'
                              )}
                        </span>
                      </span>
                      <p
                        dir="ltr"
                        data-testid="fib-verified-iban-value"
                        className={`text-xs sm:text-sm font-mono font-bold tabular-nums truncate mt-0.5 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {extractedQrInfo?.formattedAccount || resolvedCounterpartyFib.formattedFibAccount}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      data-testid="fib-copy-iban-btn"
                      onClick={() =>
                        copyTextValue(
                          extractedQrInfo?.normalizedAccount ||
                            resolvedCounterpartyFib.fibAccount ||
                            activeQrFibAccount
                        )
                      }
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 shrink-0 cursor-pointer smooth-interactive ${
                        copiedIban
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : isLight
                          ? 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-400/35'
                      }`}
                    >
                      {copiedIban ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {copiedIban
                          ? pick('Copied!', 'تم النسخ!', 'کۆپیکرا!', 'Kopyalandı!', 'Copié !', '¡Copiado!')
                          : pick('Copy IBAN', 'نسخ IBAN', 'کۆپی IBAN', 'IBAN Kopyala', 'Copier IBAN', 'Copiar IBAN')}
                      </span>
                    </button>
                  </div>
                )}

                {/* FIB Sub-Option Selector: QuickPay QR vs IBAN/Account */}
                <div
                  className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
                    isLight
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-[#051422]/85 border-emerald-400/20'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isProcessing}
                    data-testid="fib-mode-qr"
                    onClick={() => {
                      setFibMethod('qr');
                      setErrorField(null);
                      setErrorMsg(null);
                    }}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 smooth-interactive cursor-pointer ${
                      fibMethod === 'qr'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/25'
                        : isLight
                        ? 'text-slate-700 hover:text-emerald-900'
                        : 'text-slate-300 hover:text-emerald-300'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate whitespace-nowrap">
                      {pick('FIB QuickPay QR', 'رمز QuickPay QR', 'کۆدی QuickPay QR', 'FIB QuickPay QR', 'QR QuickPay FIB', 'QR QuickPay FIB')}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    data-testid="fib-mode-iban"
                    onClick={() => {
                      setFibMethod('iban');
                      setIsScannerOpen(false);
                      stopCameraScanner();
                      setErrorField(null);
                      setErrorMsg(null);
                    }}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 smooth-interactive cursor-pointer ${
                      fibMethod === 'iban'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/25'
                        : isLight
                        ? 'text-slate-700 hover:text-emerald-900'
                        : 'text-slate-300 hover:text-emerald-300'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate whitespace-nowrap">
                      {pick('IBAN / Account', 'IBAN / رقم الحساب', 'IBAN / هەژمار', 'IBAN / Hesap', 'IBAN / Compte', 'IBAN / Cuenta')}
                    </span>
                  </button>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    data-testid="fib-payment-error"
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      isLight
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {fibMethod === 'qr' ? (
                  <div
                    data-testid="fib-qr-panel"
                    className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2.5 ${
                      isLight
                        ? 'bg-emerald-50/55 border-emerald-200'
                        : 'bg-[#041422]/78 border-emerald-400/25'
                    }`}
                  >
                    <RealFibQrCode
                      value={fibQrPayload}
                      size={136}
                      testId="fib-checkout-real-qr"
                    />

                    <div className="space-y-1.5 w-full">
                      <p data-numeric="true" className={`text-xs font-mono font-bold tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                        {fibQuickRef} · {formattedUnsigned}
                      </p>
                      <div
                        className={`mx-auto max-w-full px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isLight
                            ? 'bg-white border-emerald-200 text-slate-900'
                            : 'bg-[#030E19]/90 border-emerald-400/25 text-slate-100'
                        }`}
                      >
                        <span dir="ltr" className="text-[11px] font-mono font-bold tabular-nums truncate">
                          {formattedQrFibAccount}
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          data-testid="fib-qr-copy-iban-btn"
                          onClick={handleCopyVerifiedIban}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer smooth-interactive ${
                            copiedIban
                              ? 'bg-emerald-500 text-slate-950'
                              : isLight
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                          }`}
                        >
                          {copiedIban ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>
                            {copiedIban
                              ? pick('Copied!', 'تم النسخ!', 'کۆپیکرا!', 'Kopyalandı!', 'Copié !', '¡Copiado!')
                              : pick('Copy IBAN', 'نسخ IBAN', 'کۆپی IBAN', 'IBAN Kopyala', 'Copier IBAN', 'Copiar IBAN')}
                          </span>
                        </button>
                      </div>
                      <p className={`text-[11px] max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {pick(
                          'Scan this real FIB QR code with First Iraqi Bank, copy the IBAN, or tap Transfer via FIB below.',
                          'امسح رمز FIB QR الحقيقي، انسخ رقم الآيبان، أو اضغط تحويل عبر FIB بالأسفل.',
                          'ئەم کۆدی QRـە ڕاستەقینەیە لە ئەپی FIB سکان بکە، IBAN کۆپی بکە، یان ناردن دابگرە.',
                          'Bu gerçek FIB QR kodunu okutun, IBAN’ı kopyalayın veya aşağıdan transfer edin.',
                          'Scannez ce vrai QR FIB, copiez l’IBAN ou validez le transfert ci-dessous.',
                          'Escanea este QR real de FIB con First Iraqi Bank, copia el IBAN o toca Transferir.'
                        )}
                      </p>
                    </div>

                    {extractedQrInfo && (
                      <div
                        data-testid="fib-qr-extracted-badge"
                        className={`w-full p-2.5 rounded-xl border text-start flex items-center justify-between gap-2 ${
                          isLight
                            ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
                            : 'bg-emerald-500/15 border-emerald-400/45 text-emerald-100'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block ${
                              isLight ? 'text-emerald-800' : 'text-emerald-400'
                            }`}
                          >
                            {pick('QR Extracted · Ready to Transfer', 'تم استخراج QR · جاهز للتحويل', 'زانیاری QR دەرهێنرا · ئامادەیە', 'QR Okundu · Transfere Hazır', 'QR Extrait · Prêt', 'QR extraído · Listo para transferir')}
                          </span>
                          <p dir="ltr" className="text-xs font-mono font-bold truncate">
                            {extractedQrInfo.formattedAccount}
                          </p>
                        </div>
                        <span
                          data-numeric="true"
                          dir="ltr"
                          className={`text-xs font-black font-numeric tabular-nums shrink-0 ${
                            isLight ? 'text-emerald-900' : 'text-emerald-300'
                          }`}
                        >
                          {formattedUnsigned}
                        </span>
                      </div>
                    )}

                    {/* Action Row: Scan FIB QR + Scan with FIB App */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        data-testid="fib-open-scanner-btn"
                        onClick={() => {
                          if (isScannerOpen) {
                            stopCameraScanner();
                            setIsScannerOpen(false);
                          } else {
                            handleOpenQrScanner();
                          }
                        }}
                        className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 smooth-interactive cursor-pointer ${
                          isScannerOpen
                            ? isLight
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                              : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                            : isLight
                            ? 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                        }`}
                      >
                        <ScanLine className="w-4 h-4 shrink-0" />
                        <span>
                          {isScannerOpen
                            ? pick('Close Scanner', 'إغلاق الماسح', 'داخستنی سکانەر', 'Tarayıcıyı Kapat', 'Fermer Scanner', 'Cerrar escáner')
                            : pick('Scan FIB QR', 'مسح رمز FIB QR', 'سکانکردنی FIB QR', 'FIB QR Tara', 'Scanner QR FIB', 'Escanear QR FIB')}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        data-testid="fib-scan-app-btn"
                        onClick={() => {
                          setFibQrScanned(true);
                          setErrorField(null);
                          setErrorMsg(null);
                        }}
                        className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 smooth-interactive cursor-pointer ${
                          fibQrScanned
                            ? isLight
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                              : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-400'
                            : isLight
                            ? 'bg-[#062238] hover:bg-[#093252] text-emerald-300 border-[#062238]'
                            : 'bg-[#062238] hover:bg-[#0A304E] text-emerald-300 border-emerald-400/40'
                        }`}
                      >
                        {fibQrScanned ? (
                          <>
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                            <span>
                              {pick('FIB Linked', 'تم الربط', 'بەسترایەوە', 'Bağlandı', 'Lié', 'FIB vinculado')}
                            </span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 shrink-0" />
                            <span>
                              {pick('Scan with FIB App', 'فتح تطبيق FIB', 'ئەپی FIB', 'FIB Uygulaması', 'App FIB', 'Abrir App FIB')}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Interactive Camera & QR Payload Auto-Extractor Panel */}
                    <AnimatePresence>
                      {isScannerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          data-testid="fib-qr-scanner-panel"
                          className={`w-full overflow-hidden rounded-2xl border p-3 text-start space-y-2.5 ${
                            isLight
                              ? 'bg-white border-emerald-300'
                              : 'bg-[#030F1B] border-emerald-400/40'
                          }`}
                        >
                          {/* Viewfinder Frame */}
                          <div className="relative h-28 rounded-xl overflow-hidden bg-[#041422] border border-emerald-400/35 flex items-center justify-center">
                            <video
                              ref={videoRef}
                              playsInline
                              muted
                              className={`absolute inset-0 w-full h-full object-cover ${
                                scannerCameraActive ? 'opacity-90' : 'opacity-0 pointer-events-none'
                              }`}
                            />
                            <div className="relative z-10 flex flex-col items-center gap-1.5 text-center px-3">
                              <Camera className="w-5 h-5 text-emerald-400" />
                              <span className="text-[11px] font-medium text-emerald-100/90 leading-snug">
                                {scannerStatusMsg}
                              </span>
                            </div>
                            {/* Animated Scanner Laser Line */}
                            <motion.div
                              aria-hidden="true"
                              animate={{ y: [-38, 38, -38] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                              className="pointer-events-none absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            />
                          </div>

                          <button
                            type="button"
                            data-testid="fib-auto-scan-demo-btn"
                            onClick={() =>
                              handleApplyScannedQrPayload(
                                resolvedCounterpartyFib.qrPayload ||
                                  `fib://pay?account=IQ98FIRA000010048291037&amount=${lockedExactAmount}&currency=${loanCurrency}`
                              )
                            }
                            className={`w-full min-h-[38px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer smooth-interactive ${
                              isLight
                                ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/50 text-emerald-300'
                            }`}
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>
                              {pick(
                                'Scan Counterparty QR Frame (Auto-Fill IBAN)',
                                'التقاط رمز المستفيد وتعبئة IBAN تلقائياً',
                                'خوێندنەوەی کۆدی QR و پڕکردنەوەی خۆکاری IBAN',
                                'QR Çerçevesini Yakala (IBAN Otomatik Doldur)',
                                'Capturer le QR (Remplir IBAN)',
                                'Escanear marco QR (Autocompletar IBAN)'
                              )}
                            </span>
                          </button>

                          <div className="flex items-center gap-2" dir="ltr">
                            <input
                              type="text"
                              data-testid="fib-qr-payload-input"
                              value={scannerPayloadInput}
                              onChange={(e) => setScannerPayloadInput(e.target.value)}
                              placeholder="fib://pay?account=IQ98FIRA000010048291037&amount=..."
                              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-mono outline-none ${inputSurface} ${
                                isLight ? 'border-slate-300' : 'border-emerald-400/25'
                              }`}
                            />
                            <button
                              type="button"
                              data-testid="fib-extract-qr-btn"
                              onClick={() => handleApplyScannedQrPayload(scannerPayloadInput)}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
                            >
                              {pick('Extract', 'استخراج', 'دەرهێنان', 'Çıkar', 'Extraire', 'Extraer')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div data-testid="fib-iban-panel" className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {pick('Quick Demo Credentials:', 'بيانات تجريبية سريعة:', 'زانیاری تاقیکردنەوە:', 'Hızlı Demo Hesap:', 'Compte démo rapide :', 'Credenciales demo rápidas:')}
                      </span>
                      <button
                        type="button"
                        disabled={isProcessing}
                        data-testid="fill-demo-fib-btn"
                        onClick={fillDemoFibAccount}
                        className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer smooth-interactive ${
                          isLight
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/35'
                        }`}
                      >
                        <FibBadgeSvg className="h-3 w-auto" />
                        <span>IQ98 FIRA ••••</span>
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label htmlFor="fib-account-input" className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {pick(
                            'FIB Account Number or Iraqi IBAN',
                            'رقم حساب FIB أو الآيبان (IBAN)',
                            'ژمارەی هەژماری FIB یان IBAN',
                            'FIB Hesap Numarası veya IBAN',
                            'Numéro de compte FIB ou IBAN',
                            'Número de cuenta FIB o IBAN iraquí'
                          )}
                        </label>
                        {manualFibValidation.valid && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            data-testid="fib-iban-copy-btn"
                            onClick={() => copyTextValue(manualFibValidation.normalized || fibAccountInput.trim())}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 shrink-0 cursor-pointer smooth-interactive ${
                              copiedIban
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : isLight
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/35'
                            }`}
                          >
                            {copiedIban ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>
                              {copiedIban
                                ? pick('Copied!', 'تم النسخ!', 'کۆپیکرا!', 'Kopyalandı!', 'Copié !', '¡Copiado!')
                                : pick('Copy IBAN', 'نسخ IBAN', 'کۆپی IBAN', 'IBAN Kopyala', 'Copier IBAN', 'Copiar IBAN')}
                            </span>
                          </button>
                        )}
                      </div>
                      <input
                        id="fib-account-input"
                        data-testid="fib-account-input"
                        dir="ltr"
                        type="text"
                        value={fibAccountInput}
                        onChange={(e) => {
                          setFibAccountInput(formatFibIbanOrAccount(e.target.value));
                          if (errorMsg) {
                            setErrorField(null);
                            setErrorMsg(null);
                          }
                        }}
                        placeholder="IQ98 FIRA 0000 1004 8291 037"
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm font-mono tabular-nums outline-none smooth-interactive ${inputSurface} ${
                          errorField === 'accountOrIban'
                            ? 'border-rose-500'
                            : isLight
                            ? 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
                            : 'border-emerald-400/25 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="fib-holder-input" className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {pick(
                          'Account Holder / Client Name (Optional)',
                          'اسم صاحب الحساب (اختياري)',
                          'ناوی خاوەنی هەژمار (دڵخوازانە)',
                          'Hesap Sahibi (İsteğe Bağlı)',
                          'Titulaire du compte (Optionnel)',
                          'Titular / Nombre del cliente (Opcional)'
                        )}
                      </label>
                      <input
                        id="fib-holder-input"
                        data-testid="fib-holder-input"
                        type="text"
                        value={fibHolderName}
                        onChange={(e) => setFibHolderName(e.target.value)}
                        placeholder={loan.personName || 'First Iraqi Bank Client'}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm outline-none smooth-interactive ${inputSurface} ${
                          isLight
                            ? 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
                            : 'border-emerald-400/25 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || !isPaymentPermitted}
                  data-testid="confirm-fib-payment-btn"
                  className="w-full min-h-[48px] py-3.5 rounded-2xl disabled:opacity-55 font-black text-sm shadow-lg flex items-center justify-center gap-2 smooth-interactive cursor-pointer active:scale-[0.98] bg-gradient-to-r from-[#00B16A] via-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25"
                >
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                  <span data-numeric="true" className="font-numeric tabular-nums">
                    {pick(
                      `Transfer via FIB · ${formattedUnsigned}`,
                      `تحويل عبر FIB · ${formattedUnsigned}`,
                      `ناردن بە FIB · ${formattedUnsigned}`,
                      `FIB ile Transfer Et · ${formattedUnsigned}`,
                      `Transférer via FIB · ${formattedUnsigned}`,
                      `Transferir vía FIB · ${formattedUnsigned}`
                    )}
                  </span>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                </button>
              </>
            ) : (
              <>
                {/* Interactive Glassmorphic EMV Payment Card Preview */}
                <div
                  data-testid="glassmorphic-card-preview"
                  className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border backdrop-blur-2xl shadow-xl transition-all duration-300 ${
                    brand === 'visa'
                      ? 'bg-gradient-to-br from-[#0F2C6B]/95 via-[#0B1E4B]/95 to-[#06102A]/98 border-sky-400/45 shadow-sky-950/50'
                      : brand === 'mastercard'
                      ? 'bg-gradient-to-br from-[#2B170A]/95 via-[#1A1120]/95 to-[#090B16]/98 border-amber-400/45 shadow-amber-950/50'
                      : isVelvetPink
                      ? 'bg-gradient-to-br from-[#2A1332]/95 via-[#190D1E]/95 to-[#0E0712]/98 border-[#FF65B5]/35 shadow-[#FF2E93]/20'
                      : 'bg-gradient-to-br from-[#112046]/95 via-[#0B132B]/95 to-[#060919]/98 border-white/20 shadow-slate-950/60'
                  }`}
                >
                  <div className="pointer-events-none absolute -top-12 -end-10 w-44 h-44 rounded-full bg-white/[0.09] blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-14 -start-10 w-40 h-40 rounded-full bg-amber-400/[0.08] blur-2xl" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                  <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 38 28" className="w-9 h-7 drop-shadow-sm" aria-hidden="true">
                        <defs>
                          <linearGradient id="emvChipGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FDE68A" />
                            <stop offset="50%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                        </defs>
                        <rect x="1" y="1" width="36" height="26" rx="5" fill="url(#emvChipGrad)" stroke="#FEF3C7" strokeOpacity="0.6" strokeWidth="1" />
                        <path d="M1 10h11M26 10h11M1 18h11M26 18h11M13 1v26M25 1v26M13 10h12M13 18h12" stroke="#78350F" strokeOpacity="0.55" strokeWidth="1" fill="none" />
                      </svg>

                      <svg viewBox="0 0 20 20" className="w-4 h-4 text-white/65" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                        <path d="M6.5 7.5a4 4 0 0 1 0 5" />
                        <path d="M9.5 5.5a7 7 0 0 1 0 9" />
                        <path d="M12.5 3.5a10 10 0 0 1 0 13" />
                      </svg>

                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/65">
                        {brand === 'visa' ? 'VISA SECURE' : brand === 'mastercard' ? 'MASTERCARD' : 'DUAL GATEWAY'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-1 rounded-lg border backdrop-blur-md transition-all ${
                          brand === 'visa'
                            ? 'bg-sky-400/25 border-sky-300/70 text-white shadow-sm'
                            : 'bg-white/[0.05] border-white/[0.12] text-slate-300/75'
                        }`}
                      >
                        <VisaBadgeSvg className="h-3.5 w-auto" />
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-lg border backdrop-blur-md transition-all ${
                          brand === 'mastercard'
                            ? 'bg-amber-400/25 border-amber-300/70 shadow-sm'
                            : 'bg-white/[0.05] border-white/[0.12] opacity-75'
                        }`}
                      >
                        <MastercardBadgeSvg className="h-4.5 w-auto" />
                      </span>
                    </div>
                  </div>

                  <div dir="ltr" className="relative z-10 font-numeric text-lg sm:text-xl font-bold tracking-[0.18em] text-white drop-shadow-sm tabular-nums mb-3.5">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="relative z-10 flex items-end justify-between gap-3 pt-2.5 border-t border-white/[0.14]">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-300/75 block">
                        {pick('Cardholder', 'حامل البطاقة', 'خاوەنی کارت', 'Kart Sahibi', 'Titulaire', 'Titular')}
                      </span>
                      <p dir="auto" className="text-xs font-bold uppercase tracking-wider text-white truncate">
                        {cardholderName.trim() || loan.personName || 'CARDHOLDER NAME'}
                      </p>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-300/75 block">
                        {pick('Locked Total', 'المبلغ المقفل', 'بڕی جێگیر', 'Kilitli Tutar', 'Total verrouillé', 'Total bloqueado')}
                      </span>
                      <span data-numeric="true" dir="ltr" className="text-base sm:text-lg font-black font-numeric text-emerald-300 tabular-nums">
                        {formattedDue}
                      </span>
                    </div>

                    <div dir="ltr" className="text-right font-numeric text-xs text-white/90 tabular-nums shrink-0 ps-2 border-s border-white/[0.12]">
                      <span className="text-[9px] uppercase text-slate-300/75 block">EXP</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Demo Card Presets */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick('Quick Demo Cards:', 'بطاقات تجريبية:', 'کارتی تاقیکردنەوە:', 'Hızlı Demo Kartlar:', 'Cartes démo rapides :', 'Tarjetas demo rápidas:')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      data-testid="fill-demo-visa-btn"
                      onClick={() => fillDemoCard('visa')}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer smooth-interactive ${
                        isLight
                          ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border-sky-400/35'
                      }`}
                    >
                      <VisaBadgeSvg className="h-2.5 w-auto" />
                      <span>4111 ••••</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      data-testid="fill-demo-mc-btn"
                      onClick={() => fillDemoCard('mastercard')}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer smooth-interactive ${
                        isLight
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-400/35'
                      }`}
                    >
                      <MastercardBadgeSvg className="h-3.5 w-auto" />
                      <span>5500 ••••</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    data-testid="card-payment-error"
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      isLight
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="card-holder-input" className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {pick('Cardholder Name', 'اسم حامل البطاقة', 'ناوی خاوەنی کارت', 'Kart Sahibinin Adı', 'Nom du titulaire', 'Nombre del titular')}
                  </label>
                  <input
                    id="card-holder-input"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={pick('e.g. Tariq Ali', 'مثال: طارق علي', 'نموونە: تارق عەلی', 'Örn: Ahmet Yılmaz', 'Ex: Jean Dupont', 'Ej: Carlos Mendoza')}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm outline-none smooth-interactive ${inputSurface} ${
                      errorField === 'cardholderName'
                        ? 'border-rose-500'
                        : isLight
                        ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                        : isVelvetPink
                        ? 'border-[#E8B4A0]/25 focus:border-[#FF65B5] focus:ring-2 focus:ring-[#FF2E93]/20'
                        : 'border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="card-number-input" className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick('Card Number (Visa / Mastercard)', 'رقم البطاقة', 'ژمارەی کارت', 'Kart Numarası', 'Numéro de carte', 'Número de tarjeta (Visa / Mastercard)')}
                    </label>
                    <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-amber-700' : isVelvetPink ? 'text-[#FF65B5]' : 'text-amber-300'}`}>
                      {brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'Mastercard' : ''}
                    </span>
                  </div>
                  <input
                    id="card-number-input"
                    dir="ltr"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4111 1111 1111 1111"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm tabular-nums outline-none smooth-interactive ${inputSurface} ${
                      errorField === 'cardNumber'
                        ? 'border-rose-500'
                        : isLight
                        ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                        : isVelvetPink
                        ? 'border-[#E8B4A0]/25 focus:border-[#FF65B5] focus:ring-2 focus:ring-[#FF2E93]/20'
                        : 'border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card-expiry-input" className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick('Expiry Date', 'تاريخ الانتهاء', 'بەرواری بەسەرچوون', 'Son Kullanma', 'Expiration', 'Vencimiento')}
                    </label>
                    <input
                      id="card-expiry-input"
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(e) => setExpiry(formatCardExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm tabular-nums outline-none smooth-interactive ${inputSurface} ${
                        errorField === 'expiry'
                          ? 'border-rose-500'
                          : isLight
                          ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                          : isVelvetPink
                          ? 'border-[#E8B4A0]/25 focus:border-[#FF65B5] focus:ring-2 focus:ring-[#FF2E93]/20'
                          : 'border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="card-cvv-input" className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {pick('CVV / CVC', 'رمز الأمان CVV', 'کۆدی CVV', 'CVV Kodu', 'Cryptogramme CVV', 'CVV / CVC')}
                    </label>
                    <input
                      id="card-cvv-input"
                      dir="ltr"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="cc-csc"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm tabular-nums outline-none smooth-interactive ${inputSurface} ${
                        errorField === 'cvv'
                          ? 'border-rose-500'
                          : isLight
                          ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                          : isVelvetPink
                          ? 'border-[#E8B4A0]/25 focus:border-[#FF65B5] focus:ring-2 focus:ring-[#FF2E93]/20'
                          : 'border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !isPaymentPermitted}
                  data-testid="confirm-card-payment-btn"
                  className={`w-full min-h-[48px] py-3.5 rounded-2xl disabled:opacity-55 font-black text-sm shadow-lg flex items-center justify-center gap-2 smooth-interactive cursor-pointer active:scale-[0.98] ${
                    isVelvetPink
                      ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white shadow-[#FF2E93]/30'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  <ShieldCheck glow="accent" className="w-4.5 h-4.5 shrink-0" />
                  <span data-numeric="true" className="font-numeric tabular-nums">
                    {pick(
                      `Confirm & Settle · ${formattedUnsigned}`,
                      `تأكيد وسداد · ${formattedUnsigned}`,
                      `پشتڕاستکردنەوە و دانی · ${formattedUnsigned}`,
                      `Onayla ve Öde · ${formattedUnsigned}`,
                      `Confirmer et Régler · ${formattedUnsigned}`,
                      `Confirmar y Pagar · ${formattedUnsigned}`
                    )}
                  </span>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                </button>
              </>
            )}

            {/* Animated 60fps Glassmorphic Verification & 100% Ring Settlement Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  key="processing-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  data-testid={isFib ? 'fib-processing-overlay' : 'card-processing-overlay'}
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5 backdrop-blur-md p-6 text-center ${
                    isFib ? 'bg-[#041422]/92' : isVelvetPink ? 'bg-[#120B14]/90' : 'bg-slate-950/88'
                  }`}
                >
                  {checkoutPhase === 'settled_100' ? (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      data-testid="checkout-settled-100-ring"
                      className="relative w-20 h-20 flex items-center justify-center"
                    >
                      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90" aria-hidden="true">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="rgba(16, 185, 129, 0.18)"
                          strokeWidth="5.5"
                        />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="5.5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 32}
                          initial={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - payoff.progressBefore / 100) }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </svg>
                      <span data-numeric="true" className="absolute text-base font-black font-numeric text-emerald-300 tabular-nums">
                        100%
                      </span>
                    </motion.div>
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg ${
                        isFib
                          ? 'bg-emerald-500/18 border-emerald-400/50 shadow-emerald-500/25'
                          : 'bg-amber-400/20 border-amber-300/50 shadow-amber-500/20'
                      }`}
                    >
                      <Loader2 className={`w-7 h-7 animate-spin ${isFib ? 'text-emerald-300' : 'text-amber-300'}`} />
                    </div>
                  )}

                  <p className="text-sm font-black text-white">
                    {checkoutPhase === 'settled_100'
                      ? pick(
                          '100% Settled · Moving to Archive',
                          'تم السداد ١٠٠٪ · نقل للأرشيف',
                          '١٠٠٪ پاکتاوکرا · گواستنەوە بۆ ئەرشیف',
                          '%100 Ödendi · Arşive Taşınıyor',
                          '100% Réglé · Archivage en cours',
                          '100% Liquidado · Moviendo al Archivo'
                        )
                      : isFib
                      ? pick(
                          'Verifying with FIB...',
                          'جارٍ التحقق مع مصرف العراق الأول (FIB)...',
                          'دڵنیابوونەوە لەگەڵ بانکی FIB...',
                          'First Iraqi Bank (FIB) ile Doğrulanıyor...',
                          'Vérification avec First Iraqi Bank...',
                          'Verificando con First Iraqi Bank (FIB)...'
                        )
                      : pick(
                          `Authorizing ${brand === 'mastercard' ? 'Mastercard' : 'Visa'} Settlement...`,
                          `جارٍ توثيق السداد عبر ${brand === 'mastercard' ? 'Mastercard' : 'Visa'}...`,
                          `پشکنینی پارەدانی ${brand === 'mastercard' ? 'Mastercard' : 'Visa'}...`,
                          `${brand === 'mastercard' ? 'Mastercard' : 'Visa'} Onaylanıyor...`,
                          `Autorisation ${brand === 'mastercard' ? 'Mastercard' : 'Visa'}...`,
                          `Autorizando pago con ${brand === 'mastercard' ? 'Mastercard' : 'Visa'}...`
                        )}
                  </p>
                  <p data-numeric="true" dir="ltr" className="text-sm font-black font-numeric text-emerald-300 tabular-nums">
                    {formattedUnsigned} · {loanCurrency}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
