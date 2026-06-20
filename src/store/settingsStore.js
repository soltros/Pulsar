import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      lastFmApiKey: '',
      lastFmApiSecret: '',
      pinnedPlaylists: [],
      
      togglePinPlaylist: (playlist) => set((state) => {
        const isPinned = state.pinnedPlaylists.find(p => p.id === playlist.id);
        if (isPinned) {
          return { pinnedPlaylists: state.pinnedPlaylists.filter(p => p.id !== playlist.id) };
        } else {
          return { pinnedPlaylists: [...state.pinnedPlaylists, { id: playlist.id, name: playlist.name }] };
        }
      }),
      
      setLastFmCredentials: (key, secret) => set({ 
        lastFmApiKey: key, 
        lastFmApiSecret: secret 
      }),
      
      clearLastFmCredentials: () => set({ 
        lastFmApiKey: '', 
        lastFmApiSecret: '' 
      }),
    }),
    {
      name: 'pulsar-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
