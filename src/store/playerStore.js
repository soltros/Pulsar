import { create } from 'zustand';

export const usePlayerStore = create((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  audioRef: null,
  isNowPlayingOpen: false,

  setAudioRef: (ref) => set({ audioRef: ref }),
  setIsNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),

  playTrack: (track, newQueue = null, index = 0) => {
    const queue = newQueue || [track];
    set({ queue, currentIndex: index, isPlaying: true, progress: 0 });
  },

  playNext: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true, progress: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  playPrev: () => {
    const { currentIndex, progress } = get();
    // If we are more than 3 seconds in, restart track. Otherwise go to prev.
    if (progress > 3) {
      set({ progress: 0 });
      const { audioRef } = get();
      if (audioRef?.current) audioRef.current.currentTime = 0;
    } else if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true, progress: 0 });
    }
  },

  togglePlay: () => {
    const { isPlaying, audioRef, queue, currentIndex } = get();
    if (queue.length === 0 || currentIndex === -1) return;
    
    if (isPlaying) {
      audioRef?.current?.pause();
      set({ isPlaying: false });
    } else {
      audioRef?.current?.play().catch(console.error);
      set({ isPlaying: true });
    }
  },

  setVolume: (volume) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.volume = volume;
    }
    set({ volume });
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  
  seek: (time) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
      set({ progress: time });
    }
  }
}));
