import { Link, useLocation } from 'react-router-dom';
import { useMusicStore } from '../store/useMusicStore';
import { motion, AnimatePresence } from 'framer-motion';

export function MiniPlayer() {
  const { songs, currentSongIndex, isPlaying, setIsPlaying } = useMusicStore();
  const location = useLocation();

  // Hide mini player if we are on the player route or if no song is selected
  if (location.pathname === '/player' || currentSongIndex < 0 || currentSongIndex >= songs.length) {
    return null;
  }

  const song = songs[currentSongIndex];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 150 }}
        className="fixed bottom-[110px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-screen-xl z-40"
      >
        <Link to="/player" className="block outline-none group">
          <div className="bg-background/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 p-3 flex items-center justify-between group-hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <motion.div 
                layoutId="mini-player-art"
                className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/10"
              >
                <img 
                  src={song.thumbnail} 
                  alt={song.title} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="truncate">
                <p className="text-sm font-bold truncate text-slate-100 group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
                <p className="text-xs text-slate-400 font-medium truncate opacity-60">{song.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-2 flex-shrink-0">
              <button 
                onClick={(e) => { e.preventDefault(); }}
                className="material-symbols-outlined text-slate-400 hover:text-white transition-colors"
              >
                cast
              </button>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsPlaying(!isPlaying); 
                }}
                className="material-symbols-outlined text-black bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-white/10 shadow-lg text-lg hover:scale-110 active:scale-95 transition-all" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
