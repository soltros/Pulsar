import { create } from 'zustand';
import { db } from '../lib/db';
import { fetchApi } from '../lib/api';
import { usePlayerStore } from './playerStore';
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
  contextMenu: { isOpen: false, x: 0, y: 0, target: null, type: null },
  openContextMenu: (e, target, type) => {
    e.preventDefault();
    e.stopPropagation();
    set({ contextMenu: { isOpen: true, x: e.clientX, y: e.clientY, target, type } });
  },
  closeContextMenu: () => set(state => ({ contextMenu: { ...state.contextMenu, isOpen: false } })),
  
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

      const getArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);
      
      const favorites = starredRes.status === 'fulfilled' ? getArray(starredRes.value?.starred2?.album) : [];
      const topRated = highestRes.status === 'fulfilled' ? getArray(highestRes.value?.albumList2?.album) : [];
      const recentlyAdded = newestRes.status === 'fulfilled' ? getArray(newestRes.value?.albumList2?.album) : [];
      const recentlyPlayed = recentRes.status === 'fulfilled' ? getArray(recentRes.value?.albumList2?.album) : [];
      const mostPlayed = frequentRes.status === 'fulfilled' ? getArray(frequentRes.value?.albumList2?.album) : [];
      const random = randomRes.status === 'fulfilled' ? getArray(randomRes.value?.albumList2?.album) : [];
      
      const metadataRes = await fetch('/api/metadata/all').then(r => r.json()).catch(() => ({ artists: [], albums: [], tracks: [] }));
      const backendArtists = new Map(metadataRes.artists?.map(a => [a.id, a]) || []);
      const backendAlbums = new Map(metadataRes.albums?.map(a => [a.id, a]) || []);
      const backendTracks = new Map(metadataRes.tracks?.map(t => [t.id, t]) || []);

      let artists = [];
      let allArtists = [];
      if (artistsRes.status === 'fulfilled' && artistsRes.value?.artists?.index) {
        getArray(artistsRes.value.artists.index).forEach(idx => {
          if (idx.artist) allArtists.push(...getArray(idx.artist));
        });
        
        const existingArtistsArray = await db.artists.toArray();
        const existingArtists = new Map(existingArtistsArray.map(a => [a.id, a]));
        allArtists.forEach(artist => {
          const backend = backendArtists.get(artist.id);
          const existing = existingArtists.get(artist.id);
          
          if (backend?.lastFmArtUrl || existing?.lastFmArtUrl) {
            artist.lastFmArtUrl = backend?.lastFmArtUrl || existing?.lastFmArtUrl;
          }
          if (backend?.bio || existing?.bio) {
            artist.bio = backend?.bio || existing?.bio;
          }
        });

        if (allArtists.length > 0) {
          await db.artists.bulkPut(allArtists);
        }
        // Shuffle and pick 15 for home
        artists = [...allArtists].sort(() => 0.5 - Math.random()).slice(0, 15);
      }

      const songs = songsRes.status === 'fulfilled' ? getArray(songsRes.value?.randomSongs?.song) : [];
      const radios = radiosRes.status === 'fulfilled' ? getArray(radiosRes.value?.internetRadioStations?.internetRadioStation) : [];

      // Merge unique songs for IndexedDB
      const existingSongsArray = await db.songs.toArray();
      const existingSongs = new Map(existingSongsArray.map(s => [s.id, s]));
      const songMap = new Map();
      [...songs].forEach(song => {
        const backend = backendTracks?.get(song.id);
        const existing = existingSongs.get(song.id);
        
        if (backend?.lastFmArtUrl || existing?.lastFmArtUrl) song.lastFmArtUrl = backend?.lastFmArtUrl || existing?.lastFmArtUrl;
        if (backend?.description || existing?.description) song.description = backend?.description || existing?.description;
        
        songMap.set(song.id, song);
      });
      const uniqueSongs = Array.from(songMap.values());
      if (uniqueSongs.length > 0) {
        await db.songs.bulkPut(uniqueSongs);
      }
      
      // Merge unique albums for IndexedDB local caching
      const existingAlbumsArray = await db.albums.toArray();
      const existingAlbums = new Map(existingAlbumsArray.map(a => [a.id, a]));

      const albumMap = new Map();
      [...favorites, ...topRated, ...recentlyAdded, ...recentlyPlayed, ...mostPlayed, ...random].forEach(album => {
        const backend = backendAlbums?.get(album.id);
        const existing = existingAlbums.get(album.id);
        
        if (backend?.lastFmArtUrl || existing?.lastFmArtUrl) {
          album.lastFmArtUrl = backend?.lastFmArtUrl || existing?.lastFmArtUrl;
        }
        if (backend?.description || existing?.description) {
          album.description = backend?.description || existing?.description;
        }
        albumMap.set(album.id, album);
      });
      
      const uniqueAlbums = Array.from(albumMap.values());
      
      // Store in IndexedDB
      if (uniqueAlbums.length > 0) {
        await db.albums.bulkPut(uniqueAlbums);
      }
      
      // 2. Fetch Playlists
      const playlistsRes = await fetchApi('getPlaylists').catch(() => null);
      let playlists = getArray(playlistsRes?.playlists?.playlist);
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

  toggleStar: async (id, isStarred, type = 'song') => {
    try {
      const paramName = type === 'song' ? 'id' : type + 'Id';
      if (isStarred) {
        await fetchApi('unstar', { [paramName]: id });
      } else {
        await fetchApi('star', { [paramName]: id });
      }
      
      // Update IndexedDB optimistic
      if (type === 'song') {
        const item = await db.songs.get(id);
        if (item) await db.songs.update(id, { starred: !isStarred ? new Date().toISOString() : undefined });
        usePlayerStore.getState().updateTrackInQueue(id, { starred: !isStarred ? new Date().toISOString() : undefined });
      } else if (type === 'album') {
        const item = await db.albums.get(id);
        if (item) await db.albums.update(id, { starred: !isStarred ? new Date().toISOString() : undefined });
      } else if (type === 'artist') {
        const item = await db.artists.get(id);
        if (item) await db.artists.update(id, { starred: !isStarred ? new Date().toISOString() : undefined });
      }

      // Re-fetch starred specifically to update lists
      const starredRes = await fetchApi('getStarred2').catch(() => null);
      if (starredRes) {
        set(state => ({
          homeLists: { 
            ...state.homeLists, 
            favorites: starredRes.starred2?.album || [] 
          }
        }));
      }
    } catch (e) {
      console.error('Toggle star failed', e);
    }
  },


  scanLastFmArtists: async () => {
    try {
      const artists = await db.artists.toArray();
      for (const artist of artists) {
        // Skip if they already have valid data
        if (artist.lastFmArtUrl && artist.bio) continue;
        if (!artist.name) continue;

        try {
          const res = await fetch(`/api/metadata/artist?id=${artist.id}&name=${encodeURIComponent(artist.name)}`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const updatePayload = {};
            
            if (data.lastFmArtUrl) updatePayload.lastFmArtUrl = data.lastFmArtUrl;
            if (data.bio) updatePayload.bio = data.bio;

            // Fallback to Subsonic backend for Artist Image if backend didn't provide one
            if (!updatePayload.lastFmArtUrl && !artist.lastFmArtUrl) {
              try {
                const subInfo = await fetchApi('getArtistInfo2', { id: artist.id }).catch(() => null);
                if (subInfo?.artistInfo2?.largeImageUrl || subInfo?.artistInfo2?.mediumImageUrl) {
                  updatePayload.lastFmArtUrl = subInfo.artistInfo2.largeImageUrl || subInfo.artistInfo2.mediumImageUrl;
                }
              } catch(e) { /* ignore */ }
            }
            
            if (Object.keys(updatePayload).length > 0) {
              await db.artists.update(artist.id, updatePayload);
            }
          }
        } catch (e) {
          console.debug(`Metadata scan failed for artist ${artist.name}:`, e);
        }
      }
    } catch (error) {
      console.error('Artist scan failed:', error);
    }
  },

  scanLastFmTracks: async () => {
    try {
      const songs = await db.songs.toArray();
      for (const track of songs) {
        if (track.description) continue; // Already scanned
        if (!track.title || !track.artist) continue;

        try {
          const res = await fetch(`/api/metadata/track?id=${track.id}&title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            const updatePayload = {};
            
            if (data.description) updatePayload.description = data.description;
            if (data.lastFmArtUrl) updatePayload.lastFmArtUrl = data.lastFmArtUrl;

            if (Object.keys(updatePayload).length > 0) {
              await db.songs.update(track.id, updatePayload);
            }
          }
        } catch (e) {
          console.debug(`Metadata scan failed for track ${track.title}:`, e);
        }
      }
    } catch (error) {
      console.error('Track scan failed:', error);
    }
  }
}));
