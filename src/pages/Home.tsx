import { Link, useNavigate } from 'react-router-dom';
import { useMusicStore } from '../store/useMusicStore';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

export function Home() {
  const { songs, isLoading, setCurrentSongIndex, setIsPlaying, setIsCreatorOpen, setIsNotificationsOpen, notifications, setIsSearchOpen, appLogo } = useMusicStore();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert('Sistem sedang menyiapkan paket instalasi...');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handlePlay = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };


  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="pt-24 px-6 pb-40 space-y-8 w-full max-w-screen-2xl mx-auto relative z-10 font-sans"
    >
      {/* Header / TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreatorOpen(true)}
              className="w-10 h-10 bg-[#ff4e00] rounded-2xl flex items-center justify-center transition-all group active:scale-95 shadow-lg overflow-hidden shrink-0"
              title="Creator Info"
            >
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                  <span className="text-[10px] font-black text-black">N</span>
                </div>
              )}
            </button>
            <span className="text-xl font-bold tracking-tighter text-slate-100 uppercase">NellSpotify</span>
          </div>
          <div className="flex gap-4 items-center">
            {installPrompt && (
              <button 
                onClick={handleInstall}
                className="hidden md:flex items-center gap-2 bg-[#ff4e00] text-black px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">install_mobile</span>
                Install PWA
              </button>
            )}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-300">search</span>
            </button>

            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors relative"
            >
              <span className="material-symbols-outlined text-slate-300">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff4e00] rounded-full animate-pulse"></span>
              )}
            </button>
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-slate-400 uppercase tracking-widest font-mono hidden sm:inline-block">User Mode</span>
            <div className="w-8 h-8 bg-gradient-to-tr from-slate-600 to-slate-400 rounded-full border border-white/20"></div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-6 text-glow">Good Morning</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-welcome-${i}`} className="glass-card rounded-xl p-2 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0"></div>
                <div className="h-4 bg-white/10 rounded w-20"></div>
              </div>
            ))
          ) : (
            songs.slice(0, 6).map((song, i) => (
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.95 }}
                key={song.id} 
                onClick={() => handlePlay(i)}
                className="glass-card rounded-xl p-2 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={song.thumbnail} alt={song.title} loading="lazy" referrerPolicy="no-referrer" />
                </div>
                <span className="text-sm font-bold truncate pr-2 text-slate-100">{song.title}</span>
              </motion.div>
            ))
          )}
          {!isLoading && songs.length === 0 && (
            <div className="col-span-2 text-center text-sm opacity-50 py-4">No songs available. Go to Upload to add some.</div>
          )}
        </div>
      </motion.section>

      {/* Made For You Section */}
      <section>
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-2xl font-bold tracking-tight">Made For You</h2>
          <button 
            onClick={() => navigate('/search')}
            className="text-[10px] uppercase font-bold tracking-widest text-[#ff4e00] hover:brightness-125 transition-all"
          >
            Show All
          </button>
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-made-${i}`} className="flex-shrink-0 w-40 animate-pulse">
                <div className="w-40 h-40 rounded-xl bg-white/10 mb-3"></div>
                <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-16"></div>
              </div>
            ))
          ) : (
            songs.slice().reverse().map((song) => {
              const originalIndex = songs.findIndex(s => s.id === song.id);
              return (
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                key={`made-${song.id}`}
                onClick={() => handlePlay(originalIndex)}
                className="flex-shrink-0 w-40 group cursor-pointer"
              >
                <div className="w-40 h-40 rounded-xl overflow-hidden mb-3 shadow-2xl group-active:scale-95 transition-transform duration-500 relative">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={song.thumbnail} alt={song.title} loading="lazy" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <p className="font-bold text-sm leading-tight mb-1 truncate group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
                <p className="text-xs text-on-surface-variant line-clamp-2 truncate opacity-60">{song.artist}</p>
              </motion.div>
            )})
          )}
          {!isLoading && songs.length === 0 && (
             <div className="text-sm opacity-50 py-4">No songs yet.</div>
          )}
        </motion.div>
      </section>


      {/* Album Showcase */}
      <section>
        <div className="flex justify-between items-end mb-4 px-2 text-glow">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Top Albums</h2>
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-6 overflow-x-auto hide-scrollbar -mx-6 px-6"
        >
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={`album-skel-${i}`} className="flex-shrink-0 w-44 animate-pulse">
                 <div className="w-44 h-44 rounded-3xl bg-white/10 mb-3"></div>
                 <div className="h-4 bg-white/10 rounded w-28"></div>
               </div>
             ))
          ) : (
            Array.from(new Set(songs.map(s => s.album).filter(Boolean))).slice(0, 8).map((albumName, i) => {
              const albumSongs = songs.filter(s => s.album === albumName);
              const representativeSong = albumSongs[0];
              return (
                <motion.div 
                  variants={itemVariants}
                  key={`album-${i}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/library?view=all&filter=${albumName}`)}
                  className="flex-shrink-0 w-44 group cursor-pointer"
                >
                  <div className="w-44 h-44 rounded-3xl overflow-hidden mb-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[#ff4e00]/20 transition-all duration-500 relative bg-zinc-800">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-[0.5px] group-hover:blur-0" src={representativeSong?.thumbnail} alt={albumName || ''} loading="lazy" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100 flex flex-col justify-end p-5">
                       <p className="text-[10px] font-black text-[#ff4e00] uppercase tracking-widest leading-none mb-1">Album</p>
                       <p className="text-white text-md font-black leading-tight line-clamp-2">{albumName}</p>
                    </div>
                    {/* Vinyl Record Decorator */}
                    <div className="absolute -right-[30%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-black border-4 border-zinc-800 shadow-2xl z-[-1] group-hover:right-[-5%] transition-all duration-700 hidden lg:block opacity-0 group-hover:opacity-100">
                      <div className="absolute inset-[30%] rounded-full border border-zinc-700/50"></div>
                      <div className="absolute inset-[45%] rounded-full bg-[#ff4e00]/20 border border-[#ff4e00]/30 shadow-inner"></div>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-slate-100 mb-0.5 truncate px-1">{albumName}</p>
                  <p className="text-xs text-slate-500 font-medium px-1">{representativeSong?.artist}</p>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </section>

      {/* Filter by Year Toolbar */}
      <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff4e00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="w-full md:w-auto">
            <h3 className="text-xl font-black text-slate-100 mb-1">Time Travel</h3>
            <p className="text-xs text-slate-500 font-medium">Flashback to your favorite years</p>
          </div>
          <div className="flex gap-2 bg-black/40 p-2 rounded-full border border-white/5 overflow-x-auto max-w-full hide-scrollbar">
            {['All', '2025', '2024', '2023', '2022', '2021', '2020'].map(year => (
              <button 
                key={year}
                onClick={() => navigate(`/library?year=${year}`)}
                className="px-6 py-2 rounded-full text-[10px] font-bold text-white hover:bg-[#ff4e00] hover:text-black transition-all uppercase tracking-widest whitespace-nowrap active:scale-95"
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 mt-8 pt-6 border-t border-white/5">
          <div className="w-full md:w-auto">
            <h3 className="text-xl font-black text-slate-100 mb-1">Mood Selector</h3>
            <p className="text-xs text-slate-500 font-medium">Find music that fits your vibe</p>
          </div>
          <div className="flex gap-2 bg-black/40 p-2 rounded-full border border-white/5 overflow-x-auto max-w-full hide-scrollbar">
            {['All', 'Pop', 'R&B', 'Lofi', 'Jazz', 'Electronic', 'HipHop'].map(genre => (
              <button 
                key={genre}
                onClick={() => navigate(`/library?genre=${genre}`)}
                className="px-6 py-2 rounded-full text-[10px] font-bold text-white hover:bg-[#ff4e00] hover:text-black transition-all uppercase tracking-widest whitespace-nowrap active:scale-95"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Artists Section */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4 px-2">Popular Artists</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-6 overflow-x-auto hide-scrollbar -mx-6 px-6"
        >
          {Array.from(new Set(songs.map(s => s.artist))).slice(0, 5).map((artist, i) => (
            <motion.div variants={itemVariants} key={i} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 rounded-full overflow-hidden shadow-xl bg-secondary/20 flex items-center justify-center border border-white/5 group-hover:border-[#ff4e00]/30 transition-colors"
              >
                 <span className="font-bold text-2xl text-primary group-hover:scale-110 transition-transform group-hover:text-[#ff4e00]">{artist.charAt(0).toUpperCase()}</span>
              </motion.div>
              <span className="text-xs font-bold w-24 text-center truncate opacity-70 group-hover:opacity-100">{artist}</span>
            </motion.div>
          ))}
          {songs.length === 0 && (
             <div className="text-sm opacity-50 py-4">No artists yet.</div>
          )}
        </motion.div>
      </section>

      {/* New Releases Featured Section */}
      {songs.length > 0 && (() => {
        const sortedByTime = [...songs].sort((a, b) => b.createdAt - a.createdAt);
        const newestSong = sortedByTime[0];
        const originalIndex = songs.findIndex(s => s.id === newestSong.id);
        return (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-2xl font-bold tracking-tight mb-4 px-2">New Releases</h2>
          <div className="relative rounded-[2rem] overflow-hidden aspect-video shadow-2xl group cursor-pointer" onClick={() => handlePlay(originalIndex)}>
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src={newestSong.thumbnail} alt={newestSong.title} loading="lazy" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
              <span className="text-[#ff4e00] font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#ff4e00] rounded-full animate-pulse"></span>
                Exclusive Premiere
              </span>
              <h3 className="text-white text-3xl font-extrabold leading-tight mb-4 truncate">{newestSong.title}</h3>
              <button className="bg-[#ff4e00] hover:brightness-110 text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 w-max transition-all active:scale-95 text-sm shadow-[0_0_20px_rgba(255,78,0,0.3)]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                Listen Now
              </button>
            </div>
          </div>
        </motion.section>
      )})()}
    </motion.main>
  );
}
