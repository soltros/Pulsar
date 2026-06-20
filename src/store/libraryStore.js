import { create } from 'zustand';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';

export const useLibraryStore = create((set, get) => ({
  isSyncing: false,
  lastSync: 0,
  
  syncLibrary: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    
    try {
      // 1. Fetch Recently Added / Newest Albums (Limit 50 for quick initial load)
      const albumsRes = await fetchApi('getAlbumList2', { type: 'newest', size: 50 });
      let newestAlbums = albumsRes.albumList2?.album || [];
      
      // Also fetch Frequent/Recently Played if available
      const frequentRes = await fetchApi('getAlbumList2', { type: 'recent', size: 50 }).catch(() => null);
      let recentAlbums = frequentRes?.albumList2?.album || [];
      
      // Merge unique albums
      const albumMap = new Map();
      [...newestAlbums, ...recentAlbums].forEach(album => {
        albumMap.set(album.id, album);
      });
      
      const uniqueAlbums = Array.from(albumMap.values());
      
      // Store in IndexedDB
      if (uniqueAlbums.length > 0) {
        await db.albums.bulkPut(uniqueAlbums);
      }
      
      set({ isSyncing: false, lastSync: Date.now() });
    } catch (error) {
      console.error('Library Sync failed:', error);
      set({ isSyncing: false });
    }
  }
}));
