import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Cloud,
  Link2,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from './OrganicIcons';
import {
  FriendChatMessage,
  FriendChatThread,
  FriendRecord,
  Language,
  Loan,
  ThemeMode,
  UserSettings,
} from '../types';
import {
  CounterpartySearchCandidate,
  filterLoansByExactUsername,
  findFriendByExactUsername,
  formatLoanChatReferenceSummary,
  formatSignedCardDebt,
  getRemainingLoanBalance,
  isLightThemeMode,
  resolveExactLoanChatUsername,
  resolveLiveChatLoanReference,
  validateExactLinkedUsername,
} from '../utils/loanLogic';
import {
  addFriendToCloud,
  ensureFriendChatThread,
  lookupUserByUsername,
  removeFriendFromCloud,
  sendFriendChatMessage,
  subscribeChatMessages,
} from '../firebase';
import { UsernameSearchResults, useDebouncedUsernameSearch } from './UsernameSearchBox';

interface FriendsChatViewProps {
  language: Language;
  themeMode: ThemeMode;
  authUid: string | null;
  authEmailVerified: boolean;
  settings: UserSettings;
  allLoans: Loan[];
  friends: FriendRecord[];
  chatThreads: FriendChatThread[];
  preselectedLoan?: Loan | null;
  onClearPreselectedLoan?: () => void;
  onBackToActive: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onShowToast?: (msg: string) => void;
}

