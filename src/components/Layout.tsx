import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { MiniPlayer } from './MiniPlayer';
import { GlobalAudioPlayer } from './GlobalAudioPlayer';
import { GlobalSearch } from './GlobalSearch';
import { CreatorOverlay } from './CreatorOverlay';
import { NotificationsOverlay } from './NotificationsOverlay';
import { Toaster } from 'react-hot-toast';
import { useMusicStore } from '../store/useMusicStore';

export function Layout() {
  const { isSearchOpen } = useMusicStore();

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden flex flex-col bg-background text-on-background">
      <GlobalAudioPlayer />
      <GlobalSearch />
      <CreatorOverlay />
      <NotificationsOverlay />
      <Toaster position="top-center" toastOptions={{ className: 'font-sans', style: { background: '#ff4e00', color: '#000', borderRadius: '99px', fontWeight: 'bold' } }} />
      
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-[0]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff4e00] rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3a1510] rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      
      <div className="flex-1 flex flex-col w-full relative z-10">
        <Outlet />
      </div>
      
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
