import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore, Song } from '../store/useMusicStore';
import toast from 'react-hot-toast';

interface SongMenuProps {
  song: Song;
  onClose: () => void;
}

export function SongMenu({ song, onClose }: SongMenuProps) {
  const { playlists, addSongToPlaylist, removeSongFromPlaylist } = useMusicStore();
  const [view, setView] = useState<'main' | 'playlist'>('main');

  const handleTogglePlaylist = (playlistId: string, songId: string, isIn: boolean) => {
    if (isIn) {
      removeSongFromPlaylist(playlistId, songId);
      toast.success('Removed from playlist');
    } else {
      addSongToPlaylist(playlistId, songId);
      toast.success('Added to playlist');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6">
          {view === 'main' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 mb-6 p-2">
                <img src={song.thumbnail} alt={song.title} className="w-16 h-16 rounded-xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{song.title}</h3>
                  <p className="text-slate-400 text-sm truncate">{song.artist}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setView('playlist')}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#ff4e00]">playlist_add</span>
                <span className="font-bold text-slate-100 uppercase tracking-widest text-xs">Add to Playlist</span>
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/player?song=' + song.id);
                  toast.success('Link copied to clipboard');
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#ff4e00]">share</span>
                <span className="font-bold text-slate-100 uppercase tracking-widest text-xs">Share Song</span>
              </button>
              
              <button 
                onClick={onClose}
                className="w-full mt-4 py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-xs"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('main')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                </button>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Add to Playlist</h3>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {playlists.length === 0 ? (
                  <p className="text-center py-10 text-slate-500 text-sm italic">No playlists created yet.</p>
                ) : (
                  playlists.map(p => {
                    const isIn = p.songIds.includes(song.id);
                    return (
                      <button 
                        key={p.id}
                        onClick={() => handleTogglePlaylist(p.id, song.id, isIn)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-500">{isIn ? 'playlist_add_check' : 'playlist_add'}</span>
                          <span className={`font-bold text-sm ${isIn ? 'text-[#ff4e00]' : 'text-slate-100'}`}>{p.name}</span>
                        </div>
                        {isIn && <span className="material-symbols-outlined text-[#ff4e00] text-sm">check_circle</span>}
                      </button>
                    );
                  })
                )}
              </div>

              <button 
                onClick={() => setView('main')}
                className="w-full mt-4 py-4 bg-[#ff4e00] text-black font-black rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-xs shadow-lg shadow-[#ff4e00]/20"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
