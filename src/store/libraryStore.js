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
  contextMenu: { isOpen: false, x: 0, y: 0, target: null, type: null },
  openContextMenu: (e, target, type) => {
    e.preventDefault();
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
        
        const existingArtistsArray = await db.artists.toArray();
        const existingArtists = new Map(existingArtistsArray.map(a => [a.id, a]));
        allArtists.forEach(artist => {
          const existing = existingArtists.get(artist.id);
          if (existing?.lastFmArtUrl) {
            artist.lastFmArtUrl = existing.lastFmArtUrl;
          }
          if (existing?.bio) {
            artist.bio = existing.bio;
          }
        });

        if (allArtists.length > 0) {
          await db.artists.bulkPut(allArtists);
        }
        // Shuffle and pick 15 for home
        artists = [...allArtists].sort(() => 0.5 - Math.random()).slice(0, 15);
      }

      const songs = songsRes.status === 'fulfilled' ? songsRes.value?.randomSongs?.song || [] : [];
      const radios = radiosRes.status === 'fulfilled' ? radiosRes.value?.internetRadioStations?.internetRadioStation || [] : [];

      // Merge unique songs for IndexedDB
      const existingSongsArray = await db.songs.toArray();
      const existingSongs = new Map(existingSongsArray.map(s => [s.id, s]));
      const songMap = new Map();
      [...songs].forEach(song => {
        const existing = existingSongs.get(song.id);
        if (existing?.lastFmArtUrl) song.lastFmArtUrl = existing.lastFmArtUrl;
        if (existing?.description) song.description = existing.description;
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
        const existing = existingAlbums.get(album.id);
        if (existing?.lastFmArtUrl) {
          album.lastFmArtUrl = existing.lastFmArtUrl;
        }
        if (existing?.description) {
          album.description = existing.description;
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

  toggleStar: async (id, isStarred, type = 'song') => {
    try {
      if (isStarred) {
        await fetchApi('unstar', { [type + 'Id']: id });
      } else {
        await fetchApi('star', { [type + 'Id']: id });
      }
      
      // Update IndexedDB optimistic
      if (type === 'song') {
        const item = await db.songs.get(id);
        if (item) await db.songs.update(id, { starred: !isStarred ? new Date().toISOString() : undefined });
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
          const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(album.artist)}&album=${encodeURIComponent(album.name)}&autocorrect=1&format=json`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.album) {
            const updatePayload = {};
            
            if (data.album.image) {
              const imageArray = data.album.image;
              const xlImage = imageArray.find(img => img.size === 'extralarge') || imageArray.find(img => img.size === 'mega');
              if (xlImage && xlImage['#text']) {
                updatePayload.lastFmArtUrl = xlImage['#text'];
              }
            }
            
            if (data.album.wiki && data.album.wiki.summary) {
              updatePayload.description = data.album.wiki.summary;
            }
            
            if (Object.keys(updatePayload).length > 0) {
              await db.albums.update(album.id, updatePayload);
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
  },

  scanLastFmArtists: async () => {
    const { lastFmApiKey } = useSettingsStore.getState();
    if (!lastFmApiKey) {
      console.warn('Cannot scan Last.fm without API key');
      return;
    }

    try {
      const artists = await db.artists.toArray();
      for (const artist of artists) {
        const isGreyStar = artist.lastFmArtUrl && artist.lastFmArtUrl.includes('2a96cbd8b46e442fc41c2b86b821562f');
        
        // Skip if they already have valid data
        if (artist.lastFmArtUrl && !isGreyStar && artist.bio) continue;
        if (!artist.name) continue;

        try {
          const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(artist.name)}&autocorrect=1&format=json`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.artist) {
            const updatePayload = {};
            
            // Extract Image, rejecting the default Last.fm grey star
            if (data.artist.image) {
              const imageArray = data.artist.image;
              const xlImage = imageArray.find(img => img.size === 'extralarge') || imageArray.find(img => img.size === 'mega');
              if (xlImage && xlImage['#text'] && !xlImage['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                updatePayload.lastFmArtUrl = xlImage['#text'];
              }
            }
            
            // Extract Biography
            if (data.artist.bio && data.artist.bio.summary) {
              updatePayload.bio = data.artist.bio.summary;
            }

            // Fallback to Subsonic backend for Artist Image if Last.fm failed to provide one
            if (!updatePayload.lastFmArtUrl && (!artist.lastFmArtUrl || isGreyStar)) {
              try {
                const subInfo = await fetchApi('getArtistInfo2', { id: artist.id }).catch(() => null);
                if (subInfo?.artistInfo2?.largeImageUrl || subInfo?.artistInfo2?.mediumImageUrl) {
                  updatePayload.lastFmArtUrl = subInfo.artistInfo2.largeImageUrl || subInfo.artistInfo2.mediumImageUrl;
                }
              } catch(e) {}
            }

            // Clear the existing grey star if we couldn't find a replacement
            if (isGreyStar && !updatePayload.lastFmArtUrl) {
              updatePayload.lastFmArtUrl = '';
            }
            
            if (Object.keys(updatePayload).length > 0) {
              await db.artists.update(artist.id, updatePayload);
            }
          }
        } catch (e) {
          console.debug(`Last.fm scan failed for artist ${artist.name}:`, e);
        }
      }
    } catch (error) {
      console.error('Last.fm artist scan failed:', error);
    }
  },

  scanLastFmTracks: async () => {
    const { lastFmApiKey } = useSettingsStore.getState();
    if (!lastFmApiKey) return;

    try {
      const songs = await db.songs.toArray();
      for (const track of songs) {
        if (track.description) continue; // Already scanned
        if (!track.title || !track.artist) continue;

        try {
          const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(track.artist)}&track=${encodeURIComponent(track.title)}&autocorrect=1&format=json`);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.track) {
            const updatePayload = {};
            
            // Extract Track Wiki/Description
            if (data.track.wiki && data.track.wiki.summary) {
              updatePayload.description = data.track.wiki.summary;
            }

            // Extract Art if available (usually not for tracks anymore, but just in case)
            if (data.track.album && data.track.album.image) {
              const imageArray = data.track.album.image;
              const xlImage = imageArray.find(img => img.size === 'extralarge') || imageArray.find(img => img.size === 'mega');
              if (xlImage && xlImage['#text']) {
                updatePayload.lastFmArtUrl = xlImage['#text'];
              }
            }

            if (Object.keys(updatePayload).length > 0) {
              await db.songs.update(track.id, updatePayload);
            }
          }
        } catch (e) {
          console.debug(`Last.fm scan failed for track ${track.title}:`, e);
        }
      }
    } catch (error) {
      console.error('Last.fm track scan failed:', error);
    }
  }
}));
