import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Lock,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useSecurityShield } from '../hooks/useSecurityShield';
import { DynamicWatermark } from './DynamicWatermark';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onEnded,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const { haptic } = useTelegram();

  // Xavfsizlik himoyasi: oyna nofaol bo'lganda / ekran yozish vositasi faollashganda
  const { isWindowBlurred, securityWarning, dismissWarning } = useSecurityShield({
    onSecurityAlert: () => {
      // Skrinshot yoki xavfli amal bajarilganda videoni darhol to'xtatamiz
      if (videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  });

  // Oyna nofaol bo'lsa videoni to'xtatish
  useEffect(() => {
    if (isWindowBlurred && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isWindowBlurred, isPlaying]);

  // Avtomatik controls yashirish
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const togglePlay = () => {
    haptic.impact('light');
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);
    onTimeUpdate?.(curr, dur);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    haptic.impact('light');
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
  };

  const changeSpeed = () => {
    haptic.impact('light');
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = () => {
    haptic.impact('light');
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-elevated group select-none"
    >
      {/* HTML5 Video Element with Full Security Lockdown */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        // @ts-ignore
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        className="w-full h-full object-contain pointer-events-none select-none"
      />

      {/* Transparent Click Shield Layer — prevents direct video right click / inspection */}
      <div
        onClick={togglePlay}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        className="absolute inset-0 z-10 cursor-pointer pointer-events-auto"
      />

      {/* Dinamik Harakatlanuvchi Watermark (Foydalanuvchi Telegram ID & Name) */}
      <DynamicWatermark variant="video" />

      {/* ⚠️ Privacy & Anti-Recording Shield (Oyna nofaol bo'lganda yoki ekran yozishda chiqadi) */}
      {isWindowBlurred && (
        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center text-center p-4 space-y-3 pointer-events-auto animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <EyeOff className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Xavfsizlik Himoyasi Faollashdi</h4>
            <p className="text-[11px] text-white/60 max-w-xs leading-relaxed">
              Ilova nofaol holatga o'tdi yoki tashqi yozish/skrinshot signali aniqlandi.
            </p>
          </div>
          <button
            onClick={() => {
              dismissWarning();
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-cyan text-white text-xs font-bold shadow-cyanGlow active:scale-95 transition-transform flex items-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Darsni davom ettirish</span>
          </button>
        </div>
      )}

      {/* Xavfsizlik Ogohlantirishi Toasti */}
      {securityWarning && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 animate-bounce border border-red-400">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* Play/Pause Markaziy Katta Tugma (Pauza paytida) */}
      {!isPlaying && !isWindowBlurred && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 cursor-pointer pointer-events-auto"
        >
          <div className="w-14 h-14 rounded-full bg-cyan text-[#05070A] flex items-center justify-center shadow-cyanGlow transform group-hover:scale-110 active:scale-95 transition-all">
            <Play className="w-6 h-6 fill-[#05070A] translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Maxsus Video Boshqaruv Paneli (Custom Security Controls Bar) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-25 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 flex flex-col space-y-2 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="vslider w-full cursor-pointer"
          style={{ ['--fill' as any]: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />

        {/* Controls row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="p-1 hover:text-cyan transition-colors">
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button onClick={() => skipTime(-10)} className="p-1 text-white/80 hover:text-white" title="-10s">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => skipTime(10)} className="p-1 text-white/80 hover:text-white" title="+10s">
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] text-white/80 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tezlik tanlash */}
            <button
              onClick={changeSpeed}
              className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold tracking-wider hover:bg-white/30 transition-colors"
            >
              {playbackSpeed}x
            </button>

            {/* Ovoz sozlash */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1 text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-1 text-white/80 hover:text-white">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
