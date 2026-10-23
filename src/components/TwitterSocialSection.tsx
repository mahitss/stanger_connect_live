import React, { useRef, useState } from 'react';
import {
  Home,
  Hash,
  Bell,
  Mail,
  Bookmark,
  User as UserIcon,
  Feather,
  Search,
  Sparkles,
  Image as ImageIcon,
  Heart,
  Repeat2,
  MessageCircle,
  Share2,
  Check,
  Maximize2,
  ZoomIn,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  UserPlus,
  UserCheck,
  Globe,
  Users,
  X,
  BadgeCheck,
} from 'lucide-react';
import {
  CURATED_STUDY_MOMENT_IMAGES,
  getStudyMomentPlaceholderById,
  selectStudyMomentPlaceholder,
  MomentCommentRecord,
  canUserCommentOnMoment,
  buildMomentCommentThreadGroups,
  toggleCollapsedCommentThread,
  getNestedThreadAnimationState,
  ThreadedMomentCommentItem,
  NestedThreadAnimationState,
  formatRelativeCommentTimestamp,
  MomentSharePayload,
  MomentLightboxZoomState,
  openMomentLightbox,
  TwitterNavTab,
  TwitterFeedFilter,
  TwitterChatMessage,
  TWITTER_COMMUNITY_CHANNELS,
  deriveTwitterHandle,
  extractTweetHashtags,
  computeTrendingTwitterTopics,
  filterTwitterFeedMoments,
} from '../utils/rules';
import type { OnlinePeer } from '../../server';

export interface TwitterMomentPost {
  id: string;
  authorUid: string;
  authorName: string;
  caption: string;
  photoDataUrl: string;
  visibility: 'public' | 'connections';
  createdAtMs?: number;
}

interface TwitterSocialSectionProps {
  currentIdentity: {
    uid: string;
    email: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    streakCount: number;
    participationPoints: number;
  };
  moments: TwitterMomentPost[];
  momentComments: MomentCommentRecord[];
  commentsByMomentId: Record<string, MomentCommentRecord[]>;
  momentFilter: TwitterFeedFilter;
  setMomentFilter: (filter: TwitterFeedFilter) => void;
  momentCaption: string;
  setMomentCaption: (caption: string) => void;
  momentPhotoDataUrl: string;
  setMomentPhotoDataUrl: (url: string) => void;
  selectedMomentPlaceholderId: string | null;
  setSelectedMomentPlaceholderId: React.Dispatch<React.SetStateAction<string | null>>;
  momentVisibility: 'public' | 'connections';
  setMomentVisibility: (v: 'public' | 'connections') => void;
  momentError: string;
  handlePhotoFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePublishMoment: (e: React.FormEvent) => void;
  handleDeleteMoment: (id: string) => void;
  handleShareMoment: (item: TwitterMomentPost) => void;
  copiedMomentShare: MomentSharePayload | null;
  setMomentLightbox: React.Dispatch<React.SetStateAction<MomentLightboxZoomState | null>>;
  acceptedPeerUids: Set<string>;
  momentCommentInputs: Record<string, string>;
  setMomentCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  momentReplyInputs: Record<string, string>;
  setMomentReplyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeReplyTargetByMoment: Record<string, { commentId: string; authorName: string } | null>;
  setActiveReplyTargetByMoment: React.Dispatch<
    React.SetStateAction<Record<string, { commentId: string; authorName: string } | null>>
  >;
  collapsedCommentThreadIds: string[];
  setCollapsedCommentThreadIds: React.Dispatch<React.SetStateAction<string[]>>;
  momentCommentErrors: Record<string, string>;
  setMomentCommentErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentClockNowMs: number;
  handleAddMomentComment: (
    e: React.FormEvent,
    momentItem: TwitterMomentPost,
    explicitReplyTarget?: { commentId: string; authorName: string } | null
  ) => void;
  handleDeleteMomentComment: (commentId: string) => void;
  onNavigateToHub: () => void;
  // Twitter-specific state & handlers
  twitterLikes: Record<string, string[]>;
  twitterRetweets: Record<string, string[]>;
  twitterBookmarks: Record<string, string[]>;
  followedUids: string[];
  twitterChats: TwitterChatMessage[];
  onToggleLike: (momentId: string) => void;
  onToggleRetweet: (momentId: string) => void;
  onToggleBookmark: (momentId: string) => void;
  onToggleFollow: (targetUid: string) => void;
  onSendTwitterChat: (params: {
    channelId: string;
    recipientUid?: string | null;
    text: string;
    photoDataUrl?: string | null;
  }) => { valid: boolean; error: string };
  onlinePeers: OnlinePeer[];
}

