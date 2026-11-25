import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AiPersonality,
  AttachedFile,
  ChatMessage,
  ChatSession,
  Language,
  Loan,
  LoanType,
  ThemeMode,
  Translations,
  UserSettings,
} from '../types';
import {
  analyzePortfolioIntelligence,
  formatCardDebt,
  generateAdvancedAiResponse,
  isLightThemeMode,
  ParsedAiLedgerCommand,
  parseNaturalLanguageLedgerCommand,
} from '../utils/loanLogic';
import { playResetChime } from '../utils/soundEffects';
import {
  Bot,
  X,
  Send,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Edit2,
  Paperclip,
  Search,
  PlusCircle,
  Plus,
  FileText,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2,
  Trash2,
  ShieldCheck,
  BarChart3,
  UserCheck,
  Compass,
} from './OrganicIcons';

interface BudgetAiFABProps {
  language: Language;
  translations: Translations;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  activeSession: ChatSession;
  onUpdateSessionMessages: (messages: ChatMessage[]) => void;
  onNewSession: () => void;
  allLoans: Loan[];
  onAddLoanFromAi: (data: { personName: string; amount: number; type: LoanType; currency?: import('../types').CurrencyCode; dueDate?: string; notes?: string }) => void;
  onExecuteAiLedgerAction?: (cmd: ParsedAiLedgerCommand) => void;
  isExternalOpen?: boolean;
  onToggleExternalOpen?: (open: boolean) => void;
  showFloatingFab?: boolean;
  themeMode?: ThemeMode;
}

