'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Post, PostComment, Role } from '@/types';
import VideoPlayer from './VideoPlayer';
import PostStudioModal from './PostStudioModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Globe,
  Plus,
  Video,
  Sparkles,
  Trash2,
  ExternalLink,
  Send,
  MoreVertical,
  Check,
  Eye,
  EyeOff,
  Filter,
  User,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface SocialFeedProps {
  initialPosts?: Post[];
  authorFilterId?: string;
  categoryFilter?: string;
  showHeader?: boolean;
  emptyMessage?: string;
}

export default function SocialFeed({
  initialPosts,
  authorFilterId,
  showHeader = true,
  emptyMessage = 'لا توجد منشورات أو فيديوهات حتى الآن.'
}: SocialFeedProps) {
  const { currentUser } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VIDEOS' | 'ARTICLES' | 'MY_POSTS'>('ALL');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [likingPosts, setLikingPosts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(cur => (cur?.text === text ? null : cur));
    }, 3500);
  };

  const canCreatePost =
    currentUser &&
    (['TEACHER', 'AMBASSADOR', 'OWNER', 'ADMIN', 'MODERATOR', 'GENERAL_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role) ||
      Boolean(currentUser.adminRole));

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = authorFilterId
        ? `/api/posts?authorId=${authorFilterId}`
        : '/api/posts';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPosts) {
      fetchPosts();
    }
  }, [authorFilterId]);

  // Handle Like
  const handleLike = async (postId: string) => {
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول للإعجاب بالمنشور', 'error');
      return;
    }

    if (likingPosts[postId]) return;
    setLikingPosts(prev => ({ ...prev, [postId]: true }));

    // Optimistic update
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const likedBy = p.likedBy || [];
        const isLiked = likedBy.includes(currentUser.id);
        const newLikedBy = isLiked
          ? likedBy.filter(id => id !== currentUser.id)
          : [...likedBy, currentUser.id];
        return {
          ...p,
          likedBy: newLikedBy,
          // likedBy only holds the viewer, so adjust the shared total by one instead of recounting it
          likesCount: Math.max(0, (p.likesCount || 0) + (isLiked ? -1 : 1))
        };
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to like');
      }
      const data = await res.json();
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, likesCount: data.likesCount, likedBy: data.likedBy } : p))
      );
    } catch (err) {
      showToast('حدث خطأ أثناء تحديث الإعجاب', 'error');
      fetchPosts(); // Rollback
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle Comment Thread
  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Submit Comment
  const handleCommentSubmit = async (postId: string) => {
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول للتعليق', 'error');
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      if (!res.ok) throw new Error('Comment failed');
      const data = await res.json();

      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: [...(p.comments || []), data.comment]
          };
        })
      );
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      showToast('تم نشر تعليقك', 'success');
    } catch (err) {
      showToast('تعذر نشر التعليق، يرجى المحاولة ثانية', 'error');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle Privacy
  const handleTogglePrivacy = async (post: Post) => {
    const newIsPrivate = !post.isPrivate;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: newIsPrivate })
      });
      if (!res.ok) throw new Error('Update failed');
      setPosts(prev =>
        prev.map(p => (p.id === post.id ? { ...p, isPrivate: newIsPrivate } : p))
      );
      showToast(
        newIsPrivate
          ? 'تم تحويل المنشور إلى خاص (للطلبة والأعضاء فقط)'
          : 'تم تحويل المنشور إلى عام (متاح للجميع)',
        'success'
      );
    } catch (err) {
      showToast('فشل تغيير خصوصية المنشور', 'error');
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور نهائياً؟')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('تم حذف المنشور بنجاح', 'success');
    } catch (err) {
      showToast('تعذر حذف المنشور', 'error');
    }
  };

  // Share link
  const handleShare = (post: Post) => {
    const url = `${window.location.origin}/community#post-${post.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(post.id);
    showToast('تم نسخ رابط المنشور بنجاح!', 'success');
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (activeFilter === 'VIDEOS') return Boolean(post.videoUrl);
    if (activeFilter === 'ARTICLES') return !post.videoUrl;
    if (activeFilter === 'MY_POSTS') return currentUser && post.authorId === currentUser.id;
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
      case 'SUPER_ADMIN':
        return { label: 'CTO & الإدارة العليا', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'GENERAL_ADMIN':
        return { label: 'المدير العام للأكاديمية', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'ADMIN':
      case 'COMMERCIAL_DIRECTOR':
        return { label: 'إدارة الأكاديمية', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'TEACHER':
        return { label: 'أستاذ معتمد', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'AMBASSADOR':
        return { label: 'سفير الأكاديمية', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: 'طالب في الأكاديمية', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top Header / Creation Prompt */}
      {showHeader && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-right">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-amber-400/40 flex-shrink-0 bg-slate-950">
                <Image
                  src="/images/dzprime-gold-emblem.png"
                  alt="DZ Prime Gold Logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  مجتمع DZ Prime والمدونة التعليمية
                  <span className="text-amber-400 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 font-bold">
                    فيديوهات ومقالات
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  منصة تواصل ومشاركة الأنشطة، الدروس المصورة، والتوجيهات من الأساتذة وسفراء الولايات.
                </p>
              </div>
            </div>

            {canCreatePost && (
              <button
                onClick={() => setIsStudioOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>نشر فيديو أو مقال جديد</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs sm:text-sm">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              الكل ({posts.length})
            </button>
            <button
              onClick={() => setActiveFilter('VIDEOS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                activeFilter === 'VIDEOS'
                  ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>فيديوهات ({posts.filter(p => Boolean(p.videoUrl)).length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('ARTICLES')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeFilter === 'ARTICLES'
                  ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              مقالات وتوجيهات ({posts.filter(p => !p.videoUrl).length})
            </button>
            {currentUser && canCreatePost && (
              <button
                onClick={() => setActiveFilter('MY_POSTS')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  activeFilter === 'MY_POSTS'
                    ? 'bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                منشوراتي ({posts.filter(p => p.authorId === currentUser.id).length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feed Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="animate-pulse rounded-2xl bg-slate-800/50 border border-slate-700/40 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700/60" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-4 bg-slate-700/60 rounded" />
                  <div className="w-20 h-3 bg-slate-700/40 rounded" />
                </div>
              </div>
              <div className="w-3/4 h-5 bg-slate-700/60 rounded" />
              <div className="w-full h-48 bg-slate-700/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-amber-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">{emptyMessage}</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            كن أول من يشارك درساً، نصيحة، أو فيديو ملهم مع أعضاء وطلبة DZ Prime Academy!
          </p>
          {canCreatePost && (
            <button
              onClick={() => setIsStudioOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول منشور الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map(post => {
            const isAuthor = currentUser?.id === post.authorId;
            const isAdmin =
              currentUser &&
              (['OWNER', 'SUPER_ADMIN', 'GENERAL_ADMIN', 'ADMIN'].includes(currentUser.role) ||
                currentUser.adminRole === 'GENERAL_ADMIN');
            const canManage = isAuthor || isAdmin;
            const isLiked = currentUser ? (post.likedBy || []).includes(currentUser.id) : false;
            const commentsCount = (post.comments || []).length;
            const isCommentsExpanded = expandedComments[post.id];
            const badge = getRoleBadge(post.authorRole);

            return (
              <article
                key={post.id}
                id={`post-${post.id}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-900/90 shadow-xl transition-all"
              >
                {/* Header: Author Info & Privacy Tag */}
                <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-3.5">
                    <Link
                      href={`/profile/${post.authorId}`}
                      className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 transition-all flex-shrink-0 bg-slate-800"
                    >
                      {post.authorAvatar ? (
                        <Image
                          src={post.authorAvatar}
                          unoptimized
                          alt={post.authorName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-800">
                          {post.authorName?.charAt(0) || 'D'}
                        </div>
                      )}
                    </Link>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${post.authorId}`}
                          className="font-black text-white hover:text-amber-300 transition-colors text-sm sm:text-base"
                        >
                          {post.authorName}
                        </Link>
                        <span
                          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {post.wilayaName && (
                          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                            {post.wilayaName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{new Date(post.createdAt).toLocaleDateString('ar-DZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        <span>•</span>
                        {post.isPrivate ? (
                          <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                            <Lock className="w-3 h-3" />
                            خاص بالطلبة والأعضاء
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 font-medium">
                            <Globe className="w-3 h-3" />
                            عام للجميع
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Privacy Toggle for Author/Admin */}
                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleTogglePrivacy(post)}
                          title={post.isPrivate ? 'تحويل إلى عام' : 'تحويل إلى خاص بالأعضاء فقط'}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            post.isPrivate
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {post.isPrivate ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden sm:inline">خاص بالأعضاء</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">عام للكل</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeletePost(post.id)}
                          title="حذف المنشور"
                          className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content: Title & Text */}
                <div className="p-4 sm:p-5 space-y-3">
                  {post.title && (
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* External Resource Link Preview */}
                  {post.linkUrl && (
                    <div className="pt-2">
                      <a
                        href={post.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs sm:text-sm font-semibold transition-all max-w-full truncate"
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{post.linkUrl}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Media Section: Video or Image */}
                {post.videoUrl && (
                  <div className="border-y border-slate-800/80 bg-slate-950">
                    <VideoPlayer url={post.videoUrl} title={post.title} />
                  </div>
                )}

                {!!post.imageUrls?.length && (
                  <div className={`grid gap-0.5 border-y border-slate-800/80 bg-slate-950 ${post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.imageUrls.map((src, i) => (
                      <button
                        type="button"
                        key={src}
                        onClick={() => setZoomImage(src)}
                        aria-label={`${post.title || 'Post'} - ${i + 1}/${post.imageUrls!.length}`}
                        className={`relative w-full overflow-hidden cursor-pointer group/img ${post.imageUrls!.length === 1 ? 'h-[340px] sm:h-[420px]' : 'h-[180px] sm:h-[240px]'}`}
                      >
                        <Image
                          src={src}
                          alt={post.title || 'Post Image'}
                          fill
                          className="object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Interactive Action Bar (Like, Comment, Share) */}
                <div className="p-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-t border-slate-800/60 bg-slate-900/40 text-slate-300 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        isLiked
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                          : 'hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                          isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                        }`}
                      />
                      <span>{post.likesCount || 0}</span>
                      <span className="hidden sm:inline">إعجاب</span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        isCommentsExpanded
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                          : 'hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{commentsCount}</span>
                      <span className="hidden sm:inline">تعليق</span>
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold hover:text-white hover:bg-slate-800/60 transition-all text-slate-400"
                  >
                    {copiedId === post.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>مشاركة</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {isCommentsExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/70 space-y-4">
                    {/* Comment Input */}
                    {currentUser ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/30 bg-slate-800 flex-shrink-0">
                          {currentUser.avatar ? (
                            <Image
                              src={currentUser.avatar}
                              unoptimized
                              alt={currentUser.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-amber-300 font-bold">
                              {currentUser.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            placeholder="اكتب تعليقك هنا..."
                            value={commentInputs[post.id] || ''}
                            onChange={e =>
                              setCommentInputs(prev => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleCommentSubmit(post.id);
                              }
                            }}
                            className="w-full pl-12 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs sm:text-sm placeholder-slate-500 outline-none transition-all"
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            disabled={
                              submittingComment[post.id] ||
                              !commentInputs[post.id]?.trim()
                            }
                            className="absolute left-1.5 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-navy-950 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs text-slate-400">
                        <Link href="/auth/login" className="text-amber-400 underline font-bold">
                          سجل الدخول
                        </Link>{' '}
                        للمشاركة بالتعليق والتفاعل مع المنشور.
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3 pt-2">
                      {commentsCount === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-2">
                          لا توجد تعليقات بعد، كن أول من يعلّق!
                        </p>
                      ) : (
                        post.comments?.map(comment => {
                          const cBadge = getRoleBadge(comment.authorRole);
                          return (
                            <div
                              key={comment.id}
                              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60"
                            >
                              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0 mt-0.5">
                                {comment.authorAvatar ? (
                                  <Image
                                    src={comment.authorAvatar}
                                    unoptimized
                                    alt={comment.authorName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-amber-300 font-bold">
                                    {comment.authorName?.charAt(0) || 'U'}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-white">
                                      {comment.authorName}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${cBadge.color}`}
                                    >
                                      {cBadge.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(comment.createdAt).toLocaleDateString('ar-DZ', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Post Creation Modal */}
      <PostStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onPostCreated={newPost => {
          setPosts(prev => [newPost, ...prev]);
        }}
      />

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={zoomImage}
              alt="Zoomed"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 ">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
              toastMsg.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-500/20'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20'
            }`}
          >
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
