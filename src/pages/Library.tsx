import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMusicStore, Song } from '../store/useMusicStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import useMeasure from 'react-use-measure';
import { SongMenu } from '../components/SongMenu';

export function Library() {
  const [searchParams] = useSearchParams();
  const yearQuery = searchParams.get('year');
  const albumQuery = searchParams.get('filter');
  const genreQuery = searchParams.get('genre');

  const { 
    songs, filter, setFilter, setCurrentSongIndex, setIsPlaying, isLoading, 
    appLogo, setIsCreatorOpen, setIsNotificationsOpen, notifications, setIsSearchOpen,
    markNotificationsAsRead, playlists, addPlaylist, deletePlaylist
  } = useMusicStore();
  const [view, setView] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');
  const unreadCount = notifications.filter(n => n.unread).length;
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedSongMenu, setSelectedSongMenu] = useState<Song | null>(null);

  const [measureRef, { width, height }] = useMeasure();

  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

  const handlePlay = (songId: string) => {
    const originalIndex = songs.findIndex(s => s.id === songId);
    if (originalIndex !== -1) {
      setCurrentSongIndex(originalIndex);
      setIsPlaying(true);
    }
  };

  const filteredByParams = useMemo(() => {
    let base = [...songs];
    if (yearQuery && yearQuery !== 'All') {
      base = base.filter(s => s.releaseYear === yearQuery);
    }
    if (albumQuery) {
      base = base.filter(s => s.album === albumQuery);
    }
    if (genreQuery && genreQuery !== 'All') {
      base = base.filter(s => s.genre === genreQuery);
    }
    return base;
  }, [songs, yearQuery, albumQuery, genreQuery]);

  const sortedSongs = useMemo(() => {
    return [...filteredByParams].sort((a, b) => {
      if (filter === 'newest') return b.createdAt - a.createdAt;
      if (filter === 'oldest') return a.createdAt - b.createdAt;
      if (filter === 'artist') return a.artist.localeCompare(b.artist);
      return 0;
    });
  }, [filteredByParams, filter]);

  const artists = useMemo(() => Array.from(new Set(songs.map(s => s.artist))), [songs]);
  
  const albumData = useMemo(() => {
    const map = new Map<string, { song: Song; count: number }>();
    songs.forEach(s => {
      if (s.album && s.album !== 'Single') {
        const item = map.get(s.album);
        if (item) item.count++;
        else map.set(s.album, { song: s, count: 1 });
      }
    });
    return Array.from(map.entries());
  }, [songs]);

  const displaySongs = view === 'artists' && selectedArtist ? sortedSongs.filter(s => s.artist === selectedArtist) : sortedSongs;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const song = displaySongs[index];
    if (!song) return null;
    return (
      <div style={style} className="px-1">
        <motion.div 
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handlePlay(song.id)}
          className="flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-[#ff4e00]/10 transition-all">
             <img src={song.thumbnail} alt={song.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="border-b border-white/10 pb-4 flex-grow min-w-0 flex justify-between items-center pr-4">
             <div className="min-w-0 flex-grow">
               <p className="font-bold text-base truncate text-slate-100 group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                 <p className="text-xs text-slate-400 truncate max-w-[200px]">
                   {song.artist} • {song.album || 'Single'}
                 </p>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1">
               <span className="text-[10px] font-mono text-slate-500">{song.duration || '--:--'}</span>
               <button 
                onClick={(e) => { e.stopPropagation(); setSelectedSongMenu(song); }}
                className="material-symbols-outlined text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#ff4e00]"
               >
                more_vert
               </button>
             </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="w-full max-w-screen-2xl mx-auto pt-24 px-6 pb-40 relative z-10 flex flex-col h-[100dvh] font-sans"
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
            <span className="text-xl font-bold tracking-tighter text-slate-100 uppercase truncate">Library</span>
          </div>
          <div className="flex gap-4 items-center">
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
            {selectedArtist && view === 'artists' && (
              <button onClick={() => setSelectedArtist(null)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#ff4e00]/10 text-[#ff4e00] hover:scale-110 transition-all active:scale-95">
              <span className="material-symbols-outlined">add</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar -mx-6 px-6 mt-4">
        {(['all', 'playlists', 'artists', 'albums'] as const).map((v) => (
          <button 
            key={v}
            onClick={() => { setView(v); setSelectedArtist(null); }}
            className={`px-4 py-1.5 rounded-full border border-white/10 text-sm font-semibold capitalize whitespace-nowrap transition-all active:scale-95 ${view === v ? 'bg-[#ff4e00] text-black shadow-[0_0_15px_rgba(255,78,0,0.3)]' : 'bg-white/5 text-slate-100 hover:bg-white/10'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-100 transition-colors" onClick={() => {
            const nextFilterMap = { newest: 'oldest', oldest: 'artist', artist: 'newest' } as const;
            setFilter(nextFilterMap[filter]);
          }}>
            <span className="material-symbols-outlined text-sm">swap_vert</span>
            <span className="text-sm font-bold capitalize">Sort by {filter}</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#ff4e00]/30 border-t-[#ff4e00] rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Syncing...</span>
            </div>
          )}
        </div>
        <span className="material-symbols-outlined text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">grid_view</span>
      </div>

      <div className="flex-1 min-h-0 relative" ref={measureRef}>
        <AnimatePresence mode="wait">
          {(view === 'all' || (view === 'artists' && selectedArtist)) ? (
             <motion.div 
               key="virtual-list"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="h-full w-full"
             >
               {displaySongs.length > 0 ? (
                 <List
                   height={height || 500}
                   itemCount={displaySongs.length}
                   itemSize={80}
                   width={width || 500}
                   className="hide-scrollbar"
                 >
                   {Row}
                 </List>
               ) : (
                 <p className="text-center mt-10 text-sm opacity-50">Nothing here yet.</p>
               )}
             </motion.div>
          ) : view === 'artists' ? (
            <motion.div 
              key="artists-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {artists.map((artist) => (
                <motion.div 
                  variants={itemVariants} 
                  key={artist} 
                  onClick={() => setSelectedArtist(artist)} 
                  className="flex flex-col items-center gap-4 cursor-pointer group glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-[#ff4e00]/30 transition-all shadow-xl"
                >
                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-black group-hover:text-[#ff4e00] transition-all overflow-hidden border border-white/10 shadow-inner relative">
                    <span className="relative z-10">{artist.charAt(0).toUpperCase()}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/10 to-transparent"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-slate-100 group-hover:text-[#ff4e00] transition-colors truncate w-full max-w-[120px]">{artist}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Artist</p>
                  </div>
                </motion.div>
              ))}
              {artists.length === 0 && !isLoading && <p className="text-center opacity-50 mt-10 col-span-full">No artists found.</p>}
            </motion.div>
          ) : view === 'playlists' ? (
            <motion.div 
              key="playlists-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setIsCreatingPlaylist(true)}
                className="w-full flex items-center gap-4 p-4 glass-card rounded-2xl border border-dashed border-white/20 hover:border-[#ff4e00]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#ff4e00]/10 transition-colors">
                  <span className="material-symbols-outlined text-[#ff4e00]">add</span>
                </div>
                <span className="font-bold text-slate-100">Create New Playlist</span>
              </button>

              <div className="space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-4 cursor-pointer group p-2 rounded-2xl hover:bg-white/5 transition-all" 
                  onClick={() => setView('all')}
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ff4e00] to-[#ff8c00] flex items-center justify-center shadow-lg group-hover:shadow-[#ff4e00]/20 transition-all">
                    <span className="material-symbols-outlined text-black text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 group-hover:text-[#ff4e00] transition-colors">Liked Songs</p>
                    <p className="text-sm text-slate-400 font-medium">Auto-generated • {songs.length} songs</p>
                  </div>
                </motion.div>

                {playlists.map((playlist) => (
                  <motion.div 
                    key={playlist.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-4 cursor-pointer group p-2 rounded-2xl hover:bg-white/5 transition-all relative"
                  >
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center shadow-lg overflow-hidden border border-white/5">
                      {playlist.thumbnail ? (
                        <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-600 text-3xl">queue_music</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-slate-100 group-hover:text-[#ff4e00] transition-colors">{playlist.name}</p>
                      <p className="text-sm text-slate-400 font-medium">Playlist • {playlist.songIds.length} songs</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Create Playlist Modal */}
              <AnimatePresence>
                {isCreatingPlaylist && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      onClick={() => setIsCreatingPlaylist(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="relative w-full max-w-md glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
                    >
                      <h3 className="text-2xl font-black text-slate-100 mb-6 uppercase tracking-tighter">New Playlist</h3>
                      <input 
                        type="text"
                        placeholder="Playlist Name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all mb-6"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsCreatingPlaylist(false)}
                          className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            if (newPlaylistName.trim()) {
                              addPlaylist(newPlaylistName.trim());
                              setNewPlaylistName('');
                              setIsCreatingPlaylist(false);
                            }
                          }}
                          className="flex-1 py-4 bg-[#ff4e00] text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
                        >
                          Create
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : view === 'albums' ? (
            <motion.div 
              key="albums-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            >
              {albumData.map(([name, data]) => (
                <motion.div 
                  variants={itemVariants} 
                  key={name}
                  onClick={() => window.location.href = `/library?view=all&filter=${encodeURIComponent(name)}`}
                  className="flex flex-col gap-3 cursor-pointer group"
                >
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-zinc-800">
                    <img src={data.song.thumbnail} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                       <p className="text-[10px] font-black text-[#ff4e00] uppercase tracking-widest mb-1">View Album</p>
                       <p className="text-white text-xs font-black truncate">{name}</p>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="font-extrabold text-sm text-slate-100 truncate group-hover:text-[#ff4e00] transition-colors">{name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{data.count} track{data.count > 1 ? 's' : ''}</p>
                  </div>
                </motion.div>
              ))}
              {albumData.length === 0 && !isLoading && (
                 <div className="col-span-full py-20 text-center opacity-40">
                   <span className="material-symbols-outlined text-6xl mb-4 block">album</span>
                   <p className="text-sm font-bold uppercase tracking-widest">No Albums In Collection</p>
                 </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key={`${selectedArtist}-songs`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {displaySongs.map((song) => (
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  key={song.id} 
                  onClick={() => handlePlay(song.id)}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:shadow-[#ff4e00]/10 transition-all">
                     <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="border-b border-white/10 pb-4 flex-grow min-w-0 flex justify-between items-center pr-4">
                     <div className="min-w-0 flex-grow">
                       <p className="font-bold text-base truncate text-slate-100 group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
                       <div className="flex items-center gap-1.5 mt-0.5">
                         <p className="text-xs text-slate-400 truncate max-w-[200px]">
                           {song.artist} • {song.album || 'Single'}
                         </p>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <span className="text-[10px] font-mono text-slate-500">{song.duration || '--:--'}</span>
                       <span className="material-symbols-outlined text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">more_vert</span>
                     </div>
                  </div>
                </motion.div>
              ))}
              {displaySongs.length === 0 && (
                 <p className="text-center mt-10 text-sm opacity-50">Nothing here yet.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSongMenu && (
          <SongMenu 
            song={selectedSongMenu} 
            onClose={() => setSelectedSongMenu(null)} 
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