export const BudgetAiFAB: React.FC<BudgetAiFABProps> = ({
  language,
  translations,
  settings,
  onUpdateSettings,
  activeSession,
  onUpdateSessionMessages,
  onNewSession,
  allLoans,
  onAddLoanFromAi,
  onExecuteAiLedgerAction,
  isExternalOpen,
  onToggleExternalOpen,
  showFloatingFab = false,
  themeMode = 'obsidian_neon',
}) => {
  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isVelvetPink = themeMode === 'velvet_pink';
  const portfolioIntel = useMemo(
    () => analyzePortfolioIntelligence(allLoans, settings.currency),
    [allLoans, settings.currency]
  );
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isExternalOpen !== undefined ? isExternalOpen : internalOpen;

  const setOpenState = (open: boolean) => {
    if (onToggleExternalOpen) {
      onToggleExternalOpen(open);
    }
    setInternalOpen(open);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [recordedMessageIds, setRecordedMessageIds] = useState<string[]>([]);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const messages = activeSession.messages;

  const getSpeechLocale = (lang: Language) => {
    switch (lang) {
      case 'ku':
        return 'ckb-IQ';
      case 'ar':
        return 'ar-SA';
      case 'tr':
        return 'tr-TR';
      case 'fr':
        return 'fr-FR';
      case 'es':
        return 'es-ES';
      default:
        return 'en-US';
    }
  };

  // Handle immediate chat reset
  const handleResetCurrentChat = () => {
    const resetText =
      language === 'ku'
        ? 'گفتوگۆکە نوێکرایەوە! من Ai Budget ـم. بە کوردی، عەرەبی، ئینگلیزی، تورکی، فەڕەنسی یان ئیسپانی پرسیارم لێ بکە!'
        : language === 'ar'
        ? 'تم تفريغ المحادثة بنجاح! أنا المساعد المالي الذكي (Ai Budget). يمكنك التحدث معي بالعربية أو الإنجليزية أو الكردية أو التركية أو الفرنسية أو الإسبانية.'
        : language === 'tr'
        ? 'Sohbet sıfırlandı! Ben Ai Budget. Bana Türkçe, İngilizce, Arapça, Kürtçe, Fransızca veya İspanyolca soru sorabilirsiniz.'
        : language === 'fr'
        ? 'Conversation réinitialisée ! Je suis Ai Budget. Posez-moi vos questions en français, anglais, arabe, kurde, turc ou espagnol.'
        : language === 'es'
        ? '¡Chat reiniciado! Soy Ai Budget. Pregúntame en español, inglés, árabe, kurdo, turco o francés y responderé en tu idioma.'
        : 'Chat has been reset! I am Ai Budget. Ask me in English, Arabic, Kurdish, Turkish, French, or Spanish — I will reply in your language.';
    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome_' + Date.now(),
      sender: 'assistant',
      text: resetText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdateSessionMessages([welcomeMsg]);
    playResetChime(settings.soundEffectsEnabled);
  };

  // Handle assistant close with auto-reset if resetChatOnExit is enabled
  const handleCloseAssistant = () => {
    if (settings.resetChatOnExit) {
      handleResetCurrentChat();
    }
    setOpenState(false);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Clean up speech synthesis on unmount or close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Handle Speech-to-Text Voice Input
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiNotice(translations.voiceInputPermissionError);
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => {
        setAiNotice(null);
        noticeTimerRef.current = null;
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLocale(language);
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Handle Text-to-Speech Output
  const speakMessage = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLocale(language);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Copy Message
  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        setCopiedId(null);
        copiedTimerRef.current = null;
      }, 2000);
    } catch {
      // ignore
    }
  };

  // Handle File Upload (Receipts, Invoices, Images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAiNotice(translations.fileTooLarge);
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => {
        setAiNotice(null);
        noticeTimerRef.current = null;
      }, 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? base64 : undefined,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Core Send Message Function
  const handleSendMessage = async (textToSend?: string, overrideHistory?: ChatMessage[]) => {
    const query = (textToSend || inputValue).trim();
    if (!query && !attachedFile) return;

    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFile: attachedFile || undefined,
    };

    const currentHistory = overrideHistory || messages;
    const updatedMessages = [...currentHistory, userMessage];
    onUpdateSessionMessages(updatedMessages);

    setInputValue('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);

    try {
      // 0. Check deterministic Natural-Language Automatic Ledger Update FIRST (before LLM or fallback)
      const matchedLedgerCmd = !currentAttachment
        ? parseNaturalLanguageLedgerCommand(query, allLoans, language, settings.currency)
        : null;

      if (matchedLedgerCmd && onExecuteAiLedgerAction) {
        onExecuteAiLedgerAction(matchedLedgerCmd);
        const localLedgerReply = generateAdvancedAiResponse({
          question: query,
          language,
          personality: settings.aiPersonality,
          responseLength: settings.responseLength,
          loans: allLoans,
          activeCurrency: settings.currency,
          customInstructions: settings.customInstructions,
        });

        const aiMessage: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          sender: 'assistant',
          text: localLedgerReply.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ledgerUpdate: {
            actionType: matchedLedgerCmd.actionType,
            personName: matchedLedgerCmd.targetLoan.personName,
            loanType: matchedLedgerCmd.targetLoan.type,
            deltaAmount: matchedLedgerCmd.amountInLoanCurrency,
            deltaCurrency: matchedLedgerCmd.targetLoan.currency || settings.currency,
            balanceBefore: matchedLedgerCmd.balanceBefore,
            balanceAfter: matchedLedgerCmd.balanceAfter,
            loanCurrency: matchedLedgerCmd.targetLoan.currency || settings.currency,
            archived: matchedLedgerCmd.shouldArchive,
          },
        };

        onUpdateSessionMessages([...updatedMessages, aiMessage]);
        if (settings.autoVoiceResponse) {
          speakMessage(aiMessage.id, localLedgerReply.text);
        }
        return;
      }

      // 1. Attempt server-side Gemini AI call with timeout signal
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
          systemInstruction: settings.customInstructions,
          personality: settings.aiPersonality,
          responseLength: settings.responseLength,
          creativity: settings.creativity,
          language,
          loansContext: allLoans,
          attachedFile: currentAttachment
            ? {
                base64: currentAttachment.base64,
                mimeType: currentAttachment.type,
                name: currentAttachment.name,
              }
            : undefined,
        }),
      });

      let aiResultText = '';
      let suggestedAction: any = undefined;

      if (response.ok) {
        const data = await response.json();
        if (data.fallback || !data.text) {
          // Use intelligent local engine fallback
          const localRes = generateAdvancedAiResponse({
            question: query,
            language,
            personality: settings.aiPersonality,
            responseLength: settings.responseLength,
            loans: allLoans,
            activeCurrency: settings.currency,
            attachedFile: currentAttachment || undefined,
            customInstructions: settings.customInstructions,
          });
          aiResultText = localRes.text;
          suggestedAction = localRes.suggestedAction;
        } else {
          aiResultText = data.text;
        }
      } else {
        // Fallback on HTTP error
        const localRes = generateAdvancedAiResponse({
          question: query,
          language,
          personality: settings.aiPersonality,
          responseLength: settings.responseLength,
          loans: allLoans,
          activeCurrency: settings.currency,
          attachedFile: currentAttachment || undefined,
          customInstructions: settings.customInstructions,
        });
        aiResultText = localRes.text;
        suggestedAction = localRes.suggestedAction;
      }

      const aiMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: aiResultText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction,
      };

      onUpdateSessionMessages([...updatedMessages, aiMessage]);

      // Auto-voice response if setting enabled
      if (settings.autoVoiceResponse) {
        speakMessage(aiMessage.id, aiResultText);
      }
    } catch {
      // Graceful offline fallback
      const localRes = generateAdvancedAiResponse({
        question: query,
        language,
        personality: settings.aiPersonality,
        responseLength: settings.responseLength,
        loans: allLoans,
        activeCurrency: settings.currency,
        attachedFile: currentAttachment || undefined,
        customInstructions: settings.customInstructions,
      });

      const aiMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: localRes.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: localRes.suggestedAction,
      };

      onUpdateSessionMessages([...updatedMessages, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (messages.length < 2) return;
    // Find last user message
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.sender === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMsg = messages[actualIndex];
    const historyBefore = messages.slice(0, actualIndex);

    handleSendMessage(lastUserMsg.text, historyBefore);
  };

  // Edit Message
  const handleSaveEditedMessage = (messageId: string) => {
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;

    const newHistory = messages.slice(0, targetIdx);
    setEditingMessageId(null);
    handleSendMessage(editInputText, newHistory);
  };

  // Filter messages based on search query
  const displayedMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getPersonalityMeta = (p: AiPersonality) => {
    switch (p) {
      case 'diplomat':
        return { name: translations.personalityDiplomat, Icon: ShieldCheck };
      case 'auditor':
        return { name: translations.personalityAuditor, Icon: BarChart3 };
      case 'friend':
        return { name: translations.personalityFriend, Icon: UserCheck };
      case 'advisor':
      default:
        return { name: translations.personalityAdvisor, Icon: Compass };
    }
  };

  const personalityInfo = getPersonalityMeta(settings.aiPersonality);
  const PersonalityIcon = personalityInfo.Icon;

  return (
    <>
      {/* 1. Optional Floating Action Button (Only if enabled) */}
      {showFloatingFab && (
        <div className="fixed bottom-5 end-5 z-40">
          <button
            type="button"
            onClick={() => setOpenState(!isOpen)}
            aria-label={translations.aiAssistantTitle}
            title={translations.aiAssistantTitle}
            className={`smooth-interactive relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-[0.98] transition-all duration-200 cursor-pointer border ${
              isVelvetPink
                ? 'bg-gradient-to-tr from-[#FF2E93] via-[#FF4DA6] to-[#FF65B5] shadow-[#FF2E93]/40 border-[#FF9ED0]/45'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-emerald-500/35 border-emerald-400/40'
            }`}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white shrink-0 relative z-10" strokeWidth={1.65} glow="accent" />
            ) : (
              <Bot className="w-6 h-6 text-white shrink-0 relative z-10" strokeWidth={1.65} glow="accent" />
            )}
          </button>
        </div>
      )}

      {/* 2. Glassmorphism Chat Interface */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="budget-ai-modal-title"
          className={`fixed z-50 transition-all duration-300 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-organic-enter ${
            isLight
              ? isNordic
                ? 'bg-[#F5FAFF]/98 border-sky-200 text-slate-900'
                : 'bg-white/98 border-slate-200 text-slate-900'
              : isVelvetPink
              ? 'bg-[#1F1224]/95 border-[#E8B4A0]/25 text-[#FDF4FA]'
              : 'bg-slate-900/95 border-slate-700/80 text-slate-100'
          } ${
            isExpanded
              ? 'inset-2.5 sm:inset-10 max-w-5xl mx-auto'
              : 'top-20 bottom-3 inset-x-2.5 sm:inset-auto sm:top-22 sm:end-6 sm:w-[450px] sm:h-[620px] max-h-[92vh]'
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b flex items-center justify-between shrink-0 gap-2 ${
              isLight
                ? isNordic
                  ? 'border-sky-200 bg-[#E6F1FC]'
                  : 'border-slate-200 bg-slate-50'
                : isVelvetPink
                ? 'border-[#E8B4A0]/20 bg-[#170D1B]/90'
                : 'border-slate-800 bg-slate-950/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`relative w-9 h-9 rounded-2xl p-0.5 flex items-center justify-center shadow-md shrink-0 ${
                isVelvetPink
                  ? 'bg-gradient-to-br from-[#FF2E93] to-[#FF65B5] shadow-[#FF2E93]/25'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
              }`}>
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isLight ? 'bg-white' : isVelvetPink ? 'bg-[#140B18]' : 'bg-slate-950'}`}>
                  <Bot className={`w-4 h-4 ${isLight ? 'text-emerald-600' : isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-400'}`} strokeWidth={1.65} glow="accent" />
                </div>
                <span className={`absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border-2 ${isVelvetPink ? 'bg-[#FF65B5]' : 'bg-emerald-400'} ${isLight ? 'border-white' : isVelvetPink ? 'border-[#1F1224]' : 'border-slate-900'}`} />
              </div>
              <div className="min-w-0">
                <h3 id="budget-ai-modal-title" className={`text-sm font-bold flex items-center gap-1.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>{translations.aiAssistantTitle}</span>
                </h3>
                <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<AiPersonality, AiPersonality> = {
                        diplomat: 'auditor',
                        auditor: 'friend',
                        friend: 'advisor',
                        advisor: 'diplomat',
                      };
                      onUpdateSettings({ aiPersonality: next[settings.aiPersonality] });
                    }}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      isLight ? 'hover:text-emerald-700' : 'hover:text-emerald-300'
                    }`}
                    title="Switch Personality"
                  >
                    <PersonalityIcon className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} strokeWidth={1.65} />
                    <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{personalityInfo.name}</span>
                  </button>
                  {settings.incognitoMode && (
                    <span className="text-[10px] text-cyan-400 font-semibold px-1 rounded bg-cyan-950/60 border border-cyan-800/40">
                      Incognito
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchVisible((prev) => !prev)}
                aria-label="Search Messages"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isSearchVisible
                    ? isLight
                      ? 'bg-slate-200 text-emerald-700'
                      : 'bg-slate-800 text-emerald-400'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetCurrentChat}
                aria-label={translations.clearChat}
                title={translations.clearChat}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-amber-700 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNewSession}
                aria-label={translations.newChatSession}
                title={translations.newChatTooltip}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-label={isExpanded ? 'Minimize' : 'Expand'}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer hidden sm:block ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseAssistant}
                aria-label="Close Assistant"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Header Bar */}
          {isSearchVisible && (
            <div
              className={`px-4 py-2 border-b flex items-center gap-2 animate-in fade-in ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translations.searchChatPlaceholder}
                className={`flex-1 bg-transparent text-xs outline-none ${
                  isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-slate-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-slate-900 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Proactive Smart Alerts & Debt Prioritization Banner */}
          {(portfolioIntel.overdueLoans.length > 0 || portfolioIntel.dueTodayLoans.length > 0) && (
            <div
              data-testid="ai-smart-alerts-strip"
              className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 text-[11px] shrink-0 ${
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" strokeWidth={1.65} />
                <span className="truncate font-semibold font-numeric">
                  {language === 'ku'
                    ? `${portfolioIntel.overdueLoans.length} دواکەوتوو • ${portfolioIntel.dueTodayLoans.length} ئەمڕۆ`
                    : language === 'ar'
                    ? `${portfolioIntel.overdueLoans.length} متأخرة • ${portfolioIntel.dueTodayLoans.length} مستحقة اليوم`
                    : language === 'tr'
                    ? `${portfolioIntel.overdueLoans.length} gecikmiş • ${portfolioIntel.dueTodayLoans.length} bugün vadeli`
                    : language === 'fr'
                    ? `${portfolioIntel.overdueLoans.length} en retard • ${portfolioIntel.dueTodayLoans.length} aujourd'hui`
                    : language === 'es'
                    ? `${portfolioIntel.overdueLoans.length} vencidas • ${portfolioIntel.dueTodayLoans.length} vencen hoy`
                    : `${portfolioIntel.overdueLoans.length} overdue • ${portfolioIntel.dueTodayLoans.length} due today`}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    language === 'ku'
                      ? 'ئەولەویەتی دانەوەی قەرزەکانم چییە؟'
                      : language === 'ar'
                      ? 'ما هي أولوية سداد ديوني العاجلة؟'
                      : language === 'tr'
                      ? 'Borçlarımı hangi öncelikle ödemeliyim?'
                      : language === 'fr'
                      ? 'Quelle est la priorité pour mes dettes ?'
                      : language === 'es'
                      ? '¿Cuál es la prioridad de mis deudas vencidas y activas?'
                      : 'Prioritize my overdue and active debts'
                  )
                }
                className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-amber-200/80 hover:bg-amber-300 text-amber-950'
                    : 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200'
                }`}
              >
                {language === 'ku'
                  ? 'پێشینە'
                  : language === 'ar'
                  ? 'ترتيب الأولوية'
                  : language === 'tr'
                  ? 'Önceliklendir'
                  : language === 'fr'
                  ? 'Prioriser'
                  : language === 'es'
                  ? 'Priorizar'
                  : 'Prioritize'}
              </button>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
            {displayedMessages.map((msg) => {
              const isAi = msg.sender === 'assistant';
              const isEditing = editingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 group ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs shadow-sm ${
                      isAi
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isLight
                        ? 'bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[82%] space-y-1.5 ${isAi ? '' : 'items-end'}`}>
                    {msg.attachedFile && (
                      <div
                        className={`p-2 rounded-2xl border flex items-center gap-2 text-xs ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {msg.attachedFile.previewUrl ? (
                          <img
                            src={msg.attachedFile.previewUrl}
                            alt="Receipt"
                            className="w-12 h-12 object-cover rounded-xl border border-slate-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-amber-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold truncate max-w-[150px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {msg.attachedFile.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {((msg.attachedFile.size || 0) / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                        isAi
                          ? isLight
                            ? isNordic
                              ? 'bg-[#EDF5FD] border border-sky-200 text-slate-800'
                              : 'bg-slate-100 border border-slate-200 text-slate-800'
                            : 'bg-slate-950/80 border border-slate-800/90 text-slate-200'
                          : 'bg-emerald-600 text-white font-medium'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            className={`w-full p-2 rounded-xl border text-xs outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                            rows={3}
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-800 text-slate-300"
                            >
                              {translations.cancel}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedMessage(msg.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] bg-emerald-500 text-slate-950 font-bold"
                            >
                              {translations.saveEditBtn}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap">
                            {msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={idx} className="font-bold">
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                <React.Fragment key={idx}>{part}</React.Fragment>
                              )
                            )}
                          </p>

                          {/* Automatic Ledger Update Receipt Card */}
                          {msg.ledgerUpdate && (
                            <div
                              data-testid="ai-ledger-updated-badge"
                              className={`mt-3 p-2.5 rounded-xl border text-[11px] space-y-1 ${
                                isLight
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Check className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                                  <span>
                                    {language === 'ku'
                                      ? 'دەفتەری قەرز خۆکار نوێکرایەوە'
                                      : language === 'ar'
                                      ? 'تم تحديث الدفتر تلقائياً'
                                      : language === 'tr'
                                      ? 'Defter Otomatik Güncellendi'
                                      : language === 'fr'
                                      ? 'Grand livre mis à jour'
                                      : language === 'es'
                                      ? 'Libro Actualizado Automáticamente'
                                      : 'Ledger Updated Automatically'}
                                  </span>
                                </span>
                                {msg.ledgerUpdate.archived && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] uppercase">
                                    {language === 'es' ? 'Archivo' : 'Archive'}
                                  </span>
                                )}
                              </div>
                              <div className={`flex items-center justify-between font-numeric text-[11px] ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                                <span className="font-pricedown tracking-wide">{msg.ledgerUpdate.personName}</span>
                                <span>
                                  {formatCardDebt(msg.ledgerUpdate.balanceBefore, msg.ledgerUpdate.loanCurrency, language)}{' '}
                                  <ArrowRight className="w-3 h-3 inline mx-0.5" strokeWidth={1.65} />{' '}
                                  {formatCardDebt(msg.ledgerUpdate.balanceAfter, msg.ledgerUpdate.loanCurrency, language)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 1-Click Action Button from Invoice analysis */}
                          {msg.suggestedAction && msg.suggestedAction.type === 'add_loan' && (
                            <div className="mt-3 pt-2.5 border-t border-slate-800">
                              <button
                                type="button"
                                disabled={recordedMessageIds.includes(msg.id)}
                                onClick={() => {
                                  const d: any = msg.suggestedAction!.data;
                                  onAddLoanFromAi({
                                    personName: d.personName,
                                    amount: d.amount,
                                    type: d.loanType || d.type || 'i_owe_them',
                                    currency: d.currency,
                                    dueDate: d.dueDate,
                                    notes: d.notes,
                                  });
                                  setRecordedMessageIds((prev) => [...prev, msg.id]);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-60 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.85} />
                                <span>
                                  {recordedMessageIds.includes(msg.id)
                                    ? (language === 'ku' ? 'تۆمارکرا!' : language === 'ar' ? 'تمت الإضافة!' : language === 'tr' ? 'Kaydedildi!' : language === 'fr' ? 'Enregistré !' : language === 'es' ? '¡Registrado!' : 'Recorded!')
                                    : translations.oneClickAddFromInvoice}
                                </span>
                              </button>
                            </div>
                          )}

                          <span
                            className={`block text-[9px] mt-1 text-end font-numeric ${
                              isAi ? 'text-slate-500' : 'text-emerald-200/80'
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Bar Beneath Bubble (Copy, Speak, Edit, Regenerate) */}
                    <div className="flex items-center gap-1.5 px-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        aria-label={translations.copyMsgAction}
                        title={translations.copyMsgAction}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Text-to-Speech Audio */}
                      <button
                        type="button"
                        onClick={() => speakMessage(msg.id, msg.text)}
                        aria-label={speakingMessageId === msg.id ? translations.voiceStopSpeaking : translations.voiceSpeakMessage}
                        title={speakingMessageId === msg.id ? translations.voiceStopSpeaking : translations.voiceSpeakMessage}
                        className={`p-1 rounded-md transition-colors ${
                          speakingMessageId === msg.id
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>

                      {/* Edit (for User messages) */}
                      {!isAi && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditInputText(msg.text);
                          }}
                          aria-label={translations.editMsgAction}
                          title={translations.editMsgAction}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Regenerate (for last AI message) */}
                      {isAi && msg.id === messages[messages.length - 1]?.id && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          aria-label={translations.regenerateAction}
                          title={translations.regenerateAction}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Animation */}
            {isLoading && (
              <div className="flex items-center gap-2.5 animate-organic-enter">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4" strokeWidth={1.65} />
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl border text-xs text-slate-400 flex items-center gap-2 shadow-sm ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <span className="text-[11px] text-slate-500 font-numeric">
                    {language === 'es' ? 'Pensando...' : language === 'fr' ? 'Réflexion...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div
            className={`px-3 py-2 border-t shrink-0 ${
              isLight
                ? isNordic
                  ? 'border-sky-200 bg-[#EDF5FD]'
                  : 'border-slate-200 bg-slate-50'
                : isVelvetPink
                ? 'border-[#E8B4A0]/15 bg-[#140B18]/65'
                : 'border-slate-800/80 bg-slate-950/40'
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {translations.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className={`smooth-interactive px-3 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300'
                      : isVelvetPink
                      ? 'bg-[#2B1733] hover:bg-[#FF2E93]/20 text-[#F4D9E9] hover:text-white border-[#E8B4A0]/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Status Notice */}
          {aiNotice && (
            <div className="px-4 py-2 bg-rose-950/70 border-t border-rose-500/30 text-rose-200 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* File Attachment Chip in Input */}
          {attachedFile && (
            <div className={`px-3 pt-2 flex items-center gap-2 ${isLight ? 'bg-slate-50' : isVelvetPink ? 'bg-[#170D1B]/90' : 'bg-slate-950/80'}`}>
              <div
                className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-2 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : isVelvetPink
                    ? 'bg-[#2B1733] border-[#E8B4A0]/25 text-[#FDF4FA]'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate max-w-[200px] text-[11px]">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-slate-400 hover:text-rose-500 text-xs ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input Footer Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 border-t flex items-center gap-2 shrink-0 ${
              isLight
                ? isNordic
                  ? 'border-sky-200 bg-[#E6F1FC]'
                  : 'border-slate-200 bg-slate-50'
                : isVelvetPink
                ? 'border-[#E8B4A0]/20 bg-[#170D1B]/95'
                : 'border-slate-800/80 bg-slate-950/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="chat-file-upload"
            />
            <label
              htmlFor="chat-file-upload"
              aria-label={translations.uploadFileAction}
              title={translations.uploadFileAction}
              className={`smooth-interactive p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'text-slate-600 hover:text-amber-700 hover:bg-slate-200/70'
                  : isVelvetPink
                  ? 'text-[#E8C5D8] hover:text-[#FF65B5] hover:bg-[#FF2E93]/15'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </label>

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              aria-label={isRecording ? 'Stop Recording' : 'Voice Input'}
              title={isRecording ? 'Stop Recording' : 'Voice Input'}
              className={`smooth-interactive p-2.5 rounded-xl transition-all cursor-pointer shrink-0 active:scale-[0.98] ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/70'
                  : isVelvetPink
                  ? 'text-[#E8C5D8] hover:text-[#FF65B5] hover:bg-[#FF2E93]/15'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" strokeWidth={1.65} /> : <Mic className="w-4 h-4" strokeWidth={1.65} />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? translations.voiceInputListening : translations.aiInputPlaceholder}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  : isVelvetPink
                  ? 'bg-[#120B14] border-[#E8B4A0]/25 text-white placeholder-[#B892AA] focus:border-[#FF2E93] focus:ring-1 focus:ring-[#FF2E93]/40'
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />

            <button
              type="submit"
              disabled={(!inputValue.trim() && !attachedFile) || isLoading}
              aria-label="Send Message"
              className={`smooth-interactive p-2.5 rounded-xl disabled:opacity-40 text-white transition-all shadow-md cursor-pointer shrink-0 ${
                isVelvetPink
                  ? 'bg-[#FF2E93] hover:bg-[#FF47A1] disabled:hover:bg-[#FF2E93] shadow-[#FF2E93]/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:hover:bg-emerald-600 shadow-emerald-600/25'
              }`}
            >
              <Send className="w-4 h-4" glow="accent" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
