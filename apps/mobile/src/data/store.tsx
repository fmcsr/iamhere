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
  MORE_USERS,
  NIGHT_HISTORY,
  POSTS,
  SAVED_VENUES,
  USERS,
  VENUES,
  type Audience,
  type Conversation,
  type Message,
  type Plan,
  type Post,
  type User,
  type Venue,
  followsBetween,
} from './mock';
import { EN } from './mock.en';
import { resolveLang, setLang, type Lang, type LanguageSetting } from '@/i18n';
import { collectNights, nightKeyOf, tonightKey } from '@/lib/nights';
import { loadedPhoto, storedPhoto } from '@/lib/profile';

export type PresenceVisibility = 'herkes' | 'karsilikli' | 'kimse';

/** Görünüm: sistemi izle ya da her zaman açık / koyu. Cihazda saklanır. */
export type AppearanceMode = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'here.appearance';

/** Ayarlar › Görünüm alanının üç tasarım seçeneği (T-19). */
export type AppearanceUI = 'onizleme' | 'ios' | 'menu';

/** Tasarım denemesi (prototip): kurucuyla karşılaştırıp karar vermek için; cihazda saklanır. */
export type Trial = { backdrop: BackdropVariant; appearanceUI: AppearanceUI };

const TRIAL_KEY = 'here.trial';
/** Uygulamanın dili (T-29); cihazda saklanır. */
const LANGUAGE_KEY = 'here.language';
const LANGUAGES: LanguageSetting[] = ['system', 'tr', 'en'];
/** Profilde düzenlenen alanlar (Profili düzenle); cihazda saklanır. */
const PROFILE_KEY = 'here.profile';
/** Oturum: girişli mi (prototip; gerçek kimlik doğrulama yok). */
const SESSION_KEY = 'here.session';
type ProfileEdit = Pick<User, 'displayName' | 'username' | 'bio' | 'interests' | 'avatarUri' | 'coverUri'>;
const BACKDROPS: BackdropVariant[] = ['ust', 'kose', 'genis'];
const APPEARANCE_UIS: AppearanceUI[] = ['onizleme', 'ios', 'menu'];

type Settings = {
  privateAccount: boolean;
  presenceVisibility: PresenceVisibility;
  /** Yer bildirirken paylaşımın kitlesi; yer bildirme sayfasında seçim yok, hep "herkes" (ROTA.md §14, S2). */
  lastAudience: Audience;
  appearance: AppearanceMode;
  /** Ayarlar › Dil: Sistem / Türkçe / English (T-29). */
  language: LanguageSetting;
};