export const TwitterSocialSection: React.FC<TwitterSocialSectionProps> = ({
  currentIdentity,
  moments,
  momentComments,
  commentsByMomentId,
  momentFilter,
  setMomentFilter,
  momentCaption,
  setMomentCaption,
  momentPhotoDataUrl,
  setMomentPhotoDataUrl,
  selectedMomentPlaceholderId,
  setSelectedMomentPlaceholderId,
  momentVisibility,
  setMomentVisibility,
  momentError,
  handlePhotoFileSelect,
  handlePublishMoment,
  handleDeleteMoment,
  handleShareMoment,
  copiedMomentShare,
  setMomentLightbox,
  acceptedPeerUids,
  momentCommentInputs,
  setMomentCommentInputs,
  momentReplyInputs,
  setMomentReplyInputs,
  activeReplyTargetByMoment,
  setActiveReplyTargetByMoment,
  collapsedCommentThreadIds,
  setCollapsedCommentThreadIds,
  momentCommentErrors,
  setMomentCommentErrors,
  commentClockNowMs,
  handleAddMomentComment,
  handleDeleteMomentComment,
  onNavigateToHub,
  twitterLikes,
  twitterRetweets,
  twitterBookmarks,
  followedUids,
  twitterChats,
  onToggleLike,
  onToggleRetweet,
  onToggleBookmark,
  onToggleFollow,
  onSendTwitterChat,
  onlinePeers,
}) => {
  const [activeNavTab, setActiveNavTab] = useState<TwitterNavTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  // Twitter Chat / DM State
  const [activeChatChannelId, setActiveChatChannelId] = useState<string>('global_townsquare');
  const [activeDmPeerUid, setActiveDmPeerUid] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatPhotoDataUrl, setChatPhotoDataUrl] = useState<string>('');
  const [showChatPhotoPicker, setShowChatPhotoPicker] = useState(false);
  const [chatError, setChatError] = useState('');

  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const myHandle = deriveTwitterHandle(currentIdentity.displayName, currentIdentity.uid);
  const trendingTopics = computeTrendingTwitterTopics(moments, momentComments);

  const displayedMoments = filterTwitterFeedMoments({
    moments,
    filter: momentFilter,
    currentUid: currentIdentity.uid,
    followedUids,
    acceptedPeerUids,
    likedByMomentId: twitterLikes,
    bookmarkedByMomentId: twitterBookmarks,
    searchQuery,
    activeHashtag,
  });

  const bookmarkedCount = Object.values(twitterBookmarks).filter((uids) =>
    uids.includes(currentIdentity.uid)
  ).length;

  // Build live notifications for the current user (likes, retweets, and replies on their tweets, or mentions)
  const myMomentIds = new Set(
    moments.filter((m) => m.authorUid === currentIdentity.uid).map((m) => m.id)
  );
  const replyNotifications = momentComments
    .filter(
      (c) =>
        c.authorUid !== currentIdentity.uid &&
        (myMomentIds.has(c.momentId) ||
          c.text.toLowerCase().includes(myHandle.toLowerCase()))
    )
    .slice(-15)
    .reverse();

  // Discoverable accounts to follow (online peers + moment authors + curated community profiles)
  const discoverableAccounts = (() => {
    const map = new Map<
      string,
      { uid: string; displayName: string; bio: string; isOnline: boolean }
    >();
    const seenHandles = new Set<string>([myHandle.toLowerCase()]);

    const tryAdd = (acct: {
      uid: string;
      displayName: string;
      bio: string;
      isOnline: boolean;
    }) => {
      if (!acct.uid || acct.uid === currentIdentity.uid || map.has(acct.uid)) return;
      const handle = deriveTwitterHandle(acct.displayName, acct.uid).toLowerCase();
      if (seenHandles.has(handle)) return;
      seenHandles.add(handle);
      map.set(acct.uid, acct);
    };

    for (const peer of onlinePeers) {
      tryAdd({
        uid: peer.uid,
        displayName: peer.displayName,
        bio: peer.bio || 'Active on Twitter & Study Sanctuary',
        isOnline: true,
      });
    }
    for (const m of moments) {
      tryAdd({
        uid: m.authorUid,
        displayName: m.authorName,
        bio: 'Sharing tweets, study moments & architectures',
        isOnline: false,
      });
    }
    const defaults = [
      {
        uid: 'tw_elenavostok',
        displayName: 'Elena Rostova',
        bio: 'Systems Architect · Tweeting #SystemsDesign & #DeepWork notes',
        isOnline: true,
      },
      {
        uid: 'tw_marcuschen',
        displayName: 'Marcus Chen',
        bio: 'Compiler Engineer · Late-night #BuildInPublic & #StudyWithMe',
        isOnline: true,
      },
      {
        uid: 'tw_aria_lin',
        displayName: 'Aria Lin',
        bio: 'ML Researcher · Pomodoro sprinter & visual study notes',
        isOnline: false,
      },
    ];
    for (const d of defaults) {
      tryAdd(d);
    }
    return Array.from(map.values()).slice(0, 6);
  })();

  const filteredChatMessages = twitterChats.filter((msg) => {
    if (activeDmPeerUid) {
      return (
        msg.channelId === `dm_${[currentIdentity.uid, activeDmPeerUid].sort().join('_')}` ||
        (msg.senderUid === currentIdentity.uid && msg.recipientUid === activeDmPeerUid) ||
        (msg.senderUid === activeDmPeerUid && msg.recipientUid === currentIdentity.uid)
      );
    }
    return msg.channelId === activeChatChannelId;
  });

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setChatPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const channelId = activeDmPeerUid
      ? `dm_${[currentIdentity.uid, activeDmPeerUid].sort().join('_')}`
      : activeChatChannelId;
    const res = onSendTwitterChat({
      channelId,
      recipientUid: activeDmPeerUid,
      text: chatInputText,
      photoDataUrl: chatPhotoDataUrl || null,
    });
    if (!res.valid) {
      setChatError(res.error);
      return;
    }
    setChatError('');
    setChatInputText('');
    setChatPhotoDataUrl('');
    setShowChatPhotoPicker(false);
  };

  const handleFocusComposer = () => {
    setActiveNavTab('home');
    window.setTimeout(() => {
      composerTextareaRef.current?.focus();
      composerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleAppendHashtagToComposer = (tag: string) => {
    const clean = tag.startsWith('#') ? tag : `#${tag}`;
    if (momentCaption.toLowerCase().includes(clean.toLowerCase())) return;
    const sep = momentCaption.trim().length > 0 ? ' ' : '';
    setMomentCaption(`${momentCaption.trimEnd()}${sep}${clean} `);
    composerTextareaRef.current?.focus();
  };

  const renderTweetTextWithHashtags = (caption: string) => {
    const parts = caption.split(/(#[a-zA-Z0-9_]{2,32}|@[a-zA-Z0-9_]{2,24})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 2) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveHashtag((prev) =>
                prev?.toLowerCase() === part.toLowerCase() ? null : part
              );
              setActiveNavTab('home');
            }}
            className="text-sky-400 hover:underline font-medium inline"
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('@') && part.length > 2) {
        return (
          <span key={idx} className="text-sky-400 font-medium">
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <section
      className="space-y-4"
      aria-label="Twitter Social Feed, Image Sharing & Live Chat"
      data-testid="twitter-social-section"
    >
      {/* Top Twitter Section Banner & Audience Filter Bar */}
      <div className="border-b border-zinc-800/80 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-lg shrink-0">
            𝕏
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Twitter / X Social Hub
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full">
                Live Feed &amp; Chat
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Tweet thoughts, upload &amp; zoom photos, reply in nested threads, repost, and chat live with everyone like Twitter.
            </p>
          </div>
        </div>

        {/* Audience & Timeline Filter Pills (Preserves All, Public, Connections, My Uploads + Following & Bookmarks) */}
        <div
          className="flex flex-wrap items-center gap-1 p-1 bg-[#0A0A0C] border border-zinc-800 rounded-full"
          role="tablist"
          aria-label="Twitter Timeline Filters"
        >
          {(
            [
              { id: 'all', label: `For You · All (${moments.length})` },
              {
                id: 'following',
                label: `Following (${
                  moments.filter(
                    (m) =>
                      m.authorUid === currentIdentity.uid ||
                      followedUids.includes(m.authorUid) ||
                      acceptedPeerUids.has(m.authorUid)
                  ).length
                })`,
              },
              {
                id: 'public',
                label: `Public (${moments.filter((m) => m.visibility === 'public').length})`,
              },
              {
                id: 'connections',
                label: `Connections (${
                  moments.filter((m) => m.visibility === 'connections').length
                })`,
              },
              {
                id: 'mine',
                label: `My Uploads (${
                  moments.filter((m) => m.authorUid === currentIdentity.uid).length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={momentFilter === tab.id}
              data-testid={`twitter-filter-tab-${tab.id}`}
              onClick={() => {
                setMomentFilter(tab.id);
                if (activeNavTab === 'bookmarks') setActiveNavTab('home');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
                momentFilter === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Twitter / X Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ====================================================================
            LEFT COLUMN (2 cols): TWITTER NAVIGATION RAIL
            ==================================================================== */}
        <nav
          aria-label="Twitter Section Navigation"
          data-testid="twitter-left-nav"
          className="lg:col-span-2 bg-[#0A0A0C] border border-zinc-800/80 rounded-2xl p-3 space-y-2 lg:sticky lg:top-4"
        >
          <div className="space-y-1">
            {(
              [
                {
                  id: 'home' as const,
                  label: 'Home Feed',
                  icon: Home,
                  badge: moments.length,
                },
                {
                  id: 'explore' as const,
                  label: 'Explore',
                  icon: Hash,
                  badge: trendingTopics.length,
                },
                {
                  id: 'notifications' as const,
                  label: 'Notifications',
                  icon: Bell,
                  badge: replyNotifications.length,
                },
                {
                  id: 'messages' as const,
                  label: 'Messages / Chat',
                  icon: Mail,
                  badge: twitterChats.length,
                },
                {
                  id: 'bookmarks' as const,
                  label: 'Bookmarks',
                  icon: Bookmark,
                  badge: bookmarkedCount,
                },
                {
                  id: 'profile' as const,
                  label: 'Profile',
                  icon: UserIcon,
                  badge: moments.filter((m) => m.authorUid === currentIdentity.uid).length,
                },
              ]
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeNavTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`twitter-nav-${item.id}`}
                  onClick={() => {
                    setActiveNavTab(item.id);
                    if (item.id === 'bookmarks') {
                      setMomentFilter('bookmarks');
                    } else if (item.id === 'profile') {
                      setMomentFilter('mine');
                    } else if (item.id === 'home' && (momentFilter === 'bookmarks' || momentFilter === 'mine')) {
                      setMomentFilter('all');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-100 text-black'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full tabular-nums ${
                        isActive
                          ? 'bg-black/15 text-black'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleFocusComposer}
            data-testid="twitter-sidebar-post-btn"
            className="w-full py-2.5 px-4 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Feather className="w-4 h-4 shrink-0" />
            <span>Post Tweet</span>
          </button>

          {/* Active User Twitter Handle Pill */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xs font-bold text-sky-300 shrink-0">
              {currentIdentity.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {currentIdentity.displayName}
                </span>
                <BadgeCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              </div>
              <div
                className="text-[11px] font-mono text-zinc-500 truncate"
                data-testid="twitter-current-user-handle"
              >
                {myHandle}
              </div>
            </div>
          </div>
        </nav>

        {/* ====================================================================
            CENTER COLUMN (6 cols): TWITTER TIMELINE, COMPOSER & ACTIVE TAB VIEWS
            ==================================================================== */}
        <div
          className="lg:col-span-6 bg-[#0A0A0C] border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/80"
          data-testid="twitter-center-feed"
        >
          {/* Sticky Center Timeline Header */}
          <div className="bg-[#0A0A0C]/95 backdrop-blur-md">
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {activeNavTab === 'home' && 'Home Timeline'}
                  {activeNavTab === 'explore' && 'Explore & Trending Hashtags'}
                  {activeNavTab === 'notifications' && 'Notifications & Mentions'}
                  {activeNavTab === 'messages' && 'Twitter Direct & Community Chat'}
                  {activeNavTab === 'bookmarks' && 'Saved Bookmarks'}
                  {activeNavTab === 'profile' && `${currentIdentity.displayName} (${myHandle})`}
                </h2>
                {activeHashtag && (
                  <span
                    data-testid="twitter-active-hashtag-pill"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  >
                    <span>{activeHashtag}</span>
                    <button
                      type="button"
                      onClick={() => setActiveHashtag(null)}
                      aria-label="Clear hashtag filter"
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            </div>

            {/* Classic Twitter Top Underline Tabs ("For You" / "Following" / "Media" / "Chat") */}
            <div className="grid grid-cols-4 border-t border-zinc-800/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveNavTab('home');
                  setMomentFilter('all');
                }}
                className={`py-3 text-center transition-colors relative hover:bg-zinc-900/60 ${
                  activeNavTab === 'home' && momentFilter === 'all'
                    ? 'text-white'
                    : 'text-zinc-500'
                }`}
              >
                <span>For You</span>
                {activeNavTab === 'home' && momentFilter === 'all' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-sky-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveNavTab('home');
                  setMomentFilter('following');
                }}
                className={`py-3 text-center transition-colors relative hover:bg-zinc-900/60 ${
                  activeNavTab === 'home' && momentFilter === 'following'
                    ? 'text-white'
                    : 'text-zinc-500'
                }`}
              >
                <span>Following</span>
                {activeNavTab === 'home' && momentFilter === 'following' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-sky-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveNavTab('explore')}
                className={`py-3 text-center transition-colors relative hover:bg-zinc-900/60 ${
                  activeNavTab === 'explore' ? 'text-white' : 'text-zinc-500'
                }`}
              >
                <span>Trending</span>
                {activeNavTab === 'explore' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-sky-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveNavTab('messages')}
                className={`py-3 text-center transition-colors relative hover:bg-zinc-900/60 ${
                  activeNavTab === 'messages' ? 'text-white' : 'text-zinc-500'
                }`}
              >
                <span>Live Chat ({twitterChats.length})</span>
                {activeNavTab === 'messages' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-sky-500" />
                )}
              </button>
            </div>
          </div>

          {/* ==================================================================
              PROFILE BANNER (Shown when Profile tab is active)
              ================================================================== */}
          {activeNavTab === 'profile' && (
            <div className="bg-[#08080C]" data-testid="twitter-profile-header">
              <div className="h-28 bg-gradient-to-r from-sky-900/60 via-emerald-900/40 to-zinc-900 border-b border-zinc-800/80 relative">
                <div className="absolute -bottom-8 left-5 w-16 h-16 rounded-full bg-[#0A0A0C] border-4 border-[#0A0A0C] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-lg font-bold text-sky-300">
                    {currentIdentity.displayName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="pt-10 px-5 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-white">
                        {currentIdentity.displayName}
                      </h3>
                      <BadgeCheck className="w-4 h-4 text-sky-400" />
                    </div>
                    <p className="text-xs font-mono text-zinc-400">{myHandle}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-emerald-400">
                    {currentIdentity.streakCount}d Streak · {currentIdentity.participationPoints} pts
                  </span>
                </div>
                <p className="text-xs text-zinc-200">{currentIdentity.bio}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
                  <span>
                    <strong className="text-white">{followedUids.length}</strong> Following
                  </span>
                  <span>
                    <strong className="text-white">{acceptedPeerUids.size + 12}</strong> Followers
                  </span>
                  <span>
                    <strong className="text-white">
                      {moments.filter((m) => m.authorUid === currentIdentity.uid).length}
                    </strong>{' '}
                    Posts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================
              NOTIFICATIONS VIEW (Shown when Notifications tab is active)
              ================================================================== */}
          {activeNavTab === 'notifications' && (
            <div className="p-4 space-y-3" data-testid="twitter-notifications-view">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Real-Time Activity &amp; Mentions
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNavTab('home')}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Back to Timeline
                </button>
              </div>
              {replyNotifications.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#050505] border border-zinc-800/80 text-center space-y-1">
                  <p className="text-sm font-semibold text-white">No new mentions or replies yet</p>
                  <p className="text-xs text-zinc-400">
                    When someone replies to your tweets or mentions {myHandle}, it will appear right here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {replyNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl bg-[#050505] border border-zinc-800/80 flex items-start gap-3"
                    >
                      <MessageCircle className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs text-zinc-300">
                          <strong className="text-white">{notif.authorName}</strong>{' '}
                          <span className="text-zinc-500 font-mono">
                            {deriveTwitterHandle(notif.authorName, notif.authorUid)}
                          </span>{' '}
                          replied to a thread ·{' '}
                          <span className="font-mono text-zinc-500">
                            {formatRelativeCommentTimestamp(notif.createdAtMs, commentClockNowMs)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-100">{notif.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================================
              EXPLORE / TRENDING DIRECTORY (Shown when Explore tab is active)
              ================================================================== */}
          {activeNavTab === 'explore' && (
            <div className="p-4 space-y-3 bg-[#08080A]" data-testid="twitter-explore-view">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Trending on Twitter / X</h3>
                  <p className="text-xs text-zinc-400">
                    Click any hashtag topic to filter the live feed below.
                  </p>
                </div>
                {activeHashtag && (
                  <button
                    type="button"
                    onClick={() => setActiveHashtag(null)}
                    className="text-xs font-semibold text-sky-400 hover:underline"
                  >
                    Show All Topics
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {trendingTopics.map((topic, idx) => {
                  const isSelected =
                    activeHashtag?.toLowerCase() === topic.tag.toLowerCase();
                  return (
                    <button
                      key={topic.tag}
                      type="button"
                      onClick={() =>
                        setActiveHashtag((prev) =>
                          prev?.toLowerCase() === topic.tag.toLowerCase() ? null : topic.tag
                        )
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500/60 text-white'
                          : 'bg-[#050505] border-zinc-800/80 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>
                          {idx + 1} · {topic.category}
                        </span>
                        {topic.isLive && (
                          <span className="text-emerald-400 font-semibold">LIVE</span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-sky-400 mt-0.5">{topic.tag}</div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5 tabular-nums">
                        {topic.tweetCount} posts
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================================
              TWITTER "WHAT IS HAPPENING?!" COMPOSER (Always accessible on feed)
              ================================================================== */}
          <form
            onSubmit={handlePublishMoment}
            data-testid="publish-moment-form"
            className="p-4 sm:p-5 bg-[#0A0A0C] space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sm font-bold text-sky-300 shrink-0 mt-0.5">
                {currentIdentity.displayName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {/* Audience Selector Pill & Handle */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="moment-visibility" className="sr-only">
                      Audience Privacy
                    </label>
                    <select
                      id="moment-visibility"
                      value={momentVisibility}
                      onChange={(e) =>
                        setMomentVisibility(e.target.value as 'public' | 'connections')
                      }
                      className="px-3 py-1 text-xs font-semibold bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-300 focus:outline-none focus:border-sky-400"
                    >
                      <option value="public" className="bg-[#050505] text-white">
                        Everyone · Public Tweet
                      </option>
                      <option value="connections" className="bg-[#050505] text-white">
                        Connections Circle Only
                      </option>
                    </select>
                    <span className="text-xs font-mono text-zinc-500">{myHandle}</span>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                    {momentCaption.length} / 500
                  </span>
                </div>

                {/* Tweet Textarea */}
                <div>
                  <label htmlFor="moment-caption" className="sr-only">
                    Caption / Story Behind This Moment
                  </label>
                  <textarea
                    id="moment-caption"
                    ref={composerTextareaRef}
                    rows={3}
                    maxLength={500}
                    value={momentCaption}
                    onChange={(e) => setMomentCaption(e.target.value)}
                    placeholder="What is happening?! Tweet an update, add #hashtags, upload a photo, or pick a study aesthetic..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/70 resize-none"
                  />
                </div>

                {/* Quick 1-Click Hashtag Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-zinc-500 mr-1">Add tag:</span>
                  {['#DeepWork', '#BuildInPublic', '#StudyWithMe', '#SystemsDesign'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAppendHashtagToComposer(tag)}
                        className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#050505] hover:bg-sky-500/15 text-sky-400 border border-zinc-800 hover:border-sky-500/40 transition-colors"
                      >
                        +{tag}
                      </button>
                    )
                  )}
                </div>

                {/* Device Photo Upload Input */}
                <div className="p-3 rounded-xl bg-[#050505] border border-zinc-800/80 space-y-2">
                  <label
                    htmlFor="moment-photo-file"
                    className="flex items-center gap-2 text-xs font-semibold text-sky-400 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <span>Option 1 · Attach Photo from Device (PNG, JPG, WebP)</span>
                  </label>
                  <input
                    id="moment-photo-file"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileSelect}
                    className="w-full text-xs text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-500/15 file:text-sky-300 hover:file:bg-sky-500/25"
                  />
                </div>

                {/* Curated Study-Related Aesthetic Placeholder Selector (Preserves all testids) */}
                <div
                  data-testid="moment-placeholder-gallery"
                  className="p-3 rounded-xl bg-[#050505] border border-zinc-800/80 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-semibold text-zinc-200">
                        Option 2 · Curated Study Aesthetic Media Cards
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Pick a study scene to attach to your tweet if you prefer not to upload a photo
                      </span>
                    </div>
                    <span
                      data-testid="moment-image-source-indicator"
                      className="text-[11px] font-mono text-emerald-400 whitespace-nowrap"
                    >
                      {momentPhotoDataUrl
                        ? 'Source: Uploaded Photo'
                        : selectedMomentPlaceholderId
                        ? `Selected: ${
                            getStudyMomentPlaceholderById(selectedMomentPlaceholderId)
                              ?.title || 'Study Scene'
                          }`
                        : `${CURATED_STUDY_MOMENT_IMAGES.length} Study Scenes`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CURATED_STUDY_MOMENT_IMAGES.map((preset) => {
                      const isSelected =
                        !momentPhotoDataUrl &&
                        selectedMomentPlaceholderId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setMomentPhotoDataUrl('');
                            setSelectedMomentPlaceholderId((prev) =>
                              selectStudyMomentPlaceholder(prev, preset.id)
                            );
                          }}
                          aria-pressed={isSelected}
                          aria-label={`Select ${preset.title} (${preset.category}) placeholder image`}
                          data-testid={`moment-placeholder-option-${preset.id}`}
                          data-placeholder-id={preset.id}
                          className={`group text-left rounded-lg overflow-hidden border transition-all flex flex-col ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400/50'
                              : 'border-zinc-800 bg-[#0A0A0C] hover:border-zinc-600'
                          }`}
                        >
                          <div className="relative h-14 w-full overflow-hidden bg-[#050505]">
                            <img
                              src={preset.photoDataUrl}
                              alt={preset.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <span
                                data-testid={`moment-placeholder-selected-badge-${preset.id}`}
                                className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400 text-black"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                          <div className="p-1.5 space-y-0.5">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 truncate">
                              {preset.category}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-100 truncate">
                              {preset.title}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {(momentPhotoDataUrl || selectedMomentPlaceholderId) &&
                    (() => {
                      const activePreset = !momentPhotoDataUrl
                        ? getStudyMomentPlaceholderById(selectedMomentPlaceholderId)
                        : null;
                      const previewSrc =
                        momentPhotoDataUrl || activePreset?.photoDataUrl || '';
                      return (
                        <div
                          data-testid="moment-selected-image-preview"
                          className="p-2.5 rounded-lg bg-[#0A0A0C] border border-zinc-800 space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={previewSrc}
                              alt={
                                activePreset
                                  ? `Selected study aesthetic: ${activePreset.title}`
                                  : 'Uploaded moment preview'
                              }
                              referrerPolicy="no-referrer"
                              data-testid="moment-selected-preview-img"
                              className="w-16 h-12 rounded object-cover border border-zinc-800 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate">
                                {activePreset
                                  ? activePreset.title
                                  : 'Custom Device Photo Ready'}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {activePreset
                                  ? activePreset.description
                                  : 'Your uploaded image will be attached to this tweet.'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900">
                            {activePreset ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setMomentCaption(activePreset.suggestedCaption)
                                }
                                data-testid="moment-use-suggested-caption"
                                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                + Use Suggested Study Caption
                              </button>
                            ) : (
                              <span className="text-[11px] font-mono text-zinc-500">
                                Device Upload Active
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setMomentPhotoDataUrl('');
                                setSelectedMomentPlaceholderId(null);
                              }}
                              data-testid="moment-clear-image-selection"
                              className="text-[11px] font-mono text-zinc-400 hover:text-rose-400 transition-colors"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                </div>

                {momentError && <p className="text-xs text-rose-400">{momentError}</p>}

                {/* Bottom Composer Action Row */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    {momentVisibility === 'public' ? (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Everyone can reply &amp; repost</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        <span>Connections circle can reply</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    data-testid="publish-moment-submit-btn"
                    className="px-5 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    Post Tweet
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* ==================================================================
              LIVE TWITTER STREAM (Tweets, Media Lightbox, Likes, Retweets, Nested Replies)
              ================================================================== */}
          <div className="divide-y divide-zinc-800/80">
            {displayedMoments.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-bold text-white">
                  {activeHashtag
                    ? `No tweets matching ${activeHashtag} yet`
                    : searchQuery
                    ? `No tweets matching "${searchQuery}"`
                    : momentFilter === 'bookmarks'
                    ? 'No Bookmarked Tweets Yet'
                    : 'No Tweets in This View Yet'}
                </p>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {momentFilter === 'bookmarks'
                    ? 'Click the bookmark icon on any tweet or photo to save it here for quick reference.'
                    : 'Compose a tweet above, upload a photo, or pick a curated study scene to start the conversation.'}
                </p>
                {(activeHashtag || searchQuery || momentFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHashtag(null);
                      setSearchQuery('');
                      setMomentFilter('all');
                    }}
                    className="px-4 py-1.5 text-xs font-semibold bg-sky-500 text-white rounded-full"
                  >
                    Reset Feed Filters
                  </button>
                )}
              </div>
            ) : (
              displayedMoments.map((item) => {
                const itemComments = commentsByMomentId[item.id] || [];
                const commentGate = canUserCommentOnMoment({
                  momentAuthorUid: item.authorUid,
                  momentVisibility: item.visibility,
                  currentUid: currentIdentity.uid,
                  acceptedPeerUids,
                });
                const itemCommentError = momentCommentErrors[item.id] || '';
                const authorHandle = deriveTwitterHandle(item.authorName, item.authorUid);

                const likeUids = twitterLikes[item.id] || [];
                const isLiked = likeUids.includes(currentIdentity.uid);
                const retweetUids = twitterRetweets[item.id] || [];
                const isRetweeted = retweetUids.includes(currentIdentity.uid);
                const bookmarkUids = twitterBookmarks[item.id] || [];
                const isBookmarked = bookmarkUids.includes(currentIdentity.uid);
                const isFollowingAuthor = followedUids.includes(item.authorUid);

                return (
                  <article
                    key={item.id}
                    data-testid={`moment-card-${item.id}`}
                    className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#0D0D11] transition-colors space-y-3"
                  >
                    {/* Retweeted Indicator Banner */}
                    {isRetweeted && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 pl-8">
                        <Repeat2 className="w-3.5 h-3.5" />
                        <span>You reposted</span>
                      </div>
                    )}

                    {/* Tweet Author Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-sky-400 shrink-0">
                          {item.authorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-white truncate">
                              {item.authorName}
                            </span>
                            <BadgeCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="text-xs font-mono text-zinc-500 truncate">
                              {authorHandle}
                            </span>
                            <span aria-hidden="true" className="text-zinc-600">
                              ·
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                              {item.createdAtMs
                                ? formatRelativeCommentTimestamp(
                                    item.createdAtMs,
                                    commentClockNowMs
                                  )
                                : 'just now'}
                            </span>
                            <span aria-hidden="true" className="text-zinc-600">
                              ·
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400 capitalize">
                              {item.visibility}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.authorUid !== currentIdentity.uid &&
                          authorHandle.toLowerCase() !== myHandle.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => onToggleFollow(item.authorUid)}
                            data-testid={`twitter-follow-btn-${item.authorUid}`}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                              isFollowingAuthor
                                ? 'bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-rose-500/50 hover:text-rose-300'
                                : 'bg-white text-black hover:bg-zinc-200'
                            }`}
                          >
                            {isFollowingAuthor ? 'Following' : 'Follow'}
                          </button>
                        )}

                        {item.authorUid === currentIdentity.uid && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMoment(item.id)}
                            data-testid={`delete-moment-btn-${item.id}`}
                            title="Delete Tweet"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-[#050505] border border-zinc-800 rounded-full whitespace-nowrap shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tweet Text Content */}
                    <p
                      className="text-sm text-zinc-100 leading-relaxed break-words pl-0 sm:pl-13"
                      data-testid={`moment-caption-${item.id}`}
                    >
                      {renderTweetTextWithHashtags(item.caption)}
                    </p>

                    {/* Attached Media Image with Full-Screen Lightbox Zoom */}
                    <div className="pl-0 sm:pl-13">
                      <button
                        type="button"
                        onClick={() =>
                          setMomentLightbox(
                            openMomentLightbox({
                              momentId: item.id,
                              photoDataUrl: item.photoDataUrl,
                              caption: item.caption,
                              authorName: item.authorName,
                              visibility: item.visibility,
                            })
                          )
                        }
                        data-testid={`open-moment-lightbox-${item.id}`}
                        aria-label={`View full-screen lightbox zoom for moment by ${item.authorName}`}
                        className="group relative block w-full rounded-2xl border border-zinc-800/90 bg-[#050505] overflow-hidden cursor-zoom-in focus:outline-none"
                      >
                        <img
                          src={item.photoDataUrl}
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-full max-h-96 object-contain bg-[#050505] transition-transform duration-200 group-hover:scale-[1.01]"
                        />
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050505]/90 border border-zinc-700/80 text-[11px] font-mono text-zinc-200 opacity-90 group-hover:opacity-100 group-hover:border-sky-500/60 group-hover:text-sky-300 transition-all">
                          <Maximize2 className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>Click to Zoom</span>
                        </span>
                      </button>
                    </div>

                    {/* Twitter Interactive Engagement Bar (Reply, Retweet, Like, Bookmark, Zoom, Share) */}
                    <div className="pl-0 sm:pl-13 pt-1 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      {/* Reply Count Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`tweet-reply-input-${item.id}`);
                          el?.focus();
                        }}
                        data-testid={`reply-count-btn-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{itemComments.length}</span>
                      </button>

                      {/* Retweet / Repost Button */}
                      <button
                        type="button"
                        onClick={() => onToggleRetweet(item.id)}
                        aria-pressed={isRetweeted}
                        data-testid={`retweet-moment-btn-${item.id}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                          isRetweeted
                            ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                            : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span>{retweetUids.length}</span>
                      </button>

                      {/* Like / Heart Button */}
                      <button
                        type="button"
                        onClick={() => onToggleLike(item.id)}
                        aria-pressed={isLiked}
                        data-testid={`like-moment-btn-${item.id}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                          isLiked
                            ? 'text-rose-400 bg-rose-500/10 font-bold'
                            : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                        <span data-testid={`like-count-${item.id}`}>{likeUids.length}</span>
                      </button>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(item.id)}
                        aria-pressed={isBookmarked}
                        data-testid={`bookmark-moment-btn-${item.id}`}
                        title="Bookmark Tweet"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                          isBookmarked
                            ? 'text-sky-400 bg-sky-500/10 font-bold'
                            : 'text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isBookmarked ? 'fill-sky-400' : ''}`}
                        />
                        <span>{bookmarkUids.length}</span>
                      </button>

                      {/* Explicit Lightbox Zoom Button (Preserves testid) */}
                      <button
                        type="button"
                        onClick={() =>
                          setMomentLightbox(
                            openMomentLightbox({
                              momentId: item.id,
                              photoDataUrl: item.photoDataUrl,
                              caption: item.caption,
                              authorName: item.authorName,
                              visibility: item.visibility,
                            })
                          )
                        }
                        data-testid={`zoom-moment-btn-${item.id}`}
                        aria-label={`Zoom image for moment by ${item.authorName}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#050505] border border-zinc-800 text-zinc-300 hover:border-sky-500/50 hover:text-sky-300 transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-sans">Zoom</span>
                      </button>

                      {/* Share / Copy Link Button (Preserves testid) */}
                      <button
                        type="button"
                        onClick={() => handleShareMoment(item)}
                        data-testid={`share-moment-btn-${item.id}`}
                        aria-label={`Share moment by ${item.authorName}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                          copiedMomentShare?.momentId === item.id
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-sans font-semibold'
                            : 'bg-[#050505] border-zinc-800 text-zinc-300 hover:border-sky-500/50 hover:text-sky-300 font-sans'
                        }`}
                      >
                        {copiedMomentShare?.momentId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-sky-400" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>

                    {copiedMomentShare?.momentId === item.id && (
                      <div
                        data-testid={`moment-share-feedback-${item.id}`}
                        role="status"
                        className="ml-0 sm:ml-13 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 flex flex-col gap-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-300">
                            Copied tweet link &amp; caption to clipboard
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                            Ready to paste
                          </span>
                        </div>
                        <p
                          className="font-mono text-[11px] text-zinc-300 truncate"
                          data-testid={`moment-share-copied-url-${item.id}`}
                        >
                          {copiedMomentShare.url}
                        </p>
                      </div>
                    )}

                    {/* ============================================================
                        TWITTER THREAD REPLIES & NESTED COMMENTS SECTION
                        (Preserves all existing nested comment & animation testids)
                        ============================================================ */}
                    <div
                      data-testid="moment-comments-section"
                      data-moment-id={item.id}
                      className="ml-0 sm:ml-13 rounded-xl border border-zinc-800/80 bg-[#050505]/80 p-3.5 space-y-3"
                    >
                      {(() => {
                        const threadGroups = buildMomentCommentThreadGroups(
                          itemComments,
                          collapsedCommentThreadIds
                        );
                        const threadsWithReplies = threadGroups.filter(
                          (g) => g.totalRepliesCount > 0
                        );
                        const allThreadsCollapsed =
                          threadsWithReplies.length > 0 &&
                          threadsWithReplies.every((g) => g.isCollapsed);

                        const renderThreadedCommentNode = (
                          threadedItem: ThreadedMomentCommentItem,
                          replyAnim?: NestedThreadAnimationState,
                          threadGroup?: {
                            totalRepliesCount: number;
                            isCollapsed: boolean;
                          }
                        ) => {
                          const {
                            comment: cmt,
                            depth,
                            isReply,
                            parentCommentId,
                            replyToAuthorName,
                          } = threadedItem;
                          const isCommentAuthor = cmt.authorUid === currentIdentity.uid;
                          const isMomentOwner = item.authorUid === currentIdentity.uid;
                          const relationLabel =
                            cmt.authorUid === item.authorUid
                              ? 'Author'
                              : acceptedPeerUids.has(cmt.authorUid)
                              ? 'Connected'
                              : isCommentAuthor
                              ? 'You'
                              : 'Member';
                          const activeReplyTarget =
                            activeReplyTargetByMoment[item.id] || null;
                          const isReplyingToThis =
                            activeReplyTarget?.commentId === cmt.id;
                          const indentClass =
                            depth === 0
                              ? ''
                              : depth === 1
                              ? 'ml-6 sm:ml-8'
                              : depth === 2
                              ? 'ml-10 sm:ml-14'
                              : 'ml-12 sm:ml-16';
                          const rootThreadAnim =
                            !isReply && threadGroup && threadGroup.totalRepliesCount > 0
                              ? getNestedThreadAnimationState(threadGroup.isCollapsed, 0)
                              : null;

                          return (
                            <div
                              key={cmt.id}
                              data-testid={
                                isReply
                                  ? 'moment-thread-animated-reply'
                                  : 'moment-thread-root-node'
                              }
                              data-thread-animation-state={
                                replyAnim ? replyAnim.state : undefined
                              }
                              style={
                                replyAnim && replyAnim.staggerDelayMs > 0
                                  ? { animationDelay: `${replyAnim.staggerDelayMs}ms` }
                                  : undefined
                              }
                              className={`space-y-2 ${indentClass} ${
                                replyAnim ? replyAnim.itemAnimationClassName : ''
                              }`}
                            >
                              <div
                                data-testid={
                                  isReply
                                    ? 'moment-comment-reply-item'
                                    : 'moment-comment-item'
                                }
                                data-comment-id={cmt.id}
                                data-parent-comment-id={parentCommentId || ''}
                                data-comment-depth={depth}
                                data-is-reply={isReply ? 'true' : 'false'}
                                className={`p-3 rounded-xl border space-y-1.5 ${
                                  isReply
                                    ? 'bg-[#08080A] border-zinc-800/70'
                                    : 'bg-[#0A0A0C] border-zinc-800/80'
                                }`}
                              >
                                {isReply && replyToAuthorName && (
                                  <div
                                    data-testid="moment-comment-reply-context"
                                    className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400"
                                  >
                                    <CornerDownRight
                                      aria-hidden="true"
                                      className="w-3 h-3 text-sky-400 shrink-0"
                                    />
                                    <span>
                                      Replying to{' '}
                                      <strong className="text-sky-400 font-semibold">
                                        @{replyToAuthorName}
                                      </strong>
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    <span className="font-semibold text-white truncate">
                                      {cmt.authorName}
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500">
                                      {deriveTwitterHandle(cmt.authorName, cmt.authorUid)}
                                    </span>
                                    <span aria-hidden="true" className="text-zinc-600">
                                      ·
                                    </span>
                                    <span className="text-[11px] font-mono text-sky-400">
                                      {relationLabel}
                                    </span>
                                    <span aria-hidden="true" className="text-zinc-600">
                                      ·
                                    </span>
                                    <time
                                      dateTime={new Date(cmt.createdAtMs).toISOString()}
                                      data-testid="moment-comment-timestamp"
                                      data-comment-id={cmt.id}
                                      className="text-[11px] font-mono text-zinc-400 tabular-nums"
                                    >
                                      {formatRelativeCommentTimestamp(
                                        cmt.createdAtMs,
                                        commentClockNowMs
                                      )}
                                    </time>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    {rootThreadAnim && threadGroup && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCollapsedCommentThreadIds((prev) =>
                                            toggleCollapsedCommentThread(prev, cmt.id)
                                          )
                                        }
                                        aria-expanded={rootThreadAnim.ariaExpanded}
                                        aria-controls={`moment-comment-thread-replies-${cmt.id}`}
                                        data-testid={`toggle-comment-thread-${cmt.id}`}
                                        className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
                                      >
                                        {threadGroup.isCollapsed ? (
                                          <ChevronDown
                                            aria-hidden="true"
                                            className="w-3 h-3 shrink-0"
                                          />
                                        ) : (
                                          <ChevronUp
                                            aria-hidden="true"
                                            className="w-3 h-3 shrink-0"
                                          />
                                        )}
                                        <span>
                                          {rootThreadAnim.formatToggleLabel(
                                            threadGroup.totalRepliesCount
                                          )}
                                        </span>
                                      </button>
                                    )}

                                    {commentGate.allowed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMomentCommentErrors((prev) => ({
                                            ...prev,
                                            [item.id]: '',
                                          }));
                                          setActiveReplyTargetByMoment((prev) => ({
                                            ...prev,
                                            [item.id]:
                                              prev[item.id]?.commentId === cmt.id
                                                ? null
                                                : {
                                                    commentId: cmt.id,
                                                    authorName: cmt.authorName,
                                                  },
                                          }));
                                        }}
                                        aria-label={
                                          isReplyingToThis
                                            ? `Cancel reply to ${cmt.authorName}`
                                            : `Reply to ${cmt.authorName}`
                                        }
                                        data-testid={`reply-moment-comment-${cmt.id}`}
                                        className={`text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 ${
                                          isReplyingToThis
                                            ? 'text-sky-400 font-semibold'
                                            : 'text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        {isReplyingToThis ? 'Cancel' : 'Reply'}
                                      </button>
                                    )}

                                    {(isCommentAuthor || isMomentOwner) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMomentComment(cmt.id)}
                                        aria-label={`Delete comment by ${cmt.authorName}`}
                                        data-testid={`delete-moment-comment-${cmt.id}`}
                                        className="text-[11px] text-zinc-500 hover:text-rose-400 font-mono transition-colors shrink-0"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-200 leading-relaxed break-words">
                                  {cmt.text}
                                </p>
                              </div>

                              {commentGate.allowed && isReplyingToThis && (
                                <form
                                  onSubmit={(e) =>
                                    handleAddMomentComment(e, item, {
                                      commentId: cmt.id,
                                      authorName: cmt.authorName,
                                    })
                                  }
                                  data-testid={`moment-reply-form-${cmt.id}`}
                                  className="ml-6 sm:ml-8 p-2.5 rounded-xl bg-[#08080A] border border-zinc-800/80 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                                    <span className="inline-flex items-center gap-1.5">
                                      <CornerDownRight
                                        aria-hidden="true"
                                        className="w-3 h-3 text-sky-400 shrink-0"
                                      />
                                      <span>
                                        Replying to{' '}
                                        <strong className="text-white">
                                          @{cmt.authorName}
                                        </strong>
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveReplyTargetByMoment((prev) => ({
                                          ...prev,
                                          [item.id]: null,
                                        }))
                                      }
                                      data-testid={`cancel-reply-comment-${cmt.id}`}
                                      className="text-zinc-500 hover:text-zinc-300 whitespace-nowrap"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="text"
                                      maxLength={400}
                                      value={momentReplyInputs[cmt.id] || ''}
                                      onChange={(e) =>
                                        setMomentReplyInputs((prev) => ({
                                          ...prev,
                                          [cmt.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={`Post your reply to @${cmt.authorName}...`}
                                      aria-label={`Write a reply to ${cmt.authorName}`}
                                      data-testid={`moment-reply-input-${cmt.id}`}
                                      className="flex-1 px-3 py-1.5 text-xs bg-[#050505] border border-zinc-800 rounded-full text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                                    />
                                    <button
                                      type="submit"
                                      data-testid={`moment-reply-submit-${cmt.id}`}
                                      className="px-3.5 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white rounded-full whitespace-nowrap shrink-0"
                                    >
                                      Post Reply
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          );
                        };

                        return (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-zinc-200">
                                Thread Replies ({itemComments.length})
                              </span>
                              <div className="flex items-center gap-3">
                                {threadsWithReplies.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const replyRootIds = threadsWithReplies.map(
                                        (g) => g.rootItem.comment.id
                                      );
                                      setCollapsedCommentThreadIds((prev) => {
                                        if (allThreadsCollapsed) {
                                          return prev.filter(
                                            (id) => !replyRootIds.includes(id)
                                          );
                                        }
                                        return Array.from(
                                          new Set([...prev, ...replyRootIds])
                                        );
                                      });
                                    }}
                                    data-testid={`toggle-all-comment-threads-${item.id}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap"
                                  >
                                    {allThreadsCollapsed ? (
                                      <ChevronDown
                                        aria-hidden="true"
                                        className="w-3 h-3 shrink-0"
                                      />
                                    ) : (
                                      <ChevronUp
                                        aria-hidden="true"
                                        className="w-3 h-3 shrink-0"
                                      />
                                    )}
                                    <span>
                                      {allThreadsCollapsed
                                        ? 'Expand all threads'
                                        : 'Collapse all threads'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {threadGroups.length > 0 && (
                              <div
                                className="space-y-2.5"
                                data-testid={`moment-comments-list-${item.id}`}
                              >
                                {threadGroups.map((group) => {
                                  const rootCmt = group.rootItem.comment;
                                  const threadAnim = getNestedThreadAnimationState(
                                    group.isCollapsed,
                                    0
                                  );
                                  return (
                                    <div
                                      key={rootCmt.id}
                                      data-testid={`moment-comment-thread-${rootCmt.id}`}
                                      className="space-y-2"
                                    >
                                      {renderThreadedCommentNode(
                                        group.rootItem,
                                        undefined,
                                        group
                                      )}

                                      {group.totalRepliesCount > 0 && (
                                        <div
                                          id={`moment-comment-thread-replies-${rootCmt.id}`}
                                          data-testid={`moment-comment-thread-replies-${rootCmt.id}`}
                                          data-thread-state={threadAnim.state}
                                          aria-hidden={group.isCollapsed}
                                          className={threadAnim.wrapperClassName}
                                        >
                                          <div className="overflow-hidden space-y-2 pt-0.5">
                                            {group.nestedReplies.map(
                                              (replyItem, replyIdx) => {
                                                const replyAnim =
                                                  getNestedThreadAnimationState(
                                                    group.isCollapsed,
                                                    replyIdx
                                                  );
                                                return renderThreadedCommentNode(
                                                  replyItem,
                                                  replyAnim
                                                );
                                              }
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {commentGate.allowed ? (
                        <form
                          onSubmit={(e) => handleAddMomentComment(e, item)}
                          className="space-y-2 pt-1"
                          data-testid={`moment-comment-form-${item.id}`}
                        >
                          {itemCommentError && (
                            <p
                              className="text-xs text-rose-400"
                              data-testid={`moment-comment-error-${item.id}`}
                            >
                              {itemCommentError}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              id={`tweet-reply-input-${item.id}`}
                              type="text"
                              maxLength={400}
                              value={momentCommentInputs[item.id] || ''}
                              onChange={(e) =>
                                setMomentCommentInputs((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder={`Post your reply to ${authorHandle}...`}
                              aria-label={`Comment on ${item.authorName}'s photo moment`}
                              data-testid="moment-comment-input"
                              className="flex-1 px-3.5 py-2 text-xs bg-[#0A0A0C] border border-zinc-800 rounded-full text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                            />
                            <button
                              type="submit"
                              data-testid="moment-comment-submit"
                              className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white rounded-full whitespace-nowrap shrink-0"
                            >
                              Reply
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div
                          className="p-3 rounded-xl bg-[#0A0A0C] border border-zinc-800/80 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2"
                          data-testid={`moment-comment-locked-${item.id}`}
                        >
                          <span>{commentGate.reason}</span>
                          <button
                            type="button"
                            onClick={onNavigateToHub}
                            className="px-3 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-full whitespace-nowrap shrink-0"
                          >
                            Connect in Directory
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN (4 cols): SEARCH, LIVE TWITTER CHAT/DMS, TRENDS & WHO TO FOLLOW
            ==================================================================== */}
        <aside
          aria-label="Twitter Discovery, Trends & Live Chat"
          data-testid="twitter-right-sidebar"
          className="lg:col-span-4 space-y-4 lg:sticky lg:top-4"
        >
          {/* 1. Search Twitter Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Twitter posts, #hashtags, or @handles..."
              aria-label="Search Twitter posts, hashtags, or handles"
              data-testid="twitter-search-input"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#0A0A0C] border border-zinc-800/90 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* 2. Embedded Live Twitter Chat & DMs Panel (Everyone can chat & share images!) */}
          <div
            data-testid="twitter-chat-panel"
            className="rounded-2xl border border-zinc-800/90 bg-[#0A0A0C] overflow-hidden flex flex-col"
          >
            <div className="p-3.5 border-b border-zinc-800/80 bg-[#08080C] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white">Twitter Chat &amp; DMs</h3>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Open to All
                </span>
              </div>

              {/* Channel & DM Switcher Pills */}
              <div className="flex flex-wrap gap-1">
                {TWITTER_COMMUNITY_CHANNELS.map((ch) => {
                  const isSelected = !activeDmPeerUid && activeChatChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      data-testid={`twitter-chat-channel-${ch.id}`}
                      onClick={() => {
                        setActiveDmPeerUid(null);
                        setActiveChatChannelId(ch.id);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-[#050505] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {ch.handle}
                    </button>
                  );
                })}
              </div>

              {/* Direct Message Peer Selector */}
              {discoverableAccounts.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">DMs:</span>
                  {discoverableAccounts.slice(0, 3).map((acct) => {
                    const isDmActive = activeDmPeerUid === acct.uid;
                    return (
                      <button
                        key={acct.uid}
                        type="button"
                        data-testid={`twitter-dm-peer-${acct.uid}`}
                        onClick={() =>
                          setActiveDmPeerUid((prev) => (prev === acct.uid ? null : acct.uid))
                        }
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors ${
                          isDmActive
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-[#050505] text-zinc-300 border border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        {deriveTwitterHandle(acct.displayName, acct.uid)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Chat Stream */}
            <div
              data-testid="twitter-chat-messages-list"
              className="p-3.5 space-y-2.5 max-h-72 overflow-y-auto bg-[#050505]/60"
            >
              {filteredChatMessages.length === 0 ? (
                <div className="py-6 text-center space-y-1 text-xs text-zinc-500">
                  <p className="text-zinc-300 font-semibold">
                    {activeDmPeerUid
                      ? 'Start a Direct Message conversation'
                      : 'Welcome to Twitter Live Chat'}
                  </p>
                  <p>Send a message or share an image below.</p>
                </div>
              ) : (
                filteredChatMessages.map((msg) => {
                  const isMine = msg.senderUid === currentIdentity.uid;
                  return (
                    <div
                      key={msg.id}
                      data-testid={`twitter-chat-msg-${msg.id}`}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-1">
                        <span className="font-semibold text-zinc-300">{msg.senderName}</span>
                        <span>{msg.senderHandle}</span>
                        <span>·</span>
                        <span>
                          {formatRelativeCommentTimestamp(msg.createdAtMs, commentClockNowMs)}
                        </span>
                      </div>
                      <div
                        className={`px-3.5 py-2 rounded-2xl max-w-[90%] text-xs space-y-2 ${
                          isMine
                            ? 'bg-sky-500 text-white rounded-br-xs'
                            : 'bg-[#0A0A0C] border border-zinc-800 text-zinc-100 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.text}</p>
                        {msg.photoDataUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setMomentLightbox(
                                openMomentLightbox({
                                  momentId: msg.id,
                                  photoDataUrl: msg.photoDataUrl!,
                                  caption: msg.text,
                                  authorName: msg.senderName,
                                  visibility: 'public',
                                })
                              )
                            }
                            className="block rounded-lg overflow-hidden border border-white/20"
                          >
                            <img
                              src={msg.photoDataUrl}
                              alt={msg.text}
                              referrerPolicy="no-referrer"
                              className="max-h-36 w-full object-cover"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Photo Attachment Drawer */}
            {showChatPhotoPicker && (
              <div className="p-2.5 bg-[#08080C] border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Attach photo or study card to chat</span>
                  <button
                    type="button"
                    onClick={() => setShowChatPhotoPicker(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChatFileUpload}
                  aria-label="Upload image to Twitter chat"
                  className="w-full text-[11px] text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-sky-500/20 file:text-sky-300"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {CURATED_STUDY_MOMENT_IMAGES.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setChatPhotoDataUrl(preset.photoDataUrl)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border shrink-0 ${
                        chatPhotoDataUrl === preset.photoDataUrl
                          ? 'border-sky-400 bg-sky-500/20 text-white'
                          : 'border-zinc-800 bg-[#050505] text-zinc-400'
                      }`}
                    >
                      {preset.category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Composer */}
            <form
              onSubmit={handleChatSubmit}
              data-testid="twitter-chat-form"
              className="p-2.5 border-t border-zinc-800/80 bg-[#0A0A0C] space-y-1.5"
            >
              {chatError && <p className="text-[11px] text-rose-400 px-2">{chatError}</p>}
              {chatPhotoDataUrl && (
                <div className="flex items-center justify-between px-2 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-300 font-mono">
                  <span>Image attached to chat</span>
                  <button
                    type="button"
                    onClick={() => setChatPhotoDataUrl('')}
                    className="text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowChatPhotoPicker((prev) => !prev)}
                  data-testid="twitter-chat-attach-photo-btn"
                  title="Attach photo to chat"
                  className="p-2 rounded-full text-sky-400 hover:bg-sky-500/10 transition-colors shrink-0"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  ref={chatInputRef}
                  type="text"
                  maxLength={500}
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder={
                    activeDmPeerUid
                      ? 'Send a direct message...'
                      : `Message ${
                          TWITTER_COMMUNITY_CHANNELS.find((c) => c.id === activeChatChannelId)
                            ?.handle || '#town-square'
                        }...`
                  }
                  aria-label="Twitter chat message input"
                  data-testid="twitter-chat-input"
                  className="flex-1 px-3 py-1.5 text-xs bg-[#050505] border border-zinc-800 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  data-testid="twitter-chat-send-btn"
                  aria-label="Send Twitter chat message"
                  className="p-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* 3. "What’s happening" Trending Topics Box */}
          <div
            data-testid="twitter-trending-panel"
            className="rounded-2xl border border-zinc-800/90 bg-[#0A0A0C] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">What’s happening</h3>
              {activeHashtag && (
                <button
                  type="button"
                  onClick={() => setActiveHashtag(null)}
                  className="text-[11px] font-mono text-sky-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2">
              {trendingTopics.map((topic) => {
                const isSelected =
                  activeHashtag?.toLowerCase() === topic.tag.toLowerCase();
                return (
                  <button
                    key={topic.tag}
                    type="button"
                    data-testid={`twitter-trend-item-${topic.tag.replace('#', '')}`}
                    onClick={() =>
                      setActiveHashtag((prev) =>
                        prev?.toLowerCase() === topic.tag.toLowerCase() ? null : topic.tag
                      )
                    }
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50'
                        : 'bg-[#050505] border-zinc-800/70 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {topic.category}
                      </div>
                      <div className="text-xs font-bold text-sky-400">{topic.tag}</div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                      {topic.tweetCount} posts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. "Who to follow" Panel */}
          <div
            data-testid="twitter-who-to-follow"
            className="rounded-2xl border border-zinc-800/90 bg-[#0A0A0C] p-4 space-y-3"
          >
            <h3 className="text-sm font-bold text-white">Who to follow</h3>
            <div className="space-y-2.5">
              {discoverableAccounts.map((acct) => {
                const isFollowing = followedUids.includes(acct.uid);
                const handle = deriveTwitterHandle(acct.displayName, acct.uid);
                return (
                  <div
                    key={acct.uid}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#050505] border border-zinc-800/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {acct.displayName}
                        </span>
                        <BadgeCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        {acct.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate">
                        {handle}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{acct.bio}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFollow(acct.uid)}
                      data-testid={`twitter-sidebar-follow-btn-${acct.uid}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                        isFollowing
                          ? 'bg-zinc-900 text-zinc-200 border border-zinc-700'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
