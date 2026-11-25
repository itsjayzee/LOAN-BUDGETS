import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, MessageSquare, SearchX, UserCheck } from './OrganicIcons';
import { FriendChatThread, FriendRecord, Language, ThemeMode } from '../types';
import {
  CounterpartySearchCandidate,
  isLightThemeMode,
  searchKnownCounterparties,
} from '../utils/loanLogic';
import { lookupUserByUsername } from '../firebase';

export interface DebouncedUsernameSearchState {
  cleanQuery: string;
  isSearching: boolean;
  hasSettled: boolean;
  results: CounterpartySearchCandidate[];
}

const EMPTY_FRIENDS: FriendRecord[] = [];
const EMPTY_CHAT_THREADS: FriendChatThread[] = [];

/**
 * Provides 300ms debounced intelligent search across local friends, chat threads,
 * and live Cloud Firestore /usernames/{usernameLower} exact profile lookup.
 */
export function useDebouncedUsernameSearch(params: {
  query: string;
  friends?: FriendRecord[];
  chatThreads?: FriendChatThread[];
  excludeUid?: string | null;
  enabled?: boolean;
  minChars?: number;
  debounceMs?: number;
}): DebouncedUsernameSearchState {
  const {
    query,
    friends = EMPTY_FRIENDS,
    chatThreads = EMPTY_CHAT_THREADS,
    excludeUid = null,
    enabled = true,
    minChars = 2,
    debounceMs = 300,
  } = params;

  const cleanQuery = query.trim().replace(/^@+/, '');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);
  const [results, setResults] = useState<CounterpartySearchCandidate[]>([]);

  useEffect(() => {
    if (!enabled || cleanQuery.length < minChars) {
      setIsSearching(false);
      setHasSettled(false);
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setHasSettled(false);

    const timer = setTimeout(async () => {
      const localMatches = searchKnownCounterparties({
        query: cleanQuery,
        friends,
        chatThreads,
        excludeUid,
      });

      const merged = new Map<string, CounterpartySearchCandidate>();
      for (const item of localMatches) {
        const key = item.uid ? `uid:${item.uid}` : `handle:${item.usernameLower}`;
        merged.set(key, item);
      }

      if (/^[a-zA-Z0-9_]{3,32}$/.test(cleanQuery)) {
        try {
          const cloudUser = await lookupUserByUsername(cleanQuery.toLowerCase());
          if (cancelled) return;
          if (cloudUser && cloudUser.uid !== excludeUid) {
            const uidKey = `uid:${cloudUser.uid}`;
            const existing =
              merged.get(uidKey) ||
              Array.from(merged.values()).find((c) => c.usernameLower === cloudUser.usernameLower);
            merged.set(uidKey, {
              uid: cloudUser.uid,
              username: cloudUser.username,
              usernameLower: cloudUser.usernameLower,
              displayName: cloudUser.displayName || existing?.displayName,
              avatar: cloudUser.avatar || existing?.avatar,
              bio: cloudUser.bio || existing?.bio,
              source: existing?.source || 'cloud',
            });
          }
        } catch {
          // Gracefully keep local matches when offline or unauthenticated
        }
      }

      if (cancelled) return;
      const ordered = Array.from(merged.values()).sort((a, b) => {
        const qLower = cleanQuery.toLowerCase();
        const aExact = a.usernameLower === qLower || (a.displayName || '').trim().toLowerCase() === qLower ? 0 : 1;
        const bExact = b.usernameLower === qLower || (b.displayName || '').trim().toLowerCase() === qLower ? 0 : 1;
        return aExact - bExact;
      });
      setResults(ordered);
      setIsSearching(false);
      setHasSettled(true);
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery, friends, chatThreads, excludeUid, enabled, minChars, debounceMs]);

  return {
    cleanQuery,
    isSearching,
    hasSettled,
    results,
  };
}

interface UsernameSearchResultsProps {
  searchState: DebouncedUsernameSearchState;
  language: Language;
  themeMode?: ThemeMode;
  actionLabel?: string;
  actionIcon?: 'select' | 'chat';
  emptyHint?: string;
  onSelectCandidate: (candidate: CounterpartySearchCandidate) => void;
}

export const UsernameSearchResults: React.FC<UsernameSearchResultsProps> = ({
  searchState,
  language,
  themeMode = 'obsidian_neon',
  actionLabel,
  actionIcon = 'select',
  emptyHint,
  onSelectCandidate,
}) => {
  const isKu = language === 'ku';
  const isAr = language === 'ar';
  const isTr = language === 'tr';
  const isFr = language === 'fr';
  const isEs = language === 'es';
  const pick = (en: string, ar: string, ku: string, tr: string, fr: string, es: string = en) =>
    isKu ? ku : isAr ? ar : isTr ? tr : isFr ? fr : isEs ? es : en;

  const isLight = isLightThemeMode(themeMode);
  const isVelvetPink = themeMode === 'velvet_pink';
  const { cleanQuery, isSearching, hasSettled, results } = searchState;

  const shouldRender = cleanQuery.length >= 2 && (isSearching || hasSettled);

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <motion.div
          key={isSearching ? 'searching' : results.length > 0 ? 'results' : 'empty'}
          initial={{ opacity: 0, y: -4, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.985 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
          style={{
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)',
          }}
          className={`rounded-2xl border overflow-hidden ${
            isLight
              ? 'bg-slate-50/95 border-slate-200'
              : isVelvetPink
              ? 'bg-[#170D1B]/95 border-[#E8B4A0]/25'
              : 'bg-[#080B11]/95 border-white/[0.08]'
          }`}
        >
          {isSearching ? (
            <div
              data-testid="username-search-loading"
              className={`px-3.5 py-3 flex items-center gap-2.5 text-xs ${
                isLight ? 'text-slate-600' : isVelvetPink ? 'text-[#F4D9E9]' : 'text-slate-300'
              }`}
            >
              <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-500'}`} glow="accent" />
              <span className="truncate">
                {pick(
                  `Searching "${cleanQuery}"...`,
                  `جاري البحث عن "${cleanQuery}"...`,
                  `گەڕان بۆ "${cleanQuery}"...`,
                  `"${cleanQuery}" aranıyor...`,
                  `Recherche de « ${cleanQuery} »...`,
                  `Buscando "${cleanQuery}"...`
                )}
              </span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-white/[0.06] max-h-48 overflow-y-auto overscroll-contain">
              {results.map((candidate) => (
                <motion.button
                  key={`${candidate.uid}_${candidate.usernameLower || candidate.displayName || 'contact'}`}
                  type="button"
                  data-testid="username-search-result-card"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectCandidate(candidate)}
                  className={`smooth-interactive w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-start transition-colors cursor-pointer ${
                    isLight
                      ? 'hover:bg-emerald-50/80'
                      : isVelvetPink
                      ? 'hover:bg-[#FF2E93]/15'
                      : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center font-bold text-xs shrink-0 ${
                        isLight
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : isVelvetPink
                          ? 'bg-[#FF2E93]/20 border-[#FF65B5]/40 text-[#FF9ED0]'
                          : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                      }`}
                    >
                      {candidate.avatar ? (
                        <img
                          src={candidate.avatar}
                          alt={candidate.displayName || candidate.username || 'Contact'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (candidate.displayName || candidate.username || 'C')
                          .replace(/^@+/, '')
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold font-pricedown tracking-wide truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {candidate.displayName || (candidate.username ? `@${candidate.username}` : 'Contact')}
                      </p>
                      {candidate.username && (
                        <p
                          dir="ltr"
                          className={`text-[11px] font-mono truncate ${
                            isLight ? 'text-emerald-700' : isVelvetPink ? 'text-[#FF65B5]' : 'text-emerald-400'
                          }`}
                        >
                          @{candidate.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                      isLight
                        ? 'bg-emerald-600 text-white'
                        : isVelvetPink
                        ? 'bg-[#FF2E93]/25 text-[#FF9ED0] border border-[#FF65B5]/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {actionIcon === 'chat' ? (
                      <MessageSquare className="w-3 h-3" strokeWidth={1.8} glow="accent" />
                    ) : (
                      <UserCheck className="w-3 h-3" strokeWidth={1.8} glow="accent" />
                    )}
                    <span>
                      {actionLabel ||
                        pick('Select', 'اختيار', 'هەڵبژاردن', 'Seç', 'Choisir', 'Seleccionar')}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div
              data-testid="username-search-empty"
              className="px-3.5 py-3 flex items-center gap-2.5 text-xs"
            >
              <SearchX
                className={`w-4 h-4 shrink-0 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
                strokeWidth={1.75}
              />
              <div className="min-w-0">
                <p
                  className={`font-semibold ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  {pick(
                    'No contact or user found',
                    'لم يتم العثور على جهة اتصال أو مستخدم',
                    'هیچ کەسێک بەو ناوە نەدۆزرایەوە',
                    'Eşleşen kişi veya kullanıcı bulunamadı',
                    'Aucun contact ou utilisateur trouvé',
                    'No se encontró ningún contacto o usuario'
                  )}
                </p>
                {emptyHint && (
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {emptyHint}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
