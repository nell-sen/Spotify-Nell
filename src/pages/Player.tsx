import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMusicStore } from '../store/useMusicStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function Player() {
  const navigate = useNavigate();
  const { 
    songs, 
    currentSongIndex, 
    isPlaying, 
    setIsPlaying, 
    setCurrentSongIndex,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat
  } = useMusicStore();
  const progress = useMusicStore(state => state.currentTime);
  const duration = useMusicStore(state => state.duration);

  if (currentSongIndex < 0 || currentSongIndex >= songs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-mesh text-on-surface">
        <p>No song playing.</p>
        <Link to="/" className="text-primary mt-4 font-bold">Go back Home</Link>
      </div>
    );
  }

  const song = songs[currentSongIndex];
  const nextSong = songs[currentSongIndex + 1];

  useEffect(() => {
    if ('mediaSession' in navigator && song) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'Single',
        artwork: [
          { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
      navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    }
  }, [song, isPlaying]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = window.globalAudioRef;
    if (!audio) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    audio.currentTime = percentage * audio.duration;
  };

  const skipPrev = () => {
    if (currentSongIndex > 0) setCurrentSongIndex(currentSongIndex - 1);
  };

  const skipNext = () => {
    if (currentSongIndex < songs.length - 1) setCurrentSongIndex(currentSongIndex + 1);
  };

  return (
    <motion.main 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-full max-w-4xl mx-auto min-h-[100dvh] pt-24 pb-40 flex flex-col items-center relative z-50 px-8 bg-background will-change-transform"
    >
      {/* TopAppBar */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-between px-6 h-20 bg-black/20 backdrop-blur-xl border-b border-white/5 max-w-4xl">
        <button onClick={() => navigate(-1)} className="hover:opacity-80 transition-opacity scale-95 duration-200">
          <span className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">keyboard_arrow_down</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-sans tracking-tighter font-black text-[10px] text-slate-500 uppercase tracking-widest leading-none">Now Playing</h1>
          <p className="text-[10px] font-bold text-[#ff4e00] mt-1">{song.album || 'Single'}</p>
        </div>
        <a 
          href="https://wa.me/6285822990755?text=Halo%20Admin%20NellSpotify" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center hover:bg-green-600/20 transition-all active:scale-95 group"
        >
          <svg className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.267.405 2.436 1.096 3.393L6.8 18l2.67-.565c.957.691 2.126 1.096 3.393 1.096 3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm0 10.455c-1.163 0-2.227-.367-3.091-.982l-.245-.145-1.572.332.332-1.572-.145-.245c-.615-.864-.982-1.928-.982-3.091 0-2.618 2.126-4.744 4.744-4.744 2.618 0 4.744 2.126 4.744 4.744 0 2.618-2.126 4.744-4.744 4.744zm2.182-3.164c-.118-.059-.705-.348-.813-.387-.108-.039-.187-.059-.265.059-.078.118-.304.387-.373.466-.069.079-.138.089-.255.03-.118-.059-.496-.182-.943-.581-.349-.311-.585-.694-.653-.811-.069-.117-.007-.181.052-.24.053-.053.118-.138.177-.206.059-.069.078-.118.118-.201.039-.083.02-.157-.01-.216-.03-.059-.265-.638-.363-.874-.096-.231-.193-.199-.265-.202-.069-.003-.147-.003-.226-.003s-.206.03-.314.147c-.108.118-.412.403-.412.982 0 .579.422 1.139.481 1.218.059.079.829 1.267 2.008 1.776.281.121.498.193.668.247.282.089.539.076.741.046.226-.034.705-.286.804-.564.099-.278.099-.516.069-.564-.03-.048-.108-.078-.226-.137z"/></svg>
        </a>
      </header>

      {/* Album Art */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          key={song.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative w-full aspect-square mb-10 group"
        >
          <div className="absolute inset-0 bg-primary-container/20 rounded-xl blur-3xl scale-95 translate-y-4"></div>
          <img 
            className={clsx(
              "relative w-full h-full object-cover rounded-xl shadow-[0_20px_50px_rgba(102,15,230,0.15)] z-10 transition-transform duration-700",
              isPlaying ? "scale-100" : "scale-95 grayscale-[20%]"
            )}
            src={song.thumbnail} 
            alt="Album Cover" 
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Typography Info */}
      <div className="w-full text-center mb-10">
        <h2 className="text-[2.25rem] md:text-5xl font-extrabold tracking-tight leading-tight text-on-surface mb-2">{song.title}</h2>
        <div className="flex flex-col gap-1.5 items-center">
          <p className="text-xl font-medium text-[#ff4e00]">{song.artist}</p>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">
            {song.releaseYear ? <span>{song.releaseYear}</span> : <span>{new Date(song.createdAt).getFullYear()}</span>}
            <span className="w-1 h-1 bg-[#ff4e00] rounded-full"></span>
            <span>{song.genre || 'Music'}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-10 cursor-pointer px-2">
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">{formatTime(progress)}</span>
          <div onClick={handleSeek} className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden py-2" style={{ backgroundClip: 'content-box' }}>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ff4e00] rounded-full shadow-[0_0_8px_rgba(255,78,0,0.5)] pointer-events-none"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-between px-2 mb-8">
        <button 
          onClick={() => setIsShuffle(!isShuffle)}
          className={clsx("transition-colors", isShuffle ? "text-[#ff4e00]" : "text-slate-400 hover:text-white")}
        >
          <span className="material-symbols-outlined text-2xl">shuffle</span>
        </button>
        <div className="flex items-center gap-8">
          <button onClick={skipPrev} className="text-slate-400 hover:text-white transition-colors disabled:opacity-50" disabled={currentSongIndex === 0}>
            <span className="material-symbols-outlined text-3xl">skip_previous</span>
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-white/10 shadow-lg"
          >
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={skipNext} className="text-slate-400 hover:text-white transition-colors disabled:opacity-50" disabled={currentSongIndex === songs.length - 1}>
            <span className="material-symbols-outlined text-3xl">skip_next</span>
          </button>
        </div>
        <button 
          onClick={() => setIsRepeat(!isRepeat)}
          className={clsx("transition-colors", isRepeat ? "text-[#ff4e00]" : "text-slate-400 hover:text-white")}
        >
          <span className="material-symbols-outlined text-2xl">repeat</span>
        </button>
      </div>

      <div className="w-full flex justify-center mt-4">
        <button 
          onClick={() => navigate('/lyrics')}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#ff4e00]/10 hover:text-[#ff4e00] transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:animate-bounce">lyrics</span>
          Lyrics
        </button>
      </div>

      {/* Up Next Section */}
      {nextSong && (
        <div className="w-full mt-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={skipNext}>
             <div className="flex items-center justify-between mb-4">
               <span className="font-bold text-sm text-slate-100 uppercase tracking-widest">Up Next</span>
               <span className="material-symbols-outlined text-slate-400 text-xl hover:text-white">expand_less</span>
             </div>
             <div className="flex items-center gap-4">
               <img className="w-12 h-12 rounded-lg object-cover" src={nextSong.thumbnail} alt="Next Track" loading="lazy" referrerPolicy="no-referrer" />
               <div className="flex-grow min-w-0">
                 <p className="text-sm font-bold text-on-surface truncate">{nextSong.title}</p>
                 <p className="text-xs text-on-surface-variant truncate">{nextSong.artist}</p>
               </div>
               <span className="material-symbols-outlined text-slate-400 flex-shrink-0">drag_handle</span>
             </div>
          </div>
        </div>
      )}
    </motion.main>
  );
}