/** Seçimi tüm yerel arayüze uygular (sekme çubuğu, cam, haritalar, SwiftUI dahil). */
function applyAppearance(mode: AppearanceMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

/** Benden başka herkes: paylaşımı olan kişiler ve takip listelerini dolduran diğerleri. */
const OTHERS: User[] = [...USERS, ...MORE_USERS];

type CheckIn = { venueId: string; anonAlias?: string; at: number };

type CheckInInput = { venueId: string; text: string; imageUri?: string; audience: Audience };

const ANON_ALIAS = 'Gezgin Martı 17';

function useAppState() {
  const [rawMe, setMe] = useState<User>(ME);
  const [rawPosts, setPosts] = useState<Post[]>(POSTS);
  const [liked, setLiked] = useState<Set<string>>(() => new Set(['p2']));
  const [following, setFollowing] = useState<Set<string>>(() => new Set(I_FOLLOW));
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [rawMessages, setMessages] = useState<Message[]>(MESSAGES);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [joinedPlans, setJoinedPlans] = useState<Set<string>>(() => new Set());
  const [readConversations, setReadConversations] = useState<Set<string>>(() => new Set());
  const [followRequests, setFollowRequests] = useState<Set<string>>(() => new Set());
  // To-HERE listem: gitmek istediğim mekânlar, en son kaydedilen önde.
  const [saved, setSaved] = useState<string[]>(() => SAVED_VENUES.me ?? []);
  const [settings, setSettings] = useState<Settings>({
    privateAccount: false,
    presenceVisibility: 'karsilikli',
    lastAudience: 'herkes',
    appearance: 'system',
    language: 'system',
  });
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [trial, setTrialState] = useState<Trial>({ backdrop: 'ust', appearanceUI: 'onizleme' });

  // İngilizcede prototip verisinin İngilizcesi gösterilir (mock.en.ts); kullanıcının kendi yazdıkları olduğu gibi kalır.
  // Durum (state) hep ham veriyi tutar; okuyan her şey aşağıdaki çevrilmiş hâlleri görür.
  const lang: Lang = resolveLang(settings.language);
  const en = lang === 'en';
  const alias = (name?: string) => (en && name ? (EN.aliases[name] ?? name) : name);
  const localUser = (u: User): User => (en && EN.bios[u.id] ? { ...u, bio: EN.bios[u.id] } : u);
  const localPost = (p: Post): Post => (en ? { ...p, text: p.text && (EN.posts[p.id] ?? p.text), anonAlias: alias(p.anonAlias) } : p);
  const localMessage = (m: Message): Message =>
    en
      ? {
          ...m,
          text: EN.messages[m.id] ?? m.text,
          anonAlias: alias(m.anonAlias),
          plan: m.plan && EN.plans[m.id] ? { ...m.plan, ...EN.plans[m.id] } : m.plan,
        }
      : m;
  const localVenue = (v: Venue): Venue => (en && EN.events[v.id] ? { ...v, event: EN.events[v.id] } : v);
  // Kendi biyografin yalnızca prototipteki hâliyle duruyorsa çevrilir; yazdığın metin kalır.
  const me = en && rawMe.bio === ME.bio && EN.bios.me ? { ...rawMe, bio: EN.bios.me } : rawMe;
  const posts = en ? rawPosts.map(localPost) : rawPosts;
  const messages = en ? rawMessages.map(localMessage) : rawMessages;
  const venues = en ? VENUES.map(localVenue) : VENUES;
  const people = en ? USERS.map(localUser) : USERS;
  const others = en ? OTHERS.map(localUser) : OTHERS;

  // Kayıtlı görünüm tercihini, tasarım denemesini ve düzenlenen profili açılışta uygula.
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(APPEARANCE_KEY),
      AsyncStorage.getItem(TRIAL_KEY),
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(SESSION_KEY),
    ])
      .then(([value, saved, profile, language, session]) => {
        setSignedIn(session === 'in');
        if (LANGUAGES.includes(language as LanguageSetting)) {
          const setting = language as LanguageSetting;
          setLang(resolveLang(setting));
          setSettings((s) => ({ ...s, language: setting }));
        }
        if (profile) {
          try {
            const edit = JSON.parse(profile) as Partial<ProfileEdit>;
            setMe((m) => ({ ...m, ...edit, avatarUri: loadedPhoto(edit.avatarUri), coverUri: loadedPhoto(edit.coverUri) }));
          } catch {
            // Bozuk kayıt: varsayılan profille devam.
          }
        }
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

  /** Ayarlar › Dil (T-29). Yardımcılar (zaman, mesafe, tarih) yeni dili yeniden çizimden önce görsün diye önce o. */
  const setLanguage = (language: LanguageSetting) => {
    setLang(resolveLang(language));
    setSettings((s) => ({ ...s, language }));
    AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => {});
  };

  /** Giriş (hoş geldin sayfası): prototipte her yol başarılı. */
  const signIn = () => {
    setSignedIn(true);
    AsyncStorage.setItem(SESSION_KEY, 'in').catch(() => {});
  };

  /** Ayarlar › Çıkış yap: hoş geldin sayfasına dönülür; profil ve ayarlar cihazda kalır. */
  const signOut = () => {
    setSignedIn(false);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  };

  const setAppearance = (mode: AppearanceMode) => {
    applyAppearance(mode);
    setSettings((s) => ({ ...s, appearance: mode }));
    AsyncStorage.setItem(APPEARANCE_KEY, mode).catch(() => {});
  };

  /** Profili düzenle › Kaydet. Fotoğraflar önceden belgeler klasörüne kopyalanmış olmalı (keepPhoto). */
  const updateMe = (changes: ProfileEdit) => {
    // Çevrilmiş varsayılan biyografi değiştirilmeden kaydedilirse ham (Türkçe) hâli korunur.
    const edit = { ...changes, bio: changes.bio === me.bio && rawMe.bio === ME.bio ? ME.bio : changes.bio };
    setMe((m) => ({ ...m, ...edit }));
    const stored: ProfileEdit = { ...edit, avatarUri: storedPhoto(edit.avatarUri), coverUri: storedPhoto(edit.coverUri) };
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(stored)).catch(() => {});
  };

  /** Kullanıcı adı başkasında var mı (büyük/küçük harf fark etmez). */
  const usernameTaken = (username: string) => OTHERS.some((u) => u.username.toLowerCase() === username.toLowerCase());

  const everyone = [me, ...others];
  const userById = (id: string): User => (id === 'me' ? me : (others.find((u) => u.id === id) ?? me));
  const venueById = (id: string) => venues.find((v) => v.id === id);
  const followsMe = (userId: string) => FOLLOWS_ME.has(userId);
  const isMutual = (userId: string) => following.has(userId) && followsMe(userId);

  /** a, b'yi takip ediyor mu? Benimle ilgili kenarlar canlı durumdan, diğerleri sabit sahte grafikten. */
  const follows = (a: string, b: string) =>
    a === 'me' ? following.has(b) : b === 'me' ? followsMe(a) : followsBetween(a, b);
  const followersOf = (userId: string) => everyone.filter((u) => u.id !== userId && follows(u.id, userId));
  const followingOf = (userId: string) => everyone.filter((u) => u.id !== userId && follows(userId, u.id));

  /**
   * Kişinin geceleri (profil takvimi, özet, ortak geceler). `onlyPosts`: yalnızca paylaşım yaptığı geceler;
   * karşılıklı takipleşmediğin birinin yer bildirimleri görünmez (gizlilik, TASARIM.md §5.8).
   */
  const nightsOf = (userId: string, { onlyPosts = false, visiblePosts }: { onlyPosts?: boolean; visiblePosts?: Post[] } = {}) =>
    collectNights({
      history: onlyPosts ? [] : (NIGHT_HISTORY[userId] ?? []),
      posts: visiblePosts ?? posts.filter((p) => p.userId === userId && !p.anonAlias),
      tonightVenueId: userId === 'me' && !onlyPosts ? checkIn?.venueId : undefined,
    });

  /** Paylaşımı görebilir miyim: takipçilere özel olanları yalnızca takip edenler görür. */
  const canSee = (post: Post) => post.audience !== 'takipciler' || post.userId === 'me' || following.has(post.userId);

  /** Kişinin etiketlendiği (görebildiğim) paylaşımlar; yeniden eskiye. */
  const taggedPostsOf = (userId: string) =>
    posts.filter((p) => p.tagged?.includes(userId) && !p.anonAlias && canSee(p)).sort((a, b) => b.createdAt - a.createdAt);

  /** Kişinin To-HERE listesi (gitmek istediği mekânlar). */
  const savedOf = (userId: string) => (userId === 'me' ? saved : (SAVED_VENUES[userId] ?? []));

  const toggleSaved = (venueId: string) =>
    setSaved((prev) => (prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [venueId, ...prev]));

  /** Son mesaj karşı taraftansa ve sohbet açılmadıysa okunmamış sayılır. */
  const isUnread = (conversationId: string) => {
    const last = messages.filter((m) => m.conversationId === conversationId).at(-1);
    return Boolean(last && last.senderId !== 'me' && !readConversations.has(conversationId));
  };

  const markRead = (conversationId: string) =>
    setReadConversations((prev) => (prev.has(conversationId) ? prev : new Set(prev).add(conversationId)));

  /**
   * Kişinin bu geceki son (anonim olmayan) paylaşımı; "şu an burada" bundan çıkar. Paylaşımlar kalıcı (K-16)
   * ama önceki gecelerinkiler kimseyi "şu an" bir mekânda göstermez.
   */
  const tonightPostOf = (userId: string) => {
    const tonight = tonightKey();
    return posts
      .filter((p) => p.userId === userId && !p.anonAlias && nightKeyOf(p.createdAt) === tonight)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  /** Bu gece bu mekânda görünen (anonim olmayan) kişiler; takip ettiklerin önde. */
  const peopleAt = (venueId: string): User[] =>
    people.filter((u) => tonightPostOf(u.id)?.venueId === venueId).sort(
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
    me,
    updateMe,
    usernameTaken,
    users: others,
    venues,
    posts,
    liked,
    following,
    conversations,
    messages,
    // Takma ad da seçili dilde ("Gezgin Martı 17" · "Wandering Seagull 17").
    checkIn: checkIn && en ? { ...checkIn, anonAlias: alias(checkIn.anonAlias) } : checkIn,
    joinedPlans,
    settings,
    appearanceLoaded,
    trial,
    setTrial,
    userById,
    venueById,
    followsMe,
    follows,
    followersOf,
    followingOf,
    nightsOf,
    canSee,
    taggedPostsOf,
    savedOf,
    toggleSaved,
    isMutual,
    isUnread,
    markRead,
    tonightPostOf,
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
    lang,
    setLanguage,
    signedIn,
    signIn,
    signOut,
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
