import { create } from 'zustand';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';
import { useSettingsStore } from './settingsStore';

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
      
      // 2. Fetch Playlists
      const playlistsRes = await fetchApi('getPlaylists').catch(() => null);
      let playlists = playlistsRes?.playlists?.playlist || [];
      if (playlists.length > 0) {
        await db.playlists.bulkPut(playlists);
      }
      
      set({ isSyncing: false, lastSync: Date.now() });
    } catch (error) {
      console.error('Library Sync failed:', error);
      set({ isSyncing: false });
    }
  },

  scanLastFmArt: async () => {
    const { lastFmApiKey } = useSettingsStore.getState();
    if (!lastFmApiKey) {
      console.warn('Cannot scan Last.fm without API key');
      return;
    }

    try {
      // Get all albums currently in our local DB
      const albums = await db.albums.toArray();
      
      for (const album of albums) {
        // Only fetch if we don't already have a high-res lastfm url
        if (album.lastFmArtUrl) continue;
        if (!album.artist || !album.name) continue;

        try {
          const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(album.artist)}&album=${encodeURIComponent(album.name)}&format=json`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.album && data.album.image) {
            // Find the Extra Large or Mega image
            const imageArray = data.album.image;
            const xlImage = imageArray.find(img => img.size === 'extralarge') || imageArray.find(img => img.size === 'mega');
            
            if (xlImage && xlImage['#text']) {
              // Update local DB album with the Last.fm art URL
              await db.albums.update(album.id, { lastFmArtUrl: xlImage['#text'] });
            }
          }
        } catch (e) {
          // Silently continue on individual album failures to not break the batch
          console.debug(`Last.fm scan failed for ${album.name}:`, e);
        }
      }
    } catch (error) {
      console.error('Last.fm Scan failed:', error);
    }
  }
}));
