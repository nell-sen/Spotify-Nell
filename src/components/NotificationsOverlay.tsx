import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore } from '../store/useMusicStore';
import { clsx } from 'clsx';

export function NotificationsOverlay() {
  const { isNotificationsOpen, setIsNotificationsOpen, notifications, markNotificationsAsRead, clearNotifications } = useMusicStore();

  if (!isNotificationsOpen) return null;

  const formatRelTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            markNotificationsAsRead();
            setIsNotificationsOpen(false);
          }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          className="relative w-full max-w-md bg-zinc-900 border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[70vh] md:h-auto md:max-h-[80vh]"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Notifications</h2>
              <button 
                onClick={() => clearNotifications()}
                className="text-[10px] text-[#ff4e00] font-black uppercase tracking-widest text-left mt-1 hover:underline"
              >
                Clear All
              </button>
            </div>
            <button 
              onClick={() => {
                markNotificationsAsRead();
                setIsNotificationsOpen(false);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <span className="material-symbols-outlined text-6xl mb-4">notifications_off</span>
                <p className="text-sm font-bold uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.slice().sort((a, b) => b.timestamp - a.timestamp).map((notif, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={notif.id || idx}
                  className={clsx(
                    "p-4 rounded-2xl border transition-all",
                    notif.unread ? "bg-[#ff4e00]/10 border-[#ff4e00]/20" : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      notif.type === 'forum' ? "bg-blue-500/20 text-blue-400" : "bg-[#ff4e00]/20 text-[#ff4e00]"
                    )}>
                      <span className="material-symbols-outlined">
                        {notif.type === 'forum' ? 'forum' : 'library_music'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-100 font-bold leading-tight mb-1">{notif.message}</p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{formatRelTime(notif.timestamp)}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <button 
            onClick={() => {
              markNotificationsAsRead();
              setIsNotificationsOpen(false);
            }}
            className="m-6 bg-white text-black font-black py-4 rounded-2xl hover:brightness-110 transition-all uppercase tracking-widest text-xs"
          >
            Clear and Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
