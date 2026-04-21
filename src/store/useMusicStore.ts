import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LyricLine {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  releaseYear?: string;
  genre?: string;
  audioUrl: string;
  thumbnail: string;
  createdAt: number;
  lyrics?: LyricLine[];
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: number;
  type: 'song' | 'forum' | 'system';
  unread: boolean;
}

export interface ForumMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  thumbnail?: string;
}

interface MusicStore {
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  volume: number;
  setVolume: (volume: number) => void;
  
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  filter: 'newest' | 'oldest' | 'artist';
  setFilter: (filter: 'newest' | 'oldest' | 'artist') => void;

  isShuffle: boolean;
  setIsShuffle: (isShuffle: boolean) => void;

  isRepeat: boolean;
  setIsRepeat: (isRepeat: boolean) => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;

  isCreatorOpen: boolean;
  setIsCreatorOpen: (isOpen: boolean) => void;

  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (isOpen: boolean) => void;

  // New State & Settings
  appLogo: string;
  setAppLogo: (url: string) => void;
  instagram: string;
  tiktok: string;
  theme: 'glass' | 'dark' | 'retro' | 'amoled';
  geminiApiKey: string;
  youtubeApiKey: string;
  setSettings: (settings: Partial<Pick<MusicStore, 'appLogo' | 'instagram' | 'tiktok' | 'theme' | 'geminiApiKey' | 'youtubeApiKey'>>) => void;
  
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'unread'>) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  forumMessages: ForumMessage[];
  setForumMessages: (msgs: ForumMessage[]) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  
  playlists: Playlist[];
  addPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  
  // Real-time playback stats (not persisted)
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      songs: [],
      setSongs: (songs) => set({ songs, isLoading: false }),
      
      isLoading: true,
      setIsLoading: (isLoading) => set({ isLoading }),
      
      currentSongIndex: -1,
      setCurrentSongIndex: (index) => set({ currentSongIndex: index }),
      
      isPlaying: false,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      volume: 1,
      setVolume: (volume) => set({ volume }),
      
      isAdmin: false,
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      filter: 'newest',
      setFilter: (filter) => set({ filter }),

      isShuffle: false,
      setIsShuffle: (isShuffle) => set({ isShuffle }),
      isRepeat: false,
      setIsRepeat: (isRepeat) => set({ isRepeat }),

      isSearchOpen: false,
      setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
      isCreatorOpen: false,
      setIsCreatorOpen: (isOpen) => set({ isCreatorOpen: isOpen }),

      isNotificationsOpen: false,
      setIsNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),

      // Settings Initial State
      appLogo: '',
      setAppLogo: (url) => set({ appLogo: url }),
      instagram: '',
      tiktok: '',
      theme: 'glass',
      geminiApiKey: '',
      youtubeApiKey: '',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
      
      notifications: [],
      addNotification: (notif) => set((state) => ({
        notifications: [
          { ...notif, id: Math.random().toString(36).substring(2, 11), unread: true },
          ...state.notifications
        ].slice(0, 50)
      })),
      markNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, unread: false }))
      })),
      clearNotifications: () => set({ notifications: [] }),
      forumMessages: [],
      setForumMessages: (msgs) => set({ forumMessages: msgs }),
      searchHistory: [],
      addSearchHistory: (query) => set((state) => ({
        searchHistory: [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10)
      })),
      clearSearchHistory: () => set({ searchHistory: [] }),
      
      playlists: [],
      addPlaylist: (name) => set((state) => ({
        playlists: [
          { id: Math.random().toString(36).substring(2, 11), name, songIds: [], createdAt: Date.now() },
          ...state.playlists
        ]
      })),
      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),
      addSongToPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, songIds: [...new Set([...p.songIds, songId])] } 
            : p
        )
      })),
      removeSongFromPlaylist: (playlistId, songId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId 
            ? { ...p, songIds: p.songIds.filter(id => id !== songId) } 
            : p
        )
      })),
      
      currentTime: 0,
      setCurrentTime: (time) => set({ currentTime: time }),
      duration: 0,
      setDuration: (duration) => set({ duration }),
    }),
    {
      name: 'music-storage-v5',
      partialize: (state) => ({ 
        volume: state.volume,
        currentSongIndex: state.currentSongIndex,
        isShuffle: state.isShuffle,
        isRepeat: state.isRepeat,
        appLogo: state.appLogo,
        songs: state.songs,
        notifications: state.notifications,
        instagram: state.instagram,
        tiktok: state.tiktok,
        theme: state.theme,
        geminiApiKey: state.geminiApiKey,
        youtubeApiKey: state.youtubeApiKey,
        searchHistory: state.searchHistory,
        playlists: state.playlists
      }),
    }
  )
);
