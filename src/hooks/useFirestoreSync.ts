import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useMusicStore, Song, ForumMessage, AppNotification } from '../store/useMusicStore';
import toast from 'react-hot-toast';

export function useFirestoreSync() {
  const { setSongs, filter, setSettings, addNotification, setForumMessages } = useMusicStore();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // 1. Songs Listener
    let qSongs;
    if (filter === 'artist') {
      qSongs = query(collection(db, 'songs'), orderBy('artist', 'asc'), orderBy('createdAt', 'desc'));
    } else {
      qSongs = query(collection(db, 'songs'), orderBy('createdAt', filter === 'newest' ? 'desc' : 'asc'));
    }
    
    const unsubSongs = onSnapshot(qSongs, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setSongs(fetchedSongs);

      if (!isFirstLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            toast.success(`New song added: ${change.doc.data().title}`);
          }
          if (change.type === 'removed') {
            toast.error(`Song deleted: ${change.doc.data().title}`);
          }
        });
      }
      isFirstLoad.current = false;
    });

    // 2. App Config Listener
    const unsubConfig = onSnapshot(doc(db, 'appConfig', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          appLogo: data.appLogo || '',
          instagram: data.instagram || '',
          tiktok: data.tiktok || '',
          theme: data.theme || 'glass',
          geminiApiKey: data.geminiApiKey || '',
          youtubeApiKey: data.youtubeApiKey || ''
        });
      }
    });

    // 3. Notifications Listener
    const qNotifs = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(10));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as Omit<AppNotification, 'id' | 'unread'>;
          if (Date.now() - data.timestamp < 15000) {
            addNotification({
              message: data.message,
              timestamp: data.timestamp,
              type: data.type as any
            });
            toast(data.message, {
              icon: data.type === 'song' ? '🎵' : '💬',
              style: { borderRadius: '20px', background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            });
          }
        }
      });
    });

    // 4. Forum Messages Listener
    const qForum = query(collection(db, 'forum'), orderBy('timestamp', 'asc'));
    const unsubForum = onSnapshot(qForum, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumMessage[];
      setForumMessages(msgs);
    });

    return () => {
      unsubSongs();
      unsubConfig();
      unsubNotifs();
      unsubForum();
    };
  }, [filter, setSongs, setSettings, addNotification, setForumMessages]);
}

