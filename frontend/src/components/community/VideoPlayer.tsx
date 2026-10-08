'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Play, ExternalLink, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Pattern matching for various YouTube URL forms:
  // - youtube.com/watch?v=ID
  // - youtu.be/ID
  // - youtube.com/shorts/ID
  // - youtube.com/embed/ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title = 'Video Player', className = '' }) => {
  const youtubeId = useMemo(() => parseYouTubeId(url), [url]);
  const [unavailable, setUnavailable] = useState(false);

  // YouTube's oEmbed answers 400/404 for ids that do not exist. Any other outcome (offline, blocked) keeps the player.
  useEffect(() => {
    setUnavailable(false);
    if (!youtubeId) return;
    let live = true;
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`)
      .then((r) => { if (live && (r.status === 400 || r.status === 404)) setUnavailable(true); })
      .catch(() => {});
    return () => { live = false; };
  }, [youtubeId]);

  if (!url) return null;

  if (youtubeId && unavailable) {
    return (
      <div role="status" className={`p-4 rounded-2xl bg-[#111114] border border-white/10 flex items-center gap-3 text-xs ${className}`}>
        <div className="w-9 h-9 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center shrink-0">
          <VideoOff className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white">الفيديو غير متاح</p>
          <p className="text-[11px] text-gray-400">الرابط لا يشير إلى فيديو موجود على يوتيوب. يمكن لصاحب المنشور تصحيحه.</p>
        </div>
      </div>
    );
  }

  // If it's a valid YouTube video:
  if (youtubeId) {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden bg-black/90 border border-gold-500/30 shadow-2xl aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  const vimeoId = /^https:\/\/(?:www\.)?vimeo\.com\/(\d{6,12})(?:[/?#].*)?$/.exec(url.trim())?.[1];
  if (vimeoId) {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden bg-black/90 border border-gold-500/30 shadow-2xl aspect-video ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  // If it's a direct video (.mp4, .webm):
  const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(url.trim());
  if (isDirectVideo) {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden bg-black border border-gold-500/30 shadow-2xl aspect-video ${className}`}>
        <video
          controls
          src={url}
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback for external video links (Vimeo, Dailymotion, custom platform):
  return (
    <div className={`p-4 rounded-2xl bg-[#111114] border border-gold-500/30 flex items-center justify-between gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 fill-current" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{title}</p>
          <p className="text-[11px] text-gray-400 truncate">{url}</p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 rounded-xl bg-gold-500 text-navy-950 font-black text-xs flex items-center gap-1 shrink-0 hover:bg-gold-400 transition-colors shadow-sm"
      >
        <span>مشاهدة الفيديو</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

export default VideoPlayer;
