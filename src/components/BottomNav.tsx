import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore } from '../store/useMusicStore';

export function BottomNav() {
  const location = useLocation();
  const notifications = useMusicStore(state => state.notifications);
  const unreadCount = notifications.filter(n => n.unread).length;

  if (location.pathname === '/player' || location.pathname === '/lyrics') {
    return null;
  }

  const navItems = [
    { name: 'Home', icon: 'home', path: '/' },
    { name: 'Search', icon: 'search', path: '/search' },
    { name: 'Library', icon: 'library_music', path: '/library' },
    { name: 'Upload', icon: 'upload', path: '/admin' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-screen-2xl h-24 z-[60] flex justify-around items-center px-4 bg-black/80 border-t border-white/5 backdrop-blur-3xl font-sans text-xs font-medium pb-4">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.name}
            to={item.path}
            className={twMerge(
              'relative flex flex-col items-center gap-1 tap-highlight-transparent transition-colors',
              isActive ? 'text-[#ff4e00]' : 'text-slate-400 hover:text-white'
            )}
          >
            <motion.span 
              animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
              className="material-symbols-outlined" 
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </motion.span>
            {item.name === 'Library' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold animate-pulse shadow-lg shadow-red-500/30 border border-black">
                {unreadCount}
              </span>
            )}
            <span>{item.name}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-glow"
                className="absolute -top-1 w-1 h-1 bg-[#ff4e00] rounded-full shadow-[0_0_8px_#ff4e00]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
