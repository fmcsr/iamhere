import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import type { BackdropVariant } from '@/constants/theme';

import {
  CHECK_IN_RADIUS_M,
  CONVERSATIONS,
  FOLLOWS_ME,
  I_FOLLOW,
  ME,
  MESSAGES,
  POSTS,
  USERS,
  VENUES,
  type Audience,
  type Conversation,
  type Message,
  type Plan,
  type Post,
  type User,
} from './mock';

export type PresenceVisibility = 'herkes' | 'karsilikli' | 'kimse';

/** Görünüm: sistemi izle ya da her zaman açık / koyu. Cihazda saklanır. */
export type AppearanceMode = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'here.appearance';

/** Ayarlar › Görünüm alanının üç tasarım seçeneği (T-19). */
export type AppearanceUI = 'onizleme' | 'ios' | 'menu';

/** Tasarım denemesi (prototip): kurucuyla karşılaştırıp karar vermek için; cihazda saklanır. */
export type Trial = { backdrop: BackdropVariant; appearanceUI: AppearanceUI };

const TRIAL_KEY = 'here.trial';
const BACKDROPS: BackdropVariant[] = ['ust', 'kose', 'genis'];
const APPEARANCE_UIS: AppearanceUI[] = ['onizleme', 'ios', 'menu'];

type Settings = {
  privateAccount: boolean;
  presenceVisibility: PresenceVisibility;
  /** Son seçilen kitle hatırlanır (varsayılan: herkes). */
  lastAudience: Audience;
  appearance: AppearanceMode;
};

