import { Link, useNavigate } from 'react-router-dom';
import { useMusicStore, LyricLine } from '../store/useMusicStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { generateLyricsFromAITitle } from '../services/geminiSync';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'react-hot-toast';

export function Lyrics() {
  const { 
    songs, 
    currentSongIndex, 
    isPlaying, 
    setIsPlaying, 
    setCurrentSongIndex,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
    geminiApiKey
  } = useMusicStore();
  const progress = useMusicStore(state => state.currentTime);
  const duration = useMusicStore(state => state.duration);

  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  if (currentSongIndex < 0 || currentSongIndex >= songs.length) {
    navigate('/');
    return null;
  }

  const song = songs[currentSongIndex];
  const [bgColor, setBgColor] = useState('rgba(0,0,0,1)');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a background color from the thumbnail (simplified version)
    if (song.thumbnail) {
      setBgColor('rgba(255, 78, 0, 0.15)'); // Fallback to primary color glow
    }
  }, [song.thumbnail]);

  // Auto-scroll logic
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [progress]);

  const skipPrev = () => {
    if (currentSongIndex > 0) setCurrentSongIndex(currentSongIndex - 1);
  };

  const skipNext = () => {
    if (currentSongIndex < songs.length - 1) setCurrentSongIndex(currentSongIndex + 1);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const lyrics = song.lyrics && song.lyrics.length > 0 ? song.lyrics : null;

  const currentLyricIndex = (lyrics || []).reduce((acc, line, idx) => {
    if (progress >= line.time) return idx;
    return acc;
  }, -1);

  const handleGenerateAI = async () => {
    if (!geminiApiKey) {
      toast.error('Gemini API Key belum diatur di Admin.');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedLyrics = await generateLyricsFromAITitle(geminiApiKey, song.title, song.artist);
      if (generatedLyrics && generatedLyrics.length > 0) {
        // Save to Firestore
        const songRef = doc(db, 'songs', song.id);
        await updateDoc(songRef, { lyrics: generatedLyrics });
        toast.success('Lirik berhasil dihasilkan oleh AI!');
      } else {
        toast.error('AI tidak menemukan lirik untuk lagu ini.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghasilkan lirik.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 150 }}
        className="h-full flex flex-col"
        style={{ background: `linear-gradient(to bottom, #000, ${bgColor}, #000)` }}
      >
        {/* Background Image / Texture */}
        <div className="absolute inset-0 z-0 opacity-20 blur-[120px] pointer-events-none">
          <motion.img 
            key={song.id}
            src={song.thumbnail} 
            className="w-full h-full object-cover scale-150" 
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <main className="relative z-10 h-full flex flex-col max-w-4xl mx-auto w-full overflow-hidden font-sans pt-12">
          {/* Header */}
          <header className="flex justify-between items-center w-full px-8 py-6">
            <button onClick={() => navigate(-1)} className="group w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-100 hover:bg-[#ff4e00] hover:text-black transition-all active:scale-90 shadow-2xl">
              <span className="material-symbols-outlined text-3xl transition-transform group-hover:-translate-y-0.5">expand_more</span>
            </button>
            <div className="flex flex-col items-center flex-1 mx-4">
              <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff4e00]/80 mb-1"
              >
                Playing Now
              </motion.span>
              <h1 className="text-white font-black text-lg md:text-xl truncate max-w-[250px] md:max-w-[400px] uppercase tracking-tighter">
                {song.title}
              </h1>
            </div>
            <div className="w-12"></div>
          </header>

          {/* Sync Lyrics Section */}
          <section 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-8 py-32 md:py-60 space-y-12 hide-scrollbar lyrics-gradient-mask relative flex flex-col"
          >
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-[#ff4e00]/20 border-t-[#ff4e00] rounded-full animate-spin"></div>
                <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Menghasilkan lirik dengan AI...</p>
              </div>
            ) : lyrics ? (
              lyrics.map((line, idx) => {
                const isActive = idx === currentLyricIndex;
                const isPast = idx < currentLyricIndex;
                
                return (
                  <motion.div
                    key={`${song.id}-${idx}`}
                    ref={isActive ? activeLyricRef : null}
                    initial={false}
                    animate={{ 
                      opacity: isActive ? 1 : (isPast ? 0.3 : 0.15),
                      scale: isActive ? 1.02 : 1,
                      filter: isActive ? 'blur(0px)' : 'blur(0px)',
                    }}
                    transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const audio = window.globalAudioRef;
                      if (audio) audio.currentTime = line.time;
                    }}
                    className={clsx(
                      "cursor-pointer transition-all w-full md:max-w-2xl mx-auto",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  >
                    <p className={clsx(
                      "text-3xl md:text-6xl font-black tracking-tighter leading-[1.1] text-left transition-colors duration-500",
                      isActive ? "drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" : "hover:text-slate-200"
                    )}>
                      {line.text}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-4 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/10 group overflow-hidden relative">
                   <div className="absolute inset-0 bg-[#ff4e00]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <span className="material-symbols-outlined text-5xl text-slate-500 group-hover:text-[#ff4e00] transition-all group-hover:scale-110">music_note</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Lirik Belum Tersedia</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto leading-relaxed opacity-80">Gunakan AI untuk menghasilkan lirik sinkron secara real-time untuk lagu {song.title}.</p>
                </div>
                <button 
                  onClick={handleGenerateAI}
                  className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">auto_awesome</span>
                  Hasilkan dengan AI
                </button>
              </div>
            )}
            
            {/* End Space */}
            <div className="h-64"></div>
          </section>

          {/* Controls Footer */}
          <footer className="px-8 pb-16 pt-10 relative bg-gradient-to-t from-black via-black/90 to-transparent">
            {/* Song Meta Below Lyrics */}
            <div className="flex items-end justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black text-white tracking-tighter">{song.title}</h2>
                <h3 className="text-lg font-bold text-[#ff4e00] opacity-80">{song.artist}</h3>
              </div>
              <button className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined fill-0 group-active:fill-1">favorite</span>
              </button>
            </div>

            {/* Range Progress */}
            <div className="mb-10">
              <div 
                className="group relative h-2 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickedPercent = x / rect.width;
                  if (window.globalAudioRef) window.globalAudioRef.currentTime = clickedPercent * duration;
                }}
              >
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  initial={false}
                  animate={{ width: `${(progress / duration) * 100}%` }}
                />
                <div className="absolute inset-0 group-hover:bg-white/10 transition-colors"></div>
              </div>
              <div className="flex justify-between text-[11px] font-black text-slate-500 mt-3 uppercase tracking-widest px-1">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex justify-between items-center px-4 max-w-sm mx-auto">
              <button 
                onClick={() => setIsShuffle(!isShuffle)}
                className={clsx("transition-all active:scale-90", isShuffle ? "text-[#ff4e00]" : "text-white/40")}
              >
                <span className="material-symbols-outlined text-3xl">shuffle</span>
              </button>
              <button onClick={skipPrev} className="text-white hover:scale-110 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-5xl">skip_previous</span>
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 bg-white text-black rounded-[2rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
              >
                <span className="material-symbols-outlined text-5xl leading-none font-bold">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button onClick={skipNext} className="text-white hover:scale-110 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-5xl">skip_next</span>
              </button>
              <button 
                onClick={() => setIsRepeat(!isRepeat)}
                className={clsx("transition-all active:scale-90", isRepeat ? "text-[#ff4e00]" : "text-white/40")}
              >
                <span className="material-symbols-outlined text-3xl">repeat</span>
              </button>
            </div>
          </footer>
        </main>
      </motion.div>
    </motion.div>
  );
}
