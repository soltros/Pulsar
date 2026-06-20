import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import md5 from 'md5';

const customStorage = {
  getItem: (name) => {
    return sessionStorage.getItem(name) || localStorage.getItem(name);
  },
  setItem: (name, value) => {
    const parsed = JSON.parse(value);
    if (parsed.state && parsed.state.rememberMe) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  }
};

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      serverUrl: '',
      username: '',
      salt: '',
      token: '',
      rememberMe: false,
      error: null,
      isLoading: false,
      
      login: async (serverUrl, username, password, rememberMe) => {
        set({ isLoading: true, error: null });
        try {
          // Strip trailing slash from server URL
          const cleanUrl = serverUrl.replace(/\/$/, '');
          
          // Generate token using OpenSubsonic standard (md5(password + salt))
          const salt = Math.random().toString(36).substring(2, 15);
          const token = md5(password + salt);
          
          // Ping the server to verify credentials
          const response = await fetch(`${cleanUrl}/rest/ping.view?u=${username}&t=${token}&s=${salt}&v=1.16.1&c=pulsar&f=json`);
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data['subsonic-response'] && data['subsonic-response'].status === 'ok') {
            set({ 
              isAuthenticated: true, 
              serverUrl: cleanUrl, 
              username, 
              salt,
              token,
              rememberMe,
              isLoading: false,
              error: null
            });
          } else {
            const serverError = data['subsonic-response']?.error?.message || 'Authentication failed';
            throw new Error(serverError);
          }
        } catch (error) {
          set({ 
            error: error.message || 'Failed to connect to server', 
            isLoading: false,
            isAuthenticated: false
          });
        }
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          serverUrl: '', 
          username: '', 
          salt: '',
          token: '',
          rememberMe: false,
          error: null
        });
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'pulsar-auth',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