export const FriendsChatView: React.FC<FriendsChatViewProps> = ({
  language,
  themeMode,
  authUid,
  authEmailVerified,
  settings,
  allLoans,
  friends,
  chatThreads,
  preselectedLoan = null,
  onClearPreselectedLoan,
  onBackToActive,
  onOpenAuth,
  onOpenProfile,
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

  const isLight = isLightThemeMode(themeMode);
  const isNordic = themeMode === 'nordic_frost';
  const isGold = themeMode === 'midnight_gold';
  const isVelvetPink = themeMode === 'velvet_pink';
  const canUseCloudChat = Boolean(authUid && authEmailVerified);

  const [lookupInput, setLookupInput] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [activePeer, setActivePeer] = useState<{
    uid: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
  } | null>(null);

  const [messages, setMessages] = useState<FriendChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const [showLoanPicker, setShowLoanPicker] = useState(false);
  const [attachedLoan, setAttachedLoan] = useState<Loan | null>(preselectedLoan);
  const [isPaymentUpdateMode, setIsPaymentUpdateMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const usernameSearch = useDebouncedUsernameSearch({
    query: lookupInput,
    friends,
    chatThreads,
    excludeUid: authUid,
    enabled: true,
    minChars: 2,
    debounceMs: 300,
  });

  // Switch by exact @username or saved friend display name when "Discuss in Chat" is triggered
  useEffect(() => {
    if (!preselectedLoan) return;

    const targetUsername = resolveExactLoanChatUsername(preselectedLoan);
    if (!targetUsername) {
      const targetNameLower = (preselectedLoan.personName || '').trim().toLowerCase();
      const friendByName = targetNameLower
        ? friends.find((f) => (f.displayName || '').trim().toLowerCase() === targetNameLower)
        : null;
      if (friendByName && canUseCloudChat && authUid) {
        setAttachedLoan(preselectedLoan);
        setLookupError(null);
        handleOpenChatWithFriend(friendByName);
        return;
      }
      setAttachedLoan(preselectedLoan);
      setLookupInput((preselectedLoan.personName || '').trim());
      setLookupError(null);
      return;
    }

    setAttachedLoan(preselectedLoan);
    setLookupError(null);
    if (!canUseCloudChat || !authUid) return;

    const matched = findFriendByExactUsername(friends, targetUsername);
    if (matched) {
      handleOpenChatWithFriend(matched);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const found = await lookupUserByUsername(targetUsername);
        if (cancelled) return;
        if (!found) {
          setLookupError(
            pick(
              `No registered user found with @${targetUsername}.`,
              `لم يتم العثور على مستخدم مسجل باسم @${targetUsername}.`,
              `هیچ بەکارهێنەرێک بە ناوی @${targetUsername} نەدۆزرایەوە.`,
              `@${targetUsername} adıyla kayıtlı kullanıcı bulunamadı.`,
              `Aucun utilisateur inscrit trouvé pour @${targetUsername}.`,
              `No se encontró ningún usuario registrado con @${targetUsername}.`
            )
          );
          return;
        }
        if (found.uid === authUid) {
          setLookupError(
            pick(
              'That is your own @username! Bind your friend’s exact @username instead.',
              'هذا اسم المستخدم الخاص بك! أدخل اسم صديقك الدقيق.',
              'ئەمە ناوی بەکارهێنەری خۆتە! ناوی هاوڕێکەت بنووسە.',
              'Bu sizin kendi @kullanıcı_adınız!',
              'C’est votre propre @identifiant !',
              '¡Ese es tu propio @usuario! Vincula el @usuario exacto de tu amigo.'
            )
          );
          return;
        }
        await addFriendToCloud(authUid, found);
        if (cancelled) return;
        const thread = await ensureFriendChatThread(
          {
            uid: authUid,
            displayName: settings.profileName,
            username: settings.profileUsername,
            avatar: settings.profileAvatar,
          },
          {
            uid: found.uid,
            displayName: found.displayName,
            username: found.username,
            avatar: found.avatar,
          }
        );
        if (cancelled) return;
        setActiveChatId(thread.id);
        setMobileShowChat(true);
        setActivePeer({
          uid: found.uid,
          username: found.username,
          displayName: found.displayName,
          avatar: found.avatar,
          bio: found.bio,
        });
      } catch {
        // Ignore silent preselect lookup failure; user can retry manually
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preselectedLoan, canUseCloudChat, authUid, friends]);

  // Fallback: auto-select first existing chat thread if none is selected
  useEffect(() => {
    if (!activeChatId && chatThreads.length > 0 && authUid) {
      const first = chatThreads[0];
      const peerUid = first.participantA === authUid ? first.participantB : first.participantA;
      const peerSnap = first.participantProfiles?.[peerUid];
      const matchedFriend = friends.find((f) => f.friendUid === peerUid);
      setActiveChatId(first.id);
      setActivePeer({
        uid: peerUid,
        username: matchedFriend?.username || peerSnap?.username,
        displayName: matchedFriend?.displayName || peerSnap?.displayName,
        avatar: matchedFriend?.avatar || peerSnap?.avatar,
        bio: matchedFriend?.bio,
      });
    }
  }, [activeChatId, chatThreads, friends, authUid]);

  // Keep active chat peer metadata synchronized in real time when friends or chatThreads update
  const resolvedActivePeer = useMemo(() => {
    if (!activePeer) return null;
    const matchedFriend = friends.find((f) => f.friendUid === activePeer.uid);
    const matchingThread = chatThreads.find((t) => t.id === activeChatId) ||
      chatThreads.find((t) => t.participantIds.includes(activePeer.uid));
    const snap = matchingThread?.participantProfiles?.[activePeer.uid];
    return {
      uid: activePeer.uid,
      username: matchedFriend?.username || snap?.username || activePeer.username,
      displayName: matchedFriend?.displayName || snap?.displayName || activePeer.displayName,
      avatar: matchedFriend?.avatar || snap?.avatar || activePeer.avatar,
      bio: matchedFriend?.bio ?? activePeer.bio,
    };
  }, [activePeer, friends, chatThreads, activeChatId]);

  // Subscribe to real-time messages for selected chat
  useEffect(() => {
    if (!canUseCloudChat || !activeChatId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    const unsub = subscribeChatMessages(activeChatId, {
      onMessagesSnapshot: (list) => {
        setMessages(list);
        setMessagesLoading(false);
      },
      onError: () => {
        setMessagesLoading(false);
        onShowToast?.(
          pick(
            'Unable to sync chat messages. Check your connection or permissions.',
            'تعذر مزامنة الرسائل. يرجى التحقق من الاتصال.',
            'پەیامەکان هاوکات نەبوون. تکایە هێڵەکەت بپشکنە.',
            'Mesajlar senkronize edilemedi.',
            'Impossible de synchroniser les messages.',
            'No se pudieron sincronizar los mensajes. Revisa tu conexión.'
          )
        );
      },
    });
    return () => unsub();
  }, [canUseCloudChat, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeChatId]);

  // Merge threads from users who are not yet in user's saved friends list
  const extraChatPeers = useMemo(() => {
    if (!authUid) return [];
    const friendUidSet = new Set(friends.map((f) => f.friendUid));
    return chatThreads
      .map((thread) => {
        const peerUid = thread.participantA === authUid ? thread.participantB : thread.participantA;
        if (friendUidSet.has(peerUid)) return null;
        const snap = thread.participantProfiles?.[peerUid];
        const username = snap?.username || '';
        const displayName = snap?.displayName || (username ? `@${username}` : 'Friend');
        return {
          thread,
          peerUid,
          username,
          displayName,
          avatar: snap?.avatar,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [chatThreads, friends, authUid]);

  // Direct exact-username add & chat initiation (zero search/autocomplete clutter)
  const handleConnectByExactUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseCloudChat || !authUid) return;
    const validation = validateExactLinkedUsername(lookupInput, { required: true });
    if (!validation.valid) {
      setLookupError(
        validation.reason === 'invalid_chars'
          ? pick(
              'Usernames can only contain letters, numbers, and underscores (_).',
              'اسم المستخدم يقبل الحروف والأرقام والشرطة السفلية (_) فقط.',
              'ناوی بەکارهێنەر تەنها پیت و ژمارە و (_) قبوڵ دەکات.',
              'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir.',
              'Seuls les lettres, chiffres et underscores (_) sont autorisés.',
              'Los nombres de usuario solo admiten letras, números y guiones bajos (_).'
            )
          : pick(
              'Enter an exact @username (3+ chars: letters, numbers, underscores).',
              'أدخل اسم المستخدم الدقيق @username (٣ أحرف على الأقل).',
              'ناوی بەکارهێنەری تەواو بنووسە (لانیکەم ٣ پیت).',
              'Geçerli ve tam bir @kullanıcı_adı girin (en az 3 karakter).',
              'Entrez un @identifiant exact valide (3 caractères min.).',
              'Ingresa un @usuario exacto (3+ caracteres: letras, números, _).'
            )
      );
      return;
    }

    const normalized = validation.normalized.toLowerCase();
    setLookupBusy(true);
    setLookupError(null);
    try {
      const found = await lookupUserByUsername(normalized);
      if (!found) {
        setLookupError(
          pick(
            `No user found with @${normalized}. Ask them to set their @username in Profile.`,
            `لم يتم العثور على مستخدم باسم @${normalized}.`,
            `هیچ بەکارهێنەرێک بە ناوی @${normalized} نەدۆزرایەوە.`,
            `@${normalized} kullanıcısı bulunamadı.`,
            `Aucun utilisateur trouvé pour @${normalized}.`,
            `No se encontró ningún usuario con @${normalized}. Pídele que configure su @usuario en Perfil.`
          )
        );
        return;
      }
      if (found.uid === authUid) {
        setLookupError(
          pick(
            'That is your own handle! Enter a friend’s exact @username.',
            'هذا اسم المستخدم الخاص بك! أدخل اسم صديقك الدقيق.',
            'ئەمە ناوی بەکارهێنەری خۆتە! ناوی هاوڕێکەت بنووسە.',
            'Bu sizin kullanıcı adınız! Bir arkadaşınızın kullanıcı adını yazın.',
            'Ceci est votre propre identifiant ! Entrez celui d’un ami.',
            '¡Ese es tu propio usuario! Ingresa el @usuario exacto de un amigo.'
          )
        );
        return;
      }

      await addFriendToCloud(authUid, found);
      const thread = await ensureFriendChatThread(
        {
          uid: authUid,
          displayName: settings.profileName,
          username: settings.profileUsername,
          avatar: settings.profileAvatar,
          fibAccount: settings.profileFibAccount,
        },
        {
          uid: found.uid,
          displayName: found.displayName,
          username: found.username,
          avatar: found.avatar,
          fibAccount: found.fibAccount,
        }
      );
      setActiveChatId(thread.id);
      setMobileShowChat(true);
      setActivePeer({
        uid: found.uid,
        username: found.username,
        displayName: found.displayName,
        avatar: found.avatar,
        bio: found.bio,
      });
      setLookupInput('');
      setLookupError(null);
      onShowToast?.(
        pick(
          `Connected with @${found.username}!`,
          `تم بدء المحادثة مع @${found.username}!`,
          `پەیوەندی لەگەڵ @${found.username} دروستکرا!`,
          `@${found.username} ile sohbet başlatıldı!`,
          `Connecté avec @${found.username} !`,
          `¡Conectado con @${found.username}!`
        )
      );
    } catch {
      setLookupError(
        pick(
          'Could not connect right now. Check connection and try again.',
          'تعذر الاتصال حالياً. يرجى المحاولة لاحقاً.',
          'پەیوەندیکردن سەرکەوتوو نەبوو. دووبارە هەوڵبدەرەوە.',
          'Bağlanılamadı. Tekrar deneyin.',
          'Impossible de se connecter pour le moment.',
          'No se pudo conectar ahora. Revisa tu conexión.'
        )
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const handleSelectSearchCandidate = async (candidate: CounterpartySearchCandidate) => {
    const candidateLabel = candidate.displayName || (candidate.username ? `@${candidate.username}` : 'this contact');
    if (!canUseCloudChat || !authUid) {
      onShowToast?.(
        pick(
          `Sign in with a verified account to chat with ${candidateLabel}.`,
          `سجّل الدخول بحساب موثق للمحادثة مع ${candidateLabel}.`,
          `بۆ چاتکردن لەگەڵ ${candidateLabel} بە هەژماری پشتڕاستکراو بچۆ ژوورەوە.`,
          `${candidateLabel} ile sohbet etmek için doğrulanmış hesapla giriş yapın.`,
          `Connectez-vous avec un compte vérifié pour discuter avec ${candidateLabel}.`,
          `Inicia sesión con una cuenta verificada para chatear con ${candidateLabel}.`
        )
      );
      onOpenAuth();
      return;
    }
    if (candidate.uid === authUid) {
      setLookupError(
        pick(
          'That is your own handle! Enter a friend’s exact @username.',
          'هذا اسم المستخدم الخاص بك! أدخل اسم صديقك الدقيق.',
          'ئەمە ناوی بەکارهێنەری خۆتە! ناوی هاوڕێکەت بنووسە.',
          'Bu sizin kullanıcı adınız! Bir arkadaşınızın kullanıcı adını yazın.',
          'Ceci est votre propre identifiant ! Entrez celui d’un ami.',
          '¡Ese es tu propio usuario! Ingresa el @usuario exacto de un amigo.'
        )
      );
      return;
    }

    setLookupBusy(true);
    setLookupError(null);
    try {
      await addFriendToCloud(authUid, {
        uid: candidate.uid,
        username: candidate.username,
        usernameLower: candidate.usernameLower,
        displayName: candidate.displayName || candidate.username,
        avatar: candidate.avatar,
        bio: candidate.bio,
      });
      const thread = await ensureFriendChatThread(
        {
          uid: authUid,
          displayName: settings.profileName,
          username: settings.profileUsername,
          avatar: settings.profileAvatar,
          fibAccount: settings.profileFibAccount,
        },
        {
          uid: candidate.uid,
          displayName: candidate.displayName,
          username: candidate.username,
          avatar: candidate.avatar,
        }
      );
      setActiveChatId(thread.id);
      setMobileShowChat(true);
      setActivePeer({
        uid: candidate.uid,
        username: candidate.username,
        displayName: candidate.displayName,
        avatar: candidate.avatar,
        bio: candidate.bio,
      });
      setLookupInput('');
      setLookupError(null);
      onShowToast?.(
        pick(
          `Connected with @${candidate.username}!`,
          `تم بدء المحادثة مع @${candidate.username}!`,
          `پەیوەندی لەگەڵ @${candidate.username} دروستکرا!`,
          `@${candidate.username} ile sohbet başlatıldı!`,
          `Connecté avec @${candidate.username} !`,
          `¡Conectado con @${candidate.username}!`
        )
      );
    } catch {
      setLookupError(
        pick(
          'Could not connect right now. Check connection and try again.',
          'تعذر الاتصال حالياً. يرجى المحاولة لاحقاً.',
          'پەیوەندیکردن سەرکەوتوو نەبوو. دووبارە هەوڵبدەرەوە.',
          'Bağlanılamadı. Tekrar deneyin.',
          'Impossible de se connecter pour le moment.',
          'No se pudo conectar ahora. Revisa tu conexión.'
        )
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const normalizedFilterQuery = lookupInput.trim().replace(/^@+/, '').toLowerCase();
  const filteredFriends = useMemo(() => {
    if (!normalizedFilterQuery) return friends;
    return friends.filter(
      (f) =>
        f.username.toLowerCase().includes(normalizedFilterQuery) ||
        (f.displayName || '').toLowerCase().includes(normalizedFilterQuery)
    );
  }, [friends, normalizedFilterQuery]);

  const filteredExtraChatPeers = useMemo(() => {
    if (!normalizedFilterQuery) return extraChatPeers;
    return extraChatPeers.filter(
      (p) =>
        p.username.toLowerCase().includes(normalizedFilterQuery) ||
        p.displayName.toLowerCase().includes(normalizedFilterQuery)
    );
  }, [extraChatPeers, normalizedFilterQuery]);

  const handleOpenChatWithFriend = async (friend: FriendRecord) => {
    if (!canUseCloudChat || !authUid) return;
    try {
      const thread = await ensureFriendChatThread(
        {
          uid: authUid,
          displayName: settings.profileName,
          username: settings.profileUsername,
          avatar: settings.profileAvatar,
          fibAccount: settings.profileFibAccount,
        },
        {
          uid: friend.friendUid,
          displayName: friend.displayName,
          username: friend.username,
          avatar: friend.avatar,
          fibAccount: friend.fibAccount,
        }
      );
      setActiveChatId(thread.id);
      setMobileShowChat(true);
      setActivePeer({
        uid: friend.friendUid,
        username: friend.username,
        displayName: friend.displayName,
        avatar: friend.avatar,
        bio: friend.bio,
      });
    } catch {
      onShowToast?.(
        pick('Failed to open chat.', 'تعذر فتح المحادثة.', 'کردنەوەی چات سەرکەوتوو نەبوو.', 'Sohbet açılamadı.', 'Échec de l’ouverture.', 'No se pudo abrir el chat.')
      );
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!canUseCloudChat || !authUid) return;
    try {
      await removeFriendFromCloud(authUid, friendUid);
      if (activePeer?.uid === friendUid) {
        setActivePeer(null);
        setActiveChatId(null);
      }
      onShowToast?.(
        pick('Friend removed.', 'تمت إزالة الصديق.', 'هاوڕێ لابرا.', 'Arkadaş kaldırıldı.', 'Ami supprimé.', 'Amigo eliminado.')
      );
    } catch {
      onShowToast?.(
        pick('Could not remove friend.', 'تعذر إزالة الصديق.', 'لابردن سەرکەوتوو نەبوو.', 'Kaldırılamadı.', 'Suppression impossible.', 'No se pudo eliminar al amigo.')
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseCloudChat || !authUid || !activeChatId || sending) return;
    const fallbackLoanText = attachedLoan
      ? formatLoanChatReferenceSummary(attachedLoan, language)
      : '';
    const outgoingText = (messageInput.trim() || fallbackLoanText).slice(0, 1000);
    if (!outgoingText) return;

    setSending(true);
    try {
      const remaining = attachedLoan ? getRemainingLoanBalance(attachedLoan) : undefined;
      await sendFriendChatMessage({
        chatId: activeChatId,
        senderId: authUid,
        senderName:
          settings.profileName?.trim() ||
          (settings.profileUsername ? `@${settings.profileUsername}` : 'Member'),
        text: outgoingText,
        messageKind: attachedLoan
          ? isPaymentUpdateMode
            ? 'payment_update'
            : 'loan_ref'
          : 'text',
        linkedLoan: attachedLoan || undefined,
        remainingBalance: remaining,
      });
      setMessageInput('');
      setAttachedLoan(null);
      setIsPaymentUpdateMode(false);
      setShowLoanPicker(false);
      onClearPreselectedLoan?.();
    } catch {
      onShowToast?.(
        pick('Failed to send message.', 'فشل إرسال الرسالة.', 'ناردنی پەیام سەرکەوتوو نەبوو.', 'Mesaj gönderilemedi.', "Échec d'envoi.", 'Error al enviar mensaje.')
      );
    } finally {
      setSending(false);
    }
  };

  const cardSurface = isLight
    ? isNordic
      ? 'bg-[#F5FAFF]/95 border-sky-200/80 text-slate-900'
      : 'bg-white border-slate-200 text-slate-900'
    : isVelvetPink
    ? 'bg-[#1F1224]/90 border-[#E8B4A0]/22 text-[#FFF5FA]'
    : 'bg-[#0D121F]/90 border-white/[0.08] text-slate-100';

  const inputSurface = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
    : isVelvetPink
    ? 'bg-[#120B14]/90 border-[#E8B4A0]/22 text-white placeholder-[#E8B4A0]/45 focus:border-[#FF65B5]'
    : 'bg-slate-950/90 border-white/[0.08] text-white placeholder-slate-500 focus:border-emerald-400/60';

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="friends-chat-view"
      className="space-y-5 animate-organic-enter"
    >
      {/* Top Banner */}
      <div className={`rounded-3xl glass-card border p-5 sm:p-6 smooth-interactive ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                isGold
                  ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <Users glow="accent" className="w-5 h-5" strokeWidth={1.65} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-black font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {pick('Friends & Real-Time Chat', 'الأصدقاء والمحادثة المباشرة', 'هاوڕێیان و چاتی ڕاستەوخۆ', 'Arkadaşlar ve Canlı Sohbet', 'Amis & Discussion en Direct', 'Amigos y Chat en Tiempo Real')}
                </h2>
                <span
                  data-numeric="true"
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-numeric tabular-nums font-bold border ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                  }`}
                >
                  {friends.length} {pick('Friends', 'صديق', 'هاوڕێ', 'Arkadaş', 'Amis', 'Amigos')}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick(
                  'Connect directly by entering an exact @username, manage friends, and discuss bound debts in real time.',
                  'تواصل مباشرة بإدخال @username الدقيق، وأدر أصدقاءك، وناقش الديون المرتبطة لحظياً.',
                  'ڕاستەوخۆ بە نووسینی @usernameـی تەواو پەیوەندی ببەستە و لەسەر قەرزەکان گفتوگۆ بکە.',
                  'Tam @kullanıcı_adı girerek doğrudan arkadaş ekleyin ve bağlı borçları canlı görüşün.',
                  'Connectez-vous directement par @identifiant exact et discutez de vos prêts en temps réel.',
                  'Conéctate directamente por @usuario exacto, gestiona amigos y conversa sobre tus deudas en tiempo real.'
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
            {pick('Back to Active Loans', 'العودة للديون النشطة', 'گەڕانەوە بۆ قەرزە چالاکەکان', 'Aktif Kayıtlara Dön', 'Retour aux prêts', 'Volver a Préstamos Activos')}
          </button>
        </div>

        {/* Own @username discoverability notice */}
        {canUseCloudChat && !settings.profileUsername && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <span>
              {pick(
                'Set your @username handle in Edit Profile so friends can find and message you!',
                'قم بتعيين اسم مستخدم (@username) في ملفك الشخصي ليتمكن أصدقاؤك من العثور عليك!',
                'ناوی بەکارهێنەر (@username) لە پرۆفایلەکەتدا دابنێ تا هاوڕێیانت بتدۆزنەوە!',
                'Arkadaşlarınızın sizi bulabilmesi için Profil Düzenle kısmından @kullanıcı_adı belirleyin.',
                'Définissez votre @identifiant dans votre profil pour que vos amis puissent vous trouver !',
                '¡Configura tu @usuario en Editar Perfil para que tus amigos puedan encontrarte!'
              )}
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {pick('Set @username', 'تعيين @username', 'دانانی @username', '@kullanıcı_adı Belirle', 'Définir @identifiant', 'Fijar @usuario')}
            </button>
          </div>
        )}
      </div>

      {/* Require Verified Sign-In for Live Firestore Directory & Chat */}
      {!canUseCloudChat ? (
        <div className="space-y-4">
          {/* Interactive Realistic @username Search Preview for All Users */}
          <div className={`rounded-3xl glass-card border p-5 sm:p-6 space-y-3 ${cardSurface}`}>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="lookup-friend-username"
                className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                <Search className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {pick(
                    'Find User by Name or @username',
                    'البحث بالاسم أو @username',
                    'گەڕان بە ناو یان @username',
                    'Ad veya @kullanıcı_adı ile Ara',
                    'Rechercher par Nom ou @identifiant',
                    'Buscar por Nombre o @usuario'
                  )}
                </span>
              </label>
            </div>
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute start-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                id="lookup-friend-username"
                data-testid="friend-lookup-input"
                type="text"
                value={lookupInput}
                onChange={(e) => {
                  setLookupInput(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                maxLength={60}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={pick('Sara Ali or @lanya_2026', 'سارة علي أو @lanya_2026', 'سارا عەلی یان @lanya_2026', 'Sara Ali veya @lanya_2026', 'Sara Ali ou @lanya_2026', 'Sara Ali o @lanya_2026')}
                className={`w-full min-h-[44px] ps-9 pe-9 py-2.5 rounded-xl border text-xs outline-none ${inputSurface}`}
              />
              {lookupInput && (
                <button
                  type="button"
                  onClick={() => setLookupInput('')}
                  aria-label="Clear search"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <UsernameSearchResults
              searchState={usernameSearch}
              language={language}
              themeMode={themeMode}
              actionIcon="chat"
              actionLabel={pick('Chat Now', 'ابدأ المحادثة', 'چات بکە', 'Sohbet Et', 'Discuter', 'Chatear')}
              onSelectCandidate={handleSelectSearchCandidate}
            />
          </div>

          <div
            data-testid="friends-auth-gate"
            className={`rounded-3xl glass-card border p-8 text-center space-y-4 ${cardSurface}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : isVelvetPink
                  ? 'bg-[#FF2E93]/18 border-[#FF65B5]/40 text-[#FF65B5]'
                  : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
              }`}
            >
              <Cloud glow="accent" className="w-7 h-7" strokeWidth={1.65} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className={`text-base font-bold font-pricedown tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {authUid && !authEmailVerified
                  ? pick('Verify Your Email for Live Chat', 'يرجى تأكيد بريدك للمحادثة المباشرة', 'ئیمەیڵەکەت پشتڕاست بکەرەوە بۆ چات', 'Canlı Sohbet için E-postayı Doğrulayın', 'Vérifiez votre e-mail pour discuter', 'Verifica tu correo para chatear')
                  : pick('Sign In for Friends & Real-Time Chat', 'سجّل الدخول للتواصل مع الأصدقاء', 'بۆ چاتی ڕاستەوخۆ بچۆ ژوورەوە', 'Arkadaşlar ve Canlı Sohbet için Giriş Yapın', 'Connectez-vous pour discuter', 'Inicia sesión para Amigos y Chat')}
              </h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {pick(
                  'Connect with friends by exact @username and sync live chat directly through Firebase Cloud Firestore. Sign in with a verified account to connect.',
                  'تواصل مع الأصدقاء عبر @username الدقيق والمحادثة الفورية عبر حساب موثق للمزامنة السحابية الآمنة.',
                  'پەیوەندی بە هاوڕێیان بە @usernameـی تەواو و چاتی ڕاستەوخۆ بە هەژماری پشتڕاستکراو کاردەکات.',
                  'Tam @kullanıcı_adı ile arkadaş ekleme ve gerçek zamanlı sohbet doğrulanmış bulut hesabıyla senkronize olur.',
                  'La connexion par @identifiant exact et le chat temps réel nécessitent un compte vérifié.',
                  'Conéctate con amigos por @usuario exacto y sincroniza el chat en vivo en la nube. Inicia sesión con una cuenta verificada.'
                )}
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              data-testid="friends-signin-cta"
              onClick={onOpenAuth}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg smooth-interactive cursor-pointer ${
                isVelvetPink
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white shadow-[#FF2E93]/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <ShieldCheck glow="accent" className="w-4 h-4" />
              <span>
                {authUid && !authEmailVerified
                  ? pick('Complete Email Verification', 'إكمال توثيق البريد', 'تەواوکردنی پشتڕاستکردنەوە', 'Doğrulamayı Tamamla', 'Vérifier l’e-mail', 'Completar verificación de correo')
                  : pick('Sign In with Google / Email', 'تسجيل الدخول عبر Google / البريد', 'چوونەژوورەوە بە Google / ئیمەیڵ', 'Google / E-posta ile Giriş Yap', 'Se connecter avec Google / E-mail', 'Iniciar sesión con Google / Correo')}
              </span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-6">
          {/* Left Panel: @username Lookup + Friends & Threads Directory */}
          <div
            className={`lg:col-span-5 rounded-3xl glass-card border p-4 sm:p-5 space-y-4 ${cardSurface} ${
              mobileShowChat && activeChatId && resolvedActivePeer ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Debounced Realistic @username Connect & Chat Initiation */}
            <form onSubmit={handleConnectByExactUsername} autoComplete="off" className="space-y-2.5">
              <label
                htmlFor="lookup-friend-username"
                className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
              >
                {pick(
                  'Find & Chat by Name or @username',
                  'ابحث وتحدث بالاسم أو @username',
                  'گەڕان و چات بە ناو یان @username',
                  'Ad veya @kullanıcı_adı ile Bul',
                  'Rechercher par Nom ou @identifiant',
                  'Buscar y Chatear por Nombre o @usuario'
                )}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className={`w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    id="lookup-friend-username"
                    data-testid="friend-lookup-input"
                    type="text"
                    value={lookupInput}
                    onChange={(e) => {
                      setLookupInput(e.target.value);
                      if (lookupError) setLookupError(null);
                    }}
                    maxLength={60}
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder={pick('Sara Ali or @lanya_2026', 'سارة علي أو @lanya_2026', 'سارا عەلی یان @lanya_2026', 'Sara Ali veya @lanya_2026', 'Sara Ali ou @lanya_2026', 'Sara Ali o @lanya_2026')}
                    className={`w-full min-h-[42px] ps-8 pe-8 py-2 rounded-xl border text-xs outline-none ${inputSurface}`}
                  />
                  {lookupInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setLookupInput('');
                        setLookupError(null);
                      }}
                      aria-label="Clear search"
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  data-testid="friend-lookup-submit"
                  disabled={lookupBusy}
                  className="min-h-[42px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lookupBusy ? '...' : pick('Start Chat', 'بدء المحادثة', 'دەستپێکردن', 'Sohbet Başlat', 'Démarrer', 'Iniciar Chat')}</span>
                </motion.button>
              </div>
              {lookupError && (
                <p data-testid="friend-lookup-error" className="text-[11px] font-semibold text-rose-500">
                  {lookupError}
                </p>
              )}

              <UsernameSearchResults
                searchState={usernameSearch}
                language={language}
                themeMode={themeMode}
                actionIcon="chat"
                actionLabel={pick('Chat Now', 'ابدأ المحادثة', 'چات بکە', 'Sohbet Et', 'Discuter', 'Chatear')}
                onSelectCandidate={handleSelectSearchCandidate}
              />
            </form>

            {/* Friends & Conversations List (Live-filtered by query) */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto overscroll-contain scrollbar-thin">
              {filteredFriends.length === 0 && filteredExtraChatPeers.length === 0 ? (
                <div
                  className={`p-6 rounded-2xl border text-center space-y-1.5 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <Users className={`w-7 h-7 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <p className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {normalizedFilterQuery
                      ? pick('No matching saved friends', 'لا يوجد أصدقاء مطابقون', 'هیچ هاوڕێیەکی هاوشێوە نەدۆزرایەوە', 'Eşleşen arkadaş yok', 'Aucun ami correspondant', 'Sin amigos coincidentes')
                      : pick('No friends added yet', 'لا يوجد أصدقاء بعد', 'هێشتا هیچ هاوڕێیەک نییە', 'Henüz arkadaş yok', 'Aucun ami pour le moment', 'Aún no hay amigos agregados')}
                  </p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {normalizedFilterQuery
                      ? pick(
                          'Select a user from the search results above or verify the @username.',
                          'اختر مستخدماً من نتائج البحث أعلاه أو تحقق من الاسم.',
                          'بەکارهێنەرێک لە ئەنجامی گەڕانەکەی سەرەوە هەڵبژێرە.',
                          'Yukarıdaki arama sonuçlarından seçin veya kullanıcı adını kontrol edin.',
                          'Sélectionnez un utilisateur ci-dessus ou vérifiez le @identifiant.',
                          'Selecciona un usuario arriba o verifica el @usuario.'
                        )
                      : pick(
                          'Enter a friend’s @username above to find them and open a live chat.',
                          'أدخل اسم المستخدم (@username) أعلاه للعثور عليهم وبدء المحادثة.',
                          'لە سەرەوە @usernameـی هاوڕێکەت بنووسە بۆ دۆزینەوە و چاتی ڕاستەوخۆ.',
                          'Bulmak ve canlı sohbet başlatmak için yukarıya @kullanıcı_adı girin.',
                          'Entrez un @identifiant ci-dessus pour trouver un ami et discuter.',
                          'Ingresa el @usuario de un amigo arriba para encontrarlo y chatear.'
                        )}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredFriends.map((friend) => {
                    const isSelected = activePeer?.uid === friend.friendUid;
                    const matchingThread = chatThreads.find(
                      (th) => th.participantIds.includes(friend.friendUid)
                    );
                    return (
                      <motion.div
                        key={friend.friendUid}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-colors ${
                          isSelected
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-400'
                              : 'bg-emerald-500/15 border-emerald-400/45'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                        }`}
                      >
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleOpenChatWithFriend(friend)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-start cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center font-bold text-xs shrink-0">
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.displayName || friend.username || 'Friend'}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (friend.displayName || friend.username || 'F').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold font-pricedown tracking-wide truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {friend.displayName || (friend.username ? `@${friend.username}` : 'Friend')}
                              </span>
                              <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            </div>
                            {friend.username && (
                              <p dir="ltr" className="text-[11px] font-mono text-emerald-500 truncate">
                                @{friend.username}
                              </p>
                            )}
                            {matchingThread?.lastMessageText && (
                              <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                {matchingThread.lastMessageText}
                              </p>
                            )}
                          </div>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleRemoveFriend(friend.friendUid)}
                          title={pick('Remove Friend', 'إزالة الصديق', 'لابردنی هاوڕێ', 'Arkadaşı Kaldır', 'Supprimer', 'Eliminar Amigo')}
                          aria-label={`Remove ${friend.displayName || friend.username || 'friend'}`}
                          className={`p-1.5 rounded-lg cursor-pointer shrink-0 ${
                            isLight
                              ? 'text-slate-400 hover:text-rose-700 hover:bg-rose-100'
                              : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    );
                  })}

                  {filteredExtraChatPeers.map((peer) => {
                    const isSelected = activeChatId === peer.thread.id;
                    return (
                      <motion.button
                        key={peer.thread.id}
                        layout
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setActiveChatId(peer.thread.id);
                          setMobileShowChat(true);
                          setActivePeer({
                            uid: peer.peerUid,
                            username: peer.username,
                            displayName: peer.displayName,
                            avatar: peer.avatar,
                          });
                        }}
                        className={`w-full p-3 rounded-2xl border flex items-center gap-2.5 text-start cursor-pointer transition-colors ${
                          isSelected
                            ? isLight
                              ? 'bg-sky-50 border-sky-400'
                              : 'bg-sky-500/15 border-sky-400/45'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/15 border border-sky-400/35 flex items-center justify-center font-bold text-xs shrink-0">
                          {peer.avatar ? (
                            <img
                              src={peer.avatar}
                              alt={peer.displayName || peer.username || 'Friend'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            peer.displayName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold font-pricedown tracking-wide truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {peer.displayName}
                          </span>
                          {peer.username && (
                            <span dir="ltr" className="text-[11px] font-mono text-sky-400 truncate block">
                              @{peer.username}
                            </span>
                          )}
                          {peer.thread.lastMessageText && (
                            <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              {peer.thread.lastMessageText}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Panel: Real-Time 1-to-1 Chat Stream + Loan Reference Composer */}
          <div
            className={`lg:col-span-7 rounded-3xl glass-card border flex flex-col min-h-[460px] max-h-[640px] overflow-hidden ${cardSurface} ${
              mobileShowChat && activeChatId && resolvedActivePeer ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {!activeChatId || !resolvedActivePeer ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-600'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                  }`}
                >
                  <MessageSquare glow="accent" className="w-6 h-6" strokeWidth={1.65} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {pick('Select a Friend to Chat', 'اختر صديقاً لبدء المحادثة', 'هاوڕێیەک هەڵبژێرە بۆ چات', 'Sohbet için bir arkadaş seçin', 'Sélectionnez un ami', 'Selecciona un amigo para chatear')}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pick(
                      'Discuss specific loans, share payment updates, and coordinate due dates in real time.',
                      'ناقش الديون، شارك تحديثات الدفع، ونسّق المواعيد لحظياً.',
                      'لەسەر قەرزەکان گفتوگۆ بکە و نوێکارییەکانی پارەدان بنێرە.',
                      'Borçları tartışın ve ödeme güncellemelerini canlı paylaşın.',
                      'Discutez des prêts et partagez des mises à jour de paiement en direct.',
                      'Conversa sobre préstamos, comparte pagos y coordina vencimientos en tiempo real.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Peer Header */}
                <div
                  className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
                    isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/[0.07] bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      aria-label={pick('Back to Friends', 'العودة للأصدقاء', 'گەڕانەوە بۆ هاوڕێیان', 'Arkadaşlara Dön', 'Retour', 'Volver a Amigos')}
                      className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-white/[0.05] border-white/[0.1] text-slate-300 hover:text-white'
                      }`}
                    >
                      <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-xs shrink-0">
                      {resolvedActivePeer.avatar ? (
                        <img
                          src={resolvedActivePeer.avatar}
                          alt={resolvedActivePeer.username || 'Friend'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (resolvedActivePeer.displayName || resolvedActivePeer.username || 'F').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm font-bold font-pricedown tracking-wide truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {resolvedActivePeer.displayName || (resolvedActivePeer.username ? `@${resolvedActivePeer.username}` : 'Friend')}
                      </h3>
                      {resolvedActivePeer.username && (
                        <p className="text-[11px] font-mono text-emerald-500 truncate">
                          @{resolvedActivePeer.username}
                        </p>
                      )}
                    </div>
                  </div>
                  {resolvedActivePeer.bio && (
                    <span className={`hidden sm:block text-[11px] max-w-[220px] truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {resolvedActivePeer.bio}
                    </span>
                  )}
                </div>

                {/* Live Messages Stream */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 scrollbar-thin">
                  {messagesLoading ? (
                    <p className={`text-xs text-center py-8 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {pick('Syncing messages...', 'جاري تحميل الرسائل...', 'بارکردنی پەیامەکان...', 'Mesajlar yükleniyor...', 'Chargement...', 'Sincronizando mensajes...')}
                    </p>
                  ) : messages.length === 0 ? (
                    <p className={`text-xs text-center py-8 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {pick(
                        'No messages yet. Send a message or attach a loan record below!',
                        'لا توجد رسائل بعد. أرسل رسالة أو أرفق سجل دين أدناه!',
                        'هێشتا هیچ پەیامێک نییە. پەیامێک بنێرە یان قەرزێک هاوپێچ بکە!',
                        'Henüz mesaj yok. Aşağıdan mesaj veya borç kartı gönderin!',
                        'Aucun message. Envoyez un message ou joignez un prêt ci-dessous !',
                        'Aún no hay mensajes. ¡Envía un mensaje o adjunta un préstamo abajo!'
                      )}
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === authUid;
                      const liveRef = resolveLiveChatLoanReference(msg, allLoans);
                      const isLinkedTheyOwe = (liveRef?.type || msg.linkedLoanType) === 'they_owe_me';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 border space-y-2 ${
                              isMine
                                ? isLight
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-emerald-500/20 text-slate-100 border-emerald-400/35'
                                : isLight
                                ? 'bg-slate-100 text-slate-900 border-slate-200'
                                : 'bg-white/[0.05] text-slate-100 border-white/[0.08]'
                            }`}
                          >
                            {/* Linked Loan Reference Card inside message (live synced to active/archived loans) */}
                            {liveRef && (
                              <div
                                className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                  isMine && isLight
                                    ? 'bg-white/15 border-white/25 text-white'
                                    : isLight
                                    ? 'bg-white border-slate-300 text-slate-900'
                                    : 'bg-slate-950/75 border-white/15 text-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold flex items-center gap-1.5 truncate">
                                    <span className="inline-emoji" aria-hidden="true">
                                      {isLinkedTheyOwe ? '💰' : '💸'}
                                    </span>
                                    <span className="truncate">{liveRef.personName}</span>
                                    {liveRef.linkedUsername &&
                                      (liveRef.personName || '').trim().toLowerCase() !== `@${liveRef.linkedUsername.toLowerCase()}` && (
                                        <span className="text-[10px] font-mono opacity-75 shrink-0" dir="ltr">
                                          @{liveRef.linkedUsername}
                                        </span>
                                      )}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-current/25 font-semibold shrink-0">
                                    {liveRef.status === 'settled'
                                      ? pick('Settled', 'مسدد', 'پاکتاوکراو', 'Ödendi', 'Réglé', 'Saldado')
                                      : msg.messageKind === 'payment_update'
                                      ? pick('Payment Update', 'تحديث سداد', 'نوێکاری پارەدان', 'Ödeme Güncellemesi', 'Mise à jour', 'Actualización de Pago')
                                      : pick('Loan Ref', 'مرجع دين', 'سەرچاوەی قەرز', 'Borç Kartı', 'Prêt lié', 'Ref. Préstamo')}
                                  </span>
                                </div>
                                <div
                                  data-numeric="true"
                                  dir="ltr"
                                  className="font-numeric font-black text-sm tabular-nums"
                                >
                                  {formatSignedCardDebt(
                                    liveRef.amount,
                                    liveRef.currency,
                                    language,
                                    liveRef.type
                                  )}
                                </div>
                              </div>
                            )}

                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          </div>
                          <span
                            data-numeric="true"
                            className={`text-[10px] font-numeric mt-1 px-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}
                          >
                            {msg.senderName ? `${msg.senderName} · ` : ''}
                            {new Date(msg.clientCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected Loan Attachment Chip + Picker */}
                {(attachedLoan || showLoanPicker) && (
                  <div
                    className={`px-4 py-2.5 border-t space-y-2 shrink-0 ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.07] bg-slate-950/60'
                    }`}
                  >
                    {attachedLoan && (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Link2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="inline-emoji" aria-hidden="true">
                            {attachedLoan.type === 'they_owe_me' ? '💰' : '💸'}
                          </span>
                          <span className="truncate">{formatLoanChatReferenceSummary(attachedLoan, language)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPaymentUpdateMode((v) => !v)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                              isPaymentUpdateMode
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : isLight
                                ? 'bg-white text-slate-700 border-slate-300'
                                : 'bg-white/[0.05] text-slate-300 border-white/[0.1]'
                            }`}
                          >
                            {pick('Tag: Payment Update', 'وسم: تحديث دفعة', 'تاگ: نوێکاری پارەدان', 'Etiket: Ödeme', 'Tag : Paiement', 'Etiqueta: Pago')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedLoan(null);
                              onClearPreselectedLoan?.();
                            }}
                            aria-label="Remove attached loan"
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {showLoanPicker && (() => {
                      const peerUsername = resolvedActivePeer?.username;
                      const { exactMatches } = filterLoansByExactUsername(allLoans, peerUsername);
                      const pickerLoans = peerUsername ? exactMatches : allLoans;
                      return (
                        <div className="max-h-36 overflow-y-auto space-y-1 pt-1 scrollbar-thin">
                          {pickerLoans.length === 0 ? (
                            <p className="text-[11px] text-slate-500">
                              {peerUsername
                                ? pick(
                                    `No debts linked to @${peerUsername} yet.`,
                                    `لا توجد ديون مرتبطة بـ @${peerUsername} بعد.`,
                                    `هێشتا هیچ قەرزێک بە @${peerUsername} گرێنەدراوە.`,
                                    `@${peerUsername} ile eşleşen borç kaydı yok.`,
                                    `Aucun prêt lié à @${peerUsername} pour le moment.`,
                                    `Aún no hay deudas vinculadas a @${peerUsername}.`
                                  )
                                : pick(
                                    'No loans available to attach.',
                                    'لا توجد ديون لإرفاقها.',
                                    'هیچ قەرزێک بۆ هاوپێچکردن نییە.',
                                    'Eklenecek borç yok.',
                                    'Aucun prêt disponible.',
                                    'No hay préstamos disponibles para adjuntar.'
                                  )}
                            </p>
                          ) : (
                            pickerLoans.map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  setAttachedLoan(l);
                                  setShowLoanPicker(false);
                                }}
                                className={`w-full px-3 py-1.5 rounded-xl border text-start text-xs flex items-center justify-between gap-2 cursor-pointer ${
                                  isLight
                                    ? 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-800'
                                    : 'bg-white/[0.03] hover:bg-emerald-500/15 border-white/[0.08] text-slate-200'
                                }`}
                              >
                                <span className="truncate font-semibold flex items-center gap-1.5">
                                  <span className="inline-emoji" aria-hidden="true">
                                    {l.type === 'they_owe_me' ? '💰' : '💸'}
                                  </span>
                                  <span className="truncate">{l.personName}</span>
                                  {l.linkedUsername &&
                                    (l.personName || '').trim().toLowerCase() !== `@${l.linkedUsername.toLowerCase()}` && (
                                      <span className="text-[10px] font-mono opacity-70 shrink-0" dir="ltr">
                                        @{l.linkedUsername}
                                      </span>
                                    )}
                                </span>
                                <span data-numeric="true" dir="ltr" className="font-numeric font-bold tabular-nums shrink-0">
                                  {formatSignedCardDebt(
                                    l.status === 'settled' ? l.amount : getRemainingLoanBalance(l),
                                    l.currency || 'USD',
                                    language,
                                    l.type
                                  )}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Chat Message Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className={`p-3 sm:p-4 border-t flex items-center gap-2 shrink-0 ${
                    isLight ? 'border-slate-200 bg-white' : isVelvetPink ? 'border-[#E8B4A0]/20 bg-[#170D1B]' : 'border-white/[0.07] bg-[#090D16]'
                  }`}
                >
                  <button
                    type="button"
                    data-testid="toggle-loan-picker-btn"
                    onClick={() => setShowLoanPicker((v) => !v)}
                    title={pick('Attach Loan Reference', 'إرفاق سجل دين', 'هاوپێچکردنی قەرز', 'Borç Kartı Ekle', 'Joindre un prêt', 'Adjuntar Préstamo')}
                    aria-label={pick('Attach Loan Reference', 'إرفاق سجل دين', 'هاوپێچکردنی قەرز', 'Borç Kartı Ekle', 'Joindre un prêt', 'Adjuntar Préstamo')}
                    className={`min-h-[42px] w-10 rounded-xl border flex items-center justify-center cursor-pointer shrink-0 smooth-interactive ${
                      showLoanPicker || attachedLoan
                        ? isVelvetPink
                          ? 'bg-[#FF2E93]/20 border-[#FF65B5]/50 text-[#FF65B5]'
                          : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                        : isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                        : 'bg-white/[0.04] border-white/[0.1] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    data-testid="friend-chat-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={pick(
                      'Message your friend or discuss a loan...',
                      'راسل صديقك أو ناقش تفاصيل الدين...',
                      'نامە بنێرە یان گفتوگۆ لەسەر قەرز بکە...',
                      'Mesaj yazın veya borç hakkında konuşun...',
                      'Écrivez un message ou discutez d’un prêt...',
                      'Escribe a tu amigo o conversa sobre un préstamo...'
                    )}
                    className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm outline-none ${inputSurface}`}
                  />

                  <button
                    type="submit"
                    data-testid="friend-chat-send-btn"
                    disabled={sending || (!messageInput.trim() && !attachedLoan)}
                    aria-label={pick('Send', 'إرسال', 'ناردن', 'Gönder', 'Envoyer', 'Enviar')}
                    className={`min-h-[42px] px-4 rounded-xl disabled:opacity-40 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 smooth-interactive ${
                      isVelvetPink
                        ? 'bg-gradient-to-r from-[#FF2E93] to-[#FF65B5] hover:from-[#FF65B5] hover:to-[#FF85C5] text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <Send glow="accent" className="w-4 h-4" />
                    <span className="hidden sm:inline">{pick('Send', 'إرسال', 'ناردن', 'Gönder', 'Envoyer', 'Enviar')}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
