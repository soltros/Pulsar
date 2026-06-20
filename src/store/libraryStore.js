import { create } from 'zustand';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';
import { useSettingsStore } from './settingsStore';

export const useLibraryStore = create((set, get) => ({
  isSyncing: false,
  lastSync: 0,
  homeLists: {
    favorites: [],
    topRated: [],
    recentlyAdded: [],
    recentlyPlayed: [],
    mostPlayed: [],
    random: [],
    artists: [],
    songs: [],
    radios: []
  },
  
  syncLibrary: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    
    try {
      const [
        starredRes, highestRes, newestRes, recentRes, frequentRes, randomRes,
        artistsRes, songsRes, radiosRes
      ] = await Promise.allSettled([
        fetchApi('getStarred2'),
        fetchApi('getAlbumList2', { type: 'highest', size: 15 }),
        fetchApi('getAlbumList2', { type: 'newest', size: 15 }),
        fetchApi('getAlbumList2', { type: 'recent', size: 15 }),
        fetchApi('getAlbumList2', { type: 'frequent', size: 15 }),
        fetchApi('getAlbumList2', { type: 'random', size: 15 }),
        fetchApi('getArtists'),
        fetchApi('getRandomSongs', { size: 15 }),
        fetchApi('getInternetRadioStations')
      ]);

      const favorites = starredRes.status === 'fulfilled' ? starredRes.value?.starred2?.album || [] : [];
      const topRated = highestRes.status === 'fulfilled' ? highestRes.value?.albumList2?.album || [] : [];
      const recentlyAdded = newestRes.status === 'fulfilled' ? newestRes.value?.albumList2?.album || [] : [];
      const recentlyPlayed = recentRes.status === 'fulfilled' ? recentRes.value?.albumList2?.album || [] : [];
      const mostPlayed = frequentRes.status === 'fulfilled' ? frequentRes.value?.albumList2?.album || [] : [];
      const random = randomRes.status === 'fulfilled' ? randomRes.value?.albumList2?.album || [] : [];
      
      let artists = [];
      let allArtists = [];
      if (artistsRes.status === 'fulfilled' && artistsRes.value?.artists?.index) {
        artistsRes.value.artists.index.forEach(idx => {
          if (idx.artist) allArtists.push(...idx.artist);
        });
        if (allArtists.length > 0) {
          await db.artists.bulkPut(allArtists);
        }
        // Shuffle and pick 15 for home
        artists = [...allArtists].sort(() => 0.5 - Math.random()).slice(0, 15);
      }

      const songs = songsRes.status === 'fulfilled' ? songsRes.value?.randomSongs?.song || [] : [];
      const radios = radiosRes.status === 'fulfilled' ? radiosRes.value?.internetRadioStations?.internetRadioStation || [] : [];
      
      // Merge unique albums for IndexedDB local caching
      const albumMap = new Map();
      [...favorites, ...topRated, ...recentlyAdded, ...recentlyPlayed, ...mostPlayed, ...random].forEach(album => {
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
      
      set({ 
        isSyncing: false, 
        lastSync: Date.now(),
        homeLists: { 
          favorites, topRated, recentlyAdded, recentlyPlayed, mostPlayed, random, artists, songs, radios 
        }
      });
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
