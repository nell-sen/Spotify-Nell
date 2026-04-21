import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore } from '../store/useMusicStore';
import { useNavigate } from 'react-router-dom';

export function GlobalSearch() {
  const { isSearchOpen, setIsSearchOpen, songs, setCurrentSongIndex, setIsPlaying } = useMusicStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsSearchOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.artist.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handlePlay = (id: string) => {
    const index = songs.findIndex(s => s.id === id);
    if (index !== -1) {
      setCurrentSongIndex(index);
      setIsPlaying(true);
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 md:px-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsSearchOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ff4e00]">search</span>
          <input 
            autoFocus
            type="text" 
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 font-medium"
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="text-[10px] uppercase font-mono tracking-widest text-slate-500 hover:text-white"
          >
            Esc to close
          </button>
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto hide-scrollbar">
          {!query && (
            <div className="p-8 text-center opacity-40">
              <span className="material-symbols-outlined text-4xl mb-2">manage_search</span>
              <p className="text-sm font-medium">Type something to search...</p>
            </div>
          )}

          {query && filteredSongs.length === 0 && (
            <div className="p-8 text-center opacity-40">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="text-sm font-medium">No results found for "{query}"</p>
            </div>
          )}

          <div className="space-y-1">
            {filteredSongs.map((song) => (
              <div 
                key={song.id}
                onClick={() => handlePlay(song.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <img className="w-10 h-10 rounded-lg object-cover" src={song.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-bold text-slate-100 group-hover:text-[#ff4e00] transition-colors truncate">{song.title}</p>
                  <p className="text-xs text-slate-500 truncate">{song.artist} {song.album ? `• ${song.album}` : ''}</p>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-sm group-hover:text-white transition-colors">play_arrow</span>
              </div>
            ))}
          </div>

          {query && filteredSongs.length > 0 && (
            <button 
              onClick={() => { navigate('/search'); setIsSearchOpen(false); }}
              className="w-full text-center py-3 text-[#ff4e00] text-xs font-bold uppercase tracking-widest hover:bg-[#ff4e00]/5 rounded-xl mt-2 transition-colors"
            >
              View all results
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
