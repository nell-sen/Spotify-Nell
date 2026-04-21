import React, { useState } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { motion } from 'framer-motion';

export function Search() {
  const { 
    songs, 
    setCurrentSongIndex, 
    setIsCreatorOpen, 
    appLogo, 
    setIsNotificationsOpen, 
    notifications,
    searchHistory,
    addSearchHistory,
    clearSearchHistory
  } = useMusicStore();
  const unreadCount = notifications.filter(n => n.unread).length;
  const [query, setQuery] = useState('');

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(query.toLowerCase()) ||
    song.artist.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      addSearchHistory(query.trim());
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-screen-2xl mx-auto pt-8 px-6 pb-40 relative z-10 flex flex-col min-h-[100dvh] font-sans"
    >
      <header className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreatorOpen(true)}
              className="w-10 h-10 bg-[#ff4e00] rounded-2xl flex items-center justify-center transition-all group active:scale-95 shadow-lg overflow-hidden shrink-0"
            >
              {appLogo ? (
                <img src={appLogo} alt="Logo" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-black">N</span>
              )}
            </button>
            <span className="text-xl font-bold tracking-tighter text-slate-100 uppercase truncate">Search</span>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors relative"
            >
              <span className="material-symbols-outlined text-slate-300">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff4e00] rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16 pb-4 z-20">
         <div className="relative mt-8">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-sm focus:outline-none focus:bg-white/10 focus:border-[#ff4e00]/30 placeholder-slate-500 transition-all text-slate-100 shadow-2xl"
              placeholder="Search titles, artists..."
            />
         </div>
      </div>

      <div className="space-y-6 mt-4">
        {query && filteredSongs.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 block">search_off</span>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No result found for "{query}"</p>
          </div>
        )}

        {filteredSongs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-1">Search Results ({filteredSongs.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSongs.map((song) => {
                const globalIndex = songs.findIndex(s => s.id === song.id);
                return (
                  <button
                    key={song.id}
                    onClick={() => setCurrentSongIndex(globalIndex)}
                    className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all group text-left border border-white/5 hover:border-[#ff4e00]/20"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                       <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                       />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-bold truncate text-slate-100 group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
                      <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-slate-500 opacity-0 group-hover:opacity-100 transition-all text-sm">play_circle</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!query && (
          <div className="space-y-8 mt-4">
            {searchHistory.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recent Searches</h2>
                  <button onClick={clearSearchHistory} className="text-[10px] font-bold text-[#ff4e00] uppercase tracking-widest hover:brightness-110">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term, i) => (
                    <button 
                      key={i} 
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-1">Browse Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Pop', color: 'from-pink-500 to-rose-500' },
                  { name: 'Rock', color: 'from-orange-500 to-red-500' },
                  { name: 'Jazz', color: 'from-blue-500 to-indigo-500' },
                  { name: 'Hip Hop', color: 'from-purple-500 to-violet-500' },
                  { name: 'Classical', color: 'from-emerald-500 to-teal-500' },
                  { name: 'Electronic', color: 'from-cyan-500 to-blue-500' },
                  { name: 'Acoustic', color: 'from-amber-500 to-orange-500' },
                  { name: 'Indie', color: 'from-green-500 to-emerald-500' },
                ].map((cat) => (
                  <button 
                    key={cat.name}
                    onClick={() => setQuery(cat.name)}
                    className={`relative aspect-[16/9] bg-gradient-to-br ${cat.color} rounded-2xl p-4 overflow-hidden group hover:scale-[1.02] transition-all active:scale-95 shadow-lg`}
                  >
                    <span className="relative z-10 text-white font-black text-lg tracking-tighter uppercase">{cat.name}</span>
                    <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-white/20 text-6xl group-hover:scale-125 transition-transform duration-700">music_note</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </motion.main>
  );
}
