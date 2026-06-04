import { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import { isYouTubeUrl } from '../services/streamService';

export function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;
  const [isReady, setIsReady] = useState(false);
  
  const { 
    songs, 
    currentSongIndex, 
    isPlaying, 
    setIsPlaying, 
    volume, 
    setCurrentSongIndex,
    isShuffle,
    isRepeat,
    setCurrentTime,
    setDuration
  } = useMusicStore();
  
  const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null;
  const audioUrl = currentSong?.audioUrl || '';
  const isYT = isYouTubeUrl(audioUrl);

  const handleTrackEnded = () => {
    if (isRepeat) {
      if (isYT && playerRef.current) {
        playerRef.current.seekTo(0);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (isShuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * songs.length));
      return;
    }

    if (currentSongIndex + 1 < songs.length) {
      setCurrentSongIndex(currentSongIndex + 1);
    } else {
      setIsPlaying(false);
      setCurrentSongIndex(0);
    }
  };

  // ----- NATIVE HTML5 AUDIO (For Non-YT links) -----
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    
    const onEnded = () => handleTrackEnded();
    const onTimeUpdate = () => { if (!isYT) setCurrentTime(audio.currentTime); };
    const onLoadedMetadata = () => { if (!isYT) setDuration(audio.duration); };
    const onPlay = () => { if (!isYT) setIsPlaying(true); };
    const onPause = () => { if (!isYT) setIsPlaying(false); };
    const onError = () => {
      if (!isYT && audio.src && audio.src !== window.location.href) {
        console.error("Local audio error on src:", audio.src);
        toast.error('Gagal memutar audio lokal, melewati...');
        handleTrackEnded();
      }
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [isYT, songs.length, currentSongIndex, isShuffle, isRepeat]);

  // Handle Playback State Sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio) audio.volume = volume;

    if (isYT) {
      if (!audio.paused) audio.pause();
      return;
    }

    if (!audioUrl) {
      audio.pause();
      audio.src = '';
      return;
    }

    if (audio.src !== audioUrl && !audioUrl.endsWith(audio.src)) {
       audio.src = audioUrl;
       audio.load();
       if (isPlaying) {
         const playPromise = audio.play();
         if (playPromise !== undefined) {
           playPromise.catch((e) => {
             if (e.name !== 'AbortError') setIsPlaying(false);
           });
         }
       }
    } else {
      if (isPlaying && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
           playPromise.catch((e) => {
             if (e.name !== 'AbortError') setIsPlaying(false);
           });
        }
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [audioUrl, isPlaying, isYT, volume]);

  // Reset ready state when changing track
  useEffect(() => {
    setIsReady(false);
  }, [audioUrl]);

  // Expose Global API for UI to scrub time
  useEffect(() => {
    window.globalAudioRef = {
      get currentTime() { return useMusicStore.getState().currentTime; },
      set currentTime(val) {
        if (isYT && playerRef.current) {
          playerRef.current.seekTo(val, 'seconds');
        } else if (audioRef.current) {
          audioRef.current.currentTime = val;
        }
      },
      get duration() { return useMusicStore.getState().duration; },
      play: () => Promise.resolve(setIsPlaying(true)),
      pause: () => setIsPlaying(false),
    } as any;
  }, [isYT]);

  return (
    <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none -z-50" aria-hidden="true">
      {isYT && (
        <Player
          ref={playerRef}
          url={audioUrl}
          playing={isPlaying}
          volume={volume}
          width="1px"
          height="1px"
          playsinline={true}
          fallback={<div/>}
          onReady={() => {
            setIsReady(true);
            if (playerRef.current) {
              const dur = playerRef.current.getDuration();
              if (dur) setDuration(dur);
            }
          }}
          onProgress={(p: any) => {
            if (isReady) setCurrentTime(p.playedSeconds);
          }}
          onEnded={handleTrackEnded}
          onError={(e: any) => {
            console.error('YouTube Player Error:', e);
            toast.error('Gagal memuat video YouTube ini, melewati...');
            handleTrackEnded();
          }}
          config={{
            youtube: {
              playerVars: { 
                autoplay: 1, 
                controls: 0, 
                showinfo: 0, 
                rel: 0, 
                modestbranding: 1, 
                iv_load_policy: 3, 
                playsinline: 1,
                origin: window.location.origin
              }
            }
          }}
        />
      )}
    </div>
  );
}

declare global {
  interface Window {
    globalAudioRef: HTMLAudioElement;
  }
}