/** Seçimi tüm yerel arayüze uygular (sekme çubuğu, cam, haritalar, SwiftUI dahil). */
function applyAppearance(mode: AppearanceMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

type CheckIn = { venueId: string; anonAlias?: string; at: number };

type CheckInInput = { venueId: string; text: string; imageUri?: string; audience: Audience };

const ANON_ALIAS = 'Gezgin Martı 17';

function useAppState() {
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [liked, setLiked] = useState<Set<string>>(() => new Set(['p2']));
  const [following, setFollowing] = useState<Set<string>>(() => new Set(I_FOLLOW));
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [joinedPlans, setJoinedPlans] = useState<Set<string>>(() => new Set());
  const [readConversations, setReadConversations] = useState<Set<string>>(() => new Set());
  const [followRequests, setFollowRequests] = useState<Set<string>>(() => new Set());
  const [settings, setSettings] = useState<Settings>({
    privateAccount: false,
    presenceVisibility: 'karsilikli',
    lastAudience: 'herkes',
    appearance: 'system',
  });
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);
  const [trial, setTrialState] = useState<Trial>({ backdrop: 'ust', appearanceUI: 'onizleme' });

  // Kayıtlı görünüm tercihini ve tasarım denemesini açılışta uygula.
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(APPEARANCE_KEY), AsyncStorage.getItem(TRIAL_KEY)])
      .then(([value, saved]) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          applyAppearance(value);
          setSettings((s) => ({ ...s, appearance: value }));
        }
        const parsed = saved ? (JSON.parse(saved) as Partial<Trial>) : {};
        setTrialState((t) => ({
          backdrop: BACKDROPS.includes(parsed.backdrop as BackdropVariant) ? (parsed.backdrop as BackdropVariant) : t.backdrop,
          appearanceUI: APPEARANCE_UIS.includes(parsed.appearanceUI as AppearanceUI) ? (parsed.appearanceUI as AppearanceUI) : t.appearanceUI,
        }));
      })
      .catch(() => {})
      .finally(() => setAppearanceLoaded(true));
  }, []);

  const setTrial = (patch: Partial<Trial>) => {
    const next = { ...trial, ...patch };
    setTrialState(next);
    AsyncStorage.setItem(TRIAL_KEY, JSON.stringify(next)).catch(() => {});
  };

  const setAppearance = (mode: AppearanceMode) => {
    applyAppearance(mode);
    setSettings((s) => ({ ...s, appearance: mode }));
    AsyncStorage.setItem(APPEARANCE_KEY, mode).catch(() => {});
  };

  const userById = (id: string): User => (id === 'me' ? ME : USERS.find((u) => u.id === id) ?? ME);
  const venueById = (id: string) => VENUES.find((v) => v.id === id);
  const followsMe = (userId: string) => FOLLOWS_ME.has(userId);
  const isMutual = (userId: string) => following.has(userId) && followsMe(userId);

  /** Son mesaj karşı taraftansa ve sohbet açılmadıysa okunmamış sayılır. */
  const isUnread = (conversationId: string) => {
    const last = messages.filter((m) => m.conversationId === conversationId).at(-1);
    return Boolean(last && last.senderId !== 'me' && !readConversations.has(conversationId));
  };

  const markRead = (conversationId: string) =>
    setReadConversations((prev) => (prev.has(conversationId) ? prev : new Set(prev).add(conversationId)));

  /** Bu gece bu mekânda görünen (anonim olmayan) kişiler; takip ettiklerin önde. */
  const peopleAt = (venueId: string): User[] =>
    USERS.filter((u) => posts.find((p) => p.userId === u.id && !p.anonAlias)?.venueId === venueId).sort(
      (a, b) => Number(following.has(b.id)) - Number(following.has(a.id)),
    );

  /** Plan kartında "Ben de varım". */
  const togglePlan = (messageId: string) =>
    setJoinedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });

  const toggleLike = (postId: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });

  const toggleFollow = (userId: string) =>
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  /**
   * Yer bildirimi yalnızca yakındaki mekânda (300 m içinde) yapılabilir; mekân sohbetine de yalnızca
   * yer bildirerek girilir (K-17). Evden "X mekânındayım" deyip sohbete katılmak yok.
   */
  const canCheckIn = (venueId: string) => {
    const venue = venueById(venueId);
    return Boolean(venue && venue.distanceM <= CHECK_IN_RADIUS_M);
  };

  /** Yer bildirir; isteğe bağlı paylaşım oluşturur ve mekân sohbetine üye yapar. Mekân uzaksa hiçbir şey yapmaz. */
  const doCheckIn = ({ venueId, text, imageUri, audience }: CheckInInput): string | null => {
    if (!canCheckIn(venueId)) return null;
    const anonAlias = audience === 'anonim' ? ANON_ALIAS : undefined;
    setCheckIn({ venueId, anonAlias, at: Date.now() });
    setSettings((s) => ({ ...s, lastAudience: audience }));
    if (text.trim() || imageUri) {
      const post: Post = {
        id: `p-${Date.now()}`,
        userId: 'me',
        anonAlias,
        venueId,
        text: text.trim() || undefined,
        imageUri,
        createdAt: Date.now(),
        likes: 0,
        audience,
      };
      setPosts((prev) => [post, ...prev]);
    }
    const convId = `c-${venueId}`;
    setConversations((prev) =>
      prev.some((c) => c.id === convId) ? prev : [{ id: convId, kind: 'venue', venueId }, ...prev],
    );
    return convId;
  };

  const sendMessage = (conversationId: string, text: string, plan?: Plan) => {
    const conv = conversations.find((c) => c.id === conversationId);
    // Mekân sohbetine yalnızca o mekânda yer bildirmiş olan yazabilir.
    if (conv?.kind === 'venue' && checkIn?.venueId !== conv.venueId) return;
    const anonAlias = conv?.kind === 'venue' ? checkIn?.anonAlias : undefined;
    const id = `m-${Date.now()}`;
    setMessages((prev) => [...prev, { id, conversationId, senderId: 'me', anonAlias, text, plan, createdAt: Date.now() }]);
    // Kendi planına otomatik katılırsın.
    if (plan) setJoinedPlans((prev) => new Set(prev).add(id));
  };

  /** Gizli hesaba takip isteği gönder ya da geri çek (onay prototipte yok). */
  const toggleFollowRequest = (userId: string) =>
    setFollowRequests((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  /** Birebir sohbet aç: karşılıklı takipte doğrudan gelen kutusu, değilse karşı tarafa istek. */
  const openDirect = (userId: string) => {
    const existing = conversations.find((c) => c.kind === 'direct' && c.userId === userId);
    if (existing) return existing.id;
    const id = `c-${userId}`;
    const status = isMutual(userId) ? 'inbox' : 'sent';
    setConversations((prev) => [{ id, kind: 'direct', userId, status }, ...prev]);
    return id;
  };

  const acceptRequest = (conversationId: string) =>
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId && c.kind === 'direct' ? { ...c, status: 'inbox' } : c)),
    );

  const declineRequest = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => prev.filter((m) => m.conversationId !== conversationId));
  };

  return {
    me: ME,
    users: USERS,
    venues: VENUES,
    posts,
    liked,
    following,
    conversations,
    messages,
    checkIn,
    joinedPlans,
    settings,
    appearanceLoaded,
    trial,
    setTrial,
    userById,
    venueById,
    followsMe,
    isMutual,
    isUnread,
    markRead,
    peopleAt,
    togglePlan,
    toggleLike,
    toggleFollow,
    followRequests,
    toggleFollowRequest,
    canCheckIn,
    doCheckIn,
    sendMessage,
    openDirect,
    acceptRequest,
    declineRequest,
    updateSettings: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    setAppearance,
  };
}

type AppState = ReturnType<typeof useAppState>;

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  return <AppContext value={state}>{children}</AppContext>;
}

export function useApp(): AppState {
  const ctx = use(AppContext);
  if (!ctx) throw new Error('useApp, AppProvider içinde kullanılmalı');
  return ctx;
}
