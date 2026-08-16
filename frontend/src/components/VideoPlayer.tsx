import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Gauge,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const { haptic, user } = useTelegram();

  const togglePlay = () => {
    haptic.impact('light');
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
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
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if ((videoRef.current as any).webkitEnterFullscreen) {
      (videoRef.current as any).webkitEnterFullscreen();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-elevated group select-none"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer pointer-events-auto"
      />

      {/* Dynamic Watermark / Anti-Leak Overlay */}
      <div className="absolute top-2.5 right-3 pointer-events-none opacity-40 bg-black/40 px-2 py-0.5 rounded text-[9px] font-mono text-white/90 flex items-center space-x-1 border border-white/10">
        <Lock className="w-2.5 h-2.5 text-amber-400" />
        <span>ID: {user?.id || '8544023815'} • {user?.first_name || 'Talaba'}</span>
      </div>

      <div className="absolute bottom-12 left-3 pointer-events-none opacity-30 text-[8px] text-white/70 font-sans tracking-wide">
        Mualliflik huquqi bilan himoyalangan. Tarqatish taqiqlanadi.
      </div>

      {/* Play/Pause Large Center Icon Overlay when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-all">
            <Play className="w-6 h-6 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Custom Video Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-col space-y-2">
        {/* Timeline Slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-emerald"
        />

        {/* Controls row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="p-1 hover:text-brand-emerald transition-colors">
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button onClick={() => skipTime(-10)} className="p-1 text-white/80 hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => skipTime(10)} className="p-1 text-white/80 hover:text-white">
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] text-white/80 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Speed toggle */}
            <button
              onClick={changeSpeed}
              className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold tracking-wider hover:bg-white/30 transition-colors"
            >
              {playbackSpeed}x
            </button>

            {/* Mute */}
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
