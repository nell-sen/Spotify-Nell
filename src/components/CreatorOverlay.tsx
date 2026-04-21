import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore } from '../store/useMusicStore';
import { clsx } from 'clsx';

export function CreatorOverlay() {
  const { isCreatorOpen, setIsCreatorOpen, instagram, tiktok, appLogo, theme } = useMusicStore();

  if (!isCreatorOpen) return null;

  const openLink = (link: string | undefined) => {
    if (!link) return;
    const url = link.startsWith('http') ? link : `https://${link.includes('tiktok') ? 'tiktok.com/@' : 'instagram.com/'}${link.replace('@', '')}`;
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCreatorOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-[#ff4e00] to-[#ff8c00] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,78,0,0.3)] overflow-hidden">
             {appLogo ? (
               <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <span className="text-4xl text-black font-black uppercase tracking-tighter">NS</span>
             )}
          </div>
          
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tighter">NellSpotify</h2>
          <p className="text-[#ff4e00] font-bold text-sm uppercase tracking-widest mb-6">Music Reimagined</p>
          
          <div className="space-y-4 text-slate-400 text-sm leading-relaxed mb-8">
            <p>Built with passion for high-performance audio experiences. NellSpotify represents the peak of modern web-based music streaming.</p>
            
            <div className="flex gap-3 justify-center py-4 flex-wrap">
              {instagram && (
                <button 
                  onClick={() => openLink(instagram)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-pink-500/30 rounded-xl text-pink-500 font-bold hover:scale-105 transition-all text-xs"
                >
                  <i className="fa-brands fa-instagram"></i>
                  <span>Instagram</span>
                </button>
              )}
              {tiktok && (
                <button 
                  onClick={() => openLink(tiktok)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:scale-105 transition-all text-xs"
                >
                  <i className="fa-brands fa-tiktok"></i>
                  <span>TikTok</span>
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-3xl">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 block text-left mb-1">Switch Theme</span>
                <div className="flex gap-2 justify-center">
                  {(['glass', 'dark', 'amoled', 'retro'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => useMusicStore.getState().setSettings({ theme: t })}
                      className={clsx(
                        "w-10 h-10 rounded-full border-2 transition-all active:scale-90",
                        theme === t ? "border-[#ff4e00] scale-110 shadow-lg shadow-[#ff4e00]/20" : "border-white/10 bg-white/5"
                      )}
                      title={t}
                    >
                      <div className={clsx(
                        "w-full h-full rounded-full",
                        t === 'glass' ? "bg-white/20 backdrop-blur-sm" :
                        t === 'dark' ? "bg-zinc-800" :
                        t === 'amoled' ? "bg-black" :
                        "bg-[#ff4e00]/20"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Creator</span>
                <span className="text-white font-bold">Ishnelsen</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Version</span>
                <span className="text-white font-bold">v3.0.0-PREMIUM</span>
              </div>
            </div>
            
            <a 
              href="https://wa.me/6285822990755?text=Lapor%20Bug%20NellSpotify" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold transition-all border border-red-500/20"
            >
              <span className="material-symbols-outlined text-[20px]">bug_report</span>
              Laporkan Bug via WA
            </a>
          </div>
          
          <button 
            onClick={() => setIsCreatorOpen(false)}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            Bersama NellSpotify
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
