import React, { useState, useEffect } from 'react';
import { useMusicStore, LyricLine } from '../store/useMusicStore';
import { collection, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { syncLyricsWithAI } from '../services/geminiSync';
import { fetchYouTubePlaylist } from '../services/youtubeService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';

export function Admin() {
  const { isAdmin, setIsAdmin, songs, currentSongIndex, appLogo, instagram, tiktok, theme, geminiApiKey, youtubeApiKey, setSettings, addNotification } = useMusicStore();
  const [activeTab, setActiveTab] = useState<'songs' | 'settings' | 'forum'>('songs');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [genre, setGenre] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [lyricsJSON, setLyricsJSON] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rawTextLyrics, setRawTextLyrics] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  // Settings
  const [tempLogo, setTempLogo] = useState(appLogo);
  const [tempIG, setTempIG] = useState(instagram);
  const [tempTT, setTempTT] = useState(tiktok);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempGeminiKey, setTempGeminiKey] = useState(geminiApiKey);
  const [tempYoutubeKey, setTempYoutubeKey] = useState(youtubeApiKey);
  const [ytPlaylistUrl, setYtPlaylistUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Forum in Admin
  const [forumUser, setForumUser] = useState('Admin');
  const [forumText, setForumText] = useState('');
  const [isSmartken, setIsSmartken] = useState(false);

  useEffect(() => {
    setTempLogo(appLogo);
    setTempIG(instagram);
    setTempTT(tiktok);
    setTempTheme(theme);
    setTempGeminiKey(geminiApiKey);
    setTempYoutubeKey(youtubeApiKey);
  }, [appLogo, instagram, tiktok, theme, geminiApiKey, youtubeApiKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Ishnelsen060906') {
      setIsAdmin(true);
      toast.success('Logged in as Admin');
    } else {
      toast.error('Incorrect password');
    }
  };

  const extractYoutubeThumbnail = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
    }
    return url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailUrl(reader.result as string);
        toast.success(`Image compressed: ${(compressedFile.size / 1024).toFixed(1)} KB`);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengompres gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !audioUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsUploading(true);
      const randId = Math.floor(Math.random() * 1000000);
      const finalThumbnail = thumbnailUrl ? extractYoutubeThumbnail(thumbnailUrl) : `https://picsum.photos/seed/${randId}/300/300`;
      
      let parsedLyrics: LyricLine[] | undefined;
      if (lyricsJSON.trim()) {
        try {
          parsedLyrics = JSON.parse(lyricsJSON);
        } catch (err) {
          toast.error('Lyrics JSON format invalid');
          return;
        }
      }

      const newSong = {
        title,
        artist,
        album: album || 'Single',
        duration: duration || 'Unknown',
        releaseYear: releaseYear || new Date().getFullYear().toString(),
        genre: genre || 'Pop',
        audioUrl,
        thumbnail: finalThumbnail,
        lyrics: parsedLyrics,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'songs'), newSong);
      
      await addDoc(collection(db, 'notifications'), {
        message: `Lagu baru: ${title} oleh ${artist} telah ditambahkan!`,
        timestamp: Date.now(),
        type: 'song'
      });

      toast.success('Song uploaded successfully');
      setTitle('');
      setArtist('');
      setAlbum('');
      setDuration('');
      setReleaseYear('');
      setGenre('');
      setAudioUrl('');
      setThumbnailUrl('');
      setLyricsJSON('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload song');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settings = { 
        appLogo: tempLogo, 
        instagram: tempIG, 
        tiktok: tempTT, 
        theme: tempTheme as any,
        geminiApiKey: tempGeminiKey,
        youtubeApiKey: tempYoutubeKey
      };
      setSettings(settings);
      await setDoc(doc(db, 'appConfig', 'main'), settings, { merge: true });
      toast.success('Settings updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update settings');
    }
  };

  const handleAISync = async () => {
    if (!title || !artist || !rawTextLyrics) {
      toast.error('Judul, Artis, dan Raw Lirik diperlukan untuk AI Sync');
      return;
    }

    try {
      setIsAiLoading(true);
      const synced = await syncLyricsWithAI(geminiApiKey || tempGeminiKey, title, artist, rawTextLyrics);
      setLyricsJSON(JSON.stringify(synced, null, 2));
      toast.success('Lirik berhasil disinkronkan oleh Gemini AI!');
      setShowAiInput(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleYouTubeImport = async () => {
    if (!ytPlaylistUrl) {
      toast.error('Masukkan URL Playlist YouTube');
      return;
    }

    try {
      setIsImporting(true);
      const items = await fetchYouTubePlaylist(youtubeApiKey || tempYoutubeKey, ytPlaylistUrl);
      
      let importedCount = 0;
      for (const item of items) {
        const newSong = {
          title: item.title,
          artist: item.artist,
          album: 'YouTube Import',
          duration: 'Unknown',
          releaseYear: new Date().getFullYear().toString(),
          genre: 'Various',
          audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`, // Note: This is a YT link, the player might need to handle this
          thumbnail: item.thumbnail,
          createdAt: Date.now()
        };
        await addDoc(collection(db, 'songs'), newSong);
        importedCount++;
      }

      toast.success(`${importedCount} lagu berhasil diimpor!`);
      setYtPlaylistUrl('');
      
      await addDoc(collection(db, 'notifications'), {
        message: `${importedCount} lagu baru telah diimpor dari YouTube!`,
        timestamp: Date.now(),
        type: 'song'
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSendForum = async () => {
    if (!forumText.trim()) return;
    try {
      await addDoc(collection(db, 'forum'), {
        user: forumUser,
        text: forumText,
        timestamp: Date.now(),
        isSmartken: isSmartken
      });
      await addDoc(collection(db, 'notifications'), {
        message: isSmartken ? `[URGENT] ${forumText}` : `Pesan baru dari ${forumUser} di Forum!`,
        timestamp: Date.now(),
        type: isSmartken ? 'urgent' : 'forum',
        sender: forumUser
      });
      setForumText('');
      setIsSmartken(false);
      toast.success('Pesan terkirim');
    } catch (e) {
      toast.error('Gagal mengirim pesan');
    }
  };

  const handleDelete = async (id: string, index: number) => {
    if (!window.confirm('Delete this song?')) return;
    
    try {
      const songToDelete = songs.find(s => s.id === id);
      await deleteDoc(doc(db, 'songs', id));
      
      await addDoc(collection(db, 'notifications'), {
        message: `Lagu ${songToDelete?.title} telah dihapus dari library.`,
        timestamp: Date.now(),
        type: 'song'
      });

      toast.success('Song deleted');
      if (index === currentSongIndex) {
        const audio = window.globalAudioRef;
        if (audio) audio.pause();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  if (!isAdmin) {
    return (
      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-screen-2xl mx-auto pt-24 px-6 relative z-10 flex flex-col items-center justify-center min-h-[70vh] font-sans"
      >
        <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-100 uppercase tracking-tighter">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff4e00] text-black font-bold py-2 rounded-lg text-sm hover:brightness-110 shadow-[0_0_15px_rgba(255,78,0,0.2)] transition-all active:scale-95"
            >
              Login
            </button>
          </form>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-screen-2xl mx-auto pt-20 px-6 pb-40 relative z-10 space-y-8 min-h-[100dvh] font-sans"
    >
      <header className="fixed top-0 left-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-screen-2xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Admin Control</h1>
            <nav className="hidden md:flex gap-4">
              <button onClick={() => setActiveTab('songs')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'songs' ? 'text-[#ff4e00]' : 'text-slate-500 hover:text-white'}`}>Songs</button>
              <button onClick={() => setActiveTab('settings')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'text-[#ff4e00]' : 'text-slate-500 hover:text-white'}`}>Settings</button>
              <button onClick={() => setActiveTab('forum')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'forum' ? 'text-[#ff4e00]' : 'text-slate-500 hover:text-white'}`}>Forum</button>
            </nav>
          </div>
          <button 
            onClick={() => setIsAdmin(false)}
            className="text-xs font-bold text-[#ff4e00] px-4 py-1.5 rounded-full bg-[#ff4e00]/10 hover:bg-[#ff4e00]/20 transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
        <div className="md:hidden flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <button onClick={() => setActiveTab('songs')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'songs' ? 'text-[#ff4e00]' : 'text-slate-500'}`}>Songs</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'settings' ? 'text-[#ff4e00]' : 'text-slate-500'}`}>Settings</button>
          <button onClick={() => setActiveTab('forum')} className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'forum' ? 'text-[#ff4e00]' : 'text-slate-500'}`}>Forum</button>
        </div>
      </header>
      
      <AnimatePresence mode="wait">
        {activeTab === 'songs' && (
          <motion.div 
            key="songs-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mt-12 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#ff4e00]">YouTube Playlist Import</h3>
                <span className="material-symbols-outlined text-[#ff4e00] animate-pulse">download</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ytPlaylistUrl}
                  onChange={(e) => setYtPlaylistUrl(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white"
                  placeholder="Paste YouTube Playlist URL/ID..."
                />
                <button
                  onClick={handleYouTubeImport}
                  disabled={isImporting || (!youtubeApiKey && !tempYoutubeKey)}
                  className="bg-[#ff4e00] text-black font-black px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
              {(!youtubeApiKey && !tempYoutubeKey) && (
                <p className="text-[9px] text-red-400 font-bold mt-2 px-1">Harap seting YouTube API Key di tab Settings untuk fitur ini!</p>
              )}
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-1">Quick Upload</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Song Title"
                    required
                  />
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Artist Name"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Album Name (Optional)"
                  />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Duration (e.g. 3:45)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Release Year (e.g. 2024)"
                  />
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                    placeholder="Genre (e.g. Pop)"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest pl-1 font-bold">Lagu & Konten</label>
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                      placeholder="MP3 Audio URL"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest pl-1 font-bold">Thumbnail (Manual URL or Upload)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100"
                        placeholder="Image URL or YouTube Link"
                      />
                      <label className="w-12 h-11 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-slate-300">image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest pl-1 font-bold">Lyrics (JSON format)</label>
                      <button 
                        type="button"
                        onClick={() => setShowAiInput(!showAiInput)}
                        className="text-[10px] font-black text-[#ff4e00] uppercase tracking-tighter hover:underline"
                      >
                        {showAiInput ? 'Tutup AI Sync' : 'Pakai Gemini AI Sync'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showAiInput && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-2 mb-2"
                        >
                          <textarea 
                            value={rawTextLyrics}
                            onChange={(e) => setRawTextLyrics(e.target.value)}
                            className="w-full bg-[#ff4e00]/5 border border-[#ff4e00]/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100 min-h-[120px]"
                            placeholder="Tempel lirik mentah di sini... (Gemini akan menebak waktu)"
                          />
                          <button
                            type="button"
                            onClick={handleAISync}
                            disabled={isAiLoading || !geminiApiKey && !tempGeminiKey}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isAiLoading ? (
                              <span className="animate-spin material-symbols-outlined text-[14px]">refresh</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            )}
                            {isAiLoading ? 'Menganalisis...' : 'Mulai AI Synchronization'}
                          </button>
                          {(!geminiApiKey && !tempGeminiKey) && (
                            <p className="text-[9px] text-red-400 font-bold">Harap seting Gemini API Key di tab Settings terlebih dahulu!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea 
                      value={lyricsJSON}
                      onChange={(e) => setLyricsJSON(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition-all placeholder-slate-500 text-slate-100 min-h-[100px] font-mono"
                      placeholder='[{"time": 2, "text": "Hello world"}]'
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUploading || isCompressing}
                  className="w-full bg-[#ff4e00] text-black font-bold py-3 rounded-lg text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(255,78,0,0.3)] uppercase tracking-widest"
                >
                  {isUploading ? 'Menyimpan...' : 'Simpan Lagu'}
                </button>
              </form>
            </section>

            <section className="max-w-4xl mx-auto">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-tighter text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff4e00]">library_music</span>
                Manage Songs ({songs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {songs.map((song, i) => (
                    <motion.div 
                      layout
                      key={song.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass-card rounded-xl p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                          <img src={song.thumbnail} alt={song.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-[#ff4e00] transition-colors">{song.title}</p>
                          <p className="text-xs text-on-surface-variant truncate opacity-60">{song.artist}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(song.id, i)}
                        className="material-symbols-outlined text-red-500 hover:bg-red-500/10 p-2 rounded-full cursor-pointer transition-all active:scale-90"
                      >
                        delete
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            key="settings-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto space-y-8 mt-12"
          >
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
               <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">App Configurations</h2>
               <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">App Logo URL</label>
                   <input 
                     type="url" 
                     value={tempLogo}
                     onChange={(e) => setTempLogo(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white"
                     placeholder="https://example.com/logo.png"
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Instagram Link</label>
                     <input 
                       type="text" 
                       value={tempIG}
                       onChange={(e) => setTempIG(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white"
                       placeholder="@username or URL"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">TikTok Link</label>
                     <input 
                       type="text" 
                       value={tempTT}
                       onChange={(e) => setTempTT(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white"
                       placeholder="@username or URL"
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Global Theme</label>
                   <select 
                     value={tempTheme}
                     onChange={(e) => setTempTheme(e.target.value as any)}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white appearance-none"
                   >
                     <option value="glass">Glassmorphism</option>
                     <option value="dark">Classic Dark</option>
                     <option value="retro">Retro Orange</option>
                     <option value="amoled">Pure Black (AMOLED)</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Gemini AI API Key</label>
                   <div className="relative group">
                      <input 
                        type="password" 
                        value={tempGeminiKey}
                        onChange={(e) => setTempGeminiKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white pr-12"
                        placeholder="AIza..."
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600 group-hover:text-[#ff4e00] transition-colors pointer-events-none">key</span>
                   </div>
                   <p className="text-[9px] text-slate-500 px-2 font-medium">Digunakan untuk sinkronisasi lirik AI otomatis.</p>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">YouTube Data API Key</label>
                   <div className="relative group">
                      <input 
                        type="password" 
                        value={tempYoutubeKey}
                        onChange={(e) => setTempYoutubeKey(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white pr-12"
                        placeholder="AIza..."
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600 group-hover:text-[#ff4e00] transition-colors pointer-events-none">api</span>
                   </div>
                   <p className="text-[9px] text-slate-500 px-2 font-medium">Digunakan untuk impor playlist massal dari YouTube.</p>
                 </div>
                 
                 <button 
                   onClick={handleSaveSettings}
                   className="w-full bg-[#ff4e00] text-black font-black py-4 rounded-2xl hover:brightness-110 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,78,0,0.2)]"
                 >
                   SAVE CHANGES
                 </button>
               </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'forum' && (
          <motion.div 
            key="forum-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto space-y-8 mt-12"
          >
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
               <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Broadcast Forum</h2>
               <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-bold">Send real-time alerts to users</p>
               
               <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Sender Name</label>
                   <input 
                     type="text" 
                     value={forumUser}
                     onChange={(e) => setForumUser(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Message Body</label>
                   <textarea 
                     value={forumText}
                     onChange={(e) => setForumText(e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#ff4e00] transition-all text-white min-h-[120px] resize-none"
                     placeholder="Message to sync to notifications..."
                   />
                 </div>

                 <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 mb-2">
                    <label className="relative inline-flex items-center cursor-pointer scale-90">
                      <input type="checkbox" className="sr-only peer" checked={isSmartken} onChange={(e) => setIsSmartken(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4e00]"></div>
                    </label>
                    <div className="flex flex-col text-left">
                       <span className="text-xs font-black text-white uppercase tracking-wider">Smartken Notif</span>
                       <span className="text-[10px] text-slate-500 font-medium italic">Kirim langsung ke notifikasi sistem</span>
                    </div>
                  </div>

                 <button 
                   onClick={handleSendForum}
                   className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   <span className="material-symbols-outlined">send_and_archive</span>
                   SEND BROADCAST
                 </button>
               </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
