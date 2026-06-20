import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      lastFmApiKey: '',
      lastFmApiSecret: '',
      
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
