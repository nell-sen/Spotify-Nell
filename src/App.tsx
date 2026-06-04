import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { Player } from './pages/Player';
import { Lyrics } from './pages/Lyrics';
import { Admin } from './pages/Admin';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useMusicStore } from './store/useMusicStore';

function AppContent() {
  useFirestoreSync();
  const location = useLocation();
  const theme = useMusicStore(state => state.theme);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="library" element={<Library />} />
          <Route path="admin" element={<Admin />} />
          <Route path="player" element={<Player />} />
          <Route path="lyrics" element={<Lyrics />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

